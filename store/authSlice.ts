import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface User {
  name: string;
  email: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = "artisanhubb_auth";

const initialState: AuthState = {
  user: null,
  isLoading: true,
};

export const loadUser = createAsyncThunk("auth/loadUser", async () => {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
    return null;
  } catch (error) {
    console.error("Failed to load user:", error);
    return null;
  }
});

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (data: { name: string; email: string; password: string }) => {
    const newUser: User = {
      name: data.name,
      email: data.email,
    };

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  }
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (data: { email: string; password: string }) => {
    const newUser: User = {
      name: "User",
      email: data.email,
    };

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  }
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
});

export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (data: Partial<User>, { getState }) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.user) throw new Error("No user found");

    const updatedUser = { ...state.auth.user, ...data };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(signUp.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      });
  },
});

export default authSlice.reducer;
