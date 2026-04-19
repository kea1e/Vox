import { View } from 'react-native';

const BAR_COUNT = 48;

type Props = {
  levels: number[];
  active: boolean;
};

export function WaveformVisualizer({ levels, active }: Props) {
  const padded =
    levels.length >= BAR_COUNT
      ? levels.slice(-BAR_COUNT)
      : [...new Array<number>(BAR_COUNT - levels.length).fill(0), ...levels];

  return (
    <View className="h-32 w-full flex-row items-center justify-center gap-[2px] px-2g">
      {padded.map((lvl, i) => {
        const h = Math.max(4, lvl * 120);
        return (
          <View
            key={i}
            className={active ? 'rounded-full bg-accent' : 'rounded-full bg-fg-subtle'}
            style={{ width: 3, height: h, opacity: active ? 0.6 + lvl * 0.4 : 0.4 }}
          />
        );
      })}
    </View>
  );
}
