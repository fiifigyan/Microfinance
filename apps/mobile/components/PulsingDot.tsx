import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export function PulsingDot({ color = "#F59E0B", size = 8 }: { color?: string; size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={[styles.wrap, { width: size * 2.5, height: size * 2.5 }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 2.2,
            height: size * 2.2,
            borderRadius: size * 1.1,
            borderColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: "center", alignItems: "center" },
  ring: { position: "absolute", borderWidth: 1.5 },
  dot: {},
});
