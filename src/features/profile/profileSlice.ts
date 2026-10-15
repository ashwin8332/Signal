import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { hydrateFromStorage, userSessionEnded } from '@/store/hydrate';

export const AVATAR_COLORS = ['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet'] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export interface ProfileState {
  /** Overrides the account name when set. */
  displayName: string | null;
  bio: string;
  avatarColor: AvatarColor;
}

const initialState: ProfileState = { displayName: null, bio: '', avatarColor: 'indigo' };

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<{ displayName: string; bio: string; avatarColor: AvatarColor }>) {
      state.displayName = action.payload.displayName;
      state.bio = action.payload.bio;
      state.avatarColor = action.payload.avatarColor;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateFromStorage, (state, action) => action.payload.profile ?? state)
      .addCase(userSessionEnded, () => initialState);
  },
});

export const { updateProfile } = profileSlice.actions;
export default profileSlice.reducer;
