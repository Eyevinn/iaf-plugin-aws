import { Readable } from "stream";
import winston from "winston";

export interface Uploader {
    destination: string;
    outputDestination: string;
    outputFiles: {};
    region: string;
    timeout: number;
    logger: winston.Logger;
    upload(fileStream: Readable, fileName: string)
    watcher(fileName: string): {};
}

export interface TranscodeDispatcher {
    encodeParams: any;
    inputLocation: string;
    outputDestination: string;
    logger: winston.Logger;
    playlistName: string;
    dispatch(fileName: string): Promise<any>;
    getJob(jobId: string): Promise<any>;
}
