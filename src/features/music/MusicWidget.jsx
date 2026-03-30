import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { useMusicStore } from '../../store/musicStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

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
    return { provider: 'youtube', videoId: videoId || null, listId: listId || null };
  } catch {
    const videoMatch = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return {
      provider: 'youtube',
      videoId: videoMatch?.[1] ?? null,
      listId: listMatch?.[1] ?? null,
    };
  }
}

function parseSpotifyUrl(url) {
  const input = url.trim();
  if (!input) return { provider: 'spotify', spotifyType: null, spotifyId: null };

  const uriMatch = input.match(/^spotify:(track|album|playlist|episode):([a-zA-Z0-9]+)$/i);
  if (uriMatch) {
    return {
      provider: 'spotify',
      spotifyType: uriMatch[1].toLowerCase(),
      spotifyId: uriMatch[2],
    };
  }

  try {
    const u = new URL(input);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'open.spotify.com') {
      return { provider: 'spotify', spotifyType: null, spotifyId: null };
    }

    const parts = u.pathname.split('/').filter(Boolean);
    let idx = 0;
    if (parts[0] === 'embed') idx = 1;
    const spotifyType = parts[idx];
    const spotifyId = parts[idx + 1]?.split('?')[0] || null;

    if (!['track', 'album', 'playlist', 'episode'].includes(spotifyType) || !spotifyId) {
      return { provider: 'spotify', spotifyType: null, spotifyId: null };
    }

    return {
      provider: 'spotify',
      spotifyType,
      spotifyId,
    };
  } catch {
    return { provider: 'spotify', spotifyType: null, spotifyId: null };
  }
}

function autoLabel(media) {
  if (media.provider === 'spotify') {
    if (media.spotifyType === 'playlist') return 'Spotify Playlist';
    if (media.spotifyType === 'album') return 'Spotify Album';
    if (media.spotifyType === 'episode') return 'Spotify Episode';
    return 'Spotify Track';
  }

  if (media.listId && !media.videoId) return 'Playlist';
  if (media.videoId && media.listId) return 'Video + Playlist';
  return 'Video';
}

function getSavedIcon(media) {
  if (media.provider === 'spotify') return '🎵';
  if (media.listId && !media.videoId) return '📋';
  return '🔗';
}

function getSpotifyHelperText() {
  return 'Spotify embeds may require an active Spotify web session and can still be preview-limited.';
}

function buildSpotifyShareUrl({ spotifyType, spotifyId }) {
  if (!spotifyType || !spotifyId) return null;
  return `https://open.spotify.com/${spotifyType}/${spotifyId}`;
}

export default function MusicWidget() {
  const {
    provider,
    setProvider,
    media,
    setMedia,
    clearMedia,
    setIframeSlot,
    savedLinks,
    saveLink,
    removeLink,
    nextTrack,
    prevTrack,
    loadSavedLinks,
  } = useMusicStore(
    useShallow((s) => ({
      provider: s.provider,
      setProvider: s.setProvider,
      media: s.media,
      setMedia: s.setMedia,
      clearMedia: s.clearMedia,
      setIframeSlot: s.setIframeSlot,
      savedLinks: s.savedLinks,
      saveLink: s.saveLink,
      removeLink: s.removeLink,
      nextTrack: s.nextTrack,
      prevTrack: s.prevTrack,
      loadSavedLinks: s.loadSavedLinks,
    }))
  );
  const pushError = useUIStore((s) => s.pushError);
  const user = useAuthStore((s) => s.user);

  const [stationIdx, setStationIdx] = useState(() => {
    const current = useMusicStore.getState().media;
    if (!current || current.provider !== 'youtube') return null;
    if (current.listId) return -1;
    const idx = STATIONS.findIndex((entry) => entry.id === current.videoId);
    return idx >= 0 ? idx : 0;
  });

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customInputPos, setCustomInputPos] = useState({ left: 0, top: 0 });
  const [saving, setSaving] = useState(false);

  const slotRef = useRef(null);
  const linkBtnRef = useRef(null);

  const isYouTube = provider === 'youtube';
  const savedLinksForProvider = savedLinks.filter((link) => link.media.provider === provider);

  useEffect(() => {
    setIframeSlot(slotRef.current);
    return () => setIframeSlot(null);
  }, [setIframeSlot]);

  useEffect(() => {
    loadSavedLinks(user?.id ?? null);
  }, [user?.id, loadSavedLinks]);

  useEffect(() => {
    if (!media) {
      if (provider === 'youtube') setStationIdx(null);
      return;
    }

    if (media.provider !== 'youtube') {
      setStationIdx(null);
      return;
    }

    if (media.listId) {
      setStationIdx(-1);
      return;
    }

    const idx = STATIONS.findIndex((entry) => entry.id === media.videoId);
    setStationIdx(idx >= 0 ? idx : 0);
  }, [media, provider]);

  const calcCustomPos = useCallback(() => {
    const rect = linkBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const hasSaved = savedLinksForProvider.length > 0;
    const approxH = isYouTube
      ? 220 + (hasSaved ? Math.min(savedLinksForProvider.length * 52 + 36, 180) : 0)
      : 250 + (hasSaved ? Math.min(savedLinksForProvider.length * 52 + 36, 180) : 0);

    setCustomInputPos({
      left: Math.max(8, Math.min(rect.right - 288, window.innerWidth - 296)),
      top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - approxH)),
    });
  }, [isYouTube, savedLinksForProvider.length]);

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
    setSaving(false);
  };

  const parsedInput = customUrl.trim()
    ? (isYouTube ? parseYouTubeUrl(customUrl) : parseSpotifyUrl(customUrl))
    : (isYouTube
      ? { provider: 'youtube', videoId: null, listId: null }
      : { provider: 'spotify', spotifyType: null, spotifyId: null });

  const hasContent = customUrl.trim().length > 0;
  const isValidInput = isYouTube
    ? !!(parsedInput.videoId || parsedInput.listId)
    : !!(parsedInput.spotifyType && parsedInput.spotifyId);

  const inputHint = !hasContent
    ? null
    : !isValidInput
      ? { type: 'error', text: isYouTube ? 'Not a valid YouTube URL' : 'Not a valid Spotify link' }
      : isYouTube
        ? parsedInput.videoId && parsedInput.listId
          ? { type: 'ok', text: 'Video + playlist detected' }
          : parsedInput.listId
            ? { type: 'ok', text: 'Playlist detected' }
            : { type: 'ok', text: 'Video detected' }
        : { type: 'ok', text: `${parsedInput.spotifyType[0].toUpperCase()}${parsedInput.spotifyType.slice(1)} detected` };

  const handleProviderChange = (nextProvider) => {
    if (nextProvider === provider) return;
    closePopover();
    setStationIdx(null);
    setProvider(nextProvider);
    clearMedia();
  };

  const handlePlay = () => {
    const nextMedia = isYouTube ? parseYouTubeUrl(customUrl) : parseSpotifyUrl(customUrl);
    const label = customLabel.trim() || autoLabel(nextMedia);

    if (isYouTube && !nextMedia.videoId && !nextMedia.listId) {
      pushError('Invalid YouTube URL — paste a video or playlist link');
      return;
    }
    if (!isYouTube && (!nextMedia.spotifyType || !nextMedia.spotifyId)) {
      pushError('Invalid Spotify URL — paste a track, album, playlist, or episode link');
      return;
    }

    setMedia({ ...nextMedia, label });
    if (isYouTube) setStationIdx(-1);
    closePopover();
  };

  const handleSaveAndPlay = async () => {
    const nextMedia = isYouTube ? parseYouTubeUrl(customUrl) : parseSpotifyUrl(customUrl);

    if (isYouTube && !nextMedia.videoId && !nextMedia.listId) {
      pushError('Invalid YouTube URL — paste a video or playlist link');
      return;
    }
    if (!isYouTube && (!nextMedia.spotifyType || !nextMedia.spotifyId)) {
      pushError('Invalid Spotify URL — paste a track, album, playlist, or episode link');
      return;
    }

    let label = customLabel.trim();
    if (!label && isYouTube && nextMedia.videoId) {
      setSaving(true);
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${nextMedia.videoId}&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          label = data.title.trim().split(/\s+/).slice(0, 3).join(' ');
        }
      } catch {}
      setSaving(false);
    }

    if (!label && !isYouTube) {
      const spotifyUrl = buildSpotifyShareUrl(nextMedia);
      if (spotifyUrl) {
        setSaving(true);
        try {
          const res = await fetch(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (typeof data.title === 'string' && data.title.trim()) {
              label = data.title.trim();
            }
          }
        } catch {}
        setSaving(false);
      }
    }

    const resolvedLabel = label || autoLabel(nextMedia);
    await saveLink(resolvedLabel, { ...nextMedia, label: resolvedLabel });
    setMedia({ ...nextMedia, label: resolvedLabel });
    if (isYouTube) setStationIdx(-1);
    closePopover();
  };

  const playLink = (link) => {
    setMedia({ ...link.media, label: link.label });
    if (link.media.provider === 'youtube' && !link.media.listId) {
      const idx = STATIONS.findIndex((entry) => entry.id === link.media.videoId);
      setStationIdx(idx >= 0 ? idx : -1);
    } else {
      setStationIdx(link.media.provider === 'youtube' ? -1 : null);
    }
    closePopover();
  };

  const changeStation = (delta) => {
    const baseIdx = typeof stationIdx === 'number' && stationIdx >= 0 ? stationIdx : 0;
    const newIdx = baseIdx + delta;
    const clamped = ((newIdx % STATIONS.length) + STATIONS.length) % STATIONS.length;
    const station = STATIONS[clamped];
    setStationIdx(clamped);
    setMedia({ provider: 'youtube', videoId: station.id, listId: null, label: station.title });
  };

  const goToStation = (i) => {
    if (Number.isNaN(i)) return;
    setStationIdx(i);
    if (i !== -1) {
      const station = STATIONS[i];
      setMedia({ provider: 'youtube', videoId: station.id, listId: null, label: station.title });
    }
  };

  const isPlaylist = isYouTube && !!media?.listId;
  const isCustom = isYouTube && stationIdx === -1;
  const isIdle = isYouTube && stationIdx === null;
  const customEmoji = media?.provider === 'youtube' && media?.listId && !media?.videoId ? '📋' : '🔗';

  return (
    <div className="h-full flex flex-col p-3 gap-3 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Music
        </h3>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-0.5">
            {['youtube', 'spotify'].map((entry) => {
              const active = provider === entry;
              return (
                <button
                  key={entry}
                  onClick={() => handleProviderChange(entry)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    active
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {entry === 'youtube' ? 'YouTube' : 'Spotify'}
                </button>
              );
            })}
          </div>

          {isYouTube && (
            <select
              value={isIdle ? '' : stationIdx}
              onChange={(e) => goToStation(Number(e.target.value))}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isIdle && (
                <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  Select
                </option>
              )}
              {isCustom && (
                <option value={-1} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  {customEmoji} Custom
                </option>
              )}
              {STATIONS.map((station, idx) => (
                <option key={station.id} value={idx} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  {station.emoji} {station.title}
                </option>
              ))}
            </select>
          )}

          <button
            ref={linkBtnRef}
            onClick={() => setShowCustomInput((value) => !value)}
            title={isYouTube ? 'Custom YouTube URL or playlist' : 'Paste a Spotify track, album, or playlist'}
            className={`p-1 rounded-lg transition-colors ${
              showCustomInput
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

      {showCustomInput && createPortal(
        <div className="fixed inset-0 z-[9990]" onClick={closePopover}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 overflow-hidden"
            style={customInputPos}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isYouTube ? 'Custom YouTube URL' : 'Spotify Link'}
                </h4>
                <button
                  onClick={closePopover}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <input
                    autoFocus
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') closePopover();
                      if (e.key === 'Enter') handlePlay();
                    }}
                    placeholder={isYouTube ? 'Paste a YouTube video or playlist URL…' : 'Paste a Spotify track, album, playlist, or episode link…'}
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
                  {!isYouTube && (
                    <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-500">
                      {getSpotifyHelperText()}
                    </p>
                  )}
                </div>

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
                    disabled={!hasContent || saving || savedLinksForProvider.length >= 5}
                    title={savedLinksForProvider.length >= 5 ? 'Max 5 saved links for this provider' : 'Save this link and play'}
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
                    {savedLinksForProvider.length >= 5 ? '5/5' : 'Save'}
                  </button>
                </div>
              </div>

              {savedLinksForProvider.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                    Saved {isYouTube ? 'YouTube' : 'Spotify'}
                  </p>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {savedLinksForProvider.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors"
                      >
                        <span className="text-sm shrink-0">{getSavedIcon(link.media)}</span>
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

      <div
        ref={slotRef}
        className="flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-900 dark:bg-black flex items-center justify-center"
      >
        {!media && (
          <div className="text-center px-4">
            <svg className="w-8 h-8 text-gray-600 dark:text-gray-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-600">
              {isYouTube ? 'Select a station or paste a URL to start' : 'Paste a Spotify link to start an embed'}
            </p>
            {!isYouTube && (
              <p className="text-[10px] mt-1 text-gray-500 dark:text-gray-600">
                {getSpotifyHelperText()}
              </p>
            )}
          </div>
        )}
      </div>

      {isYouTube ? (
        <div className="flex items-center justify-between shrink-0">
          <button
            onClick={() => (isPlaylist ? prevTrack() : changeStation(-1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={isPlaylist ? 'Previous in playlist' : 'Previous station'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          <div className="flex gap-1.5 items-center">
            {STATIONS.map((station, idx) => (
              <button
                key={station.id}
                onClick={() => goToStation(idx)}
                title={station.title}
                className={`rounded-full transition-all duration-200 ${
                  idx === stationIdx
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
            onClick={() => (isPlaylist ? nextTrack() : changeStation(1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={isPlaylist ? 'Next in playlist' : 'Next station'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="shrink-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Spotify embed mode</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
            Sign in to Spotify on the web for the best chance of full playback, but some embeds may still stay preview-limited.
          </p>
        </div>
      )}
    </div>
  );
}
