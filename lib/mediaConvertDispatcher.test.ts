import { mockClient } from 'aws-sdk-client-mock';
import { CreateJobCommand, GetJobCommand, MediaConvertClient } from '@aws-sdk/client-mediaconvert';
import { MediaConvertDispatcher } from './mediaConvertDispatcher';
import * as fs from 'fs';
import AbstractLogger from './utils/logger';

jest.mock('fs')

const logger = new AbstractLogger();
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

const getJob = {
  $metadata: {
    httpStatusCode: 200,
    requestId: 'c6ff334a-990f-47ea-80da-1bd825fa04ce',
    cfId: 'e12345bA==',
    attempts: 1,
    totalRetryDelay: 0,
  },
  Job: {
    AccelerationSettings: { Mode: 'DISABLED' },
    AccelerationStatus: 'NOT_APPLICABLE',
    Arn: 'arn:aws:mediaconvert:eu-north-1:1234:jobs/123456-61zf86',
    Id: '123456-61zf86',
    Messages: { Info: [], Warning: [] },
    Priority: 0,
    Queue: 'arn:aws:mediaconvert:eu-north-1:123456789:queues/Default',
    Role: 'arn:aws:iam::1234:role/MediaConvert_Default_Role',
    Settings: {
      Inputs: [
        {
          AudioSelectors: {
            'Audio Selector 1': { DefaultSelection: 'DEFAULT' },
          },
          FileInput: 's3://inputBucket/test-file.mp4',
          TimecodeSource: 'ZEROBASED',
          VideoSelector: { ColorSpace: 'FOLLOW' },
        },
      ],
      OutputGroups: [
        {
          Name: 'HLS',
          OutputGroupSettings: {
            HlsGroupSettings: {
              Destination: 's3://outputBucket/test-file.mp4/manifest',
              MinSegmentLength: 0,
              SegmentLength: 6,
            },
            Type: 'HLS_GROUP_SETTINGS',
          },
          Outputs: [
            {
              ContainerSettings: { Container: 'M3U8', M3u8Settings: {} },
              NameModifier: '1080p8300',
              OutputSettings: { HlsSettings: {} },
              VideoDescription: {
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    Bitrate: 8300000,
                    CodecProfile: 'HIGH',
                    RateControlMode: 'CBR',
                  },
                },
                Height: 1080,
                Width: 1920,
              },
            },
            {
              AudioDescriptions: [
                {
                  AudioSourceName: 'Audio Selector 1',
                  CodecSettings: {
                    AacSettings: {
                      Bitrate: 192000,
                      CodecProfile: 'LC',
                      CodingMode: 'CODING_MODE_2_0',
                      SampleRate: 44100,
                    },
                    Codec: 'AAC',
                  },
                  LanguageCode: 'ENG',
                  LanguageCodeControl: 'USE_CONFIGURED',
                  StreamName: 'Stereo',
                },
              ],
              ContainerSettings: { Container: 'M3U8', M3u8Settings: {} },
              NameModifier: '_stereo',
              OutputSettings: {
                HlsSettings: {
                  AudioGroupId: 'default-audio-group',
                  AudioTrackType: 'ALTERNATE_AUDIO_AUTO_SELECT',
                },
              },
            },
            {
              AudioDescriptions: [
                {
                  AudioSourceName: 'Audio Selector 1',
                  CodecSettings: {
                    Codec: 'EAC3',
                    Eac3Settings: {
                      Bitrate: 384000,
                      CodingMode: 'CODING_MODE_3_2',
                    },
                  },
                  LanguageCode: 'ENG',
                  LanguageCodeControl: 'USE_CONFIGURED',
                  StreamName: 'Surround',
                },
              ],
              ContainerSettings: { Container: 'M3U8', M3u8Settings: {} },
              NameModifier: '_51_surround',
              OutputSettings: {
                HlsSettings: {
                  AudioGroupId: 'default-audio-group',
                  AudioTrackType: 'ALTERNATE_AUDIO_AUTO_SELECT_DEFAULT',
                },
              },
            },
          ],
        },
      ],
      TimecodeConfig: { Source: 'ZEROBASED' },
    },
    Status: 'SUBMITTED',
    StatusUpdateInterval: 'SECONDS_60',
    UserMetadata: {},
  },
};

jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockParams))
const mcMock = mockClient(MediaConvertClient);
const dispatcher = new MediaConvertDispatcher("testString1", "testRegion1", "inputBucket", "outputBucket", "fakeARN", "playlistName", null, logger);

beforeEach(() => {
    mcMock.reset();
});

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
    const customDispatcher = new MediaConvertDispatcher("testString1", "testRegion1", "inputBucket", "outputBucket", "fakeARN", "playlistName", encodeParams, logger);
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
});

test("Should return job info", async () => {
    const mockResp = {
        AccelerationSettings: { Mode: 'DISABLED' },
        AccelerationStatus: 'NOT_APPLICABLE',
        Arn: 'arn:aws:mediaconvert:eu-north-1:1234:jobs/123456-61zf86',
        Id: '123456-61zf86',
        Messages: { Info: [], Warning: [] },
        Priority: 0,
        Queue: 'arn:aws:mediaconvert:eu-north-1:123456789:queues/Default',
        Role: 'arn:aws:iam::1234:role/MediaConvert_Default_Role',
        Settings: {
        Inputs: [
          {
            AudioSelectors: {
              'Audio Selector 1': { DefaultSelection: 'DEFAULT' },
            },
            FileInput: 's3://inputBucket/test-file.mp4',
            TimecodeSource: 'ZEROBASED',
            VideoSelector: { ColorSpace: 'FOLLOW' },
          },
        ],
        OutputGroups: [
          {
            Name: 'HLS',
            OutputGroupSettings: {
              HlsGroupSettings: {
                Destination: 's3://outputBucket/test-file.mp4/manifest',
                MinSegmentLength: 0,
                SegmentLength: 6,
              },
              Type: 'HLS_GROUP_SETTINGS',
            },
            Outputs: [
              {
                ContainerSettings: { Container: 'M3U8', M3u8Settings: {} },
                NameModifier: '1080p8300',
                OutputSettings: { HlsSettings: {} },
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      Bitrate: 8300000,
                      CodecProfile: 'HIGH',
                      RateControlMode: 'CBR',
                    },
                  },
                  Height: 1080,
                  Width: 1920,
                },
              },
              {
                AudioDescriptions: [
                  {
                    AudioSourceName: 'Audio Selector 1',
                    CodecSettings: {
                      AacSettings: {
                        Bitrate: 192000,
                        CodecProfile: 'LC',
                        CodingMode: 'CODING_MODE_2_0',
                        SampleRate: 44100,
                      },
                      Codec: 'AAC',
                    },
                    LanguageCode: 'ENG',
                    LanguageCodeControl: 'USE_CONFIGURED',
                    StreamName: 'Stereo',
                  },
                ],
                ContainerSettings: { Container: 'M3U8', M3u8Settings: {} },
                NameModifier: '_stereo',
                OutputSettings: {
                  HlsSettings: {
                    AudioGroupId: 'default-audio-group',
                    AudioTrackType: 'ALTERNATE_AUDIO_AUTO_SELECT',
                  },
                },
              },
              {
                AudioDescriptions: [
                  {
                    AudioSourceName: 'Audio Selector 1',
                    CodecSettings: {
                      Codec: 'EAC3',
                      Eac3Settings: {
                        Bitrate: 384000,
                        CodingMode: 'CODING_MODE_3_2',
                      },
                    },
                    LanguageCode: 'ENG',
                    LanguageCodeControl: 'USE_CONFIGURED',
                    StreamName: 'Surround',
                  },
                ],
                ContainerSettings: { Container: 'M3U8', M3u8Settings: {} },
                NameModifier: '_51_surround',
                OutputSettings: {
                  HlsSettings: {
                    AudioGroupId: 'default-audio-group',
                    AudioTrackType: 'ALTERNATE_AUDIO_AUTO_SELECT_DEFAULT',
                  },
                },
              },
            ],
          },
        ],
        TimecodeConfig: { Source: 'ZEROBASED' },
      },
      Status: 'SUBMITTED',
      StatusUpdateInterval: 'SECONDS_60',
      UserMetadata: {},
    };

    mcMock.on(GetJobCommand).resolves(getJob);
    const response = await dispatcher.getJob("123456-61zf86");
    expect(response).toStrictEqual(mockResp);
});
