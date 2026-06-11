import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../theme';
import { Tau, TauWordmark } from '../components';
import { useAuthStore, useLiturgicalStore } from '../store';

function IcoNoSignal({ c = Colors.brand.primary, size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Barras de señal (atenuadas) */}
      <Path
        d="M1 6l5.5 5.5"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.3}
      />
      <Path d="M1 1l22 22" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M16.72 11.06A10.94 10.94 0 0119 12.55"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.3}
      />
      <Path
        d="M5 12.55a10.94 10.94 0 015.17-2.39"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.3}
      />
      <Path
        d="M10.71 5.05A16 16 0 0122.56 9"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.3}
      />
      <Path
        d="M1.42 9a15.91 15.91 0 014.7-2.88"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.3}
      />
      <Path
        d="M8.53 16.11a6 6 0 016.95 0"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.3}
      />
      <Circle cx="12" cy="20" r="1" fill={c} />
    </Svg>
  );
}

export default function SyncScreen({ route }) {
  const insets = useSafeAreaInsets();
  const token = route.params?.token;
  const { setToken } = useAuthStore();
  const { sync } = useLiturgicalStore();

  const [progress, setProgress] = useState(0);
  const [syncFailed, setSyncFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [syncDone, setSyncDone] = useState(false);
  const progressDone = progress >= 100;
  const pulseAnim = useState(new Animated.Value(1))[0];
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (syncDone && progressDone) setToken(token);
  }, [syncDone, progressDone, token, setToken]);

  useEffect(() => {
    sync()
      .then(() => {
        if (mounted.current) setSyncDone(true);
      })
      .catch(() => {
        if (mounted.current) setSyncFailed(true);
      });
  }, [retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (syncFailed) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [syncFailed, retryCount]);

  const handleRetry = useCallback(() => {
    setSyncFailed(false);
    setSyncDone(false);
    setProgress(0);
    setRetryCount((c) => c + 1);
  }, []);

  if (syncFailed) {
    return (
      <View
        style={[
          s.root,
          s.errorRoot,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={s.errorCenter}>
          <View style={s.errorIconWrap}>
            <IcoNoSignal c={Colors.brand.primary} size={36} />
          </View>
          <Text style={s.errorTitle}>Sin conexión</Text>
          <Text style={s.errorBody}>
            Necesitas internet para descargar el calendario litúrgico la primera vez.
          </Text>
        </View>
        <View style={s.errorFooter}>
          <TouchableOpacity onPress={handleRetry} style={s.retryBtn} activeOpacity={0.85}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        s.root,
        s.loadingRoot,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Marca de agua */}
      <View style={s.bgTau} pointerEvents="none">
        <Tau size={340} color="rgba(255,255,255,0.05)" />
      </View>

      <View style={s.center}>
        <Animated.View style={[s.tauWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Tau size={88} color="#fff" />
        </Animated.View>

        <TauWordmark width={220} color="#fff" accentColor="rgba(255,255,255,0.5)" />

        <Text style={s.syncing}>Descargando año litúrgico 2026…</Text>

        <View style={s.trackWrap}>
          <View style={[s.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={s.percent}>{progress}% · Solo ocurre una vez</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 28 },

  /* ── Loading ── */
  loadingRoot: { backgroundColor: Colors.brand.primary },
  bgTau: {
    position: 'absolute',
    top: -40,
    right: -60,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tauWrap: { marginBottom: 24 },
  syncing: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 32,
    marginBottom: 28,
    textAlign: 'center',
  },
  trackWrap: {
    width: '70%',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 999 },
  percent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 14,
    letterSpacing: 0.5,
  },

  /* ── Error ── */
  errorRoot: { backgroundColor: Colors.surface.primary },
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  errorIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 28,
    color: Colors.ink.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.ink.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorFooter: { paddingTop: 12 },
  retryBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
