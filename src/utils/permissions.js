import { Platform, PermissionsAndroid } from 'react-native';

// react-native-image-picker exige que, si CAMERA está declarado en el
// AndroidManifest (lo está), el permiso se solicite en runtime ANTES de llamar
// a launchCamera; de lo contrario la cámara no se abre. En iOS el picker gestiona
// el permiso mediante NSCameraUsageDescription del Info.plist.
export async function ensureCameraPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Permiso de cámara',
        message:
          'Tau Litúrgico necesita acceder a la cámara para tomar tu foto de perfil.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (_) {
    return false;
  }
}
