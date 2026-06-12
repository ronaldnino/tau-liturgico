import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme';
import { Tau } from '../components';
import AuthService from '../services/auth';

const W = Dimensions.get('window').width;
const LIT_COLORS = Object.values(Colors.liturgical);
const BOX_SIZE = Math.floor((W - 56 - 40) / 6);

function IcoBack({ c = Colors.ink.primary, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12l7 7M5 12l7-7"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LitBar() {
  return (
    <View style={s.litBar}>
      {LIT_COLORS.map((c) => (
        <View key={c} style={[s.litSeg, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

function StepTrack({ step }) {
  return (
    <View style={s.stepTrack}>
      <View style={[s.stepSeg, { backgroundColor: Colors.brand.primary }]} />
      <View
        style={[
          s.stepSeg,
          { backgroundColor: step >= 2 ? Colors.brand.primary : Colors.border.default },
        ]}
      />
    </View>
  );
}

export default function OtpScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const phone = route.params?.phone ?? '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [activeIdx, setActiveIdx] = useState(0);
  const [countdown, setCountdown] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef([]);
  const verifying = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => inputs.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const verify = useCallback(
    async (code) => {
      if (verifying.current) return;
      verifying.current = true;
      setLoading(true);
      setError('');
      try {
        const token = await AuthService.verifyOtp(phone, code);
        navigation.replace('Sync', { token });
      } catch (e) {
        setError(e.message);
        setDigits(['', '', '', '', '', '']);
        setActiveIdx(0);
        inputs.current[0]?.focus();
      } finally {
        setLoading(false);
        verifying.current = false;
      }
    },
    [phone, navigation]
  );

  const onDigit = (i, v) => {
    if (v.length > 1) v = v.slice(-1);
    if (v && !/^\d$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');

    if (v && i < 5) {
      inputs.current[i + 1]?.focus();
      setActiveIdx(i + 1);
    }

    // Auto-verificar cuando el último dígito se llena
    if (v && i === 5) {
      const code = [...next].join('');
      if (code.length === 6) verify(code);
    }
  };

  const onKeyPress = (i, e) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      setActiveIdx(i - 1);
    }
  };

  const complete = digits.every((d) => d !== '');

  const resend = async () => {
    setCountdown(45);
    try {
      await AuthService.requestOtp(phone);
    } catch (_) {}
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LitBar />

        {/* Nav */}
        <View style={s.nav}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <IcoBack />
          </TouchableOpacity>
          <StepTrack step={2} />
          <View style={s.navSpacer} />
        </View>

        {/* Contenido */}
        <View style={s.content}>
          <Tau size={36} color={Colors.brand.primary} style={s.tauIcon} />
          <Text style={s.title}>Código de{'\n'}verificación</Text>

          {/* Chip del número */}
          <View style={s.phoneChip}>
            <Text style={s.phoneChipText}>{phone}</Text>
          </View>

          {/* Cajas OTP */}
          <View style={s.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChangeText={(v) => onDigit(i, v)}
                onKeyPress={(e) => onKeyPress(i, e)}
                onFocus={() => setActiveIdx(i)}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  s.otpBox,
                  { width: BOX_SIZE, height: BOX_SIZE + 10 },
                  activeIdx === i && !d && s.otpBoxActive,
                  d !== '' && s.otpBoxFilled,
                ]}
                textAlign="center"
                editable={!loading}
              />
            ))}
          </View>

          {/* Loader / error */}
          {loading ? (
            <ActivityIndicator color={Colors.brand.primary} style={s.loader} />
          ) : error ? (
            <Text style={s.errorText}>{error}</Text>
          ) : null}

          {/* Reenviar */}
          <View style={s.resendRow}>
            {countdown > 0 ? (
              <Text style={s.resendCountdown}>
                Reenviar en{' '}
                <Text style={s.resendTimer}>{String(countdown).padStart(2, '0')}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={resend} activeOpacity={0.7}>
                <Text style={s.resendBtn}>Reenviar código</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CTA */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={() => verify(digits.join(''))}
            disabled={!complete || loading}
            style={[s.cta, (!complete || loading) && s.ctaDisabled]}
            activeOpacity={0.85}
          >
            <Text style={s.ctaText}>Verificar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.primary },

  litBar: { flexDirection: 'row', height: 4 },
  litSeg: { flex: 1 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  navSpacer: { width: 30 },

  stepTrack: { flexDirection: 'row', gap: 6 },
  stepSeg: { width: 36, height: 3, borderRadius: 999 },

  content: { flex: 1, paddingHorizontal: 28 },

  tauIcon: { marginBottom: 20, marginTop: 8 },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 36,
    lineHeight: 41,
    color: Colors.ink.primary,
    marginBottom: 16,
  },

  phoneChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand.tint,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 32,
  },
  phoneChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.primary,
    letterSpacing: 0.3,
  },

  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  otpBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    fontSize: 28,
    fontFamily: 'CormorantGaramond-SemiBold',
    color: Colors.ink.primary,
    backgroundColor: Colors.surface.secondary,
  },
  otpBoxActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.tint,
  },
  otpBoxFilled: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.tint,
  },

  loader: { marginBottom: 16 },
  errorText: {
    color: Colors.liturgicalUI.red,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },

  resendRow: { alignItems: 'center', marginTop: 4 },
  resendCountdown: { fontSize: 13, color: Colors.ink.muted },
  resendTimer: { color: Colors.ink.primary, fontWeight: '700' },
  resendBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.primary,
    padding: 8,
  },

  footer: {
    paddingHorizontal: 28,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border.divider,
    backgroundColor: Colors.surface.primary,
  },
  cta: {
    backgroundColor: Colors.brand.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
});
