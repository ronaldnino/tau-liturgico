import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useSettingsStore } from '../store';
import { buildMonthGrid, LITURGICAL_LABELS } from '../data/liturgical';

/* ── Constantes ─────────────────────────────────────────────────────────── */

const W = Dimensions.get('window').width;
const GRID_H_PAD = 20;
const CELL_SIZE = Math.floor((W - GRID_H_PAD * 2) / 7);

const LIT_COLORS = Object.values(Colors.liturgical);

const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MONTHS_CAP = [
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
const MONTHS_MIN = [
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
const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const _now = new Date();
const CUR_YEAR = _now.getFullYear();
const CUR_MONTH = _now.getMonth();
const TODAY_DAY = _now.getDate();

function _iso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const TODAY_ISO = _iso(CUR_YEAR, CUR_MONTH, TODAY_DAY);

/* ── Iconos SVG ─────────────────────────────────────────────────────────── */

function IcoChevLeft({ c, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcoChevRight({ c, size = 20 }) {
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

function IcoBook({ color, size = 20 }) {
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

/* ── Celda del día ──────────────────────────────────────────────────────── */

function DayCell({ cell, isSelected, ink, muted, onPress }) {
  const { day, inMonth, isToday, color, solemn, grade } = cell;
  const litColor = Colors.liturgical[color] ?? Colors.liturgical.green;

  // Jerarquía visual por tamaño del punto; el color siempre es el litúrgico real
  const dotSize = solemn ? 6 : grade === 'Domingo' ? 5 : 4;
  // Días blancos: borde visible en lugar de relleno invisible sobre fondo claro
  const isWhite = color === 'white';
  const dotStyle = isWhite
    ? { width: dotSize, height: dotSize, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.liturgical.white }
    : { width: dotSize, height: dotSize, backgroundColor: litColor };

  const numColor = isSelected
    ? '#fff'
    : isToday
      ? Colors.brand.primary
      : inMonth
        ? ink
        : muted;

  return (
    <TouchableOpacity
      style={s.dayCell}
      onPress={() => onPress(cell)}
      activeOpacity={inMonth ? 0.65 : 1}
      disabled={!inMonth}
    >
      <View
        style={[
          s.dayCellCircle,
          isSelected && s.dayCellSelected,
          isToday && !isSelected && s.dayCellToday,
        ]}
      >
        <Text style={[s.dayNum, { color: numColor }, !inMonth && s.dayNumFaded]}>
          {day}
        </Text>
      </View>
      {inMonth ? (
        <View style={[s.dayCellDot, dotStyle]} />
      ) : (
        <View style={s.dayCellDotEmpty} />
      )}
    </TouchableOpacity>
  );
}

/* ── Pantalla principal ─────────────────────────────────────────────────── */

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

  const selectedISO = _iso(viewYear, viewMonth, selectedDay);
  const isCurrentMonth = viewYear === CUR_YEAR && viewMonth === CUR_MONTH;

  /* Celda seleccionada */
  const selectedCell = useMemo(
    () => monthGrid.find((c) => c.inMonth && c.day === selectedDay) ?? null,
    [monthGrid, selectedDay]
  );

  /* Datos del panel */
  const selColor = selectedCell?.color ?? 'green';
  const selLitColor = Colors.liturgical[selColor] ?? Colors.liturgical.green;
  const selLabel = LITURGICAL_LABELS[selColor] ?? {
    name: 'Verde',
    meaning: 'Tiempo Ordinario',
  };
  const selGrade = selectedCell?.grade ?? 'Feria';
  const selWeekday = selectedCell
    ? WEEKDAYS[selectedCell.dow]
    : WEEKDAYS[new Date(viewYear, viewMonth, selectedDay).getDay()];
  const isSunday = selectedCell?.dow === 0;
  const readingsSub = isSunday ? '1ª · Sal · 2ª · Ev' : '1ª · Sal · Ev';

  /* Navegación */
  const goToPrev = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
    setSelectedDay(1);
  }, []);

  const goToNext = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
    setSelectedDay(1);
  }, []);

  const goToToday = useCallback(() => {
    setViewYear(CUR_YEAR);
    setViewMonth(CUR_MONTH);
    setSelectedDay(TODAY_DAY);
  }, []);

  const handleDayPress = useCallback((cell) => {
    if (!cell.inMonth) return;
    setSelectedDay(cell.day);
  }, []);

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={[s.topBar, { paddingTop: insets.top, backgroundColor: bg }]}>
        <LitBar />
        <View style={s.header}>
          <TouchableOpacity onPress={goToPrev} style={s.navBtn} activeOpacity={0.7}>
            <IcoChevLeft c={ink} />
          </TouchableOpacity>

          <View style={s.monthBlock}>
            <Text style={[s.monthText, { color: ink }]}>{MONTHS_CAP[viewMonth]}</Text>
            <Text style={[s.yearText, { color: muted }]}>{viewYear}</Text>
          </View>

          <TouchableOpacity onPress={goToNext} style={s.navBtn} activeOpacity={0.7}>
            <IcoChevRight c={ink} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToToday}
            style={[s.todayBtn, isCurrentMonth && s.todayBtnMuted]}
            activeOpacity={0.8}
          >
            <Text style={s.todayBtnText}>Hoy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Grid del calendario ──────────────────────────────────────── */}
      <View style={s.grid}>
        {/* Cabecera: L M M J V S D */}
        <View style={s.gridRow}>
          {DAY_HEADERS.map((h, i) => (
            <View key={i} style={s.dayHeaderCell}>
              <Text style={[s.dayHeaderText, { color: muted }]}>{h}</Text>
            </View>
          ))}
        </View>

        {/* 6 semanas */}
        {Array.from({ length: 6 }, (_, w) => (
          <View key={w} style={s.gridRow}>
            {monthGrid.slice(w * 7, w * 7 + 7).map((cell, d) => (
              <DayCell
                key={d}
                cell={cell}
                isSelected={cell.inMonth && cell.day === selectedDay}
                ink={ink}
                muted={muted}
                onPress={handleDayPress}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Espaciador flex */}
      <View style={s.spacer} />

      {/* ── Panel del día seleccionado ───────────────────────────────── */}
      <View
        style={[
          s.panel,
          {
            backgroundColor: surface,
            borderTopColor: border,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Franja de color litúrgico */}
        <View style={[s.panelStripe, { backgroundColor: selLitColor }]} />

        <View style={s.panelContent}>
          {/* Fecha + pill Hoy */}
          <View style={s.panelDateRow}>
            <Text style={[s.panelDate, { color: muted }]}>
              {selWeekday.slice(0, 3).toUpperCase()} · {selectedDay} de{' '}
              {MONTHS_MIN[viewMonth]}
            </Text>
            {selectedISO === TODAY_ISO && (
              <View style={s.todayPill}>
                <Text style={s.todayPillText}>HOY</Text>
              </View>
            )}
          </View>

          {/* Celebración(es) del día */}
          {selectedCell?.celebrations?.length > 1 ? (
            // Múltiples celebraciones: lista con jerarquía visual
            <View style={s.celebList}>
              {selectedCell.celebrations.map((cel, i) => {
                const celColor = Colors.liturgical[cel.color] ?? Colors.liturgical.green;
                const isPrimary = i === 0;
                return (
                  <View
                    key={i}
                    style={[
                      s.celebRow,
                      { borderLeftColor: celColor },
                      !isPrimary && { marginTop: 6, opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        isPrimary ? s.celebNamePrimary : s.celebNameSecondary,
                        { color: ink },
                      ]}
                      numberOfLines={2}
                    >
                      {cel.name}
                    </Text>
                    <View style={[s.celebGradePill, { backgroundColor: celColor + '18', borderColor: celColor + '45' }]}>
                      <Text style={[s.celebGradeText, { color: celColor }]}>{cel.grade}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            // Celebración única o feria: título prominente
            <Text style={[s.panelName, { color: ink }]} numberOfLines={2}>
              {selectedCell?.name ?? 'Feria'}
            </Text>
          )}

          {/* Meta: color litúrgico + temporada */}
          <View style={s.panelMeta}>
            <View
              style={[
                s.colorPill,
                { backgroundColor: selLitColor + '22', borderColor: selLitColor + '55' },
              ]}
            >
              <View style={[s.colorDot, { backgroundColor: selLitColor }]} />
              <Text style={[s.colorPillText, { color: selLitColor }]}>
                {selLabel.name}
              </Text>
            </View>
            {selectedCell?.celebrations?.length <= 1 && selGrade !== 'Feria' && (
              <Text style={[s.metaText, { color: muted }]}>· {selGrade}</Text>
            )}
            {selLabel.meaning ? (
              <Text style={[s.metaText, { color: muted }]} numberOfLines={1}>
                · {selLabel.meaning}
              </Text>
            ) : null}
          </View>

          {/* CTA lecturas */}
          <TouchableOpacity
            style={[
              s.readingsCard,
              { borderColor: selLitColor + '44', backgroundColor: selLitColor + '09' },
            ]}
            onPress={() =>
              navigation.navigate('Lecturas', {
                date: selectedISO,
                color: selColor,
                celebration: selectedCell?.name ?? null,
              })
            }
            activeOpacity={0.82}
          >
            <View style={[s.readingsIcon, { backgroundColor: selLitColor + '20' }]}>
              <IcoBook color={selLitColor} size={20} />
            </View>
            <View style={s.readingsBody}>
              <Text style={[s.readingsTitle, { color: ink }]}>Lecturas del día</Text>
              <Text style={[s.readingsSub, { color: muted }]}>{readingsSub}</Text>
            </View>
            <View style={[s.readingsArrow, { backgroundColor: selLitColor + '18' }]}>
              <IcoChevRight c={selLitColor} size={18} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ── Estilos ─────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  topBar: {},
  litBar: { flexDirection: 'row', height: 4 },
  litSeg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  navBtn: { padding: 8 },
  monthBlock: { flex: 1, alignItems: 'center' },
  monthText: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 25,
  },
  yearText: { fontSize: 12, fontWeight: '500', letterSpacing: 1 },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.brand.primary,
    marginLeft: 4,
  },
  todayBtnMuted: { opacity: 0.35 },
  todayBtnText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },

  /* Grid */
  grid: { paddingHorizontal: GRID_H_PAD },
  gridRow: { flexDirection: 'row' },
  dayHeaderCell: {
    width: CELL_SIZE,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  /* Celdas */
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayCellCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: Colors.brand.primary },
  dayCellToday: { borderWidth: 1.5, borderColor: Colors.brand.primary },
  dayNum: { fontSize: 15, fontWeight: '400' },
  dayNumFaded: { opacity: 0.22 },
  dayCellDot: { width: 4, height: 4, borderRadius: 999 },
  dayCellDotEmpty: { width: 4, height: 4 },

  spacer: { flex: 1 },

  /* Panel inferior */
  panel: {
    borderTopWidth: 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  panelStripe: { height: 4 },
  panelContent: { padding: 20, paddingTop: 16 },

  panelDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  panelDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Colors.brand.primary,
  },
  todayPillText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  panelName: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 26,
    lineHeight: 30,
    marginBottom: 10,
  },

  /* Lista de celebraciones múltiples */
  celebList: { marginBottom: 10, gap: 2 },
  celebRow: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  celebNamePrimary: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 26,
    flex: 1,
  },
  celebNameSecondary: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  celebGradePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  celebGradeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

  panelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  colorDot: { width: 6, height: 6, borderRadius: 999 },
  colorPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  metaText: { fontSize: 12, fontWeight: '400' },

  readingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  readingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingsBody: { flex: 1 },
  readingsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  readingsSub: { fontSize: 11, lineHeight: 16 },
  readingsArrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
