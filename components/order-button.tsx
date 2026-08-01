import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WHATSAPP_URL } from '@/constants/order';

export function OrderButton() {
  const insets = useSafeAreaInsets();

  const openWhatsApp = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(WHATSAPP_URL).catch(() => {
      alert('Unable to open WhatsApp right now.');
    });
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 16) }]}
    >
      <Pressable
        onPress={openWhatsApp}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Chat on WhatsApp"
      >
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pressed: {
    opacity: 0.85,
  },
});
