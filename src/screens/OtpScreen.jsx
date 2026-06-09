import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau, PrimaryBtn } from '../components';
import AuthService from '../services/auth';

export default function OtpScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const phone = route.params?.phone ?? '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [activeIdx, setActiveIdx] = useState(0);
  const [countdown, setCountdown] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onDigit = (i, v) => {
    if (v.length > 1) v = v.slice(-1);
    if (v && !/^\d$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) {
      inputs.current[i + 1]?.focus();
      setActiveIdx(i + 1);
    }
  };

  const onKeyPress = (i, e) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      setActiveIdx(i - 1);
    }
  };

  const complete = digits.every((d) => d !== '');

  const verify = async () => {
    if (!complete) return;
    setLoading(true);
    setError('');
    try {
      const code = digits.join('');
      const token = await AuthService.verifyOtp(phone, code);
      navigation.replace('Sync', { token });
    } catch (e) {
      setError(e.message);
      setDigits(['', '', '', '', '', '']);
      setActiveIdx(0);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.container, { paddingTop: insets.top + 14 }]}>
        {/* Nav */}
        <View style={s.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.step}>Paso 2 de 2</Text>
          <View style={{ width: 34 }} />
        </View>

        <View style={s.content}>
          <Tau size={48} color={Colors.brand.primary} style={s.tau} />
          <Text style={s.title}>Verifica{'\n'}tu número</Text>
          <Text style={s.body}>
            Código enviado a{' '}
            <Text style={{ color: Colors.ink.primary, fontWeight: '600' }}>{phone}</Text>
          </Text>

          {/* Cajas OTP */}
          <View style={s.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                value={d}
                onChangeText={(v) => onDigit(i, v)}
                onKeyPress={(e) => onKeyPress(i, e)}
                onFocus={() => setActiveIdx(i)}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  s.otpBox,
                  activeIdx === i && s.otpBoxActive,
                  d !== '' && s.otpBoxFilled,
                ]}
                textAlign="center"
              />
            ))}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          {/* Reenviar */}
          <View style={s.resendRow}>
            {countdown > 0 ? (
              <Text style={s.resendCountdown}>
                Reenviar en{' '}
                <Text style={{ color: Colors.ink.primary, fontWeight: '600' }}>
                  {String(countdown).padStart(2, '0')}s
                </Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={() => setCountdown(45)}>
                <Text style={s.resendBtn}>Reenviar código</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryBtn onPress={verify} disabled={!complete || loading}>
            {loading ? <ActivityIndicator color="#fff" /> : 'Verificar'}
          </PrimaryBtn>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 28 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: { padding: 6 },
  backArrow: { fontSize: 28, color: Colors.ink.primary, lineHeight: 32 },
  step: { fontSize: 12, fontWeight: '500', color: Colors.ink.muted, letterSpacing: 1 },

  content: { flex: 1 },
  tau: { marginBottom: 24 },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 32,
    lineHeight: 37,
    color: Colors.ink.primary,
    marginBottom: 10,
  },
  body: { fontSize: 15, lineHeight: 23, color: Colors.ink.muted, marginBottom: 36 },

  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  otpBox: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    fontSize: 26,
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    color: Colors.ink.primary,
    backgroundColor: '#fff',
  },
  otpBoxActive: { borderColor: Colors.brand.primary },
  otpBoxFilled: { borderColor: Colors.brand.primary },

  error: {
    color: Colors.liturgical.red,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  resendRow: { alignItems: 'center', marginTop: 20 },
  resendCountdown: { fontSize: 13, color: Colors.ink.muted },
  resendBtn: { fontSize: 14, fontWeight: '600', color: Colors.brand.primary, padding: 8 },

  footer: { paddingTop: 12 },
});
