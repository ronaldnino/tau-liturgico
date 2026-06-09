import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../theme';
import { LitDot, LitBadge } from '../components';
import { useSettingsStore } from '../store';
import { buildMonthGrid, LITURGICAL_LABELS } from '../data/liturgical';

const _WEEKDAYS_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
const _MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const _MONTHS_ES_CAP = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const _now = new Date();
const CUR_YEAR = _now.getFullYear();
const CUR_MONTH = _now.getMonth();
const TODAY_DAY = _now.getDate();
const TODAY_ISO = `${CUR_YEAR}-${String(CUR_MONTH + 1).padStart(2, '0')}-${String(TODAY_DAY).padStart(2, '0')}`;
const MONTH_GRID = buildMonthGrid(CUR_YEAR, CUR_MONTH);

function buildMarkedDates(selected) {
  const dates = {};
  MONTH_GRID.forEach(({ day, inMonth, color, solemn, isToday }) => {
    if (!inMonth) return;
    const key = `${CUR_YEAR}-${String(CUR_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dotColor = solemn ? Colors.liturgical.gold : Colors.liturgical[color];
    dates[key] = {
      dots: [{ key: color, color: dotColor }],
      selected: day === selected,
      today: isToday,
      selectedColor: isToday ? Colors.brand.primary : Colors.brand.tint,
    };
  });
  return dates;
}

const DETAIL = {};

export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');
  const [selected, setSelected] = useState(TODAY_DAY);

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const detail = DETAIL[selected];

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header mes */}
      <View style={s.header}>
        <TouchableOpacity style={s.chevBtn}>
          <Text style={[s.chev, { color: ink }]}>‹</Text>
        </TouchableOpacity>
        <View style={s.monthCenter}>
          <Text style={[s.month, { color: ink }]}>{_MONTHS_ES_CAP[CUR_MONTH]}</Text>
          <Text style={[s.year, { color: muted }]}>{CUR_YEAR}</Text>
        </View>
        <TouchableOpacity style={s.todayBtn} onPress={() => setSelected(TODAY_DAY)}>
          <Text style={s.todayBtnText}>Hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Calendario */}
      <Calendar
        current={TODAY_ISO}
        markedDates={buildMarkedDates(selected)}
        markingType="multi-dot"
        onDayPress={(day) => setSelected(day.day)}
        hideArrows
        renderHeader={() => null}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          dayTextColor: ink,
          textDisabledColor: muted,
          todayTextColor: '#fff',
          selectedDayTextColor: '#fff',
          selectedDayBackgroundColor: Colors.brand.primary,
          dotColor: Colors.brand.primary,
          textSectionTitleColor: muted,
          textDayFontSize: 15,
        }}
      />

      {/* Leyenda */}
      <View style={s.legend}>
        {[
          { c: 'white', l: 'Pascua' },
          { c: 'red', l: 'Mártir' },
          { c: 'gold', l: 'Solemnidad' },
        ].map((it) => (
          <View key={it.l} style={s.legendItem}>
            <LitDot color={it.c} size={7} />
            <Text style={[s.legendText, { color: muted }]}>{it.l}</Text>
          </View>
        ))}
      </View>

      {/* Panel del día seleccionado */}
      {selected != null && (
        <View
          style={[
            s.panel,
            {
              backgroundColor: surface,
              borderTopColor: border,
              paddingBottom: insets.bottom + 14,
            },
          ]}
        >
          <View style={s.panelHandle} />
          <View style={s.panelDateRow}>
            <Text style={[s.panelDate, { color: muted }]}>
              {_WEEKDAYS_ES[new Date(CUR_YEAR, CUR_MONTH, selected).getDay()]} ·{' '}
              {selected} de {_MONTHS_ES[CUR_MONTH]}
            </Text>
            {selected === TODAY_DAY && (
              <View style={s.todayPill}>
                <Text style={s.todayPillText}>Hoy</Text>
              </View>
            )}
          </View>
          <Text style={[s.panelName, { color: ink }]}>
            {detail?.name ?? 'Feria del Tiempo Ordinario'}
          </Text>
          <View style={s.panelBadgeRow}>
            <LitBadge
              color={detail?.color ?? 'green'}
              style={{
                backgroundColor: Colors.liturgical[detail?.color ?? 'green'] + '15',
                color: Colors.liturgical[detail?.color ?? 'green'],
              }}
            >
              {LITURGICAL_LABELS[detail?.color ?? 'green']?.name ?? 'Verde'}
            </LitBadge>
            <Text style={[s.panelGrade, { color: muted }]}>
              {detail?.grade ?? 'Feria'}
            </Text>
          </View>
          <TouchableOpacity
            style={s.panelBtn}
            onPress={() => navigation.navigate('Lecturas')}
            activeOpacity={0.8}
          >
            <Text style={s.panelBtnText}>Ver lecturas →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chevBtn: { padding: 6 },
  chev: { fontSize: 28, lineHeight: 32 },
  monthCenter: { alignItems: 'center' },
  month: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 25,
  },
  year: { fontSize: 12, fontWeight: '500', letterSpacing: 1 },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.brand.primary,
  },
  todayBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, fontWeight: '500' },

  panel: {
    marginTop: 'auto',
    borderTopWidth: 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 14,
  },
  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.border.default,
    alignSelf: 'center',
    marginBottom: 14,
  },
  panelDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  panelDate: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Colors.brand.primary,
  },
  todayPillText: { color: '#fff', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  panelName: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 10,
  },
  panelBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  panelGrade: { fontSize: 12 },
  panelBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
  },
  panelBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
