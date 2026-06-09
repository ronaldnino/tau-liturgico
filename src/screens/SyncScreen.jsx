import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau, TauWordmark, PrimaryBtn } from '../components';
import { useAuthStore, useLiturgicalStore } from '../store';

export default function SyncScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const token = route.params?.token;
  const { setToken } = useAuthStore();
  const { sync } = useLiturgicalStore();

  const [progress, setProgress] = useState(0);
  const [syncFailed, setSyncFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [syncDone, setSyncDone] = useState(false);
  const [progressDone, setProgressDone] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Cuando ambos terminan, actualizar el token — fuera de cualquier setState callback
  useEffect(() => {
    if (syncDone && progressDone) {
      setToken(token);
    }
  }, [syncDone, progressDone]);

  // Sync real del store
  useEffect(() => {
    setSyncDone(false);
    sync()
      .then(() => { if (mounted.current) setSyncDone(true); })
      .catch(() => { if (mounted.current) setSyncFailed(true); });
  }, [retryCount]);

  // Animación de progreso independiente
  useEffect(() => {
    if (syncFailed) return;
    setProgress(0);
    setProgressDone(false);
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

  // Detectar cuando la barra llega a 100 (en un efecto separado, no dentro del setter)
  useEffect(() => {
    if (progress >= 100) setProgressDone(true);
  }, [progress]);

  const handleRetry = useCallback(() => {
    setSyncFailed(false);
    setRetryCount((c) => c + 1);
  }, []);

  if (syncFailed) {
    return (
      <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24, backgroundColor: '#fff' }]}>
        <View style={s.errorCenter}>
          <View style={s.errorIcon}>
            <Text style={{ fontSize: 28 }}>📶</Text>
          </View>
          <Text style={s.errorTitle}>Sin conexión a internet</Text>
          <Text style={s.errorBody}>
            Necesitas internet para descargar el calendario litúrgico la primera vez.
          </Text>
        </View>
        <PrimaryBtn onPress={handleRetry} style={s.retryBtn}>
          Reintentar
        </PrimaryBtn>
      </View>
    );
  }

  return (
    <View
      style={[
        s.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 24,
          backgroundColor: Colors.brand.primary },
      ]}
    >
      <View style={s.center}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 24 }}>
          <Tau size={88} color="#fff" />
        </Animated.View>

        <TauWordmark width={220} color="#fff" accentColor="#fff" />

        <Text style={s.syncing}>Descargando año litúrgico 2026…</Text>

        {/* Barra de progreso */}
        <View style={s.trackWrap}>
          <View style={[s.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={s.percent}>{progress}% · Esto solo ocurre una vez</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  fill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 999,
  },
  percent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 14,
    letterSpacing: 0.5,
  },

  // Error state
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 26,
    color: Colors.ink.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.ink.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryBtn: {},
});
