import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiErrorBody, PublicUser } from '@/types/content';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: PublicUser | null;
  status: AuthStatus;
  /** Last user-facing error from a sign-in/sign-up attempt. */
  error: string | null;
  /** Set when an API call returned 401 mid-session. */
  sessionExpired: boolean;
}

const initialState: AuthState = { user: null, status: 'idle', error: null, sessionExpired: false };

interface AuthError {
  code: string;
  message: string;
}

/** POSTs JSON to an auth endpoint and returns `{ user }` or a typed error. */
async function authRequest(path: string, body?: unknown): Promise<{ user: PublicUser }> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw { code: 'NETWORK', message: 'Can’t reach the server. Check your connection and try again.' } satisfies AuthError;
  }
  const data = (await response.json().catch(() => null)) as ({ user: PublicUser } & Partial<ApiErrorBody>) | null;
  if (!response.ok || !data?.user) {
    throw {
      code: data?.error?.code ?? 'UNKNOWN',
      message: data?.error?.message ?? 'Something went wrong. Please try again.',
    } satisfies AuthError;
  }
  return data;
}

const toAuthError = (error: unknown): AuthError =>
  typeof error === 'object' && error !== null && 'message' in error
    ? (error as AuthError)
    : { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' };

export const fetchSession = createAsyncThunk<PublicUser, void, { rejectValue: AuthError }>(
  'auth/fetchSession',
  async (_, { rejectWithValue }) => {
    const response = await fetch('/api/auth/session', { credentials: 'same-origin' }).catch(() => null);
    if (!response?.ok) return rejectWithValue({ code: 'UNAUTHORIZED', message: '' });
    return ((await response.json()) as { user: PublicUser }).user;
  },
);

export const login = createAsyncThunk<PublicUser, { email: string; password: string }, { rejectValue: AuthError }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return (await authRequest('/api/auth/login', credentials)).user;
    } catch (error) {
      return rejectWithValue(toAuthError(error));
    }
  },
);

export const signup = createAsyncThunk<
  PublicUser,
  { name: string; email: string; password: string },
  { rejectValue: AuthError }
>('auth/signup', async (details, { rejectWithValue }) => {
  try {
    return (await authRequest('/api/auth/signup', details)).user;
  } catch (error) {
    return rejectWithValue(toAuthError(error));
  }
});

export const loginDemo = createAsyncThunk<PublicUser, void, { rejectValue: AuthError }>(
  'auth/loginDemo',
  async (_, { rejectWithValue }) => {
    try {
      return (await authRequest('/api/auth/demo')).user;
    } catch (error) {
      return rejectWithValue(toAuthError(error));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  // Best effort: the UI signs out locally even if the request fails.
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.sessionExpired = true;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
      })
      .addCase(fetchSession.rejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
        state.sessionExpired = false;
      });

    // login, signup and demo share the same lifecycle.
    for (const thunk of [login, signup, loginDemo]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.user = action.payload;
          state.status = 'authenticated';
          state.sessionExpired = false;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = 'unauthenticated';
          state.error = action.payload?.message ?? 'Something went wrong. Please try again.';
        });
    }
  },
});

export const { sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
