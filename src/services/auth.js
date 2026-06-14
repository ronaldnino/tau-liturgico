import auth from '@react-native-firebase/auth';
import * as Keychain from 'react-native-keychain';
import Config from 'react-native-config';

const API_BASE = Config.API_BASE || 'https://api.tauliturgico.com/v1';
const SERVICE = 'tau_jwt';

// Guardado a nivel de módulo: Firebase devuelve un objeto confirmation
// en requestOtp que se necesita para llamar confirm() en verifyOtp.
let _confirmation = null;

const AuthService = {
  saveToken: (token) =>
    Keychain.setGenericPassword('tau_user', token, { service: SERVICE }),

  getToken: async () => {
    const creds = await Keychain.getGenericPassword({ service: SERVICE });
    return creds ? creds.password : null;
  },

  deleteToken: () => Keychain.resetGenericPassword({ service: SERVICE }),

  requestOtp: async (phone) => {
    if (__DEV__) auth().settings.appVerificationDisabledForTesting = true;
    try {
      _confirmation = await auth().signInWithPhoneNumber(phone);
      return { ok: true };
    } catch (e) {
      if (__DEV__)
        console.warn(
          '[OTP ERROR]',
          JSON.stringify({ code: e.code, msg: e.message, native: e.nativeErrorCode })
        );
      throw e;
    }
  },

  verifyOtp: async (_phone, code) => {
    if (!_confirmation) throw new Error('Primero solicitá el código OTP');
    const credential = await _confirmation.confirm(code);
    const token = await credential.user.getIdToken();
    await AuthService.saveToken(token);
    return token;
  },

  // Refresca el token desde Firebase si el usuario sigue con sesión activa.
  // Útil para llamadas a la API propia (tauliturgico.com).
  apiFetch: async (path, options = {}) => {
    const firebaseUser = auth().currentUser;
    const token = firebaseUser
      ? await firebaseUser.getIdToken()
      : await AuthService.getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (res.status === 401) {
      await AuthService.deleteToken();
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  },
};

export default AuthService;
