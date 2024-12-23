import debug from "debug";
import type { FfmpegCommand } from "fluent-ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { EOL } from "os";
import { extname } from "path";
import pc from "picocolors";

const log = debug("gcp-tts:encoder");

const kDefaultAudioBitrate = 128;

export type EncoderOptions = {
  audioBitrate?: number;
};

export enum Codecs {
  m4a = "m4a",
  weba = "weba",
}

function weba(ffmpeg: FfmpegCommand, audioBitrate: number): FfmpegCommand {
  ffmpeg
    .format("webm")
    .noVideo()
    .audioFrequency(24000) // Force 24000Hz sample rate to match the requested one
    .audioBitrate(`${audioBitrate}k`)
    .audioCodec("libopus")
    .audioChannels(1) // Force mono output
    .outputOptions([
      // https://ffmpeg.org/ffmpeg-codecs.html#libopus-1
      "-vbr constrained", // Use constrained variable bit rate encoding
      "-compression_level 10", // 0 gives the fastest encodes but lower quality, while 10 gives the highest quality but slowest encoding.
    ]);

  return ffmpeg;
}

function m4a(ffmpeg: FfmpegCommand, audioBitrate: number): FfmpegCommand {
  ffmpeg
    .format("mp4")
    .noVideo()
    .audioFrequency(24000) // Force 24000Hz sample rate to match the requested one
    .audioBitrate(`${audioBitrate}k`)
    .audioCodec("aac")
    .audioChannels(1) // Force mono output
    .outputOptions([
      // https://ffmpeg.org/ffmpeg-codecs.html#aac
      "-aac_coder twoloop", // Two loop searching (TLS) method
      "-profile:a aac_low", // The default, AAC "Low-complexity" profile
      "-movflags +faststart", // AAC Progresive download : https://trac.ffmpeg.org/wiki/Encode/AAC#Progressivedownload
    ]);

  return ffmpeg;
}

function ffmpegWithCodec(ffmpeg: FfmpegCommand, codec: string, options: EncoderOptions): FfmpegCommand {
  switch (codec) {
    // Audio codecs
    case Codecs.m4a:
      return m4a(ffmpeg, options.audioBitrate || kDefaultAudioBitrate);
    case Codecs.weba:
      return weba(ffmpeg, options.audioBitrate || kDefaultAudioBitrate);
    // Unknown codec : Throw an error
    default:
      throw new Error(`The codec ${codec} is not implemented !`);
  }
}

export function encode(file: string, codec: Codecs, options: EncoderOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const extension = extname(file);
    const destination = file.replace(new RegExp(`${extension}$`), `.${codec}`);

    ffmpegWithCodec(ffmpeg(file), codec, options)
      .on("start", (commandLine) => {
        log(`Spawn with the command ${pc.gray(pc.italic(commandLine))}`);
      })
      .on("codecData", function (data) {
        const codecData = data;

        log(
          "The input is an audio file :" +
            pc.gray(
              `${EOL}\t- format : ${codecData.format}${EOL}\t- duration : ${codecData.duration}${EOL}\t- audio : ${codecData.audio_details.join(", ")}`
            )
        );
      })
      .on("progress", function (progress) {
        log(`${EOL}Conversion progress : ${pc.gray((progress.percent ?? 0) / 100)}`);
      })
      .on("error", function (err) {
        reject(err);
      })
      .on("end", function () {
        log(`${EOL}Conversion complete : ${pc.gray(destination)}`);
        resolve(destination);
      })
      .renice(20)
      .save(destination);
  });
}
