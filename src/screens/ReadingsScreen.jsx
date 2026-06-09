import React, { useState, useRef, useEffect } from 'react';
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
import { READINGS as STATIC_READINGS, TODAY } from '../data/liturgical';

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

function useTTSPlayer(voiceId) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const voiceRef = useRef(voiceId);
  useEffect(() => {
    voiceRef.current = voiceId;
  }, [voiceId]);

  useEffect(() => {
    Tts.setDefaultLanguage('es-MX');
    Tts.setDefaultPitch(1.0);
    Tts.setDefaultRate(0.42);

    const s1 = Tts.addEventListener('tts-start', () => {
      setIsPlaying(true);
      setProgress(0);
    });
    const s2 = Tts.addEventListener('tts-finish', () => {
      setIsPlaying(false);
      setProgress(100);
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

  const play = (idx, text) => {
    Tts.stop();
    if (voiceRef.current) Tts.setDefaultVoice(voiceRef.current).catch(() => {});
    setActiveIdx(idx);
    setProgress(0);
    Tts.speak(text);
  };

  const pause = () => {
    Tts.stop();
    setIsPlaying(false);
  };

  const toggle = (idx, text) => {
    if (isPlaying && activeIdx === idx) pause();
    else play(idx, text);
  };

  return { isPlaying, activeIdx, progress, toggle };
}

export default function ReadingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const {
    darkMode,
    ttsSpeed,
    ttsVoiceId: ttsGender,
    setTtsVoiceId: setTtsGender,
  } = useSettingsStore();
  const { bookmarks, addBookmark, removeBookmark } = useNotesStore();
  const { readings: storeReadings, isLoading, sync } = useLiturgicalStore();
  const READINGS = storeReadings?.length > 0 ? storeReadings : STATIC_READINGS;
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const gender = ttsGender === 'male' ? 'male' : 'female';
  const [activeReading, setActiveReading] = useState(0);
  const [voiceMap, setVoiceMap] = useState({ female: null, male: null });
  const activeVoiceId = voiceMap[gender]?.id ?? null;
  const { isPlaying, activeIdx, progress, toggle } = useTTSPlayer(activeVoiceId);

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

  // Sincronizar si no hay lecturas, hay un número incorrecto, o no es de hoy
  const { lastSync } = useLiturgicalStore();
  useEffect(() => {
    const noReadings = !storeReadings || storeReadings.length === 0;
    const badCount = storeReadings && (storeReadings.length < 3 || storeReadings.length > 4);
    const notToday = !lastSync || new Date(lastSync).toDateString() !== new Date().toDateString();
    if (noReadings || badCount || notToday) sync().catch(() => {});
  }, []);

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
          <Text style={[s.headerDate, { color: muted }]}>{TODAY.dateShort}</Text>
          <Text style={[s.headerTitle, { color: ink }]}>
            {isLoading ? 'Cargando…' : 'Lecturas'}
          </Text>
        </View>
        <LitBadge color={TODAY.liturgicalColor}>
          {TODAY.liturgicalColorLabel.split(' · ')[0]}
        </LitBadge>
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

      {/* Texto de la lectura */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        <Text style={[s.readingType, { color: muted }]}>
          {READINGS[activeReading]?.type}
        </Text>
        <Text style={[s.readingRef, { color: Colors.brand.primary }]}>
          {READINGS[activeReading]?.ref}
        </Text>
        <Text style={[s.readingIntro, { color: muted }]}>
          {READINGS[activeReading]?.intro}
        </Text>
        <Text style={[s.readingText, { color: ink }]}>
          {READINGS[activeReading]?.text}
        </Text>
        <View style={[s.closingRow, { borderTopColor: border }]}>
          <Text style={[s.closing, { color: muted }]}>
            {READINGS[activeReading]?.closing}
          </Text>
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
            onPress={() => toggle(activeReading, READINGS[activeReading]?.text ?? '')}
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

          {/* Velocidad */}
          <View style={[s.speedBadge, { borderColor: border }]}>
            <Text style={[s.speedText, { color: muted }]}>{ttsSpeed || 1}×</Text>
          </View>
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
  readingIntro: {
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  readingText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 18,
    lineHeight: 30,
    marginBottom: 24,
  },
  closingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 0.5,
    gap: 12,
  },
  closing: { flex: 1, fontStyle: 'italic', fontSize: 14 },
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
});
