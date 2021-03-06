import * as path from 'path'
import { MediaConvertDispatcher } from "./mediaConvertDispatcher";
import { S3Uploader } from "./s3Uploader";
import { Readable } from "stream";
import { nanoid } from "nanoid";
import { IafUploadModule } from "eyevinn-iaf";
import { Logger } from "eyevinn-iaf";

export class AwsUploadModule implements IafUploadModule {
    logger: Logger;
    playlistName: string;
    fileName: string;
    uploader: S3Uploader;
    dispatcher: MediaConvertDispatcher;
    fileUploadedDelegate: (result: any, error?: any) => any;
    progressDelegate: (result: any) => any;


    constructor(mediaConvertEndpoint: string, awsRegion: string, ingestBucket: string, outputBucket: string, roleArn: string, playlistName: string, encodeParams: string, outputFiles: {}, logger: Logger, watcherTimeout?: number) {
        this.logger = logger;
        this.playlistName = playlistName;
        this.uploader = new S3Uploader(ingestBucket, outputBucket, awsRegion, outputFiles, this.logger, watcherTimeout);
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
        let file = path.basename(filePath);
        this.fileName = `${path.parse(file).name}-${nanoid(10)}${path.parse(file).ext}`;
        try {
            this.uploader.upload(readStream, this.fileName).then(() => {
                this.dispatcher.dispatch(this.fileName).then((data) => {
                    this.uploader.watcher(this.fileName).then((result) => {
                        this.dispatcher.getJob(data.Job.Id).then((job) => {
                            if (job.Status === "SUBMITTED" || job.Status === "PROGRESSING") {
                                this.logger.warn("MediaConvert job did not complete before the watcher timed out, continue to watch for transcoded files!");
                                this.uploader.watcher(this.fileName).then((result) => {
                                    if ('outputError' in result) {
                                        this.fileUploadedDelegate(result['outputs'], result['outputError']);
                                    } else {
                                        this.fileUploadedDelegate(result);
                                    }
                                });
                            } else if (job.Status === "ERROR") {
                                this.logger.error('MediaConvert job failed, retrying job!');
                                this.dispatcher.dispatch(this.fileName).then(() => {
                                    this.uploader.watcher(this.fileName).then((output) => {
                                        if ('outputError' in result) {
                                            this.fileUploadedDelegate(result['outputs'], result['outputError']);
                                        } else {
                                            this.fileUploadedDelegate(result);
                                        }
                                    });
                                });
                            } else {
                                if ('outputError' in result) {
                                    this.fileUploadedDelegate(result['outputs'], result['outputError']);
                                } else {
                                    this.fileUploadedDelegate(result);
                                }
                            }
                        });
                    });
                });
            });
        }
        catch (err) {
            this.logger.error(`Error when attempting to process file: ${this.fileName}. Full error: ${err}`);
        }
    }
}
