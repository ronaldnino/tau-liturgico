import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau, LitDot, LitBadge, SectionTitle } from '../components';
import { useSettingsStore } from '../store';
import { TODAY, READINGS, UPCOMING, SEASONS } from '../data/liturgical';

export default function TodayScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');
  const [variant] = useState('A');

  // Colores contextuales
  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const inkMuted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  return (
    <ScrollView
      style={[s.container, { backgroundColor: bg }]}
      contentContainerStyle={[
        s.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={s.header}>
        <Tau size={26} color={Colors.brand.primary} />
        <TouchableOpacity style={s.iconBtn}>
          <BellIcon color={inkMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Fecha + Temporada ──────────────────────────────── */}
      <View style={s.seasonSection}>
        <Text style={[s.dateLabel, { color: inkMuted }]}>
          {TODAY.weekday} · {TODAY.dateShort}
        </Text>
        <Text style={[s.seasonTitle, { color: ink }]}>{TODAY.season}</Text>
        <LitBadge
          color="white"
          style={{
            backgroundColor: dark ? 'rgba(201,182,135,0.18)' : '#FAF6EC',
          }}
        >
          <Text
            style={{
              color: dark ? '#E0CC9D' : '#9A8453',
              fontSize: 11,
              fontWeight: '600',
            }}
          >
            {TODAY.season} · {TODAY.week}
          </Text>
        </LitBadge>
      </View>

      {/* ── Hero card ──────────────────────────────────────── */}
      <View style={s.heroWrapper}>
        <View
          style={[
            s.heroCard,
            {
              backgroundColor: surface,
              borderColor: border,
              borderLeftColor: Colors.liturgical.red,
            },
          ]}
        >
          {/* Marca de agua τ */}
          <View style={s.heroWatermark} pointerEvents="none">
            <Tau
              size={150}
              color={Colors.liturgical.red}
              style={{ opacity: dark ? 0.06 : 0.04 }}
            />
          </View>

          {/* Badges */}
          <View style={s.heroBadgeRow}>
            <View
              style={[s.colorBadge, { backgroundColor: Colors.liturgical.red + '15' }]}
            >
              <LitDot color="red" size={6} />
              <Text style={[s.colorBadgeText, { color: Colors.liturgical.red }]}>
                {TODAY.liturgicalColorLabel}
              </Text>
            </View>
            <View
              style={[
                s.gradeBadge,
                { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
              ]}
            >
              <Text style={[s.gradeBadgeText, { color: inkMuted }]}>{TODAY.grade}</Text>
            </View>
          </View>

          {/* Título */}
          <Text style={[s.celebrationTitle, { color: ink }]}>{TODAY.celebration}</Text>

          {/* Descripción */}
          <Text style={[s.celebrationDesc, { color: inkMuted }]}>
            Obispo de Cracovia, mártir por defender la libertad de la Iglesia ante el rey
            Boleslao II († 1079).
          </Text>

          {/* CTA */}
          <TouchableOpacity
            style={s.readingsBtn}
            onPress={() => navigation.navigate('Lecturas')}
            activeOpacity={0.8}
          >
            <Text style={s.readingsBtnText}>Leer las lecturas →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Variante A: lista de lecturas ──────────────────── */}
      {variant === 'A' && (
        <View style={s.section}>
          <SectionTitle
            action="Ver todas"
            onActionPress={() => navigation.navigate('Lecturas')}
          >
            Lecturas de hoy
          </SectionTitle>
          <View style={s.readingsList}>
            {READINGS.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={[s.readingItem, { backgroundColor: surface, borderColor: border }]}
                onPress={() => navigation.navigate('Lecturas')}
                activeOpacity={0.7}
              >
                <View style={[s.readingNumber, { backgroundColor: Colors.brand.tint }]}>
                  <Text style={[s.readingNumberText, { color: Colors.brand.primary }]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={s.readingInfo}>
                  <Text style={[s.readingType, { color: Colors.brand.primary }]}>
                    {r.type}
                  </Text>
                  <Text style={[s.readingRef, { color: ink }]} numberOfLines={1}>
                    {r.ref}
                  </Text>
                </View>
                <ChevronRight color={inkMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Tiempos litúrgicos (scroll horizontal) ─────────── */}
      <View style={s.section}>
        <SectionTitle dark={dark}>Tiempos litúrgicos</SectionTitle>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.seasonsRow}
        >
          {SEASONS.map((season) => (
            <View
              key={season.name}
              style={[
                s.seasonCard,
                {
                  backgroundColor: surface,
                  borderWidth: season.active ? 1.5 : 0.5,
                  borderColor: season.active ? Colors.brand.primary : border,
                },
              ]}
            >
              <View style={s.seasonCardHeader}>
                <LitDot color={season.color} size={8} />
                <Text style={[s.seasonRange, { color: inkMuted }]}>{season.range}</Text>
              </View>
              <Text style={[s.seasonName, { color: ink }]}>{season.name}</Text>
              <View
                style={[
                  s.progressTrack,
                  { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#EFF1F4' },
                ]}
              >
                <View
                  style={[
                    s.progressFill,
                    {
                      width: `${season.progress * 100}%`,
                      backgroundColor: Colors.brand.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  s.seasonDays,
                  { color: season.active ? Colors.brand.primary : inkMuted },
                ]}
              >
                {season.days}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Próximas celebraciones ─────────────────────────── */}
      <View style={s.section}>
        <SectionTitle
          dark={dark}
          action="Ver calendario"
          onActionPress={() => navigation.navigate('Calendario')}
        >
          Próximas celebraciones
        </SectionTitle>
        <View style={[s.upcomingList, { backgroundColor: surface, borderColor: border }]}>
          {UPCOMING.map((u, i) => {
            const parts = u.date.split(' ');
            const dow = parts[0];
            const day = parts[1];
            return (
              <View
                key={i}
                style={[
                  s.upcomingItem,
                  i > 0 && { borderTopWidth: 0.5, borderTopColor: border },
                ]}
              >
                <View
                  style={[
                    s.dateBadge,
                    { backgroundColor: dark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' },
                  ]}
                >
                  <Text style={[s.dateDow, { color: inkMuted }]}>{dow}</Text>
                  <Text style={[s.dateDay, { color: ink }]}>{day}</Text>
                </View>
                <View style={s.upcomingInfo}>
                  <Text
                    style={[
                      s.upcomingName,
                      { color: ink },
                      u.solemn && s.upcomingNameSolemn,
                    ]}
                  >
                    {u.name}
                  </Text>
                  {u.solemn && <Text style={s.solemnnityLabel}>Solemnidad</Text>}
                </View>
                <LitDot color={u.color} size={9} />
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Micro-iconos ───────────────────────────────────────────────
function BellIcon({ color }) {
  return (
    <View
      style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 16, opacity: 0.7 }}>🔔</Text>
    </View>
  );
}

function ChevronRight({ color }) {
  return <Text style={{ color, fontSize: 16, marginLeft: 4 }}>›</Text>;
}

// ── Estilos ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  content: {},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  iconBtn: { padding: 6 },

  // Temporada
  seasonSection: { paddingHorizontal: 20, paddingTop: 12 },
  dateLabel: { fontSize: 13, fontWeight: '500', letterSpacing: 0.3, marginBottom: 4 },
  seasonTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },

  // Hero card
  heroWrapper: { paddingHorizontal: 20, paddingTop: 20 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    borderLeftWidth: 4,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroWatermark: { position: 'absolute', top: -18, right: -18 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  colorBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  gradeBadgeText: { fontSize: 11, fontWeight: '500' },
  celebrationTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 26,
    lineHeight: 30,
    marginBottom: 6,
  },
  celebrationDesc: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  readingsBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: Colors.brand.primary,
    alignSelf: 'flex-start',
  },
  readingsBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Sección genérica
  section: { paddingHorizontal: 20, paddingTop: 24 },

  // Lecturas
  readingsList: { gap: 8 },
  readingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
  },
  readingNumber: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  readingNumberText: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 18,
  },
  readingInfo: { flex: 1 },
  readingType: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  readingRef: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 17,
  },

  // Temporadas
  seasonsRow: { gap: 10, paddingBottom: 4 },
  seasonCard: { width: 200, borderRadius: 12, padding: 14, flexShrink: 0 },
  seasonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  seasonRange: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  seasonName: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 17,
    lineHeight: 21,
    marginBottom: 12,
  },
  progressTrack: { height: 3, borderRadius: 999, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 999 },
  seasonDays: { fontSize: 12, fontWeight: '500' },

  // Próximas
  upcomingList: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    paddingHorizontal: 16,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateDow: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: -2,
  },
  dateDay: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 18,
    lineHeight: 20,
  },
  upcomingInfo: { flex: 1 },
  upcomingName: { fontSize: 14, fontWeight: '500', lineHeight: 18 },
  upcomingNameSolemn: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 16,
    fontWeight: '600',
  },
  solemnnityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.liturgical.gold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
