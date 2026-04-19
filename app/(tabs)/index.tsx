import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { listNotes } from '@/lib/db';
import { NoteCard } from '@/components/NoteCard';
import type { Note } from '@/types';

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const rows = await listNotes();
    setNotes(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="px-2g pb-1g pt-2g">
        <Text className="text-3xl font-semibold text-fg">Vox</Text>
        <Text className="mt-1 text-sm text-fg-muted">Private, on-device notes from voice</Text>
      </View>
      <FlatList
        data={notes.slice(0, 10)}
        keyExtractor={(n) => n.id}
        contentContainerClassName="px-2g pb-3g gap-1g"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f5f5f5" />}
        ItemSeparatorComponent={() => <View className="h-1g" />}
        ListEmptyComponent={
          <View className="mt-8g items-center gap-1g px-2g">
            <Text className="text-center text-base text-fg-muted">No recordings yet.</Text>
            <Pressable
              onPress={() => router.push('/record')}
              className="mt-1g rounded-full bg-accent px-3g py-1g"
            >
              <Text className="font-semibold text-fg">Start your first recording</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <NoteCard note={item} />}
      />
    </SafeAreaView>
  );
}
