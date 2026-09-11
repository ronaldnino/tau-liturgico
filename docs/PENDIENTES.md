# Pendientes y mejoras — τau Litúrgico

Backlog de mejoras técnicas, deuda y tareas que no entran en un hotfix pero no
queremos olvidar. Cada ítem indica **contexto**, **qué hacer**, **prioridad** y
**riesgo**. Al completar uno, muévelo a "Hecho" con la versión en que se resolvió.

> Convención: prioridad `alta` / `media` / `baja`. Riesgo = probabilidad de
> romper algo si se hace sin cuidado.

---

## Abiertos

### 1. Backend propio para las lecturas (evitar scraping/Cloudflare)
- **Prioridad:** media-alta · **Riesgo:** medio · **Estado:** código listo, falta desplegar
- **Contexto:** Las lecturas se obtenían por *scraping* del cliente desde
  `dominicos.org` y `vaticannews.va`. Vatican News está detrás de **Cloudflare**,
  que bloquea IPs de baja reputación (operadores de Venezuela) — causaba el falso
  "Sin conexión". En 1.0.2 se mitigó (User-Agent de navegador + timeout + no
  bloquear el arranque), pero **el bloqueo no se puede vencer al 100% desde el
  cliente**.
- **Hecho:** el scraping se movió a una Cloud Function HTTPS `getReadings`
  (`functions/index.js` + `functions/src/lectionary.js`, port casi literal de la
  lógica que antes vivía en `src/services/lectionary.js`) con *cache-through* en
  Firestore (`readings/{YYYY-MM-DD}`) — una fecha se scrapea una sola vez para
  todos los usuarios, y corre desde IPs de Google Cloud en vez del móvil del
  usuario, resolviendo el geo-bloqueo. El cliente (`src/services/lectionary.js`)
  quedó como un wrapper delgado que llama a la función con el mismo patrón de
  auth que ya usaba `src/services/profile.js` (headers manuales, sin SDK nativo
  nuevo — ver `src/services/firebaseAuth.js`).
- **Falta:** el deploy en sí. Requiere activar el plan **Blaze** en los proyectos
  Firebase (`tau-liturgico-dev`/`tau-liturgico-prd`) y correr
  `firebase deploy --only functions` — pasos exactos en
  [FIREBASE_SETUP.md § 10](FIREBASE_SETUP.md#10-cloud-functions-lecturas). Mover
  a "Hecho" una vez desplegado y verificado en dev.
- **No resuelve:** el ítem 4 (salmo ausente en domingos >±30 días) — es una
  limitación de *contenido* de Evangelizo/Vatican News, no de red, así que una
  mejor reputación de IP no lo arregla.
- **Referencia:** `functions/`, `src/services/lectionary.js`, `firebase.json`,
  `scripts/sync-functions-shared.js`.

### 2. `uses-feature` de cámara — verificar tras publicar
- **Prioridad:** baja · **Riesgo:** bajo
- **Contexto:** En 1.0.2 se añadió
  `<uses-feature android:name="android.hardware.camera" android:required="false" />`
  para que Play no oculte la app en dispositivos sin cámara.
- **Qué hacer:** Tras publicar, confirmar en Play Console → *Dispositivos
  compatibles* que el número de dispositivos no quedó restringido por la cámara.

### 3. Warnings de lint `react-native/no-inline-styles` (74)
- **Prioridad:** baja · **Riesgo:** bajo
- **Contexto:** Tras limpiar todos los errores de lint (144 → 0), quedan ~74
  warnings, casi todos estilos en línea (muchos son estilos dinámicos de dark
  mode, legítimos).
- **Qué hacer:** Revisar caso por caso; extraer a `StyleSheet` los que sean
  estáticos. Los dinámicos (color según tema, `width: ${progress}%`, etc.) pueden
  quedarse o documentarse con `eslint-disable` puntual.

### 4. Salmo ausente en domingos a más de ±30 días (al navegar por fecha)
- **Prioridad:** baja · **Riesgo:** bajo
- **Contexto:** El salmo de los domingos por fecha se resuelve con **Evangelizo**
  (dominicos redirige los domingos a una homilía). Pero Evangelizo solo acepta
  fechas dentro de **±30 días** de hoy; fuera de ese rango se cae a Vatican News,
  que no publica el salmo. Resultado: domingos muy pasados o futuros (>30 días) aún
  sin salmo.
- **Casos OK:** hoy (cualquier día), días de semana por fecha, y domingos dentro de
  ±30 días sí traen salmo.
- **UX ya mitigada:** la ranura del salmo **ya no desaparece**; se muestra como
  "Contenido no disponible" (ver `buildCanonicalReadings` y [LECTURAS.md](LECTURAS.md)).
  Lo que falta es el **contenido** del salmo, no la estructura.
- **Investigado y descartado:** el límite de Evangelizo es una restricción del
  servidor sobre el parámetro `date` (confirmado contra su propio manual de API
  en `feed.evangelizo.org/v2/reader.php`), sin parámetro alterno (p. ej. por
  ciclo litúrgico) que lo evite — y esa restricción aplica sin importar quién
  llame (cliente o la Cloud Function del ítem 1), así que **el backend propio no
  lo resuelve**: solo arregla el geo-bloqueo de Cloudflare, que es un problema de
  red distinto. Un sondeo rápido de fuentes alternativas en español (Opus Dei,
  Corazones.org, Conferencia Episcopal Española) no encontró un reemplazo
  confiable. No hay corrección de bajo riesgo disponible por ahora.
- **Referencia:** `functions/src/lectionary.js` (`fetchEvangelizoReadings`,
  `fetchFallbackReadings`) — el código de scraping vive ahí desde el ítem 1.

---

## Hecho

- **1.0.8 (versionCode 9)** — R8/ProGuard habilitado en release
  (`enableProguardInReleaseBuilds = true`). AAB de ~27.5 MB → ~25.5 MB (-7%).
  No hizo falta escribir reglas manuales: casi todos los módulos nativos ya
  traen sus propias reglas empaquetadas en el AAR (algunas como
  `proguard.txt`, no `consumer-rules.pro` — R8/AGP las fusiona igual, con
  cualquier nombre, automáticamente). El único bloqueo real fue memoria:
  `org.gradle.jvmargs` en `android/gradle.properties` estaba en
  `-Xmx2048m -XX:MaxMetaspaceSize=512m`, insuficiente para que R8 y las
  tareas `lintVitalAnalyzeRelease` de varios módulos corran en paralelo sin
  `OutOfMemoryError: Metaspace` — se subió a `-Xmx4096m -XX:MaxMetaspaceSize=1024m`.
  **Probado de verdad en dispositivo** (no solo que compile): instalado el
  APK release minificado en emulador, sin pantalla roja ni crash; flujo
  completo de onboarding (SVG, Reanimated, gestos, mask-input) y **Firebase
  Auth de punta a punta** (`signInWithPhoneNumber` → pantalla de OTP →
  `confirm()` con código de prueba, error `auth/invalid-verification-code`
  mostrado correctamente) funcionando sin problemas. Un solo warning
  benigno en logcat (`RNInstallReferrerClient`/`NoSuchMethodException`,
  capturado internamente por la librería, no crashea nada). `mapping.txt`
  generado en `android/app/build/outputs/mapping/release/` — **hay que
  subirlo a Play Console** junto con el AAB para poder deofuscar crashes
  futuros.
- **1.0.7 (versionCode 8)** — Soporte de 16 KB memory page size (Google
  Play). Upgrade completo de React Native **0.74.5 → 0.75.5 → 0.76.9 →
  0.77.3** (sobre `main` directamente, sin rama aparte), con bump de
  módulos nativos incompatibles en cada paso: `reanimated` 3.10.1→3.17.5,
  `screens` 3.31.1→4.11.1, `gesture-handler` 2.16.2→2.22.1, `svg`
  15.2.0→15.11.1, `safe-area-context` 4.10.5→5.2.0. NDK 26.1→27.1.12297006,
  AGP 8.2.1→8.7.2, Kotlin 1.9.22→2.0.21, Gradle 8.6→8.10.2.
  **Causa raíz real** (no obvia): `react-native-keychain@8.2.0` traía
  `libconceal.so` (cifrado de Facebook, abandonado) sin alinear a 16 KB en
  `x86_64` — aunque **arm64-v8a ya pasaba limpio**, Play Console evalúa
  *todas* las ABIs de 64 bits del bundle, así que el error seguía
  apareciendo (versionCode 6 y 7, ambos consumidos/quemados sin poder
  reintentarse — Play no permite reusar un `versionCode`, ni con error).
  `react-native-keychain@10.0.0` eliminó Conceal por completo (usa Android
  Keystore nativo); la API usada en `src/services/auth.js`
  (`setGenericPassword`/`getGenericPassword`/`resetGenericPassword`) no
  cambió. **Verificación que sí sirve** (el diálogo "This app isn't 16 KB
  compatible" en el dispositivo NO es prueba suficiente — Android deja de
  mostrarlo tras el primer *dismiss* aunque el problema siga sin resolver):
  `llvm-readelf -l <NDK>/.../bin/llvm-readelf` sobre cada `.so`, y sobre
  todo `zipalign -c -P 16 -v 4` (herramienta oficial de Android) corrido
  contra los *splits* reales generados con `bundletool build-apks`
  (`base-arm64_v8a.apk` y `base-x86_64.apk`, no el AAB crudo) — hay que
  chequear **todas** las ABIs de 64 bits, no solo arm64. Detalle completo
  del proceso (los 3 pasos del upgrade, versiones exactas, y la trampa del
  `versionCode` quemado) en el historial de commits `2204597`..`0b1ac5b` y
  en la sesión de Claude Code que lo resolvió.
- **sin publicar** — Vigilia Pascual: verificado en vivo que ninguna fuente la
  sirve (dominicos redirige como un domingo; Vatican News responde con las
  lecturas del Sábado Santo *diurno*, una liturgia distinta, bajo la misma URL
  de fecha). En vez de parsear un contenido que no existe, `isEasterVigil(date)`
  (`src/data/liturgical.js`) detecta el día y `fetchDailyReadings` corta antes de
  intentar ninguna fuente; la UI muestra "Contenido no disponible" con un mensaje
  específico (sin botón Reintentar) y ese día se excluye del reintento automático
  de `sync()`. Detalle en [LECTURAS.md](LECTURAS.md).
- **sin publicar** — Ranuras de lecturas siempre visibles: `buildCanonicalReadings`
  muestra siempre las 3–4 lecturas del día según la regla litúrgica; las que no se
  pudieron descargar aparecen como "Contenido no disponible" (con reproductor y
  Guardar desactivados) en vez de desaparecer. Detalle en [LECTURAS.md](LECTURAS.md).
- **sin publicar** — Subtítulo de lecturas en "Hoy" en solemnidades de día de
  semana: `readingsSub` ya no depende solo de `isSunday`; usa `isSunday || hasSecond`
  (detecta la 2ª lectura en el array real), así domingos y solemnidades feriales
  anuncian "1ª · Sal · 2ª · Ev" y las ferias "1ª · Sal · Ev".

- **sin publicar** — Salmo en las lecturas de hoy: hoy usa dominicos `/hoy/`
  (trae salmo todos los días, incl. domingos).
- **sin publicar** — Salmo en domingos por fecha: fallback a Evangelizo (con salmo)
  dentro de ±30 días; ver limitación restante en el ítem 4.
- **1.0.2** — Registro con números +58 (Venezuela): número normalizado a E.164
  (quita el `0` inicial); corrige `auth/unknown` error 39.
- **1.0.2** — Cámara de foto de perfil: permiso solicitado en runtime
  (`src/utils/permissions.js`) + `uses-feature` no obligatoria.
- **1.0.2** — Mitigación del bloqueo Cloudflare/Venezuela y arranque que ya no se
  bloquea si la descarga de lecturas falla; estado vacío amigable en Lecturas.
- **1.0.2** — Limpieza de lint (144 errores → 0) y código muerto.
