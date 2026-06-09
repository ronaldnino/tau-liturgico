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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useSettingsStore, useNotesStore } from '../store';

const TABS = ['Notas', 'Marcadores'];

const LIT_BORDER = {
  white:  Colors.liturgical.white,
  red:    Colors.liturgical.red,
  green:  Colors.liturgical.green,
  purple: Colors.liturgical.purple,
  gold:   Colors.liturgical.gold,
};

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const { notes, bookmarks, addNote, deleteNote } = useNotesStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');

  const bg      = dark ? Colors.dark.bg      : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink     = dark ? Colors.dark.ink     : Colors.ink.primary;
  const muted   = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border  = dark ? Colors.dark.border  : Colors.border.default;

  const [activeTab, setActiveTab] = useState(0);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');

  const saveNote = () => {
    if (!draft.trim()) return;
    addNote({
      id: Date.now().toString(),
      text: draft.trim(),
      date: 'Miércoles, 7 may',
      litColor: 'red',
    });
    setDraft('');
    setComposing(false);
  };

  const confirmDelete = (id) => {
    Alert.alert('Eliminar nota', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteNote(id) },
    ]);
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: border }]}>
        <Text style={[s.title, { color: ink }]}>Notas</Text>
        {activeTab === 0 && (
          <TouchableOpacity
            onPress={() => setComposing(true)}
            style={[s.addBtn, { backgroundColor: Colors.brand.primary }]}
          >
            <Text style={s.addBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { borderBottomColor: border }]}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === i && { borderBottomColor: Colors.brand.primary }]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[s.tabText, { color: activeTab === i ? Colors.brand.primary : muted }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Composer */}
      {composing && activeTab === 0 && (
        <View style={[s.composer, { backgroundColor: surface, borderBottomColor: border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            autoFocus
            placeholder="Escribe una nota…"
            placeholderTextColor={muted}
            style={[s.composerInput, { color: ink }]}
          />
          <View style={s.composerActions}>
            <TouchableOpacity onPress={() => { setComposing(false); setDraft(''); }}>
              <Text style={[s.composerCancel, { color: muted }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveNote}
              style={[s.composerSave, { backgroundColor: Colors.brand.primary, opacity: draft.trim() ? 1 : 0.4 }]}
              disabled={!draft.trim()}
            >
              <Text style={s.composerSaveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: insets.bottom + 24 },
          notes.length === 0 && activeTab === 0 && s.emptyContainer,
          bookmarks.length === 0 && activeTab === 1 && s.emptyContainer,
        ]}
      >
        {activeTab === 0 ? (
          notes.length === 0 ? (
            <EmptyState
              icon="📝"
              title="Sin notas aún"
              body="Toca «+ Nueva» para escribir tu primera nota litúrgica."
              muted={muted}
            />
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                surface={surface}
                ink={ink}
                muted={muted}
                border={border}
                onDelete={() => confirmDelete(note.id)}
              />
            ))
          )
        ) : bookmarks.length === 0 ? (
          <EmptyState
            icon="🔖"
            title="Sin marcadores"
            body="Marca lecturas desde la pantalla de Lecturas."
            muted={muted}
          />
        ) : (
          bookmarks.map((bm) => (
            <BookmarkCard
              key={bm.id}
              bookmark={bm}
              surface={surface}
              ink={ink}
              muted={muted}
              border={border}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function NoteCard({ note, surface, ink, muted, border, onDelete }) {
  const borderColor = LIT_BORDER[note.litColor] || Colors.border.default;
  return (
    <View
      style={[
        s.noteCard,
        {
          backgroundColor: surface,
          borderColor: border,
          borderLeftColor: borderColor,
        },
      ]}
    >
      <View style={s.noteHeader}>
        <Text style={[s.noteDate, { color: muted }]}>{note.date}</Text>
        <TouchableOpacity onPress={onDelete} style={s.deleteBtn}>
          <Text style={{ color: muted, fontSize: 16 }}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={[s.noteText, { color: ink }]}>{note.text}</Text>
    </View>
  );
}

function BookmarkCard({ bookmark, surface, ink, muted, border }) {
  return (
    <View style={[s.noteCard, { backgroundColor: surface, borderColor: border, borderLeftColor: Colors.brand.primary }]}>
      <Text style={[s.noteDate, { color: muted }]}>{bookmark.date}</Text>
      <Text style={[s.noteText, { color: ink }]} numberOfLines={2}>
        {bookmark.text}
      </Text>
      <Text style={[s.bmRef, { color: Colors.brand.primary }]}>{bookmark.ref}</Text>
    </View>
  );
}

function EmptyState({ icon, title, body, muted }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={[s.emptyTitle, { color: muted }]}>{title}</Text>
      <Text style={[s.emptyBody, { color: muted }]}>{body}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  title: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 28,
    lineHeight: 32,
  },
  addBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  tabs: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontWeight: '600', fontSize: 14 },

  composer: {
    padding: 16,
    borderBottomWidth: 0.5,
  },
  composerInput: {
    fontSize: 15,
    lineHeight: 23,
    minHeight: 72,
    fontFamily: 'CormorantGaramond-Medium',
    marginBottom: 10,
  },
  composerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center' },
  composerCancel: { fontSize: 14, padding: 8 },
  composerSave: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  composerSaveText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  noteCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderLeftWidth: 3,
    padding: 14,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  noteDate:   { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  deleteBtn:  { padding: 2 },
  noteText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  bmRef: { fontSize: 12, fontWeight: '600', marginTop: 6 },

  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'CormorantGaramond-SemiBoldItalic', textAlign: 'center' },
  emptyBody:  { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 240 },
});
