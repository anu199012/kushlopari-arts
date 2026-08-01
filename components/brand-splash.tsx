import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const SPLASH_MIN_MS = 2200;

type BrandSplashProps = {
  ready: boolean;
  onFinish: () => void;
};

export function BrandSplash({ ready, onFinish }: BrandSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const [visible, setVisible] = useState(true);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [scale]);

  useEffect(() => {
    if (!ready) return;

    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(0, SPLASH_MIN_MS - elapsed);

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) {
          setVisible(false);
          onFinish();
        }
      });
    }, wait);

    return () => clearTimeout(timer);
  }, [ready, opacity, onFinish]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.overlay, { opacity }]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>D I L E E P   K A M P A T I</Text>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image
            source={require('@/assets/images/artist.png')}
            style={styles.logo}
            contentFit="cover"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
  },
  title: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
  },
});
