import { useState, useEffect } from 'react';
import { Profile } from '../types';
import { api } from '../lib/api';
import { localStore } from '../lib/localStore';

interface AuthState {
  currentUser: Profile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

let globalUser: Profile | null = null;
let hasInitialized = false;
let globalLoading = typeof window !== 'undefined' && Boolean(localStore.getCurrentUserId());

const listeners = new Set<(state: { user: Profile | null; loading: boolean }) => void>();

function notify() {
  listeners.forEach((cb) => cb({ user: globalUser, loading: globalLoading }));
}

export function useAuthStore(): AuthState {
  const [state, setState] = useState({ user: globalUser, loading: globalLoading });

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const refreshUser = async () => {
    try {
      if (!hasInitialized) {
        globalLoading = true;
        notify();
      }
      const u = await api.getCurrentUser();
      globalUser = u;
    } catch (e) {
      console.warn('Auth check error:', e);
    } finally {
      hasInitialized = true;
      globalLoading = false;
      notify();
    }
  };

  const logout = async () => {
    await api.signOut();
    globalUser = null;
    globalLoading = false;
    notify();
  };

  useEffect(() => {
    if (!hasInitialized) {
      refreshUser();
    }

    const handleSync = () => {
      // Background sync without flipping loading screen
      api.getCurrentUser().then((u) => {
        globalUser = u;
        notify();
      });
    };

    window.addEventListener('sundargram-auth-changed', handleSync);
    return () => {
      window.removeEventListener('sundargram-auth-changed', handleSync);
    };
  }, []);

  return {
    currentUser: state.user,
    loading: state.loading,
    refreshUser,
    logout,
  };
}
