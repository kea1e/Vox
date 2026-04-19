import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import {
  RECORDINGS_DIR,
  WHISPER_RECORDING_OPTIONS,
  configureAudioForRecording,
  ensureRecordingsDir,
  requestMicPermission,
} from '@/lib/audio';
import type { RecordingState } from '@/types';

const MAX_LEVEL_HISTORY = 64;

export function useRecording() {
  const [state, setState] = useState<RecordingState>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const levelsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const granted = await requestMicPermission();
      if (!granted) {
        setError('Microphone permission denied');
        return;
      }
      await ensureRecordingsDir();
      await configureAudioForRecording();

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(WHISPER_RECORDING_OPTIONS);
      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) return;
        setDurationMs(status.durationMillis ?? 0);
        if (typeof status.metering === 'number') {
          // metering is dBFS, typically -160..0. Map to 0..1.
          const norm = Math.max(0, Math.min(1, (status.metering + 60) / 60));
          levelsRef.current = [...levelsRef.current, norm].slice(-MAX_LEVEL_HISTORY);
          setLevels(levelsRef.current);
        }
      });
      recording.setProgressUpdateInterval(100);
      await recording.startAsync();
      recordingRef.current = recording;
      setState('recording');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start recording');
      setState('idle');
    }
  }, []);

  const stop = useCallback(async (): Promise<{ uri: string; durationSec: number } | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;
    setState('stopping');
    try {
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      const tempUri = recording.getURI();
      if (!tempUri) throw new Error('Recording produced no file');

      const finalUri = `${RECORDINGS_DIR}${Date.now()}.wav`;
      await FileSystem.moveAsync({ from: tempUri, to: finalUri });

      const durationSec = Math.round((status.durationMillis ?? 0) / 1000);
      recordingRef.current = null;
      levelsRef.current = [];
      setLevels([]);
      setDurationMs(0);
      setState('idle');
      return { uri: finalUri, durationSec };
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to stop recording');
      setState('idle');
      return null;
    }
  }, []);

  return { state, durationMs, levels, error, start, stop };
}
