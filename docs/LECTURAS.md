# Sistema de lecturas — τau Litúrgico

Cómo la app obtiene, normaliza y muestra las lecturas de la misa del día.
Documenta la regla litúrgica que se modela, las fuentes externas, la cadena de
fallback y dónde vive cada pieza en el código.

> Auditado en vivo contra las fuentes (jueves feria + domingo 21-jun-2026). Las
> limitaciones conocidas se enlazan con su ítem en [PENDIENTES.md](PENDIENTES.md).

---

## La regla litúrgica

La misa romana tiene un número de lecturas distinto según el día:

| Tipo de día | Lecturas | Estructura |
|---|---|---|
| **Feria** (días de semana) | **3** | 1ª lectura · Salmo responsorial · Evangelio |
| **Domingo / solemnidad** | **4** | 1ª lectura · Salmo responsorial · **2ª lectura** · Evangelio |

La **2ª lectura existe solo** en domingos y solemnidades; el resto de días no la
tiene. El orden de proclamación es siempre `1ª → Salmo → (2ª) → Evangelio`, y la
app lo respeta de extremo a extremo: **ningún parser ni pantalla reordena** el
array; se muestra en el orden en que la fuente lo entrega.

> Caso especial no soportado aún: la **Vigilia Pascual** (hasta 7 lecturas del AT
> + epístola + evangelio). Ver [PENDIENTES.md](PENDIENTES.md) ítem 6.

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
| Fallback | `fetchFallbackReadings(date)` | Encadena Evangelizo → Vatican News. |
| Parser dominicos | `parseReadings(html)` | Trocea por `<h2>`; `normalizeType` mapea/filtra cada sección. |
| Parser Evangelizo | `parseEvangelizoReadings(html)` | Separa por líneas; localiza salmo y evangelio, e infiere la 2ª lectura entre ambos. |
| Parser Vatican | `parseVaticanReadings(html)` | Extrae `<section>` de lectura y evangelio (sin salmo). |
| Normalización tipo | `normalizeType(h2)` | Devuelve `{type, closing}` o `null` para secciones que no son lecturas. |
| Referencia bíblica | `extractRef(intro, tipo)` | Limpia el prefacio ("Lectura del libro de…") y deja "Libro cap, vv". |

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

### Consumo en pantallas

- `ReadingsScreen.jsx` — pantalla de lectura completa con reproductor TTS. Usa las
  lecturas del store (hoy) o las descargadas por fecha; **renderiza el array en su
  orden** sin reordenar. Valida el conteo con `badCount` (rango **[3, 4]**: 3 =
  feria, 4 = domingo/solemnidad; fuera de rango asume descarga incompleta y
  resincroniza).
- `TodayScreen.jsx` — resumen del día; el chip de lecturas usa `STATIC_READINGS`
  solo como placeholder si el store está vacío. El subtítulo (`readingsSub`)
  anuncia 4 lecturas con `isSunday || hasSecond`: los domingos por el calendario
  (aunque las lecturas aún no carguen) y las solemnidades de día de semana por la
  2ª lectura presente en el array.

---

## Resumen de cobertura

| Caso | Salmo | Estructura | Estado |
|---|---|---|---|
| Hoy (cualquier día) | ✅ | correcta | OK |
| Día de semana por fecha | ✅ | 1ª · Salmo · Ev | OK |
| Domingo dentro de ±30 días | ✅ | 1ª · Salmo · 2ª · Ev | OK |
| Domingo a >±30 días | ❌ | 1ª · 2ª · Ev (sin salmo) | Limitación — ítem 4 |
| Vigilia Pascual | parcial | solo 1ª/2ª/salmo/evangelio | No soportado — ítem 6 |
