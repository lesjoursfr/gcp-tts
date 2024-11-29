import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { existsSync, readFileSync, writeFileSync } from "fs";

(async function () {
  // Check if we have the required environment variables
  const { TTS_GCP_CREDENTIALS } = process.env;
  if (typeof TTS_GCP_CREDENTIALS !== "string") {
    throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_PROJECT_ID environment variable!");
  }
  if (!existsSync(TTS_GCP_CREDENTIALS)) {
    throw new Error(`${TTS_GCP_CREDENTIALS} doesn't exist!`);
  }
  const credentials = Object.freeze(JSON.parse(readFileSync(TTS_GCP_CREDENTIALS, { encoding: "utf-8" })));

  // Create the speech synthesizer.
  const client = new TextToSpeechClient({ credentials: credentials });

  // Create the enum definitions with all available voices.
  const [result] = await client.listVoices({});
  const voices = result.voices;
  if (voices === null || voices === undefined) {
    throw new Error("Can't fetch availables voices!");
  }
  const languages = [] as Array<string>;
  let enumDef = "export enum Voices {\n";
  for (const voice of voices) {
    if (voice.name === null || voice.name === undefined) {
      continue;
    }
    enumDef += `  ${voice.name.replaceAll("-", "_")} = "${voice.name}",\n`;
    if (voice.languageCodes !== null && voice.languageCodes !== undefined) {
      for (const languageCode of voice.languageCodes) {
        if (!languages.includes(languageCode)) {
          languages.push(languageCode);
        }
      }
    }
  }
  enumDef += "}\n\n";
  enumDef += "export enum Languages {\n";
  for (const language of languages) {
    enumDef += `  ${language.replaceAll("-", "_")} = "${language}",\n`;
  }
  enumDef += "}\n";

  // Write the enum in the src folder
  writeFileSync("./src/voices.ts", enumDef, { encoding: "utf-8", mode: 0o664 });
})();
