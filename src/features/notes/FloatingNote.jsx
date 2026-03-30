import { useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useNotesStore } from '../../store/notesStore';
import { useUIStore } from '../../store/uiStore';
import NotesPanel from './NotesPanel';

const PIP_W = 360;
const PIP_H = 420;

function copyStyles(targetWin) {
  [...document.querySelectorAll('link[rel="stylesheet"]')].forEach((link) => {
    const el = targetWin.document.createElement('link');
    el.rel = 'stylesheet';
    el.href = link.href;
    targetWin.document.head.appendChild(el);
  });
  [...document.querySelectorAll('style')].forEach((style) => {
    const el = targetWin.document.createElement('style');
    el.textContent = style.textContent;
    targetWin.document.head.appendChild(el);
  });
}

function applyDark(targetWin, isDark) {
  targetWin.document.documentElement.classList.toggle('dark', isDark);
  targetWin.document.body.style.backgroundColor = isDark ? '#111827' : '#ffffff';
}

export default function FloatingNote() {
  const isPopped = useNotesStore((s) => s.isNotesPopped);
  const setNotesPopped = useNotesStore((s) => s.setNotesPopped);
  const saveActiveNote = useNotesStore((s) => s.saveActiveNote);
  const darkMode = useUIStore((s) => s.darkMode);

  const pipWinRef = useRef(null);
  const pipRootRef = useRef(null);
  const supportsPiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const canUsePiP = supportsPiP && isDesktop;

  const closePiP = useCallback(async () => {
    await saveActiveNote();
    if (pipRootRef.current) {
      pipRootRef.current.unmount();
      pipRootRef.current = null;
    }
    if (pipWinRef.current && !pipWinRef.current.closed) {
      pipWinRef.current.close();
    }
    pipWinRef.current = null;
  }, [saveActiveNote]);

  useEffect(() => {
    if (pipWinRef.current && !pipWinRef.current.closed) {
      applyDark(pipWinRef.current, darkMode);
    }
  }, [darkMode]);

  useEffect(() => {
    if (!isPopped || !canUsePiP) {
      if (pipWinRef.current && !pipWinRef.current.closed) {
        closePiP();
      }
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (pipWinRef.current && !pipWinRef.current.closed) {
          if (pipRootRef.current) {
            pipRootRef.current.render(
              <NotesPanel
                mode="pip"
                onClosePopOut={async () => {
                  await closePiP();
                  setNotesPopped(false);
                }}
              />
            );
          }
          return;
        }

        const pipWin = await window.documentPictureInPicture.requestWindow({
          width: PIP_W,
          height: PIP_H,
        });
        if (cancelled) {
          pipWin.close();
          return;
        }

        pipWinRef.current = pipWin;
        copyStyles(pipWin);
        applyDark(pipWin, darkMode);
        pipWin.document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;';

        const container = pipWin.document.createElement('div');
        container.style.cssText = 'width:100%;height:100%;';
        pipWin.document.body.innerHTML = '';
        pipWin.document.body.appendChild(container);

        const root = createRoot(container);
        pipRootRef.current = root;
        root.render(
          <NotesPanel
            mode="pip"
            onClosePopOut={async () => {
              await closePiP();
              setNotesPopped(false);
            }}
          />
        );

        const onPageHide = async () => {
          if (pipRootRef.current) {
            pipRootRef.current.unmount();
            pipRootRef.current = null;
          }
          pipWinRef.current = null;
          await saveActiveNote();
          setNotesPopped(false);
        };
        pipWin.addEventListener('pagehide', onPageHide, { once: true });
      } catch (err) {
        console.warn('Notes Document PiP unavailable:', err);
        if (!cancelled) setNotesPopped(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canUsePiP, closePiP, darkMode, isPopped, saveActiveNote, setNotesPopped]);

  useEffect(() => () => {
    closePiP();
  }, [closePiP]);

  return null;
}
