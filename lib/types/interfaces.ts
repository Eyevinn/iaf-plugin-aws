import { Readable } from "stream";
import winston from "winston";

export interface IafUploadModule {
    logger: winston.Logger;
    playlistName: string;
    onFileAdd(filePath: string, readStream: Readable): any;
    fileUploadedDelegate: Function;
}

export interface Uploader {
    destination: string;
    outputDestination: string;
    outputFiles: {};
    region: string;
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

export interface FileWatcher {
    dirName: String;
    logger: winston.Logger;
    onAdd(callback: (filePath: string, readStream: Readable) => any);
}