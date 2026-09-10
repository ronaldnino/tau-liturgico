// Port a Node del scraping de lecturas que antes vivía en
// src/services/lectionary.js (cliente). Corre ahora en la Cloud Function
// getReadings (ver ../index.js) en vez de en el dispositivo del usuario —
// evita el bloqueo de Cloudflare a IPs de baja reputación (operadores de
// Venezuela) y permite cachear el resultado en Firestore para todos los
// usuarios. Ver docs/LECTURAS.md para la regla litúrgica y la cadena de
// fallback entre fuentes.
import { isEasterVigil } from './liturgical.js';

const BASE = 'https://www.dominicos.org/predicacion/evangelio-del-dia';
const VATICAN_BASE = 'https://www.vaticannews.va/es/evangelio-de-hoy';
const EVANGELIZO_BASE = 'https://feed.evangelizo.org/v2/reader.php';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
};

const FETCH_TIMEOUT_MS = 20000;

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { headers: BROWSER_HEADERS, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildUrl(date = new Date()) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${BASE}/${d}-${m}-${y}/`;
}

function buildVaticanUrl(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${VATICAN_BASE}/${y}/${m}/${d}.html`;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&iacute;/g, 'í')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&iexcl;/g, '¡')
    .replace(/&iquest;/g, '¿')
    .replace(/&middot;/g, '·')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(str) {
  return decodeEntities(str.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim();
}

function extractRef(intro, typeLabel) {
  if (typeLabel === 'Salmo') {
    const m = intro.match(/^(Salmo\s+[\d,\s.\-–—]+)/i);
    return m ? m[1].trim().replace(/[,.\s]+$/, '') : intro;
  }

  let bookNum = '';
  if (/primer[oa]?\s+(libro|carta)/i.test(intro)) bookNum = '1 ';
  else if (/segund[oa]?\s+(libro|carta)/i.test(intro)) bookNum = '2 ';
  else if (/tercer[oa]?\s+(libro|carta)/i.test(intro)) bookNum = '3 ';

  let ref = intro
    .replace(/^Lectura del santo evangelio según\s*/i, '')
    .replace(
      /^Lectura de la (primera|segunda|tercera) carta del? (apóstol\s+)?san(ta)?\s*/i,
      ''
    )
    .replace(/^Lectura de la carta del? (apóstol\s+)?san(ta)?\s*/i, '')
    .replace(/^Lectura de la carta a los\s*/i, '')
    .replace(/^Lectura de la carta a las\s*/i, '')
    .replace(
      /^Lectura del (primer[oa]?|segund[oa]?|tercer[oa]?) libro de (los\s+|las\s+)?/i,
      ''
    )
    .replace(/^Lectura del libro de (los\s+|las\s+|la\s+|el\s+)?/i, '')
    .replace(/^Lectura del libro del\s*/i, '')
    .replace(/^Lectura del libro de\s*/i, '')
    .replace(/^Lectura del profeta\s*/i, '')
    .replace(/^Lectura de\s*/i, '')
    .replace(/^san(ta)?\s+/i, '')
    .replace(/^Pablo\s+a\s+(los\s+|las\s+|la\s+|el\s+)?/i, '')
    .trim();

  return (bookNum + ref).trim();
}

function normalizeType(h2Text) {
  const t = h2Text.toLowerCase().trim();
  if (t === 'primera lectura')
    return { type: 'Primera Lectura', closing: 'Palabra de Dios.' };
  if (t === 'segunda lectura')
    return { type: 'Segunda Lectura', closing: 'Palabra de Dios.' };
  if (t === 'salmo de hoy') return { type: 'Salmo Responsorial', closing: '' };
  if (t === 'evangelio del día')
    return { type: 'Santo Evangelio', closing: 'Palabra del Señor.' };
  return null;
}

function parseReadings(html) {
  const marker = '<div class="contenido-dia">';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('Bloque de lecturas no encontrado');

  const block = html.slice(start + marker.length, start + 30000);

  const parts = block.split(/<h2>/i);
  parts.shift();

  const readings = [];

  for (const part of parts) {
    const h2Match = part.match(/^([^<]+)<\/h2>/);
    if (!h2Match) continue;

    const h3Match = part.match(/<h3>([\s\S]*?)<\/h3>/i);
    const intro = h3Match ? stripHtml(h3Match[1]) : '';

    const pMatches = [...part.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
    const paragraphs = pMatches
      .map((m) => stripHtml(m[1] ?? ''))
      .filter((t) => t.length > 0);

    if (paragraphs.length === 0) continue;

    const normalized = normalizeType(h2Match[1].trim());
    if (!normalized) continue;

    const { type, closing } = normalized;
    const ref = extractRef(intro, type === 'Salmo Responsorial' ? 'Salmo' : type);

    readings.push({ type, ref, intro, text: paragraphs.join('\n\n'), closing });
  }

  if (readings.length < 2) throw new Error('No se pudieron extraer las lecturas');
  return readings;
}

function parseVaticanReadings(html) {
  const sectionRe = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  const sections = [];
  let sm;
  while ((sm = sectionRe.exec(html)) !== null) {
    sections.push(sm[1]);
  }

  let lecturaSection = null;
  let evangelioSection = null;
  for (const s of sections) {
    const h2m = s.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (!h2m) continue;
    const h2 = stripHtml(h2m[1]);
    if (/lectura del d[ií]a/i.test(h2)) lecturaSection = s;
    else if (/evangelio del d[ií]a/i.test(h2)) evangelioSection = s;
  }

  if (!lecturaSection && !evangelioSection) {
    throw new Error('Estructura de Vatican News no reconocida');
  }

  const readings = [];

  if (lecturaSection) {
    const ps = [...lecturaSection.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripHtml(m[1] ?? ''))
      .filter((t) => t.length > 0);

    const groups = [];
    let cur = null;
    let curType = null;

    for (const p of ps) {
      const low = p.toLowerCase().trim();
      if (low === 'primera lectura') {
        if (cur) groups.push({ type: curType, ps: cur });
        cur = [];
        curType = 'Primera Lectura';
      } else if (low === 'segunda lectura') {
        if (cur) groups.push({ type: curType, ps: cur });
        cur = [];
        curType = 'Segunda Lectura';
      } else {
        if (cur === null) {
          cur = [];
          curType = 'Primera Lectura';
        }
        cur.push(p);
      }
    }
    if (cur && cur.length > 0) groups.push({ type: curType, ps: cur });

    for (const g of groups) {
      if (g.ps.length < 2) continue;
      readings.push({
        type: g.type,
        ref: g.ps[1],
        intro: g.ps[0],
        text: g.ps.slice(2).join('\n\n'),
        closing: 'Palabra de Dios.',
      });
    }
  }

  if (evangelioSection) {
    const ps = [...evangelioSection.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripHtml(m[1] ?? ''))
      .filter((t) => t.length > 0);
    if (ps.length >= 2) {
      readings.push({
        type: 'Santo Evangelio',
        ref: ps[1],
        intro: ps[0],
        text: ps.slice(2).join('\n\n'),
        closing: 'Palabra del Señor.',
      });
    }
  }

  if (readings.length < 1)
    throw new Error('No se pudieron extraer lecturas de Vatican News');
  return readings;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function fetchDailyReadings(date = new Date()) {
  // Mismo guard que el cliente (ver src/services/lectionary.js): ninguna
  // fuente sirve la Vigilia Pascual correctamente, así que se corta antes de
  // intentar nada. Redundante con el chequeo en index.js — defensa en
  // profundidad si esta función se invoca desde otro lado en el futuro.
  if (isEasterVigil(date)) throw new Error('VIGILIA_PASCUAL_NO_SOPORTADA');

  const today = isSameDay(date, new Date());
  const url = today ? `${BASE}/hoy/` : buildUrl(date);
  const resp = await fetchHtml(url);
  if (!resp.ok) throw new Error(`Error HTTP ${resp.status} en ${url}`);
  if (
    !today &&
    (resp.redirected || (resp.url && !resp.url.includes('/evangelio-del-dia/')))
  ) {
    return fetchFallbackReadings(date);
  }
  try {
    const html = await resp.text();
    return parseReadings(html);
  } catch (_) {
    return fetchFallbackReadings(date);
  }
}

async function fetchFallbackReadings(date) {
  try {
    return await fetchEvangelizoReadings(date);
  } catch (_) {
    return fetchVaticanReadings(date);
  }
}

function buildEvangelizoUrl(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${EVANGELIZO_BASE}?date=${y}-${m}-${d}&type=all&lang=SP`;
}

async function fetchEvangelizoReadings(date) {
  const resp = await fetchHtml(buildEvangelizoUrl(date));
  if (!resp.ok) throw new Error('FECHA_SIN_LECTURAS');
  const raw = await resp.text();
  if (/<!DOCTYPE|Reader Evangelizo|Error\s*:/i.test(raw)) {
    throw new Error('FECHA_SIN_LECTURAS');
  }
  return parseEvangelizoReadings(raw);
}

function parseEvangelizoReadings(html) {
  const lines = stripHtml(html)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const psalmIdx = lines.findIndex((l) => /^Salmo\b/i.test(l));
  const gospelIdx = lines.findIndex((l) => /^Evangelio\b/i.test(l));
  if (psalmIdx < 1 || gospelIdx <= psalmIdx) {
    throw new Error('Estructura de Evangelizo no reconocida');
  }
  const isTitle = (l) => /\s\d/.test(l) && l.length < 100;

  const mkReading = (titleLine, textLines, type, closing) => {
    const m = titleLine.match(/^(.*?)(\d.*)$/);
    return {
      type,
      ref: m ? m[2].replace(/\.\s*$/, '').trim() : '',
      intro: m ? m[1].trim() : titleLine,
      text: textLines.join('\n\n'),
      closing,
    };
  };

  const readings = [];
  readings.push(
    mkReading(lines[1], lines.slice(2, psalmIdx), 'Primera Lectura', 'Palabra de Dios.')
  );

  let secondIdx = -1;
  for (let i = psalmIdx + 1; i < gospelIdx; i++) {
    if (isTitle(lines[i])) {
      secondIdx = i;
      break;
    }
  }
  const psalmEnd = secondIdx === -1 ? gospelIdx : secondIdx;
  readings.push(
    mkReading(
      lines[psalmIdx],
      lines.slice(psalmIdx + 1, psalmEnd),
      'Salmo Responsorial',
      ''
    )
  );
  if (secondIdx !== -1) {
    readings.push(
      mkReading(
        lines[secondIdx],
        lines.slice(secondIdx + 1, gospelIdx),
        'Segunda Lectura',
        'Palabra de Dios.'
      )
    );
  }

  readings.push(
    mkReading(
      lines[gospelIdx],
      lines.slice(gospelIdx + 1),
      'Santo Evangelio',
      'Palabra del Señor.'
    )
  );

  if (readings.length < 3) {
    throw new Error('No se pudieron extraer lecturas de Evangelizo');
  }
  return readings;
}

async function fetchVaticanReadings(date) {
  const url = buildVaticanUrl(date);
  const resp = await fetchHtml(url);
  if (!resp.ok) throw new Error('FECHA_SIN_LECTURAS');
  const html = await resp.text();
  return parseVaticanReadings(html);
}
