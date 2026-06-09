import React from 'react';
import { useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore, useSettingsStore } from '../store';
import { Colors } from '../theme';
import { Tau } from '../components';

import OnboardingScreen from '../screens/OnboardingScreen';
import PhoneScreen from '../screens/PhoneScreen';
import OtpScreen from '../screens/OtpScreen';
import SyncScreen from '../screens/SyncScreen';
import TodayScreen from '../screens/TodayScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ReadingsScreen from '../screens/ReadingsScreen';
import NotesScreen from '../screens/NotesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Tab icons ──────────────────────────────────────────────────
const CAL_ICON = ({ color }) => <TabIcon label="◻" color={color} />;
const BOOK_ICON = ({ color }) => <TabIcon label="☰" color={color} />;
const NOTE_ICON = ({ color }) => <TabIcon label="◻" color={color} />;
const USER_ICON = ({ color }) => <TabIcon label="○" color={color} />;

function TabIcon({ color, label }) {
  return (
    <View
      style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* replace with react-native-svg icons if desired */}
    </View>
  );
}

// ── Main tabs ──────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: Colors.border.default,
          paddingTop: 6,
          height: 56,
        },
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.ink.muted,
      }}
    >
      <Tab.Screen
        name="Hoy"
        component={TodayScreen}
        options={{ tabBarIcon: ({ color }) => <Tau size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{ tabBarIcon: CAL_ICON }}
      />
      <Tab.Screen
        name="Lecturas"
        component={ReadingsScreen}
        options={{ tabBarIcon: BOOK_ICON }}
      />
      <Tab.Screen
        name="Notas"
        component={NotesScreen}
        options={{ tabBarIcon: NOTE_ICON }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: USER_ICON }}
      />
    </Tab.Navigator>
  );
}

// ── Auth stack ─────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Sync" component={SyncScreen} />
    </Stack.Navigator>
  );
}

// ── Root ───────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();
  const { darkMode } = useSettingsStore();
  const scheme = useColorScheme();
  const theme = darkMode === 'auto' ? scheme : darkMode;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
