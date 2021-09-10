# IAF Plugin AWS

The Eyevinn Ingest Application Framework (Eyevinn IAF) is a framework to simplify building VOD ingest applications. A framework of open source plugins to integrate with various transcoding and streaming providers. This is the plugin for uploading to an S3 bucket and transcoding with AWS MediaConvert and placing the output on another S3 bucket.

## Installation

To install the plugin in your project, run the following command.

```
npm install --save @eyevinn/iaf-plugin-aws
```

## Using the module in your application based on Eyevinn IAF
To use the AWS upload module in your Eyevinn IAF setup, your `index.ts` should look like this:
```TypeScript
// other imports
import {AWSUploadModule} from "@eyevinn/iaf-plugin-aws";

const awsUploader = new AWSUploadModule(/** args **/);
const fileWatcher = /** initialize your file watcher of choice**/

fileWatcher.onAdd(awsUploader.onFileAdd);
```

# Plugin Documentation

## `AWSUploadModule`
Default plugin export. This class is plug-and-play with the Ingest Application Framework, as described in the prevous section.

### Methods
`constructor(mediaConvertEndpoint: string, awsRegion: string, ingestBucket: string, outputBucket: string, roleArn:string, playlistName: string, encodeParams: string, logger: winston.Logger)`

Creates a new `AWSUploadModule` object. You need to provide the unique part your mediaconvert endpoint URL, which AWS region it is running in, as well as the name of your ingest and output buckets. You will also need to provide a role ARN, as well as the base name of the generated playlist. A winston logger is also needed. These parameters are used to initialize the sub-modules.

`onFileAdd = (filePath: string, readStream: Readable)`.

Method that is executed when a file is added to the directory being watched. `filePath` is the full path to the added file, and `readStream` is a `Readable` stream of the file data. Any file watcher plugins are *required* to provide these. The method uploads the file to the `ingestBucket` specified in the constructor, and dispatches a transcoding job to the MediaConvert endpoint once the upload is completed.

## `S3Uploader`
Sub-module that handles uploading files to ingest S3 bucket. It's built on top of `@aws-sdk/lib-storage` in order to upload large files, which is essential for video.

### Methods
`constructor(destination: string, logger: winston.Logger)`

Instantiates a new `S3Uploader`. `destination` is the name of the ingest bucket (the same as `ingestBucket` in the `AWSUploadModule` constructor). `logger` is injected into the object, in order to avoid multiple logger objects.

`async upload(fileStream: Readable, fileName: string)`

Uploads a file to S3. The file data should be provided in the form of a `Readable` stream for performance reasons. `filename` will also be the key used in the S3 bucket.

## `MediaConvertDispatcher`
Sub-module that dispatches MediaConvert transcoding jobs.

### Methods
`constructor(mediaConvertEndpoint: string, region: string, inputLocation: string, outputDestination: string, roleArn: string, playlistName: string, logger: winston.Logger)`

Instantiates a new `MediaConverDispatcher`. logging is injected in order to avoid multiple logging objects.
In most cases, the parameters will be passed down to the parent `AwsUploadModule`.

`async dispatch(fileName: string)`

Dispatches a MediaConverter transcoding job. Jobs are executed with the settings specified in `resources/exampleJob.json`, and are in MediaConvert job format. `fileName` is the S3 key for the input file.
# [Contributing](CONTRIBUTING.md)

In addition to contributing code, you can help to triage issues. This can include reproducing bug reports, or asking for vital information such as version numbers or reproduction instructions.

TODO: write example code

# License (MIT)

Copyright 2021 Eyevinn Technology

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!

