import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import MaskInput, { formatWithMask } from 'react-native-mask-input';
import { Colors } from '../theme';
import { Tau } from '../components';
import { useAuthStore } from '../store';
import AuthService from '../services/auth';
import { normalizePhone } from '../utils/phone';

const LIT_COLORS = Object.values(Colors.liturgical);
const D = /\d/;

// mask y placeholder comparten longitud y posición de los caracteres fijos
// (espacios/guiones) para que el texto fantasma (el resto del ejemplo, en
// gris) quede alineado exactamente donde termina el número ya escrito.
// El 0 inicial de marcación nacional (Venezuela/Argentina) no es parte del
// número: se descarta al escribirlo.
const COUNTRIES = [
  {
    code: '+58',
    iso: 'VE',
    flag: '🇻🇪',
    name: 'Venezuela',
    placeholder: '416 123 4567',
    mask: [D, D, D, ' ', D, D, D, ' ', D, D, D, D],
  },
  {
    code: '+34',
    iso: 'ES',
    flag: '🇪🇸',
    name: 'España',
    placeholder: '612 345 678',
    mask: [D, D, D, ' ', D, D, D, ' ', D, D, D],
  },
  {
    code: '+54',
    iso: 'AR',
    flag: '🇦🇷',
    name: 'Argentina',
    placeholder: '11 15-1234-5678',
    mask: [D, D, ' ', D, D, '-', D, D, D, D, '-', D, D, D, D],
  },
  {
    code: '+57',
    iso: 'CO',
    flag: '🇨🇴',
    name: 'Colombia',
    placeholder: '300 123 4567',
    mask: [D, D, D, ' ', D, D, D, ' ', D, D, D, D],
  },
  {
    code: '+52',
    iso: 'MX',
    flag: '🇲🇽',
    name: 'México',
    placeholder: '55 1234 5678',
    mask: [D, D, ' ', D, D, D, D, ' ', D, D, D, D],
  },
  {
    code: '+51',
    iso: 'PE',
    flag: '🇵🇪',
    name: 'Perú',
    placeholder: '987 654 321',
    mask: [D, D, D, ' ', D, D, D, ' ', D, D, D],
  },
  {
    code: '+1',
    iso: 'US',
    flag: '🇺🇸',
    name: 'EE.UU.',
    placeholder: '(212) 555-0134',
    mask: ['(', D, D, D, ')', ' ', D, D, D, '-', D, D, D, D],
  },
];

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

function IcoChevronDown({ c = Colors.ink.muted, size = 15 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={c}
        strokeWidth={2.2}
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

export default function PhoneScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPhone: savePhone, resetOnboarding } = useAuthStore();
  const inputRef = useRef(null);
  const [zeroHint, setZeroHint] = useState(false);
  const hintAnim = useState(new Animated.Value(0))[0];
  const hintTimeout = useRef(null);

  useEffect(() => () => clearTimeout(hintTimeout.current), []);

  const { isValid, e164 } = normalizePhone(phone, country.iso);
  const { masked } = formatWithMask({ text: phone, mask: country.mask });
  const ghost = country.placeholder.slice(masked.length);

  const handlePhoneChange = (unmasked) => {
    if (/^0/.test(unmasked)) {
      setZeroHint(true);
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      clearTimeout(hintTimeout.current);
      hintTimeout.current = setTimeout(() => {
        Animated.timing(hintAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setZeroHint(false));
      }, 2200);
    }
    setPhone(unmasked.replace(/^0+/, ''));
    setError('');
  };

  const handleNext = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const full = e164;
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
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LitBar />

        {/* Nav */}
        <View style={s.nav}>
          <TouchableOpacity
            onPress={resetOnboarding}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <IcoBack />
          </TouchableOpacity>
          <StepTrack step={1} />
          <View style={s.navSpacer} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado */}
          <Tau size={36} color={Colors.brand.primary} style={s.tauIcon} />
          <Text style={s.title}>Tu número{'\n'}de teléfono</Text>
          <Text style={s.body}>Te enviaremos un código de verificación por SMS.</Text>

          {/* Campo de teléfono */}
          <View style={[s.fieldRow, pickerOpen && s.fieldRowOpen]}>
            <TouchableOpacity
              onPress={() => {
                setPickerOpen((v) => !v);
                inputRef.current?.blur();
              }}
              style={[s.countryBtn, pickerOpen && s.countryBtnOpen]}
              activeOpacity={0.7}
            >
              <Text style={s.flag}>{country.flag}</Text>
              <Text style={s.code}>{country.code}</Text>
              <IcoChevronDown c={pickerOpen ? Colors.brand.primary : Colors.ink.muted} />
            </TouchableOpacity>

            <View style={s.phoneInputWrap}>
              {phone.length > 0 && (
                <Text
                  style={[s.phoneGhost, s.phoneNumeric]}
                  pointerEvents="none"
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  <Text style={s.phoneGhostHidden}>{masked}</Text>
                  <Text style={s.phoneGhostVisible}>{ghost}</Text>
                </Text>
              )}
              <MaskInput
                ref={inputRef}
                value={phone}
                onChangeText={(_masked, unmasked) => handlePhoneChange(unmasked)}
                mask={country.mask}
                placeholder={country.placeholder}
                keyboardType="number-pad"
                style={[s.phoneInput, s.phoneNumeric]}
                placeholderTextColor={Colors.ink.soft}
                returnKeyType="done"
                allowFontScaling={false}
                onSubmitEditing={handleNext}
              />
            </View>
          </View>

          {zeroHint && (
            <Animated.View
              style={[
                s.zeroHint,
                {
                  opacity: hintAnim,
                  transform: [
                    {
                      translateY: hintAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-6, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={s.zeroHintText}>
                No hace falta escribir el 0 inicial — ya lo quitamos por ti.
              </Text>
            </Animated.View>
          )}

          {/* Picker de países */}
          {pickerOpen && (
            <View style={s.picker}>
              {COUNTRIES.map((c, i) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => {
                    setCountry(c);
                    setPickerOpen(false);
                    inputRef.current?.focus();
                  }}
                  style={[s.pickerRow, i > 0 && s.pickerRowDivider]}
                  activeOpacity={0.7}
                >
                  <Text style={s.flag}>{c.flag}</Text>
                  <Text style={s.pickerName}>{c.name}</Text>
                  <Text style={s.pickerCode}>{c.code}</Text>
                  {c.code === country.code && (
                    <View
                      style={[s.checkDot, { backgroundColor: Colors.brand.primary }]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <Text style={s.disclaimer}>
            Solo usamos tu número para verificar tu identidad. No lo compartimos con
            terceros.
          </Text>
        </ScrollView>

        {/* CTA fijo */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValid || loading}
            style={[s.cta, (!isValid || loading) && s.ctaDisabled]}
            activeOpacity={0.85}
          >
            <Text style={s.ctaText}>
              {loading ? 'Enviando…' : 'Recibir código por SMS'}
            </Text>
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

  stepTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  stepSeg: {
    width: 36,
    height: 3,
    borderRadius: 999,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 28, paddingBottom: 20 },

  tauIcon: { marginBottom: 20, marginTop: 8 },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 36,
    lineHeight: 41,
    color: Colors.ink.primary,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.ink.muted,
    marginBottom: 32,
  },

  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  fieldRowOpen: { marginBottom: 0 },

  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    minHeight: 54,
  },
  countryBtnOpen: {
    borderColor: Colors.brand.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  flag: { fontSize: 20 },
  code: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink.primary,
    fontVariant: ['tabular-nums'],
  },

  phoneInputWrap: { flex: 1, position: 'relative' },
  // Compartido entre el fantasma y el input real: mismas métricas de fuente
  // (peso, tracking, dígitos tabulares) para que el punto donde termina lo
  // escrito y empieza el resto del ejemplo quede exacto, sin desalinearse.
  phoneNumeric: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.6,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  phoneGhost: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phoneGhostHidden: { color: 'transparent' },
  phoneGhostVisible: { color: Colors.ink.soft },

  phoneInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    color: Colors.ink.primary,
    minHeight: 54,
  },

  picker: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: Colors.brand.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.surface.primary,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  pickerRowDivider: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border.divider,
  },
  pickerName: { flex: 1, fontSize: 15, color: Colors.ink.primary },
  pickerCode: { fontSize: 13, color: Colors.ink.muted, fontWeight: '500' },
  checkDot: { width: 8, height: 8, borderRadius: 999 },

  zeroHint: {
    backgroundColor: Colors.brand.tint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 8,
  },
  zeroHintText: {
    color: Colors.brand.dark,
    fontSize: 12.5,
    lineHeight: 17,
  },

  errorText: {
    color: Colors.liturgicalUI.red,
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.ink.soft,
    marginTop: 20,
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
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
