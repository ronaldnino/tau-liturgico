# Lanzamiento en Google Play — τau Litúrgico

## Información de la app

| Campo | Valor |
|---|---|
| Package name | `org.tauliturgico` |
| App name | Tau Litúrgico |
| Version inicial | 1.0.0 (version code 1) |
| AAB generado | `android/app/build/outputs/bundle/release/tau-liturgico.aab` |
| Keystore | `/Users/ronaldnino/keystores/tau-liturgico-release.keystore` |
| Key alias | `tau-liturgico` |

---

## Configuración de firma (`~/.gradle/gradle.properties`)

```properties
TAU_RELEASE_STORE_FILE=/Users/ronaldnino/keystores/tau-liturgico-release.keystore
TAU_RELEASE_KEY_ALIAS=tau-liturgico
TAU_RELEASE_STORE_PASSWORD=<contraseña>
TAU_RELEASE_KEY_PASSWORD=<contraseña>
```

> El archivo `gradle.properties` global **nunca** debe subirse al repositorio.

## Generar el AAB firmado

```bash
cd android
./gradlew bundleRelease
```

El archivo resultante se encuentra en:
```
android/app/build/outputs/bundle/release/tau-liturgico.aab
```

---

## Fichas de Play Console

### Descripción corta (29 caracteres)

```
Calendario litúrgico católico
```

### Descripción larga (~3 950 caracteres)

```
Vive el año de la Iglesia con profundidad y belleza.

τau Litúrgico es tu compañero diario para seguir el ritmo del calendario litúrgico católico: conoce el tiempo en que estamos, escucha las lecturas del día con audio de alta calidad, escribe tus reflexiones personales y mantente presente en la oración, cada día del año.

─────────────────────────────────────
📅 CALENDARIO LITÚRGICO COMPLETO
─────────────────────────────────────
Consulta el tiempo litúrgico actual —Adviento, Navidad, Cuaresma, Pascua, Tiempo Ordinario— con su color litúrgico correspondiente. Las fiestas, solemnidades y ferias se calculan dinámicamente para cada año, incluida la fecha de Pascua y todas las celebraciones móviles del ciclo litúrgico A, B y C.

─────────────────────────────────────
📖 LECTURAS DEL DÍA
─────────────────────────────────────
Accede cada día a la Primera Lectura, el Salmo Responsorial, la Segunda Lectura (en domingos y solemnidades) y el Santo Evangelio. Los textos se obtienen de fuentes litúrgicas oficiales y se presentan con jerarquía tipográfica cuidada para facilitar la lectura y la meditación.

─────────────────────────────────────
🎙️ AUDIO CON VOZ NATURAL
─────────────────────────────────────
Escucha las lecturas con síntesis de voz de alta calidad. Puedes ajustar la velocidad de lectura y navegar entre lecturas de forma automática. La app usa la síntesis de voz integrada en tu dispositivo —que funciona sin conexión a internet— o, si lo prefieres, puedes configurar tu propia clave de ElevenLabs para disfrutar de voces aún más naturales y expresivas.

─────────────────────────────────────
✍️ NOTAS Y REFLEXIONES PERSONALES
─────────────────────────────────────
La lectio divina no termina al cerrar el libro. τau Litúrgico incluye un espacio para escribir tus reflexiones personales vinculadas a las lecturas de cada día. Puedes guardar marcadores en los textos que más te impacten y consultar tus notas anteriores cuando quieras volver a ellas.

─────────────────────────────────────
🔔 RECORDATORIO DIARIO
─────────────────────────────────────
Configura una notificación diaria a la hora que prefieras para que el encuentro con la Palabra sea parte de tu rutina. El recordatorio funciona sin conexión a internet y respeta tu privacidad: no hay rastreo, no hay publicidad.

─────────────────────────────────────
🌙 DISEÑO CUIDADO
─────────────────────────────────────
Interfaz diseñada para la contemplación, con tipografía Cormorant Garamond de estilo litúrgico, modo oscuro automático o manual, y tamaño de texto ajustable. Cada elemento visual está pensado para que la app se sienta como un libro de oración, no como una red social.

─────────────────────────────────────
🔒 PRIVACIDAD PRIMERO
─────────────────────────────────────
τau Litúrgico no usa publicidad, no vende datos y no te rastrea. Tu número de teléfono se usa únicamente para autenticarte con un código OTP. Tus notas y preferencias se guardan en tu dispositivo. Lo mínimo necesario, nada más.

─────────────────────────────────────
PARA QUIÉN ES ESTA APP
─────────────────────────────────────
Para laicos, religiosos, catequistas y sacerdotes que desean acompañar su vida espiritual con la liturgia de la Iglesia Universal. Para quienes rezan la Liturgia de las Horas y quieren conocer las lecturas del día. Para padres que quieren compartir el Evangelio con su familia. Para cualquier persona que desee entrar más profundamente en el Misterio que la Iglesia celebra cada día.

─────────────────────────────────────
ACCESO Y PRECIO
─────────────────────────────────────
Descarga gratuita. Sin compras dentro de la app. Sin anuncios. Sin suscripciones obligatorias.

τau (τ) es la última letra del alfabeto griego y hebreo. En la tradición cristiana, es el símbolo de la cruz abrazada por San Francisco de Asís: el principio y el fin, el sí definitivo de Dios al mundo.

www.tauliturgico.org
```

---

## Release name y Release notes (v1.0.0)

**Release name:**
```
1.0.0 — Lanzamiento inicial
```

**Release notes (What's new):**
```
Primera versión de τau Litúrgico.

• Calendario litúrgico con tiempos, colores y ciclo A/B/C
• Lecturas del día obtenidas de fuentes litúrgicas oficiales
• Audio con síntesis de voz y resaltado de palabras en tiempo real
• Notas y reflexiones personales vinculadas a las lecturas
• Recordatorio diario configurable
• Modo oscuro automático y tamaño de texto ajustable
• Autenticación por número de teléfono (OTP)
```

---

## Declaraciones en App content

### Advertising ID
**Respuesta:** No — la app no usa el Advertising ID.

El permiso está explícitamente eliminado en `AndroidManifest.xml`:
```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID"
                 tools:node="remove"/>
```

### Permiso READ_MEDIA_IMAGES

**Descripción declarada en Play Console (198 caracteres):**
```
Users can optionally select a profile photo from their device gallery to personalize their account. Requested only when the user taps the profile photo field. No images are shared with third parties.
```

### Política de privacidad
```
https://www.tauliturgico.org/privacy.html
```

### Política CSAE
```
https://www.tauliturgico.org/csae-policy.html
```

### Eliminación de cuenta
```
https://www.tauliturgico.org/delete-account.html
```

---

## Credenciales de prueba para revisores de Google

Configuradas en Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing:

| Teléfono | Código OTP |
|---|---|
| +15550000001 | 123456 |

---

## Requisitos para llegar a Producción

Google Play exige para cuentas nuevas de desarrollador:

1. **Publicar un release en Closed Testing (Alpha)**
2. **Mínimo 12 testers opt-in** en el Closed Testing
3. **14 días consecutivos** con 12+ testers activos
4. Completar toda el **App content** (calificación, privacidad, data safety, CSAE)
5. Tocar **"Apply for production"** y responder preguntas sobre el closed test

### Estado del proceso (junio 2026)

| Paso | Estado |
|---|---|
| AAB firmado y subido | ✅ Completo |
| Internal Testing publicado | ✅ Completo (Jun 13, 2026) |
| App content completado | ✅ Completo |
| Closed Testing (Alpha) creado | ✅ Enviado a revisión Google |
| 12 testers opt-in en Alpha | ⏳ Pendiente — esperando aprobación |
| 14 días de prueba | ⏳ Pendiente |
| Apply for production | ⏳ Bloqueado hasta cumplir los 14 días |

---

## Tracks de distribución

| Track | Propósito | Testers |
|---|---|---|
| Internal testing | Prueba rápida del desarrollador | Hasta 100 (lista `testers-tauliturgico`) |
| Closed testing - Alpha | Requisito obligatorio para Producción | Mínimo 12 |
| Production | Disponible públicamente en Play Store | Todos |

### Link de opt-in Internal Testing
```
https://play.google.com/apps/internaltest/4700496855252089982
```

---

## Configuración de Android para release

### `android/build.gradle`

```groovy
buildToolsVersion = "35.0.0"
minSdkVersion    = 23
compileSdkVersion = 35
targetSdkVersion  = 35
```

### `android/app/build.gradle` — firma

```groovy
signingConfigs {
    release {
        storeFile     file(RELEASE_STORE_FILE)
        storePassword RELEASE_STORE_PASSWORD
        keyAlias      RELEASE_KEY_ALIAS
        keyPassword   RELEASE_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

---

## Assets de Play Store generados

| Asset | Tamaño | Ubicación |
|---|---|---|
| Icono | 512 × 512 px | `web/assets/icon-512.png` |
| Feature graphic | 1024 × 500 px | `web/assets/feature-graphic.png` |
| Capturas de pantalla | mínimo 2 | `tau-liturgico-web/screenshots/` |

---

## Contacto del desarrollador

| Campo | Valor |
|---|---|
| Nombre | Ronald Niño |
| Correo | ronaldninodev@gmail.com |
| Sitio web | https://www.tauliturgico.org |
