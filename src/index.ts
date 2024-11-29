import { Codecs, encode, EncoderOptions } from "./encoder";
import { GCPConfig, synthesize, SynthesizeDestination, SynthesizeOptions } from "./synthesizer";

export { Codecs, EncoderOptions } from "./encoder";
export { GCPConfig, SynthesizeDestination, SynthesizeOptions } from "./synthesizer";
export * from "./voices";

export async function synthesizeTextWithGCP(
  textToRead: string,
  gcpConfig: GCPConfig,
  options: SynthesizeOptions,
  destination: SynthesizeDestination,
  extraEncodes: Array<{ codec: Codecs; options: EncoderOptions }>
): Promise<{
  sourceFile: string;
  exextraEncodes: Array<string>;
}> {
  // Create the source version on the audio file
  const sourceFilePath = await synthesize(textToRead, gcpConfig, options, destination);

  // Generate extra version with different codecs
  const extras = [] as Array<string>;
  for (const { codec, options } of extraEncodes) {
    extras.push(await encode(sourceFilePath, codec, options));
  }

  // Return the result
  return {
    sourceFile: sourceFilePath,
    exextraEncodes: extras,
  };
}
