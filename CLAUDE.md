# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Metro bundler
npm start

# Run on device/simulator
npm run android
npm run ios

# Re-link custom fonts after adding/removing assets
npm run link-assets
```

No lint, test, or type-check scripts exist yet. When they are added, document them here.

## Architecture

### Navigation flow

`AppNavigator` (`src/navigation/index.js`) renders one of three root screens based on Zustand state:

```
isAuthenticated=false, hasCompletedOnboarding=false → OnboardingScreen
isAuthenticated=false, hasCompletedOnboarding=true  → AuthStack (Phone → Otp → Sync)
isAuthenticated=true                                 → MainTabs (Hoy / Calendario / Lecturas / Notas / Perfil)
```

Both `AuthStack` and `MainTabs` are composed inside a root `Stack.Navigator` with `headerShown: false`.

### State management

Four independent Zustand stores in `src/store/index.js`, all persisted via `AsyncStorage`:

| Store | Key | Purpose |
|---|---|---|
| `useAuthStore` | `tau-auth` | `isAuthenticated`, `token`, `phone`, `hasCompletedOnboarding` |
| `useLiturgicalStore` | `tau-liturgical` | `todayData`, `readings`, `calendar`, `lastSync`; `sync()` is a stub in dev |
| `useSettingsStore` | `tau-settings` | `darkMode`, `textSize`, `ttsSpeed`, `ttsVoiceId`, `dailyReminder`, `reminderTime` |
| `useNotesStore` | `tau-notes` | `notes[]`, `bookmarks[]` |

### Data layer

`src/data/liturgical.js` is the single data source. It exports:

- `TODAY` — computed at module load from `new Date()`; includes season, color, cycle.
- `READINGS` — static array of the three daily readings (Primera Lectura, Salmo, Evangelio).
- `UPCOMING` — next 5 celebrations computed dynamically from fixed and moveable feasts.
- `SEASONS` — all five liturgical seasons with progress, active flag, and day counts.
- `buildMonthGrid(year, month)` — generates a 6-week (42-day) calendar grid starting on Monday.
- `NOTES_DATA`, `BOOKMARKS_DATA` — static placeholder data.

Liturgical date calculations (`_easter`, `_adventStart`, `_baptismOfLord`) live in this file. Any real API integration will replace/extend `useLiturgicalStore.sync()` and the stub in `ReadingsScreen`.

### Services

- `src/services/auth.js` — wraps Firebase Phone Auth OTP flow. Stores the Firebase `confirmation` object at module level between `requestOtp` and `verifyOtp` calls. JWT stored in iOS Keychain / Android Keystore via `react-native-keychain`. `apiFetch` refreshes the Firebase token on every call.
- `src/services/notifications.js` — Notifee daily reminder. Always calls `cancelAllNotifications` before rescheduling, so there is at most one pending notification.

### Theme system

Import from `src/theme` (barrel: `Colors`, `Typography`, `Spacing`, `Radii`, `Shadows`).

- `Colors` — nested object: `brand`, `ink`, `surface`, `border`, `liturgical` (green/purple/white/red/rose/gold/blue), `dark` (dark-mode overrides).
- `Typography` — `FontFamily.serif.*` (Cormorant Garamond variants), `FontSize`, `LineHeight`, `TextStyles` (display, h1–h3, eyebrow, body, quote).
- `Spacing` — numeric keys (1–16) mapping to pixel values (4–64); `Radii` (xs–pill); `Shadows` (sm/md/lg) tinted with `Colors.brand.dark`.

Dark mode pattern used in every screen:
```js
const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');
const bg      = dark ? Colors.dark.bg      : Colors.surface.secondary;
const surface = dark ? Colors.dark.surface : Colors.surface.primary;
const ink     = dark ? Colors.dark.ink     : Colors.ink.primary;
const muted   = dark ? Colors.dark.inkMuted : Colors.ink.muted;
const border  = dark ? Colors.dark.border  : Colors.border.default;
```

### Component atoms (`src/components/`)

- `Tau` — SVG τ glyph, props: `size`, `color`, `style`.
- `TauWordmark` — full logotype SVG.
- `LitDot` — colored circle for liturgical color indicators.
- `LitBadge` — pill badge that accepts `color` + children.
- `PrimaryBtn` / `GhostBtn` — standard buttons.
- `Card` — generic surface card.
- `SectionTitle` — section header with optional `action` + `onActionPress`.
- `Toggle` — boolean toggle control.

All components are re-exported from `src/components/index.js`.

### Fonts

Cormorant Garamond (Light, Regular, Medium, SemiBold + italic variants) are linked natively via `react-native-asset`. Font names must match the exact PostScript names used in `src/theme/typography.js` (e.g. `CormorantGaramond-SemiBoldItalic`). Run `npm run link-assets` after any font changes and rebuild the native app.
