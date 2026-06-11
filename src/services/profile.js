import auth from '@react-native-firebase/auth';

const PROJECT_ID = 'taoliturgico';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getToken() {
  const user = auth().currentUser;
  if (!user) throw new Error('No autenticado');
  return user.getIdToken();
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
  const token = await user.getIdToken();
  const fields = toFirestoreFields({
    ...data,
    uid: user.uid,
    phone: user.phoneNumber ?? '',
    updatedAt: new Date().toISOString(),
  });
  const res = await fetch(
    `${FIRESTORE_BASE}/users/${user.uid}?updateMask.fieldPaths=${Object.keys(fields).join('&updateMask.fieldPaths=')}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore ${res.status}: ${body}`);
  }
}

export async function getProfile() {
  const user = auth().currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  const res = await fetch(`${FIRESTORE_BASE}/users/${user.uid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore error ${res.status}`);
  const json = await res.json();
  return fromFirestoreFields(json.fields);
}

const STORAGE_BUCKET = 'taoliturgico.firebasestorage.app';

export async function uploadProfilePhoto(localUri) {
  const user = auth().currentUser;
  if (!user) throw new Error('No autenticado');
  const token = await user.getIdToken();

  const objectPath = `profile_photos/${user.uid}/profile.jpg`;
  const encodedPath = encodeURIComponent(objectPath);
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?uploadType=media&name=${encodedPath}`;

  // fetch() de React Native puede leer URIs file:// como blob
  const fileRes = await fetch(localUri);
  if (!fileRes.ok) throw new Error('No se pudo leer el archivo de imagen');
  const blob = await fileRes.blob();

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/jpeg',
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(`Storage ${uploadRes.status}: ${body}`);
  }

  const json = await uploadRes.json();
  const downloadToken = json.downloadTokens;
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;
}
