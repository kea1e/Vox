import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { deleteNote, listNotes, searchNotes } from '@/lib/db';
import { NoteCard } from '@/components/NoteCard';
import type { Note } from '@/types';

export default function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const queryRef = useRef(query);
  queryRef.current = query;

  const load = useCallback(async (q: string) => {
    const rows = q.trim() ? await searchNotes(q) : await listNotes();
    setNotes(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(queryRef.current);
    }, [load]),
  );

  useEffect(() => {
    const t = setTimeout(() => load(query), 200);
    return () => clearTimeout(t);
  }, [query, load]);

  const onDelete = useCallback(
    (note: Note) => {
      Alert.alert('Delete note?', `“${note.title}” will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(note.id);
            load(queryRef.current);
          },
        },
      ]);
    },
    [load],
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="px-2g pb-1g pt-2g">
        <Text className="text-3xl font-semibold text-fg">Library</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search transcripts"
          placeholderTextColor="#52525b"
          autoCorrect={false}
          autoCapitalize="none"
          className="mt-2g rounded-xl border border-border bg-bg-elevated px-1g py-1g text-fg"
        />
        {notes.length > 0 ? (
          <Text className="mt-1g text-xs text-fg-subtle">Long-press a note to delete</Text>
        ) : null}
      </View>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerClassName="px-2g pb-3g"
        ItemSeparatorComponent={() => <View className="h-1g" />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text className="mt-5g text-center text-fg-muted">
            {query ? 'No matches' : 'No notes yet'}
          </Text>
        }
        renderItem={({ item }) => <NoteCard note={item} onLongPress={() => onDelete(item)} />}
      />
    </SafeAreaView>
  );
}
