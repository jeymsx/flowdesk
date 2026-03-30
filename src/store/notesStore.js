import { create } from 'zustand';
import { fetchNotes, createNote, updateNote, deleteNote } from '../services/notes';

let saveTimer = null;
let savedTimer = null;

function clearTimers() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (savedTimer) {
    clearTimeout(savedTimer);
    savedTimer = null;
  }
}

function notesEqual(note, draftTitle, draftContent, draftTags) {
  if (!note) return true;
  return (
    (note.title || '') === draftTitle &&
    (note.content || '') === draftContent &&
    JSON.stringify(note.tags || []) === JSON.stringify(draftTags || [])
  );
}

async function performSave(set, get) {
  const { activeNoteId, draftTitle, draftContent, draftTags, _userId, notes } = get();
  if (!activeNoteId || !_userId) return;

  const note = notes.find((entry) => entry.id === activeNoteId);
  if (!note || notesEqual(note, draftTitle, draftContent, draftTags)) return;

  set({ isSaving: true });
  try {
    const updated = await updateNote(
      activeNoteId,
      { title: draftTitle, content: draftContent, tags: draftTags },
      _userId
    );
    set((state) => ({
      notes: state.notes.map((entry) => (entry.id === updated.id ? updated : entry)),
      isSaving: false,
      savedRecently: true,
    }));
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => set({ savedRecently: false }), 2000);
  } catch (err) {
    console.error('Note save failed:', err);
    set({ isSaving: false });
  }
}

function scheduleSave(set, get) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    performSave(set, get);
  }, 1000);
}

export const useNotesStore = create((set, get) => ({
  notes: [],
  loading: false,
  activeNoteId: null,
  draftTitle: '',
  draftContent: '',
  draftTags: [],
  isSaving: false,
  savedRecently: false,
  isNotesPopped: false,
  _userId: null,
  _loaded: false,

  reset: () => {
    clearTimers();
    set({
      notes: [],
      loading: false,
      activeNoteId: null,
      draftTitle: '',
      draftContent: '',
      draftTags: [],
      isSaving: false,
      savedRecently: false,
      isNotesPopped: false,
      _userId: null,
      _loaded: false,
    });
  },

  loadNotes: async (userId) => {
    if (!userId) return;
    if (get()._loaded && get()._userId === userId) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchNotes(userId);
      set({ notes: data, loading: false, _loaded: true });
    } catch {
      set({ loading: false, _loaded: true });
    }
  },

  openNote: (note) => {
    if (!note) return;
    clearTimers();
    set({
      activeNoteId: note.id,
      draftTitle: note.title || '',
      draftContent: note.content || '',
      draftTags: note.tags || [],
      isSaving: false,
      savedRecently: false,
    });
  },

  createAndOpenNote: async () => {
    const { _userId, notes } = get();
    if (!_userId) return null;

    const blank = notes.find((entry) => !entry.title && !entry.content && !(entry.tags?.length));
    if (blank) {
      get().openNote(blank);
      return blank;
    }

    try {
      const note = await createNote(_userId, '', '', []);
      set((state) => ({ notes: [note, ...state.notes] }));
      get().openNote(note);
      return note;
    } catch (err) {
      console.error('Create note failed:', err);
      return null;
    }
  },

  closeActiveNote: async () => {
    await get().saveActiveNote();
    clearTimers();
    set({
      activeNoteId: null,
      draftTitle: '',
      draftContent: '',
      draftTags: [],
      isSaving: false,
      savedRecently: false,
    });
  },

  updateDraft: (updates) => {
    set((state) => ({
      draftTitle: updates.title ?? state.draftTitle,
      draftContent: updates.content ?? state.draftContent,
      draftTags: updates.tags ?? state.draftTags,
      savedRecently: false,
    }));
    if (get().activeNoteId) scheduleSave(set, get);
  },

  saveActiveNote: async () => {
    clearTimeout(saveTimer);
    saveTimer = null;
    await performSave(set, get);
  },

  deleteNote: async (id) => {
    const { _userId, activeNoteId } = get();
    if (!_userId || !id) return;
    try {
      await deleteNote(id, _userId);
      clearTimers();
      set((state) => ({
        notes: state.notes.filter((entry) => entry.id !== id),
        ...(activeNoteId === id
          ? {
              activeNoteId: null,
              draftTitle: '',
              draftContent: '',
              draftTags: [],
              isSaving: false,
              savedRecently: false,
              isNotesPopped: false,
            }
          : {}),
      }));
    } catch {}
  },

  setNotesPopped: (value) => set({ isNotesPopped: value }),
}));
