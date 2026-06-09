import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau, PrimaryBtn } from '../components';
import { useAuthStore } from '../store';
import AuthService from '../services/auth';

const COUNTRIES = [
  { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+34', flag: '🇪🇸', name: 'España' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
];

export default function PhoneScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPhone: savePhone } = useAuthStore();

  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length >= 7;

  const handleNext = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const full = `${country.code} ${phone}`;
      await AuthService.requestOtp(full);
      savePhone(full);
      navigation.navigate('Otp', { phone: full });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 14 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nav */}
        <View style={s.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.step}>Paso 1 de 2</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Contenido */}
        <Tau size={48} color={Colors.brand.primary} style={s.tau} />
        <Text style={s.title}>Tu número{'\n'}de teléfono</Text>
        <Text style={s.body}>Te enviaremos un código de verificación por SMS.</Text>

        {/* Campo */}
        <View style={s.fieldRow}>
          <TouchableOpacity
            onPress={() => setPickerOpen(!pickerOpen)}
            style={s.countryBtn}
          >
            <Text style={s.flag}>{country.flag}</Text>
            <Text style={s.code}>{country.code}</Text>
            <Text style={{ color: Colors.ink.muted, fontSize: 12 }}>▾</Text>
          </TouchableOpacity>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="000 000 0000"
            keyboardType="phone-pad"
            style={s.phoneInput}
            placeholderTextColor={Colors.ink.soft}
          />
        </View>

        {pickerOpen && (
          <View style={s.picker}>
            {COUNTRIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => {
                  setCountry(c);
                  setPickerOpen(false);
                }}
                style={[
                  s.pickerRow,
                  c.code !== COUNTRIES[0].code && {
                    borderTopWidth: 0.5,
                    borderTopColor: Colors.border.divider,
                  },
                ]}
              >
                <Text style={s.flag}>{c.flag}</Text>
                <Text style={[s.pickerName]}>{c.name}</Text>
                <Text style={s.pickerCode}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Text style={s.disclaimer}>
          Solo usamos tu número para verificar tu identidad. No lo compartimos con
          terceros.
        </Text>

        <PrimaryBtn onPress={handleNext} disabled={!isValid || loading} style={s.cta}>
          {loading ? 'Enviando…' : 'Recibir código por SMS'}
        </PrimaryBtn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 28, paddingBottom: 40 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: { padding: 6 },
  backArrow: { fontSize: 28, color: Colors.ink.primary, lineHeight: 32 },
  step: { fontSize: 12, fontWeight: '500', color: Colors.ink.muted, letterSpacing: 1 },

  tau: { marginBottom: 24 },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 32,
    lineHeight: 37,
    color: Colors.ink.primary,
    marginBottom: 10,
  },
  body: { fontSize: 15, lineHeight: 23, color: Colors.ink.muted, marginBottom: 32 },

  fieldRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  flag: { fontSize: 18 },
  code: { fontSize: 16, fontWeight: '500', color: Colors.ink.primary },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.ink.primary,
  },

  picker: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 16,
  },
  pickerName: { flex: 1, fontSize: 15, color: Colors.ink.primary },
  pickerCode: { fontSize: 14, color: Colors.ink.muted },

  error: { color: Colors.liturgical.red, fontSize: 13, marginBottom: 12 },
  disclaimer: { fontSize: 12, lineHeight: 18, color: Colors.ink.soft, marginBottom: 32 },
  cta: {},
});
