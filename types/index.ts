export type Segment = {
  start: number;
  end: number;
  text: string;
};

export type Note = {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  duration_seconds: number;
  audio_path: string;
  transcript: Segment[];
  summary: string | null;
  key_takeaways: string[];
  synced: boolean;
  tags: string[];
};

export type NewNote = Omit<Note, 'transcript' | 'summary' | 'key_takeaways' | 'synced' | 'tags' | 'user_id'> & {
  transcript?: Segment[];
  summary?: string | null;
  key_takeaways?: string[];
  tags?: string[];
};

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopping';

export type TranscriptionState =
  | { kind: 'idle' }
  | { kind: 'loading-model' }
  | { kind: 'transcribing'; progress: number }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

export type SummaryState =
  | { kind: 'idle' }
  | { kind: 'downloading-model'; progress: number }
  | { kind: 'generating' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };
