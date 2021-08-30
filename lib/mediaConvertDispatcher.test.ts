import { mockClient } from 'aws-sdk-client-mock';
import { CreateJobCommand, MediaConvertClient } from '@aws-sdk/client-mediaconvert';
import { MediaConvertDispatcher } from './mediaConvertDispatcher';
import winston from 'winston';
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


const mcMock = mockClient(MediaConvertClient);
const dispatcher = new MediaConvertDispatcher("testString1", "testRegion1", "inputBucket", "outputBucket","fakeARN", winston.createLogger());



beforeEach(() => {
    const logger = winston.createLogger();
    
    mcMock.reset();
})

test("Should return transcoding job data on succesful dispatch", async () => {
    const mockResp = {
        "$metadata": {
            httpStatusCode: 201
        },
        Job: {
            Id: "1",
            Role: "test",
            Settings: {}
        }
    }

    mcMock.on(CreateJobCommand).resolves(mockResp);
    const response = await dispatcher.dispatch("filename");
    expect(response).toStrictEqual(mockResp);
});

test("Should throw an error when failing to dispatch the job", async () => {
    const mockErr = "Failed to create trancoding job!"
    mcMock.on(CreateJobCommand).rejects(mockErr);
    await expect(dispatcher.dispatch("filename"))
        .rejects
        .toThrow(mockErr);
})