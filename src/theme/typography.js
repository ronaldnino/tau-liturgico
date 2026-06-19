export const FontFamily = {
  serif: {
    regular: 'CormorantGaramond-Regular',
    medium: 'CormorantGaramond-Medium',
    semiBold: 'CormorantGaramond-SemiBold',
    regularItalic: 'CormorantGaramond-Italic',
    mediumItalic: 'CormorantGaramond-MediumItalic',
    semiBoldItalic: 'CormorantGaramond-SemiBoldItalic',
  },
};

export const FontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,
};

export const LineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.65,
};

// Escala tipográfica única de la app. Dos capas:
//  · Serif (Cormorant Garamond) para display, títulos y nombres destacados.
//  · Sans (fuente del sistema) para la UI: etiquetas, botones, meta, cuerpo.
// Todas las pantallas y componentes deben consumir estos roles (no redefinir
// pesos/tamaños a mano) para evitar inconsistencias.
export const TextStyles = {
  // ── Serif (editorial) ──────────────────────────────────────────────
  display: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 34,
    lineHeight: 39,
  },
  h2: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 28,
    lineHeight: 36,
  },
  // Nombres/títulos destacados (heroName, monthText, panelName, statValue…).
  titleSerif: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    lineHeight: 28,
  },
  quote: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 18,
    lineHeight: 30,
  },

  // ── Sans (UI) ──────────────────────────────────────────────────────
  h3: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 23,
  },
  // Etiqueta en mayúsculas (rol "eyebrow"): único peso/spacing en toda la app.
  // Si un layout necesita menos de 11px, override SOLO fontSize.
  eyebrow: {
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  button: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  buttonSm: {
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  // Etiqueta de campo/fila (no mayúsculas).
  label: {
    fontWeight: '600',
    fontSize: 13,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 20,
  },
  meta: {
    fontWeight: '500',
    fontSize: 12,
  },
};

const Typography = { FontFamily, FontSize, LineHeight, TextStyles };
export default Typography;
