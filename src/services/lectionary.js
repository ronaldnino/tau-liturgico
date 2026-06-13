const BASE = 'https://www.dominicos.org/predicacion/evangelio-del-dia';
const VATICAN_BASE = 'https://www.vaticannews.va/es/evangelio-de-hoy';

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
    .replace(/&aacute;/g, '\u00E1')
    .replace(/&Aacute;/g, '\u00C1')
    .replace(/&eacute;/g, '\u00E9')
    .replace(/&Eacute;/g, '\u00C9')
    .replace(/&iacute;/g, '\u00ED')
    .replace(/&Iacute;/g, '\u00CD')
    .replace(/&oacute;/g, '\u00F3')
    .replace(/&Oacute;/g, '\u00D3')
    .replace(/&uacute;/g, '\u00FA')
    .replace(/&Uacute;/g, '\u00DA')
    .replace(/&ntilde;/g, '\u00F1')
    .replace(/&Ntilde;/g, '\u00D1')
    .replace(/&uuml;/g, '\u00FC')
    .replace(/&Uuml;/g, '\u00DC')
    .replace(/&agrave;/g, '\u00E0')
    .replace(/&egrave;/g, '\u00E8')
    .replace(/&igrave;/g, '\u00EC')
    .replace(/&ograve;/g, '\u00F2')
    .replace(/&ugrave;/g, '\u00F9')
    .replace(/&laquo;/g, '\u00AB')
    .replace(/&raquo;/g, '\u00BB')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&iexcl;/g, '\u00A1')
    .replace(/&iquest;/g, '\u00BF')
    .replace(/&middot;/g, '\u00B7')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(str) {
  return decodeEntities(str.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim();
}

function extractRef(intro, typeLabel) {
  if (typeLabel === 'Salmo') {
    // "Salmo 4, 2-3. 4-5. 7-8 R/. Haz brillar…" → "Salmo 4, 2-3. 4-5. 7-8"
    const m = intro.match(/^(Salmo\s+[\d,\s.\-–—]+)/i);
    return m ? m[1].trim().replace(/[,.\s]+$/, '') : intro;
  }

  // Detectar si hay un número de libro en el prefacio (primer/segunda…)
  let bookNum = '';
  if (/primer[oa]?\s+(libro|carta)/i.test(intro)) bookNum = '1 ';
  else if (/segund[oa]?\s+(libro|carta)/i.test(intro)) bookNum = '2 ';
  else if (/tercer[oa]?\s+(libro|carta)/i.test(intro)) bookNum = '3 ';

  // Quitar el prefacio estándar para dejar solo "LibroNombre cap, vv"
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
    // Quitar "san/santa" antes del nombre del evangelista o autor
    .replace(/^san(ta)?\s+/i, '')
    // Epístolas paulinas: "Pablo a los/las Corintios…" → "Corintios…"
    .replace(/^Pablo\s+a\s+(los\s+|las\s+|la\s+|el\s+)?/i, '')
    .trim();

  return (bookNum + ref).trim();
}

// Devuelve null para secciones que no son lecturas (reflexiones, videos, etc.)
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

  // Split by <h2> to isolate each reading section
  const parts = block.split(/<h2>/i);
  parts.shift();

  const readings = [];

  for (const part of parts) {
    const h2Match = part.match(/^([^<]+)<\/h2>/);
    if (!h2Match) continue;

    const h3Match = part.match(/<h3>([\s\S]*?)<\/h3>/i);
    const intro = h3Match ? stripHtml(h3Match[1]) : '';

    // Collect non-empty <p> blocks
    const pMatches = [...part.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
    const paragraphs = pMatches.map((m) => stripHtml(m[1] ?? '')).filter((t) => t.length > 0);

    if (paragraphs.length === 0) continue;

    const normalized = normalizeType(h2Match[1].trim());
    if (!normalized) continue; // ignorar secciones que no son lecturas

    const { type, closing } = normalized;
    const ref = extractRef(intro, type === 'Salmo Responsorial' ? 'Salmo' : type);

    readings.push({ type, ref, intro, text: paragraphs.join('\n\n'), closing });
  }

  if (readings.length < 2) throw new Error('No se pudieron extraer las lecturas');
  return readings;
}

function parseVaticanReadings(html) {
  // Extraer bloques <section> del HTML
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

export async function fetchDailyReadings(date = new Date()) {
  const url = buildUrl(date);
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TauLiturgico/1.0)' },
  });
  if (!resp.ok) throw new Error(`Error HTTP ${resp.status} en ${url}`);
  // Si la URL final no es la de evangelio-del-dia, fue redirigida → es domingo
  if (resp.redirected || (resp.url && !resp.url.includes('/evangelio-del-dia/'))) {
    return fetchVaticanReadings(date);
  }
  const html = await resp.text();
  return parseReadings(html);
}

async function fetchVaticanReadings(date) {
  const url = buildVaticanUrl(date);
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TauLiturgico/1.0)' },
  });
  if (!resp.ok) throw new Error('FECHA_SIN_LECTURAS');
  const html = await resp.text();
  return parseVaticanReadings(html);
}
