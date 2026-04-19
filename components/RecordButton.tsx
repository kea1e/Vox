import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

type Props = {
  recording: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function RecordButton({ recording, disabled, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recording) {
      opacity.setValue(0.35);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.18,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      scale.setValue(1);
      opacity.setValue(0);
    }
  }, [recording, scale, opacity]);

  return (
    <View className="items-center justify-center">
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', transform: [{ scale }], opacity }}
        className="h-32 w-32 rounded-full bg-accent"
      />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`h-24 w-24 items-center justify-center rounded-full border-2 ${
          recording ? 'border-accent bg-accent' : 'border-fg bg-bg-elevated'
        } ${disabled ? 'opacity-40' : ''}`}
      >
        <View
          className={
            recording ? 'h-8 w-8 rounded-md bg-fg' : 'h-14 w-14 rounded-full bg-accent'
          }
        />
      </Pressable>
    </View>
  );
}
