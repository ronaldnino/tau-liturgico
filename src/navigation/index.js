import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useAuthStore, useSettingsStore } from '../store';
import { Colors } from '../theme';

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

const IC = 22;
const SW = 1.6;

// Hoy: glifo tau geometrico (linea horizontal + fuste vertical)
function IconHoy({ color }) {
  return (
    <Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={SW + 0.4} strokeLinecap="round" />
      <Line x1="12" y1="7" x2="12" y2="19" stroke={color} strokeWidth={SW + 0.4} strokeLinecap="round" />
    </Svg>
  );
}

// Calendario: cuadrícula de mes con encabezado
function IconCalendario({ color }) {
  return (
    <Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none">
      {/* Cuerpo del calendario */}
      <Rect x="3" y="4" width="18" height="17" rx="2.5" stroke={color} strokeWidth={SW} />
      {/* Banda superior */}
      <Rect x="3" y="4" width="18" height="6" rx="2.5" fill={color} />
      {/* Argollas */}
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={SW + 0.4} strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={SW + 0.4} strokeLinecap="round" />
      {/* Puntos de días: fila 1 */}
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      {/* Puntos de días: fila 2 */}
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

// Lecturas: libro abierto con lomo central
function IconLecturas({ color }) {
  return (
    <Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none">
      {/* Página izquierda */}
      <Path
        d="M12 6 C9 5 6 5.5 3 7 L3 19 C6 17.5 9 17 12 18 Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* Página derecha */}
      <Path
        d="M12 6 C15 5 18 5.5 21 7 L21 19 C18 17.5 15 17 12 18 Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* Lomo */}
      <Line x1="12" y1="6" x2="12" y2="18" stroke={color} strokeWidth={SW} />
      {/* Líneas de texto izquierda */}
      <Line x1="6" y1="10.5" x2="10.5" y2="9.8" stroke={color} strokeWidth={SW - 0.6} strokeLinecap="round" />
      <Line x1="6" y1="13" x2="10.5" y2="12.3" stroke={color} strokeWidth={SW - 0.6} strokeLinecap="round" />
      {/* Líneas de texto derecha */}
      <Line x1="13.5" y1="9.8" x2="18" y2="10.5" stroke={color} strokeWidth={SW - 0.6} strokeLinecap="round" />
      <Line x1="13.5" y1="12.3" x2="18" y2="13" stroke={color} strokeWidth={SW - 0.6} strokeLinecap="round" />
    </Svg>
  );
}

// Notas: hoja con renglones y esquina doblada
function IconNotas({ color }) {
  return (
    <Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none">
      {/* Hoja */}
      <Path
        d="M5 3 H16 L20 7 V21 H5 Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* Esquina doblada */}
      <Path
        d="M16 3 L16 7 L20 7"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* Renglones */}
      <Line x1="8.5" y1="11" x2="15.5" y2="11" stroke={color} strokeWidth={SW - 0.4} strokeLinecap="round" />
      <Line x1="8.5" y1="14" x2="15.5" y2="14" stroke={color} strokeWidth={SW - 0.4} strokeLinecap="round" />
      <Line x1="8.5" y1="17" x2="13" y2="17" stroke={color} strokeWidth={SW - 0.4} strokeLinecap="round" />
    </Svg>
  );
}

// Perfil: silueta de persona con círculo de cabeza
function IconPerfil({ color }) {
  return (
    <Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none">
      {/* Cabeza */}
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={SW} />
      {/* Cuerpo / hombros */}
      <Path
        d="M4 20 C4 16 7.5 13.5 12 13.5 C16.5 13.5 20 16 20 20"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// -- Main tabs────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: Colors.border.default,
          paddingTop: 4,
          paddingBottom: 6,
          height: 60,
        },
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.ink.muted,
      }}
    >
      <Tab.Screen
        name="Hoy"
        component={TodayScreen}
        options={{ tabBarIcon: ({ color }) => <IconHoy color={color} /> }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{ tabBarIcon: ({ color }) => <IconCalendario color={color} /> }}
      />
      <Tab.Screen
        name="Lecturas"
        component={ReadingsScreen}
        options={{ tabBarIcon: ({ color }) => <IconLecturas color={color} /> }}
      />
      <Tab.Screen
        name="Notas"
        component={NotesScreen}
        options={{ tabBarIcon: ({ color }) => <IconNotas color={color} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <IconPerfil color={color} /> }}
      />
    </Tab.Navigator>
  );
}

// -- Auth stack───────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Sync" component={SyncScreen} />
    </Stack.Navigator>
  );
}

// -- Root─────────────────────────────────────────────────────
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
