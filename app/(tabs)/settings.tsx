import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { isSupabaseConfigured } from '@/lib/supabase';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border py-1g">
      <Text className="text-sm text-fg-muted">{label}</Text>
      <Text className="text-sm text-fg">{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-3g">
      <Text className="mb-1g text-xs uppercase tracking-widest text-fg-subtle">{title}</Text>
      <View className="rounded-2xl border border-border bg-bg-card px-2g">{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="px-2g pb-3g pt-2g">
        <Text className="mb-2g text-3xl font-semibold text-fg">Settings</Text>

        <Section title="Privacy">
          <View className="py-1g">
            <Text className="text-sm leading-5 text-fg">
              Audio never leaves your device. Transcription and summarization run fully on-device.
            </Text>
          </View>
        </Section>

        <Section title="Models">
          <Row label="Whisper" value="Tiny (default)" />
          <Row label="Summarizer" value="Phi-3 Mini (coming soon)" />
        </Section>

        <Section title="Sync">
          <Row label="Cloud sync" value={isSupabaseConfigured ? 'Configured' : 'Local only'} />
        </Section>

        <Section title="About">
          <Row label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
          <Row label="Build" value={Constants.expoConfig?.slug ?? 'vox'} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
