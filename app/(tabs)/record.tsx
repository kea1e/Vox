import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useRecording } from '@/hooks/useRecording';
import { RecordButton } from '@/components/RecordButton';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { insertNote } from '@/lib/db';

function fmtClock(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function RecordScreen() {
  const { state, durationMs, levels, error, start, stop } = useRecording();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const recording = state === 'recording';

  const onPress = async () => {
    if (recording) {
      setSaving(true);
      const result = await stop();
      setSaving(false);
      if (!result) return;

      const id = Crypto.randomUUID();
      const now = new Date();
      const title = `Note ${now.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      try {
        await insertNote({
          id,
          title,
          created_at: now.toISOString(),
          duration_seconds: result.durationSec,
          audio_path: result.uri,
        });
        router.push(`/note/${id}`);
      } catch (e: unknown) {
        Alert.alert('Save failed', e instanceof Error ? e.message : 'Unknown error');
      }
    } else {
      await start();
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-between px-2g pb-5g pt-3g">
        <View className="items-center">
          <Text className="text-xs uppercase tracking-widest text-fg-subtle">
            {recording ? 'Recording' : state === 'stopping' ? 'Saving' : 'Ready'}
          </Text>
          <Text className="mt-1g font-mono text-5xl text-fg">{fmtClock(durationMs)}</Text>
        </View>

        <WaveformVisualizer levels={levels} active={recording} />

        <View className="items-center gap-1g">
          <RecordButton recording={recording} onPress={onPress} disabled={saving || state === 'stopping'} />
          <Text className="text-xs text-fg-subtle">
            {recording ? 'Tap to stop' : 'Tap to start recording'}
          </Text>
          {error ? <Text className="mt-1g text-xs text-accent">{error}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
