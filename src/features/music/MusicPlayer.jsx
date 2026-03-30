import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useMusicStore, musicIframeRef } from '../../store/musicStore';
import { useUIStore } from '../../store/uiStore';

const STATIONS = [
  { id: '8nPOiusHRjc', title: 'Cozy Spring', emoji: '🌸' },
  { id: 'h8UpC5JbMU0', title: 'Nostalgia', emoji: '📼' },
  { id: 'JElyhCKzhWI', title: 'Vintage Jazz', emoji: '🎷' },
  { id: 'SllpB3W5f6s', title: 'Dark Academia', emoji: '📖' },
  { id: 'WPni755-Krg', title: 'Alpha Waves', emoji: '🧘' },
];

function buildSrc(media, autoplay) {
  if (media.provider === 'spotify') {
    return `https://open.spotify.com/embed/${media.spotifyType}/${media.spotifyId}?utm_source=generator`;
  }

  const ap = autoplay ? '&autoplay=1' : '';
  const base = 'rel=0&modestbranding=1&enablejsapi=1';
  if (media.videoId && media.listId) {
    return `https://www.youtube.com/embed/${media.videoId}?list=${media.listId}&${base}${ap}`;
  }
  if (media.listId) {
    return `https://www.youtube.com/embed/videoseries?list=${media.listId}&${base}${ap}`;
  }
  return `https://www.youtube.com/embed/${media.videoId}?loop=1&playlist=${media.videoId}&${base}${ap}`;
}

function getMediaKey(media) {
  if (media.provider === 'spotify') return `spotify:${media.spotifyType}:${media.spotifyId}`;
  return `youtube:${media.videoId || ''}:${media.listId || ''}`;
}

function getLabel(media) {
  if (media.provider === 'spotify') {
    const base = media.label || (media.spotifyType ? media.spotifyType[0].toUpperCase() + media.spotifyType.slice(1) : 'Spotify');
    return `🎵 ${base}`;
  }

  const station = !media.listId ? STATIONS.find((entry) => entry.id === media.videoId) : null;
  if (station) return `${station.emoji} ${station.title}`;
  if (media.listId && !media.videoId) return '📋 Playlist';
  return media.label || '🔗 Custom';
}

function getMetadata(media) {
  if (media.provider === 'spotify') {
    return {
      title: media.label || 'Spotify',
      artist: 'FlowDesk Music',
      artwork: [],
    };
  }

  const station = !media.listId ? STATIONS.find((entry) => entry.id === media.videoId) : null;
  const title = station ? station.title : media.listId ? 'Playlist' : media.label || 'Custom Video';
  const artwork = media.videoId
    ? [{ src: `https://i.ytimg.com/vi/${media.videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }]
    : [];

  return { title, artist: 'FlowDesk Music', artwork };
}

const MINI_W = 288;
const MINI_VH = 162;
const MINI_BAR = 44;
const MINI_H = MINI_VH + MINI_BAR;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DUR = '0.38s';

function MiniBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 5,
        color: 'rgba(255,255,255,0.45)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
    >
      {children}
    </button>
  );
}

export default function MusicPlayer() {
  const { media, autoplay, iframeSlot, clearMedia, nextTrack, prevTrack } = useMusicStore(
    useShallow((s) => ({
      media: s.media,
      autoplay: s.autoplay,
      iframeSlot: s.iframeSlot,
      clearMedia: s.clearMedia,
      nextTrack: s.nextTrack,
      prevTrack: s.prevTrack,
    }))
  );
  const setMusicActive = useUIStore((s) => s.setMusicActive);

  const [slotRect, setSlotRect] = useState(null);
  const [ww, setWW] = useState(() => window.innerWidth);
  const [wh, setWH] = useState(() => window.innerHeight);

  useEffect(() => { setMusicActive(!!media); }, [media, setMusicActive]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !media) return;

    const metadata = getMetadata(media);
    navigator.mediaSession.metadata = new MediaMetadata(metadata);

    if (media.provider === 'youtube') {
      const post = (func) =>
        musicIframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func, args: [] }),
          '*'
        );

      navigator.mediaSession.setActionHandler('play', () => post('playVideo'));
      navigator.mediaSession.setActionHandler('pause', () => post('pauseVideo'));
      navigator.mediaSession.setActionHandler('nexttrack', media.listId ? nextTrack : null);
      navigator.mediaSession.setActionHandler('previoustrack', media.listId ? prevTrack : null);
    } else {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    }

    return () => {
      ['play', 'pause', 'nexttrack', 'previoustrack'].forEach((action) =>
        navigator.mediaSession.setActionHandler(action, null)
      );
    };
  }, [media, nextTrack, prevTrack]);

  useEffect(() => {
    const update = () => {
      setWW(window.innerWidth);
      setWH(window.innerHeight);
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!iframeSlot) {
      setSlotRect(null);
      return;
    }

    let rafId = null;
    const update = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = iframeSlot.getBoundingClientRect();
        setSlotRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(iframeSlot);
    window.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [iframeSlot]);

  if (!media) return null;

  const isOverlay = !!slotRect;
  const isPlaylist = media.provider === 'youtube' && !!media.listId;
  const iframeKey = getMediaKey(media);
  const label = getLabel(media);

  const cLeft = isOverlay ? slotRect.left : ww - MINI_W - 24;
  const cTop = isOverlay ? slotRect.top : wh - MINI_H - 24;
  const cWidth = isOverlay ? slotRect.width : MINI_W;
  const cHeight = isOverlay ? slotRect.height : MINI_H;
  const videoH = isOverlay ? (slotRect?.height ?? 0) : MINI_VH;
  const barH = isOverlay ? 0 : MINI_BAR;

  return (
    <div
      style={{
        position: 'fixed',
        left: cLeft,
        top: cTop,
        width: cWidth,
        height: cHeight,
        zIndex: isOverlay ? 10 : 9985,
        borderRadius: isOverlay ? '0.75rem' : '1rem',
        overflow: 'hidden',
        boxShadow: isOverlay
          ? 'none'
          : '0 32px 64px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)',
        transition: isOverlay
          ? 'border-radius 0.25s, box-shadow 0.3s'
          : [
              `left ${DUR} ${EASE}`,
              `top ${DUR} ${EASE}`,
              `width ${DUR} ${EASE}`,
              `height ${DUR} ${EASE}`,
              'border-radius 0.25s',
              'box-shadow 0.3s',
            ].join(', '),
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          height: videoH,
          background: '#000',
          overflow: 'hidden',
          transition: isOverlay ? 'none' : `height ${DUR} ${EASE}`,
        }}
      >
        <iframe
          ref={(el) => { musicIframeRef.current = el; }}
          key={iframeKey}
          src={buildSrc(media, autoplay)}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Music"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>

      <div
        style={{
          height: barH,
          overflow: 'hidden',
          transition: isOverlay ? 'none' : `height ${DUR} ${EASE}`,
          background: 'rgba(3, 7, 18, 0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: '#22c55e',
            boxShadow: '0 0 8px rgba(34,197,94,0.5)',
          }}
        />

        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: 'rgba(255,255,255,0.9)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>

        {isPlaylist && (
          <>
            <MiniBtn onClick={prevTrack} title="Previous">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </MiniBtn>
            <MiniBtn onClick={nextTrack} title="Next">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </MiniBtn>
          </>
        )}

        <MiniBtn onClick={clearMedia} title="Stop music">
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </MiniBtn>
      </div>
    </div>
  );
}
