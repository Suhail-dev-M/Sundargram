import { useState, useEffect } from 'react';
import { Profile } from '../types';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'error';
}

interface ModalState {
  isCreateOpen: boolean;
  isSettingsOpen: boolean;
  isSupabaseConfigOpen: boolean;
  isNotificationsOpen: boolean;
  isSearchOpen: boolean;
  storyUser: Profile | null;
  commentsPostId: string | null;
  sharePostId: string | null;
  toasts: ToastMessage[];
}

let globalState: ModalState = {
  isCreateOpen: false,
  isSettingsOpen: false,
  isSupabaseConfigOpen: false,
  isNotificationsOpen: false,
  isSearchOpen: false,
  storyUser: null,
  commentsPostId: null,
  sharePostId: null,
  toasts: [],
};

const listeners = new Set<(s: ModalState) => void>();

function notify() {
  listeners.forEach((cb) => cb({ ...globalState }));
}

export function showToast(text: string, type: 'info' | 'success' | 'error' = 'info') {
  const id = 'tst_' + Date.now() + Math.random().toString(36).substring(2, 5);
  globalState.toasts = [...globalState.toasts, { id, text, type }];
  notify();
  setTimeout(() => {
    globalState.toasts = globalState.toasts.filter((t) => t.id !== id);
    notify();
  }, 3500);
}

export function useModalStore() {
  const [state, setState] = useState<ModalState>(globalState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    setCreateOpen: (open: boolean) => {
      globalState.isCreateOpen = open;
      notify();
    },
    setSettingsOpen: (open: boolean) => {
      globalState.isSettingsOpen = open;
      notify();
    },
    setSupabaseConfigOpen: (open: boolean) => {
      globalState.isSupabaseConfigOpen = open;
      notify();
    },
    setNotificationsOpen: (open: boolean) => {
      globalState.isNotificationsOpen = open;
      notify();
    },
    setSearchOpen: (open: boolean) => {
      globalState.isSearchOpen = open;
      notify();
    },
    openStory: (user: Profile) => {
      globalState.storyUser = user;
      notify();
    },
    closeStory: () => {
      globalState.storyUser = null;
      notify();
    },
    openComments: (postId: string) => {
      globalState.commentsPostId = postId;
      notify();
    },
    closeComments: () => {
      globalState.commentsPostId = null;
      notify();
    },
    openShare: (postId: string) => {
      globalState.sharePostId = postId;
      notify();
    },
    closeShare: () => {
      globalState.sharePostId = null;
      notify();
    },
    dismissToast: (id: string) => {
      globalState.toasts = globalState.toasts.filter((t) => t.id !== id);
      notify();
    },
  };
}
