import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { ensureCameraPermission } from '../utils/permissions';
import { Colors, Spacing, Typography } from '../theme';

const { TextStyles } = Typography;
import { useSettingsStore, useProfileStore } from '../store';
import { saveProfile, uploadProfilePhoto } from '../services/profile';

// ── Iconos ────────────────────────────────────────────────────
function IcoCamera({ c = '#fff', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={c} strokeWidth={1.8} />
    </Svg>
  );
}

function IcoUser({ c, size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={1.6} />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Pantalla ──────────────────────────────────────────────────
export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const { setProfile } = useProfileStore();

  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');
  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('');
  const [diocese, setDiocesis] = useState('');
  const [parish, setParish] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickPhoto = useCallback(() => {
    const imgOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 512,
      maxHeight: 512,
    };

    const handleCameraResult = (res) => {
      if (res.errorCode === 'camera_unavailable') {
        Alert.alert(
          'Cámara no disponible',
          'La cámara no está disponible en este dispositivo. Usa la galería para elegir una foto.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (res.errorCode === 'permission') {
        Alert.alert(
          'Permiso denegado',
          'Ve a Configuración y permite acceso a la cámara para tomar una foto.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (!res.didCancel && !res.errorCode && res.assets?.[0]?.uri) {
        setPhotoUri(res.assets[0].uri);
      }
    };

    const handleGalleryResult = (res) => {
      if (!res.didCancel && !res.errorCode && res.assets?.[0]?.uri) {
        setPhotoUri(res.assets[0].uri);
      }
    };

    const openCamera = async () => {
      const granted = await ensureCameraPermission();
      if (!granted) {
        Alert.alert(
          'Permiso de cámara',
          'Habilita el acceso a la cámara en Configuración para tomar una foto, o usa la galería.'
        );
        return;
      }
      try {
        launchCamera(imgOptions, handleCameraResult);
      } catch (_) {
        Alert.alert('Cámara no disponible', 'Usa la galería para seleccionar una foto.', [
          { text: 'OK' },
        ]);
      }
    };

    const openGallery = () => {
      try {
        launchImageLibrary(imgOptions, handleGalleryResult);
      } catch (_) {
        Alert.alert('Error', 'No se pudo abrir la galería. Intenta de nuevo.');
      }
    };

    Alert.alert('Foto de perfil', '¿Cómo deseas agregar tu foto?', [
      { text: 'Cámara', onPress: openCamera },
      { text: 'Galería', onPress: openGallery },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre para continuar.');
      return;
    }
    setSaving(true);
    try {
      let photoURL = '';
      if (photoUri) {
        try {
          const uri = Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri;
          photoURL = await uploadProfilePhoto(uri);
        } catch (_) {
          // Upload falló — guardamos el perfil sin foto
        }
      }
      const profileData = {
        displayName: displayName.trim(),
        country: country.trim(),
        diocese: diocese.trim(),
        parish: parish.trim(),
        photoURL,
      };
      await saveProfile(profileData);
      setProfile(profileData);
    } catch (e) {
      Alert.alert(
        'Error al guardar',
        e.message ?? 'No se pudo guardar tu perfil. Verifica tu conexión.'
      );
    } finally {
      setSaving(false);
    }
  }, [displayName, country, diocese, parish, photoUri, setProfile]);

  const handleSkip = useCallback(() => {
    setProfile({ displayName: '', country: '', diocese: '', parish: '', photoURL: '' });
  }, [setProfile]);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={[
        s.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[s.eyebrow, { color: Colors.brand.primary }]}>
        REGISTRO DE FELIGRÉS
      </Text>
      <Text style={[s.title, { color: ink }]}>Completa tu perfil</Text>
      <Text style={[s.subtitle, { color: muted }]}>
        Tu información ayuda a la comunidad a reconocerte dentro de la parroquia.
      </Text>

      {/* Avatar */}
      <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={s.avatarWrap}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={[s.avatar, { borderColor: Colors.brand.primary + '40' }]}
          />
        ) : (
          <View
            style={[
              s.avatarPlaceholder,
              {
                backgroundColor: Colors.brand.primary + '12',
                borderColor: Colors.brand.primary + '30',
              },
            ]}
          >
            <IcoUser c={Colors.brand.primary + '80'} size={44} />
          </View>
        )}
        <View
          style={[
            s.cameraBadge,
            { backgroundColor: Colors.brand.primary, borderColor: surface },
          ]}
        >
          <IcoCamera c="#fff" size={14} />
        </View>
      </TouchableOpacity>
      <Text style={[s.photoHint, { color: muted }]}>Toca para agregar foto</Text>

      {/* Formulario */}
      <View style={s.form}>
        <Field
          label="Nombre completo *"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Tu nombre"
          surface={surface}
          ink={ink}
          muted={muted}
          border={border}
        />
        <Field
          label="País"
          value={country}
          onChangeText={setCountry}
          placeholder="Guatemala, México, España…"
          surface={surface}
          ink={ink}
          muted={muted}
          border={border}
        />
        <Field
          label="Diócesis"
          value={diocese}
          onChangeText={setDiocesis}
          placeholder="Nombre de tu diócesis"
          surface={surface}
          ink={ink}
          muted={muted}
          border={border}
        />
        <Field
          label="Parroquia"
          value={parish}
          onChangeText={setParish}
          placeholder="Nombre de tu parroquia"
          surface={surface}
          ink={ink}
          muted={muted}
          border={border}
        />
      </View>

      {/* Botón guardar */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
        style={[s.saveBtn, saving && s.saveBtnSaving]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.saveBtnText}>Guardar perfil</Text>
        )}
      </TouchableOpacity>

      {/* Saltar */}
      <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={s.skipBtn}>
        <Text style={[s.skipText, { color: muted }]}>Saltar por ahora</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder, surface, ink, muted, border }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, { color: muted }]}>{label}</Text>
      <View style={[s.fieldBox, { backgroundColor: surface, borderColor: border }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={muted}
          style={[s.fieldInput, { color: ink }]}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: Spacing[5] },

  eyebrow: {
    ...TextStyles.eyebrow,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: Spacing[3],
  },

  avatarWrap: { alignSelf: 'center', marginBottom: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  photoHint: { textAlign: 'center', fontSize: 12, marginBottom: 28 },

  form: { gap: 16, marginBottom: 28 },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    ...TextStyles.eyebrow,
    marginLeft: 2,
  },
  fieldBox: {
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  fieldInput: { fontSize: 15, paddingVertical: 12 },

  saveBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: Colors.brand.primary,
  },
  saveBtnSaving: { opacity: 0.7 },
  saveBtnText: { ...TextStyles.button, color: '#fff' },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14 },
});
