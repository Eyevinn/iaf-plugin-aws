import { Readable } from "stream";
import winston from "winston";

export interface IafUploadModule {
    logger: winston.Logger;
    playlistName: string;
    outputBucket: string;
    awsRegion: string;
    onFileAdd(filePath: string, readStream: Readable, fileWatcher: boolean): Promise<any>
}

export interface Uploader{
    destination: string;
    logger: winston.Logger
    upload(fileStream: Readable, fileName: String)
    watcher(target: string, bucket: string, awsRegion: string): any
}

export interface TranscodeDispatcher {
    encodeParams: any,
    inputLocation: string
    outputDestination: string,
    logger: winston.Logger;
    playlistName: string;
    dispatch(fileName: string): Promise<any>
}

export interface FileWatcher {
    dirName: String;
    logger: winston.Logger;
    onAdd(callback: (filePath: string, readStream: Readable) => any)
}