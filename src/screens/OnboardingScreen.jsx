import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme';
import { Tau, TauWordmark } from '../components';
import { useAuthStore } from '../store';

const { width: W } = Dimensions.get('window');

const SLIDES = [{ key: 'welcome' }, { key: 'calendar' }, { key: 'readings' }];
const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 };

/* ── Decoraciones SVG ────────────────────────────────────────────── */

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

/* ── Ilustración slide 1: Hero ───────────────────────────────────── */
function IlluWelcome() {
  const COLORS = Object.values(Colors.liturgical);
  return (
    <View style={s.heroIllu}>
      {/* Tau marca de agua */}
      <View style={s.heroTauWrap} pointerEvents="none">
        <Tau size={280} color="rgba(255,255,255,0.07)" />
      </View>
      {/* Logotipo */}
      <TauWordmark width={200} color="#fff" accentColor="rgba(255,255,255,0.55)" />
      <Text style={s.heroTagline}>El calendario litúrgico{'\n'}en tu bolsillo</Text>
      {/* Fila de colores litúrgicos */}
      <View style={s.colorRow}>
        {COLORS.map((col) => (
          <View key={col} style={[s.colorDot, { backgroundColor: col }]} />
        ))}
      </View>
    </View>
  );
}

/* ── Ilustración slide 2: Tarjeta del día ───────────────────────── */
function IlluCalendar() {
  return (
    <View style={s.illuFrame}>
      {/* Fondo tau marca de agua */}
      <View style={s.illuTauWrap} pointerEvents="none">
        <Tau size={200} color={Colors.brand.primary} style={{ opacity: 0.06 }} />
      </View>

      {/* Tarjeta de día */}
      <View style={s.dayCard}>
        {/* Franja de color litúrgico */}
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

      {/* Mini fila de próximas celebraciones */}
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
    </View>
  );
}

/* ── Ilustración slide 3: Lecturas ──────────────────────────────── */
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
    <View style={s.illuFrame}>
      <View style={s.illuTauWrap} pointerEvents="none">
        <Tau size={200} color={Colors.brand.primary} style={{ opacity: 0.06 }} />
      </View>

      {/* Tarjeta de lectura */}
      <View style={s.readingCard}>
        {/* Encabezado */}
        <View style={s.readingCardHeader}>
          <View
            style={[
              s.readingTypePill,
              {
                backgroundColor: Colors.brand.primary + '18',
                borderColor: Colors.brand.primary + '44',
              },
            ]}
          >
            <Text style={[s.readingTypeText, { color: Colors.brand.primary }]}>Ev</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.readingCardRef}>Jn 17, 1-11a</Text>
          </View>
          {/* Botón play */}
          <View style={[s.miniPlay, { backgroundColor: Colors.brand.primary }]}>
            <IcoPlay c="#fff" size={12} />
          </View>
        </View>

        {/* Líneas de texto simuladas con highlight */}
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

        {/* Barra de progreso + controles */}
        <View style={s.playerMini}>
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: '38%', backgroundColor: Colors.brand.primary },
              ]}
            />
          </View>
          <View style={s.playerRow}>
            <Text style={s.playerTime}>0:42</Text>
            <Text style={s.playerTime}>1:51</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ── Slide wrapper ───────────────────────────────────────────────── */
function Slide({ item }) {
  if (item.key === 'welcome') {
    return (
      <View style={[s.slide, { backgroundColor: Colors.dark.bg }]}>
        <IlluWelcome />
      </View>
    );
  }

  const isCalendar = item.key === 'calendar';
  const title = isCalendar ? 'Cada día,\nsu celebración' : 'Escucha\nlas lecturas';
  const body = isCalendar
    ? 'Conoce el color litúrgico, la temporada y las lecturas de cada jornada del año.'
    : 'Reproduce la Primera Lectura, el Salmo y el Evangelio con texto resaltado en tiempo real.';

  return (
    <View style={[s.slide, { backgroundColor: Colors.surface.editorial }]}>
      {isCalendar ? <IlluCalendar /> : <IlluReadings />}
      <View style={s.textBlock}>
        <Text style={s.slideTitle}>{title}</Text>
        <Text style={s.slideBody}>{body}</Text>
      </View>
    </View>
  );
}

/* ── Componente principal ────────────────────────────────────────── */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuthStore();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;
  const isFirst = index === 0;

  const next = useCallback(() => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [isLast, index, completeOnboarding]);

  const skip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const isDark = isFirst;
  const dotActive = isDark ? '#fff' : Colors.brand.primary;
  const dotInactive = isDark ? 'rgba(255,255,255,0.25)' : Colors.border.default;
  const skipColor = isDark ? 'rgba(255,255,255,0.65)' : Colors.ink.muted;

  return (
    <View
      style={[
        s.root,
        { backgroundColor: isFirst ? Colors.dark.bg : Colors.surface.editorial },
      ]}
    >
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
      />

      {/* Bottom nav */}
      <View style={[s.nav, { paddingBottom: insets.bottom + 16 }]}>
        {/* Saltar */}
        <TouchableOpacity
          onPress={skip}
          style={[s.skipBtn, { opacity: isLast ? 0 : 1 }]}
          disabled={isLast}
          activeOpacity={0.6}
        >
          <Text style={[s.skipText, { color: skipColor }]}>Saltar</Text>
        </TouchableOpacity>

        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                { backgroundColor: i === index ? dotActive : dotInactive },
                i === index && s.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Siguiente / Comenzar */}
        <TouchableOpacity
          onPress={next}
          style={[
            s.nextBtn,
            {
              backgroundColor: isLast
                ? Colors.brand.primary
                : isDark
                  ? 'rgba(255,255,255,0.15)'
                  : Colors.brand.primary,
            },
          ]}
          activeOpacity={0.82}
        >
          {isLast ? (
            <IcoCheck c="#fff" size={20} />
          ) : (
            <IcoChevron c={isDark ? '#fff' : '#fff'} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  slide: {
    width: W,
    flex: 1,
  },

  /* ── Slide 1: hero ── */
  heroIllu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  heroTauWrap: {
    position: 'absolute',
    top: '10%',
    left: -30,
  },
  heroTagline: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 22,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 30,
    marginTop: 22,
    marginBottom: 40,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  /* ── Slides 2-3: ilustración + texto ── */
  illuFrame: {
    flex: 1,
    margin: 24,
    marginBottom: 0,
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
  textBlock: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  slideTitle: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 32,
    lineHeight: 38,
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
  dayStripe: {
    width: 4,
  },
  dayCardInner: {
    flex: 1,
    padding: 16,
  },
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
  dayCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink.muted,
  },
  upcomingRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
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
  upcomingDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  upcomingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.ink.muted,
    flex: 1,
  },

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
  readingTypeText: {
    fontSize: 12,
    fontWeight: '700',
  },
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
  readingLines: {
    gap: 7,
    marginBottom: 16,
  },
  textLine: {
    height: 9,
    borderRadius: 4,
    backgroundColor: Colors.border.default,
  },
  playerMini: {
    gap: 4,
  },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.border.default,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerTime: {
    fontSize: 10,
    color: Colors.ink.muted,
    fontWeight: '500',
  },

  /* ── Navegación inferior ── */
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  skipBtn: {
    minWidth: 60,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 20,
    height: 6,
  },
  nextBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
