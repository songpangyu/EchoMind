import React, { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';

export const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useFocusEffect(
    useCallback(() => {
      // 重置
      opacity.setValue(0);
      translateY.setValue(30);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // 👇 离开页面时（关键）
      return () => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      };
    }, [])
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.background, // ⭐ 防止露白
        opacity,
        transform: [{ translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
};