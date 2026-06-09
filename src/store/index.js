import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyReadings } from '../services/lectionary';
import { CYCLE } from '../data/liturgical';

// ── Auth ───────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      phone: null,
      hasCompletedOnboarding: false,

      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setPhone: (phone) => set({ phone }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      logout: () => set({ isAuthenticated: false, token: null, phone: null }),
    }),
    {
      name: 'tau-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ── Liturgical data ────────────────────────────────────────────
export const useLiturgicalStore = create(
  persist(
    (set) => ({
      year: CYCLE.liturgicalYear,
      cycle: CYCLE.letter,
      lastSync: null,
      isLoading: false,
      error: null,
      todayData: null,
      readings: [],
      calendar: {},
      readingsCache: {},

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      cacheReading: (dateISO, readings) =>
        set((s) => ({ readingsCache: { ...s.readingsCache, [dateISO]: readings } })),
      setTodayData: (data) =>
        set({ todayData: data, lastSync: new Date().toISOString() }),
      setReadings: (readings) => set({ readings }),
      sync: async () => {
        set({ isLoading: true, error: null });
        try {
          const readings = await fetchDailyReadings();
          set({ readings, lastSync: new Date().toISOString() });
        } catch (e) {
          set({ error: e.message });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'tau-liturgical',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ── Settings ───────────────────────────────────────────────────
export const useSettingsStore = create(
  persist(
    (set) => ({
      darkMode: 'auto', // 'light' | 'dark' | 'auto'
      textSize: 'M', // 'S' | 'M' | 'L'
      ttsSpeed: 1,
      ttsVoiceId: null,
      elevenlabsApiKey: '',
      elevenlabsVoiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel — voz por defecto de ElevenLabs
      dailyReminder: true,
      reminderTime: '07:00',

      setDarkMode: (darkMode) => set({ darkMode }),
      setTextSize: (textSize) => set({ textSize }),
      setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
      setTtsVoiceId: (ttsVoiceId) => set({ ttsVoiceId }),
      setElevenlabsApiKey: (k) => set({ elevenlabsApiKey: k }),
      setElevenlabsVoiceId: (id) => set({ elevenlabsVoiceId: id }),
      setDailyReminder: (v) => set({ dailyReminder: v }),
      setReminderTime: (t) => set({ reminderTime: t }),
    }),
    {
      name: 'tau-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ── Notes ──────────────────────────────────────────────────────
export const useNotesStore = create(
  persist(
    (set) => ({
      notes: [],
      bookmarks: [],

      addNote: (note) =>
        set((s) => ({ notes: [{ id: Date.now(), ...note }, ...s.notes] })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      addBookmark: (bm) =>
        set((s) => ({ bookmarks: [{ id: Date.now(), ...bm }, ...s.bookmarks] })),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
    }),
    {
      name: 'tau-notes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
