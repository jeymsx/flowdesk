import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { useMusicStore } from '../../store/musicStore';
import { useUIStore } from '../../store/uiStore';

const STATIONS = [
  { id: '8nPOiusHRjc', title: 'Cozy Spring', emoji: '🌸' },
  { id: 'h8UpC5JbMU0', title: 'Nostalgia', emoji: '📼' },
  { id: 'JElyhCKzhWI', title: 'Vintage Jazz', emoji: '🎷' },
  { id: 'SllpB3W5f6s', title: 'Dark Academia', emoji: '📖' },
  { id: 'WPni755-Krg', title: 'Alpha Waves', emoji: '🧘' },
];

function parseYouTubeUrl(url) {
  try {
    const u = new URL(url.trim());
    const videoId =
      u.searchParams.get('v') ||
      (u.hostname === 'youtu.be' ? u.pathname.slice(1).split('?')[0] : null) ||
      (u.pathname.includes('/embed/') && !u.pathname.includes('videoseries')
        ? u.pathname.split('/embed/')[1]?.split('?')[0]
        : null) ||
      null;
    const listId = u.searchParams.get('list') || null;
    return { videoId: videoId || null, listId: listId || null };
  } catch {
    const videoMatch = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    const listMatch  = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return { videoId: videoMatch?.[1] ?? null, listId: listMatch?.[1] ?? null };
  }
}

export default function MusicWidget() {
  const { media, setMedia, iframeSlot, setIframeSlot, savedLinks, saveLink, removeLink, nextTrack, prevTrack } = useMusicStore(
    useShallow((s) => ({
      media: s.media, setMedia: s.setMedia,
      iframeSlot: s.iframeSlot, setIframeSlot: s.setIframeSlot,
      savedLinks: s.savedLinks, saveLink: s.saveLink, removeLink: s.removeLink,
      nextTrack: s.nextTrack, prevTrack: s.prevTrack,
    }))
  );
  const pushError = useUIStore((s) => s.pushError);

  // Which preset station dot is highlighted (local UI state)
  const [stationIdx, setStationIdx] = useState(() => {
    const m = useMusicStore.getState().media;
    if (!m || m.listId) return 0;
    const idx = STATIONS.findIndex((s) => s.id === m.videoId);
    return idx >= 0 ? idx : 0;
  });

  const slotRef   = useRef(null);
  const linkBtnRef = useRef(null);

  // Register/unregister this widget's video placeholder with the global player
  useEffect(() => {
    setIframeSlot(slotRef.current);
    return () => setIframeSlot(null);
  }, [setIframeSlot]);

  // If media was externally cleared (mini player closed), reset stationIdx
  useEffect(() => {
    if (!media && stationIdx === -1) setStationIdx(0);
  }, [media, stationIdx]);

  // ── Custom URL popover ─────────────────────────────────────────────────────
  const [showCustomInput, setShowCustomInput]   = useState(false);
  const [customUrl, setCustomUrl]               = useState('');
  const [customLabel, setCustomLabel]           = useState('');
  const [customInputPos, setCustomInputPos]     = useState({ left: 0, top: 0 });
  const [saving, setSaving]                     = useState(false);

  const calcCustomPos = useCallback(() => {
    const r = linkBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    const hasSaved = savedLinks.length > 0;
    const approxH  = 220 + (hasSaved ? Math.min(savedLinks.length * 52 + 36, 180) : 0);
    setCustomInputPos({
      left: Math.max(8, Math.min(r.right - 288, window.innerWidth - 296)),
      top:  Math.max(8, Math.min(r.bottom + 8, window.innerHeight - approxH)),
    });
  }, [savedLinks.length]);

  useEffect(() => {
    if (!showCustomInput) return;
    calcCustomPos();
    window.addEventListener('scroll', calcCustomPos, true);
    window.addEventListener('resize', calcCustomPos);
    return () => {
      window.removeEventListener('scroll', calcCustomPos, true);
      window.removeEventListener('resize', calcCustomPos);
    };
  }, [showCustomInput, calcCustomPos]);

  const closePopover = () => {
    setShowCustomInput(false);
    setCustomUrl('');
    setCustomLabel('');
  };

  const parsedInput   = customUrl.trim() ? parseYouTubeUrl(customUrl) : { videoId: null, listId: null };
  const hasContent    = customUrl.trim().length > 0;
  const isValidInput  = !!(parsedInput.videoId || parsedInput.listId);

  // Detect type for the helper hint
  const inputHint = !hasContent ? null
    : !isValidInput             ? { type: 'error',    text: 'Not a valid YouTube URL' }
    : parsedInput.videoId && parsedInput.listId ? { type: 'ok', text: 'Video + playlist detected' }
    : parsedInput.listId        ? { type: 'ok',   text: 'Playlist detected' }
    :                             { type: 'ok',   text: 'Video detected' };

  const handlePlay = () => {
    const { videoId, listId } = parseYouTubeUrl(customUrl);
    if (!videoId && !listId) {
      pushError('Invalid YouTube URL — paste a video or playlist link');
      return;
    }
    setMedia({ videoId, listId });
    setStationIdx(-1);
    closePopover();
  };

  const handleSaveAndPlay = async () => {
    const { videoId, listId } = parseYouTubeUrl(customUrl);
    if (!videoId && !listId) {
      pushError('Invalid YouTube URL — paste a video or playlist link');
      return;
    }
    const m = { videoId, listId };
    let label = customLabel.trim();
    if (!label && videoId) {
      setSaving(true);
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          label = data.title.trim().split(/\s+/).slice(0, 3).join(' ');
        }
      } catch {}
      setSaving(false);
    }
    saveLink(label || autoLabel(m), m);
    setMedia(m);
    setStationIdx(-1);
    closePopover();
  };

  const playLink = (link) => {
    setMedia(link.media);
    setStationIdx(-1);
    closePopover();
  };

  // ── Station controls ───────────────────────────────────────────────────────
  const isPlaylist = !!media?.listId;
  const isCustom   = stationIdx === -1;

  const changeStation = (delta) => {
    const newIdx = (stationIdx <= 0 ? 0 : stationIdx) + delta;
    const clamped = ((newIdx % STATIONS.length) + STATIONS.length) % STATIONS.length;
    setStationIdx(clamped);
    setMedia({ videoId: STATIONS[clamped].id, listId: null });
  };

  const goToStation = (i) => {
    setStationIdx(i);
    if (i !== -1) setMedia({ videoId: STATIONS[i].id, listId: null });
  };

  const handlePrev = () => isPlaylist ? prevTrack() : changeStation(-1);
  const handleNext = () => isPlaylist ? nextTrack() : changeStation(1);

  // Label for the dropdown when custom is active
  const customEmoji = media?.listId && !media?.videoId ? '📋' : '🔗';

  return (
    <div className="h-full flex flex-col p-3 gap-3 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Music
        </h3>

        <div className="flex items-center gap-1.5">
          <select
            value={stationIdx}
            onChange={(e) => goToStation(Number(e.target.value))}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isCustom && (
              <option value={-1} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                {customEmoji} Custom
              </option>
            )}
            {STATIONS.map((s, i) => (
              <option key={i} value={i} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                {s.emoji} {s.title}
              </option>
            ))}
          </select>

          <button
            ref={linkBtnRef}
            onClick={() => setShowCustomInput((v) => !v)}
            title="Custom YouTube URL or playlist"
            className={`p-1 rounded-lg transition-colors ${showCustomInput
              ? 'bg-accent-500/15 text-accent-500'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Custom URL popover ───────────────────────────────────────────────── */}
      {showCustomInput && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={closePopover}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 overflow-hidden"
            style={customInputPos}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">

              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Custom YouTube URL</h4>
                <button onClick={closePopover} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* URL input */}
              <div className="space-y-2">
                <div>
                  <input
                    autoFocus
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') closePopover(); if (e.key === 'Enter') handlePlay(); }}
                    placeholder="Paste a YouTube video or playlist URL…"
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                      inputHint?.type === 'error'
                        ? 'border-red-400 focus:ring-red-400/20'
                        : inputHint?.type === 'ok'
                        ? 'border-accent-400 focus:ring-accent-500/20'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-accent-500/20'
                    }`}
                  />
                  {inputHint && (
                    <p className={`text-[10px] mt-1 font-medium ${inputHint.type === 'error' ? 'text-red-500' : 'text-accent-500'}`}>
                      {inputHint.text}
                    </p>
                  )}
                </div>

                {/* Optional label (only shown when URL is valid) */}
                {isValidInput && (
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && closePopover()}
                    placeholder={`Label (optional) — e.g. "${autoLabel(parsedInput)}"`}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-colors"
                  />
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlay}
                    disabled={!hasContent}
                    className="flex-1 py-2 text-sm font-semibold bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white rounded-xl transition-colors"
                  >
                    Play
                  </button>
                  <button
                    onClick={handleSaveAndPlay}
                    disabled={!hasContent || saving || savedLinks.length >= 5}
                    title={savedLinks.length >= 5 ? 'Max 5 saved links' : 'Save this link and play'}
                    className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {saving ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                    {savedLinks.length >= 5 ? '5/5' : 'Save'}
                  </button>
                </div>
              </div>

              {/* ── Saved links ─────────────────────────────────────────────── */}
              {savedLinks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Saved</p>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {savedLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors"
                      >
                        <span className="text-sm shrink-0">
                          {link.media.listId && !link.media.videoId ? '📋' : '🔗'}
                        </span>
                        <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {link.label}
                        </span>
                        <button
                          onClick={() => playLink(link)}
                          title="Play"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-accent-500 hover:bg-accent-500/10 transition-all"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeLink(link.id)}
                          title="Remove"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Video placeholder (MusicPlayer overlays this exactly) ───────────── */}
      <div
        ref={slotRef}
        className="flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-900 dark:bg-black flex items-center justify-center"
      >
        {/* Shown only when nothing is playing */}
        {!media && (
          <div className="text-center px-4">
            <svg className="w-8 h-8 text-gray-600 dark:text-gray-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-600">Select a station or paste a URL to start</p>
          </div>
        )}
      </div>

      {/* ── Station controls ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title={isPlaylist ? 'Previous in playlist' : 'Previous station'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <div className="flex gap-1.5 items-center">
          {STATIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => goToStation(i)}
              title={s.title}
              className={`rounded-full transition-all duration-200 ${
                i === stationIdx
                  ? 'w-5 h-2 bg-accent-500'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
          {isCustom && (
            <div className="w-5 h-2 rounded-full bg-accent-500/60" title="Custom" />
          )}
        </div>

        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title={isPlaylist ? 'Next in playlist' : 'Next station'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

    </div>
  );
}

// Generate a sensible auto-label from parsed media
function autoLabel({ videoId, listId }) {
  if (listId && !videoId) return 'Playlist';
  if (videoId && listId) return 'Video + Playlist';
  return 'Video';
}
