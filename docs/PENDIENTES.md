# Pendientes y mejoras — τau Litúrgico

Backlog de mejoras técnicas, deuda y tareas que no entran en un hotfix pero no
queremos olvidar. Cada ítem indica **contexto**, **qué hacer**, **prioridad** y
**riesgo**. Al completar uno, muévelo a "Hecho" con la versión en que se resolvió.

> Convención: prioridad `alta` / `media` / `baja`. Riesgo = probabilidad de
> romper algo si se hace sin cuidado.

---

## Abiertos

### 1. Backend propio para las lecturas (evitar scraping/Cloudflare)
- **Prioridad:** media-alta · **Riesgo:** medio
- **Contexto:** Las lecturas se obtienen por *scraping* del cliente desde
  `dominicos.org` y `vaticannews.va`. Vatican News está detrás de **Cloudflare**,
  que bloquea IPs de baja reputación (operadores de Venezuela) — causaba el falso
  "Sin conexión". En 1.0.2 se mitigó (User-Agent de navegador + timeout + no
  bloquear el arranque), pero **el bloqueo no se puede vencer al 100% desde el
  cliente**.
- **Qué hacer:** Enrutar las lecturas por una **Firebase Cloud Function** (u otro
  backend) que haga el scraping/normalización desde un servidor con buena
  reputación de IP y devuelva JSON. La app deja de depender de sitios externos
  protegidos por Cloudflare y se elimina el problema de geo-bloqueo.
- **Beneficio extra:** permite cachear, cambiar de fuente sin actualizar la app, y
  parsear en el servidor (menos frágil ante cambios de HTML).
- **Referencia:** `src/services/lectionary.js`, `src/store/index.js` (`sync()`).

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
- **Qué hacer:** Resolverlo con el backend propio del ítem 1 (normaliza todas las
  fechas con salmo sin límite de rango), o una fuente sin límite de ±30 días.
- **Referencia:** `src/services/lectionary.js` (`fetchEvangelizoReadings`,
  `fetchFallbackReadings`).

### 5. `uses-feature` de cámara — verificar tras publicar
- **Prioridad:** baja · **Riesgo:** bajo
- **Contexto:** En 1.0.2 se añadió
  `<uses-feature android:name="android.hardware.camera" android:required="false" />`
  para que Play no oculte la app en dispositivos sin cámara.
- **Qué hacer:** Tras publicar, confirmar en Play Console → *Dispositivos
  compatibles* que el número de dispositivos no quedó restringido por la cámara.

### 6. Vigilia Pascual no soportada por el parser de lecturas
- **Prioridad:** baja · **Riesgo:** bajo
- **Contexto:** La Vigilia Pascual tiene hasta **7 lecturas del AT + epístola +
  evangelio**, cada una con su salmo. El parser (`normalizeType`) solo reconoce
  "primera lectura", "segunda lectura", "salmo de hoy" y "evangelio del día", así
  que no extraería el resto. Además, el conteo esperado en `ReadingsScreen`
  (`badCount`, rango 3–4) marcaría ese día como incompleto.
- **Qué hacer:** Soportar el caso especial de la Vigilia (reconocer 3ª…7ª lectura,
  epístola y múltiples salmos) y excluir ese día del chequeo de `badCount`.
- **Referencia:** `src/services/lectionary.js` (`normalizeType`, `parseReadings`),
  `src/screens/ReadingsScreen.jsx` (`badCount`).

### 7. Subtítulo de lecturas en "Hoy" desfasado en solemnidades de día de semana
- **Prioridad:** baja · **Riesgo:** muy bajo
- **Contexto:** En `TodayScreen` el subtítulo del resumen de lecturas se calcula
  **solo a partir de `isSunday`**, no del contenido real:
  `const readingsSub = isSunday ? '1ª · Sal · 2ª · Ev' : '1ª · Sal · Ev';`.
  La estructura litúrgica es: ferias = 3 (1ª · Salmo · Ev) y domingos/solemnidades
  = 4 (1ª · Salmo · 2ª · Ev). En **solemnidades que caen en día de semana**
  (p. ej. 15-ago Asunción, 8-dic Inmaculada, 29-jun San Pedro y San Pablo) sí hay
  2ª lectura: la app **renderiza las 4 lecturas correctamente**, pero el subtítulo
  anuncia solo "1ª · Sal · Ev". Es un desajuste **solo de la etiqueta**, no de los
  datos ni del orden (auditados y correctos en dominicos y Evangelizo).
- **Qué hacer:** Derivar el subtítulo del array real en vez del calendario:
  `const hasSecond = READINGS.some((r) => r.type === 'Segunda Lectura');`
  `const readingsSub = hasSecond ? '1ª · Sal · 2ª · Ev' : '1ª · Sal · Ev';`.
- **Referencia:** `src/screens/TodayScreen.jsx` (`readingsSub`, ~línea 331).

---

## Hecho

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
