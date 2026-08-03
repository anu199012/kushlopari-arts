import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AppHeaderProps = {
  /** Extra content on the right (e.g. search) */
  right?: React.ReactNode;
  /** Show back button to Home instead of hamburger */
  showBack?: boolean;
};

export function AppHeader({ right, showBack = false }: AppHeaderProps) {
  const router = useRouter();

  const goExplore = () => {
    router.push('/(tabs)/explore');
  };

  const goHome = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={goHome}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={goExplore}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open explore"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="menu" size={26} color="#fff" />
          </Pressable>
        )}

        <Pressable
          onPress={showBack ? goHome : goExplore}
          accessibilityRole="button"
          accessibilityLabel={
            showBack ? 'Kushalopari Arts home' : 'Kushalopari Arts explore'
          }
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={styles.title}>Kushalopari Arts 🎨</Text>
        </Pressable>
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  iconBtn: {
    padding: 2,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  right: {
    flex: 1,
    maxWidth: 260,
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
