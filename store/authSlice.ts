import { User } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppMode, resolveAppMode } from "@/lib/appMode";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Remember this identity's sign-in details across sign-out.
  lastEmail: string | null;
  lastName: string | null;
  lastPhone: string | null;
  activeMode: AppMode | null;
  modeAccountId: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  lastEmail: null,
  lastName: null,
  lastPhone: null,
  activeMode: null,
  modeAccountId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      if (action.payload?.id && state.modeAccountId !== action.payload.id) {
        state.activeMode = action.payload.role === "provider" ? "provider" : "customer";
        state.modeAccountId = action.payload.id;
        state.lastEmail = null;
        state.lastName = null;
        state.lastPhone = null;
      }
      state.user = action.payload;
      state.isLoading = false;
      if (action.payload?.email) state.lastEmail = action.payload.email;
      if (action.payload?.name) state.lastName = action.payload.name;
      if (action.payload?.phone) state.lastPhone = action.payload.phone;
    },
    setLastEmail: (state, action: PayloadAction<string>) => {
      state.lastEmail = action.payload;
    },
    forgetLastAccount: (state) => {
      state.lastEmail = null;
      state.lastName = null;
      state.lastPhone = null;
      state.activeMode = null;
      state.modeAccountId = null;
    },
    setActiveMode: (state, action: PayloadAction<AppMode>) => {
      if (!state.user?.id || !state.accessToken || !state.isAuthenticated) return;
      state.activeMode = action.payload;
      state.modeAccountId = state.user.id;
    },
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    signOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      // Keep this identity's remembered phone/email for the next sign-in.
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, setTokens, updateUser, signOut, setLoading, setIsAuthenticated, setLastEmail, forgetLastAccount, setActiveMode } =
  authSlice.actions;

export const selectActiveMode = (state: { auth: AuthState }) => resolveAppMode(state.auth);

export default authSlice.reducer;
