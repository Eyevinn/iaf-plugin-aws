import { Uploader } from "./types/interfaces";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, S3, waitUntilObjectExists } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import winston from "winston";


/**
 * S3 Uploader class
 * Holds the S3 client that data will be piped through for upload to ingest bucket 
 */
export class S3Uploader implements Uploader {
    destination: string;
    outputDestination: string;
    logger: winston.Logger;

    constructor(destination: string, outputDestination: string, logger: winston.Logger) {
        this.destination = destination;
        this.outputDestination = outputDestination;
        this.logger = logger;
    }

    /**
     * Uploads a file to the destination bucket
     * @param fileStream a Readable stream of the file to upload
     * @param fileName the name of the uploaded file (this will be the S3 key)
     * @returns status report from the AWS upload
     */
    async upload(fileStream: Readable, fileName: string) {
        const target = {
            Bucket: this.destination,
            Key: fileName,
            Body: fileStream
        }

        try {
            const parallelUploadsToS3 = new Upload({
                client: new S3({}) || new S3Client({}),
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
     * @returns An object with with a bool that is set to true if the manifests have been uploaded successfully
     */
    async watcher(target: string) {
        const client = new S3({}) || new S3Client({});
        const timeout = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 240;
        const targets = {
            hls: `${target}/manifest.m3u8`,
            dash: `${target}/manifest.mpd`
        };
        // Check for HLS and DASH manifest files
        for (const key in targets) {
            try {
                this.logger.log({
                    level: 'info',
                    message: `Watching for: ${this.outputDestination}/${targets[key]}`
                });
                await waitUntilObjectExists({ client, maxWaitTime: timeout }, { Bucket: this.outputDestination, Key: targets[key] }
                );
            } catch (err) {
                this.logger.log({
                    level: 'error',
                    message: `Watcher could not find: ${this.outputDestination}/${targets[key]}`
                });
                targets[key] = false;
            }
        }
        return targets;
    }
}
