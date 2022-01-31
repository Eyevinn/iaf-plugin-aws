
import { S3Uploader } from "./s3Uploader";
import { Readable } from "stream";
import AbstractLogger from "./utils/logger";

const logger = new AbstractLogger();
const uploader = new S3Uploader("bucket1", "outputBucket1", "testRegion1", {}, logger);

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

test("Should resolve on a successful upload with a specific watcher timer", async () => {
    const uploaderWithTimer = new S3Uploader("bucket1", "outputBucket1", "testRegion1", {}, logger, 300);
    const mockResp = {
        '$metadata': {
            attempts: 1
        }
    }
    mockUploadInstance.done.mockResolvedValueOnce(mockResp);
    const data = await uploaderWithTimer.upload(mockFile().createReadStream, "filename")
    expect(data).toStrictEqual(mockResp)
})

test("Should throw errors when upload fails", async () => {
    const mockErr = "Failed to upload file!"
    mockUploadInstance.done.mockRejectedValueOnce(new Error(mockErr))
    await expect(uploader.upload(mockFile().createReadStream, "filename"))
    .rejects
    .toThrow(mockErr)
})
