import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

type Props = {
  recording: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function RecordButton({ recording, disabled, onPress }: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (recording) {
      pulse.value = withRepeat(withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [recording, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: recording ? 0.35 : 0,
  }));

  return (
    <View className="items-center justify-center">
      <Animated.View
        pointerEvents="none"
        style={ringStyle}
        className="absolute h-32 w-32 rounded-full bg-accent"
      />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`h-24 w-24 items-center justify-center rounded-full border-2 ${
          recording ? 'border-accent bg-accent' : 'border-fg bg-bg-elevated'
        } ${disabled ? 'opacity-40' : ''}`}
      >
        <View
          className={`${
            recording ? 'h-8 w-8 rounded-md bg-fg' : 'h-14 w-14 rounded-full bg-accent'
          }`}
        />
      </Pressable>
    </View>
  );
}
