import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { BrandSplash } from '@/components/brand-splash';
import { OrderButton } from '@/components/order-button';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function CategoryLayout() {
  const [loaded] = useFonts({
    ...Ionicons.font,
  });
  const [showBrandSplash, setShowBrandSplash] = useState(true);
  const pathname = usePathname();
  const isAdminRoute = pathname?.includes('/admin');

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (isAdminRoute) {
      setShowBrandSplash(false);
    }
  }, [isAdminRoute]);

  const onBrandSplashFinish = useCallback(() => {
    setShowBrandSplash(false);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        {!showBrandSplash && !isAdminRoute ? <OrderButton /> : null}
        {showBrandSplash && !isAdminRoute ? (
          <BrandSplash ready={loaded} onFinish={onBrandSplashFinish} />
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}
