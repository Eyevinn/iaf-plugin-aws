import { mockClient } from 'aws-sdk-client-mock';
import { CreateJobCommand, MediaConvertClient } from '@aws-sdk/client-mediaconvert';
import { MediaConvertDispatcher } from './mediaConvertDispatcher';
import winston from 'winston';
import * as fs from 'fs';
const mockLogInstance = {
    debug: jest.fn(),
    log: jest.fn()
}

jest.mock('fs')

const mockParams = {
    "Settings": {
        "Inputs": [
            {

            }
        ],
        "OutputGroups": [
            {
                "Name": "testName",
                "Outputs": [
                    {
                        "OutputSettings": {
                            "HlsSettings": {}
                        },
                    }
                ],
                "OutputGroupSettings": {
                    "Type": "HLS_GROUP_SETTINGS",
                    "HlsGroupSettings": {
                        "SegmentLength": 10,
                        "Destination": "PLACEHOLDER",
                        "MinSegmentLength": 0
                    }
                },
                "AutomatedEncodingSettings": {
                    "AbrSettings": {
                        "MaxAbrBitrate": 5000000
                    }
                }
            }
        ],
        "TimecodeConfig": {
            "Source": "ZEROBASED"
        }
    },
    "Role": "placeholder"
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

jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockParams))
const mcMock = mockClient(MediaConvertClient);
const dispatcher = new MediaConvertDispatcher("testString1", "testRegion1", "inputBucket", "outputBucket", "fakeARN", "playlistName", null, winston.createLogger());



beforeEach(() => {
    const logger = winston.createLogger();
    mcMock.reset();
})

test("Should return transcoding job data on successful dispatch", async () => {
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
    //TODO: finish this test

    mcMock.on(CreateJobCommand).resolves(mockResp);
    const response = await dispatcher.dispatch("filename");
    expect(response).toStrictEqual(mockResp);
});

test("Should return transcoding job data on successful dispatch with custom encodeParams", async () => {
    let encodeParams = JSON.stringify(mockParams);
    const customDispatcher = new MediaConvertDispatcher("testString1", "testRegion1", "inputBucket", "outputBucket", "fakeARN", "playlistName", encodeParams, winston.createLogger());
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
    //TODO: finish this test

    mcMock.on(CreateJobCommand).resolves(mockResp);
    const response = await customDispatcher.dispatch("filename");
    expect(response).toStrictEqual(mockResp);
});

test("Should throw an error when failing to dispatch the job", async () => {
    const mockErr = "Failed to create transcoding job!"
    mcMock.on(CreateJobCommand).rejects(mockErr);
    await expect(dispatcher.dispatch("filename"))
        .rejects
        .toThrow(mockErr);
})