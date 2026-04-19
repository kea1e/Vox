# Notes App — Claude Code Build Spec

---

## What We're Building

A mobile app (iOS + Android) that records lectures and meetings, transcribes them fully on-device, and generates summaries and key takeaways without ever sending audio to a server. Think of it as a private, offline-first AI note-taker that lives in your pocket. App Store ready from day one.

---

## Stack — No Debate, These Are Locked

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo (React Native, managed workflow) | Single codebase, App Store + Play Store, EAS Build handles signing |
| Language | TypeScript | Required, no JavaScript |
| Transcription | whisper.rn | Runs Whisper Tiny/Base on-device, no API calls, no audio leaves phone |
| Summarization | Phi-3 Mini or Gemma 2B via llama.rn or MLC LLM | Fully local SLM, handles summary + key takeaways generation |
| Local cache | expo-sqlite | Stores notes locally when offline, syncs to Supabase when connected |
| Cloud sync + auth | Supabase | Postgres backend, email/OAuth auth, open source, no vendor lock-in |
| Styling | NativeWind (Tailwind for React Native) | Utility-first, fast, consistent |
| Navigation | Expo Router (file-based) | Clean, App Store standard patterns |

---

## App Structure

```
app/
  (auth)/
    login.tsx
    signup.tsx
  (tabs)/
    index.tsx          # Home — recent notes feed
    record.tsx         # Record screen
    library.tsx        # All notes, search, filter
    settings.tsx       # Account, model settings, storage
  note/[id].tsx        # Individual note detail

components/
  RecordButton.tsx     # The main pulsing record control
  NoteCard.tsx         # Note preview in feed
  TranscriptViewer.tsx # Scrollable transcript with timestamps
  SummaryPanel.tsx     # Summary + key takeaways display
  WaveformVisualizer.tsx

lib/
  whisper.ts           # whisper.rn wrapper and model loader
  slm.ts               # Local SLM wrapper (Phi-3/Gemma)
  supabase.ts          # Supabase client + sync logic
  db.ts                # expo-sqlite local schema and queries
  audio.ts             # expo-av recording helpers

hooks/
  useRecording.ts
  useTranscription.ts
  useSummary.ts
  useSync.ts

types/
  index.ts             # All shared TypeScript types
```

---

## Core Features — Build These First

### 1. Recording
- Tap to start, tap to stop. No swipe gestures, no confusion.
- Show a live waveform while recording so the user knows it's working
- Background recording must work on iOS (user walks away from screen mid-lecture)
- Save raw audio to local filesystem via expo-file-system
- Auto-label with date + time if user doesn't name it

### 2. Transcription
- Runs immediately after recording stops
- Uses whisper.rn with Tiny model by default, Base model optional in settings
- Show progress (whisper processes in chunks, surface that)
- Output is timestamped segments, not a wall of text
- Store transcript in expo-sqlite immediately, sync to Supabase when online

### 3. Summary + Key Takeaways
- Triggered manually by user (button tap), not automatic — user controls when the SLM runs
- Phi-3 Mini or Gemma 2B takes the transcript text as input
- Output two things: a short paragraph summary (3-5 sentences) and a bullet list of key takeaways (5-8 bullets max)
- Store output alongside the note in local DB and Supabase
- Show a loading state — SLM inference on-device takes 10-30 seconds

### 4. Note Detail View
- Three tabs: Summary, Transcript, Raw (audio playback)
- Transcript is scrollable with timestamps on the left
- Edit button for manual corrections to transcript
- Share button exports as plain text or markdown

### 5. Library
- List of all notes, newest first
- Search by keyword (searches transcript text via SQLite FTS)
- Filter by date range or tag
- Swipe to delete

### 6. Auth + Sync
- Email/password login via Supabase Auth
- Google OAuth as secondary option
- All data syncs to Supabase when online, works fully offline when not
- Sync status indicator (last synced timestamp)

---

## Data Models

### Note (local SQLite + Supabase)
```typescript
type Note = {
  id: string               // uuid
  user_id: string
  title: string
  created_at: string       // ISO timestamp
  duration_seconds: number
  audio_path: string       // local file path
  transcript: Segment[]
  summary: string | null
  key_takeaways: string[]
  synced: boolean
  tags: string[]
}

type Segment = {
  start: number            // seconds
  end: number
  text: string
}
```

---

## On-Device AI — Important Details for Implementation

### Whisper.rn setup
- Bundle Tiny model (~40MB) in the app at install time
- Base model (~140MB) downloadable in settings post-install
- Model lives in expo-file-system's document directory
- Initialize once on app load, keep warm in memory

### Local SLM setup
- Phi-3 Mini 4K Instruct GGUF (Q4 quantized, ~2.2GB) is the default recommendation
- Use llama.rn for the inference runtime
- Model downloads on first use (not bundled — too large for App Store binary)
- Show a one-time download prompt with size warning on first "Summarize" tap
- Store model in expo-file-system, persist across sessions

### Prompt for summary generation
```
You are a note-taking assistant. Given the following transcript, return:
1. A concise summary in 3-5 sentences
2. A list of 5-8 key takeaways as short bullet points

Transcript:
{transcript_text}

Respond in this exact JSON format:
{
  "summary": "...",
  "key_takeaways": ["...", "...", "..."]
}
```

---

## App Store Requirements — Handle These From Day One

- **Microphone permission**: Info.plist entry with a clear reason string ("Used to record lectures and meetings for transcription")
- **Background audio**: UIBackgroundModes must include `audio` in app.json
- **App size**: Binary will be large due to bundled Whisper model. EAS Build handles this, but flag it in the App Store listing
- **Privacy**: No audio ever leaves the device. Call this out in the App Store description and in-app settings screen — it's a feature
- **iOS minimum**: Target iOS 16+ for best on-device ML performance

---

## What "No Bloat" Means Here

Do not build:
- Social features, sharing to other users, collaboration
- AI chat with your notes
- Folders/nested organization (tags are enough for v1)
- Web version
- Push notifications
- Onboarding slideshow (one screen max)
- Analytics or telemetry

Build only what's in Core Features above. Every screen should have one job.

---

## Design Direction

- Dark theme primary, light theme optional in settings
- Golden ratio spacing: base unit 8px, scale by 1.618 (8, 13, 21, 34, 55px)
- The record button is the hero element — it should feel tactile and deliberate
- Waveform visualizer while recording, not a timer
- Transcript uses monospace font, everything else uses a clean sans-serif
- Minimal chrome — no heavy nav bars, content fills the screen
- Micro-animations on record start/stop and transcription progress

---

## Environment Variables Needed

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Supabase Schema (run this in Supabase SQL editor)

```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamptz default now(),
  duration_seconds integer,
  transcript jsonb,
  summary text,
  key_takeaways jsonb,
  tags text[],
  updated_at timestamptz default now()
);

alter table notes enable row level security;

create policy "Users can only access their own notes"
  on notes for all
  using (auth.uid() = user_id);
```

---

## First Message to Claude Code

> Build a React Native / Expo app using TypeScript per the spec in notes-app-spec.md. Start with the project scaffold, core navigation, and the recording screen. Do not skip TypeScript types. Do not install packages not listed in the spec without flagging it first. Ask before making architectural decisions not covered here.

---

## Open Questions to Resolve Before Build

1. **App name** — needed for Expo project init, App Store listing, and Supabase project name
2. **llama.rn vs MLC LLM** — both work, llama.rn has better React Native community support right now, MLC has better quantization options. Pick one before the SLM integration sprint.
3. **Supabase region** — pick US East for lowest latency if your user base is US-focused
