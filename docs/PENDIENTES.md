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

### 2. Habilitar R8/ProGuard (minificación) en release
- **Prioridad:** media · **Riesgo:** medio-alto
- **Contexto:** `enableProguardInReleaseBuilds = false` en
  `android/app/build.gradle`. El AAB pesa ~27 MB. Google Play avisa: "no
  deobfuscation file" y que R8 reduce tamaño. La advertencia es informativa (no
  ofuscamos), pero activar R8 reduciría tamaño y ofuscaría el código.
- **Qué hacer:** Poner `minifyEnabled true`, afinar **reglas ProGuard** para los
  módulos nativos (Firebase, reanimated, svg, sound, tts, keychain, image-picker…),
  **probar a fondo** una build minificada, y subir el `mapping.txt` a Play Console
  para deofuscar crashes.
- **Por qué no se hizo aún:** sin reglas correctas la app puede crashear en
  release; necesita su propia versión con pruebas, no un hotfix.

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

### 5. Soporte de 16 KB memory page size (Google Play)
- **Prioridad:** alta · **Riesgo:** alto (implica subir React Native de versión)
- **Estado:** bloquea el release 1.0.4 — pausado hasta resolver esto.
- **Contexto:** Al subir el AAB de 1.0.4 (versionCode 5) a Play Console apareció
  el error "Your app does not support 16 KB memory page sizes" (con opción
  "Proceed anyway", no es un bloqueo duro todavía). Es un requisito distinto al
  del ítem de `targetSdk` (ver Hecho): Android 15+ soporta dispositivos con
  tamaño de página de memoria de 16 KB, y las librerías nativas (`.so`) de la
  app deben estar alineadas a ese tamaño.
- **Causa raíz investigada:** varias piezas del stack están por debajo de la
  versión mínima con soporte 16 KB:
  - `react-native-reanimated` en `3.10.1` — el soporte llegó en `3.15.0+`.
  - React Native en `0.74.5` — el soporte nativo llegó en `0.76`/`0.77`.
  - NDK instalado: `26.1` y `27.1`; la alineación por defecto a 16 KB requiere
    **r28+** (con NDK 27 hay que agregar flags de linker manualmente, y los
    módulos nativos compilados vía CMake interno de RN no siempre los propagan).
  - AGP fijado en `8.2.1` por `@react-native/gradle-plugin` de RN 0.74; se
    recomienda `8.5.1+`.
- **Qué hacer:** Planear un upgrade de React Native 0.74 → 0.76/0.77 (salto con
  posibles *breaking changes*, requiere testing a fondo de toda la app),
  actualizar `react-native-reanimated` a `3.15.0+`, y revisar el resto de
  módulos nativos (`screens`, `svg`, `sound`, `tts`, `firebase`,
  `gesture-handler`, etc.) por compatibilidad. No es un hotfix — necesita su
  propia rama y plan de pruebas.
- **Por qué no se hizo ya:** es un proyecto de upgrade mayor, no algo para
  resolver junto con el fix de `targetSdk` (que sí era urgente y de bajo riesgo).
- **Referencia:** `android/build.gradle` (`ndkVersion`, AGP vía
  `node_modules/@react-native/gradle-plugin`), `package.json` (`react-native`,
  `react-native-reanimated`).

### 6. `uses-feature` de cámara — verificar tras publicar
- **Prioridad:** baja · **Riesgo:** bajo
- **Contexto:** En 1.0.2 se añadió
  `<uses-feature android:name="android.hardware.camera" android:required="false" />`
  para que Play no oculte la app en dispositivos sin cámara.
- **Qué hacer:** Tras publicar, confirmar en Play Console → *Dispositivos
  compatibles* que el número de dispositivos no quedó restringido por la cámara.

---

## Hecho

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
