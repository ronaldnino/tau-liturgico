import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau, TauWordmark } from '../components';
import { useAuthStore, useLiturgicalStore, useProfileStore } from '../store';
import { getProfile } from '../services/profile';

export default function SyncScreen({ route }) {
  const insets = useSafeAreaInsets();
  const token = route.params?.token;
  const { setToken } = useAuthStore();
  const { sync } = useLiturgicalStore();
  const { setProfile } = useProfileStore();

  const [progress, setProgress] = useState(0);
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

  // Descarga de lecturas en el primer arranque. Es "best effort": si falla (sin
  // red, o la fuente bloqueada por Cloudflare desde ciertos países) NO bloqueamos
  // la entrada. El calendario litúrgico se calcula localmente y la pantalla de
  // Lecturas reintenta con su propio fallback estático.
  useEffect(() => {
    const run = async () => {
      try {
        await sync();
        const profile = await getProfile().catch(() => null);
        if (mounted.current && profile) setProfile(profile);
      } catch {
        // Continuamos igualmente: el usuario entra a la app.
      } finally {
        if (mounted.current) setSyncDone(true);
      }
    };
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
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
  }, []);

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
});
