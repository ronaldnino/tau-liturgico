const _WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
const _MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const _MONTHS_CAP = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const _MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const _n = new Date();
const _d = _n.getDate();
const _m = _n.getMonth();
const _y = _n.getFullYear();
const _w = _n.getDay();

// Determinar estación litúrgica activa para el header de Hoy
const _SEASON_META = {
  Navidad: { color: 'gold', label: 'Dorado · Navidad', celebration: 'Tiempo de Navidad' },
  Cuaresma: { color: 'purple', label: 'Morado · Cuaresma', celebration: 'Cuaresma' },
  'Tiempo de Pascua': {
    color: 'gold',
    label: 'Dorado · Pascua',
    celebration: 'Tiempo de Pascua',
  },
  'Tiempo Ordinario': {
    color: 'green',
    label: 'Verde · Ordinario',
    celebration: 'Feria del Tiempo Ordinario',
  },
  Adviento: { color: 'purple', label: 'Morado · Adviento', celebration: 'Adviento' },
};
const _activeSeasonName = (() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const e = _easter(_y);
  const nav = _baptismOfLord(_y);
  const ashWed = _addDays(e, -46),
    holySat = _addDays(e, -1);
  const pent = _addDays(e, 49),
    adv = _adventStart(_y);
  if (t >= new Date(_y - 1, 11, 25) && t <= nav) return 'Navidad';
  if (t >= ashWed && t <= holySat) return 'Cuaresma';
  if (t >= e && t <= pent) return 'Tiempo de Pascua';
  if (t > pent && t < adv) return 'Tiempo Ordinario';
  if (t >= adv && t <= new Date(_y, 11, 24)) return 'Adviento';
  return 'Tiempo Ordinario';
})();
const _sm = _SEASON_META[_activeSeasonName] ?? _SEASON_META['Tiempo Ordinario'];

// ── Número romano ─────────────────────────────────────────────────────────────
function _roman(n) {
  const vals = [1, 4, 5, 9, 10, 40, 50, 90, 100];
  const syms = ['I', 'IV', 'V', 'IX', 'X', 'XL', 'L', 'XC', 'C'];
  let s = '';
  for (let i = vals.length - 1; i >= 0; i--)
    while (n >= vals[i]) {
      s += syms[i];
      n -= vals[i];
    }
  return s;
}

// ── Estación litúrgica para cualquier fecha ────────────────────────────────────
function _seasonNameForDate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const y = d.getFullYear();
  const e = _easter(y);
  const baptism = _baptismOfLord(y);
  const ashWed = _addDays(e, -46);
  const holySat = _addDays(e, -1);
  const pent = _addDays(e, 49);
  const adv = _adventStart(y);
  if (d >= new Date(y - 1, 11, 25) && d <= baptism) return 'Navidad';
  if (d >= new Date(y, 11, 25)) return 'Navidad';
  if (d >= ashWed && d <= holySat) return 'Cuaresma';
  if (d >= e && d <= pent) return 'Tiempo de Pascua';
  if (d >= adv && d <= new Date(y, 11, 24)) return 'Adviento';
  return 'Tiempo Ordinario';
}

// ── Nombre del domingo para cualquier fecha ────────────────────────────────────
function _sundayNameForDate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const y = d.getFullYear();
  const season = _seasonNameForDate(d);
  const e = _easter(y);
  const ashWed = _addDays(e, -46);
  const adv = _adventStart(y);
  const christKing = _addDays(adv, -7);
  const baptism = _baptismOfLord(y);
  // Domingo actual de esa semana
  const thisSunday = new Date(y, d.getMonth(), d.getDate() - d.getDay());

  let w = '';
  if (season === 'Tiempo Ordinario') {
    if (thisSunday < ashWed) {
      w = _roman(Math.max(1, Math.floor(_daysBetween(baptism, thisSunday) / 7) + 1));
    } else {
      w = _roman(Math.max(1, 34 - Math.round(_daysBetween(thisSunday, christKing) / 7)));
    }
    return `${w} Domingo del Tiempo Ordinario`;
  }
  if (season === 'Cuaresma') {
    w = _roman(Math.min(6, Math.max(1, Math.floor(_daysBetween(ashWed, d) / 7) + 1)));
    if (w === 'VI') return 'Domingo de Ramos';
    return `${w} Domingo de Cuaresma`;
  }
  if (season === 'Tiempo de Pascua') {
    w = _roman(Math.min(7, Math.max(1, Math.floor(_daysBetween(e, d) / 7) + 1)));
    if (w === 'I') return 'Domingo de Resurrección';
    if (w === 'II') return 'Domingo de la Divina Misericordia';
    return `${w} Domingo de Pascua`;
  }
  if (season === 'Adviento') {
    w = _roman(Math.min(4, Math.max(1, Math.floor(_daysBetween(adv, d) / 7) + 1)));
    return `${w} Domingo de Adviento`;
  }
  return 'Domingo del Tiempo de Navidad';
}

// ── Semana litúrgica actual ────────────────────────────────────────────────────
const _liturgicalWeek = (() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const dow = t.getDay();
  const thisSunday = new Date(t.getFullYear(), t.getMonth(), t.getDate() - dow);
  const e = _easter(_y);
  const ashWed = _addDays(e, -46);
  const adv = _adventStart(_y);
  const christKing = _addDays(adv, -7);

  if (_activeSeasonName === 'Tiempo Ordinario') {
    if (thisSunday < ashWed) {
      const baptism = _baptismOfLord(_y);
      return _roman(Math.max(1, Math.floor(_daysBetween(baptism, thisSunday) / 7) + 1));
    }
    return _roman(Math.max(1, 34 - Math.round(_daysBetween(thisSunday, christKing) / 7)));
  }
  if (_activeSeasonName === 'Cuaresma')
    return _roman(Math.min(6, Math.max(1, Math.floor(_daysBetween(ashWed, t) / 7) + 1)));
  if (_activeSeasonName === 'Tiempo de Pascua')
    return _roman(Math.min(7, Math.max(1, Math.floor(_daysBetween(e, t) / 7) + 1)));
  if (_activeSeasonName === 'Adviento')
    return _roman(Math.min(4, Math.max(1, Math.floor(_daysBetween(adv, t) / 7) + 1)));
  return '';
})();

// Ciclo litúrgico: A=Mateo, B=Marcos, C=Lucas.
// advYear = año en que comienza el Adviento del ciclo actual.
// Fórmula: ['A','B','C'][advYear % 3] donde 2022→A, 2023→B, 2024→C, 2025→A, …
const _advYear = (() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t >= _adventStart(_y) ? _y : _y - 1;
})();
const _CYCLE_LETTER = ['A', 'B', 'C'][_advYear % 3];
const _CYCLE_GOSPEL = { A: 'Mateo', B: 'Marcos', C: 'Lucas' }[_CYCLE_LETTER];
const _LITURGICAL_YEAR = _advYear + 1;

export const CYCLE = {
  letter: _CYCLE_LETTER,
  gospel: _CYCLE_GOSPEL,
  liturgicalYear: _LITURGICAL_YEAR,
  label: `Ciclo ${_CYCLE_LETTER} · ${_CYCLE_GOSPEL}`,
  fullLabel: `Año litúrgico ${_LITURGICAL_YEAR} · Ciclo ${_CYCLE_LETTER} (${_CYCLE_GOSPEL})`,
};

const _isSunday = _w === 0;

const _todayCelebration = (() => {
  if (_isSunday) return _sundayNameForDate(_n);
  switch (_activeSeasonName) {
    case 'Tiempo Ordinario':
      return 'Feria del Tiempo Ordinario';
    case 'Adviento':
      return 'Feria de Adviento';
    case 'Cuaresma':
      return 'Feria de Cuaresma';
    case 'Tiempo de Pascua':
      return 'Feria del Tiempo de Pascua';
    case 'Navidad':
      return 'Feria del Tiempo de Navidad';
    default:
      return _sm.celebration;
  }
})();

export const TODAY = {
  date: `${_WEEKDAYS[_w]}, ${_d} de ${_MONTHS[_m]}`,
  dateShort: `${_d} ${_MONTHS_SHORT[_m]}`,
  weekday: _WEEKDAYS[_w],
  day: _d,
  month: _MONTHS_CAP[_m],
  year: String(_y),
  season: _activeSeasonName,
  week: _liturgicalWeek,
  seasonColor: _sm.color,
  celebration: _todayCelebration,
  celebrationShort: _activeSeasonName,
  grade: _isSunday ? 'Domingo' : 'Feria',
  liturgicalColor: _sm.color,
  liturgicalColorLabel: _sm.label,
  cycle: CYCLE.fullLabel,
};

export const READINGS = [
  {
    type: 'Primera Lectura',
    ref: 'Hch 12, 24 — 13, 5a',
    intro: 'Lectura del libro de los Hechos de los Apóstoles.',
    text: `En aquellos días, la palabra del Señor crecía y se propagaba. Bernabé y Saulo, una vez cumplido su servicio, regresaron de Jerusalén llevando con ellos a Juan, el llamado Marcos.

Había en la iglesia de Antioquía profetas y maestros: Bernabé, Simeón llamado Niger, Lucio el cireneo, Manaén —compañero de infancia del tetrarca Herodes— y Saulo. Mientras estaban celebrando el culto del Señor y ayunando, dijo el Espíritu Santo: «Sepárenme a Bernabé y a Saulo para la obra a la que los he llamado.»

Entonces, después de ayunar y orar, les impusieron las manos y los enviaron.`,
    closing: 'Palabra de Dios.',
  },
  {
    type: 'Salmo Responsorial',
    ref: 'Sal 66, 2-3. 5. 6 y 8',
    response: 'Que te alaben, Señor, todos los pueblos.',
    text: `El Señor tenga piedad y nos bendiga,
ilumine su rostro sobre nosotros;
conozca la tierra tus caminos,
todos los pueblos tu salvación. R.

Que canten de alegría las naciones,
porque riges el mundo con justicia. R.`,
  },
  {
    type: 'Santo Evangelio',
    ref: 'Jn 12, 44-50',
    intro: 'Lectura del santo Evangelio según san Juan.',
    text: `En aquel tiempo, Jesús dijo en voz alta: «El que cree en mí, no cree en mí, sino en el que me ha enviado; y el que me ve a mí, ve al que me ha enviado.

Yo, la luz, he venido al mundo, para que todo el que crea en mí no quede en tinieblas.»`,
    closing: 'Palabra del Señor.',
  },
];

// ── Catálogo de fiestas fijas (mes 0-11, día) ─────────────────
const _FIXED_FEASTS = [
  // Enero
  { m: 0, d: 1, name: 'Santa María, Madre de Dios', color: 'white', solemn: true },
  { m: 0, d: 6, name: 'Epifanía del Señor', color: 'white', solemn: true },
  // Febrero
  { m: 1, d: 2, name: 'Presentación del Señor', color: 'white', solemn: false },
  { m: 1, d: 11, name: 'Ntra. Sra. de Lourdes', color: 'white', solemn: false },
  // Marzo
  { m: 2, d: 19, name: 'San José, Esposo de la Virgen', color: 'white', solemn: true },
  { m: 2, d: 25, name: 'Anunciación del Señor', color: 'white', solemn: true },
  // Mayo
  { m: 4, d: 1, name: 'San José Obrero', color: 'white', solemn: false },
  { m: 4, d: 3, name: 'Santos Felipe y Santiago', color: 'red', solemn: false },
  { m: 4, d: 14, name: 'San Matías, apóstol', color: 'red', solemn: false },
  // Junio
  { m: 5, d: 11, name: 'San Bernabé, apóstol', color: 'red', solemn: false },
  { m: 5, d: 13, name: 'San Antonio de Padua', color: 'white', solemn: false },
  { m: 5, d: 24, name: 'Natividad de Juan Bautista', color: 'white', solemn: true },
  { m: 5, d: 29, name: 'Santos Pedro y Pablo, apóstoles', color: 'red', solemn: true },
  // Julio
  { m: 6, d: 3, name: 'Santo Tomás, apóstol', color: 'red', solemn: false },
  { m: 6, d: 16, name: 'Ntra. Sra. del Carmen', color: 'white', solemn: false },
  { m: 6, d: 22, name: 'Santa María Magdalena', color: 'white', solemn: false },
  { m: 6, d: 25, name: 'Santiago, apóstol', color: 'red', solemn: true },
  { m: 6, d: 26, name: 'San Joaquín y Santa Ana', color: 'white', solemn: false },
  // Agosto
  { m: 7, d: 6, name: 'Transfiguración del Señor', color: 'white', solemn: true },
  { m: 7, d: 10, name: 'San Lorenzo, diácono y mártir', color: 'red', solemn: false },
  { m: 7, d: 15, name: 'Asunción de la Virgen María', color: 'white', solemn: true },
  { m: 7, d: 22, name: 'Santa María Reina', color: 'white', solemn: false },
  { m: 7, d: 24, name: 'San Bartolomé, apóstol', color: 'red', solemn: false },
  // Septiembre
  { m: 8, d: 8, name: 'Natividad de la Virgen María', color: 'white', solemn: false },
  { m: 8, d: 14, name: 'Exaltación de la Santa Cruz', color: 'red', solemn: true },
  { m: 8, d: 15, name: 'Ntra. Sra. de los Dolores', color: 'white', solemn: false },
  { m: 8, d: 21, name: 'San Mateo, apóstol y evangelista', color: 'red', solemn: false },
  { m: 8, d: 29, name: 'Santos Miguel, Gabriel y Rafael', color: 'white', solemn: false },
  // Octubre
  { m: 9, d: 2, name: 'Santos Ángeles Custodios', color: 'white', solemn: false },
  { m: 9, d: 4, name: 'San Francisco de Asís', color: 'white', solemn: false },
  { m: 9, d: 7, name: 'Ntra. Sra. del Rosario', color: 'white', solemn: false },
  { m: 9, d: 18, name: 'San Lucas, evangelista', color: 'red', solemn: false },
  { m: 9, d: 28, name: 'Santos Simón y Judas Tadeo', color: 'red', solemn: false },
  // Noviembre
  { m: 10, d: 1, name: 'Todos los Santos', color: 'white', solemn: true },
  {
    m: 10,
    d: 2,
    name: 'Conmemoración de los Fieles Difuntos',
    color: 'purple',
    solemn: false,
  },
  {
    m: 10,
    d: 9,
    name: 'Dedicación de la Basílica de Letrán',
    color: 'white',
    solemn: false,
  },
  { m: 10, d: 30, name: 'San Andrés, apóstol', color: 'red', solemn: false },
  // Diciembre
  { m: 11, d: 8, name: 'Inmaculada Concepción', color: 'white', solemn: true },
  { m: 11, d: 12, name: 'Ntra. Sra. de Guadalupe', color: 'white', solemn: false },
  { m: 11, d: 25, name: 'Natividad del Señor', color: 'gold', solemn: true },
  { m: 11, d: 26, name: 'San Esteban, protomártir', color: 'red', solemn: false },
  { m: 11, d: 27, name: 'San Juan, apóstol', color: 'white', solemn: false },
  { m: 11, d: 28, name: 'Santos Inocentes', color: 'red', solemn: false },
];

// ── Fiestas móviles (relativas a Pascua) ──────────────────────
function _moveableFeasts(year) {
  const e = _easter(year);
  const f = (n, name, color, solemn = false) => ({
    date: _addDays(e, n),
    name,
    color,
    solemn,
  });
  return [
    f(-46, 'Miércoles de Ceniza', 'purple', true),
    f(-7, 'Domingo de Ramos', 'red', true),
    f(-3, 'Jueves Santo', 'white', true),
    f(-2, 'Viernes Santo', 'red', true),
    f(0, 'Domingo de Pascua', 'gold', true),
    f(7, 'Divina Misericordia', 'gold', false),
    f(39, 'Ascensión del Señor', 'gold', true),
    f(49, 'Domingo de Pentecostés', 'red', true),
    f(56, 'Santísima Trinidad', 'white', true),
    f(60, 'Corpus Christi', 'white', true),
    f(68, 'Sagrado Corazón de Jesús', 'red', true),
    f(69, 'Inmaculado Corazón de María', 'white', false),
  ];
}

// ── Próximas celebraciones desde mañana ───────────────────────
function _computeUpcoming(count = 5) {
  const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MON = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = _addDays(today, 1);
  const year = today.getFullYear();
  const all = [];

  [year, year + 1].forEach((y) => {
    _FIXED_FEASTS.forEach(({ m, d, name, color, solemn }) => {
      const date = new Date(y, m, d);
      if (date >= tomorrow) all.push({ date, name, color, solemn });
    });
    _moveableFeasts(y).forEach((f) => {
      if (f.date >= tomorrow) all.push(f);
    });
  });

  all.sort((a, b) => a.date - b.date);

  const seen = new Set();
  return all.reduce((acc, f) => {
    if (acc.length >= count) return acc;
    const key = `${f.date.toDateString()}|${f.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      acc.push({
        date: `${DOW[f.date.getDay()]} ${f.date.getDate()} ${MON[f.date.getMonth()]}`,
        name: f.name,
        color: f.color,
        solemn: f.solemn,
        highlight: f.solemn,
      });
    }
    return acc;
  }, []);
}

export const UPCOMING = _computeUpcoming(5);

// ¿La fecha es una solemnidad? Sirve para saber si el día lleva 2ª lectura
// (domingos y solemnidades = 4 lecturas; el resto = 3) aunque no se haya podido
// descargar. Recorre las fiestas fijas y móviles marcadas con `solemn: true`.
export function isSolemnity(date) {
  const m = date.getMonth();
  const d = date.getDate();
  const y = date.getFullYear();
  if (_FIXED_FEASTS.some((f) => f.m === m && f.d === d && f.solemn)) return true;
  return _moveableFeasts(y).some(
    (f) => f.solemn && f.date.toDateString() === date.toDateString()
  );
}

// ── Calendario litúrgico dinámico ──────────────────────────────

function _easter(year) {
  // Algoritmo anónimo gregoriano
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100;
  const d = Math.floor(b / 4),
    e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4),
    k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function _addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

function _daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function _adventStart(year) {
  // Primer domingo de Adviento: domingo entre el 27 nov y 3 dic
  const nov27 = new Date(year, 10, 27);
  const dow = nov27.getDay();
  return _addDays(nov27, dow === 0 ? 0 : 7 - dow);
}

function _baptismOfLord(year) {
  // Primer domingo a partir del 7 de enero
  const jan7 = new Date(year, 0, 7);
  const dow = jan7.getDay();
  return dow === 0 ? jan7 : _addDays(jan7, 7 - dow);
}

function _seasonColorForDate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const y = d.getFullYear();
  const e = _easter(y);
  const baptism = _baptismOfLord(y);
  const ashWed = _addDays(e, -46);
  const holySat = _addDays(e, -1);
  const pent = _addDays(e, 49);
  const adv = _adventStart(y);
  const prevDec25 = new Date(y - 1, 11, 25);
  const curDec25 = new Date(y, 11, 25);

  if (d >= prevDec25 && d <= baptism) return 'white';
  if (d >= curDec25) return 'white';
  if (d >= ashWed && d <= holySat) return 'purple';
  if (d >= e && d <= pent) return 'gold';
  if (d >= adv && d <= new Date(y, 11, 24)) return 'purple';
  return 'green';
}

function _fmt(d) {
  const MS = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  return `${d.getDate()} ${MS[d.getMonth()]}`;
}

function _seasonEntry(name, color, start, end, today) {
  const before = today < start;
  const after = today > end;
  const active = !before && !after;
  const total = _daysBetween(start, end) || 1;
  const elapsed = Math.max(0, _daysBetween(start, today));
  const remaining = Math.max(0, _daysBetween(today, end));
  return {
    name,
    color,
    range: `${_fmt(start)} — ${_fmt(end)}`,
    progress: after ? 1 : before ? 0 : Math.min(1, elapsed / total),
    active,
    totalDays: total,
    days: active
      ? remaining === 0
        ? 'Hoy termina'
        : `${remaining} ${remaining === 1 ? 'día' : 'días'} restantes`
      : before
        ? `Comienza en ${_daysBetween(today, start)} días`
        : 'Completado',
  };
}

function _computeSeasons() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();

  // Navidad: 25 dic del año anterior → Bautismo del Señor (año actual)
  const navStart = new Date(year - 1, 11, 25);
  const navEnd = _baptismOfLord(year);

  const easter = _easter(year);
  const ashWed = _addDays(easter, -46);
  const holySat = _addDays(easter, -1);
  const pentecost = _addDays(easter, 49);
  const ordStart = _addDays(pentecost, 1);

  // Cristo Rey y fin de Tiempo Ordinario siempre apuntan al Adviento próximo del año actual
  const nextAdventStart = _adventStart(year);
  const christKing = _addDays(nextAdventStart, -1);

  // Adviento del año litúrgico en curso:
  // Entre ene 1 y el inicio del próximo Adviento ya pasó el Adviento anterior (año - 1).
  // Mostrarlo como completado en lugar del próximo que aún no arranca.
  const prevAdventEnd = new Date(year - 1, 11, 24);
  const advYear = today > prevAdventEnd && today < nextAdventStart ? year - 1 : year;
  const adventStart = _adventStart(advYear);
  const adventEnd = new Date(advYear, 11, 24);

  return [
    _seasonEntry('Navidad', 'gold', navStart, navEnd, today),
    _seasonEntry('Cuaresma', 'purple', ashWed, holySat, today),
    _seasonEntry('Tiempo de Pascua', 'gold', easter, pentecost, today),
    _seasonEntry('Tiempo Ordinario', 'green', ordStart, christKing, today),
    _seasonEntry('Adviento', 'purple', adventStart, adventEnd, today),
  ];
}

export const SEASONS = _computeSeasons();

// Prioridad litúrgica: Solemnidad > Fiesta > Domingo/Memoria > Feria
const _GRADE_PRIORITY = { Solemnidad: 3, Fiesta: 2, Domingo: 1, Memoria: 1, Feria: 0 };

// Genera una grilla de 6 semanas (42 días) para cualquier mes, empezando en lunes
export function buildMonthGrid(year, month) {
  // Acumular TODAS las celebraciones del día en arrays (no sobrescribir)
  const feasts = {};
  _FIXED_FEASTS.forEach(({ m, d, name, color, solemn }) => {
    if (m === month) {
      if (!feasts[d]) feasts[d] = [];
      feasts[d].push({ name, color, grade: solemn ? 'Solemnidad' : 'Memoria' });
    }
  });
  _moveableFeasts(year).forEach(({ date, name, color, solemn }) => {
    if (date.getMonth() === month && date.getFullYear() === year) {
      const d = date.getDate();
      if (!feasts[d]) feasts[d] = [];
      feasts[d].push({ name, color, grade: solemn ? 'Solemnidad' : 'Fiesta' });
    }
  });

  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=dom
  const startOffset = startDow === 0 ? -6 : 1 - startDow;
  const start = new Date(year, month, 1 + startOffset);
  const today = new Date();

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = d.getDate();
    const m = d.getMonth();
    const y = d.getFullYear();
    const dow = d.getDay();
    const inMonth = m === month && y === year;
    const isToday =
      inMonth &&
      day === today.getDate() &&
      m === today.getMonth() &&
      y === today.getFullYear();

    // Ordenar celebraciones por prioridad (mayor primero)
    const dayFeasts =
      inMonth && feasts[day]
        ? [...feasts[day]].sort(
            (a, b) => (_GRADE_PRIORITY[b.grade] ?? 0) - (_GRADE_PRIORITY[a.grade] ?? 0)
          )
        : [];

    const primary = dayFeasts[0] ?? null;
    const isDomingo = dow === 0 && inMonth;
    const sundayName = isDomingo ? _sundayNameForDate(d) : null;

    return {
      day,
      inMonth,
      dow,
      color: primary?.color ?? (inMonth ? _seasonColorForDate(d) : 'green'),
      solemn: primary?.grade === 'Solemnidad',
      name: primary?.name ?? sundayName,
      grade: primary?.grade ?? (isDomingo ? 'Domingo' : 'Feria'),
      celebrations:
        dayFeasts.length > 0
          ? dayFeasts
          : sundayName
            ? [
                {
                  name: sundayName,
                  color: inMonth ? _seasonColorForDate(d) : 'green',
                  grade: 'Domingo',
                },
              ]
            : [],
      isToday,
    };
  });
}

// Alias del mes actual para compatibilidad
export const MAY_2026 = buildMonthGrid(2026, 4);

export const NOTES_DATA = [
  {
    date: '5 de mayo · 2026',
    weekday: 'Lunes',
    celebration: 'Tiempo de Pascua · Feria',
    color: 'gold',
    text: 'La vid y los sarmientos — Cristo es la fuente. Sin él, nada podemos hacer.',
  },
  {
    date: '3 de mayo · 2026',
    weekday: 'Domingo',
    celebration: 'IV Domingo de Pascua',
    color: 'gold',
    text: 'Domingo del Buen Pastor. Vocaciones — orar por los seminaristas de la diócesis.',
  },
  {
    date: '1 de mayo · 2026',
    weekday: 'Viernes',
    celebration: 'San José Obrero',
    color: 'white',
    text: 'El trabajo como ofrenda. ¿Cómo santifico mis ocho horas?',
  },
];

export const BOOKMARKS_DATA = [
  { date: 'Dom 24 may', name: 'Domingo de Pentecostés', color: 'red', solemn: true },
  { date: 'Jue 21 may', name: 'Ascensión del Señor', color: 'gold', solemn: true },
  { date: 'Vie 1 may', name: 'San José Obrero', color: 'white' },
  { date: 'Lun 28 abr', name: 'San Pedro Chanel, mártir', color: 'red' },
];

export const LITURGICAL_LABELS = {
  green: { name: 'Verde', meaning: 'Tiempo Ordinario' },
  purple: { name: 'Morado', meaning: 'Adviento · Cuaresma' },
  white: { name: 'Blanco', meaning: 'Fiestas · Santos' },
  red: { name: 'Rojo', meaning: 'Mártires · Pentecostés' },
  rose: { name: 'Rosa', meaning: 'Gaudete · Laetare' },
  gold: { name: 'Dorado', meaning: 'Navidad · Pascua' },
};
