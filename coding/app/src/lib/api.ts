/**
 * Authenticated fetch wrapper for the LeanScan API.
 *
 * Response envelope from the server:
 *   Success: { success: true,  message: string, data?: T }
 *   Failure: { success: false, message: string, error?: { code, details? } }
 *
 * Features:
 *   - Auto-detects API base URL (env > Expo dev host > app.json > localhost)
 *   - Injects Bearer access token from auth store
 *   - On 401, transparently calls /v1/auth/refresh once, retries the request,
 *     and falls back to logout if refresh also fails
 *   - Single in-flight refresh guard (avoids stampedes when N requests 401 at once)
 *   - Auto-shows a toast on non-validation errors (validation_error is left for
 *     forms to render inline)
 */
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { getAuth, useAuthStore, type User } from '../state/auth';
import { toast } from '../state/toast';

// -------------------------------------------------------------
// Base URL detection
// -------------------------------------------------------------
function detectApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && !fromEnv.includes('192.168.1.42')) return fromEnv;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    // legacy fallback
    // @ts-expect-error legacy path
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    '';
  const host = hostUri.split(':')[0];
  if (host && host !== 'localhost') return `http://${host}:3000`;

  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  return fromExtra ?? 'http://localhost:3000';
}

export const API_URL = detectApiUrl().replace(/\/$/, '');

// -------------------------------------------------------------
// Response envelope types
// -------------------------------------------------------------
export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  error?: { code: string; details?: unknown };
}

export type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

// -------------------------------------------------------------
// Refresh-token guard (single in-flight)
// -------------------------------------------------------------
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<boolean> => {
    const { refreshToken } = getAuth();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const json = (await res.json()) as ApiBody<{ access_token: string }>;
      if (!res.ok || !json.success || !json.data?.access_token) return false;
      await useAuthStore.getState().setAccessToken(json.data.access_token);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// -------------------------------------------------------------
// Core request helper
// -------------------------------------------------------------
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Skip auth header (for /auth/signup, /auth/login, /auth/refresh, /health). */
  unauthenticated?: boolean;
  /** Disable the 401-retry-after-refresh behavior. */
  noAutoRefresh?: boolean;
  /** Skip auto-toast on error (form screens that want inline display). */
  silent?: boolean;
}

export interface RequestResult<T> {
  data: T | undefined;
  message: string;
}

/**
 * Returns the parsed `data` only — drops the message at the call site.
 * Use `requestWithMessage` if you need the message for a custom toast.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const result = await requestWithMessage<T>(path, opts);
  return result.data as T;
}

export async function requestWithMessage<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<RequestResult<T>> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (!opts.unauthenticated) {
      const { accessToken } = getAuth();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }
    return fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    const msg = (err as Error).message || 'Network error';
    if (!opts.silent) toast.error(`Couldn't reach the server. ${msg}`);
    throw new ApiError(0, 'network_error', msg);
  }

  // 401 → try refresh once, then retry
  if (res.status === 401 && !opts.unauthenticated && !opts.noAutoRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      try {
        res = await doFetch();
      } catch (err) {
        const msg = (err as Error).message || 'Network error';
        if (!opts.silent) toast.error(`Network error. ${msg}`);
        throw new ApiError(0, 'network_error', msg);
      }
    } else {
      // Refresh failed → wipe session.
      await useAuthStore.getState().clear();
    }
  }

  let json: ApiBody<T>;
  try {
    json = (await res.json()) as ApiBody<T>;
  } catch {
    const msg = `Server returned non-JSON (${res.status})`;
    if (!opts.silent) toast.error(msg);
    throw new ApiError(res.status, 'invalid_response', msg);
  }

  if (!res.ok || !json.success) {
    const errBody = (json as ApiErrorBody).error;
    const code = errBody?.code ?? 'unknown';
    const message = json.message ?? `Request failed (${res.status})`;
    // Surface as toast except for validation errors (forms handle inline)
    if (!opts.silent && code !== 'validation_error') {
      toast.error(message);
    }
    throw new ApiError(res.status, code, message, errBody?.details);
  }

  return { data: (json as ApiSuccessBody<T>).data, message: json.message };
}

// -------------------------------------------------------------
// Typed endpoint helpers
// -------------------------------------------------------------
export interface AuthSessionResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in_seconds: number;
}

export const api = {
  health: () =>
    request<{ status: string; uptime_s: number; version: string; timestamp: string }>('/health', {
      unauthenticated: true,
      noAutoRefresh: true,
      silent: true,
    }),

  signup: (input: {
    email: string;
    password: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    sex?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  }) =>
    requestWithMessage<AuthSessionResponse>('/v1/auth/signup', {
      method: 'POST',
      body: input,
      unauthenticated: true,
      silent: true,
    }),

  login: (input: { email: string; password: string }) =>
    requestWithMessage<AuthSessionResponse>('/v1/auth/login', {
      method: 'POST',
      body: input,
      unauthenticated: true,
      silent: true,
    }),

  logout: (input: { refresh_token: string }) =>
    request<undefined>('/v1/auth/logout', {
      method: 'POST',
      body: input,
      unauthenticated: true,
      silent: true,
    }),

  forgotPassword: (input: { email: string }) =>
    requestWithMessage<undefined>('/v1/auth/forgot-password', {
      method: 'POST',
      body: input,
      unauthenticated: true,
      silent: true,
    }),

  resetPassword: (input: { token: string; new_password: string }) =>
    requestWithMessage<undefined>('/v1/auth/reset-password', {
      method: 'POST',
      body: input,
      unauthenticated: true,
      silent: true,
    }),

  me: () => request<User>('/v1/auth/me', { silent: true }),

  getProfile: () => request<Record<string, unknown>>('/v1/profile', { silent: true }),
  patchProfile: (input: Record<string, unknown>) =>
    requestWithMessage<Record<string, unknown>>('/v1/profile', {
      method: 'PATCH',
      body: input,
    }),

  completeOnboarding: () =>
    requestWithMessage<{
      already_completed?: boolean;
      credits_granted?: number;
      credit_balance?: number;
      protein_target_g?: number | null;
    }>('/v1/onboarding/complete', { method: 'POST' }),

  // -------------------- Meals --------------------
  todaySummary: () =>
    request<{
      date: string;
      protein_g: number;
      calories: number;
      carbs_g: number;
      fat_g: number;
      meal_count: number;
    }>('/v1/meals/summary/today', { silent: true }),

  listMeals: (date?: string) =>
    request<{
      date: string;
      totals: { protein_g: number; calories: number; carbs_g: number; fat_g: number };
      meals: MealRecord[];
    }>(`/v1/meals${date ? `?date=${date}` : ''}`, { silent: true }),

  /**
   * Daily aggregates over a range — one row per day with meals, used by the
   * History view for paginated day cards. Only days WITH meals are returned;
   * the caller is responsible for filling in empty days in the date list.
   */
  listMealDays: (since: string, until?: string) =>
    request<{
      since: string;
      until: string;
      days: Array<{
        date: string;
        protein_g: number;
        calories: number;
        carbs_g: number;
        fat_g: number;
        meal_count: number;
      }>;
    }>(
      `/v1/meals/days?since=${encodeURIComponent(since)}${
        until ? `&until=${encodeURIComponent(until)}` : ''
      }`,
      { silent: true },
    ),

  saveMeal: (input: {
    meal_name: string;
    protein_g: number;
    calories?: number;
    carbs_g?: number;
    fat_g?: number;
    estimated_portion?: string;
    source?: 'photo' | 'manual' | 'quick_add';
    photo_path?: string;
    confidence?: 'low' | 'medium' | 'high';
    ai_notes?: string;
    raw_ai_response?: unknown;
    edited_by_user?: boolean;
  }) =>
    requestWithMessage<{ meal: MealRecord }>('/v1/meals', {
      method: 'POST',
      body: input,
    }),

  patchMeal: (
    id: string,
    input: Partial<{
      meal_name: string;
      protein_g: number;
      calories: number;
      carbs_g: number;
      fat_g: number;
      estimated_portion: string;
    }>,
  ) =>
    requestWithMessage<{ meal: MealRecord }>(`/v1/meals/${id}`, {
      method: 'PATCH',
      body: input,
    }),

  deleteMeal: (id: string) =>
    requestWithMessage<undefined>(`/v1/meals/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Upload a meal photo. Uses expo-file-system's native uploadAsync instead of
   * fetch + FormData — RN 0.83 / Expo SDK 55 has a regression where multipart
   * fetch uploads fail on Android with "network request failed" before the
   * request leaves the device. uploadAsync uses the platform's native HTTP
   * upload primitives (NSURLSession on iOS, OkHttp on Android) which are not
   * affected.
   *
   * Returns the AI estimate + a `photo_path` that must be passed to `saveMeal`
   * if the user accepts.
   */
  uploadMealPhoto: async (localUri: string): Promise<{
    scan_id: string;
    photo_path: string;
    estimate: {
      meal_name: string;
      estimated_portion?: string;
      protein_g: number;
      calories: number;
      carbs_g: number;
      fat_g: number;
      confidence: 'low' | 'medium' | 'high';
      notes?: string;
    };
    credit_balance: number;
    raw_ai_response: unknown;
  }> => {
    const url = `${API_URL}/v1/meals/photo`;

    // Inner helper — does one upload attempt with the current access token.
    // Returned so we can call it twice: once normally, once after a refresh.
    const doUpload = async (): Promise<FileSystem.FileSystemUploadResult> => {
      const { accessToken } = getAuth();
      try {
        return await FileSystem.uploadAsync(url, localUri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'photo',
          mimeType: 'image/jpeg',
          parameters: {},
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            Accept: 'application/json',
          },
        });
      } catch (err) {
        throw new ApiError(0, 'network_error', (err as Error).message || 'Network error');
      }
    };

    let result = await doUpload();

    // 401 → try refresh once, then retry. Mirrors the pattern in requestWithMessage.
    if (result.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        result = await doUpload();
      } else {
        await useAuthStore.getState().clear();
        throw new ApiError(401, 'session_expired', 'Your session expired. Sign in again.');
      }
    }

    let json: ApiBody<unknown>;
    try {
      json = JSON.parse(result.body) as ApiBody<unknown>;
    } catch {
      throw new ApiError(
        result.status,
        'invalid_response',
        `Server returned non-JSON (${result.status})`,
      );
    }
    if (result.status < 200 || result.status >= 300 || !json.success) {
      const errBody = (json as ApiErrorBody).error;
      throw new ApiError(
        result.status,
        errBody?.code ?? 'unknown',
        json.message ?? `Upload failed (${result.status})`,
        errBody?.details,
      );
    }
    return (json as ApiSuccessBody<never>).data as never;
  },

  recentMeals: () =>
    request<{
      items: Array<{
        id: string;
        meal_name: string;
        protein_g: number;
        calories: number | null;
        carbs_g: number | null;
        fat_g: number | null;
        estimated_portion: string | null;
        last_logged_at: string;
      }>;
    }>('/v1/meals/recent', { silent: true }),
};

export interface MealRecord {
  id: string;
  logged_at: string;
  log_date: string;
  meal_name: string;
  estimated_portion: string | null;
  photo_path: string | null;
  protein_g: number;
  calories: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  source: 'photo' | 'manual' | 'quick_add';
  confidence: 'low' | 'medium' | 'high' | null;
  ai_notes: string | null;
  edited_by_user: boolean;
  created_at: string;
}
