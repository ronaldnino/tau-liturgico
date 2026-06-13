import auth from '@react-native-firebase/auth';
import appCheck from '@react-native-firebase/app-check';
import Config from 'react-native-config';

const PROJECT_ID = Config.FIREBASE_PROJECT_ID || 'taoliturgico';
const STORAGE_BUCKET = Config.FIREBASE_STORAGE_BUCKET || 'taoliturgico.firebasestorage.app';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getToken() {
  const user = auth().currentUser;
  if (!user) throw new Error('No autenticado');
  return user.getIdToken();
}

async function getAppCheckToken() {
  try {
    const { token } = await appCheck().getToken();
    return token;
  } catch (_) {
    return null;
  }
}

async function authHeaders(extra = {}) {
  const user = auth().currentUser;
  if (!user) throw new Error('No autenticado');
  const [authToken, acToken] = await Promise.all([user.getIdToken(), getAppCheckToken()]);
  return {
    Authorization: `Bearer ${authToken}`,
    ...(acToken ? { 'X-Firebase-AppCheck': acToken } : {}),
    ...extra,
  };
}

function toFirestoreFields(data) {
  const fields = {};
  Object.entries(data).forEach(([k, v]) => {
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (v == null) fields[k] = { nullValue: null };
  });
  return fields;
}

function fromFirestoreFields(fields = {}) {
  const out = {};
  Object.entries(fields).forEach(([k, v]) => {
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('integerValue' in v) out[k] = Number(v.integerValue);
    else if ('booleanValue' in v) out[k] = v.booleanValue;
    else out[k] = null;
  });
  return out;
}

export async function saveProfile(data) {
  const user = auth().currentUser;
  if (!user) throw new Error('No autenticado');
  const fields = toFirestoreFields({
    ...data,
    uid: user.uid,
    phone: user.phoneNumber ?? '',
    updatedAt: new Date().toISOString(),
  });
  const headers = await authHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(
    `${FIRESTORE_BASE}/users/${user.uid}?updateMask.fieldPaths=${Object.keys(fields).join('&updateMask.fieldPaths=')}`,
    { method: 'PATCH', headers, body: JSON.stringify({ fields }) }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore ${res.status}: ${body}`);
  }
}

export async function getProfile() {
  const user = auth().currentUser;
  if (!user) return null;
  const headers = await authHeaders();
  const res = await fetch(`${FIRESTORE_BASE}/users/${user.uid}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore error ${res.status}`);
  const json = await res.json();
  if (!json.fields) return null;
  return fromFirestoreFields(json.fields);
}

export async function uploadProfilePhoto(localUri) {
  const user = auth().currentUser;
  if (!user) throw new Error('No autenticado');

  const objectPath = `profile_photos/${user.uid}/profile.jpg`;
  const encodedPath = encodeURIComponent(objectPath);
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?uploadType=media&name=${encodedPath}`;

  const fileRes = await fetch(localUri);
  if (!fileRes.ok) throw new Error('No se pudo leer el archivo de imagen');
  const blob = await fileRes.blob();

  const headers = await authHeaders({ 'Content-Type': 'image/jpeg' });
  const uploadRes = await fetch(uploadUrl, { method: 'POST', headers, body: blob });

  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(`Storage ${uploadRes.status}: ${body}`);
  }

  const json = await uploadRes.json();
  const downloadToken = json.downloadTokens;
  if (!downloadToken) throw new Error('Storage: no se obtuvo token de descarga');
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;
}
