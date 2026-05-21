/**
 * Auth state — tokens, user info, hydration.
 * Tokens persist to expo-secure-store; user metadata caches alongside for fast boot.
 */
import { create } from 'zustand';
import { setItem, getItem, removeItem, clearAll } from '../lib/storage';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  credit_balance: number;
  onboarding_completed: boolean;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  sex?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  display_name?: string | null;
  protein_target_g?: number | null;
  goal?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal_weight_kg?: number | null;
  activity_level?: string | null;
  medication?: string | null;
  // Derived energy targets — computed server-side from sex+DOB+height+weight+activity+goal.
  // Null when the user hasn't provided enough data (rare post-onboarding).
  bmr_kcal?: number | null;
  tdee_kcal?: number | null;
  calorie_target_kcal?: number | null;
  // Account creation timestamp (ISO). Used by History to cap pagination
  // at the join date — there's no meal data before this.
  created_at?: string;
}

interface AuthState {
  // identity
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;

  // lifecycle
  isHydrated: boolean;

  // actions
  hydrate: () => Promise<void>;
  setSession: (payload: {
    access_token: string;
    refresh_token: string;
    user: User;
  }) => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  patchUser: (patch: Partial<User>) => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,

  hydrate: async () => {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      getItem('accessToken'),
      getItem('refreshToken'),
      getItem('userJson'),
    ]);
    let user: User | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson) as User;
      } catch {
        user = null;
      }
    }
    set({ accessToken, refreshToken, user, isHydrated: true });
  },

  setSession: async ({ access_token, refresh_token, user }) => {
    await Promise.all([
      setItem('accessToken', access_token),
      setItem('refreshToken', refresh_token),
      setItem('userJson', JSON.stringify(user)),
    ]);
    set({ accessToken: access_token, refreshToken: refresh_token, user });
  },

  setAccessToken: async (token) => {
    await setItem('accessToken', token);
    set({ accessToken: token });
  },

  setUser: async (user) => {
    await setItem('userJson', JSON.stringify(user));
    set({ user });
  },

  patchUser: async (patch) => {
    const current = get().user;
    if (!current) return;
    const merged = { ...current, ...patch };
    await setItem('userJson', JSON.stringify(merged));
    set({ user: merged });
  },

  clear: async () => {
    await clearAll();
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));

/** Used by the API client without hooking — returns the current snapshot. */
export const getAuth = () => useAuthStore.getState();
