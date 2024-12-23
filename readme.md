[![npm version](https://badge.fury.io/js/@lesjoursfr%2Fgcp-tts.svg)](https://badge.fury.io/js/@lesjoursfr%2Fgcp-tts)
[![QC Checks](https://github.com/lesjoursfr/gcp-tts/actions/workflows/quality-control.yml/badge.svg)](https://github.com/lesjoursfr/gcp-tts/actions/workflows/quality-control.yml)

# gcp-tts

Generate audio files from text file using GCP.

## Presentation

This module convert text to sound using the Google Cloud Text-to-Speech service.

```javascript
import { Languages, synthesizeTextWithGCP, Voices } from "@lesjoursfr/gcp-tts";

let result = await synthesizeTextWithGCP(
	"Alice, assise auprès de sa sœur sur le gazon, …",
	{
		projectId: "gcp-project-id",
		clientOptions: { credentials: credentials },
		bucketId: "gcp-bucket-id",
	},
	{
		language: Languages.fr_FR,
		voice: Voices.fr_FR_Neural2_A,
		audioEncoding: "LINEAR16",
	},
	{ folder: "/an/absolute/path", filename: "filename-without-extension" }
);
```

You can also convert the generated file to WEBA and/or M4A.
**You need to have ffmpeg installed on your system to do that.**

```javascript
import {
	Codecs,
	Languages,
	synthesizeTextWithGCP,
	Voices,
} from "@lesjoursfr/gcp-tts";

let result = await synthesizeTextWithGCP(
	"Alice, assise auprès de sa sœur sur le gazon, …",
	{
		projectId: "gcp-project-id",
		clientOptions: { credentials: credentials },
		bucketId: "gcp-bucket-id",
	},
	{
		language: Languages.fr_FR,
		voice: Voices.fr_FR_Neural2_A,
		audioEncoding: "LINEAR16",
	},
	{ folder: "/an/absolute/path", filename: "filename-without-extension" },
	[{ codec: Codecs.weba }, { codec: Codecs.m4a }]
);
```

The return object is:

```typescript
type SynthesizeResult = {
	sourceFile: string; // File path of the original generated file
	extraEncodes: Array<string>; // Array of file paths converted by ffmpeg
};
```
