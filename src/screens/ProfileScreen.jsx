import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau } from '../components';
import { useSettingsStore, useAuthStore, useNotesStore } from '../store';
import { CYCLE } from '../data/liturgical';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

function SettingsGroup({ title, children, surface, ink, muted, border }) {
  return (
    <View style={sg.group}>
      <Text style={[sg.groupTitle, { color: muted }]}>{title}</Text>
      <View style={[sg.groupBody, { backgroundColor: surface, borderColor: border }]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ label, value, onPress, right, ink, muted, border, isLast }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[sg.row, !isLast && { borderBottomWidth: 0.5, borderBottomColor: border }]}
    >
      <Text style={[sg.rowLabel, { color: ink }]}>{label}</Text>
      {right ||
        (value !== undefined && (
          <Text style={[sg.rowValue, { color: muted }]}>{value}</Text>
        ))}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const {
    darkMode,
    setDarkMode,
    ttsSpeed,
    setTtsSpeed,
    dailyReminder,
    setDailyReminder,
  } = useSettingsStore();
  const { notes } = useNotesStore();
  const { phone, logout } = useAuthStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const cycleTheme = () => {
    const modes = ['auto', 'light', 'dark'];
    const idx = modes.indexOf(darkMode);
    setDarkMode(modes[(idx + 1) % modes.length]);
  };

  const THEME_LABEL = { auto: 'Automático', light: 'Claro', dark: 'Oscuro' };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      <View style={{ paddingTop: insets.top + 12 }} />

      {/* Avatar / perfil */}
      <View style={s.profileSection}>
        <View style={[s.avatar, { backgroundColor: Colors.brand.primary + '15' }]}>
          <Tau size={52} color={Colors.brand.primary} />
        </View>
        <View style={s.profileInfo}>
          <Text style={[s.profilePhone, { color: ink }]}>
            {phone || '+502 0000-0000'}
          </Text>
          <Text style={[s.profileSub, { color: muted }]}>{CYCLE.fullLabel}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[s.statsRow, { backgroundColor: surface, borderColor: border }]}>
        <StatItem value={notes.length} label="Notas" ink={ink} muted={muted} />
        <View style={[s.statDivider, { backgroundColor: border }]} />
        <StatItem value="12" label="Lecturas" ink={ink} muted={muted} />
        <View style={[s.statDivider, { backgroundColor: border }]} />
        <StatItem value={CYCLE.liturgicalYear} label="Año" ink={ink} muted={muted} />
      </View>

      {/* Apariencia */}
      <SettingsGroup
        title="Apariencia"
        surface={surface}
        ink={ink}
        muted={muted}
        border={border}
      >
        <SettingsRow
          label="Tema"
          value={THEME_LABEL[darkMode]}
          onPress={cycleTheme}
          ink={ink}
          muted={muted}
          border={border}
          isLast
        />
      </SettingsGroup>

      {/* Lectura en voz alta */}
      <SettingsGroup
        title="Lectura en voz alta"
        surface={surface}
        ink={ink}
        muted={muted}
        border={border}
      >
        <SettingsRow
          label="Velocidad de lectura"
          ink={ink}
          muted={muted}
          border={border}
          right={
            <View style={s.speedRow}>
              {SPEED_OPTIONS.map((sp) => (
                <TouchableOpacity
                  key={sp}
                  onPress={() => setTtsSpeed(sp)}
                  style={[
                    s.speedChip,
                    ttsSpeed === sp && { backgroundColor: Colors.brand.primary },
                    { borderColor: ttsSpeed === sp ? Colors.brand.primary : border },
                  ]}
                >
                  <Text
                    style={[s.speedChipText, { color: ttsSpeed === sp ? '#fff' : muted }]}
                  >
                    {sp}×
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          }
          isLast
        />
      </SettingsGroup>

      {/* Notificaciones */}
      <SettingsGroup
        title="Notificaciones"
        surface={surface}
        ink={ink}
        muted={muted}
        border={border}
      >
        <SettingsRow
          label="Recordatorio diario"
          ink={ink}
          muted={muted}
          border={border}
          right={
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ false: border, true: Colors.brand.primary }}
              thumbColor="#fff"
            />
          }
          isLast
        />
      </SettingsGroup>

      {/* Acerca de */}
      <SettingsGroup
        title="Acerca de"
        surface={surface}
        ink={ink}
        muted={muted}
        border={border}
      >
        <SettingsRow
          label="Versión"
          value="1.0.0"
          ink={ink}
          muted={muted}
          border={border}
        />
        <SettingsRow
          label="Ciclo litúrgico"
          value={CYCLE.label}
          ink={ink}
          muted={muted}
          border={border}
        />
        <SettingsRow
          label="Año litúrgico"
          value={String(CYCLE.liturgicalYear)}
          ink={ink}
          muted={muted}
          border={border}
        />
        <SettingsRow
          label="Lecturas diarias"
          value="dominicos.org"
          ink={ink}
          muted={muted}
          border={border}
        />
        <SettingsRow
          label="Calendario"
          value="Rito Romano"
          ink={ink}
          muted={muted}
          border={border}
          isLast
        />
      </SettingsGroup>

      {/* Cerrar sesión */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[s.logoutBtn, { backgroundColor: surface, borderColor: border }]}
        activeOpacity={0.7}
      >
        <Text style={[s.logoutText, { color: Colors.liturgical.red }]}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatItem({ value, label, ink, muted }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
      <Text
        style={[
          {
            fontFamily: 'CormorantGaramond-SemiBoldItalic',
            fontSize: 28,
            lineHeight: 32,
          },
          { color: ink },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginTop: 2,
          },
          { color: muted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profilePhone: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
  },
  profileSub: { fontSize: 12, lineHeight: 17 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 24,
    overflow: 'hidden',
  },
  statDivider: { width: 0.5, marginVertical: 10 },

  speedRow: { flexDirection: 'row', gap: 6 },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  speedChipText: { fontSize: 11, fontWeight: '600' },

  logoutBtn: {
    margin: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  logoutText: { fontWeight: '600', fontSize: 15 },
});

const sg = StyleSheet.create({
  group: { marginHorizontal: 20, marginBottom: 20 },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  groupBody: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 48,
  },
  rowLabel: { fontSize: 15, flex: 1 },
  rowValue: { fontSize: 14 },
});
