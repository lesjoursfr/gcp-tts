import assert from "assert";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Codecs, Languages, synthesizeTextWithGCP, Voices } from "../src/index";

type GcpCredentials = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
};

const { TTS_GCP_CREDENTIALS, TTS_GCP_BUCKET } = process.env;
if (typeof TTS_GCP_CREDENTIALS !== "string" || typeof TTS_GCP_BUCKET !== "string") {
  throw new Error("Missing TTS_GCP_CREDENTIALS or TTS_GCP_BUCKET environment variable!");
}
if (!existsSync(TTS_GCP_CREDENTIALS)) {
  throw new Error(`${TTS_GCP_CREDENTIALS} doesn't exist!`);
}
const credentials = Object.freeze(
  JSON.parse(readFileSync(TTS_GCP_CREDENTIALS, { encoding: "utf-8" })) as GcpCredentials
);

it("Generate WAVE, WEBA & M4A for a small text", async () => {
  const text = readFileSync(resolve(__dirname, "alice-in-wonderland-short.txt"), { encoding: "utf8" });
  const results = await synthesizeTextWithGCP(
    text,
    { projectId: credentials.project_id, clientOptions: { credentials: credentials }, bucketId: TTS_GCP_BUCKET },
    { language: Languages.fr_FR, voice: Voices.fr_FR_Neural2_A, audioEncoding: "LINEAR16" },
    { folder: resolve(__dirname), filename: "alice-in-wonderland-short" },
    [
      { codec: Codecs.weba, options: { audioBitrate: 256 } },
      { codec: Codecs.m4a, options: { audioBitrate: 256 } },
    ]
  );

  assert.strictEqual(existsSync(results.sourceFile), true);
  assert.strictEqual(results.extraEncodes.length, 2);
  assert.strictEqual(existsSync(results.extraEncodes[0]), true);
  assert.strictEqual(existsSync(results.extraEncodes[1]), true);
}).timeout(60000);

it("Generate WAVE for a long text", async () => {
  const text = readFileSync(resolve(__dirname, "alice-in-wonderland-long.txt"), { encoding: "utf8" });
  const results = await synthesizeTextWithGCP(
    text,
    { projectId: credentials.project_id, clientOptions: { credentials: credentials }, bucketId: TTS_GCP_BUCKET },
    { language: Languages.fr_FR, voice: Voices.fr_FR_Neural2_A, audioEncoding: "LINEAR16" },
    { folder: resolve(__dirname), filename: "alice-in-wonderland-long" }
  );

  assert.strictEqual(existsSync(results.sourceFile), true);
  assert.strictEqual(results.extraEncodes.length, 0);
}).timeout(60000);
