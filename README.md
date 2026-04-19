# Vox

Private, on-device AI note-taker for iOS + Android. Records lectures and meetings, transcribes them locally with Whisper, and generates summaries with a local SLM. Audio never leaves your device.

Built per [`notes-app-spec.md`](../notes-app-spec.md).

## Stack

- **Expo SDK 54** (React Native 0.81) + **TypeScript** (managed workflow)
- **Expo Router** v6 (file-based, typed routes)
- **NativeWind v4** (Tailwind for RN)
- **expo-av** — audio capture (16kHz mono WAV, Whisper-ready)
- **expo-sqlite** — local-first persistence with FTS5 transcript search
- **whisper.rn** — on-device Whisper inference
- **llama.rn + Phi-3 Mini** — on-device summarization _(next sprint)_
- **Supabase** — cloud sync + auth _(next sprint)_

## Run it

```bash
npm install --legacy-peer-deps
npx expo start
```

Scan the QR with Expo Go for everything **except transcribe/summarize** — those need a dev build (see below).

### Building a dev client (required for whisper.rn)

`whisper.rn` is a native module. To use Transcribe in the app you need a custom dev build:

```bash
# iOS (needs Xcode + CocoaPods)
npx expo prebuild
npx expo run:ios

# Android (needs Android SDK)
npx expo run:android
```

### Bundling the Whisper model

The model file is **not** in git (too large). Drop `ggml-tiny.en.bin` (~40MB) into:

- iOS: `ios/vox-app/Resources/ggml-tiny.en.bin` (added to Copy Bundle Resources)
- Android: `android/app/src/main/assets/ggml-tiny.en.bin`

Download from: <https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin>

After `npx expo prebuild`, copy the file into the platform folders, then rebuild.

## Project structure

```
app/
  _layout.tsx          # Root stack + global.css import
  (tabs)/              # Bottom tabs: Home, Record, Library, Settings
  note/[id].tsx        # Detail view (Summary / Transcript / Raw)
components/            # RecordButton, NoteCard, WaveformVisualizer, ...
lib/                   # db, audio, whisper, slm, supabase wrappers
hooks/                 # useRecording, useTranscription, useSummary, useSync
types/                 # Note, Segment, state machines
```

## What works today

- ✅ Tap-to-record with live waveform metering, background-audio capable
- ✅ 16kHz mono WAV saved to documents directory
- ✅ Notes persisted to local SQLite with FTS5 transcript search
- ✅ Library list, search, swipe-to-delete
- ✅ Note detail with Summary / Transcript / Raw playback tabs
- ✅ Markdown export via the Share sheet
- ⏳ Transcribe — wired to whisper.rn, requires dev build + bundled model
- ⏳ Summarize — UI + state machine ready, llama.rn integration pending
- ⏳ Cloud sync + auth — local-only for now

## Environment

Copy `.env.example` → `.env` if/when you wire up Supabase. The app runs fine without it.

## Notes for the next sprint

1. **llama.rn + Phi-3 Mini Q4** — implement download flow with size warning, bundle into `lib/slm.ts`
2. **Supabase wiring** — auth screens in `app/(auth)/`, sync logic in `useSync`, conflict resolution
3. **Whisper Base model** — settings toggle, post-install download to documents dir
4. **EAS Build** — `eas build:configure`, app store metadata, screenshots
