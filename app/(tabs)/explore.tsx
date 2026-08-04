import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
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

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    url: 'https://www.facebook.com/kushalopari',
    color: '#1877F2',
    textColor: '#fff',
    iconColor: '#fff',
    icon: 'logo-facebook' as const,
  },
  {
    label: 'Instagram',
    url: 'https://www.instagram.com/kushalopari/',
    color: '#E4405F',
    textColor: '#fff',
    iconColor: '#fff',
    icon: 'logo-instagram' as const,
  },
  {
    label: 'Google',
    url: 'https://www.google.com/viewer/place?mid=/g/11r9vxfc66',
    color: '#FFFFFF',
    textColor: '#3c4043',
    iconColor: '#4285F4',
    icon: 'logo-google' as const,
  },
  {
    label: 'JustDial',
    url: 'https://www.justdial.com/Hyderabad/Kushalopari-Arts-Opposite-Sbi-Bank-Sri-Ram-Nagar-Kondapur/040PXX40-XX40-220921151842-E6A7_BZDET',
    color: '#F15A22',
    textColor: '#fff',
    iconColor: '#fff',
    icon: 'business-outline' as const,
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function TabTwoScreen() {
  const { width } = useWindowDimensions();

  const layout = useMemo(() => {
    // Breakpoints tuned for phone → 13" laptop → large desktop
    const isPhone = width < 600;
    const isLaptop = width >= 600 && width < 1280;
    const isDesktop = width >= 1280;

    const contentMax = isPhone ? width : isLaptop ? 1180 : 1280;
    const columnWidth = Math.min(width, contentMax);
    const sidePad = isPhone ? 24 : 40;
    const innerWidth = Math.max(columnWidth - sidePad, 280);
    const gap = isPhone ? 10 : 14;

    // Fixed button sizes (no stretch → avoids awkward 3+1 wrap)
    const buttonWidth = isPhone ? 150 : 160;
    const buttonHeight = isPhone ? 38 : 42;
    const fourNeed = buttonWidth * 4 + gap * 3;
    const columns = innerWidth >= fourNeed ? 4 : 2;
    const rowMax = buttonWidth * columns + gap * (columns - 1);

    // Image: taller on phone, wider/shorter feel on laptop/desktop
    const headerHeight = isPhone
      ? clamp(width * 0.55, 220, 340)
      : isLaptop
        ? clamp(columnWidth * 0.34, 320, 420)
        : clamp(columnWidth * 0.3, 340, 460);

    const descFontSize = isPhone ? 14 : isLaptop ? 15 : 16;
    const descLineHeight = isPhone ? 20 : isLaptop ? 22 : 24;
    const descMaxWidth = isPhone ? innerWidth : Math.min(720, innerWidth);
    const cardPadding = isPhone ? 16 : 24;
    const fontSize = 13;
    const iconSize = 16;

    return {
      contentMax,
      headerHeight,
      gap,
      columns,
      buttonWidth,
      buttonHeight,
      fontSize,
      iconSize,
      rowMax,
      descFontSize,
      descLineHeight,
      descMaxWidth,
      cardPadding,
    };
  }, [width]);

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
    <SafeAreaView style={styles.safe}>
      <View style={[styles.column, { maxWidth: layout.contentMax }]}>
        <View style={styles.headerPad}>
          <AppHeader showBack />
        </View>

        <ParallaxScrollView
          headerBackgroundColor={{ light: '#000', dark: '#000' }}
          headerHeight={layout.headerHeight}
          contentStyle={styles.parallaxContent}
          headerImage={
            <View style={[styles.headerWrapper, { height: layout.headerHeight }]}>
              <Image
                source={require('@/assets/images/artist.png')}
                style={styles.headerImage}
                contentFit="cover"
                contentPosition="top"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)']}
                style={styles.headerGradient}
              />
            </View>
          }
        >
          <ThemedView style={[styles.blackCard, { padding: layout.cardPadding }]}>
            <ThemedText
              style={[
                styles.description,
                {
                  fontSize: layout.descFontSize,
                  lineHeight: layout.descLineHeight,
                  maxWidth: layout.descMaxWidth,
                },
              ]}
            >
              I was passionate about art and craft since my childhood days and this led me to
              start my own venture. I am handling all the aspects of this business.
              Open 24 hours.
            </ThemedText>

            <View
              style={[
                styles.socialRow,
                {
                  gap: layout.gap,
                  width: layout.rowMax,
                },
              ]}
            >
              {SOCIAL_LINKS.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: link.color,
                      width: layout.buttonWidth,
                      height: layout.buttonHeight,
                    },
                    link.label === 'Google' && styles.googleButton,
                  ]}
                  onPress={() => openExternal(link.url)}
                  activeOpacity={0.85}
                  accessibilityLabel={`Open ${link.label}`}
                >
                  <Ionicons
                    name={link.icon}
                    size={layout.iconSize}
                    color={link.iconColor}
                    style={styles.iconLeft}
                  />
                  <ThemedText
                    style={[
                      styles.socialText,
                      { fontSize: layout.fontSize, color: link.textColor },
                    ]}
                  >
                    {link.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>
        </ParallaxScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
  },
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  parallaxContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    alignItems: 'center',
  },
  headerWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
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
  blackCard: {
    backgroundColor: '#111',
    width: '100%',
    maxWidth: 1100,
    marginVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(184,134,11,0.08)',
    alignItems: 'center',
  },
  description: {
    color: '#e6e6e6',
    textAlign: 'center',
    marginBottom: 18,
    alignSelf: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    flexGrow: 0,
    flexShrink: 0,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  iconLeft: {
    marginRight: 8,
  },
  socialText: {
    fontWeight: '600',
  },
});
