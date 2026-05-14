/**
 * Global toast queue. Use:
 *   import { toast } from '@/state/toast';
 *   toast.success('Account created.');
 *   toast.error('Could not connect to the server.');
 *
 * The Toaster component (mounted in app/_layout.tsx) reads from this store
 * and renders the toasts at the top of the screen.
 */
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Auto-dismiss delay in ms; 0 = sticky. */
  durationMs: number;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, variant: ToastVariant, durationMs?: number) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (message, variant, durationMs = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ items: [...s.items, { id, message, variant, durationMs }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  clear: () => set({ items: [] }),
}));

/** Tiny convenience API so screens don't import the store directly. */
export const toast = {
  success: (msg: string, durationMs?: number) => useToastStore.getState().push(msg, 'success', durationMs),
  error: (msg: string, durationMs?: number) => useToastStore.getState().push(msg, 'error', durationMs),
  info: (msg: string, durationMs?: number) => useToastStore.getState().push(msg, 'info', durationMs),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};
