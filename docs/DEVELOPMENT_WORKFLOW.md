# Flujo de trabajo diario — iOS y Android

Guía para iniciar y cerrar el ambiente de desarrollo correctamente.

---

## Inicio de sesión de trabajo

### Paso 1 — Verificar el ambiente activo

```bash
cat .env
```

Confirma que `ENV=development` y que el `FIREBASE_PROJECT_ID` corresponde al proyecto que vas a usar. Si necesitas cambiar de ambiente:

```bash
# Activar dev
npm run env:dev

# Activar prod
npm run env:prod
```

> ⚠️ Si cambiaste de ambiente, debes hacer un **rebuild nativo completo** antes de correr la app (ver sección [Cambio de ambiente](#cambio-de-ambiente-rebuild-requerido)).

---

### Paso 2 — Iniciar Metro bundler

Metro es el servidor que empaqueta el JavaScript y lo envía a la app. Debe estar corriendo siempre que trabajes.

Antes de iniciarlo, verifica que no haya una instancia previa corriendo en el puerto 8081:

```bash
lsof -i :8081
```

Si hay output, Metro ya está corriendo — no lances otro. Si la terminal original se perdió y necesitas detenerlo: `kill -9 $(lsof -ti :8081)`.

Abre una terminal dedicada para Metro y déjala abierta toda la sesión:

```bash
npm start
```

Espera hasta que veas:

```
Metro waiting on exp://...
 › Press a │ open Android
 › Press i │ open iOS
```

---

### Paso 3A — Correr en iOS

Con Metro ya corriendo, abre **otra terminal**:

```bash
npm run ios
```

Esto compila la app, la instala en el simulador y la lanza. La primera vez tarda varios minutos. Las siguientes veces es más rápido porque Xcode usa el caché incremental.

**Simulador específico:**
```bash
npx react-native run-ios --simulator "iPhone 16"
```

**Ver lista de simuladores disponibles:**
```bash
xcrun simctl list devices available
```

---

### Paso 3B — Correr en Android

#### Primero: iniciar el emulador

Desde Android Studio:
1. Abrir **Android Studio → Device Manager**
2. Hacer clic en ▶️ junto al dispositivo virtual

O desde terminal:
```bash
# Ver emuladores disponibles
emulator -list-avds

# Iniciar un emulador
emulator -avd <nombre-del-avd>
```

Esperar hasta que el emulador esté completamente iniciado (se ve el homescreen de Android).

#### Luego: correr la app

Con Metro y el emulador corriendo, en otra terminal:

```bash
npm run android
```

---

### Paso 3C — Correr en un iPhone físico (device)

Datos del proyecto: workspace `ios/TauLiturgico.xcworkspace` · bundle ID `org.tauliturgico`.

#### Primera vez: preparar el iPhone
1. Conéctalo al Mac por cable.
2. En el iPhone toca **Confiar (Trust)** cuando pregunte por el ordenador.
3. Activa el **Modo de desarrollador**: Ajustes → **Privacidad y seguridad** → **Modo de desarrollador** → ON → reiniciar. *(Obligatorio desde iOS 16.)*

#### Configurar la firma (Signing) en Xcode
```bash
open ios/TauLiturgico.xcworkspace
```
En Xcode: proyecto **TauLiturgico** → target **TauLiturgico** → **Signing & Capabilities**:
- Marca **Automatically manage signing**.
- En **Team** elige tu cuenta (Add an Account… con tu Apple ID si no aparece).
  - **Apple ID gratuito:** funciona, pero la app caduca a los **7 días** y no soporta Push.
  - **Apple Developer de pago:** válida **1 año** y soporta Push (necesario para que el OTP de Firebase funcione del todo en iOS).
- Si `org.tauliturgico` ya está registrado en otra cuenta, usa la cuenta dueña del ID o cambia el bundle ID temporalmente (ej. `org.tauliturgico.dev`).

#### Correr
1. Inicia Metro: `npm start`
2. En Xcode selecciona tu iPhone como destino y pulsa **▶ Run** (`Cmd + R`).
   - Alternativa CLI: `npm run ios -- --device "Nombre del iPhone"`
3. **Solo Apple ID gratuito** — si aparece "Untrusted Developer": iPhone → Ajustes → **General** → **VPN y gestión de dispositivos** → tu perfil → **Confiar**.

> Para que arranque **sin cable ni Metro**, compila en **Release** (Xcode → *Product → Scheme → Edit Scheme → Run → Build Configuration: Release*). Para el día a día, Debug con Metro es lo normal.
>
> Si falla por Pods: `cd ios && pod install`.

---

## Durante el desarrollo

### Hot reload

Los cambios en archivos JavaScript/JSX se aplican automáticamente en la app sin rebuild. Si el hot reload no se activa:

- **iOS Simulator:** `Cmd + R` para recargar manualmente
- **Android Emulator:** doble tap en `R` o agitar el dispositivo → **Reload**

### Menú de desarrollador

- **iOS Simulator:** `Cmd + D`
- **Android Emulator:** `Cmd + M` (Mac) o agitar el dispositivo

---

## Cierre de sesión de trabajo

### 1. Detener Metro

En la terminal donde corre Metro presiona:

```
Ctrl + C
```

### 2. Cerrar el simulador iOS

```bash
# Opción A: desde el simulador
Cmd + Q

# Opción B: desde terminal
xcrun simctl shutdown booted
```

### 3. Cerrar el emulador Android

Cierra la ventana del emulador directamente, o desde terminal:

```bash
adb emu kill
```

---

## Cambio de ambiente (rebuild requerido)

Cada vez que cambies de ambiente, las variables de entorno quedan compiladas en el binario nativo. Un simple hot reload **no** es suficiente — se necesita rebuild.

```bash
# 1. Cambiar ambiente
npm run env:dev   # o npm run env:prod

# 2. Limpiar caché de react-native-config (iOS)
rm -f ~/Library/Developer/Xcode/DerivedData/TauLiturgico-*/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/react-native-config.build/Objects-normal/arm64/GeneratedDotEnv.o

# 3. Correr la app (rebuild automático)
npm run ios      # para iOS
npm run android  # para Android
```

---

## Referencia rápida

### Ambiente

| Acción | Comando |
|---|---|
| Ver ambiente activo | `cat .env` |
| Cambiar a dev | `npm run env:dev` |
| Cambiar a prod | `npm run env:prod` |

### Metro

| Acción | Comando |
|---|---|
| Verificar si Metro está corriendo | `lsof -i :8081` |
| Iniciar Metro | `npm start` |
| Detener Metro | `Ctrl + C` (en la terminal de Metro) |
| Matar Metro si no ubicas la terminal | `kill -9 $(lsof -ti :8081)` |
| Limpiar caché Metro | `npm start -- --reset-cache` |

### iOS

| Acción | Comando |
|---|---|
| Ver simuladores disponibles | `xcrun simctl list devices available` |
| Correr en iOS (simulador) | `npm run ios` |
| Correr en iPhone físico | `npm run ios -- --device "Nombre del iPhone"` |
| Cerrar simulador iOS | `xcrun simctl shutdown booted` |
| Limpiar build iOS | `rm -rf ~/Library/Developer/Xcode/DerivedData/TauLiturgico-*` |

### Android

| Acción | Comando |
|---|---|
| Ver emuladores disponibles | `emulator -list-avds` |
| Correr en Android | `npm run android` |
| Cerrar emulador Android | `adb emu kill` |
| Limpiar build Android | `cd android && ./gradlew clean` |

---

## Solución de problemas comunes

### La app no refleja los cambios después de cambiar de ambiente
→ Ejecutar el proceso de [cambio de ambiente](#cambio-de-ambiente-rebuild-requerido) completo.

### Metro no puede conectarse a la app
→ Verificar que Metro esté corriendo (`npm start`). En el simulador presionar `Cmd + D` → **Configure Bundler** y confirmar que el host sea `localhost:8081`.

### Error "Unable to find a target iPhone simulator"
→ Abrir Xcode → Settings → Platforms y asegurarse de que el simulador de iOS esté instalado.

### Android: "No emulators found"
→ El emulador no está iniciado. Abrirlo desde Android Studio → Device Manager antes de correr `npm run android`.

### iOS: la app crashea al iniciar después de un rebuild
→ Limpiar DerivedData completamente y hacer un build desde cero:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/TauLiturgico-*
npm run ios
```

### Android: la cámara no se abre al tomar la foto de perfil
**Síntoma:** En Perfil → foto de perfil (e igual en el onboarding), al elegir "Cámara" no ocurre nada: la cámara no se activa y no aparece ningún error visible.

**Causa:** `react-native-image-picker` tiene un comportamiento específico en Android: **si el permiso `android.permission.CAMERA` está declarado en `AndroidManifest.xml`, la app debe solicitarlo en runtime _antes_ de llamar a `launchCamera`**. Si el permiso está declarado pero nunca se solicita, `launchCamera` falla silenciosamente y la cámara no abre. En nuestro manifest `CAMERA` sí está declarado, pero el código no pedía el permiso en tiempo de ejecución.

> En iOS no aplica: el picker gestiona el permiso mediante `NSCameraUsageDescription` del `Info.plist`.

**Solución:** Solicitar el permiso de cámara en runtime con `PermissionsAndroid` antes de abrir la cámara. La lógica vive en el helper compartido `src/utils/permissions.js` (`ensureCameraPermission()`), usado tanto en `ProfileScreen` como en `ProfileSetupScreen`:

```js
import { ensureCameraPermission } from '../utils/permissions';

// dentro del onPress de "Cámara":
const granted = await ensureCameraPermission();
if (!granted) {
  Alert.alert('Permiso de cámara', 'Habilita el acceso a la cámara en Configuración…');
  return;
}
launchCamera(opts, handleResult);
```

Es un cambio solo de JS (`PermissionsAndroid` es parte del core de RN, ya enlazado): basta con recargar Metro, no requiere rebuild nativo.

> **Recomendación pendiente (requiere rebuild):** el manifest declara `CAMERA` sin `<uses-feature android:name="android.hardware.camera" android:required="false" />`. Sin esa línea, Google Play oculta la app en dispositivos sin cámara (algunas tablets). Añadirla mejora la disponibilidad.
