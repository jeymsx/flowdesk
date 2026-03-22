import { create } from 'zustand';

const LS_KEY = 'fd_music_saved';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? []; } catch { return []; }
}
function persistSaved(links) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(links)); } catch {}
}

// Mutable ref to the live <iframe> element — used for postMessage playlist commands.
// Not reactive state; changes don't trigger re-renders.
export const musicIframeRef = { current: null };

export const useMusicStore = create((set, get) => ({
  media: null,        // { videoId: string|null, listId: string|null } | null
  autoplay: false,
  savedLinks: loadSaved(), // [{ id, label, media }]

  // The placeholder <div> inside MusicWidget where the player should visually live.
  // null = not on the dashboard → mini player mode.
  iframeSlot: null,

  setMedia: (media, autoplay = true) => set({ media, autoplay }),
  clearMedia: () => set({ media: null, autoplay: false }),
  setIframeSlot: (el) => set({ iframeSlot: el }),

  saveLink: (label, media) => {
    if (get().savedLinks.length >= 5) return;
    const link = { id: crypto.randomUUID(), label: label.trim() || 'Saved', media };
    const next = [...get().savedLinks, link];
    persistSaved(next);
    set({ savedLinks: next });
  },

  removeLink: (id) => {
    const next = get().savedLinks.filter((l) => l.id !== id);
    persistSaved(next);
    set({ savedLinks: next });
  },

  // Playlist navigation via YouTube IFrame API postMessage (requires enablejsapi=1)
  nextTrack: () => {
    musicIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'nextVideo', args: [] }), '*'
    );
  },
  prevTrack: () => {
    musicIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'previousVideo', args: [] }), '*'
    );
  },
}));
