<<<<<<< HEAD
# tau-liturgico
=======
# τau Litúrgico — React Native

Aplicación de calendario litúrgico católico construida con React Native CLI 0.74 (sin Expo).

## Requisitos previos

- Node.js 18+
- npm 9+
- Para iOS: Xcode 15+ y CocoaPods (`brew install cocoapods`)
- Para Android: Android Studio + JDK 17, emulador API 31+

## Instalación

### 1. Dependencias JS

```bash
npm install
```

### 2. Fuentes (Cormorant Garamond)

Descarga los archivos `.ttf` desde [Google Fonts — Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
y colócalos en `assets/fonts/` con estos nombres exactos:

```
assets/fonts/
├── CormorantGaramond-Light.ttf
├── CormorantGaramond-LightItalic.ttf
├── CormorantGaramond-Regular.ttf
├── CormorantGaramond-Italic.ttf
├── CormorantGaramond-Medium.ttf
├── CormorantGaramond-MediumItalic.ttf
├── CormorantGaramond-SemiBold.ttf
└── CormorantGaramond-SemiBoldItalic.ttf
```

Luego enlaza los assets nativos:

```bash
npm run link-assets
# equivalente a: npx react-native-asset
```

### 3. Pods (iOS)

```bash
cd ios && pod install && cd ..
```

## Ejecutar

```bash
# Iniciar Metro bundler
npm start

# En otra terminal:
npm run ios       # Simulador iOS
npm run android   # Emulador Android
```

## Estructura

```
src/
├── components/       # Átomos: Tau, TauWordmark, LitDot, LitBadge, botones, Card
├── data/             # Datos estáticos: lecturas, calendario mayo 2026
├── navigation/       # AppNavigator — Stack raíz + AuthStack + BottomTabs
├── screens/
│   ├── OnboardingScreen.jsx   — 3 slides intro
│   ├── PhoneScreen.jsx        — Ingreso de teléfono + selector de país
│   ├── OtpScreen.jsx          — 6 cajas OTP + countdown 45 s
│   ├── SyncScreen.jsx         — Descarga del año litúrgico con progreso
│   ├── TodayScreen.jsx        — Pantalla principal del día
│   ├── CalendarScreen.jsx     — Grilla mensual + panel del día
│   ├── ReadingsScreen.jsx     — Lecturas con player TTS
│   ├── NotesScreen.jsx        — Tabs Notas / Marcadores
│   └── ProfileScreen.jsx      — Perfil, ajustes y cierre de sesión
├── services/
│   ├── auth.js           — OTP + JWT con react-native-keychain
│   └── notifications.js  — Recordatorio diario con @notifee/react-native
├── store/            # Zustand con persist (AsyncStorage)
└── theme/            # colors.js y typography.js
```

## Flujo de navegación

```
Onboarding  →  Auth (Phone → OTP → Sync)  →  Main
                                               ├── Hoy (τ)
                                               ├── Calendario
                                               ├── Lecturas
                                               ├── Notas
                                               └── Perfil
```

## Dependencias clave y sus reemplazos de Expo

| Expo                         | Pure RN                          |
|------------------------------|----------------------------------|
| `expo-secure-store`          | `react-native-keychain`          |
| `expo-notifications`         | `@notifee/react-native`          |
| `@expo-google-fonts/*`       | Fuentes en `assets/fonts/` + `react-native-asset` |
| `expo-font` / `useFonts`     | Linking nativo via `react-native.config.js` |
| `expo-splash-screen`         | Config nativa Xcode / Android Studio |
| `expo-status-bar`            | `StatusBar` de `react-native`    |
| `babel-preset-expo`          | `@react-native/babel-preset`     |

## Notas de implementación

- El símbolo **τ** es `U+03C4` renderizado con Cormorant Garamond en `react-native-svg`.
- En modo desarrollo (`__DEV__`), `auth.js` simula OTP sin red real.
- JWT se almacena en Keychain (iOS) / Keystore (Android) via `react-native-keychain`.
- Los nombres de fuentes usan PostScript: `CormorantGaramond-SemiBoldItalic`, etc.

## Variables de entorno

```
API_BASE = https://api.tauliturgico.com/v1  (hardcoded en src/services/auth.js)
```
>>>>>>> bf17710 (chore: initial commit — τau Litúrgico base)
