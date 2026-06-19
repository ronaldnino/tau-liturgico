import { buildCanonicalReadings } from '../services/lectionary';
import { isSolemnity } from '../data/liturgical';

// Helpers para construir lecturas crudas de prueba.
const r = (type, extra = {}) => ({
  type,
  ref: `${type} 1, 1`,
  intro: `Lectura — ${type}`,
  text: 'Texto de ejemplo.',
  closing: '',
  ...extra,
});

// Fechas de referencia (mes 0-indexado).
const FERIA = new Date(2026, 5, 18); // jueves 18-jun-2026
const DOMINGO = new Date(2026, 5, 21); // domingo 21-jun-2026
const ASUNCION = new Date(2026, 7, 15); // 15-ago, solemnidad en sábado

const types = (arr) => arr.map((x) => x.type);

describe('buildCanonicalReadings', () => {
  it('feria con 3 lecturas completas → 3 ranuras en orden, ninguna no disponible', () => {
    const raw = [r('Primera Lectura'), r('Salmo Responsorial'), r('Santo Evangelio')];
    const out = buildCanonicalReadings(raw, FERIA);
    expect(types(out)).toEqual([
      'Primera Lectura',
      'Salmo Responsorial',
      'Santo Evangelio',
    ]);
    expect(out.some((x) => x.unavailable)).toBe(false);
  });

  it('domingo sin salmo (Vatican) → 4 ranuras con el Salmo marcado no disponible', () => {
    const raw = [r('Primera Lectura'), r('Segunda Lectura'), r('Santo Evangelio')];
    const out = buildCanonicalReadings(raw, DOMINGO);
    expect(types(out)).toEqual([
      'Primera Lectura',
      'Salmo Responsorial',
      'Segunda Lectura',
      'Santo Evangelio',
    ]);
    const salmo = out.find((x) => x.type === 'Salmo Responsorial');
    expect(salmo.unavailable).toBe(true);
    expect(salmo.text).toBe('');
  });

  it('feria sin datos → 3 ranuras, todas no disponibles', () => {
    const out = buildCanonicalReadings([], FERIA);
    expect(types(out)).toEqual([
      'Primera Lectura',
      'Salmo Responsorial',
      'Santo Evangelio',
    ]);
    expect(out.every((x) => x.unavailable)).toBe(true);
  });

  it('solemnidad en día de semana sin datos → 4 ranuras (incluye 2ª), todas no disponibles', () => {
    const out = buildCanonicalReadings([], ASUNCION);
    expect(types(out)).toEqual([
      'Primera Lectura',
      'Salmo Responsorial',
      'Segunda Lectura',
      'Santo Evangelio',
    ]);
    expect(out.every((x) => x.unavailable)).toBe(true);
  });

  it('incluye la 2ª lectura si vino en los datos aunque no sea domingo/solemnidad', () => {
    const raw = [
      r('Primera Lectura'),
      r('Salmo Responsorial'),
      r('Segunda Lectura'),
      r('Santo Evangelio'),
    ];
    const out = buildCanonicalReadings(raw, FERIA);
    expect(out).toHaveLength(4);
    expect(out.some((x) => x.unavailable)).toBe(false);
  });

  it('tolera entradas no-array', () => {
    expect(buildCanonicalReadings(null, FERIA)).toHaveLength(3);
    expect(buildCanonicalReadings(undefined, DOMINGO)).toHaveLength(4);
  });
});

describe('isSolemnity', () => {
  it('reconoce solemnidades fijas (15-ago Asunción)', () => {
    expect(isSolemnity(ASUNCION)).toBe(true);
  });

  it('reconoce solemnidades móviles (Corpus Christi 2026)', () => {
    // Pascua 2026 = 5-abr; Corpus = +60 días = 4-jun-2026.
    expect(isSolemnity(new Date(2026, 5, 4))).toBe(true);
  });

  it('una feria normal no es solemnidad', () => {
    expect(isSolemnity(FERIA)).toBe(false);
  });
});
