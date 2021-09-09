import winston from "winston";
import * as path from 'path'
import { IafUploadModule } from './types/interfaces'
import { MediaConvertDispatcher } from "./mediaConvertDispatcher";
import { S3Uploader } from "./s3Uploader";
import { Readable } from "stream";

export class AwsUploadModule implements IafUploadModule {
    logger: winston.Logger;
    playlistName: string;
    outputBucket: string;
    awsRegion: string;
    uploader: S3Uploader;
    dispatcher: MediaConvertDispatcher;


    constructor(mediaConvertEndpoint: string, awsRegion: string, ingestBucket: string, outputBucket: string, roleArn: string, playlistName: string, encodeParams: string, logger: winston.Logger) {
        this.logger = logger;
        this.outputBucket = outputBucket;
        this.playlistName = playlistName;
        this.awsRegion = awsRegion;
        this.uploader = new S3Uploader(ingestBucket, this.logger);
        this.dispatcher = new MediaConvertDispatcher(mediaConvertEndpoint, awsRegion, ingestBucket, outputBucket, roleArn, this.playlistName, encodeParams, this.logger);
    }

    /**
     * Method that runs when a FileWatcher detects a new file.
     * Uploads the file to an S3 ingress bucket, and dispatches a transcoding job when 
     * the upload is completed.
     * @param filePath the path to the file being added.
     * @param readStream ad Readable stream of the file
     * @returns object containing transcoded object
     */
    onFileAdd = (filePath: string, readStream: Readable): any => {
        const fileName = path.basename(filePath);
        try {
            this.uploader.upload(readStream, fileName).then(() => {
                this.dispatcher.dispatch(fileName).then(() => {
                    return new Promise<{}>((resolve, reject) => {
                        resolve(this.uploader.watcher(fileName, this.outputBucket, this.awsRegion));
                    });
                });
            });
        }
        catch (err) {
            this.logger.log({
                level: "Error",
                message: `Error when attempting to process file: ${fileName}. Full error: ${err}`,
            })
        }
    }
}