import { useCallback, useState } from 'react';
import { summarize } from '@/lib/slm';
import { updateSummary } from '@/lib/db';
import type { Segment, SummaryState } from '@/types';

export function useSummary() {
  const [state, setState] = useState<SummaryState>({ kind: 'idle' });

  const run = useCallback(async (noteId: string, transcript: Segment[]) => {
    setState({ kind: 'generating' });
    try {
      const result = await summarize(transcript);
      await updateSummary(noteId, result.summary, result.key_takeaways);
      setState({ kind: 'done' });
      return result;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Summarization failed';
      setState({ kind: 'error', message });
      return null;
    }
  }, []);

  return { state, run };
}
