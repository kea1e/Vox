import { ScrollView, Text, View } from 'react-native';

type Props = {
  summary: string | null;
  takeaways: string[];
};

export function SummaryPanel({ summary, takeaways }: Props) {
  if (!summary && takeaways.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-3g">
        <Text className="text-center text-sm italic text-fg-subtle">
          Tap “Summarize” on this note to generate a summary on-device.
        </Text>
      </View>
    );
  }
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-1g py-2g gap-3g">
      {summary ? (
        <View>
          <Text className="mb-1g text-xs uppercase tracking-wider text-fg-subtle">Summary</Text>
          <Text className="text-base leading-6 text-fg">{summary}</Text>
        </View>
      ) : null}
      {takeaways.length > 0 ? (
        <View>
          <Text className="mb-1g text-xs uppercase tracking-wider text-fg-subtle">Key takeaways</Text>
          <View className="gap-1g">
            {takeaways.map((t, i) => (
              <View key={i} className="flex-row gap-1g">
                <Text className="text-fg-muted">•</Text>
                <Text className="flex-1 text-sm leading-5 text-fg">{t}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
