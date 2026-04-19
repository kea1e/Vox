import { useCallback, useState } from 'react';
import { transcribeFile } from '@/lib/whisper';
import { updateTranscript } from '@/lib/db';
import type { Segment, TranscriptionState } from '@/types';

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({ kind: 'idle' });

  const run = useCallback(async (noteId: string, audioPath: string): Promise<Segment[] | null> => {
    setState({ kind: 'loading-model' });
    try {
      setState({ kind: 'transcribing', progress: 0 });
      const segments = await transcribeFile(audioPath, (pct) => {
        setState({ kind: 'transcribing', progress: pct });
      });
      await updateTranscript(noteId, segments);
      setState({ kind: 'done' });
      return segments;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Transcription failed';
      setState({ kind: 'error', message });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ kind: 'idle' }), []);

  return { state, run, reset };
}
