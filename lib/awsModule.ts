import winston from "winston";
import * as path from 'path'
import { IafUploadModule } from './types/interfaces'
import { MediaConvertDispatcher } from "./mediaConvertDispatcher";
import { S3Uploader } from "./s3Uploader";
import { Readable } from "stream";

export class AwsUploadModule implements IafUploadModule {
    logger: winston.Logger;
    playlistName: string;
    fileName: string;
    uploader: S3Uploader;
    dispatcher: MediaConvertDispatcher;
    fileUploadedDelegate: Function;


    constructor(mediaConvertEndpoint: string, awsRegion: string, ingestBucket: string, outputBucket: string, roleArn: string, playlistName: string, encodeParams: string, outputFiles: {}, logger: winston.Logger) {
        this.logger = logger;
        this.playlistName = playlistName;
        this.uploader = new S3Uploader(ingestBucket, outputBucket, outputFiles, this.logger);
        this.dispatcher = new MediaConvertDispatcher(mediaConvertEndpoint, awsRegion, ingestBucket, outputBucket, roleArn, this.playlistName, encodeParams, this.logger);
    }

    /**
     * Method that runs when a FileWatcher detects a new file.
     * Uploads the file to an S3 ingress bucket, and dispatches a transcoding job when
     * the upload is completed.
     * @param filePath the path to the file being added.
     * @param readStream Readable stream of the file.
     */
    onFileAdd = (filePath: string, readStream: Readable) => {
        this.fileName = path.basename(filePath);
        try {
            this.uploader.upload(readStream, this.fileName).then(() => {
                this.dispatcher.dispatch(this.fileName).then((data) => {
                    this.uploader.watcher(this.fileName).then((result) => {
                        this.dispatcher.getJob(data.Job.Id).then((job) => {
                            if (job.Status === "SUBMITTED" || job.Status === "PROGRESSING") {
                                this.logger.log({
                                    level: "warn",
                                    message: "MediaConvert job did not complete before the watcher timed out, continue to watch for transcoded files!",
                                });
                                this.uploader.watcher(this.fileName).then((result) => {
                                    this.fileUploadedDelegate(result);
                                });
                            } else if (job.Status === "ERROR") {
                                this.logger.log({
                                    level: "error",
                                    message: `MediaConvert job failed, retrying job!`,
                                });
                                this.dispatcher.dispatch(this.fileName).then(() => {
                                    this.uploader.watcher(this.fileName).then((output) => {
                                        this.fileUploadedDelegate(output);
                                    });
                                });
                            } else {
                                this.fileUploadedDelegate(result);
                            }
                        });
                    });
                });
            });
        }
        catch (err) {
            this.logger.log({
                level: "error",
                message: `Error when attempting to process file: ${this.fileName}. Full error: ${err}`,
            });
        }
    }
}