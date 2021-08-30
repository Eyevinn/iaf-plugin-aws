import winston from "winston";
import * as path from 'path'
import { IafUploadModule } from './types/interfaces'
import { MediaConvertDispatcher } from "./mediaConvertDispatcher";
import { S3Uploader } from "./s3Uploader";
import { Readable } from "stream";

export class AwsUploadModule implements IafUploadModule {
    logger: winston.Logger;
    uploader: S3Uploader;
    dispatcher: MediaConvertDispatcher;


    constructor(mediaConvertEndpoint: string, awsRegion: string, ingestBucket: string, outputBucket: string, roleArn: string, logger: winston.Logger) {
        this.logger = logger;
        this.uploader = new S3Uploader(ingestBucket, this.logger);
        this.dispatcher = new MediaConvertDispatcher(mediaConvertEndpoint, awsRegion, ingestBucket, outputBucket, roleArn, this.logger);
    }

    /**
     * Method that runs when a FileWatcher detects a new file.
     * Uploads the file to an S3 ingress bucket, and dispatches a transcoding job when 
     * the upload is completed.
     * @param filePath the path to the file being added.
     * @param readStream ad Readable stream of the file
     */
    onFileAdd = (filePath: string, readStream: Readable) => {
        
        const fileName = path.basename(filePath);
        try {
            this.uploader.upload(readStream, fileName).then(() => {
                this.dispatcher.dispatch(fileName)
            })
        }
        catch (err) {
            this.logger.log({
                level: "Error",
                message: `Error when attempting to process file: ${fileName}. Full error: ${err}`,
            })
        }
    }

}