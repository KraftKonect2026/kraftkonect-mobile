import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

interface User {
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signUp: (data: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AUTH_STORAGE_KEY = "artisanhubb_auth";

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = useCallback(async (data: { name: string; email: string; password: string }) => {
    const newUser: User = {
      name: data.name,
      email: data.email,
    };
    
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const newUser: User = {
      name: "User",
      email,
    };
    
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    router.replace("/(app)/home" as any);
  }, [router]);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    router.replace("/get-started" as any);
  }, [router]);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  return useMemo(() => ({
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateUser,
  }), [user, isLoading, signUp, signIn, signOut, updateUser]);
});
