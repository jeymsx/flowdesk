import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import NotesPanel from './NotesPanel';

export default function NotesWidget() {
  const userId = useAuthStore((s) => s.user?.id);
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const setNotesPopped = useNotesStore((s) => s.setNotesPopped);

  const supportsPiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window && window.innerWidth >= 768;

  useEffect(() => {
    if (userId) loadNotes(userId);
  }, [userId, loadNotes]);

  return (
    <NotesPanel
      mode="widget"
      supportsPiP={supportsPiP}
      onPopOut={() => {
        if (supportsPiP) setNotesPopped(true);
      }}
    />
  );
}
