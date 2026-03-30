import { create } from 'zustand';
import {
  fetchMusicLinks,
  createMusicLink as createMusicLinkService,
  deleteMusicLink as deleteMusicLinkService,
} from '../services/musicLinks';

const LS_KEY = 'fd_music_saved';
const DEFAULT_PROVIDER = 'youtube';
const MAX_SAVED_LINKS_PER_PROVIDER = 5;

function loadSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_KEY)) ?? [];
    return Array.isArray(parsed) ? parsed.map(normalizeLocalLink).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function persistSaved(links) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(links)); } catch {}
}

function normalizeMedia(media) {
  if (!media || typeof media !== 'object') return null;

  const provider = media.provider || (media.spotifyId || media.spotifyType ? 'spotify' : 'youtube');
  return {
    provider,
    videoId: media.videoId || null,
    listId: media.listId || null,
    spotifyType: media.spotifyType || null,
    spotifyId: media.spotifyId || null,
    label: media.label || null,
  };
}

function normalizeLocalLink(link) {
  if (!link || typeof link !== 'object') return null;
  const media = normalizeMedia(link.media);
  if (!media) return null;
  return {
    id: link.id || crypto.randomUUID(),
    label: link.label || 'Saved',
    media,
  };
}

function normalizeRemoteLink(row) {
  return {
    id: row.id,
    label: row.label,
    media: normalizeMedia({
      provider: row.provider,
      videoId: row.video_id,
      listId: row.list_id,
      spotifyType: row.spotify_type,
      spotifyId: row.spotify_id,
    }),
  };
}

function createLinkKey(link) {
  return [
    link.media?.provider || DEFAULT_PROVIDER,
    link.label?.trim().toLowerCase() || '',
    link.media?.videoId || '',
    link.media?.listId || '',
    link.media?.spotifyType || '',
    link.media?.spotifyId || '',
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

function limitLinksPerProvider(links) {
  const counts = new Map();
  return links.filter((link) => {
    const provider = link.media?.provider || DEFAULT_PROVIDER;
    const count = counts.get(provider) || 0;
    if (count >= MAX_SAVED_LINKS_PER_PROVIDER) return false;
    counts.set(provider, count + 1);
    return true;
  });
}

function mergeLinks(remoteLinks, localLinks) {
  return limitLinksPerProvider(dedupeLinks([...remoteLinks, ...localLinks]));
}

// Mutable ref to the live <iframe> element; used for player postMessage commands.
export const musicIframeRef = { current: null };

export const useMusicStore = create((set, get) => ({
  provider: DEFAULT_PROVIDER,
  media: null,
  autoplay: false,
  savedLinks: loadSaved(),
  loadingSavedLinks: false,
  _userId: null,
  _loaded: false,
  iframeSlot: null,

  reset: () => set({
    provider: DEFAULT_PROVIDER,
    media: null,
    autoplay: false,
    savedLinks: loadSaved(),
    loadingSavedLinks: false,
    _userId: null,
    _loaded: false,
    iframeSlot: null,
  }),

  setProvider: (provider) => set({
    provider,
    media: null,
    autoplay: false,
  }),

  loadSavedLinks: async (userId) => {
    if (!userId) {
      set({
        savedLinks: loadSaved(),
        loadingSavedLinks: false,
        _userId: null,
        _loaded: true,
      });
      return;
    }

    if (get()._userId === userId && get()._loaded) return;

    const localLinks = loadSaved();
    set({ loadingSavedLinks: true, _userId: userId });

    try {
      const remoteRows = await fetchMusicLinks(userId);
      let next = remoteRows.map(normalizeRemoteLink).filter((link) => link.media);

      if (next.length === 0 && localLinks.length > 0) {
        const seededRows = [];
        for (const link of localLinks) {
          const created = await createMusicLinkService(userId, link.label, link.media);
          seededRows.push(normalizeRemoteLink(created));
        }
        next = seededRows;
      } else if (localLinks.length > 0) {
        const merged = mergeLinks(next, localLinks);
        const missingLocal = merged.filter(
          (link) => !next.some((remote) => createLinkKey(remote) === createLinkKey(link))
        );

        if (missingLocal.length > 0) {
          const createdRows = [];
          for (const link of missingLocal) {
            const created = await createMusicLinkService(userId, link.label, link.media);
            createdRows.push(normalizeRemoteLink(created));
          }
          next = mergeLinks(next, createdRows);
        }
      }

      persistSaved(next);
      set({ savedLinks: next, loadingSavedLinks: false, _loaded: true });
    } catch {
      set({ savedLinks: localLinks, loadingSavedLinks: false, _loaded: true });
    }
  },

  setMedia: (media, autoplay = true) => {
    const nextMedia = normalizeMedia(media);
    if (!nextMedia) return;
    set({ media: nextMedia, autoplay, provider: nextMedia.provider || DEFAULT_PROVIDER });
  },

  clearMedia: () => set({ media: null, autoplay: false }),
  setIframeSlot: (el) => set({ iframeSlot: el }),

  saveLink: async (label, media) => {
    const normalizedMedia = normalizeMedia(media);
    if (!normalizedMedia) return;

    const providerLinks = get().savedLinks.filter((link) => link.media.provider === normalizedMedia.provider);
    if (providerLinks.length >= MAX_SAVED_LINKS_PER_PROVIDER) return;

    const trimmedLabel = label.trim() || 'Saved';
    let link = { id: crypto.randomUUID(), label: trimmedLabel, media: normalizedMedia };

    if (get()._userId) {
      try {
        const created = await createMusicLinkService(get()._userId, trimmedLabel, normalizedMedia);
        link = normalizeRemoteLink(created);
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
    const { media } = get();
    if (media?.provider !== 'youtube' || !media?.listId) return;
    musicIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'nextVideo', args: [] }),
      '*'
    );
  },

  prevTrack: () => {
    const { media } = get();
    if (media?.provider !== 'youtube' || !media?.listId) return;
    musicIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'previousVideo', args: [] }),
      '*'
    );
  },
}));
