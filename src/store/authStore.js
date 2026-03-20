import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useWidgetStore } from './widgetStore';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  _authSubscription: null,

  initialize: async () => {
    if (get()._authSubscription) return;
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ session, user, loading: false });

    // Load layout for the existing session on page load
    if (user) {
      useWidgetStore.getState().loadLayout(user.id);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        // Only swap the session token — keep the same user object reference so
        // components that depend on `user` don't re-render / re-fetch needlessly.
        set({ session });
        return;
      }

      const newUser = session?.user ?? null;
      set({ session, user: newUser, loading: false });

      if (event === 'SIGNED_IN' && newUser) {
        useWidgetStore.getState().loadLayout(newUser.id);
      }
      if (event === 'SIGNED_OUT') {
        useWidgetStore.getState().reset();
      }
    });
    set({ _authSubscription: subscription });
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // When email confirmation is disabled in Supabase, a session is returned immediately
    if (data.session) {
      set({ session: data.session, user: data.user });
    }
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ session: data.session, user: data.user });
    return data;
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw error;
  },

  signOut: async () => {
    const userId = get().user?.id;
    // Flush any pending layout save before signing out
    useWidgetStore.getState().flushLayout();
    await supabase.auth.signOut();
    // Clean up any legacy localStorage note key from the old encryption scheme
    if (userId) localStorage.removeItem(`fd_nk_${userId}`);
    set({ user: null, session: null });
  },
}));
