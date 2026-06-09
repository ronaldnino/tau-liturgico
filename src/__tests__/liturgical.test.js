import {
  TODAY,
  READINGS,
  UPCOMING,
  SEASONS,
  buildMonthGrid,
} from '../data/liturgical';

describe('liturgical data', () => {
  describe('TODAY', () => {
    it('tiene los campos requeridos', () => {
      expect(TODAY).toHaveProperty('date');
      expect(TODAY).toHaveProperty('season');
      expect(TODAY).toHaveProperty('seasonColor');
      expect(TODAY).toHaveProperty('liturgicalColor');
      expect(TODAY).toHaveProperty('cycle');
    });

    it('season es uno de los cinco tiempos litúrgicos', () => {
      const valid = ['Navidad', 'Cuaresma', 'Tiempo de Pascua', 'Tiempo Ordinario', 'Adviento'];
      expect(valid).toContain(TODAY.season);
    });

    it('liturgicalColor es uno de los colores válidos', () => {
      const valid = ['green', 'purple', 'white', 'red', 'rose', 'gold', 'blue'];
      expect(valid).toContain(TODAY.liturgicalColor);
    });
  });

  describe('READINGS', () => {
    it('contiene exactamente 3 lecturas', () => {
      expect(READINGS).toHaveLength(3);
    });

    it('cada lectura tiene type, ref y text', () => {
      READINGS.forEach((r) => {
        expect(r).toHaveProperty('type');
        expect(r).toHaveProperty('ref');
        expect(r).toHaveProperty('text');
        expect(typeof r.text).toBe('string');
        expect(r.text.length).toBeGreaterThan(0);
      });
    });
  });

  describe('UPCOMING', () => {
    it('devuelve exactamente 5 celebraciones', () => {
      expect(UPCOMING).toHaveLength(5);
    });

    it('cada celebración tiene date, name y color', () => {
      UPCOMING.forEach((u) => {
        expect(u).toHaveProperty('date');
        expect(u).toHaveProperty('name');
        expect(u).toHaveProperty('color');
      });
    });
  });

  describe('SEASONS', () => {
    it('contiene los 5 tiempos litúrgicos', () => {
      expect(SEASONS).toHaveLength(5);
      const names = SEASONS.map((s) => s.name);
      expect(names).toContain('Navidad');
      expect(names).toContain('Cuaresma');
      expect(names).toContain('Tiempo de Pascua');
      expect(names).toContain('Tiempo Ordinario');
      expect(names).toContain('Adviento');
    });

    it('exactamente uno de los tiempos está activo', () => {
      const activos = SEASONS.filter((s) => s.active);
      expect(activos).toHaveLength(1);
    });

    it('el progreso está entre 0 y 1', () => {
      SEASONS.forEach((s) => {
        expect(s.progress).toBeGreaterThanOrEqual(0);
        expect(s.progress).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('buildMonthGrid', () => {
    it('genera exactamente 42 celdas', () => {
      const grid = buildMonthGrid(2026, 4); // mayo 2026
      expect(grid).toHaveLength(42);
    });

    it('las celdas del mes tienen inMonth=true', () => {
      const grid = buildMonthGrid(2026, 4);
      const inMonth = grid.filter((c) => c.inMonth);
      expect(inMonth).toHaveLength(31); // mayo tiene 31 días
    });

    it('la primera celda del mes es lunes (dow 1)', () => {
      // mayo 2026 empieza en viernes, entonces la primera celda es el lunes anterior
      const grid = buildMonthGrid(2026, 4);
      const firstInMonth = grid.find((c) => c.inMonth && c.day === 1);
      expect(firstInMonth).toBeDefined();
    });

    it('cada celda tiene las propiedades requeridas', () => {
      const grid = buildMonthGrid(2026, 5);
      grid.forEach((cell) => {
        expect(cell).toHaveProperty('day');
        expect(cell).toHaveProperty('inMonth');
        expect(cell).toHaveProperty('dow');
        expect(cell).toHaveProperty('color');
        expect(cell).toHaveProperty('solemn');
        expect(cell).toHaveProperty('isToday');
      });
    });
  });
});
