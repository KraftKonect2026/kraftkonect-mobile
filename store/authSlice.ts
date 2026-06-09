import { User } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Last signed-in email — kept across sign-out so we can pre-fill the email
  // field and only ask for the password when the session expires.
  lastEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  lastEmail: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoading = false;
      if (action.payload?.email) state.lastEmail = action.payload.email;
    },
    setLastEmail: (state, action: PayloadAction<string>) => {
      state.lastEmail = action.payload;
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
      // Intentionally keep `lastEmail` so the next sign-in only needs a password.
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, setTokens, updateUser, signOut, setLoading, setIsAuthenticated, setLastEmail } =
  authSlice.actions;

export default authSlice.reducer;
