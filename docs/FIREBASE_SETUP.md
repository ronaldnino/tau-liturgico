# Configuración de Firebase — Ambientes Dev y Prod

Esta guía detalla todos los pasos necesarios para configurar los proyectos Firebase de desarrollo y producción, tanto en la consola de Firebase como en el código de la app.

---

## Tabla de contenidos

1. [Estructura de ambientes](#1-estructura-de-ambientes)
2. [Firebase Console — Proyecto Dev](#2-firebase-console--proyecto-dev)
3. [Firebase Console — Proyecto Prod](#3-firebase-console--proyecto-prod)
4. [Configuración local](#4-configuración-local)
5. [Configuración iOS](#5-configuración-ios)
6. [Configuración Android](#6-configuración-android)
7. [App Check](#7-app-check)
8. [Cambiar de ambiente](#8-cambiar-de-ambiente)
9. [Build de producción Android](#9-build-de-producción-android)

---

## 1. Estructura de ambientes

El proyecto usa dos proyectos Firebase separados:

| Ambiente | Proyecto Firebase | Uso |
|---|---|---|
| **Dev** | `tau-liturgico-dev` | Desarrollo y pruebas locales |
| **Prod** | `taoliturgico` | Usuarios reales en producción |

Los archivos de configuración sensibles **nunca se suben al repositorio** (están en `.gitignore`):

```
config/
├── dev/
│   ├── GoogleService-Info.plist   ← iOS dev
│   └── google-services.json       ← Android dev
└── prod/
    ├── GoogleService-Info.plist   ← iOS prod
    └── google-services.json       ← Android prod
```

---

## 2. Firebase Console — Proyecto Dev

### 2.1 Crear el proyecto

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. **Agregar proyecto** → nombre: `Tau Liturgico DEV`
3. Desactivar Google Analytics si no se requiere
4. Crear proyecto

### 2.2 Registrar la app iOS

1. ⚙️ **Configuración del proyecto → Agregar app → iOS**
2. Bundle ID: `org.tauliturgico`
3. Descargar `GoogleService-Info.plist`
4. Copiar a:
   - `ios/TauLiturgico/GoogleService-Info.plist`
   - `config/dev/GoogleService-Info.plist`

### 2.3 Registrar la app Android

1. ⚙️ **Configuración del proyecto → Agregar app → Android**
2. Package name: `org.tauliturgico`
3. Agregar huellas digitales del **debug keystore** (ver sección [6.1](#61-huellas-digitales)):
   - SHA-1 del debug keystore
   - SHA-256 del debug keystore
4. Descargar `google-services.json` **después de agregar las huellas**
5. Copiar a:
   - `android/app/google-services.json`
   - `config/dev/google-services.json`

> ⚠️ Si agregas huellas después de descargar el archivo, descárgalo nuevamente — las huellas quedan embebidas en el JSON.

### 2.4 Habilitar Phone Authentication

1. **Authentication → Sign-in method → Teléfono → Habilitar → Guardar**

### 2.5 Habilitar región Venezuela para SMS

1. **Authentication → Settings → SMS region policy**
2. Seleccionar **"Permitir solo las regiones siguientes"** (o equivalente)
3. Agregar **Venezuela (+58)**
4. Guardar

> Sin este paso, los números venezolanos reciben el error `OPERATION_NOT_ALLOWED` al intentar enviar SMS.

### 2.6 Agregar número de prueba (para simulador/emulador)

1. **Authentication → Sign-in method → Teléfono** (expandir proveedor)
2. Sección **"Números de teléfono para pruebas"**
3. Agregar número en formato E.164: `+58XXXXXXXXXX`
4. Asignar un código de verificación fijo (ej. `123456`)
5. Guardar

Con esto el simulador puede completar el flujo OTP sin recibir SMS real.

### 2.7 Habilitar Firestore

1. **Firestore Database → Crear base de datos**
2. Seleccionar **Modo de prueba** (permite lectura/escritura por 30 días)
3. Elegir región (recomendado: `us-central1` o la más cercana)

> Antes de los 30 días, actualizar las reglas de seguridad para requerir autenticación (ver sección [3.4](#34-reglas-de-seguridad-firestore)).

### 2.8 Habilitar Storage

1. **Storage → Comenzar**
2. Seleccionar **Modo de prueba**
3. Confirmar región

### 2.9 Configurar App Check (monitoreo)

Ver sección completa [7. App Check](#7-app-check).

---

## 3. Firebase Console — Proyecto Prod

### 3.1 Registrar la app iOS (si no existe)

1. ⚙️ **Configuración del proyecto → Agregar app → iOS**
2. Bundle ID: `org.tauliturgico`
3. Descargar `GoogleService-Info.plist`
4. Copiar a `config/prod/GoogleService-Info.plist`

### 3.2 Registrar la app Android

1. ⚙️ **Configuración del proyecto → Agregar app → Android**
2. Package name: `org.tauliturgico`
3. Agregar huellas digitales del **release keystore** (ver sección [6.1](#61-huellas-digitales)):
   - SHA-1 del release keystore
   - SHA-256 del release keystore
4. Descargar `google-services.json` **después de agregar las huellas**
5. Copiar a `config/prod/google-services.json`

### 3.3 Habilitar servicios

Repetir los pasos **2.4 y 2.5** (Phone Auth + región Venezuela).

Para Storage y Firestore, usar reglas de producción en lugar de modo prueba.

### 3.4 Reglas de seguridad Firestore

En **Firestore → Reglas**, reemplazar las reglas de prueba con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3.5 Reglas de seguridad Storage

En **Storage → Reglas**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 3.6 Configurar App Check (cumplimiento)

Ver sección [7. App Check](#7-app-check).

---

## 4. Configuración local

### 4.1 Archivos de entorno

**`.env.dev`** — variables del ambiente de desarrollo:
```
ENV=development
FIREBASE_PROJECT_ID=<project-id-dev>
FIREBASE_STORAGE_BUCKET=<project-id-dev>.firebasestorage.app
API_BASE=https://dev-api.tauliturgico.com/v1
```

**`.env.prod`** — variables del ambiente de producción:
```
ENV=production
FIREBASE_PROJECT_ID=<project-id-prod>
FIREBASE_STORAGE_BUCKET=<project-id-prod>.firebasestorage.app
API_BASE=https://api.tauliturgico.com/v1
```

> ⚠️ Reemplazar `<project-id-dev>` y `<project-id-prod>` con los IDs reales de cada proyecto.

### 4.2 Script para cambiar de ambiente

```bash
# Activar ambiente dev
npm run env:dev

# Activar ambiente prod
npm run env:prod
```

Este script copia automáticamente:
- `.env.{env}` → `.env`
- `config/{env}/GoogleService-Info.plist` → `ios/TauLiturgico/GoogleService-Info.plist`
- `config/{env}/google-services.json` → `android/app/google-services.json`

> ⚠️ Después de cambiar de ambiente se requiere un **rebuild nativo completo** (ver [sección 8](#8-cambiar-de-ambiente)).

---

## 5. Configuración iOS

### 5.1 URL Schemes en Info.plist

Firebase Phone Auth en iOS requiere un URL scheme para el flujo reCAPTCHA. El scheme se deriva del `GOOGLE_APP_ID` del `GoogleService-Info.plist` con el formato:

```
app-1-{PROJECT_NUMBER}-ios-{APP_ID}
```

En `ios/TauLiturgico/Info.plist` deben estar registrados los schemes de **ambos** proyectos:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>app-1-{PROJECT_NUMBER_PROD}-ios-{APP_ID_PROD}</string>
      <string>app-1-{PROJECT_NUMBER_DEV}-ios-{APP_ID_DEV}</string>
    </array>
  </dict>
</array>
```

El valor exacto de cada scheme se encuentra en el `GoogleService-Info.plist` de cada proyecto, en la clave `REVERSED_CLIENT_ID`, o se puede construir desde `GOOGLE_APP_ID` reemplazando `:` por `-` y prefijando con `app-`.

### 5.2 App Check debug provider en AppDelegate

Para que App Check funcione en el simulador de iOS, se configuró el debug provider nativo en `ios/TauLiturgico/AppDelegate.mm`:

```objc
#import <FirebaseAppCheck/FirebaseAppCheck.h>

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if DEBUG
  [FIRAppCheck setAppCheckProviderFactory:[FIRAppCheckDebugProviderFactory new]];
#endif
  [FIRApp configure];
  // ...
}
```

> En builds de Release, este bloque no se compila — se usa AppAttest automáticamente.

### 5.3 FirebaseAppCheckDebugEnabled en Info.plist

```xml
<key>FirebaseAppCheckDebugEnabled</key>
<true/>
```

---

## 6. Configuración Android

### 6.1 Huellas digitales

Firebase usa las huellas para verificar la identidad de la APK.

**Obtener huella del debug keystore:**
```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android -keypass android
```

**Obtener huella del release keystore:**
```bash
keytool -list -v \
  -keystore ~/keystores/tau-release.keystore \
  -alias tau-release
```

| Proyecto | Keystore | Huella |
|---|---|---|
| Dev | Debug | SHA-1 y SHA-256 del debug keystore |
| Prod | Release | SHA-1 y SHA-256 del release keystore |

> Guardar las huellas en un lugar seguro fuera del repositorio.

### 6.2 Release keystore

El keystore de producción está en `~/keystores/tau-release.keystore` (fuera del repositorio). Las credenciales están en `~/.gradle/gradle.properties`:

```properties
TAU_RELEASE_STORE_FILE=/Users/<usuario>/keystores/tau-release.keystore
TAU_RELEASE_KEY_ALIAS=tau-release
TAU_RELEASE_STORE_PASSWORD=<contraseña>
TAU_RELEASE_KEY_PASSWORD=<contraseña>
```

> ⚠️ Este archivo **nunca** debe subirse al repositorio.

---

## 7. App Check

App Check protege los recursos de Firebase contra uso no autorizado.

### 7.1 Registrar la app iOS en App Check

1. Firebase Console → **App Check → Apps**
2. Seleccionar la app iOS
3. Proveedor: **App Attest** (producción) / **Debug** (desarrollo)

### 7.2 Obtener y registrar el debug token iOS

El debug token se genera automáticamente al correr la app en simulador con el debug provider activo. Aparece en los logs del sistema al iniciar la app:

```
[AppCheckCore][I-GAC004001] App Check debug token: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
```

Para capturarlo:
```bash
xcrun simctl spawn booted log show \
  --predicate 'process == "TauLiturgico"' \
  --last 60m | grep "debug token"
```

Una vez obtenido, registrarlo en Firebase Console:
1. **App Check → Apps → app iOS → Administrar tokens de depuración**
2. Agregar el token UUID

### 7.3 Modo de cumplimiento por servicio

| Servicio | Dev | Prod |
|---|---|---|
| Authentication | Supervisión | Supervisión / Aplicado |
| Firestore | No configurado | Supervisión / Aplicado |
| Storage | No configurado | Supervisión / Aplicado |

> Activar "Aplicado" solo cuando la app esté estable en producción.

---

## 8. Cambiar de ambiente

### Pasos completos para cambiar de ambiente

```bash
# 1. Activar el ambiente
npm run env:dev   # o npm run env:prod

# 2. Eliminar objeto cacheado de react-native-config
rm -f ~/Library/Developer/Xcode/DerivedData/TauLiturgico-*/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/react-native-config.build/Objects-normal/arm64/GeneratedDotEnv.o

# 3. Rebuild iOS
npx react-native run-ios

# 4. Rebuild Android
npx react-native run-android
```

> El paso 2 es necesario porque `react-native-config` cachea las variables de entorno en un objeto compilado. Sin eliminarlo, el build incremental reutiliza los valores del ambiente anterior.

---

## 9. Build de producción Android

```bash
# 1. Activar ambiente prod
npm run env:prod

# 2. Generar APK release
cd android && ./gradlew assembleRelease

# APK generado en:
# android/app/build/outputs/apk/release/app-release.apk
```

El build firmará automáticamente con el release keystore configurado en `~/.gradle/gradle.properties`.

---

## Notas adicionales

- El `onAuthStateChanged` en `AppNavigator` detecta cuando Firebase no tiene sesión activa y limpia el estado de Zustand automáticamente. Esto es especialmente útil al cambiar de ambiente.
- Los tokens JWT del usuario se almacenan en el **iOS Keychain / Android Keystore** mediante `react-native-keychain`, no en AsyncStorage.
- El archivo `.env` activo siempre refleja el ambiente actual. El script `set-env.js` es la única forma correcta de cambiarlo.
