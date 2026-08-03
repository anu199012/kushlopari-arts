import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TabTwoScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 700;
  // Square artist.png — size header so the full image fits without cropping
  const headerHeight = Math.min(Math.max(width - 32, 280), 560);

  // Open links in new tab on web, external browser on native
  const openExternal = (url: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(url).catch(() => {
      alert('Unable to open link right now.');
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <AppHeader showBack />
      </View>
      <ParallaxScrollView
      headerBackgroundColor={{ light: '#000', dark: '#000' }}
      headerHeight={headerHeight}
      headerImage={
        <View style={[styles.headerWrapper, { height: headerHeight }]}>
          <Image
            source={require('@/assets/images/artist.png')}
            style={styles.headerImage}
            contentFit="contain"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)']}
            style={styles.headerGradient}
          />
        </View>
      }
    >
      {/* Black info card */}
      <ThemedView style={styles.blackCard}>
        <ThemedText style={styles.description}>
          I was passionate about art and craft since my childhood days and this led me to
          start my own venture. I am handling all the aspects of this business.
          Open 24 hours.
        </ThemedText>

        {/* Social Buttons: responsive */}
        <View style={[styles.socialRow, isSmall ? styles.socialRowStack : null]}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#1877F2' }, isSmall ? styles.socialButtonFull : null]}
            onPress={() => openExternal('https://www.facebook.com/kushalopari')}
            activeOpacity={0.85}
            accessibilityLabel="Open Facebook"
          >
            <Ionicons name="logo-facebook" size={18} color="#fff" style={styles.iconLeft} />
            <ThemedText style={styles.socialText}>Facebook</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#E4405F' }, isSmall ? styles.socialButtonFull : null]}
            onPress={() => openExternal('https://www.instagram.com/kushalopari/')}
            activeOpacity={0.85}
            accessibilityLabel="Open Instagram"
          >
            <Ionicons name="logo-instagram" size={18} color="#fff" style={styles.iconLeft} />
            <ThemedText style={styles.socialText}>Instagram</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#4285F4' }, isSmall ? styles.socialButtonFull : null]}
            onPress={() => openExternal('https://www.google.com/viewer/place?mid=/g/11r9vxfc66')}
            activeOpacity={0.85}
            accessibilityLabel="Open Google"
          >
            <Ionicons name="location-outline" size={18} color="#fff" style={styles.iconLeft} />
            <ThemedText style={styles.socialText}>Google</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#F15A22' }, isSmall ? styles.socialButtonFull : null]}
            onPress={() =>
              openExternal(
                'https://www.justdial.com/Hyderabad/Kushalopari-Arts-Opposite-Sbi-Bank-Sri-Ram-Nagar-Kondapur/040PXX40-XX40-220921151842-E6A7_BZDET'
              )
            }
            activeOpacity={0.85}
            accessibilityLabel="Open JustDial"
          >
            <Ionicons name="business-outline" size={18} color="#fff" style={styles.iconLeft} />
            <ThemedText style={styles.socialText}>JustDial</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ParallaxScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* header wrapper used so gradient can overlay the image */
  headerWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },

  /* Black card section */
  blackCard: {
    backgroundColor: '#000',
    padding: 22,
    marginHorizontal: 12,
    marginVertical: 18,
    borderRadius: 18,
    // subtle gold border for premium look
    borderWidth: 1,
    borderColor: 'rgba(184,134,11,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  artistName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  subtitle: {
    color: '#cfcfcf',
    marginBottom: 12,
  },

  description: {
    color: '#e6e6e6',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  /* Social row */
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialRowStack: {
    flexDirection: 'column',
    gap: 10,
  },

  socialButton: {
    flexGrow: 1,
    flexBasis: 140,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
  },
  socialButtonFull: {
    width: '100%',
  },

  iconLeft: {
    marginRight: 10,
  },

  socialText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
