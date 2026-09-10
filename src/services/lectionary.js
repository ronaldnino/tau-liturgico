import Config from 'react-native-config';
import { isSolemnity, isEasterVigil } from '../data/liturgical';
import { authHeaders } from './firebaseAuth';

// El scraping (dominicos → Evangelizo → Vatican News) ya no corre en el
// cliente: vive en la Cloud Function `getReadings` (functions/src/lectionary.js),
// que además cachea el resultado en Firestore para todos los usuarios. Ver
// docs/LECTURAS.md para la arquitectura completa y la regla litúrgica.
const REGION = 'us-central1';
const FUNCTIONS_BASE = `https://${REGION}-${Config.FIREBASE_PROJECT_ID}.cloudfunctions.net`;

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchDailyReadings(date = new Date()) {
  // La Vigilia Pascual no tiene página propia en ninguna fuente: dominicos la
  // redirige como un domingo y Vatican News sirve las lecturas del Sábado
  // Santo diurno (una liturgia distinta) bajo la misma URL de fecha. Se corta
  // acá para no gastar una llamada a la función en un día que siempre falla.
  if (isEasterVigil(date)) throw new Error('VIGILIA_PASCUAL_NO_SOPORTADA');

  const headers = await authHeaders();
  const res = await fetch(`${FUNCTIONS_BASE}/getReadings?date=${toISODate(date)}`, {
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API_ERROR_${res.status}`);
  }
  return res.json();
}

// Orden litúrgico de proclamación. La 2ª lectura solo está en domingos y
// solemnidades; el resto de días tiene 3 lecturas (1ª, Salmo, Evangelio).
const CANONICAL_ORDER = [
  'Primera Lectura',
  'Salmo Responsorial',
  'Segunda Lectura',
  'Santo Evangelio',
];

// Devuelve SIEMPRE las ranuras que corresponden al día según la regla litúrgica,
// emparejando cada una con lo que se descargó. Las que falten se marcan
// `unavailable` (la UI muestra "Contenido no disponible") en vez de desaparecer.
// `date` decide si se espera 2ª lectura: domingo, solemnidad, o que ya haya
// venido una 2ª en los datos (cubre fuentes que la traen sin el salmo).
export function buildCanonicalReadings(rawReadings, date = new Date()) {
  const raw = Array.isArray(rawReadings) ? rawReadings : [];
  const hasSecondData = raw.some((r) => r.type === 'Segunda Lectura');
  const expectsSecond = date.getDay() === 0 || isSolemnity(date) || hasSecondData;
  return CANONICAL_ORDER.filter(
    (type) => type !== 'Segunda Lectura' || expectsSecond
  ).map(
    (type) =>
      raw.find((r) => r.type === type) ?? {
        type,
        ref: '',
        intro: '',
        text: '',
        closing: '',
        unavailable: true,
      }
  );
}

// Resuelve qué lectura abrir a partir de los parámetros de navegación, contra la
// lista de lecturas REAL del día. Ancla por TIPO (`readingType`), dinámico según
// el día —el índice varía si el día tiene 3 ó 4 lecturas—, así el enlace nunca
// apunta a la lectura equivocada. Si el tipo no está, cae al índice numérico
// acotado y, por último, a la primera. Nunca devuelve un índice fuera de rango.
export function resolveReadingIndex(list, params) {
  if (!Array.isArray(list) || list.length === 0) return 0;
  if (params?.readingType) {
    const i = list.findIndex((r) => r.type === params.readingType);
    if (i >= 0) return i;
  }
  if (typeof params?.reading === 'number') {
    return Math.min(Math.max(0, params.reading), list.length - 1);
  }
  return 0;
}
