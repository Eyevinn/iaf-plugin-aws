
import { S3Uploader } from "./s3Uploader";
import { Readable } from "stream";

const mockLogInstance = {
    debug: jest.fn(),
    log: jest.fn()
}

jest.mock('winston', () => ({
    format: {
        colorize: jest.fn(),
        combine: jest.fn(),
        label: jest.fn(),
        timestamp: jest.fn(),
        printf: jest.fn()
      },
      createLogger: jest.fn().mockImplementation(() => mockLogInstance),
      transports: {
        Console: jest.fn()
      }
}))

import winston from 'winston'

const uploader = new S3Uploader("bucket1", "outputBucket1", {}, winston.createLogger());

const mockUploadInstance = {
    done: jest.fn(),
    promise: jest.fn(),
    on: jest.fn()
}

jest.mock('@aws-sdk/lib-storage', () => {
    return {
        Upload: jest.fn(() => mockUploadInstance)
    }
});
const mockReadStream = jest.fn().mockImplementation(() => {
    const readable = new Readable();
    readable.push("hello world!");
    readable.push(null);
    return readable;
})

const mockFile = jest.fn().mockImplementation(() => {
    return { createReadStream: mockReadStream }
})


test("Should resolve on a successful upload", async () => {
    const mockResp = {
        '$metadata': {
            attempts: 1
        }
    }
    mockUploadInstance.done.mockResolvedValueOnce(mockResp);
    const data = await uploader.upload(mockFile().createReadStream, "filename")
    expect(data).toStrictEqual(mockResp)
})

test("Should throw errors when upload fails", async () => {
    const mockErr = "Failed to upload file!"
    mockUploadInstance.done.mockRejectedValueOnce(new Error(mockErr))
    await expect(uploader.upload(mockFile().createReadStream, "filename"))
    .rejects
    .toThrow(mockErr)
})