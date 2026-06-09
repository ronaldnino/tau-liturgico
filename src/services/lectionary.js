const BASE = 'https://www.dominicos.org/predicacion/evangelio-del-dia';

function buildUrl(date = new Date()) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${BASE}/${d}-${m}-${y}/`;
}

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(str) {
  return decodeEntities(
    str
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  ).trim();
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
    .replace(/^Lectura de la (primera|segunda|tercera) carta del? (apóstol\s+)?san(ta)?\s*/i, '')
    .replace(/^Lectura de la carta del? (apóstol\s+)?san(ta)?\s*/i, '')
    .replace(/^Lectura de la carta a los\s*/i, '')
    .replace(/^Lectura de la carta a las\s*/i, '')
    .replace(/^Lectura del (primer[oa]?|segund[oa]?|tercer[oa]?) libro de (los\s+|las\s+)?/i, '')
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
  if (t === 'primera lectura') return { type: 'Primera Lectura', closing: 'Palabra de Dios.' };
  if (t === 'segunda lectura') return { type: 'Segunda Lectura', closing: 'Palabra de Dios.' };
  if (t === 'salmo de hoy') return { type: 'Salmo Responsorial', closing: '' };
  if (t === 'evangelio del día') return { type: 'Santo Evangelio', closing: 'Palabra del Señor.' };
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
    const paragraphs = pMatches
      .map(m => stripHtml(m[1]))
      .filter(t => t.length > 0);

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

export async function fetchDailyReadings(date = new Date()) {
  const url = buildUrl(date);
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TauLiturgico/1.0)' },
  });
  if (!resp.ok) throw new Error(`Error HTTP ${resp.status} en ${url}`);
  const html = await resp.text();
  return parseReadings(html);
}
