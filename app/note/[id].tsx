import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { getNote } from '@/lib/db';
import { useTranscription } from '@/hooks/useTranscription';
import { useSummary } from '@/hooks/useSummary';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { SummaryPanel } from '@/components/SummaryPanel';
import { configureAudioForPlayback } from '@/lib/audio';
import type { Note } from '@/types';

type Tab = 'summary' | 'transcript' | 'raw';

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center py-1g">
      <Text className={`text-sm ${active ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
        {label}
      </Text>
      {active ? <View className="mt-0.5g h-[2px] w-8 rounded-full bg-accent" /> : null}
    </Pressable>
  );
}

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [tab, setTab] = useState<Tab>('summary');
  const transcription = useTranscription();
  const summary = useSummary();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const n = await getNote(id);
    setNote(n);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      sound?.unloadAsync().catch(() => {});
    };
  }, [sound]);

  const onTranscribe = async () => {
    if (!note) return;
    const segments = await transcription.run(note.id, note.audio_path);
    if (segments) {
      await load();
      setTab('transcript');
    }
  };

  const onSummarize = async () => {
    if (!note) return;
    if (note.transcript.length === 0) {
      Alert.alert('No transcript', 'Generate a transcript first.');
      return;
    }
    const result = await summary.run(note.id, note.transcript);
    if (result) {
      await load();
      setTab('summary');
    }
  };

  const onShare = async () => {
    if (!note) return;
    const text = [
      `# ${note.title}`,
      '',
      note.summary ? `## Summary\n${note.summary}\n` : '',
      note.key_takeaways.length
        ? `## Key takeaways\n${note.key_takeaways.map((t) => `- ${t}`).join('\n')}\n`
        : '',
      note.transcript.length ? `## Transcript\n${note.transcript.map((s) => s.text).join(' ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    await Share.share({ message: text, title: note.title });
  };

  const togglePlayback = async () => {
    if (!note) return;
    if (playing && sound) {
      await sound.pauseAsync();
      setPlaying(false);
      return;
    }
    if (sound) {
      await sound.playAsync();
      setPlaying(true);
      return;
    }
    await configureAudioForPlayback();
    const { sound: s } = await Audio.Sound.createAsync({ uri: note.audio_path });
    s.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setPlaying(false);
    });
    setSound(s);
    await s.playAsync();
    setPlaying(true);
  };

  if (!note) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#f5f5f5" />
      </SafeAreaView>
    );
  }

  const transcribing = transcription.state.kind === 'transcribing' || transcription.state.kind === 'loading-model';
  const summarizing = summary.state.kind === 'generating';

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          title: note.title,
          headerRight: () => (
            <Pressable onPress={onShare}>
              <Text className="px-1g text-sm text-fg">Share</Text>
            </Pressable>
          ),
        }}
      />

      <View className="flex-row border-b border-border">
        <TabBtn label="Summary" active={tab === 'summary'} onPress={() => setTab('summary')} />
        <TabBtn label="Transcript" active={tab === 'transcript'} onPress={() => setTab('transcript')} />
        <TabBtn label="Raw" active={tab === 'raw'} onPress={() => setTab('raw')} />
      </View>

      <View className="flex-1">
        {tab === 'summary' ? (
          <SummaryPanel summary={note.summary} takeaways={note.key_takeaways} />
        ) : tab === 'transcript' ? (
          <TranscriptViewer segments={note.transcript} />
        ) : (
          <View className="flex-1 items-center justify-center gap-2g px-2g">
            <Text className="text-sm text-fg-muted" numberOfLines={1}>
              {note.audio_path.split('/').pop()}
            </Text>
            <Pressable
              onPress={togglePlayback}
              className="rounded-full bg-accent px-3g py-1g"
            >
              <Text className="font-semibold text-fg">{playing ? 'Pause' : 'Play'}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View className="flex-row gap-1g border-t border-border bg-bg-elevated px-2g py-1g">
        <Pressable
          onPress={onTranscribe}
          disabled={transcribing}
          className={`flex-1 items-center rounded-full border border-fg py-1g ${
            transcribing ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-sm font-semibold text-fg">
            {transcribing
              ? transcription.state.kind === 'transcribing'
                ? `Transcribing ${Math.round(transcription.state.progress)}%`
                : 'Loading model…'
              : note.transcript.length
                ? 'Re-transcribe'
                : 'Transcribe'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onSummarize}
          disabled={summarizing || note.transcript.length === 0}
          className={`flex-1 items-center rounded-full bg-accent py-1g ${
            summarizing || note.transcript.length === 0 ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-sm font-semibold text-fg">
            {summarizing ? 'Summarizing…' : 'Summarize'}
          </Text>
        </Pressable>
      </View>
      {transcription.state.kind === 'error' ? (
        <Text className="bg-bg-elevated px-2g py-0.5g text-xs text-accent">
          {transcription.state.message}
        </Text>
      ) : null}
      {summary.state.kind === 'error' ? (
        <Text className="bg-bg-elevated px-2g py-0.5g text-xs text-accent">
          {summary.state.message}
        </Text>
      ) : null}
    </View>
  );
}
