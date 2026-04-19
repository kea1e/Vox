import { ScrollView, Text, View } from 'react-native';
import type { Segment } from '@/types';

function fmtTs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

type Props = { segments: Segment[] };

export function TranscriptViewer({ segments }: Props) {
  if (segments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-3g">
        <Text className="text-sm italic text-fg-subtle">Transcript not generated yet</Text>
      </View>
    );
  }
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-1g py-2g gap-1g">
      {segments.map((seg, i) => (
        <View key={i} className="flex-row gap-1g">
          <Text className="w-12 font-mono text-xs text-fg-subtle">{fmtTs(seg.start)}</Text>
          <Text className="flex-1 font-mono text-sm text-fg">{seg.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
