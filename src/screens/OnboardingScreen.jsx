import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../theme';
import { Tau, TauWordmark } from '../components';
import { useAuthStore } from '../store';

const { width: W } = Dimensions.get('window');
const SLIDES = [{ key: 'welcome' }, { key: 'calendar' }, { key: 'readings' }];
const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 };

// ── Iconos SVG ─────────────────────────────────────────────────────
function IcoChevron({ c = '#fff', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoCheck({ c = '#fff', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={c}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IcoPlay({ c = Colors.brand.primary, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={c}>
      <Path d="M5 3l14 9-14 9V3z" />
    </Svg>
  );
}

// ── Dot de color con entrada escalonada ────────────────────────────
function ColorDot({ color, delay }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 110 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.2, 1], Extrapolation.CLAMP) },
    ],
  }));
  return <Animated.View style={[s.colorDot, { backgroundColor: color }, style]} />;
}

// ── Dot de navegación animado por scroll ───────────────────────────
function NavDot({ index, scrollX }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * W, index * W, (index + 1) * W];
    return {
      width: interpolate(scrollX.value, inputRange, [6, 22, 6], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, [0, W * 0.6], ['#ffffff', Colors.brand.primary]),
    };
  });
  return <Animated.View style={[s.dot, style]} />;
}

const HERO_FEATURES = [
  { label: 'Calendario litúrgico diario' },
  { label: 'Lecturas con audio y resaltado' },
  { label: 'Colores y tiempos del año litúrgico' },
];

// ── Ilustración slide 1: Hero ──────────────────────────────────────
function IlluWelcome() {
  const COLORS = Object.values(Colors.liturgical);
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-16, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const tauFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  return (
    <View style={s.heroIllu}>
      <Animated.View style={[s.heroTauWrap, tauFloatStyle]} pointerEvents="none">
        <Tau size={300} color="rgba(255,255,255,0.04)" />
      </Animated.View>

      {/* Logotipo */}
      <TauWordmark width={180} color="#fff" accentColor="rgba(255,255,255,0.5)" />
      <Text style={s.heroTagline}>El calendario litúrgico{'\n'}en tu bolsillo</Text>

      {/* Puntos de colores litúrgicos */}
      <View style={s.colorRow}>
        {COLORS.map((col, i) => (
          <ColorDot key={col} color={col} delay={320 + i * 65} />
        ))}
      </View>

      {/* Lista de features */}
      <View style={s.featureList}>
        {HERO_FEATURES.map((f, i) => (
          <FeatureRow key={i} label={f.label} delay={600 + i * 100} />
        ))}
      </View>
    </View>
  );
}

function FeatureRow({ label, delay }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 380 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: interpolate(progress.value, [0, 1], [16, 0], Extrapolation.CLAMP) }],
  }));
  return (
    <Animated.View style={[s.featureRow, style]}>
      <View style={s.featureCheck}>
        <IcoCheck c={Colors.brand.primary} size={11} />
      </View>
      <Text style={s.featureLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Ilustración slide 2: Tarjeta del día ───────────────────────────
function IlluCalendar() {
  return (
    <>
      <View style={s.dayCard}>
        <View style={[s.dayStripe, { backgroundColor: Colors.liturgical.red }]} />
        <View style={s.dayCardInner}>
          <Text style={s.dayCardDate}>MIÉRCOLES · 7 DE MAYO</Text>
          <Text style={s.dayCardName}>San Estanislao,{'\n'}obispo y mártir</Text>
          <View style={s.dayCardMeta}>
            <View style={[s.metaDot, { backgroundColor: Colors.liturgical.red }]} />
            <Text style={s.metaText}>Rojo · Mártires</Text>
          </View>
        </View>
      </View>
      <View style={s.upcomingRow}>
        {[
          { name: 'Ascensión', color: Colors.liturgical.white },
          { name: 'Pentecostés', color: Colors.liturgical.red },
          { name: 'SS. Trinidad', color: Colors.liturgical.white },
        ].map((item) => (
          <View key={item.name} style={s.upcomingChip}>
            <View style={[s.upcomingDot, { backgroundColor: item.color }]} />
            <Text style={s.upcomingLabel}>{item.name}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

// ── Ilustración slide 3: Lecturas ──────────────────────────────────
function IlluReadings() {
  const lines = [
    { w: '88%', hi: false },
    { w: '100%', hi: true },
    { w: '95%', hi: true },
    { w: '60%', hi: false },
    { w: '100%', hi: false },
    { w: '78%', hi: false },
  ];
  return (
    <View style={s.readingCard}>
      <View style={s.readingCardHeader}>
        <View
          style={[
            s.readingTypePill,
            { backgroundColor: Colors.brand.primary + '18', borderColor: Colors.brand.primary + '44' },
          ]}
        >
          <Text style={[s.readingTypeText, { color: Colors.brand.primary }]}>Ev</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.readingCardRef}>Jn 17, 1-11a</Text>
        </View>
        <View style={[s.miniPlay, { backgroundColor: Colors.brand.primary }]}>
          <IcoPlay c="#fff" size={12} />
        </View>
      </View>
      <View style={s.readingLines}>
        {lines.map((l, i) => (
          <View
            key={i}
            style={[
              s.textLine,
              { width: l.w },
              l.hi && { backgroundColor: Colors.brand.primary + '30', borderRadius: 3 },
            ]}
          />
        ))}
      </View>
      <View style={s.playerMini}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: '38%', backgroundColor: Colors.brand.primary }]} />
        </View>
        <View style={s.playerRow}>
          <Text style={s.playerTime}>0:42</Text>
          <Text style={s.playerTime}>1:51</Text>
        </View>
      </View>
    </View>
  );
}

// ── Slide con animaciones impulsadas por scroll ────────────────────
function Slide({ slideKey, index, scrollX }) {
  const illuStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * W, index * W, (index + 1) * W];
    return {
      opacity: interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollX.value, inputRange, [0.91, 1, 0.91], Extrapolation.CLAMP) },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * W, index * W, (index + 1) * W];
    return {
      opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollX.value, inputRange, [32, 0, -32], Extrapolation.CLAMP) },
      ],
    };
  });

  if (slideKey === 'welcome') {
    return (
      <View style={[s.slide, { backgroundColor: Colors.dark.bg }]}>
        <IlluWelcome />
      </View>
    );
  }

  const isCalendar = slideKey === 'calendar';
  const title = isCalendar ? 'Cada día,\nsu celebración' : 'Escucha\nlas lecturas';
  const body = isCalendar
    ? 'Conoce el color litúrgico, la temporada y las lecturas de cada jornada del año.'
    : 'Reproduce la Primera Lectura, el Salmo y el Evangelio con texto resaltado en tiempo real.';

  return (
    <View style={[s.slide, { backgroundColor: Colors.surface.editorial }]}>
      {/* Ilustración con escala animada */}
      <Animated.View style={[s.illuOuter, illuStyle]}>
        <View style={s.illuFrame}>
          <View style={s.illuTauWrap} pointerEvents="none">
            <Tau size={200} color={Colors.brand.primary} style={{ opacity: 0.06 }} />
          </View>
          {isCalendar ? <IlluCalendar /> : <IlluReadings />}
        </View>
      </Animated.View>

      {/* Texto con fade + slide desde abajo */}
      <Animated.View style={[s.textBlock, textStyle]}>
        <Text style={s.slideTitle}>{title}</Text>
        <Text style={s.slideBody}>{body}</Text>
      </Animated.View>
    </View>
  );
}

// ── Componente principal ───────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuthStore();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) setIndex(viewableItems[0].index ?? 0);
  }, []);

  const isLast = index === SLIDES.length - 1;

  const next = useCallback(() => {
    if (isLast) { completeOnboarding(); return; }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [isLast, index, completeOnboarding]);

  const skip = useCallback(() => { completeOnboarding(); }, [completeOnboarding]);

  // Fondo del root transiciona suave de oscuro a claro al pasar slide 0 → 1
  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      scrollX.value,
      [0, W * 0.7],
      [Colors.dark.bg, Colors.surface.editorial],
    ),
  }));

  // Skip text: blanco en fondo oscuro, muted en fondo claro
  const skipTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      scrollX.value,
      [0, W * 0.7],
      ['rgba(255,255,255,0.65)', Colors.ink.muted],
    ),
  }));

  // Botón siguiente: glass en slide 0, brand primary en los demás
  const nextBtnStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      Math.min(scrollX.value, W),
      [0, W * 0.5],
      ['rgba(255,255,255,0.18)', Colors.brand.primary],
    ),
  }));

  return (
    <Animated.View style={[s.root, rootStyle]}>
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index: i }) => (
          <Slide slideKey={item.key} index={i} scrollX={scrollX} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        style={{ flex: 1 }}
      />

      {/* Barra de navegación inferior */}
      <View style={[s.nav, { paddingBottom: insets.bottom + 16 }]}>
        {/* Saltar */}
        <TouchableOpacity
          onPress={skip}
          style={[s.skipBtn, { opacity: isLast ? 0 : 1 }]}
          disabled={isLast}
          activeOpacity={0.6}
        >
          <Animated.Text style={[s.skipText, skipTextStyle]}>Saltar</Animated.Text>
        </TouchableOpacity>

        {/* Dots animados */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <NavDot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>

        {/* Siguiente / Comenzar */}
        <TouchableOpacity onPress={next} activeOpacity={0.82}>
          <Animated.View style={[s.nextBtn, nextBtnStyle, isLast && s.nextBtnLast]}>
            {isLast ? <IcoCheck c="#fff" size={20} /> : <IcoChevron c="#fff" size={20} />}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  slide: { width: W, flex: 1 },

  /* ── Slide 1: hero ── */
  heroIllu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 52,
  },
  heroTauWrap: {
    position: 'absolute',
    top: '8%',
    left: -40,
  },
  heroTagline: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 23,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 31,
    marginTop: 18,
    marginBottom: 28,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.brand.primary + '28',
    borderWidth: 1,
    borderColor: Colors.brand.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  /* ── Slides 2-3: ilustración ── */
  illuOuter: {
    flex: 1,
    margin: 24,
    marginBottom: 0,
  },
  illuFrame: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: Colors.surface.primary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  illuTauWrap: {
    position: 'absolute',
    top: -20,
    right: -20,
  },

  /* ── Texto ── */
  textBlock: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  slideTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 34,
    lineHeight: 40,
    color: Colors.ink.primary,
    marginBottom: 10,
  },
  slideBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.ink.muted,
  },

  /* ── Ilustración calendario ── */
  dayCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: Colors.surface.secondary,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  dayStripe: { width: 4 },
  dayCardInner: { flex: 1, padding: 16 },
  dayCardDate: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.ink.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  dayCardName: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 18,
    color: Colors.ink.primary,
    lineHeight: 22,
    marginBottom: 10,
  },
  dayCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { width: 8, height: 8, borderRadius: 999 },
  metaText: { fontSize: 11, fontWeight: '600', color: Colors.ink.muted },
  upcomingRow: { flexDirection: 'row', gap: 8, width: '100%' },
  upcomingChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  upcomingDot: { width: 7, height: 7, borderRadius: 999 },
  upcomingLabel: { fontSize: 10, fontWeight: '600', color: Colors.ink.muted, flex: 1 },

  /* ── Ilustración lecturas ── */
  readingCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: Colors.surface.secondary,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  readingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  readingTypePill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingTypeText: { fontSize: 12, fontWeight: '700' },
  readingCardRef: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 17,
    color: Colors.ink.primary,
  },
  miniPlay: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingLines: { gap: 7, marginBottom: 16 },
  textLine: { height: 9, borderRadius: 4, backgroundColor: Colors.border.default },
  playerMini: { gap: 4 },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.border.default,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  playerTime: { fontSize: 10, color: Colors.ink.muted, fontWeight: '500' },

  /* ── Navegación inferior ── */
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  skipBtn: { minWidth: 60, paddingVertical: 6 },
  skipText: { fontSize: 14, fontWeight: '500' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 999 },
  nextBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnLast: {
    backgroundColor: Colors.brand.primary,
  },
});
