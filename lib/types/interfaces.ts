import { Readable } from "stream";
import AbstractLogger from "../utils/logger";

export interface Uploader {
    destination: string;
    outputDestination: string;
    outputFiles: {};
    region: string;
    timeout: number;
    logger: AbstractLogger;
    upload(fileStream: Readable, fileName: string)
    watcher(fileName: string): {};
}

export interface TranscodeDispatcher {
    encodeParams: any;
    inputLocation: string;
    outputDestination: string;
    logger: AbstractLogger;
    playlistName: string;
    dispatch(fileName: string): Promise<any>;
    getJob(jobId: string): Promise<any>;
}
