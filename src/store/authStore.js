import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  _authSubscription: null,

  initialize: async () => {
    if (get()._authSubscription) return;
    const { data: { session } } = await supabase.auth.getSession();
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });
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
    await supabase.auth.signOut();
    // Clean up any legacy localStorage note key from the old encryption scheme
    if (userId) localStorage.removeItem(`fd_nk_${userId}`);
    set({ user: null, session: null });
  },
}));
