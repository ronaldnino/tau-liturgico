const Colors = {
  brand: {
    primary: '#0078D4',
    dark: '#005A9E',
    tint: '#E8F4FC',
    light: '#BFE0F7',
  },

  ink: {
    primary: '#1F2937',
    muted: '#6B7280',
    soft: '#9CA3AF',
  },

  surface: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    page: '#EFF4FB',
    editorial: '#F5F3EE',
  },

  border: {
    default: '#E0E0DC',
    blue: '#BFDBFE',
    divider: '#F1F5F9',
  },

  // Colores litúrgicos canónicos (valor semántico real)
  liturgical: {
    green: '#186420',
    purple: '#7D287D',
    white: '#FFFFFF',
    red: '#C62D25',
    rose: '#F485BA',
    gold: '#D4AF37',
  },

  // Variantes visibles para uso en UI (dots, stripes, pills, texto)
  // Solo difiere en los colores que son invisibles sobre fondos claros
  liturgicalUI: {
    green: '#186420',
    purple: '#7D287D',
    white: '#C8A84B', // marfil dorado — representa vestimenta blanca, visible en cualquier fondo
    red: '#C62D25',
    rose: '#F485BA',
    gold: '#D4AF37',
  },

  dark: {
    bg: '#0F172A',
    surface: '#1E293B',
    ink: '#F1F5F9',
    inkMuted: 'rgba(241,245,249,0.6)',
    inkSoft: 'rgba(241,245,249,0.3)',
    border: 'rgba(255,255,255,0.08)',
  },

  white: '#FFFFFF',
  black: '#000000',
};

export default Colors;
