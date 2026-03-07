import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const Particle: React.FC<{ delay: number; x: number; y: number }> = ({ delay, x, y }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value * 0.6,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: x, top: y },
        animatedStyle,
      ]}
    />
  );
};

export const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    delay: Math.random() * 3000,
  }));

  return (
    <View style={styles.container}>
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} y={p.y} delay={p.delay} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9fdfb0',
    shadowColor: '#9fdfb0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
