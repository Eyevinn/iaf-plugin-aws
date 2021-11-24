import { Uploader } from "./types/interfaces";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, S3, waitUntilObjectExists, S3ClientConfig } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import winston from "winston";


/**
 * S3 Uploader class
 * Holds the S3 client that data will be piped through for upload to ingest bucket
 */
export class S3Uploader implements Uploader {
    destination: string;
    outputDestination: string;
    outputFiles: any;
    region: string;
    logger: winston.Logger;

    constructor(destination: string, outputDestination: string, awsRegion: string, outputFiles: {}, logger: winston.Logger) {
        this.destination = destination;
        this.outputDestination = outputDestination;
        this.outputFiles = outputFiles;
        this.region = awsRegion;
        this.logger = logger;
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
                this.logger.log({
                    level: 'info',
                    message: `Upload progress for ${fileName}: ${(progress.loaded / progress.total) * 100} %`
                })
            })

            const data = await parallelUploadsToS3.done();
            return data;
        }
        catch (err) {
            this.logger.log({
                level: 'error',
                message: `Failed to upload ${fileName}`
            });
            throw err;
        }
    }

    /**
     * Watches for an object to be uploaded to S3
     * @param fileName the name of the file to wait for
     * @returns An object with the S3 paths to the files if they have been uploaded successfully else null
     */
    async watcher(fileName: string) {
        if (!this.outputFiles) {
            this.logger.log({
                level: 'info',
                message: `No 'outputFiles' specified abort watcher`
            })
            return null;
        }
        const config: S3ClientConfig = { region: this.region };
        const client = new S3(config) || new S3Client(config);
        const timeout = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 240;
        let outputsDest = {};
        for (const file in this.outputFiles) {
            const key = this.outputFiles[file];
            const dest = `${this.outputDestination}/${fileName}/${key}`;
            try {
                this.logger.log({
                    level: 'info',
                    message: `Watching for: ${dest}`
                });
                await waitUntilObjectExists({ client, maxWaitTime: timeout }, { Bucket: this.outputDestination, Key: `${fileName}/${key}` });
                outputsDest[file] = `arn:aws:s3:::${dest}`;
            } catch (err) {
                this.logger.log({
                    level: 'error',
                    message: `Watcher could not find: ${dest}`
                });
                outputsDest[file] = null;
            }
        }
        return outputsDest;
    }
}
