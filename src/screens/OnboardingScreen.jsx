import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau, TauWordmark } from '../components';
import { useAuthStore } from '../store';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    bg: Colors.brand.primary,
    dark: true,
  },
  {
    key: '2',
    bg: '#FFFFFF',
    dark: false,
    title: 'Cada día,\nsu celebración',
    body: 'Conoce el color, la temporada y las lecturas de cada día litúrgico.',
  },
  {
    key: '3',
    bg: Colors.brand.tint,
    dark: false,
    title: 'Escucha\nlas lecturas',
    body: 'Reproduce Primera Lectura, Salmo y Evangelio con texto sincronizado.',
  },
];

function Slide({ item }) {
  if (item.key === '1') {
    return (
      <View style={[s.slide, { backgroundColor: item.bg }]}>
        <Tau size={140} color="#fff" style={s.heroTau} />
        <TauWordmark width={240} color="#fff" accentColor="#fff" />
        <Text style={s.taglineWhite}>El calendario litúrgico{'\n'}en tu bolsillo</Text>
      </View>
    );
  }
  return (
    <View style={[s.slide, { backgroundColor: item.bg }]}>
      {/* Ilustración tipográfica */}
      <View style={[s.illustrationBox, { backgroundColor: Colors.surface.editorial }]}>
        <View style={s.illustrationTau} pointerEvents="none">
          <Tau size={220} color={Colors.brand.primary} style={{ opacity: 0.14 }} />
        </View>
        <View style={s.dayCard}>
          <Text style={s.dayCardDate}>Mié · 7 may</Text>
          <Text style={s.dayCardTitle}>San Estanislao,{'\n'}obispo y mártir</Text>
        </View>
      </View>
      <Text style={s.slideTitle}>{item.title}</Text>
      <Text style={s.slideBody}>{item.body}</Text>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuthStore();
  const sliderRef = useRef(null);

  const finish = () => {
    completeOnboarding();
  };

  return (
    <AppIntroSlider
      ref={sliderRef}
      data={SLIDES}
      renderItem={({ item }) => <Slide item={item} />}
      onDone={finish}
      onSkip={finish}
      showSkipButton
      renderSkipButton={() => (
        <Text style={s.skipBtn}>Saltar</Text>
      )}
      renderNextButton={() => (
        <View style={s.nextBtn}>
          <Text style={s.nextBtnText}>›</Text>
        </View>
      )}
      renderDoneButton={() => (
        <View style={[s.nextBtn, { backgroundColor: Colors.brand.primary }]}>
          <Text style={[s.nextBtnText, { color: '#fff' }]}>✓</Text>
        </View>
      )}
      dotStyle={s.dot}
      activeDotStyle={s.activeDot}
    />
  );
}

const s = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  heroTau: { marginBottom: 28 },
  taglineWhite: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 30,
    marginTop: 20,
  },
  illustrationBox: {
    width: W - 56,
    height: 260,
    borderRadius: 20,
    marginBottom: 32,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  illustrationTau: { position: 'absolute', top: -20, left: -10 },
  dayCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.liturgical.red,
  },
  dayCardDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayCardTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 18,
    color: Colors.ink.primary,
    lineHeight: 22,
  },
  slideTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 30,
    lineHeight: 35,
    color: Colors.ink.primary,
    textAlign: 'left',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  slideBody: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.ink.muted,
    alignSelf: 'stretch',
  },
  skipBtn: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  nextBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  dot:       { backgroundColor: Colors.border.default },
  activeDot: { backgroundColor: Colors.brand.primary, width: 20 },
});
