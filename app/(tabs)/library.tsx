import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { deleteNote, listNotes, searchNotes } from '@/lib/db';
import { NoteCard } from '@/components/NoteCard';
import type { Note } from '@/types';

export default function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);

  const load = useCallback(async () => {
    const rows = query.trim() ? await searchNotes(query) : await listNotes();
    setNotes(rows);
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const onDelete = (note: Note) => {
    Alert.alert('Delete note?', `“${note.title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(note.id);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="px-2g pb-1g pt-2g">
        <Text className="text-3xl font-semibold text-fg">Library</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search transcripts"
          placeholderTextColor="#52525b"
          className="mt-2g rounded-xl border border-border bg-bg-elevated px-1g py-1g text-fg"
        />
      </View>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerClassName="px-2g pb-3g"
        ItemSeparatorComponent={() => <View className="h-1g" />}
        ListEmptyComponent={
          <Text className="mt-5g text-center text-fg-muted">
            {query ? 'No matches' : 'No notes yet'}
          </Text>
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                onPress={() => onDelete(item)}
                className="my-0.5g ml-1g items-center justify-center rounded-2xl bg-accent px-2g"
              >
                <Text className="font-semibold text-fg">Delete</Text>
              </Pressable>
            )}
          >
            <NoteCard note={item} />
          </Swipeable>
        )}
      />
    </SafeAreaView>
  );
}
