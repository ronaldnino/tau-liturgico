import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau, TauWordmark, LitDot, SectionTitle } from '../components';
import { useSettingsStore, useLiturgicalStore } from '../store';
import {
  TODAY,
  CYCLE,
  READINGS as STATIC_READINGS,
  UPCOMING,
  SEASONS,
} from '../data/liturgical';

const _n = new Date();
const TODAY_ISO = `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, '0')}-${String(_n.getDate()).padStart(2, '0')}`;
const LIT_COLORS = Object.values(Colors.liturgical);

/* ── Iconos SVG ─────────────────────────────────────────────────────────── */

function IconBell({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconBook({ color, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4.5C4 3.12 5.12 2 6.5 2H20v15H6.5A1.5 1.5 0 0 0 5 18.5V20M4 4.5v15M4 4.5A1.5 1.5 0 0 0 5.5 6H20"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 19.5A1.5 1.5 0 0 1 5.5 18H20v3H5.5A1.5 1.5 0 0 1 4 19.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Line
        x1="9"
        y1="7"
        x2="16"
        y2="7"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Line
        x1="9"
        y1="10.5"
        x2="14"
        y2="10.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconChevron({ color, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function _typeShort(type) {
  if (!type) return '?';
  const t = type.toLowerCase();
  if (t.includes('primera') || t.includes('1ª') || t.includes('1a')) return '1ª';
  if (t.includes('segunda') || t.includes('2ª') || t.includes('2a')) return '2ª';
  if (t.includes('salmo')) return 'Sal';
  if (t.includes('evangelio') || t.includes('ev')) return 'Ev';
  return type.slice(0, 3);
}

/* ── Barra litúrgica ────────────────────────────────────────────────────── */

function LitBar() {
  return (
    <View style={s.litBar}>
      {LIT_COLORS.map((c) => (
        <View key={c} style={[s.litSeg, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

/* ── Pantalla ────────────────────────────────────────────────────────────── */

export default function TodayScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const { readings: storeReadings, lastSync, sync } = useLiturgicalStore();
  const READINGS = storeReadings?.length > 0 ? storeReadings : STATIC_READINGS;
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const noReadings = !storeReadings || storeReadings.length === 0;
    const notToday =
      !lastSync || new Date(lastSync).toDateString() !== new Date().toDateString();
    if (noReadings || notToday) sync().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await sync();
    } catch (_) {}
    setRefreshing(false);
  }, [sync]);

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const litColor = Colors.liturgical[TODAY.liturgicalColor] ?? Colors.liturgical.green;
  const isSunday = _n.getDay() === 0;
  const readingsSub = isSunday ? '1ª · Sal · 2ª · Ev' : '1ª · Sal · Ev';

  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={litColor}
        />
      }
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[s.pageHeader, { paddingTop: insets.top, backgroundColor: bg }]}>
        <LitBar />
        <View style={s.headerRow}>
          <TauWordmark width={90} color={ink} accentColor={litColor} />
          <TouchableOpacity style={s.bellBtn} activeOpacity={0.7}>
            <IconBell color={muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tarjeta del día ─────────────────────────────────────────── */}
      <View style={s.sectionPad}>
        <View style={[s.heroCard, { backgroundColor: surface }, !dark && s.heroShadow]}>
          {/* Franja de color litúrgico */}
          <View style={[s.heroStripe, { backgroundColor: litColor }]} />

          <View style={s.heroBody}>
            {/* τ marca de agua */}
            <View style={s.heroWatermark} pointerEvents="none">
              <Tau size={160} color={litColor} style={{ opacity: dark ? 0.06 : 0.05 }} />
            </View>

            {/* Fecha */}
            <Text style={[s.heroDate, { color: muted }]}>
              {TODAY.weekday.toUpperCase()} · {TODAY.dateShort.toUpperCase()}
            </Text>

            {/* Temporada en color litúrgico */}
            <Text style={[s.heroSeason, { color: litColor }]} numberOfLines={1}>
              {TODAY.season}
            </Text>

            {/* Celebración */}
            <Text style={[s.heroCelebration, { color: ink }]}>{TODAY.celebration}</Text>

            {/* Badges */}
            <View style={s.heroBadges}>
              <View
                style={[
                  s.colorPill,
                  { backgroundColor: litColor + '20', borderColor: litColor + '50' },
                ]}
              >
                <LitDot color={TODAY.liturgicalColor} size={6} />
                <Text style={[s.colorPillText, { color: litColor }]}>
                  {TODAY.liturgicalColorLabel}
                </Text>
              </View>
              {TODAY.grade !== 'Feria' && (
                <View
                  style={[
                    s.neutralPill,
                    {
                      backgroundColor: dark
                        ? 'rgba(255,255,255,0.08)'
                        : Colors.surface.secondary,
                      borderColor: border,
                    },
                  ]}
                >
                  <Text style={[s.neutralPillText, { color: muted }]}>{TODAY.grade}</Text>
                </View>
              )}
              <View
                style={[
                  s.neutralPill,
                  {
                    backgroundColor: dark
                      ? 'rgba(255,255,255,0.08)'
                      : Colors.surface.secondary,
                    borderColor: border,
                  },
                ]}
              >
                <Text style={[s.neutralPillText, { color: muted }]}>{CYCLE.label}</Text>
              </View>
            </View>
          </View>

          {/* Footer: CTA lecturas integrado */}
          <TouchableOpacity
            style={[s.heroFooter, { borderTopColor: border }]}
            onPress={() => navigation.navigate('Lecturas', { date: TODAY_ISO })}
            activeOpacity={0.75}
          >
            <View style={[s.heroFooterIcon, { backgroundColor: litColor + '18' }]}>
              <IconBook color={litColor} size={18} />
            </View>
            <View style={s.heroFooterBody}>
              <Text style={[s.heroFooterTitle, { color: ink }]}>Lecturas del día</Text>
              <Text style={[s.heroFooterSub, { color: muted }]}>{readingsSub}</Text>
            </View>
            <View style={[s.heroFooterArrow, { backgroundColor: litColor + '15' }]}>
              <IconChevron color={litColor} size={16} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Lista compacta de lecturas ───────────────────────────────── */}
      <View style={s.sectionPad}>
        <SectionTitle
          action="Ver todas"
          onActionPress={() => navigation.navigate('Lecturas', { date: TODAY_ISO })}
        >
          Lecturas de hoy
        </SectionTitle>
        <View style={[s.readingList, { backgroundColor: surface, borderColor: border }]}>
          {READINGS.map((r, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => navigation.navigate('Lecturas', { date: TODAY_ISO })}
              activeOpacity={0.7}
              style={[
                s.readingRow,
                i < READINGS.length - 1 && {
                  borderBottomWidth: 0.5,
                  borderBottomColor: border,
                },
              ]}
            >
              <View
                style={[
                  s.typeTag,
                  { backgroundColor: litColor + '15', borderColor: litColor + '35' },
                ]}
              >
                <Text style={[s.typeTagText, { color: litColor }]}>
                  {_typeShort(r.type)}
                </Text>
              </View>
              <View style={s.readingMeta}>
                <Text style={[s.readingType, { color: muted }]}>{r.type}</Text>
                <Text style={[s.readingRef, { color: ink }]} numberOfLines={1}>
                  {r.ref}
                </Text>
              </View>
              <IconChevron color={muted} size={14} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Tiempos litúrgicos ───────────────────────────────────────── */}
      <View style={s.sectionPad}>
        <SectionTitle>Tiempos litúrgicos</SectionTitle>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.seasonsScroll}
        >
          {SEASONS.map((season) => {
            const sColor = Colors.liturgical[season.color] ?? Colors.liturgical.green;
            return (
              <View
                key={season.name}
                style={[
                  s.seasonCard,
                  {
                    backgroundColor: surface,
                    borderWidth: season.active ? 1.5 : 0.5,
                    borderColor: season.active ? sColor : border,
                  },
                ]}
              >
                <View
                  style={[
                    s.seasonStripe,
                    { backgroundColor: sColor, opacity: season.active ? 1 : 0.45 },
                  ]}
                />
                <View style={s.seasonBody}>
                  <Text style={[s.seasonRange, { color: muted }]}>{season.range}</Text>
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
                          width: `${Math.max(season.progress * 100, 2)}%`,
                          backgroundColor: sColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.seasonDays, { color: season.active ? sColor : muted }]}>
                    {season.days}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Próximas celebraciones ───────────────────────────────────── */}
      <View style={s.sectionPad}>
        <SectionTitle
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
            const uColor = Colors.liturgical[u.color] ?? Colors.liturgical.green;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.upcomingItem,
                  i > 0 && { borderTopWidth: 0.5, borderTopColor: border },
                ]}
                onPress={() => navigation.navigate('Calendario')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.dateBadge,
                    {
                      backgroundColor: dark
                        ? 'rgba(255,255,255,0.05)'
                        : Colors.surface.secondary,
                      borderColor: border,
                    },
                  ]}
                >
                  <Text style={[s.dateDow, { color: muted }]}>{dow}</Text>
                  <Text style={[s.dateDay, { color: ink }]}>{day}</Text>
                </View>
                <View style={s.upcomingInfo}>
                  <Text
                    style={[
                      s.upcomingName,
                      { color: ink },
                      u.solemn && s.upcomingNameSolemn,
                    ]}
                    numberOfLines={2}
                  >
                    {u.name}
                  </Text>
                  {u.solemn && <Text style={s.solemnLabel}>Solemnidad</Text>}
                </View>
                <View
                  style={[
                    s.upcomingDot,
                    { backgroundColor: uColor + '20', borderColor: uColor + '50' },
                  ]}
                >
                  <LitDot color={u.color} size={8} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

/* ── Estilos ─────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  pageHeader: {},
  litBar: { flexDirection: 'row', height: 4 },
  litSeg: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  bellBtn: { padding: 6 },

  /* Hero card */
  sectionPad: { paddingHorizontal: 20, paddingTop: 16 },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroStripe: { height: 5 },
  heroBody: {
    padding: 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  heroWatermark: {
    position: 'absolute',
    right: -20,
    top: -10,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  heroSeason: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 14,
    marginBottom: 8,
  },
  heroCelebration: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: -0.5,
    marginBottom: 16,
    maxWidth: '78%',
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  colorPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  neutralPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  neutralPillText: { fontSize: 11, fontWeight: '500' },

  /* Footer lecturas del héroe */
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderTopWidth: 0.5,
  },
  heroFooterIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroFooterBody: { flex: 1 },
  heroFooterTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  heroFooterSub: { fontSize: 11, lineHeight: 15 },
  heroFooterArrow: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* Lista de lecturas */
  readingList: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 54,
  },
  typeTag: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  readingMeta: { flex: 1 },
  readingType: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  readingRef: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 17,
    lineHeight: 20,
  },

  /* Tiempos litúrgicos */
  seasonsScroll: { gap: 10, paddingBottom: 4 },
  seasonCard: { width: 190, borderRadius: 14, overflow: 'hidden', flexShrink: 0 },
  seasonStripe: { height: 4 },
  seasonBody: { padding: 14, paddingTop: 12 },
  seasonRange: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  seasonName: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 17,
    lineHeight: 21,
    marginBottom: 14,
  },
  progressTrack: { height: 3, borderRadius: 999, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 999 },
  seasonDays: { fontSize: 12, fontWeight: '600' },

  /* Próximas celebraciones */
  upcomingList: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateBadge: {
    width: 46,
    height: 46,
    borderRadius: 11,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateDow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 20,
    lineHeight: 22,
  },
  upcomingInfo: { flex: 1 },
  upcomingName: { fontSize: 14, fontWeight: '500', lineHeight: 19 },
  upcomingNameSolemn: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 16,
  },
  solemnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.liturgical.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  upcomingDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
