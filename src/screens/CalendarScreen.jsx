import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
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

function _isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function _buildMarkedDates(grid, viewYear, viewMonth, selectedISO) {
  const dates = {};
  grid.forEach(({ day, inMonth, color, solemn, name, isToday, dow }) => {
    if (!inMonth) return;
    const key = _isoDate(viewYear, viewMonth, day);
    const hasFeast = name !== null;
    const isSunday = dow === 0;
    const litColor = Colors.liturgical[color] ?? Colors.liturgical.green;
    const dotColor = solemn ? Colors.liturgical.gold : litColor;
    dates[key] = {
      dots: hasFeast || isSunday ? [{ key: color, color: dotColor }] : [],
      selected: key === selectedISO,
      today: isToday,
      selectedColor: Colors.brand.primary,
    };
  });
  return dates;
}

export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');

  const [viewYear, setViewYear] = useState(CUR_YEAR);
  const [viewMonth, setViewMonth] = useState(CUR_MONTH);
  const [selectedDay, setSelectedDay] = useState(TODAY_DAY);

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const monthGrid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const selectedISO = _isoDate(viewYear, viewMonth, selectedDay);

  const markedDates = useMemo(
    () => _buildMarkedDates(monthGrid, viewYear, viewMonth, selectedISO),
    [monthGrid, viewYear, viewMonth, selectedISO]
  );

  const selectedCell = useMemo(
    () => monthGrid.find((c) => c.inMonth && c.day === selectedDay) ?? null,
    [monthGrid, selectedDay]
  );

  const goToPrevMonth = useCallback(() => {
    let y = viewYear;
    let m = viewMonth;
    if (m === 0) {
      y -= 1;
      m = 11;
    } else {
      m -= 1;
    }
    const maxDay = new Date(y, m + 1, 0).getDate();
    setViewYear(y);
    setViewMonth(m);
    setSelectedDay((d) => Math.min(d, maxDay));
  }, [viewYear, viewMonth]);

  const goToNextMonth = useCallback(() => {
    let y = viewYear;
    let m = viewMonth;
    if (m === 11) {
      y += 1;
      m = 0;
    } else {
      m += 1;
    }
    const maxDay = new Date(y, m + 1, 0).getDate();
    setViewYear(y);
    setViewMonth(m);
    setSelectedDay((d) => Math.min(d, maxDay));
  }, [viewYear, viewMonth]);

  const goToToday = useCallback(() => {
    setViewYear(CUR_YEAR);
    setViewMonth(CUR_MONTH);
    setSelectedDay(TODAY_DAY);
  }, []);

  const handleDayPress = useCallback(
    (day) => {
      const [y, m] = day.dateString.split('-').map(Number);
      setSelectedDay(day.day);
      if (y !== viewYear || m - 1 !== viewMonth) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    },
    [viewYear, viewMonth]
  );

  const currentMonthISO = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
  const isViewingCurrentMonth = viewYear === CUR_YEAR && viewMonth === CUR_MONTH;

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header mes */}
      <View style={s.header}>
        <TouchableOpacity style={s.chevBtn} onPress={goToPrevMonth}>
          <Text style={[s.chev, { color: ink }]}>‹</Text>
        </TouchableOpacity>
        <View style={s.monthCenter}>
          <Text style={[s.month, { color: ink }]}>{_MONTHS_ES_CAP[viewMonth]}</Text>
          <Text style={[s.year, { color: muted }]}>{viewYear}</Text>
        </View>
        <TouchableOpacity
          style={[s.todayBtn, isViewingCurrentMonth && s.todayBtnMuted]}
          onPress={goToToday}
        >
          <Text style={s.todayBtnText}>Hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Calendario */}
      <Calendar
        key={currentMonthISO}
        current={currentMonthISO}
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={handleDayPress}
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
          { c: 'white', l: 'Pascua/Navidad' },
          { c: 'purple', l: 'Adviento/Cuaresma' },
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
            {selectedCell
              ? _WEEKDAYS_ES[selectedCell.dow]
              : _WEEKDAYS_ES[new Date(viewYear, viewMonth, selectedDay).getDay()]}{' '}
            · {selectedDay} de {_MONTHS_ES[viewMonth]}
          </Text>
          {selectedISO === TODAY_ISO && (
            <View style={s.todayPill}>
              <Text style={s.todayPillText}>Hoy</Text>
            </View>
          )}
        </View>
        <Text style={[s.panelName, { color: ink }]}>{selectedCell?.name ?? 'Feria'}</Text>
        <View style={s.panelBadgeRow}>
          <LitBadge
            color={selectedCell?.color ?? 'green'}
            style={{
              backgroundColor:
                (Colors.liturgical[selectedCell?.color ?? 'green'] ??
                  Colors.liturgical.green) + '20',
            }}
          >
            <Text
              style={{
                color:
                  Colors.liturgical[selectedCell?.color ?? 'green'] ??
                  Colors.liturgical.green,
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {LITURGICAL_LABELS[selectedCell?.color ?? 'green']?.name ?? 'Verde'}
            </Text>
          </LitBadge>
          <Text style={[s.panelGrade, { color: muted }]}>
            {selectedCell?.grade ?? 'Feria'}
          </Text>
        </View>
        <TouchableOpacity
          style={s.panelBtn}
          onPress={() =>
            navigation.navigate('Lecturas', {
              date: selectedISO,
              color: selectedCell?.color ?? 'green',
              celebration: selectedCell?.name ?? null,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={s.panelBtnText}>Ver lecturas →</Text>
        </TouchableOpacity>
      </View>
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
  todayBtnMuted: { opacity: 0.4 },
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
