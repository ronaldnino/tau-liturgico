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
import Svg, { Path, Rect, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../theme';

const { TextStyles } = Typography;
import { Tau } from '../components';
import { useSettingsStore, useNotesStore, useLiturgicalStore } from '../store';
import { TODAY, READINGS as STATIC_READINGS } from '../data/liturgical';

// ── Iconos ────────────────────────────────────────────────────────────────────

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

function IcoChevron({ c, size = 14, up = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcoBook({ c, size = 13 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke={c}
        strokeWidth={1.8}
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

// LitBar usa liturgicalUI para que white (#C8A84B) sea visible
const LIT_BAR_COLORS = Object.values(Colors.liturgicalUI);

const _TYPE_SHORT = {
  'Primera Lectura': '1ª Lectura',
  'Salmo Responsorial': 'Salmo',
  'Santo Evangelio': 'Evangelio',
};

function _todayMeta() {
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
      {LIT_BAR_COLORS.map((c) => (
        <View key={c} style={[s.litSeg, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { darkMode } = useSettingsStore();
  const { notes, bookmarks, addNote, deleteNote } = useNotesStore();
  const { readings: storeReadings } = useLiturgicalStore();
  const dark = darkMode === 'dark' || (darkMode === 'auto' && scheme === 'dark');

  const bg = dark ? Colors.dark.bg : Colors.surface.secondary;
  const surface = dark ? Colors.dark.surface : Colors.surface.primary;
  const ink = dark ? Colors.dark.ink : Colors.ink.primary;
  const muted = dark ? Colors.dark.inkMuted : Colors.ink.muted;
  const border = dark ? Colors.dark.border : Colors.border.default;

  const [activeTab, setActiveTab] = useState(0);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');

  const todayReadings = storeReadings?.length ? storeReadings : STATIC_READINGS;

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
    addNote({
      ..._todayMeta(),
      text: draft.trim(),
      readings: todayReadings.map((r) => ({
        type: r.type,
        ref: r.ref,
        intro: r.intro ?? null,
        response: r.response ?? null,
        text: r.text,
        closing: r.closing ?? null,
      })),
    });
    closeComposer();
  };

  const confirmDelete = (id) =>
    Alert.alert('Eliminar nota', '¿Eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteNote(id) },
    ]);

  const ctx = { surface, ink, muted, border, dark };

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
          readings={todayReadings}
          ctx={ctx}
        />
      )}

      {/* ── Lista ──────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.list,
          { paddingBottom: insets.bottom + 32 },
          notes.length === 0 && activeTab === 0 && !composing && s.listEmpty,
          bookmarks.length === 0 && activeTab === 1 && s.listEmpty,
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

function Composer({ draft, setDraft, onSave, onCancel, readings, ctx }) {
  const { surface, ink, muted, border } = ctx;
  const meta = _todayMeta();
  const litColor = Colors.liturgicalUI[meta.color] ?? Colors.liturgicalUI.green;

  return (
    <View style={[co.wrap, { backgroundColor: surface, borderBottomColor: border }]}>
      {/* Franja litúrgica */}
      <View style={[co.stripe, { backgroundColor: litColor }]} />

      <View style={co.body}>
        {/* Contexto litúrgico */}
        <View style={co.contextRow}>
          <View style={[co.colorDot, { backgroundColor: litColor }]} />
          <Text style={[co.celebration, { color: litColor }]} numberOfLines={1}>
            {meta.celebration}
          </Text>
        </View>
        <Text style={[co.date, { color: muted }]}>
          {meta.weekday} · {meta.date}
        </Text>

        {/* Lecturas vinculadas — un solo bloque condicional */}
        {readings?.length > 0 && (
          <View style={co.readingsBlock}>
            <View style={co.readingsLabelRow}>
              <IcoBook c={muted} size={11} />
              <Text style={[co.readingsLabel, { color: muted }]}>
                Lecturas vinculadas
              </Text>
            </View>
            {readings.map((r) => (
              <View
                key={r.type}
                style={[co.readingRow, { borderLeftColor: litColor + '70' }]}
              >
                <Text style={[co.readingRowType, { color: litColor }]}>
                  {_TYPE_SHORT[r.type] ?? r.type}
                </Text>
                <Text style={[co.readingRowRef, { color: muted }]} numberOfLines={1}>
                  {r.ref}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={[co.divider, { backgroundColor: border }]} />

        {/* Campo de texto */}
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

// ── Sección de lecturas (colapsable) ─────────────────────────────────────────

function ReadingsSection({ readings, litColor, ctx }) {
  const { ink, muted, border } = ctx;
  const [expanded, setExpanded] = useState(false);
  const [openIdx, setOpenIdx] = useState(null);

  if (!readings?.length) return null;

  return (
    <View style={[rd.wrap, { borderTopColor: border }]}>
      {/* Cabecera — toca para expandir/colapsar la sección */}
      <TouchableOpacity
        style={rd.header}
        onPress={() => {
          setExpanded((v) => !v);
          setOpenIdx(null);
        }}
        activeOpacity={0.7}
        hitSlop={8}
      >
        <IcoBook c={litColor} size={13} />
        <Text style={[rd.headerLabel, { color: litColor }]}>Lecturas del día</Text>
        <View style={rd.headerTypes}>
          {readings.map((r, i) => (
            <Text key={r.type} style={[rd.headerType, { color: muted }]}>
              {i > 0 ? '· ' : ''}
              {_TYPE_SHORT[r.type] ?? r.type}
            </Text>
          ))}
        </View>
        <IcoChevron c={litColor} size={13} up={expanded} />
      </TouchableOpacity>

      {/* Lista de lecturas expandida */}
      {expanded && (
        <View style={[rd.list, { borderTopColor: border }]}>
          {readings.map((r, i) => {
            const open = openIdx === i;
            return (
              <View
                key={r.type}
                style={[
                  rd.reading,
                  i > 0 && { borderTopColor: border, borderTopWidth: 0.5 },
                ]}
              >
                {/* Fila del título — toca para ver el texto */}
                <TouchableOpacity
                  style={rd.readingHeader}
                  onPress={() => setOpenIdx(open ? null : i)}
                  activeOpacity={0.7}
                >
                  <View style={rd.readingMeta}>
                    <Text style={[rd.readingType, { color: muted }]}>
                      {_TYPE_SHORT[r.type] ?? r.type}
                    </Text>
                    <Text style={[rd.readingRef, { color: ink }]}>{r.ref}</Text>
                  </View>
                  <IcoChevron c={muted} size={12} up={open} />
                </TouchableOpacity>

                {/* Texto completo */}
                {open && (
                  <View style={rd.readingBody}>
                    {r.intro ? (
                      <Text style={[rd.intro, { color: muted }]}>{r.intro}</Text>
                    ) : null}
                    {r.response ? (
                      <Text style={[rd.response, { color: litColor }]}>
                        R. {r.response}
                      </Text>
                    ) : null}
                    <Text style={[rd.bodyText, { color: ink }]}>{r.text}</Text>
                    {r.closing ? (
                      <Text style={[rd.closing, { color: muted }]}>{r.closing}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Tarjeta de nota ───────────────────────────────────────────────────────────

function NoteCard({ note, ctx, onDelete }) {
  const { surface, ink, muted, border } = ctx;
  const litColor = Colors.liturgicalUI[note.color] ?? Colors.liturgicalUI.green;

  return (
    <View
      style={[
        nc.card,
        { backgroundColor: surface, borderColor: border, borderLeftColor: litColor },
      ]}
    >
      {/* Cabecera: celebración + borrar */}
      <View style={nc.header}>
        <View style={nc.headerLeft}>
          <View style={[nc.dot, { backgroundColor: litColor }]} />
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

      {/* Reflexión */}
      <Text style={[nc.text, { color: ink }]}>{note.text}</Text>

      {/* Lecturas vinculadas */}
      {note.readings?.length > 0 && (
        <ReadingsSection readings={note.readings} litColor={litColor} ctx={ctx} />
      )}
    </View>
  );
}

// ── Tarjeta de marcador ───────────────────────────────────────────────────────

function BookmarkCard({ bookmark, ctx }) {
  const { surface, ink, muted, border } = ctx;
  const litColor = Colors.liturgicalUI[bookmark.color] ?? Colors.liturgicalUI.green;

  return (
    <View
      style={[
        nc.card,
        { backgroundColor: surface, borderColor: border, borderLeftColor: litColor },
      ]}
    >
      <View style={nc.header}>
        <View style={nc.headerLeft}>
          <View style={[nc.dot, { backgroundColor: litColor }]} />
          <Text style={[nc.celebration, { color: litColor }]} numberOfLines={1}>
            {bookmark.name ?? 'Marcador'}
          </Text>
        </View>
        {bookmark.solemn && (
          <View
            style={[
              nc.solemnPill,
              {
                borderColor: Colors.liturgicalUI.gold + '60',
                backgroundColor: Colors.liturgicalUI.gold + '15',
              },
            ]}
          >
            <Text style={[nc.solemnText, { color: Colors.liturgicalUI.gold }]}>
              Solemnidad
            </Text>
          </View>
        )}
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

// ── Estilos: pantalla principal ───────────────────────────────────────────────

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
  newBtnText: { ...TextStyles.buttonSm },
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
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

// ── Estilos: compositor ───────────────────────────────────────────────────────

const co = StyleSheet.create({
  wrap: { borderBottomWidth: 0.5, overflow: 'hidden' },
  stripe: { height: 3 },
  body: { padding: 16, gap: 0 },

  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  colorDot: { width: 7, height: 7, borderRadius: 999, flexShrink: 0 },
  celebration: { fontSize: 13, fontWeight: '700', flex: 1 },
  date: { fontSize: 11, letterSpacing: 0.4, marginBottom: 12 },

  readingsBlock: { marginBottom: 12, gap: 6 },
  readingsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readingsLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 10,
    paddingVertical: 3,
    borderLeftWidth: 2,
  },
  readingRowType: { fontSize: 11, fontWeight: '700', minWidth: 78 },
  readingRowRef: { fontSize: 11, flex: 1 },

  divider: { height: 0.5, marginBottom: 12 },
  input: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 17,
    lineHeight: 26,
    minHeight: 90,
    maxHeight: 180,
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
  saveText: { ...TextStyles.buttonSm, fontSize: 14, color: '#fff' },
});

// ── Estilos: tarjetas (nota y marcador) ───────────────────────────────────────

const nc = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderLeftWidth: 3.5,
    padding: 14,
    gap: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 999, flexShrink: 0 },
  celebration: { fontSize: 13, fontWeight: '700', flex: 1 },
  deleteBtn: { padding: 4, marginLeft: 8 },
  date: {
    ...TextStyles.eyebrow,
    fontSize: 10,
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
    marginTop: 2,
    borderTopWidth: 0.5,
  },
  ref: { fontSize: 12, fontWeight: '600' },
});

// ── Estilos: sección de lecturas ─────────────────────────────────────────────

const rd = StyleSheet.create({
  wrap: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  headerTypes: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  headerType: { fontSize: 10 },

  list: {
    marginTop: 10,
    paddingTop: 4,
    borderTopWidth: 0.5,
  },
  reading: { paddingVertical: 10 },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  readingMeta: { flex: 1, gap: 2 },
  readingType: {
    ...TextStyles.eyebrow,
    fontSize: 9,
  },
  readingRef: { fontSize: 13, fontWeight: '600' },

  readingBody: { marginTop: 10, gap: 6 },
  intro: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 13,
    lineHeight: 20,
  },
  response: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 14,
    lineHeight: 21,
  },
  bodyText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 15,
    lineHeight: 24,
  },
  closing: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 13,
    lineHeight: 20,
  },
});

// ── Estilos: estado vacío ─────────────────────────────────────────────────────

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
