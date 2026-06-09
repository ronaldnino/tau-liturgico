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

export const TextStyles = {
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
  h3: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 23,
  },
  eyebrow: {
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
  quote: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 18,
    lineHeight: 30,
  },
};

const Typography = { FontFamily, FontSize, LineHeight, TextStyles };
export default Typography;
