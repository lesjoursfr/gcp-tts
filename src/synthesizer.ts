import { Storage } from "@google-cloud/storage";
import { TextToSpeechClient, TextToSpeechLongAudioSynthesizeClient } from "@google-cloud/text-to-speech";
import { google } from "@google-cloud/text-to-speech/build/protos/protos.js";
import debug from "debug";
import { writeFile } from "fs/promises";
import { join } from "path";
import pc from "picocolors";
import { Languages, Voices } from "./voices";

const log = debug("gcp-tts:synthesizer");

type ISynthesizeLongAudioRequest = google.cloud.texttospeech.v1.ISynthesizeLongAudioRequest;
type ISynthesizeSpeechRequest = google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;
type IAudioConfig = google.cloud.texttospeech.v1.IAudioConfig;

export type GCPConfig = {
  clientOptions: { credentials: { client_email: string; private_key: string } };
  projectId: string;
  bucketId: string;
};

export type SynthesizeOptions = {
  language: Languages;
  voice: Voices;
  audioEncoding: IAudioConfig["audioEncoding"];
};

export type SynthesizeDestination = {
  folder: string;
  filename: string;
};

export async function synthesize(
  textToRead: string,
  gcpConfig: GCPConfig,
  options: SynthesizeOptions,
  destination: SynthesizeDestination
): Promise<string> {
  try {
    // Destination path
    const destFileName = `${destination.filename}.wav`;
    const destFilePath = join(destination.folder, destFileName);

    // Check if it's a short text (ie less than 5000 bytes)
    const textLength = Buffer.from(textToRead).length;
    const isShortText = textLength < 5000;
    log(`Text length in bytes ${pc.gray(pc.italic(textLength))}`);

    // Create the speech synthesizer.
    if (isShortText) {
      // The limit is 5000 bytes
      const client = new TextToSpeechClient(gcpConfig.clientOptions);
      const request: ISynthesizeSpeechRequest = {
        input: { text: textToRead }, // { text: string; } or { ssml: string ;}
        voice: { languageCode: options.language, name: options.voice },
        audioConfig: { audioEncoding: options.audioEncoding },
      };

      // Start the synthesizer and wait for a result.
      log(`Use TextToSpeechClient with the destination ${destFilePath}`);
      const [response] = await client.synthesizeSpeech(request);
      if (response.audioContent !== null && response.audioContent !== undefined) {
        log("Speech synthesis finished.");
        await writeFile(destFilePath, response.audioContent);
      } else {
        log("Speech synthesis failed.");
      }
    } else {
      // The limit is 1M bytes
      log(`Use TextToSpeechLongAudioSynthesizeClient with the destination gs://${gcpConfig.bucketId}/${destFileName}`);
      const client = new TextToSpeechLongAudioSynthesizeClient(gcpConfig.clientOptions);
      const request: ISynthesizeLongAudioRequest = {
        parent: `projects/${gcpConfig.projectId}/locations/global`,
        input: { text: textToRead }, // { text: string; } or { ssml: string ;}
        voice: { languageCode: options.language, name: options.voice },
        audioConfig: { audioEncoding: options.audioEncoding, sampleRateHertz: 24000 }, // Use a 24000Hz sample rate
        outputGcsUri: `gs://${gcpConfig.bucketId}/${destFileName}`,
      };

      // Start the synthesizer.
      const [operation] = await client.synthesizeLongAudio(request);

      // Polls the operation until complete
      await operation.promise();

      // Creates a Storage client
      const storage = new Storage(gcpConfig.clientOptions);
      const bucket = storage.bucket(gcpConfig.bucketId);

      // Download the file
      log(`Download the file gs://${gcpConfig.bucketId}/${destFileName} to ${destFilePath}`);
      await bucket.file(destFileName).download({ destination: destFilePath });

      // Remove the file from the Bucket
      log(`Delete the file gs://${gcpConfig.bucketId}/${destFileName}`);
      await bucket.file(destFileName).delete();
    }

    // Return the destination file
    return destFilePath;
  } catch (err) {
    throw new Error(`Can't synthesize the given text!`, { cause: err });
  }
}
