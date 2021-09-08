import { Watcher } from "./types/interfaces";
import { S3Client, S3, waitUntilObjectExists } from "@aws-sdk/client-s3";
import winston from "winston";


export class S3Watcher implements Watcher {
  destination: any;
  logger: winston.Logger;

  constructor(destination: string, logger: winston.Logger) {
    this.destination = destination;
    this.logger = logger;
  }

  async watcher(target: string) {
    const s3Settings = {
      Bucket: this.destination,
      client: new S3({}) || new S3Client({}),
      maxWaitTime: 60000,
    }
    const headParams = {
      Bucket: this.destination,
      Key: target,
    };

    try {
      return waitUntilObjectExists(s3Settings, headParams);
    }
    catch (err) {
      this.logger.log({
          level: 'error',
          message: `Watcher failed for target: ${target}`
      });
      throw err;
    }
  }
}
