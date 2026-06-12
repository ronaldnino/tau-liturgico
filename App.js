import React, { useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import appCheck from '@react-native-firebase/app-check';
import Config from 'react-native-config';
import AppNavigator from './src/navigation';

async function initAppCheck() {
  try {
    const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: { provider: __DEV__ ? 'debug' : 'playIntegrity' },
      apple: { provider: __DEV__ ? 'debug' : 'appAttest' },
    });
    await appCheck().initializeAppCheck({
      provider,
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    if (__DEV__) console.warn('[AppCheck] init error:', e.message);
  }
}

function EnvBadge() {
  const insets = useSafeAreaInsets();
  if (Config.ENV !== 'development') return null;
  return (
    <View style={[s.badge, { top: insets.top + 6 }]} pointerEvents="none">
      <Text style={s.badgeText}>DEV</Text>
    </View>
  );
}

export default function App() {
  useEffect(() => {
    initAppCheck();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
        <EnvBadge />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FF3B30CC',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
