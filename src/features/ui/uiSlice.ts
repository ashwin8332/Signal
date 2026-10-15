import { createSlice, nanoid, type PayloadAction, type UnknownAction } from '@reduxjs/toolkit';
import { hydrateDevice, hydrateFromStorage, userSessionEnded } from '@/store/hydrate';

export interface Toast {
  id: string;
  /** i18n key. */
  message: string;
  values?: Record<string, string | number>;
  tone: 'info' | 'success' | 'error';
  /** Optional action button, e.g. Undo. Dispatched as-is when clicked. */
  action?: { label: string; dispatch: UnknownAction };
}

export interface UiState {
  /** True once the signed-in user's saved data has been loaded on the client. */
  hydrated: boolean;
  /** True once device settings (theme, language) have been read on the client. */
  deviceHydrated: boolean;
  mobileNavOpen: boolean;
  toasts: Toast[];
}

const initialState: UiState = { hydrated: false, deviceHydrated: false, mobileNavOpen: false, toasts: [] };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        // Keep the stack short; the newest message matters most.
        state.toasts = [...state.toasts.slice(-2), action.payload];
      },
      prepare(toast: Omit<Toast, 'id'>) {
        return { payload: { ...toast, id: nanoid() } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateFromStorage, (state) => {
        state.hydrated = true;
      })
      .addCase(hydrateDevice, (state) => {
        state.deviceHydrated = true;
      })
      .addCase(userSessionEnded, (state) => {
        state.hydrated = false;
      });
  },
});

export const { setMobileNavOpen, showToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
