import { CreateJobCommand, MediaConvertClient, GetJobCommand } from "@aws-sdk/client-mediaconvert";
import { toPascalCase } from "./utils/stringManipulations";
import { TranscodeDispatcher } from "./types/interfaces";
import * as fs from "fs";
import * as path from "path"
import AbstractLogger from "./utils/logger";


export class MediaConvertDispatcher implements TranscodeDispatcher {
    encodeParams: any;
    mediaConverterEndpoint: any;
    mediaConverterClient: MediaConvertClient;
    inputLocation: string;
    outputDestination: string;
    roleArn: string;
    playlistName: string;
    logger: AbstractLogger;

    /**
     * Initializes a MediaConvertDispatcher
     * @param mediaConvertEndpoint the unique part of the endpoint to the mediaconvert instance
     * @param region the AWS region
     * @param inputLocation the S3 bucket containing the input files
     * @param outputDestination the S3 bucket where the results should be placed
     * @param roleArn the role ARN string for AWS
     * @param playlistName the name of the playlist to be created
     * @param encodeParams the parameters to be used for the transcoding job
     * @param logger a logger object
     */
    constructor(mediaConvertEndpoint: string, region: string, inputLocation: string, outputDestination: string, roleArn: string, playlistName: string, encodeParams: string, logger: AbstractLogger) {
        this.inputLocation = inputLocation;
        this.outputDestination = outputDestination;
        this.mediaConverterEndpoint = { endpoint: `https://${mediaConvertEndpoint}.mediaconvert.${region}.amazonaws.com` };
        this.roleArn = roleArn;
        this.playlistName = playlistName;
        this.logger = logger;
        this.mediaConverterClient = new MediaConvertClient(this.mediaConverterEndpoint);

        if (encodeParams) {
            this.encodeParams = JSON.parse(encodeParams);
        } else {
            this.encodeParams = this.loadEncodeParams(path.join(__dirname,"..","resources", "exampleJob.json"));
        }
    }

    /**
     * Dispatches a transcode job to a MediaConvert instance
     * @param fileName the name of the file to transcode
     * @returns the response from AWS.
     */
    async dispatch(fileName: string) {
        // start by setting the correct input and destination
        this.encodeParams["Role"] = this.roleArn;
        this.encodeParams["Settings"]["Inputs"].map(input => input["FileInput"] = `s3://${this.inputLocation}/${fileName}`);
        this.encodeParams["Settings"]["OutputGroups"].map(group => {
            const groupName = group["OutputGroupSettings"]["Type"]
            const pascaledGroupName = toPascalCase(groupName)
            group["OutputGroupSettings"][pascaledGroupName]["Destination"] = `s3://${this.outputDestination}/${fileName}/${this.playlistName}`;
        })

        try {
            const data = await this.mediaConverterClient.send(new CreateJobCommand(this.encodeParams));
            this.logger.info(`Transcoding job created for ${fileName}. Job ID: ${data.Job.Id}`);
            return data;
        }
        catch (err) {
            this.logger.error(`Failed to create a transcoding job for ${fileName}!`);
            throw err;
        }
    }

    /**
     * Get a transcode job from a MediaConvert instance
     * @param jobId the ID of the job to get
     * @returns the response from AWS.
     */
    async getJob(jobId: string) {
        try {
            const resp = await this.mediaConverterClient.send(new GetJobCommand({ Id: jobId }));
            return resp.Job;
        }
        catch (err) {
            this.logger.error(`Failed to get the transcoding job for ID ${jobId} from MediaConvert!`);
            throw err;
        }
    }

    loadEncodeParams(templateFileName: string) {
        const encodeData = JSON.parse(fs.readFileSync(templateFileName, "utf-8"));
        return encodeData;
    }

}
