import auth from '@react-native-firebase/auth';
import appCheck from '@react-native-firebase/app-check';

// Headers compartidos para llamar servicios propios de Firebase (Firestore
// REST, Storage REST, Cloud Functions) desde el cliente: token de sesión de
// Firebase Auth + token de App Check (si está disponible). Usado por
// services/profile.js y services/lectionary.js.

async function getAppCheckToken() {
  try {
    const { token } = await appCheck().getToken();
    return token;
  } catch (_) {
    return null;
  }
}

export async function authHeaders(extra = {}) {
  const user = auth().currentUser;
  if (!user) throw new Error('No autenticado');
  const [authToken, acToken] = await Promise.all([user.getIdToken(), getAppCheckToken()]);
  return {
    Authorization: `Bearer ${authToken}`,
    ...(acToken ? { 'X-Firebase-AppCheck': acToken } : {}),
    ...extra,
  };
}
