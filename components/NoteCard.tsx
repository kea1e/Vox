import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { Note } from '@/types';

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Props = {
  note: Note;
  onLongPress?: () => void;
};

export function NoteCard({ note, onLongPress }: Props) {
  const preview =
    note.summary ?? note.transcript.map((s) => s.text).join(' ').slice(0, 140);
  return (
    <Link href={`/note/${note.id}`} asChild>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={400}
        className="rounded-2xl border border-border bg-bg-card p-1g active:opacity-70"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-fg" numberOfLines={1}>
            {note.title}
          </Text>
          <Text className="text-xs text-fg-subtle">{fmtDuration(note.duration_seconds)}</Text>
        </View>
        <Text className="mt-1 text-xs text-fg-subtle">{fmtDate(note.created_at)}</Text>
        {preview ? (
          <Text className="mt-2g text-sm text-fg-muted" numberOfLines={3}>
            {preview}
          </Text>
        ) : (
          <Text className="mt-2g text-sm italic text-fg-subtle">No transcript yet</Text>
        )}
      </Pressable>
    </Link>
  );
}
