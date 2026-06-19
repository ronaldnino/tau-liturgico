# Sistema de lecturas — τau Litúrgico

Cómo la app obtiene, normaliza y muestra las lecturas de la misa del día.
Documenta la regla litúrgica que se modela, las fuentes externas, la cadena de
fallback y dónde vive cada pieza en el código.

> Auditado en vivo contra las fuentes (jueves feria + domingo 21-jun-2026). Las
> limitaciones conocidas se enlazan con su ítem en [PENDIENTES.md](PENDIENTES.md).

---

## La regla litúrgica

La misa romana tiene un número de lecturas distinto según el rango del día:

| Tipo de día | Lecturas | Estructura |
|---|---|---|
| **Feria** (días de semana), **memoria** o la mayoría de **fiestas** | **3** | 1ª lectura · Salmo responsorial · Evangelio |
| **Domingo** o **solemnidad** | **4** | 1ª lectura · Salmo responsorial · **2ª lectura** · Evangelio |

La **2ª lectura existe solo** en domingos y solemnidades; el resto de días no la
tiene. El orden de proclamación es siempre `1ª → Salmo → (2ª) → Evangelio`, y la
app lo respeta de extremo a extremo: **ningún parser ni pantalla reordena** el
array.

**Cómo sabe la app si un día lleva 2ª lectura** (`expectsSecond`), aunque no se
haya podido descargar:
- **Domingo** — por la fecha (`date.getDay() === 0`).
- **Solemnidad** — `isSolemnity(date)` en `src/data/liturgical.js`, que consulta
  las solemnidades **fijas** (`_FIXED_FEASTS` con `solemn: true`: Asunción 15-ago,
  Inmaculada 8-dic, San Pedro y San Pablo 29-jun, Todos los Santos 1-nov…) y
  **móviles** (`_moveableFeasts`: Santísima Trinidad, Corpus Christi, Sagrado
  Corazón, Pentecostés, Ascensión…).
- O bien la **2ª lectura ya vino** en los datos descargados.

> Caso especial no soportado aún: la **Vigilia Pascual** (hasta 7 lecturas del AT
> + epístola + evangelio). Ver [PENDIENTES.md](PENDIENTES.md) ítem 6.

---

## Ranuras canónicas y "Contenido no disponible"

La app **siempre muestra las ranuras que corresponden al día** según la regla, aun
si una fuente no entregó alguna lectura (caso típico: domingos a >±30 días vía
Vatican News, que omite el salmo). En vez de que la lectura *desaparezca*, su
ranura se muestra como **"Contenido no disponible"**.

`buildCanonicalReadings(rawReadings, date)` en `src/services/lectionary.js` toma lo
descargado (`rawReadings`, que puede tener huecos) y devuelve **siempre** las 3–4
ranuras en orden. Cada ranura se empareja con su lectura o, si falta, se marca
`unavailable: true` con texto vacío:

```js
{ type: 'Salmo Responsorial', ref: '', intro: '', text: '', closing: '', unavailable: true }
```

**Comportamiento en la UI** (`ReadingsScreen`):
- Las pestañas muestran siempre las 3–4 ranuras del día.
- Una ranura `unavailable` muestra el mensaje **"Contenido no disponible"** con un
  subtexto contextual (no publicada aún / fallo de carga / la fuente no la publica)
  y, si fue fallo de carga, el botón **Reintentar**.
- En una ranura `unavailable`, el **reproductor (TTS)** y el botón **Guardar** se
  muestran **desactivados** (atenuados).
- `TodayScreen` lista la ranura faltante como **"No disponible"** (atenuada) en vez
  de omitirla.

> El conteo crudo descargado se sigue validando con `badCount` (rango [3, 4]) para
> decidir si reintentar la descarga; eso opera sobre `rawReadings`, no sobre las
> ranuras canónicas.

---

## Fuentes y cadena de fallback

Las lecturas se obtienen por *scraping* desde el cliente. Cada fuente cubre un
caso distinto; se intentan en orden hasta que una responde con datos válidos.

```
fetchDailyReadings(date)
  │
  ├─ HOY ──────────────► dominicos /hoy/         (trae salmo todos los días)
  │
  └─ OTRA FECHA ───────► dominicos /<fecha>/
                          │  (los domingos redirige a una homilía → fallback)
                          └─ fetchFallbackReadings(date)
                               ├─ Evangelizo  (con salmo, solo ±30 días)
                               └─ Vatican News (sin salmo)
```

### Resultado por fuente (verificado en vivo)

| Capa | Cubre | Resultado |
|---|---|---|
| **dominicos** (`/hoy/` + ferias por fecha) | hoy y días de semana por fecha | ✅ Orden `1ª → Salmo → Ev` (3). Filtra secciones que no son lecturas (vídeo/reflexión/audio/recomendaciones) con `normalizeType`. |
| **Evangelizo** (`type=all`) | domingos por fecha dentro de **±30 días** | ✅ Orden `1ª → Salmo → 2ª → Ev` (4). Verificado con el domingo 21-jun-2026 (Jeremías → Salmo → Romanos → Mateo). |
| **Vatican News** | fallback para fechas que las otras no sirven (domingos a **>±30 días**) | ⚠️ Da `1ª → 2ª → Ev` **sin salmo**. Limitación conocida → [PENDIENTES.md](PENDIENTES.md) ítem 4. |

### Por qué tres fuentes

- **dominicos** es la fuente principal y la única que publica el **salmo** los días
  de semana, pero **redirige los domingos** a una homilía (no tiene página de
  lecturas por fecha ese día).
- **Evangelizo** cubre ese hueco: sí publica el salmo los domingos, pero su API
  solo acepta fechas dentro de **±30 días** de hoy.
- **Vatican News** es el último recurso (domingos lejanos): tiene las lecturas
  pero **omite el salmo**, así que esos días quedan con 3 elementos sin salmo.
- Vatican News está tras **Cloudflare**, que bloquea IPs de baja reputación; por
  eso todas las peticiones usan un `User-Agent` de navegador real y un timeout.

La solución de fondo (un backend propio que normalice todas las fechas con salmo
sin límite de rango) está en [PENDIENTES.md](PENDIENTES.md) ítem 1.

---

## Mapa del código

Todo vive en `src/services/lectionary.js`, salvo el consumo en pantallas.

| Pieza | Función | Rol |
|---|---|---|
| Entrada | `fetchDailyReadings(date)` | Decide `/hoy/` vs fecha y dispara el fallback si dominicos redirige. |
| Ranuras canónicas | `buildCanonicalReadings(raw, date)` | Devuelve siempre las 3–4 ranuras del día; rellena las faltantes con `unavailable`. |
| Fallback | `fetchFallbackReadings(date)` | Encadena Evangelizo → Vatican News. |
| Parser dominicos | `parseReadings(html)` | Trocea por `<h2>`; `normalizeType` mapea/filtra cada sección. |
| Parser Evangelizo | `parseEvangelizoReadings(html)` | Separa por líneas; localiza salmo y evangelio, e infiere la 2ª lectura entre ambos. |
| Parser Vatican | `parseVaticanReadings(html)` | Extrae `<section>` de lectura y evangelio (sin salmo). |
| Normalización tipo | `normalizeType(h2)` | Devuelve `{type, closing}` o `null` para secciones que no son lecturas. |
| Referencia bíblica | `extractRef(intro, tipo)` | Limpia el prefacio ("Lectura del libro de…") y deja "Libro cap, vv". |
| ¿Solemnidad? | `isSolemnity(date)` *(en `data/liturgical.js`)* | Decide si el día espera 2ª lectura aunque no se haya descargado. |

### Forma de cada lectura

Todos los parsers devuelven un array de objetos con la misma forma:

```js
{
  type: 'Primera Lectura' | 'Salmo Responsorial' | 'Segunda Lectura' | 'Santo Evangelio',
  ref: 'Mateo 10, 26-33',     // cita bíblica
  intro: 'Lectura del santo Evangelio según san Mateo.',
  text: '…',                  // párrafos unidos con \n\n
  closing: 'Palabra del Señor.' | 'Palabra de Dios.' | '',
}
```

Una ranura sin contenido descargado lleva además `unavailable: true` y campos
vacíos (la UI la muestra como "Contenido no disponible").

### Consumo en pantallas

- `ReadingsScreen.jsx` — pantalla de lectura completa con reproductor TTS. Toma las
  lecturas crudas (del store hoy, o las descargadas por fecha) y las pasa por
  `buildCanonicalReadings` para mostrar **siempre** las ranuras del día en orden.
  Valida el conteo crudo con `badCount` (rango **[3, 4]**: 3 = feria, 4 =
  domingo/solemnidad; fuera de rango asume descarga incompleta y resincroniza).
- `TodayScreen.jsx` — resumen del día; el chip de lecturas usa
  `buildCanonicalReadings` cuando hay datos (un salmo ausente sale como "No
  disponible") y `STATIC_READINGS` solo como placeholder en arranque frío. El
  subtítulo (`readingsSub`) anuncia 4 lecturas con `isSunday || hasSecond`.

---

## Resumen de cobertura

| Caso | Salmo | Estructura | Estado |
|---|---|---|---|
| Hoy (cualquier día) | ✅ | correcta | OK |
| Día de semana por fecha | ✅ | 1ª · Salmo · Ev | OK |
| Domingo dentro de ±30 días | ✅ | 1ª · Salmo · 2ª · Ev | OK |
| Domingo a >±30 días | ❌ contenido | 1ª · **Salmo "no disponible"** · 2ª · Ev | Ranura visible; falta el contenido — ítem 4 |
| Sin red / fecha futura no publicada | ❌ contenido | ranuras del día, todas "no disponible" | Estructura visible + Reintentar |
| Vigilia Pascual | parcial | solo 1ª/2ª/salmo/evangelio | No soportado — ítem 6 |

> Tras introducir `buildCanonicalReadings`, una lectura que no se pudo descargar ya
> **no desaparece**: su ranura se muestra como "Contenido no disponible". La
> limitación de *contenido* (p. ej. el salmo de domingos lejanos) persiste hasta el
> backend propio ([PENDIENTES.md](PENDIENTES.md) ítem 1).
