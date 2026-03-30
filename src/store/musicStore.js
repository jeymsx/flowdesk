import { create } from 'zustand';
import {
  fetchMusicLinks,
  createMusicLink as createMusicLinkService,
  deleteMusicLink as deleteMusicLinkService,
} from '../services/musicLinks';

const LS_KEY = 'fd_music_saved';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? []; } catch { return []; }
}

function persistSaved(links) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(links)); } catch {}
}

function normalizeLink(row) {
  return {
    id: row.id,
    label: row.label,
    media: {
      videoId: row.video_id || null,
      listId: row.list_id || null,
    },
  };
}

function createLinkKey(link) {
  return [
    link.label?.trim().toLowerCase() || '',
    link.media?.videoId || '',
    link.media?.listId || '',
  ].join('|');
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    const key = createLinkKey(link);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Mutable ref to the live <iframe> element; used for postMessage playlist commands.
// Not reactive state; changes don't trigger re-renders.
export const musicIframeRef = { current: null };

export const useMusicStore = create((set, get) => ({
  media: null,
  autoplay: false,
  savedLinks: loadSaved(),
  loadingSavedLinks: false,
  _userId: null,
  _loaded: false,

  // The placeholder <div> inside MusicWidget where the player should visually live.
  // null = not on the dashboard; mini player mode.
  iframeSlot: null,

  reset: () => set({
    media: null,
    autoplay: false,
    savedLinks: loadSaved(),
    loadingSavedLinks: false,
    _userId: null,
    _loaded: false,
    iframeSlot: null,
  }),

  loadSavedLinks: async (userId) => {
    if (!userId) {
      set({ savedLinks: loadSaved(), loadingSavedLinks: false, _userId: null, _loaded: true });
      return;
    }
    if (get()._userId === userId && get()._loaded) return;

    const localLinks = loadSaved().slice(0, 5);
    set({ loadingSavedLinks: true, _userId: userId });

    try {
      const remoteRows = await fetchMusicLinks(userId);
      let next = remoteRows.map(normalizeLink);

      // Bootstrap older local-only saved links into the account the first time.
      if (next.length === 0 && localLinks.length > 0) {
        const seededRows = [];
        for (const link of localLinks) {
          const created = await createMusicLinkService(userId, link.label, link.media);
          seededRows.push(normalizeLink(created));
        }
        next = seededRows;
      } else if (localLinks.length > 0 && next.length < 5) {
        const merged = dedupeLinks([...next, ...localLinks]).slice(0, 5);
        const missingLocal = merged.filter(
          (link) => !next.some((remote) => createLinkKey(remote) === createLinkKey(link))
        );

        if (missingLocal.length > 0) {
          const createdRows = [];
          for (const link of missingLocal) {
            const created = await createMusicLinkService(userId, link.label, link.media);
            createdRows.push(normalizeLink(created));
          }
          next = dedupeLinks([...next, ...createdRows]).slice(0, 5);
        }
      }

      persistSaved(next);
      set({ savedLinks: next, loadingSavedLinks: false, _loaded: true });
    } catch {
      set({ savedLinks: localLinks, loadingSavedLinks: false, _loaded: true });
    }
  },

  setMedia: (media, autoplay = true) => set({ media, autoplay }),
  clearMedia: () => set({ media: null, autoplay: false }),
  setIframeSlot: (el) => set({ iframeSlot: el }),

  saveLink: async (label, media) => {
    if (get().savedLinks.length >= 5) return;

    const trimmedLabel = label.trim() || 'Saved';
    let link = { id: crypto.randomUUID(), label: trimmedLabel, media };

    if (get()._userId) {
      try {
        const created = await createMusicLinkService(get()._userId, trimmedLabel, media);
        link = normalizeLink(created);
      } catch {}
    }

    const next = [...get().savedLinks, link];
    persistSaved(next);
    set({ savedLinks: next });
  },

  removeLink: async (id) => {
    if (get()._userId) {
      try {
        await deleteMusicLinkService(id, get()._userId);
      } catch {}
    }

    const next = get().savedLinks.filter((link) => link.id !== id);
    persistSaved(next);
    set({ savedLinks: next });
  },

  nextTrack: () => {
    musicIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'nextVideo', args: [] }),
      '*'
    );
  },

  prevTrack: () => {
    musicIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'previousVideo', args: [] }),
      '*'
    );
  },
}));
