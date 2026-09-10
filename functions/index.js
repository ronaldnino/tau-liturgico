import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchDailyReadings } from './src/lectionary.js';
import { isEasterVigil } from './src/liturgical.js';

initializeApp();
// Región alineada con la recomendación de docs/FIREBASE_SETUP.md para
// Firestore/Storage. Si el proyecto usa otra región, cambiar aquí antes de
// desplegar (ver docs/FIREBASE_SETUP.md § Cloud Functions).
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Rango esperado de lecturas por día (ver ReadingsScreen.jsx `badCount`):
// ferias/memorias/fiestas = 3 (1ª + Salmo + Evangelio); domingos/solemnidades
// = 4 (+ 2ª lectura). Fuera de rango, la fuente entregó algo incompleto — no
// se cachea, para que el siguiente intento vuelva a scrapear en vez de
// quedar pegado con un resultado malo para siempre.
function isCacheable(readings) {
  return Array.isArray(readings) && readings.length >= 3 && readings.length <= 4;
}

export const getReadings = onRequest({ timeoutSeconds: 30 }, async (req, res) => {
  try {
    const authHeader = req.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    try {
      await getAuth().verifyIdToken(idToken);
    } catch (_) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const dateParam = req.query.date;
    if (typeof dateParam !== 'string' || !DATE_RE.test(dateParam)) {
      res.status(400).json({ error: 'FECHA_INVALIDA' });
      return;
    }
    const [y, m, d] = dateParam.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (isEasterVigil(date)) {
      res.status(404).json({ error: 'VIGILIA_PASCUAL_NO_SOPORTADA' });
      return;
    }

    const db = getFirestore();
    const docRef = db.collection('readings').doc(dateParam);
    const cached = await docRef.get();
    if (cached.exists) {
      res.status(200).json(cached.data().readings);
      return;
    }

    const readings = await fetchDailyReadings(date);
    if (isCacheable(readings)) {
      await docRef.set({ readings, fetchedAt: new Date().toISOString() });
    }
    res.status(200).json(readings);
  } catch (e) {
    if (e.message === 'FECHA_SIN_LECTURAS') {
      res.status(404).json({ error: 'FECHA_SIN_LECTURAS' });
      return;
    }
    logger.error('[getReadings]', e);
    res.status(502).json({ error: 'FETCH_FAILED' });
  }
});
