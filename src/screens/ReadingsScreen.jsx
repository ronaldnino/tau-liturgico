import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Tts from 'react-native-tts';
import { Colors } from '../theme';
import { LitBadge } from '../components';
import { useSettingsStore, useNotesStore, useLiturgicalStore } from '../store';
import {
  READINGS as STATIC_READINGS,
  TODAY,
  LITURGICAL_LABELS,
} from '../data/liturgical';
import { fetchDailyReadings } from '../services/lectionary';

const _rNow = new Date();
const TODAY_ISO = `${_rNow.getFullYear()}-${String(_rNow.getMonth() + 1).padStart(2, '0')}-${String(_rNow.getDate()).padStart(2, '0')}`;
const _MONTHS_SHORT_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const READING_LABELS = [
  { short: '1ª', label: 'Primera Lectura' },
  { short: 'Sal', label: 'Salmo Responsorial' },
  { short: 'Ev', label: 'Evangelio' },
];

const MALE_NAMES = ['jorge', 'juan', 'diego', 'carlos', 'miguel', 'antonio'];
const FEMALE_NAMES = [
  'paulina',
  'mónica',
  'monica',
  'luciana',
  'isabel',
  'sofía',
  'sofia',
  'laura',
];

function isMaleVoice(v) {
  return MALE_NAMES.some((n) => v.name?.toLowerCase().includes(n));
}
function isFemaleVoice(v) {
  return FEMALE_NAMES.some((n) => v.name?.toLowerCase().includes(n));
}

function bestSpanish(voices, predicate) {
  return (
    voices
      .filter(
        (v) =>
          v.language?.startsWith('es') &&
          !v.notInstalled &&
          !v.networkConnectionRequired &&
          predicate(v)
      )
      .sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0))[0] ?? null
  );
}

const _BASE_RATE = 0.42; // tasa que suena natural a 1× en es-MX

function useTTSPlayer(voiceId, speed, onFinish) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const voiceRef = useRef(voiceId);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    voiceRef.current = voiceId;
  }, [voiceId]);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    Tts.setDefaultLanguage('es-MX');
    Tts.setDefaultPitch(1.0);

    const s1 = Tts.addEventListener('tts-start', () => {
      setIsPlaying(true);
      setProgress(0);
    });
    const s2 = Tts.addEventListener('tts-finish', () => {
      setIsPlaying(false);
      setProgress(100);
      onFinishRef.current?.();
    });
    const s3 = Tts.addEventListener('tts-cancel', () => {
      setIsPlaying(false);
    });
    const s4 = Tts.addEventListener('tts-progress', (e) => {
      if (e.end > 0) setProgress(Math.min(100, Math.round((e.start / e.end) * 100)));
    });

    return () => {
      Tts.stop();
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, []);

  const play = (idx, text, currentSpeed) => {
    Tts.stop();
    Tts.setDefaultRate(_BASE_RATE * (currentSpeed ?? speed ?? 1));
    if (voiceRef.current) Tts.setDefaultVoice(voiceRef.current).catch(() => {});
    setActiveIdx(idx);
    setProgress(0);
    Tts.speak(text);
  };

  const pause = () => {
    Tts.stop();
    setIsPlaying(false);
  };

  const toggle = (idx, text, currentSpeed) => {
    if (isPlaying && activeIdx === idx) pause();
    else play(idx, text, currentSpeed);
  };

  return { isPlaying, activeIdx, progress, toggle };
}

export default function ReadingsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const {
    darkMode,
    ttsSpeed,
    setTtsSpeed,
    ttsVoiceId: ttsGender,
    setTtsVoiceId: setTtsGender,
  } = useSettingsStore();
  const { bookmarks, addBookmark, removeBookmark } = useNotesStore();
  const {
    readings: storeReadings,
    isLoading,
    sync,
    error: syncError,
    readingsCache,
    cacheReading,
  } = useLiturgicalStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');

  // Fecha solicitada desde el calendario (ISO "YYYY-MM-DD") o null = hoy
  const targetDateISO = route?.params?.date ?? null;
  const routeColor = route?.params?.color ?? null;
  const routeCelebration = route?.params?.celebration ?? null;
  const isToday = !targetDateISO || targetDateISO === TODAY_ISO;

  // Lecturas para fechas no-hoy: { iso, readings, error } o null
  const [dateResult, setDateResult] = useState(null);

  // Resultado vigente solo si corresponde a la fecha activa
  const currentResult = dateResult?.iso === targetDateISO ? dateResult : null;

  const READINGS = isToday
    ? storeReadings?.length > 0
      ? storeReadings
      : STATIC_READINGS
    : (currentResult?.readings ?? []);

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const gender = ttsGender === 'male' ? 'male' : 'female';
  const [activeReading, setActiveReading] = useState(0);
  const [voiceMap, setVoiceMap] = useState({ female: null, male: null });
  const activeVoiceId = voiceMap[gender]?.id ?? null;

  // Auto-avance: ref evita race conditions entre el callback del hook y el render
  const autoAdvanceRef = useRef(false);
  const handleFinish = useCallback(() => {
    setActiveReading((prev) => {
      if (prev < READINGS.length - 1) {
        autoAdvanceRef.current = true;
        return prev + 1;
      }
      return prev;
    });
  }, [READINGS.length]);

  const { isPlaying, activeIdx, progress, toggle } = useTTSPlayer(
    activeVoiceId,
    ttsSpeed,
    handleFinish
  );

  // Dispara reproducción automática tras auto-avance
  useEffect(() => {
    if (!autoAdvanceRef.current) return;
    autoAdvanceRef.current = false;
    const text = READINGS[activeReading]?.text;
    if (!text) return;
    const t = setTimeout(() => toggle(activeReading, text, ttsSpeed), 600);
    return () => clearTimeout(t);
  }, [activeReading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opciones de velocidad — ciclado desde el badge del player
  const SPEED_OPTS = [0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = useCallback(() => {
    const idx = SPEED_OPTS.indexOf(ttsSpeed);
    setTtsSpeed(SPEED_OPTS[(idx + 1) % SPEED_OPTS.length]);
  }, [ttsSpeed, setTtsSpeed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Tts.voices()
      .then((all) => {
        setVoiceMap({
          female: bestSpanish(all, isFemaleVoice) ?? bestSpanish(all, () => true),
          male: bestSpanish(all, isMaleVoice),
        });
      })
      .catch(() => {});
  }, []);

  // Sincronizar lecturas de hoy si no están o están caducadas
  const { lastSync } = useLiturgicalStore();
  useEffect(() => {
    if (!isToday) return;
    const noReadings = !storeReadings || storeReadings.length === 0;
    const badCount =
      storeReadings && (storeReadings.length < 3 || storeReadings.length > 4);
    const notToday =
      !lastSync || new Date(lastSync).toDateString() !== new Date().toDateString();
    if (noReadings || badCount || notToday) sync().catch(() => {});
  }, [isToday]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar lecturas de la fecha seleccionada (con caché)
  useEffect(() => {
    if (isToday) return;
    const iso = targetDateISO;
    const cached = readingsCache[iso];
    // Cache hit: diferir setState para no llamarlo síncronamente en el body del effect
    const promise = cached
      ? Promise.resolve(cached)
      : fetchDailyReadings(
          (() => {
            const [y, m, d] = iso.split('-').map(Number);
            return new Date(y, m - 1, d);
          })()
        ).then((r) => {
          cacheReading(iso, r);
          return r;
        });
    promise
      .then((r) => {
        setDateResult({ iso, readings: r, error: null });
        setActiveReading(0);
      })
      .catch((e) => setDateResult({ iso, readings: null, error: e.message }));
  }, [targetDateISO]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    if (isToday) {
      sync().catch(() => {});
      return;
    }
    setDateResult(null);
    const [y, m, d] = targetDateISO.split('-').map(Number);
    fetchDailyReadings(new Date(y, m - 1, d))
      .then((r) => {
        cacheReading(targetDateISO, r);
        setDateResult({ iso: targetDateISO, readings: r, error: null });
        setActiveReading(0);
      })
      .catch((e) =>
        setDateResult({ iso: targetDateISO, readings: null, error: e.message })
      );
  }, [isToday, targetDateISO, sync, cacheReading]);

  // Encabezado según si es hoy u otra fecha
  const datePending = !isToday && !!targetDateISO && !currentResult;
  const showLoading = isToday ? isLoading : datePending;
  const headerDate = isToday
    ? TODAY.dateShort
    : (() => {
        const [y, m, d] = targetDateISO.split('-').map(Number);
        return `${d} ${_MONTHS_SHORT_ES[m - 1]} · ${y}`;
      })();
  const headerTitle = showLoading ? 'Cargando…' : 'Lecturas';
  const headerColorKey = isToday ? TODAY.liturgicalColor : (routeColor ?? 'green');
  const headerColorLabel = isToday
    ? TODAY.liturgicalColorLabel.split(' · ')[0]
    : (LITURGICAL_LABELS[headerColorKey]?.name ?? 'Verde');

  // Días adelante del día seleccionado y error de fetch
  const dateError = !isToday ? (currentResult?.error ?? null) : null;
  const daysAhead = !isToday
    ? (() => {
        const [y, m, d] = targetDateISO.split('-').map(Number);
        return Math.ceil((new Date(y, m - 1, d) - new Date()) / 86400000);
      })()
    : 0;

  const isBookmarked = (ref) => bookmarks.some((b) => b.ref === ref);

  const toggleBookmark = (reading) => {
    if (isBookmarked(reading.ref)) {
      const bm = bookmarks.find((b) => b.ref === reading.ref);
      if (bm) removeBookmark(bm.id);
    } else {
      addBookmark({
        id: Date.now().toString(),
        ref: reading.ref,
        text: reading.ref,
        date: TODAY.date,
      });
    }
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: surface,
            borderBottomColor: border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backArrow, { color: ink }]}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerDate, { color: muted }]}>{headerDate}</Text>
          <Text style={[s.headerTitle, { color: ink }]}>{headerTitle}</Text>
          {!isToday && routeCelebration ? (
            <Text style={[s.headerCelebration, { color: muted }]} numberOfLines={1}>
              {routeCelebration}
            </Text>
          ) : null}
        </View>
        <LitBadge color={headerColorKey}>{headerColorLabel}</LitBadge>
      </View>

      {/* Tabs de lecturas */}
      <View style={[s.tabs, { backgroundColor: surface, borderBottomColor: border }]}>
        {READING_LABELS.map((rl, i) => (
          <TouchableOpacity
            key={i}
            style={[
              s.tab,
              activeReading === i && { borderBottomColor: Colors.brand.primary },
            ]}
            onPress={() => setActiveReading(i)}
          >
            <Text
              style={[
                s.tabShort,
                { color: activeReading === i ? Colors.brand.primary : muted },
              ]}
            >
              {rl.short}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Texto de la lectura / estado vacío */}
      {READINGS.length === 0 ? (
        showLoading ? (
          <ReadingSkeleton dark={dark} />
        ) : (
          <View style={s.emptyState}>
            <Text style={[s.emptyText, { color: muted }]}>
              {daysAhead > 62
                ? 'Las lecturas de este día aún no están publicadas.\nDomínicos.org suele publicar con pocos días de antelación.'
                : dateError || (isToday && syncError)
                  ? 'No se pudieron cargar las lecturas.\nVerifica tu conexión a internet.'
                  : 'No hay lecturas disponibles para este día.'}
            </Text>
            {(dateError || (isToday && syncError)) && daysAhead <= 62 && (
              <TouchableOpacity
                onPress={handleRetry}
                style={s.retryBtn}
                activeOpacity={0.8}
              >
                <Text style={s.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
        >
          <Text style={[s.readingType, { color: muted }]}>
            {READINGS[activeReading]?.type}
          </Text>
          <Text style={[s.readingRef, { color: Colors.brand.primary }]}>
            {READINGS[activeReading]?.ref}
          </Text>

          {/* Separador del color litúrgico del día */}
          <View
            style={[
              s.refDivider,
              {
                backgroundColor:
                  Colors.liturgical[headerColorKey] ?? Colors.liturgical.green,
              },
            ]}
          />

          {/* Intro como epígrafe con borde lateral */}
          {READINGS[activeReading]?.intro ? (
            <View
              style={[
                s.introBox,
                {
                  backgroundColor:
                    (Colors.liturgical[headerColorKey] ?? Colors.liturgical.green) + '18',
                  borderLeftColor:
                    Colors.liturgical[headerColorKey] ?? Colors.liturgical.green,
                },
              ]}
            >
              <Text style={[s.readingIntro, { color: muted }]}>
                {READINGS[activeReading].intro}
              </Text>
            </View>
          ) : null}

          <Text style={[s.readingText, { color: ink }]}>
            {READINGS[activeReading]?.text}
          </Text>

          {/* Cierre litúrgico centrado y prominente */}
          <View style={[s.closingBlock, { borderTopColor: border }]}>
            {READINGS[activeReading]?.closing ? (
              <Text
                style={[
                  s.closingText,
                  {
                    color: Colors.liturgical[headerColorKey] ?? Colors.liturgical.green,
                  },
                ]}
              >
                {READINGS[activeReading].closing}
              </Text>
            ) : null}
            <TouchableOpacity
              onPress={() => toggleBookmark(READINGS[activeReading])}
              style={s.bookmarkBtn}
            >
              <Text
                style={{
                  fontSize: 20,
                  color: isBookmarked(READINGS[activeReading]?.ref)
                    ? Colors.brand.primary
                    : muted,
                }}
              >
                {isBookmarked(READINGS[activeReading]?.ref) ? '🔖' : '🏷'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Player TTS sticky */}
      <View
        style={[
          s.player,
          {
            backgroundColor: surface,
            borderTopColor: border,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        {/* Barra de progreso */}
        <View style={[s.progressTrack, { backgroundColor: border }]}>
          <View
            style={[
              s.progressFill,
              {
                width: `${isPlaying && activeIdx === activeReading ? progress : 0}%`,
                backgroundColor: Colors.brand.primary,
              },
            ]}
          />
        </View>

        {/* Controles */}
        <View style={s.playerControls}>
          {/* Navegar lectura anterior */}
          <TouchableOpacity
            onPress={() => setActiveReading((i) => Math.max(0, i - 1))}
            style={s.playerBtn}
            disabled={activeReading === 0}
          >
            <Text
              style={[s.playerBtnIcon, { color: activeReading === 0 ? border : ink }]}
            >
              ⏮
            </Text>
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            onPress={() =>
              toggle(activeReading, READINGS[activeReading]?.text ?? '', ttsSpeed)
            }
            style={[s.playBtn, { backgroundColor: Colors.brand.primary }]}
            activeOpacity={0.85}
          >
            <Text style={s.playBtnIcon}>
              {isPlaying && activeIdx === activeReading ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>

          {/* Navegar lectura siguiente */}
          <TouchableOpacity
            onPress={() => setActiveReading((i) => Math.min(READINGS.length - 1, i + 1))}
            style={s.playerBtn}
            disabled={activeReading === READINGS.length - 1}
          >
            <Text
              style={[
                s.playerBtnIcon,
                { color: activeReading === READINGS.length - 1 ? border : ink },
              ]}
            >
              ⏭
            </Text>
          </TouchableOpacity>

          {/* Velocidad — tappable para ciclar */}
          <TouchableOpacity
            onPress={cycleSpeed}
            style={[s.speedBadge, { borderColor: Colors.brand.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[s.speedText, { color: Colors.brand.primary }]}>
              {ttsSpeed || 1}×
            </Text>
          </TouchableOpacity>
        </View>

        {/* Label lectura + selector de voz */}
        <View style={s.playerFooter}>
          <Text style={[s.playerLabel, { color: muted }]}>
            {READING_LABELS[activeReading]?.label}
          </Text>
          <View style={s.voiceToggle}>
            <TouchableOpacity
              onPress={() => setTtsGender('female')}
              style={[
                s.voiceBtn,
                gender === 'female' && { backgroundColor: Colors.brand.primary },
              ]}
            >
              <Text
                style={[s.voiceBtnText, { color: gender === 'female' ? '#fff' : muted }]}
              >
                ♀ Mujer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                voiceMap.male ? setTtsGender('male') : Linking.openSettings()
              }
              style={[
                s.voiceBtn,
                gender === 'male' &&
                  voiceMap.male && { backgroundColor: Colors.brand.primary },
              ]}
            >
              <Text
                style={[
                  s.voiceBtnText,
                  { color: gender === 'male' && voiceMap.male ? '#fff' : muted },
                ]}
              >
                {voiceMap.male ? '♂ Hombre' : '♂ Instalar voz'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Skeleton de carga ──────────────────────────────────────────
function ReadingSkeleton({ dark }) {
  const [opacity] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const bg = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  return (
    <Animated.View style={[sk.wrap, { opacity }]}>
      <View style={[sk.line, { width: 90, height: 11, backgroundColor: bg }]} />
      <View
        style={[sk.line, { width: 180, height: 22, marginTop: 8, backgroundColor: bg }]}
      />
      <View
        style={[
          sk.line,
          { width: 36, height: 2, marginTop: 12, marginBottom: 4, backgroundColor: bg },
        ]}
      />
      {[1.0, 0.95, 1.0, 0.88, 0.92, 0.75].map((w, i) => (
        <View
          key={i}
          style={[
            sk.line,
            { width: `${w * 100}%`, height: 16, marginTop: 12, backgroundColor: bg },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const sk = StyleSheet.create({ wrap: { padding: 24 }, line: { borderRadius: 6 } });

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: { padding: 4, marginRight: 4 },
  backArrow: { fontSize: 28, lineHeight: 32 },
  headerCenter: { flex: 1 },
  headerDate: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 25,
  },
  headerCelebration: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 1,
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabShort: { fontSize: 13, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { padding: 24 },

  readingType: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  readingRef: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 20,
  },
  refDivider: {
    width: 36,
    height: 2,
    borderRadius: 1,
    marginTop: 4,
    marginBottom: 20,
  },
  introBox: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 10,
    paddingRight: 10,
    borderRadius: 6,
    marginBottom: 22,
  },
  readingIntro: {
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 22,
  },
  readingText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 18,
    lineHeight: 30,
    marginBottom: 32,
  },
  closingBlock: {
    paddingTop: 20,
    borderTopWidth: 0.5,
    alignItems: 'center',
    gap: 14,
  },
  closingText: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  bookmarkBtn: { padding: 8 },

  player: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  progressTrack: {
    height: 2,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: { height: '100%', borderRadius: 999 },

  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  playerBtn: { padding: 6 },
  playerBtnIcon: { fontSize: 20 },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnIcon: { fontSize: 22, color: '#fff' },
  speedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  speedText: { fontSize: 12, fontWeight: '600' },

  playerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  playerLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  voiceToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  voiceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  voiceBtnText: { fontSize: 11, fontWeight: '600' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 18,
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: Colors.brand.primary,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
