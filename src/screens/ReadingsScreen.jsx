import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const _Sound = () => {
  const mod = require('react-native-sound');
  if (!mod)
    throw new Error(
      'react-native-sound no disponible. Corre: cd ios && pod install, luego reconstruye la app.'
    );
  return mod.default ?? mod;
};
const _Tts = () => require('react-native-tts').default;
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '../theme';
import { Tau } from '../components';
import { useSettingsStore, useNotesStore, useLiturgicalStore } from '../store';
import {
  READINGS as STATIC_READINGS,
  TODAY,
  LITURGICAL_LABELS,
} from '../data/liturgical';
import { fetchDailyReadings } from '../services/lectionary';
import { synthesize } from '../services/elevenlabs';

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

const _READING_SHORT = {
  'Primera Lectura': '1ª',
  'Segunda Lectura': '2ª',
  'Salmo Responsorial': 'Sal',
  'Santo Evangelio': 'Ev',
};
const _READING_PLAYER = {
  'Primera Lectura': '1ª Lectura',
  'Segunda Lectura': '2ª Lectura',
  'Salmo Responsorial': 'Salmo',
  'Santo Evangelio': 'Evangelio',
};
const _FALLBACK_LABELS = [
  { short: '1ª', label: 'Primera Lectura' },
  { short: 'Sal', label: 'Salmo Responsorial' },
  { short: 'Ev', label: 'Santo Evangelio' },
];

// ── Iconos SVG ────────────────────────────────────────────────────────────────
function IcoBack({ c }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoPlay({ c, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3l14 9-14 9V3z"
        fill={c}
        stroke={c}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoPause({ c, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="4" width="4" height="16" rx="1.5" fill={c} />
      <Rect x="14" y="4" width="4" height="16" rx="1.5" fill={c} />
    </Svg>
  );
}
function IcoSkipPrev({ c }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 20L9 12l10-8v16zM5 4v16"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoSkipNext({ c }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4l10 8-10 8V4zM19 4v16"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoBookmarkFilled({ c, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill={c} />
    </Svg>
  );
}
function IcoBookmarkOutline({ c, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function useElevenLabsPlayer(apiKey, voiceId, speed, onFinish) {
  const [playerState, setPlayerState] = useState('idle'); // idle | loading | playing | paused
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [wordRange, setWordRange] = useState({ start: -1, end: -1 });
  const [ttsError, setTtsError] = useState(null);

  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const wordsRef = useRef([]);
  const durationRef = useRef(0);
  const onFinishRef = useRef(onFinish);
  const tokenRef = useRef(0); // invalida callbacks de plays anteriores

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    try {
      const S = _Sound();
      if (typeof S?.setCategory === 'function') S.setCategory('Playback', false);
    } catch (_) {}
    return () => {
      clearInterval(timerRef.current);
      soundRef.current?.stop();
      soundRef.current?.release();
    };
  }, []);

  // Aplicar cambio de velocidad al sonido activo sin recargar audio
  useEffect(() => {
    soundRef.current?.setSpeed(speed ?? 1);
  }, [speed]);

  const _stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const _startTimer = (sound) => {
    _stopTimer();
    timerRef.current = setInterval(() => {
      sound.getCurrentTime((sec, isPlaying) => {
        if (!isPlaying) return;
        const dur = durationRef.current;
        if (dur > 0) setProgress(Math.min(99, Math.round((sec / dur) * 100)));
        // Buscar palabra activa por tiempo real (alignment de ElevenLabs)
        const words = wordsRef.current;
        let w = null;
        for (let i = words.length - 1; i >= 0; i--) {
          if (words[i].startSec <= sec) {
            w = words[i];
            break;
          }
        }
        setWordRange(w ? { start: w.start, end: w.end } : { start: -1, end: -1 });
      });
    }, 50);
  };

  const pause = useCallback(() => {
    _stopTimer();
    soundRef.current?.pause();
    setPlayerState('paused');
    setWordRange({ start: -1, end: -1 });
  }, []);

  const play = useCallback(
    async (idx, text) => {
      // Reanudar si es la misma lectura pausada
      if (playerState === 'paused' && activeIdx === idx && soundRef.current) {
        const myToken = ++tokenRef.current;
        soundRef.current.setSpeed(speed ?? 1);
        soundRef.current.play((ok) => {
          if (myToken !== tokenRef.current) return;
          _stopTimer();
          soundRef.current?.release();
          soundRef.current = null;
          setPlayerState('idle');
          setProgress(ok ? 100 : 0);
          setWordRange({ start: -1, end: -1 });
          if (ok) onFinishRef.current?.();
        });
        setPlayerState('playing');
        _startTimer(soundRef.current);
        return;
      }

      // Nueva lectura: cancelar reproducción actual
      const myToken = ++tokenRef.current;
      _stopTimer();
      soundRef.current?.stop();
      soundRef.current?.release();
      soundRef.current = null;

      setTtsError(null);
      setPlayerState('loading');
      setProgress(0);
      setWordRange({ start: -1, end: -1 });

      let result;
      try {
        result = await synthesize(apiKey, voiceId, text);
      } catch (e) {
        if (myToken !== tokenRef.current) return;
        setTtsError(e.message);
        setPlayerState('idle');
        return;
      }
      if (myToken !== tokenRef.current) return;

      const { audioPath, words } = result;
      const SoundClass = _Sound();
      const sound = new SoundClass(audioPath, '', (err) => {
        if (myToken !== tokenRef.current) {
          sound.release();
          return;
        }
        if (err) {
          setTtsError(err.message);
          setPlayerState('idle');
          return;
        }
        sound.setSpeed(speed ?? 1);
        wordsRef.current = words;
        durationRef.current = sound.getDuration();
        soundRef.current = sound;
        setActiveIdx(idx);
        setPlayerState('playing');
        setProgress(0);
        sound.play((ok) => {
          if (myToken !== tokenRef.current) return;
          _stopTimer();
          soundRef.current?.release();
          soundRef.current = null;
          setPlayerState('idle');
          setProgress(ok ? 100 : 0);
          setWordRange({ start: -1, end: -1 });
          if (ok) onFinishRef.current?.();
        });
        _startTimer(sound);
      });
    },
    [playerState, activeIdx, apiKey, voiceId, speed] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const stop = useCallback(() => {
    ++tokenRef.current; // invalida cualquier operación async en vuelo
    _stopTimer();
    soundRef.current?.stop();
    soundRef.current?.release();
    soundRef.current = null;
    setPlayerState('idle');
    setActiveIdx(0);
    setProgress(0);
    setWordRange({ start: -1, end: -1 });
    setTtsError(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    (idx, text) => {
      if (playerState === 'playing' && activeIdx === idx) pause();
      else play(idx, text);
    },
    [playerState, activeIdx, play, pause]
  );

  return {
    isPlaying: playerState === 'playing',
    isLoading: playerState === 'loading',
    activeIdx,
    progress,
    wordRange,
    ttsError,
    toggle,
    stop,
  };
}

// iOS: AVSpeechSynthesizer acepta rate en (0.0, 1.0) estricto; mapear escala 0.5–2×
function _ttsRate(speed) {
  const v = speed ?? 1;
  if (Platform.OS === 'ios') return Math.max(0.01, Math.min(0.99, v * 0.45));
  return v;
}

function useTTSPlayer(speed, onFinish) {
  const [playerState, setPlayerState] = useState('idle');
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [wordRange, setWordRange] = useState({ start: -1, end: -1 });

  const timerRef = useRef(null);
  const t0Ref = useRef(0);
  const charsPerMsRef = useRef(16 / 1000);
  const totalCharsRef = useRef(0);
  const charOffsetRef = useRef(0);
  const wordsRef = useRef([]);
  const activeIdxRef = useRef(0);
  const pausePosRef = useRef(null);
  const stoppingRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  // Posicion maxima resaltada: el highlight nunca retrocede
  const lastHighlightPosRef = useRef(0);
  const speedRef = useRef(speed ?? 1);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);
  useEffect(() => {
    speedRef.current = speed ?? 1;
  }, [speed]);

  const _stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const _applyHighlight = useCallback((pos) => {
    if (pos <= lastHighlightPosRef.current) return; // solo avanzar
    lastHighlightPosRef.current = pos;
    const words = wordsRef.current;
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i].start <= pos) {
        setWordRange({ start: words[i].start, end: words[i].end });
        return;
      }
    }
  }, []);

  const _startTimer = useCallback(
    (charOffset) => {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - t0Ref.current;
        const pos = charOffset + elapsed * charsPerMsRef.current;
        const total = totalCharsRef.current;
        // Barra de progreso: siempre suave
        if (total > 0) setProgress(Math.min(99, Math.round((pos / total) * 100)));
        // Resaltado: interpolacion como fallback entre eventos de progreso
        _applyHighlight(pos);
      }, 200);
    },
    [_applyHighlight]
  );

  useEffect(() => {
    let Tts;
    try {
      Tts = _Tts();
    } catch (_) {
      return;
    }

    const onStart = () => {
      t0Ref.current = Date.now();
    };

    const onProgress = (e) => {
      const charIndex = e.charIndex ?? e.location ?? e.start ?? 0;
      const elapsed = Date.now() - t0Ref.current;
      const absPos = charOffsetRef.current + charIndex;
      // Anclar resaltado con posicion real del motor (mas preciso que interpolacion)
      if (charIndex > 0) _applyHighlight(absPos);
      // Calibrar con la tasa relativa al utterance actual; usar charIndex (no absPos)
      // porque absPos incluye el charOffset del punto de reanudacion y sobreestima la tasa
      if (charIndex > 10 && elapsed > 300) {
        const measured = charIndex / elapsed;
        charsPerMsRef.current = charsPerMsRef.current * 0.75 + measured * 0.25;
      }
    };

    const onFinishEvt = () => {
      if (stoppingRef.current) {
        stoppingRef.current = false;
        return;
      }
      clearInterval(timerRef.current);
      timerRef.current = null;
      setPlayerState('idle');
      setProgress(100);
      setWordRange({ start: -1, end: -1 });
      onFinishRef.current?.();
    };

    const onCancel = () => {
      stoppingRef.current = false;
    };

    Tts.addEventListener('tts-start', onStart);
    Tts.addEventListener('tts-progress', onProgress);
    Tts.addEventListener('tts-finish', onFinishEvt);
    Tts.addEventListener('tts-cancel', onCancel);

    // Fijar idioma español para que Android no use voz en inglés por defecto
    Tts.setDefaultLanguage('es-419').catch(() =>
      Tts.setDefaultLanguage('es').catch(() => {})
    );

    return () => {
      Tts.removeEventListener('tts-start', onStart);
      Tts.removeEventListener('tts-progress', onProgress);
      Tts.removeEventListener('tts-finish', onFinishEvt);
      Tts.removeEventListener('tts-cancel', onCancel);
      clearInterval(timerRef.current);
      stoppingRef.current = true;
      Tts.stop();
    };
  }, []);

  useEffect(() => {
    try {
      _Tts().setDefaultRate(_ttsRate(speed));
    } catch (_) {}
  }, [speed]);

  const play = useCallback(
    (idx, text) => {
      let Tts;
      try {
        Tts = _Tts();
      } catch (_) {
        return;
      }

      // Reanudar desde pausa
      if (pausePosRef.current?.idx === idx) {
        const { charPos } = pausePosRef.current;
        pausePosRef.current = null;
        charOffsetRef.current = charPos;
        lastHighlightPosRef.current = charPos;
        charsPerMsRef.current = (16 / 1000) * (speedRef.current ?? 1);
        stoppingRef.current = false;
        Tts.setDefaultRate(_ttsRate(speedRef.current));
        t0Ref.current = Date.now();
        _startTimer(charPos);
        Tts.speak(text.slice(charPos));
        setActiveIdx(idx);
        activeIdxRef.current = idx;
        setPlayerState('playing');
        return;
      }

      // Nueva lectura
      stoppingRef.current = true;
      Tts.stop();

      const re = /\S+/g;
      const words = [];
      let m;
      while ((m = re.exec(text)) !== null) {
        words.push({ start: m.index, end: m.index + m[0].length });
      }
      wordsRef.current = words;
      totalCharsRef.current = text.length;
      charOffsetRef.current = 0;
      lastHighlightPosRef.current = 0;
      charsPerMsRef.current = (16 / 1000) * (speedRef.current ?? 1);

      Tts.setDefaultRate(_ttsRate(speedRef.current));
      t0Ref.current = Date.now();
      stoppingRef.current = false;
      Tts.speak(text);
      setActiveIdx(idx);
      activeIdxRef.current = idx;
      setPlayerState('playing');
      setProgress(0);
      setWordRange({ start: -1, end: -1 });
      _startTimer(0);
    },
    [_startTimer]
  );

  const pause = useCallback(() => {
    let Tts;
    try {
      Tts = _Tts();
    } catch (_) {
      return;
    }
    // Usar la posicion del ultimo resaltado real como punto de reanudacion;
    // es mas preciso que la estimacion temporal porque esta anclado a eventos reales del motor
    const charPos = lastHighlightPosRef.current > charOffsetRef.current
      ? lastHighlightPosRef.current
      : Math.min(
          totalCharsRef.current,
          charOffsetRef.current + Math.round((Date.now() - t0Ref.current) * charsPerMsRef.current)
        );
    pausePosRef.current = { idx: activeIdxRef.current, charPos };
    stoppingRef.current = true;
    clearInterval(timerRef.current);
    timerRef.current = null;
    Tts.stop();
    setPlayerState('paused');
    setWordRange({ start: -1, end: -1 });
  }, []);

  const stop = useCallback(() => {
    stoppingRef.current = true;
    pausePosRef.current = null;
    lastHighlightPosRef.current = 0;
    charOffsetRef.current = 0;
    _stopTimer();
    try { _Tts().stop(); } catch (_) {}
    setPlayerState('idle');
    setActiveIdx(0);
    setProgress(0);
    setWordRange({ start: -1, end: -1 });
  }, [_stopTimer]);

  const toggle = useCallback(
    (idx, text) => {
      if (playerState === 'playing' && activeIdx === idx) pause();
      else play(idx, text);
    },
    [playerState, activeIdx, play, pause]
  );

  return {
    isPlaying: playerState === 'playing',
    isLoading: false,
    activeIdx,
    progress,
    wordRange,
    ttsError: null,
    toggle,
    stop,
  };
}

// Selecciona backend según si hay API key: ElevenLabs (premium) o TTS del sistema (gratis)
function useAudioPlayer(apiKey, voiceId, speed, onFinish) {
  const el = useElevenLabsPlayer(apiKey, voiceId, speed, apiKey ? onFinish : null);
  const tts = useTTSPlayer(speed, !apiKey ? onFinish : null);
  return apiKey ? el : tts;
}

export default function ReadingsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode, ttsSpeed, setTtsSpeed, elevenlabsApiKey, elevenlabsVoiceId } =
    useSettingsStore();
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

  const targetDateISO = route?.params?.date ?? null;
  const routeColor = route?.params?.color ?? null;
  const routeCelebration = route?.params?.celebration ?? null;
  const isToday = !targetDateISO || targetDateISO === TODAY_ISO;

  const [dateResult, setDateResult] = useState(null);
  const currentResult = dateResult?.iso === targetDateISO ? dateResult : null;

  const READINGS = isToday
    ? storeReadings?.length > 0
      ? storeReadings
      : STATIC_READINGS
    : (currentResult?.readings ?? []);

  const readingLabels =
    READINGS.length > 0
      ? READINGS.map((r) => ({
          short: _READING_SHORT[r.type] ?? '◆',
          label: r.type,
        }))
      : _FALLBACK_LABELS;

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const [activeReading, setActiveReading] = useState(0);

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

  const {
    isPlaying,
    isLoading: ttsLoading,
    activeIdx,
    progress,
    wordRange,
    ttsError,
    toggle,
    stop,
  } = useAudioPlayer(elevenlabsApiKey, elevenlabsVoiceId, ttsSpeed, handleFinish);

  // Cuando cambia la fecha: detener el player y volver a la primera lectura
  useEffect(() => {
    stop();
    setActiveReading(0);
  }, [targetDateISO]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dispara reproducción automática tras auto-avance
  useEffect(() => {
    if (!autoAdvanceRef.current) return;
    autoAdvanceRef.current = false;
    const text = READINGS[activeReading]?.text;
    if (!text) return;
    const t = setTimeout(() => toggle(activeReading, text), 600);
    return () => clearTimeout(t);
  }, [activeReading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opciones de velocidad — ciclado desde el badge del player
  const SPEED_OPTS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = useCallback(() => {
    const idx = SPEED_OPTS.indexOf(ttsSpeed);
    setTtsSpeed(SPEED_OPTS[(idx + 1) % SPEED_OPTS.length]);
  }, [ttsSpeed, setTtsSpeed]); // eslint-disable-line react-hooks/exhaustive-deps

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
          { paddingTop: insets.top, backgroundColor: surface, borderBottomColor: border },
        ]}
      >
        {/* Franja del color litúrgico */}
        <View
          style={[
            s.headerStripe,
            {
              backgroundColor:
                Colors.liturgical[headerColorKey] ?? Colors.liturgical.green,
            },
          ]}
        />

        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <IcoBack c={ink} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            {/* Fecha + dot de color */}
            <View style={s.headerDateRow}>
              <View
                style={[
                  s.headerDot,
                  {
                    backgroundColor:
                      Colors.liturgical[headerColorKey] ?? Colors.liturgical.green,
                  },
                ]}
              />
              <Text style={[s.headerDate, { color: muted }]}>
                {headerDate.toUpperCase()}
              </Text>
            </View>
            <Text style={[s.headerTitle, { color: ink }]}>{headerTitle}</Text>
            <Text style={[s.headerCelebration, { color: muted }]} numberOfLines={1}>
              {isToday ? TODAY.celebration : (routeCelebration ?? '')}
            </Text>
          </View>

          {/* Badge de color litúrgico */}
          <View
            style={[
              s.litPill,
              {
                backgroundColor:
                  (Colors.liturgical[headerColorKey] ?? Colors.liturgical.green) + '20',
                borderColor:
                  (Colors.liturgical[headerColorKey] ?? Colors.liturgical.green) + '55',
              },
            ]}
          >
            <Text
              style={[
                s.litPillText,
                { color: Colors.liturgical[headerColorKey] ?? Colors.liturgical.green },
              ]}
            >
              {headerColorLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs de lecturas */}
      <View style={[s.tabs, { backgroundColor: surface, borderBottomColor: border }]}>
        {readingLabels.map((rl, i) => {
          const active = activeReading === i;
          return (
            <TouchableOpacity
              key={i}
              style={[s.tab, active && { borderBottomColor: Colors.brand.primary }]}
              onPress={() => setActiveReading(i)}
              activeOpacity={0.7}
            >
              <Text
                style={[s.tabLabel, { color: active ? Colors.brand.primary : muted }]}
              >
                {rl.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Texto de la lectura / estado vacío */}
      {READINGS.length === 0 ? (
        showLoading ? (
          <ReadingSkeleton dark={dark} />
        ) : (
          <View style={s.emptyState}>
            <Tau size={44} color={muted} style={{ opacity: 0.45, marginBottom: 20 }} />
            <Text style={[s.emptyText, { color: muted }]}>
              {daysAhead > 62 || dateError === 'FECHA_SIN_LECTURAS'
                ? 'Las lecturas de este día aún no están publicadas.\nSuelen publicarse con pocos días de antelación.'
                : dateError || (isToday && syncError)
                  ? 'No se pudieron cargar las lecturas.\nVerifica tu conexión a internet.'
                  : 'No hay lecturas disponibles para este día.'}
            </Text>
            {(dateError || (isToday && syncError)) &&
            daysAhead <= 62 &&
            dateError !== 'FECHA_SIN_LECTURAS' ? (
              <TouchableOpacity
                onPress={handleRetry}
                style={s.retryBtn}
                activeOpacity={0.8}
              >
                <Text style={s.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            ) : null}
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
          <Text style={[s.readingRef, { color: ink }]}>
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

          <HighlightedText
            text={READINGS[activeReading]?.text ?? ''}
            start={isPlaying && activeIdx === activeReading ? wordRange.start : -1}
            end={isPlaying && activeIdx === activeReading ? wordRange.end : -1}
            style={s.readingText}
            hlColor={Colors.brand.primary + '38'}
            ink={ink}
          />

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
              style={[
                s.bookmarkBtn,
                {
                  borderColor: isBookmarked(READINGS[activeReading]?.ref)
                    ? Colors.brand.primary + '50'
                    : border,
                },
              ]}
              activeOpacity={0.7}
            >
              {isBookmarked(READINGS[activeReading]?.ref) ? (
                <IcoBookmarkFilled c={Colors.brand.primary} size={20} />
              ) : (
                <IcoBookmarkOutline c={muted} size={20} />
              )}
              <Text
                style={[
                  s.bookmarkLabel,
                  {
                    color: isBookmarked(READINGS[activeReading]?.ref)
                      ? Colors.brand.primary
                      : muted,
                  },
                ]}
              >
                {isBookmarked(READINGS[activeReading]?.ref) ? 'Guardado' : 'Guardar'}
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
          {/* Lectura anterior */}
          <TouchableOpacity
            onPress={() => setActiveReading((i) => Math.max(0, i - 1))}
            style={[s.playerBtn, { opacity: activeReading === 0 ? 0.25 : 1 }]}
            disabled={activeReading === 0}
          >
            <IcoSkipPrev c={ink} />
          </TouchableOpacity>

          {/* Play/Pausa */}
          <TouchableOpacity
            onPress={() => toggle(activeReading, READINGS[activeReading]?.text ?? '')}
            style={[s.playBtn, { backgroundColor: Colors.brand.primary }]}
            activeOpacity={0.85}
            disabled={ttsLoading && activeIdx === activeReading}
          >
            {ttsLoading && activeIdx === activeReading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isPlaying && activeIdx === activeReading ? (
              <IcoPause c="#fff" size={22} />
            ) : (
              <IcoPlay c="#fff" size={20} />
            )}
          </TouchableOpacity>

          {/* Lectura siguiente */}
          <TouchableOpacity
            onPress={() => setActiveReading((i) => Math.min(READINGS.length - 1, i + 1))}
            style={[
              s.playerBtn,
              { opacity: activeReading === READINGS.length - 1 ? 0.25 : 1 },
            ]}
            disabled={activeReading === READINGS.length - 1}
          >
            <IcoSkipNext c={ink} />
          </TouchableOpacity>

          {/* Velocidad */}
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

        {/* Label lectura + estado ElevenLabs */}
        <View style={s.playerFooter}>
          <Text style={[s.playerLabel, { color: muted }]}>
            {_READING_PLAYER[readingLabels[activeReading]?.label] ??
              readingLabels[activeReading]?.label}
          </Text>
          {ttsError ? (
            <Text
              style={[s.ttsErrorText, { color: Colors.liturgical.red }]}
              numberOfLines={2}
            >
              {ttsError}
            </Text>
          ) : (
            <View style={[s.elBadge, { borderColor: border }]}>
              <Text style={[s.elBadgeText, { color: muted }]}>
                {elevenlabsApiKey ? 'ElevenLabs' : 'Voz del sistema'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Texto con palabra resaltada ────────────────────────────────
function HighlightedText({ text, start, end, style, hlColor, ink }) {
  if (!text) return null;
  if (start < 0 || end <= start) {
    return <Text style={[style, { color: ink }]}>{text}</Text>;
  }
  return (
    <Text style={[style, { color: ink }]}>
      {text.slice(0, start)}
      <Text style={{ backgroundColor: hlColor }}>{text.slice(start, end)}</Text>
      {text.slice(end)}
    </Text>
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

  /* ── Header ── */
  header: {
    overflow: 'hidden',
  },
  headerStripe: {
    height: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 10,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerCenter: { flex: 1 },
  headerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
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
  litPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  litPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* ── Tabs ── */
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

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
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 20,
  },
  refDivider: {
    width: 40,
    height: 3,
    borderRadius: 2,
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
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 999,
  },
  bookmarkLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

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
    height: 3,
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
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  elBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  elBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  ttsErrorText: { fontSize: 11, flex: 1, textAlign: 'right' },

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
