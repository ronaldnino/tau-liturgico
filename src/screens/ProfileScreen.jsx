import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  useColorScheme,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { ensureCameraPermission } from '../utils/permissions';
import Svg, { Path, Line, Circle, Rect, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useSettingsStore, useAuthStore, useNotesStore, useProfileStore } from '../store';
import { CYCLE, TODAY } from '../data/liturgical';
import { clearTTSCache, DEFAULT_VOICE_ID } from '../services/elevenlabs';
import { saveProfile, uploadProfilePhoto } from '../services/profile';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const _Tts = () => require('react-native-tts').default;

const TABS = [
  { id: 'perfil', label: 'Feligrés', Icon: IcoUser, color: Colors.brand.primary },
  { id: 'apariencia', label: 'Apariencia', Icon: IcoSliders, color: '#FF9F0A' },
  { id: 'voz', label: 'Voz', Icon: IcoMic, color: '#30D158' },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    Icon: IcoStar,
    color: Colors.liturgicalUI.gold,
    premium: true,
  },
  { id: 'app', label: 'App', Icon: IcoGear, color: '#0A84FF' },
];

// ── Iconos SVG ────────────────────────────────────────────────────────────────

function IcoUser({ c, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={1.6} />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IcoPencil({ c, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Placeholder de avatar con badge de cámara (preparado para image upload)
function AvatarPlaceholder({ size = 76, accentColor, badgeBg = Colors.surface.primary }) {
  const r = size / 2;
  // Silhouette: cabeza + arco de hombros
  const headR = size * 0.22;
  const headCY = size * 0.36;
  const bodyRX = size * 0.34;
  const bodyRY = size * 0.26;
  const bodyCY = size * 0.78;

  // Badge de cámara
  const badgeSize = size * 0.32;
  const badgeR = badgeSize / 2;

  return (
    <View style={{ width: size, height: size }}>
      {/* Círculo principal */}
      <Svg width={size} height={size}>
        {/* Fondo */}
        <Circle cx={r} cy={r} r={r} fill={accentColor + '18'} />
        {/* Cabeza */}
        <Circle cx={r} cy={headCY} r={headR} fill={accentColor + '55'} />
        {/* Hombros / cuerpo */}
        <Path
          d={`M ${r - bodyRX} ${bodyCY} a ${bodyRX} ${bodyRY} 0 0 1 ${bodyRX * 2} 0 Z`}
          fill={accentColor + '55'}
        />
      </Svg>

      {/* Badge cámara */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeR,
          backgroundColor: accentColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: badgeBg,
        }}
      >
        <Svg
          width={badgeSize * 0.58}
          height={badgeSize * 0.58}
          viewBox="0 0 24 24"
          fill="none"
        >
          <Path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
            stroke="#fff"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth={1.8} />
        </Svg>
      </View>
    </View>
  );
}

function IcoMoon({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoSun({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={c} strokeWidth={1.8} />
      <Path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function IcoAuto({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={1.8} />
      <Path
        d="M12 3v9l5 3"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoMic({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="2" width="6" height="11" rx="3" stroke={c} strokeWidth={1.8} />
      <Path
        d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function IcoWave({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function IcoBell({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoInfo({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.8} />
      <Line
        x1="12"
        y1="8"
        x2="12"
        y2="8.5"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="12"
        x2="12"
        y2="16"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function IcoPower({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoCheck({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="20 6 9 17 4 12"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoChevron({ c, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoKey({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoStar({ c, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={c}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}
function IcoLink({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoSliders({ c, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="4"
        y1="21"
        x2="4"
        y2="14"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="4"
        y1="10"
        x2="4"
        y2="3"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="21"
        x2="12"
        y2="12"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="8"
        x2="12"
        y2="3"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="20"
        y1="21"
        x2="20"
        y2="16"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="20"
        y1="12"
        x2="20"
        y2="3"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="1"
        y1="14"
        x2="7"
        y2="14"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="9"
        y1="8"
        x2="15"
        y2="8"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="17"
        y1="16"
        x2="23"
        y2="16"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function IcoGear({ c, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={1.8} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcoRepeat({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 1l4 4-4 4"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 11V9a4 4 0 0 1 4-4h14"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 23l-4-4 4-4"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 13v2a4 4 0 0 1-4 4H3"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoBookOpen({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoCalGrid({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth={1.8} />
      <Line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const {
    darkMode,
    setDarkMode,
    ttsSpeed,
    setTtsSpeed,
    ttsVoiceId,
    setTtsVoiceId,
    elevenlabsApiKey,
    setElevenlabsApiKey,
    elevenlabsVoiceId,
    setElevenlabsVoiceId,
    dailyReminder,
    setDailyReminder,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('perfil');
  const [showApiKey, setShowApiKey] = useState(false);
  const [systemVoices, setSystemVoices] = useState([]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(true); // carga al montar

  const { notes } = useNotesStore();
  const { phone, logout } = useAuthStore();
  const { displayName, photoURL, clearProfile } = useProfileStore();
  const profileStore = useProfileStore();

  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');
  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const seasonColor = Colors.liturgicalUI[TODAY.seasonColor] ?? Colors.liturgicalUI.green;

  // Fetch puro: sin setState síncrono (incluso un throw de _Tts se maneja en el
  // .catch asíncrono), para poder llamarlo desde el efecto de montaje sin avisos.
  const fetchVoices = () => {
    Promise.resolve()
      .then(() => _Tts().voices())
      .then((voices) => {
        const list = Array.isArray(voices) ? voices : [];
        const es = list.filter((v) => v.language && /^es/i.test(v.language));
        setSystemVoices(es.length > 0 ? es : list);
        setVoicesLoading(false);
      })
      .catch(() => setVoicesLoading(false));
  };

  // Reintento manual desde la UI: aquí sí mostramos el spinner antes de recargar
  const loadVoices = () => {
    setVoicesLoading(true);
    fetchVoices();
  };

  useEffect(() => {
    fetchVoices();
    try {
      if (ttsVoiceId)
        _Tts()
          .setDefaultVoice(ttsVoiceId)
          .catch(() => {});
    } catch (_) {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          clearProfile();
          logout();
        },
      },
    ]);
  };

  const hasEleven = !!(elevenlabsApiKey && elevenlabsApiKey.trim().length > 0);

  const ctx = { ink, muted, border, surface, dark };

  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[1]}
    >
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <View style={[s.hero, { backgroundColor: surface }]}>
        <View style={{ paddingTop: insets.top + 10 }} />
        <View style={[s.heroStripe, { backgroundColor: seasonColor }]} />

        {/* Avatar */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab('perfil')}
          style={[s.avatar, { borderColor: Colors.brand.primary + '30' }]}
        >
          {photoURL ? (
            <Image
              source={{ uri: photoURL }}
              style={{ width: 76, height: 76, borderRadius: 38 }}
            />
          ) : (
            <AvatarPlaceholder
              size={76}
              accentColor={Colors.brand.primary}
              badgeBg={surface}
            />
          )}
        </TouchableOpacity>

        {displayName ? (
          <Text style={[s.heroName, { color: ink }]}>{displayName}</Text>
        ) : null}
        <Text style={[s.heroPhone, { color: displayName ? muted : ink }]}>
          {phone || '+502 0000-0000'}
        </Text>

        <View
          style={[
            s.heroBadge,
            { backgroundColor: seasonColor + '18', borderColor: seasonColor + '40' },
          ]}
        >
          <View style={[s.heroBadgeDot, { backgroundColor: seasonColor }]} />
          <Text style={[s.heroBadgeText, { color: seasonColor }]}>{CYCLE.fullLabel}</Text>
        </View>

        <View style={[s.statsRow, { borderTopColor: border }]}>
          <StatItem value={notes.length} label="Notas" ink={ink} muted={muted} />
          <View style={[s.statDiv, { backgroundColor: border }]} />
          <StatItem value="12" label="Lecturas" ink={ink} muted={muted} />
          <View style={[s.statDiv, { backgroundColor: border }]} />
          <StatItem value={CYCLE.liturgicalYear} label="Año" ink={ink} muted={muted} />
        </View>
      </View>

      {/* ── Tab bar (sticky) ───────────────────────────────────────────── */}
      <View style={[s.tabBar, { backgroundColor: bg, borderBottomColor: border }]}>
        <View style={s.tabBarInner}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const accentColor = active ? tab.color : muted;
            const isPremium = tab.id === 'elevenlabs';
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.tab, active && { backgroundColor: tab.color + '12' }]}
                activeOpacity={0.7}
              >
                <View
                  style={[s.tabIconWrap, active && { backgroundColor: tab.color + '22' }]}
                >
                  <tab.Icon c={accentColor} size={20} />
                  {isPremium && (
                    <View
                      style={[
                        s.tabPremiumDot,
                        {
                          backgroundColor: hasEleven
                            ? Colors.liturgicalUI.green
                            : Colors.liturgicalUI.gold,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[s.tabText, { color: accentColor }, active && s.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Contenido de cada pestaña ──────────────────────────────────── */}
      <View style={s.tabContent}>
        {activeTab === 'perfil' && <TabPerfil profileStore={profileStore} ctx={ctx} />}
        {activeTab === 'apariencia' && (
          <TabApariencia darkMode={darkMode} setDarkMode={setDarkMode} ctx={ctx} />
        )}
        {activeTab === 'voz' && (
          <TabVoz
            ttsVoiceId={ttsVoiceId}
            setTtsVoiceId={setTtsVoiceId}
            ttsSpeed={ttsSpeed}
            setTtsSpeed={setTtsSpeed}
            systemVoices={systemVoices}
            voiceOpen={voiceOpen}
            setVoiceOpen={setVoiceOpen}
            voicesLoading={voicesLoading}
            loadVoices={loadVoices}
            onGoEleven={() => setActiveTab('elevenlabs')}
            ctx={ctx}
          />
        )}
        {activeTab === 'elevenlabs' && (
          <TabElevenLabs
            elevenlabsApiKey={elevenlabsApiKey}
            setElevenlabsApiKey={setElevenlabsApiKey}
            elevenlabsVoiceId={elevenlabsVoiceId}
            setElevenlabsVoiceId={setElevenlabsVoiceId}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
            hasEleven={hasEleven}
            ctx={ctx}
          />
        )}
        {activeTab === 'app' && (
          <TabApp
            dailyReminder={dailyReminder}
            setDailyReminder={setDailyReminder}
            onLogout={handleLogout}
            ctx={ctx}
          />
        )}
      </View>
    </ScrollView>
  );
}

// ── Tab: Perfil / Feligrés ────────────────────────────────────────────────────

function TabPerfil({ profileStore, ctx }) {
  const { displayName, country, diocese, parish, photoURL, setProfile } = profileStore;
  const { ink, muted, border, surface } = ctx;

  const [name, setName] = useState(displayName ?? '');
  const [countryVal, setCountryVal] = useState(country ?? '');
  const [dioceseVal, setDioceseVal] = useState(diocese ?? '');
  const [parishVal, setParishVal] = useState(parish ?? '');
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const displayPhoto = photoUri || photoURL || null;

  const pickPhoto = useCallback(() => {
    const opts = { mediaType: 'photo', quality: 0.8, maxWidth: 512, maxHeight: 512 };

    const handleCam = (res) => {
      if (res.errorCode === 'camera_unavailable') {
        Alert.alert('Cámara no disponible', 'Usa la galería para seleccionar una foto.');
        return;
      }
      if (res.errorCode === 'permission') {
        Alert.alert(
          'Permiso denegado',
          'Ve a Configuración y permite acceso a la cámara.'
        );
        return;
      }
      if (!res.didCancel && !res.errorCode && res.assets?.[0]?.uri) {
        setPhotoUri(res.assets[0].uri);
      }
    };

    const handleGallery = (res) => {
      if (!res.didCancel && !res.errorCode && res.assets?.[0]?.uri) {
        setPhotoUri(res.assets[0].uri);
      }
    };

    Alert.alert('Foto de perfil', '¿Cómo deseas cambiar tu foto?', [
      {
        text: 'Cámara',
        onPress: async () => {
          const granted = await ensureCameraPermission();
          if (!granted) {
            Alert.alert(
              'Permiso de cámara',
              'Habilita el acceso a la cámara en Configuración para tomar una foto, o usa la galería.'
            );
            return;
          }
          try {
            launchCamera(opts, handleCam);
          } catch (_) {
            Alert.alert('Cámara no disponible', 'Usa la galería.');
          }
        },
      },
      {
        text: 'Galería',
        onPress: () => {
          try {
            launchImageLibrary(opts, handleGallery);
          } catch (_) {
            Alert.alert('Error', 'No se pudo abrir la galería.');
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre para continuar.');
      return;
    }
    setSaving(true);
    try {
      let newPhotoURL = photoURL ?? '';
      if (photoUri) {
        try {
          const uri = Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri;
          newPhotoURL = await uploadProfilePhoto(uri);
        } catch (_) {}
      }
      const data = {
        displayName: name.trim(),
        country: countryVal.trim(),
        diocese: dioceseVal.trim(),
        parish: parishVal.trim(),
        photoURL: newPhotoURL,
      };
      await saveProfile(data);
      setProfile(data);
      Alert.alert('Guardado', 'Tu perfil ha sido actualizado correctamente.');
    } catch (e) {
      Alert.alert(
        'Error al guardar',
        e.message ?? 'Verifica tu conexión e intenta de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  }, [name, countryVal, dioceseVal, parishVal, photoUri, photoURL, setProfile]);

  return (
    <View style={t.section}>
      {/* Avatar */}
      <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={tp.avatarWrap}>
        {displayPhoto ? (
          <Image source={{ uri: displayPhoto }} style={tp.avatar} />
        ) : (
          <View
            style={[
              tp.avatarPlaceholder,
              {
                backgroundColor: Colors.brand.primary + '12',
                borderColor: Colors.brand.primary + '30',
              },
            ]}
          >
            <IcoUser c={Colors.brand.primary + '80'} size={44} />
          </View>
        )}
        <View
          style={[
            tp.cameraBadge,
            { backgroundColor: Colors.brand.primary, borderColor: surface },
          ]}
        >
          <IcoPencil c="#fff" size={12} />
        </View>
      </TouchableOpacity>
      <Text style={[tp.photoHint, { color: muted }]}>Toca para cambiar foto</Text>

      {/* Información personal */}
      <SectionHeader label="Información personal" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        <ProfileField
          label="Nombre completo *"
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          border={border}
          ink={ink}
          muted={muted}
        />
        <ProfileField
          label="País"
          value={countryVal}
          onChangeText={setCountryVal}
          placeholder="Guatemala, México, España…"
          border={border}
          ink={ink}
          muted={muted}
          last
        />
      </View>

      {/* Parroquia */}
      <SectionHeader label="Parroquia" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        <ProfileField
          label="Diócesis"
          value={dioceseVal}
          onChangeText={setDioceseVal}
          placeholder="Nombre de tu diócesis"
          border={border}
          ink={ink}
          muted={muted}
        />
        <ProfileField
          label="Parroquia"
          value={parishVal}
          onChangeText={setParishVal}
          placeholder="Nombre de tu parroquia"
          border={border}
          ink={ink}
          muted={muted}
          last
        />
      </View>

      {/* Guardar */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
        style={[tp.saveBtn, saving && { opacity: 0.7 }]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={tp.saveBtnText}>Guardar cambios</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  border,
  ink,
  muted,
  last,
}) {
  return (
    <View
      style={[
        tp.fieldRow,
        !last && { borderBottomWidth: 0.5, borderBottomColor: border },
      ]}
    >
      <Text style={[tp.fieldLabel, { color: muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={muted}
        style={[tp.fieldInput, { color: ink }]}
        autoCapitalize="words"
        autoCorrect={false}
      />
    </View>
  );
}

// ── Tab: Apariencia ───────────────────────────────────────────────────────────

function TabApariencia({ darkMode, setDarkMode, ctx }) {
  const { ink, muted, border, surface } = ctx;

  const OPTS = [
    { id: 'light', label: 'Claro', Icon: IcoSun, iconColor: '#FF9F0A' },
    { id: 'dark', label: 'Oscuro', Icon: IcoMoon, iconColor: '#5E5CE6' },
    { id: 'auto', label: 'Automático', Icon: IcoAuto, iconColor: Colors.brand.primary },
  ];

  return (
    <View style={t.section}>
      <SectionHeader label="Tema de la aplicación" muted={muted} />

      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        {OPTS.map((opt) => {
          const active = darkMode === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setDarkMode(opt.id)}
              activeOpacity={0.7}
              style={[
                t.themeRow,
                { borderBottomColor: border },
                active && { backgroundColor: Colors.brand.primary + '08' },
              ]}
            >
              <View style={[t.themeIconWrap, { backgroundColor: opt.iconColor + '18' }]}>
                <opt.Icon c={opt.iconColor} size={18} />
              </View>
              <Text
                style={[t.themeLabel, { color: active ? Colors.brand.primary : ink }]}
              >
                {opt.label}
              </Text>
              {active && <IcoCheck c={Colors.brand.primary} size={18} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[t.hint, { color: muted }]}>
        El modo Automático sigue la configuración del sistema operativo.
      </Text>
    </View>
  );
}

// ── Tab: Voz del sistema ──────────────────────────────────────────────────────

function TabVoz({
  ttsVoiceId,
  setTtsVoiceId,
  ttsSpeed,
  setTtsSpeed,
  systemVoices,
  voiceOpen,
  setVoiceOpen,
  voicesLoading,
  loadVoices,
  onGoEleven,
  ctx,
}) {
  const { ink, muted, border, surface } = ctx;
  const selectedName =
    systemVoices.find((v) => v.id === ttsVoiceId)?.name ?? 'Por defecto';

  return (
    <View style={t.section}>
      {/* Selector de voz */}
      <SectionHeader label="Voz del sistema" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        <TouchableOpacity
          onPress={() => setVoiceOpen((v) => !v)}
          activeOpacity={0.7}
          style={[
            t.row,
            { borderBottomWidth: voiceOpen ? 0.5 : 0, borderBottomColor: border },
          ]}
        >
          <View style={[t.iconWrap, { backgroundColor: '#30D15820' }]}>
            <IcoMic c="#30D158" size={17} />
          </View>
          <Text style={[t.rowLabel, { color: ink }]}>Voz activa</Text>
          <Text style={[t.rowVal, { color: muted }]} numberOfLines={1}>
            {selectedName}
          </Text>
          <View style={{ marginLeft: 4 }}>
            <IcoChevron c={muted} size={14} />
          </View>
        </TouchableOpacity>

        {voiceOpen && (
          <View>
            {voicesLoading ? (
              <View style={t.emptyBox}>
                <Text style={[t.emptyText, { color: muted }]}>Cargando voces…</Text>
              </View>
            ) : systemVoices.length === 0 ? (
              <View style={t.emptyBox}>
                <Text style={[t.emptyTitle, { color: ink }]}>Sin voces en español</Text>
                <Text style={[t.emptyText, { color: muted }]}>
                  Instálalas desde Configuración {'›'} Accesibilidad {'›'} Contenido
                  hablado {'›'} Voces {'›'} Español
                </Text>
                <TouchableOpacity
                  onPress={loadVoices}
                  style={[t.retryBtn, { borderColor: Colors.brand.primary + '50' }]}
                >
                  <Text
                    style={{
                      color: Colors.brand.primary,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    Reintentar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              [{ id: null, name: 'Por defecto', language: '' }, ...systemVoices].map(
                (v, i, arr) => {
                  const sel =
                    v.id === ttsVoiceId || (v.id === null && ttsVoiceId === null);
                  return (
                    <TouchableOpacity
                      key={v.id ?? '__default'}
                      onPress={() => {
                        setTtsVoiceId(v.id);
                        if (v.id)
                          try {
                            _Tts().setDefaultVoice(v.id);
                          } catch (_) {}
                        setVoiceOpen(false);
                      }}
                      style={[
                        t.voiceItem,
                        i < arr.length - 1 && {
                          borderBottomWidth: 0.5,
                          borderBottomColor: border,
                        },
                        sel && { backgroundColor: Colors.brand.primary + '08' },
                      ]}
                      activeOpacity={0.6}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            t.voiceName,
                            { color: sel ? Colors.brand.primary : ink },
                          ]}
                        >
                          {v.name}
                        </Text>
                        {v.language ? (
                          <Text style={[t.voiceLang, { color: muted }]}>
                            {v.language}
                          </Text>
                        ) : null}
                      </View>
                      {sel && <IcoCheck c={Colors.brand.primary} size={16} />}
                    </TouchableOpacity>
                  );
                }
              )
            )}
          </View>
        )}
      </View>

      {/* Velocidad */}
      <SectionHeader label="Velocidad de lectura" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        <View style={t.speedBlock}>
          <View style={t.speedHeaderRow}>
            <View style={[t.iconWrap, { backgroundColor: '#FF9F0A20' }]}>
              <IcoWave c="#FF9F0A" size={17} />
            </View>
            <Text style={[t.rowLabel, { color: ink }]}>Velocidad</Text>
            <Text style={[t.speedVal, { color: Colors.brand.primary }]}>{ttsSpeed}×</Text>
          </View>
          <View style={t.chips}>
            {SPEED_OPTIONS.map((sp) => {
              const sel = ttsSpeed === sp;
              return (
                <TouchableOpacity
                  key={sp}
                  onPress={() => setTtsSpeed(sp)}
                  style={[
                    t.chip,
                    { borderColor: sel ? Colors.brand.primary : border },
                    sel && { backgroundColor: Colors.brand.primary },
                  ]}
                >
                  <Text style={[t.chipText, { color: sel ? '#fff' : muted }]}>{sp}×</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Promo ElevenLabs */}
      <TouchableOpacity
        onPress={onGoEleven}
        activeOpacity={0.8}
        style={[
          t.promoCard,
          {
            borderColor: Colors.liturgicalUI.gold + '60',
            backgroundColor: Colors.liturgicalUI.gold + '0D',
          },
        ]}
      >
        <IcoStar c={Colors.liturgicalUI.gold} size={16} />
        <View style={{ flex: 1 }}>
          <Text style={[t.promoTitle, { color: ink }]}>
            ¿Quieres una voz más natural?
          </Text>
          <Text style={[t.promoSub, { color: muted }]}>
            Activa ElevenLabs para síntesis de voz IA de alta calidad.
          </Text>
        </View>
        <IcoChevron c={Colors.liturgicalUI.gold} size={14} />
      </TouchableOpacity>
    </View>
  );
}

// ── Tab: ElevenLabs ───────────────────────────────────────────────────────────

const ELEVEN_STEPS = [
  { n: '1', text: 'Crea una cuenta gratuita en elevenlabs.io' },
  { n: '2', text: 'Inicia sesión y ve a tu perfil (ícono superior derecho)' },
  { n: '3', text: 'Entra a "API Keys" y genera una nueva clave' },
  { n: '4', text: 'Copia la API Key y pégala aquí abajo' },
];

function TabElevenLabs({
  elevenlabsApiKey,
  setElevenlabsApiKey,
  elevenlabsVoiceId,
  setElevenlabsVoiceId,
  showApiKey,
  setShowApiKey,
  hasEleven,
  ctx,
}) {
  const { ink, muted, border, surface } = ctx;

  return (
    <View style={t.section}>
      {/* Banner premium */}
      <View
        style={[
          t.premiumBanner,
          {
            borderColor: Colors.liturgicalUI.gold + '70',
            backgroundColor: Colors.liturgicalUI.gold + '12',
          },
        ]}
      >
        <View style={t.premiumBannerTop}>
          <View
            style={[
              t.premiumIconWrap,
              { backgroundColor: Colors.liturgicalUI.gold + '25' },
            ]}
          >
            <IcoStar c={Colors.liturgicalUI.gold} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={t.premiumTitleRow}>
              <Text style={[t.premiumTitle, { color: ink }]}>ElevenLabs · Voz IA</Text>
              <View
                style={[
                  t.recommendedPill,
                  {
                    backgroundColor: Colors.liturgicalUI.gold + '22',
                    borderColor: Colors.liturgicalUI.gold + '50',
                  },
                ]}
              >
                <Text style={[t.recommendedText, { color: Colors.liturgicalUI.gold }]}>
                  RECOMENDADO
                </Text>
              </View>
            </View>
            <Text style={[t.premiumSub, { color: muted }]}>
              Síntesis de voz de alta calidad con entonación natural para el español.
            </Text>
          </View>
        </View>

        <View
          style={[t.compareDivider, { backgroundColor: Colors.liturgicalUI.gold + '30' }]}
        />

        <View style={t.compareRow}>
          <CompareCol
            title="Voz del sistema"
            items={['Robótica y monótona', 'Pronunciación básica', 'Sin entonación']}
            bad
            ink={ink}
            muted={muted}
          />
          <View
            style={[
              t.compareCenter,
              { backgroundColor: Colors.liturgicalUI.gold + '30' },
            ]}
          />
          <CompareCol
            title="ElevenLabs"
            items={['Natural y expresiva', 'Español perfecto', 'Ritmo litúrgico']}
            ink={ink}
            muted={muted}
          />
        </View>
      </View>

      {/* Estado actual */}
      {hasEleven && (
        <View
          style={[
            t.activeCard,
            {
              backgroundColor: Colors.liturgicalUI.green + '10',
              borderColor: Colors.liturgicalUI.green + '40',
            },
          ]}
        >
          <IcoCheck c={Colors.liturgicalUI.green} size={16} />
          <Text style={[t.activeText, { color: Colors.liturgicalUI.green }]}>
            ElevenLabs activo
          </Text>
        </View>
      )}

      {/* Pasos de configuración */}
      <SectionHeader label="Cómo obtener tu API Key" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        {ELEVEN_STEPS.map((step, i) => (
          <View
            key={step.n}
            style={[
              t.stepRow,
              i < ELEVEN_STEPS.length - 1 && {
                borderBottomWidth: 0.5,
                borderBottomColor: border,
              },
            ]}
          >
            <View style={[t.stepNum, { backgroundColor: Colors.brand.primary + '15' }]}>
              <Text style={[t.stepNumText, { color: Colors.brand.primary }]}>
                {step.n}
              </Text>
            </View>
            <Text style={[t.stepText, { color: ink }]}>{step.text}</Text>
          </View>
        ))}

        {/* Botón ir a ElevenLabs */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://elevenlabs.io/sign-up')}
          activeOpacity={0.8}
          style={[
            t.linkBtn,
            { backgroundColor: Colors.brand.primary + '10', borderTopColor: border },
          ]}
        >
          <IcoLink c={Colors.brand.primary} size={16} />
          <Text style={[t.linkBtnText, { color: Colors.brand.primary }]}>
            Abrir elevenlabs.io
          </Text>
          <IcoChevron c={Colors.brand.primary} size={13} />
        </TouchableOpacity>
      </View>

      {/* Credenciales */}
      <SectionHeader label="Credenciales" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        {/* API Key */}
        <View style={[t.credRow, { borderBottomWidth: 0.5, borderBottomColor: border }]}>
          <View style={[t.iconWrap, { backgroundColor: '#FF375F20' }]}>
            <IcoKey c="#FF375F" size={17} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t.credLabel, { color: muted }]}>API Key</Text>
            <View style={t.credInputRow}>
              <TextInput
                value={elevenlabsApiKey}
                onChangeText={setElevenlabsApiKey}
                placeholder="Pega tu API Key aquí…"
                placeholderTextColor={muted}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                style={[t.credInput, { color: ink }]}
              />
              <TouchableOpacity onPress={() => setShowApiKey((v) => !v)} style={t.eyeBtn}>
                <Text style={{ fontSize: 15 }}>{showApiKey ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Voice ID */}
        <View style={t.credRow}>
          <View style={[t.iconWrap, { backgroundColor: '#FF375F20' }]}>
            <IcoMic c="#FF375F" size={17} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t.credLabel, { color: muted }]}>Voice ID</Text>
            <TextInput
              value={elevenlabsVoiceId}
              onChangeText={setElevenlabsVoiceId}
              placeholder={DEFAULT_VOICE_ID}
              placeholderTextColor={muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[t.credInput, { color: ink }]}
            />
          </View>
        </View>
      </View>

      <Text style={[t.hint, { color: muted }]}>
        El Voice ID es el identificador de la voz que deseas usar. Encuéntralo en la
        sección de voces dentro de tu cuenta ElevenLabs.
      </Text>

      {/* Limpiar caché */}
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Limpiar caché', '¿Borrar los archivos de audio guardados?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Limpiar', style: 'destructive', onPress: () => clearTTSCache() },
          ])
        }
        style={[t.ghostBtn, { borderColor: border }]}
        activeOpacity={0.7}
      >
        <Text style={[t.ghostBtnText, { color: muted }]}>Limpiar caché de audio</Text>
      </TouchableOpacity>
    </View>
  );
}

function CompareCol({ title, items, bad, ink, muted }) {
  return (
    <View style={t.compareCol}>
      <Text style={[t.compareTitle, { color: bad ? muted : Colors.liturgicalUI.green }]}>
        {title}
      </Text>
      {items.map((item) => (
        <View key={item} style={t.compareItem}>
          <Text
            style={{
              color: bad ? Colors.liturgicalUI.red : Colors.liturgicalUI.green,
              fontSize: 13,
            }}
          >
            {bad ? '✕' : '✓'}
          </Text>
          <Text style={[t.compareItemText, { color: bad ? muted : ink }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Tab: App ──────────────────────────────────────────────────────────────────

function TabApp({ dailyReminder, setDailyReminder, onLogout, ctx }) {
  const { ink, muted, border, surface } = ctx;
  const seasonColor = Colors.liturgicalUI[TODAY.seasonColor] ?? Colors.liturgicalUI.green;
  const ABOUT = [
    {
      label: 'Versión',
      value: '1.0.0',
      Icon: IcoInfo,
      iconBg: '#0A84FF18',
      iconC: '#0A84FF',
    },
    {
      label: 'Ciclo litúrgico',
      value: CYCLE.label,
      Icon: IcoRepeat,
      iconBg: seasonColor + '22',
      iconC: seasonColor,
    },
    {
      label: 'Año litúrgico',
      value: String(CYCLE.liturgicalYear),
      Icon: IcoCalGrid,
      iconBg: Colors.brand.primary + '18',
      iconC: Colors.brand.primary,
    },
    {
      label: 'Lecturas',
      value: 'dominicos.org · Vatican News',
      Icon: IcoBookOpen,
      iconBg: '#FF6B3518',
      iconC: '#FF6B35',
    },
    {
      label: 'Calendario',
      value: 'Rito Romano',
      Icon: IcoCalGrid,
      iconBg: '#5E5CE618',
      iconC: '#5E5CE6',
    },
  ];

  return (
    <View style={t.section}>
      {/* Notificaciones */}
      <SectionHeader label="Notificaciones" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        <View style={t.row}>
          <View style={[t.iconWrap, { backgroundColor: '#FF9F0A20' }]}>
            <IcoBell c="#FF9F0A" size={17} />
          </View>
          <Text style={[t.rowLabel, { color: ink }]}>Recordatorio diario</Text>
          <Switch
            value={dailyReminder}
            onValueChange={setDailyReminder}
            trackColor={{ false: border, true: Colors.brand.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Acerca de */}
      <SectionHeader label="Acerca de" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        {ABOUT.map((row, i) => (
          <View
            key={row.label}
            style={[
              t.row,
              i < ABOUT.length - 1 && {
                borderBottomWidth: 0.5,
                borderBottomColor: border,
              },
            ]}
          >
            <View style={[t.iconWrap, { backgroundColor: row.iconBg }]}>
              <row.Icon c={row.iconC} size={17} />
            </View>
            <Text style={[t.rowLabel, { color: ink }]}>{row.label}</Text>
            <Text style={[t.rowVal, { color: muted }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Fuentes de datos */}
      <SectionHeader label="Fuentes de lecturas" muted={muted} />
      <View style={[t.card, { backgroundColor: surface, borderColor: border }]}>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL('https://www.dominicos.org/predicacion/evangelio-del-dia')
          }
          activeOpacity={0.8}
          style={[
            t.linkBtn,
            { borderTopWidth: 0, borderBottomWidth: 0.5, borderBottomColor: border },
          ]}
        >
          <IcoLink c={Colors.brand.primary} size={16} />
          <View style={{ flex: 1 }}>
            <Text style={[t.rowLabel, { color: ink, fontSize: 14 }]}>dominicos.org</Text>
            <Text style={[t.hint, { color: muted, marginHorizontal: 0, marginTop: 1 }]}>
              Lecturas feriales · días de semana
            </Text>
          </View>
          <IcoChevron c={muted} size={13} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL('https://www.vaticannews.va/es/evangelio-de-hoy.html')
          }
          activeOpacity={0.8}
          style={[t.linkBtn, { borderTopWidth: 0 }]}
        >
          <IcoLink c={Colors.brand.primary} size={16} />
          <View style={{ flex: 1 }}>
            <Text style={[t.rowLabel, { color: ink, fontSize: 14 }]}>Vatican News</Text>
            <Text style={[t.hint, { color: muted, marginHorizontal: 0, marginTop: 1 }]}>
              Lecturas dominicales y solemnidades
            </Text>
          </View>
          <IcoChevron c={muted} size={13} />
        </TouchableOpacity>
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity
        onPress={onLogout}
        style={[
          t.logoutBtn,
          { backgroundColor: surface, borderColor: Colors.liturgicalUI.red + '35' },
        ]}
        activeOpacity={0.7}
      >
        <View style={[t.logoutIcon, { backgroundColor: Colors.liturgicalUI.red + '15' }]}>
          <IcoPower c={Colors.liturgicalUI.red} size={17} />
        </View>
        <Text style={[t.logoutText, { color: Colors.liturgicalUI.red }]}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function SectionHeader({ label, muted }) {
  return <Text style={[t.sectionHeader, { color: muted }]}>{label}</Text>;
}

function StatItem({ value, label, ink, muted }) {
  return (
    <View style={s.statItem}>
      <Text style={[s.statValue, { color: ink }]}>{value}</Text>
      <Text style={[s.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

// ── Estilos globales ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  hero: { alignItems: 'center', paddingBottom: 0, overflow: 'hidden' },
  heroStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 28,
    marginBottom: 12,
  },
  heroName: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 22,
    lineHeight: 27,
    marginBottom: 2,
  },
  heroPhone: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 0,
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 999 },
  heroBadgeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', borderTopWidth: 0.5, width: '100%', marginTop: 16 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 26,
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDiv: { width: 0.5, marginVertical: 10 },

  tabBar: { borderBottomWidth: 0.5, paddingHorizontal: 10, paddingVertical: 8 },
  tabBarInner: { flexDirection: 'row', gap: 4 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 5,
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPremiumDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  tabText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2, textAlign: 'center' },
  tabTextActive: { fontWeight: '700' },
  premiumBadge: {
    width: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabContent: { paddingTop: 4 },
});

// Estilos TabPerfil
const tp = StyleSheet.create({
  avatarWrap: { alignSelf: 'center', marginBottom: 8, marginTop: 4 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  photoHint: { textAlign: 'center', fontSize: 12, marginBottom: 20 },
  fieldRow: { paddingHorizontal: 14, paddingVertical: 11 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  fieldInput: { fontSize: 15, paddingVertical: 0 },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.primary,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});

// Estilos compartidos entre tabs
const t = StyleSheet.create({
  section: { paddingTop: 20, paddingBottom: 12 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 6,
  },
  card: { marginHorizontal: 20, borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  hint: { fontSize: 12, lineHeight: 18, marginHorizontal: 20, marginTop: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: { fontSize: 15, flex: 1 },
  rowVal: { fontSize: 14 },

  // Apariencia
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    minHeight: 52,
  },
  themeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  themeLabel: { fontSize: 15, fontWeight: '500', flex: 1 },

  // Voz
  emptyBox: { padding: 18, gap: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 13, lineHeight: 19 },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  voiceName: { fontSize: 14, fontWeight: '500' },
  voiceLang: { fontSize: 11, marginTop: 1 },

  speedBlock: { paddingHorizontal: 14, paddingVertical: 14 },
  speedHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  speedVal: { fontWeight: '700', fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingLeft: 42 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  promoTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  promoSub: { fontSize: 12, lineHeight: 17 },

  // ElevenLabs
  premiumBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  premiumBannerTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  premiumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  premiumTitle: { fontSize: 16, fontWeight: '700' },
  recommendedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  recommendedText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  premiumSub: { fontSize: 13, lineHeight: 19 },
  compareDivider: { height: 0.5 },
  compareRow: { flexDirection: 'row', gap: 10 },
  compareCenter: { width: 0.5, marginVertical: 4 },
  compareCol: { flex: 1, gap: 6 },
  compareTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  compareItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  compareItemText: { fontSize: 12, lineHeight: 17, flex: 1 },

  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  activeText: { fontSize: 13, fontWeight: '600' },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { fontSize: 12, fontWeight: '800' },
  stepText: { fontSize: 14, lineHeight: 20, flex: 1, paddingTop: 2 },

  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 0.5,
  },
  linkBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },

  credRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  credLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  credInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  credInput: {
    fontSize: 14,
    flex: 1,
    paddingVertical: 0,
    borderBottomWidth: 0,
  },
  eyeBtn: { padding: 4 },

  ghostBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  ghostBtnText: { fontSize: 14 },

  // App tab
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontWeight: '600', fontSize: 15 },
});
