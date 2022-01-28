import { Uploader } from "./types/interfaces";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, S3, waitUntilObjectExists, S3ClientConfig } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { Logger } from "eyevinn-iaf";


/**
 * S3 Uploader class
 * Holds the S3 client that data will be piped through for upload to ingest bucket
 */
export class S3Uploader implements Uploader {
    destination: string;
    outputDestination: string;
    outputFiles: any;
    region: string;
    timeout: number;
    logger: Logger;

    constructor(destination: string, outputDestination: string, awsRegion: string, outputFiles: {}, logger: Logger, watcherTimeout?: number) {
        this.destination = destination;
        this.outputDestination = outputDestination;
        this.outputFiles = outputFiles;
        this.region = awsRegion;
        this.logger = logger;
        if(!watcherTimeout) {
            this.timeout = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 300;
        } else {
            this.timeout = watcherTimeout;
        }
    }

    /**
     * Uploads a file to the destination bucket
     * @param fileStream a Readable stream of the file to upload
     * @param fileName the name of the uploaded file (this will be the S3 key)
     * @returns status report from the AWS upload
     */
    async upload(fileStream: Readable, fileName: string) {
        const config: S3ClientConfig = { region: this.region };
        const target = {
            Bucket: this.destination,
            Key: fileName,
            Body: fileStream
        }

        try {
            const parallelUploadsToS3 = new Upload({
                client: new S3(config) || new S3Client(config),
                params: target
            })

            parallelUploadsToS3.on("httpUploadProgress", (progress) => {
                this.logger.info(`Upload progress for ${fileName}: ${(progress.loaded / progress.total) * 100} %`);
            })

            const data = await parallelUploadsToS3.done();
            return data;
        }
        catch (err) {
            this.logger.error(`Failed to upload ${fileName}`);
            throw err;
        }
    }

    /**
     * Watches for an object to be uploaded to S3
     * @param fileName the name of the file to wait for
     * @returns An object with the S3 paths to the files if they have been uploaded successfully.
     * Else an object with the error message if the file has not been uploaded within the timeout period.
     */
    async watcher(fileName: string): Promise<{} | {outputs: {}, error: {}}> {
        if (!this.outputFiles) {
            this.logger.info(`No 'outputFiles' specified abort watcher`);
            return null;
        }
        const config: S3ClientConfig = { region: this.region };
        const client = new S3(config) || new S3Client(config);
        let outputsDest = {};
        let outputError = {};
        for (const file in this.outputFiles) {
            const key = this.outputFiles[file];
            const dest = `${this.outputDestination}/${fileName}/${key}`;
            try {
                this.logger.info(`Watching for: ${dest}`);
                await waitUntilObjectExists({ client, maxWaitTime: this.timeout}, { Bucket: this.outputDestination, Key: `${fileName}/${key}` });
                outputsDest[file] = `arn:aws:s3:::${dest}`;
            } catch (err) {
                this.logger.error(`Watcher could not find: ${dest}`);
                outputsDest[file] = null;
                outputError[file] = err;
            }
        }
        if (Object.keys(outputError).length > 0) {
            return {
                outputs: outputsDest,
                outputError: outputError
            }
        } else {
            return outputsDest;
        }
    }
}
