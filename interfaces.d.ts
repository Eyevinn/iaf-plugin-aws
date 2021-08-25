import { Readable } from "stream";
import winston from "winston";

interface IafUploadModule {
    logger: winston.Logger;
    onFileAdd(filePath: string, readStream: Readable): any; 
}

interface Uploader{
    destination: string;
    logger: winston.Logger
    upload(fileStream: Readable, fileName: String)
}

interface TranscodeDispatcher {
    encodeParams: any,
    inputLocation: string
    outputDestination: string,
    logger: winston.Logger;
    dispatch(fileName: string): Promise<any>
}

interface FileWatcher {
    dirName: String;
    logger: winston.Logger;
    onAdd(callback: (filePath: string, readStream: Readable) => any)
}