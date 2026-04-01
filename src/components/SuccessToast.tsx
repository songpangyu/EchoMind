import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, typography } from '../theme';

interface SuccessToastProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  icon?: string;
  duration?: number;
  onHide?: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  visible,
  title = 'Success!',
  subtitle,
  icon = '✓',
  duration = 1800,
  onHide,
}) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      scale.setValue(0.3);
      opacity.setValue(0);
      checkScale.setValue(0);
      ringScale.setValue(0.5);
      ringOpacity.setValue(0);
      shimmer.setValue(0);

      // Entrance animation sequence
      Animated.parallel([
        // Backdrop fade in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Card spring in
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After card appears, animate the checkmark
        Animated.parallel([
          // Checkmark pops in
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
          // Ring pulse
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ringScale, {
                toValue: 1.6,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(ringOpacity, {
                toValue: 0.6,
                duration: 150,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
          // Shimmer glow
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();

        // Auto-dismiss
        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onHide?.();
          });
        }, duration);

        return () => clearTimeout(timer);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.4, 0],
  });

  return (
    <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none">
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />

        {/* Shimmer overlay */}
        <Animated.View style={[styles.shimmerOverlay, { opacity: shimmerOpacity }]} />

        {/* Icon circle */}
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: checkScale }] }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </Animated.View>

        {/* Text */}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Decorative dots */}
        <View style={styles.dotsRow}>
          {[0.3, 0.5, 0.8, 1, 0.8, 0.5, 0.3].map((op, i) => (
            <View key={i} style={[styles.dot, { opacity: op }]} />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 15, 12, 0.65)',
    zIndex: 9999,
  },
  card: {
    backgroundColor: 'rgba(15, 40, 32, 0.95)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(126, 200, 160, 0.35)',
    shadowColor: colors.mintGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    minWidth: 200,
  },
  glowRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.mintGreen,
    top: '50%',
    marginTop: -60,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.mintGreen,
    borderRadius: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(126, 200, 160, 0.15)',
    borderWidth: 2,
    borderColor: colors.mintGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.mintGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  iconText: {
    fontSize: 32,
    color: colors.mintGreen,
    fontWeight: '700',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mintGreen,
  },
});
