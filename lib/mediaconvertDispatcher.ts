import { CreateJobCommand, MediaConvertClient } from "@aws-sdk/client-mediaconvert";
import { toPascalCase } from "./utils/stringManipulations";
import { TranscodeDispatcher } from "../interfaces";
import winston from "winston";

import * as emcJob from '../resources/exampleJob.json';

export class MediaConvertDispatcher implements TranscodeDispatcher {
    encodeParams: any;
    mediaConverterEndpoint: any;
    mediaConverterClient: MediaConvertClient;
    inputLocation: string;
    outputDestination: string;
    logger: winston.Logger;

    constructor(mediaConvertEndpoint: string, region: string, inputLocation: string, outputDestination: string, logger: winston.Logger) {
        this.encodeParams = emcJob;
        this.inputLocation = inputLocation;
        this.outputDestination = outputDestination;
        this.mediaConverterEndpoint = {
            endpoint: `https://${mediaConvertEndpoint}.mediaconvert.${region}.amazonaws.com`
        }
        this.logger = logger;
        this.mediaConverterClient = new MediaConvertClient(this.mediaConverterEndpoint);
    }

    /**
     * Dispatches a transcode job to a MediaConvert instance
     * @param fileName the name of the file to transcode
     * @returns the response from AWS.
     */
    async dispatch(fileName: string) {
        // start by setting the correct input and destination
        this.encodeParams["Settings"]["Inputs"].map(input => input["FileInput"] = `s3://${this.inputLocation}/${fileName}`);
        this.encodeParams["Settings"]["OutputGroups"].map(group => {
            const groupName = group["OutputGroupSettings"]["Type"]
            const pascaledGroupName = toPascalCase(groupName)
            group["OutputGroupSettings"][pascaledGroupName]["Destination"] = `s3://${this.outputDestination}/${fileName}/${group["Name"]}`;
        })

        try {
            const data = await this.mediaConverterClient.send(new CreateJobCommand(this.encodeParams));
            this.logger.log({
                level: 'info',
                message: `Transcoding job created for ${fileName}. Job ID: ${data.Job.Id}`
            })
            return data;
        }
        catch (err) {
            this.logger.log({
                level: 'error',
                message: `Failed to create a transcoding job for ${fileName}! `
            })
            throw err;
        }
    }

}