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
    logger: winston.Logger;

    constructor(destination: string, logger: winston.Logger) {
        this.destination = destination;
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
     * @param target The object to watch
     * @returns The S3 URLs for the targets master manifests if they have been uploaded successfully
     */
    async watcher(target: string, bucket: string, awsRegion: string) {
        const client = new S3({}) || new S3Client({});
        const targets = [`${target}/manifest.m3u8`, `${target}/manifest.mpd`];
        let uploadedAssets = [];
        let streamURLs = [];
        // Check for HLS and DASH manifest files
        for (let i = 0; i < targets.length; i++) {
            try {
                this.logger.log({
                    level: 'info',
                    message: `Watching for: ${targets[i]}`
                });
                await waitUntilObjectExists({ client, maxWaitTime: 60 }, { Bucket: bucket, Key: targets[i] });
                uploadedAssets.push(targets[i]);
            } catch (err) {
                this.logger.log({
                    level: 'error',
                    message: `Watcher could not find: [${bucket}][${targets[i]}]`
                });
            }
        }
        // Build streaming url from uploaded manifest
        uploadedAssets.forEach(e => {
            streamURLs.push(`https://${bucket}.s3.${awsRegion}.amazonaws.com/${e}`);
        });
        this.logger.log({
            level: 'info',
            message: `Streaming URLs: ${streamURLs}`
        });
        return streamURLs;
    }
}
