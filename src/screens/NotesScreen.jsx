import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { Tau } from '../components';
import { useSettingsStore, useNotesStore } from '../store';
import { TODAY } from '../data/liturgical';

// ── Iconos SVG ────────────────────────────────────────────────────────────────

function IcoPencil({ c, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcoBookmark({ c, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcoTrash({ c, size = 15 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="2" rx="1" fill={c} />
      <Path
        d="M8 6V4h8v2M6 8l1 13h10l1-13"
        stroke={c}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const _MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const _DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const LIT_COLORS = Object.values(Colors.liturgical);

function _todayNote() {
  const n = new Date();
  return {
    date: `${n.getDate()} de ${_MONTHS[n.getMonth()]} · ${n.getFullYear()}`,
    weekday: _DAYS[n.getDay()],
    celebration: TODAY.celebration,
    color: TODAY.liturgicalColor,
  };
}

function LitBar() {
  return (
    <View style={s.litBar}>
      {LIT_COLORS.map((c) => (
        <View key={c} style={[s.litSeg, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const { notes, bookmarks, addNote, deleteNote } = useNotesStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const [activeTab, setActiveTab] = useState(0);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');

  const openComposer = () => {
    setDraft('');
    setComposing(true);
  };
  const closeComposer = () => {
    setDraft('');
    setComposing(false);
  };

  const saveNote = () => {
    if (!draft.trim()) return;
    addNote({ ..._todayNote(), text: draft.trim() });
    closeComposer();
  };

  const confirmDelete = (id) => {
    Alert.alert('Eliminar nota', '¿Eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteNote(id) },
    ]);
  };

  const ctx = { surface, ink, muted, border, dark };
  const listItems = activeTab === 0 ? notes : bookmarks;

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <LitBar />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: surface,
            borderBottomColor: border,
          },
        ]}
      >
        <Text style={[s.title, { color: ink }]}>Notas</Text>
        {activeTab === 0 && (
          <TouchableOpacity
            onPress={composing ? closeComposer : openComposer}
            style={[
              s.newBtn,
              composing
                ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }
                : { backgroundColor: Colors.brand.primary },
            ]}
            activeOpacity={0.8}
          >
            {!composing && <IcoPencil c="#fff" />}
            <Text style={[s.newBtnText, { color: composing ? muted : '#fff' }]}>
              {composing ? 'Cancelar' : 'Nueva'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Pestañas ────────────────────────────────────────────── */}
      <View style={[s.tabBar, { backgroundColor: surface, borderBottomColor: border }]}>
        {[
          { label: 'Notas', count: notes.length },
          { label: 'Marcadores', count: bookmarks.length },
        ].map((tab, i) => {
          const active = activeTab === i;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[s.tab, active && { borderBottomColor: Colors.brand.primary }]}
              onPress={() => {
                setActiveTab(i);
                setComposing(false);
              }}
              activeOpacity={0.7}
            >
              <View style={s.tabLabelRow}>
                <Text
                  style={[
                    s.tabText,
                    { color: active ? Colors.brand.primary : muted },
                    active && s.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      s.tabCount,
                      { backgroundColor: active ? Colors.brand.primary : border },
                    ]}
                  >
                    <Text style={[s.tabCountText, { color: active ? '#fff' : muted }]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Compositor ─────────────────────────────────────────── */}
      {composing && activeTab === 0 && (
        <Composer
          draft={draft}
          setDraft={setDraft}
          onSave={saveNote}
          onCancel={closeComposer}
          ctx={ctx}
        />
      )}

      {/* ── Lista ──────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.list,
          { paddingBottom: insets.bottom + 32 },
          listItems.length === 0 && !composing && s.listEmpty,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 0 ? (
          notes.length === 0 ? (
            <EmptyState
              title="Sin notas aún"
              body={`Toca «Nueva» para escribir\ntu primera reflexión litúrgica.`}
              muted={muted}
            />
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                ctx={ctx}
                onDelete={() => confirmDelete(note.id)}
              />
            ))
          )
        ) : bookmarks.length === 0 ? (
          <EmptyState
            title="Sin marcadores"
            body={`Marca pasajes desde la pantalla\nde Lecturas para encontrarlos aquí.`}
            muted={muted}
          />
        ) : (
          bookmarks.map((bm) => <BookmarkCard key={bm.id} bookmark={bm} ctx={ctx} />)
        )}
      </ScrollView>
    </View>
  );
}

// ── Compositor ────────────────────────────────────────────────────────────────

function Composer({ draft, setDraft, onSave, onCancel, ctx }) {
  const { surface, ink, muted, border } = ctx;
  const meta = _todayNote();
  const litColor = Colors.liturgical[meta.color] ?? Colors.liturgical.green;

  return (
    <View style={[co.wrap, { backgroundColor: surface, borderBottomColor: border }]}>
      {/* Franja litúrgica superior */}
      <View style={[co.stripe, { backgroundColor: litColor }]} />

      <View style={co.body}>
        {/* Contexto litúrgico */}
        <View style={co.context}>
          <View style={[co.colorDot, { backgroundColor: litColor }]} />
          <Text style={[co.contextCelebration, { color: litColor }]} numberOfLines={1}>
            {meta.celebration}
          </Text>
        </View>
        <Text style={[co.contextDate, { color: muted }]}>
          {meta.weekday} · {meta.date}
        </Text>

        <View style={[co.divider, { backgroundColor: border }]} />

        {/* Input */}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          autoFocus
          placeholder="Escribe tu reflexión…"
          placeholderTextColor={muted}
          style={[co.input, { color: ink }]}
          textAlignVertical="top"
        />

        {/* Acciones */}
        <View style={[co.actions, { borderTopColor: border }]}>
          <TouchableOpacity onPress={onCancel} style={co.cancelBtn} activeOpacity={0.7}>
            <Text style={[co.cancelText, { color: muted }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSave}
            style={[
              co.saveBtn,
              { backgroundColor: Colors.brand.primary, opacity: draft.trim() ? 1 : 0.4 },
            ]}
            disabled={!draft.trim()}
            activeOpacity={0.8}
          >
            <Text style={co.saveText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Tarjeta de nota ───────────────────────────────────────────────────────────

function NoteCard({ note, ctx, onDelete }) {
  const { surface, ink, muted, border } = ctx;
  const litColor = Colors.liturgical[note.color] ?? Colors.border.default;

  return (
    <View
      style={[
        nc.card,
        { backgroundColor: surface, borderColor: border, borderLeftColor: litColor },
      ]}
    >
      {/* Cabecera */}
      <View style={nc.header}>
        <View style={nc.headerLeft}>
          <View style={[nc.colorDot, { backgroundColor: litColor }]} />
          <Text style={[nc.celebration, { color: litColor }]} numberOfLines={1}>
            {note.celebration ?? note.date}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          style={nc.deleteBtn}
          activeOpacity={0.6}
          hitSlop={12}
        >
          <IcoTrash c={muted} />
        </TouchableOpacity>
      </View>

      {/* Fecha */}
      {note.date ? (
        <Text style={[nc.date, { color: muted }]}>
          {note.weekday ? `${note.weekday} · ${note.date}` : note.date}
        </Text>
      ) : null}

      {/* Cuerpo */}
      <Text style={[nc.text, { color: ink }]}>{note.text}</Text>
    </View>
  );
}

// ── Tarjeta de marcador ───────────────────────────────────────────────────────

function BookmarkCard({ bookmark, ctx }) {
  const { surface, ink, muted, border } = ctx;
  const litColor = Colors.liturgical[bookmark.color] ?? Colors.brand.primary;

  return (
    <View
      style={[
        nc.card,
        { backgroundColor: surface, borderColor: border, borderLeftColor: litColor },
      ]}
    >
      <View style={nc.header}>
        <View style={nc.headerLeft}>
          <View style={[nc.colorDot, { backgroundColor: litColor }]} />
          <Text style={[nc.celebration, { color: litColor }]} numberOfLines={1}>
            {bookmark.name ?? 'Marcador'}
          </Text>
        </View>
        {bookmark.solemn ? (
          <View
            style={[
              nc.solemnPill,
              {
                borderColor: Colors.liturgical.gold + '60',
                backgroundColor: Colors.liturgical.gold + '15',
              },
            ]}
          >
            <Text style={[nc.solemnText, { color: Colors.liturgical.gold }]}>
              Solemnidad
            </Text>
          </View>
        ) : null}
      </View>

      {bookmark.date ? (
        <Text style={[nc.date, { color: muted }]}>{bookmark.date}</Text>
      ) : null}

      {bookmark.text ? (
        <Text style={[nc.text, { color: ink }]} numberOfLines={3}>
          {bookmark.text}
        </Text>
      ) : null}

      {bookmark.ref ? (
        <View style={[nc.refRow, { borderTopColor: border }]}>
          <IcoBookmark c={litColor} />
          <Text style={[nc.ref, { color: litColor }]}>{bookmark.ref}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── Estado vacío ──────────────────────────────────────────────────────────────

function EmptyState({ title, body, muted }) {
  return (
    <View style={em.wrap}>
      <Tau size={44} color={muted} style={{ opacity: 0.4, marginBottom: 16 }} />
      <Text style={[em.title, { color: muted }]}>{title}</Text>
      <Text style={[em.body, { color: muted }]}>{body}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  litBar: { flexDirection: 'row', height: 4 },
  litSeg: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 30,
    lineHeight: 34,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  newBtnText: { fontWeight: '700', fontSize: 13 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 14, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: { fontSize: 10, fontWeight: '700' },

  scroll: { flex: 1 },
  list: { padding: 16, gap: 10 },
  listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

// Compositor
const co = StyleSheet.create({
  wrap: { borderBottomWidth: 0.5, overflow: 'hidden' },
  stripe: { height: 3 },
  body: { padding: 16 },
  context: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  colorDot: { width: 7, height: 7, borderRadius: 999 },
  contextCelebration: { fontSize: 13, fontWeight: '700', flex: 1 },
  contextDate: { fontSize: 11, letterSpacing: 0.5, marginBottom: 12 },
  divider: { height: 0.5, marginBottom: 12 },
  input: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 17,
    lineHeight: 26,
    minHeight: 90,
    maxHeight: 200,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 0.5,
  },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  cancelText: { fontSize: 14 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 999 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// NoteCard / BookmarkCard
const nc = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderLeftWidth: 3.5,
    padding: 14,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  colorDot: { width: 7, height: 7, borderRadius: 999, flexShrink: 0 },
  celebration: { fontSize: 13, fontWeight: '700', flex: 1 },
  deleteBtn: { padding: 4 },
  date: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  text: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  solemnPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  solemnText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 0.5,
  },
  ref: { fontSize: 12, fontWeight: '600' },
});

// EmptyState
const em = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 40 },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
