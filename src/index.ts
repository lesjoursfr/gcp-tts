import { Codecs, encode, EncoderOptions } from "./encoder";
import { GCPConfig, synthesize, SynthesizeDestination, SynthesizeOptions } from "./synthesizer";

export { Codecs, EncoderOptions } from "./encoder";
export { GCPConfig, SynthesizeDestination, SynthesizeOptions } from "./synthesizer";
export * from "./voices";

export type SynthesizeResult = {
  sourceFile: string;
  extraEncodes: Array<string>;
};

export async function synthesizeTextWithGCP(
  textToRead: string,
  gcpConfig: GCPConfig,
  options: SynthesizeOptions,
  destination: SynthesizeDestination,
  extraEncodes?: Array<{ codec: Codecs; options: EncoderOptions }>
): Promise<SynthesizeResult> {
  // Create the source version on the audio file
  const sourceFilePath = await synthesize(textToRead, gcpConfig, options, destination);

  // Generate extra version with different codecs
  const extras = [] as Array<string>;
  if (extraEncodes !== undefined) {
    for (const { codec, options } of extraEncodes) {
      extras.push(await encode(sourceFilePath, codec, options));
    }
  }

  // Return the result
  return {
    sourceFile: sourceFilePath,
    extraEncodes: extras,
  };
}
