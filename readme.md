[![npm version](https://badge.fury.io/js/@lesjoursfr%2Fgcp-tts.svg)](https://badge.fury.io/js/@lesjoursfr%2Fgcp-tts)
[![QC Checks](https://github.com/lesjoursfr/gcp-tts/actions/workflows/quality-control.yml/badge.svg)](https://github.com/lesjoursfr/gcp-tts/actions/workflows/quality-control.yml)

# gcp-tts

Generate audio files from text file using GCP.

## Presentation

This module convert text to sound using the Google Cloud Text-to-Speech service.
The generated audio is a WAVE file but you can ask for extra WEBA and/or M4A files (they will be generated using ffmpeg).

```javascript
import gcpTTS from "@lesjoursfr/gcp-tts";

let result = synthesizeTextWithGCP("Lorem ipsum...");
```
