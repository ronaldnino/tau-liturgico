// RNFS se carga con require() lazy para no bloquear el arranque de la app
// si el módulo nativo aún no está enlazado.
const _rnfs = () => require('react-native-fs');

const BASE = 'https://api.elevenlabs.io/v1';
const _cacheDir = () => `${_rnfs().CachesDirectoryPath}/elevenlabs`;

export const DEFAULT_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9';
export const MODEL_ID = 'eleven_multilingual_v2';

export const VOICE_SETTINGS = {
  stability: 0.35,
  similarity_boost: 0.85,
  style: 0.45,
  use_speaker_boost: true,
};

function _fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h.toString(16);
}

function _buildWordTimings(text, startTimes, endTimes) {
  const words = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m.index;
    const e = m.index + m[0].length - 1;
    words.push({
      start: m.index,
      end: m.index + m[0].length,
      startSec: startTimes[Math.min(s, startTimes.length - 1)] ?? 0,
      endSec: endTimes[Math.min(e, endTimes.length - 1)] ?? 0,
    });
  }
  return words;
}

export async function synthesize(apiKey, voiceId, text) {
  if (!apiKey) throw new Error('Configura tu API key de ElevenLabs en Perfil → Voz');

  const RNFS = _rnfs();
  const CACHE_DIR = _cacheDir();
  await RNFS.mkdir(CACHE_DIR).catch(() => {});
  const cacheKey = _fnv1a(`${voiceId}:${MODEL_ID}:${text}`);
  const audioPath = `${CACHE_DIR}/${cacheKey}.mp3`;
  const metaPath = `${CACHE_DIR}/${cacheKey}.json`;

  if (await RNFS.exists(audioPath)) {
    const meta = JSON.parse(await RNFS.readFile(metaPath, 'utf8'));
    return { audioPath, words: meta.words };
  }

  const res = await fetch(`${BASE}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 120)}`);
  }

  const { audio_base64, alignment } = await res.json();
  await RNFS.writeFile(audioPath, audio_base64, 'base64');

  const words = _buildWordTimings(
    text,
    alignment.character_start_times_seconds,
    alignment.character_end_times_seconds
  );
  await RNFS.writeFile(metaPath, JSON.stringify({ words }), 'utf8');

  return { audioPath, words };
}

export async function clearTTSCache() {
  await _rnfs()
    .unlink(_cacheDir())
    .catch(() => {});
}
