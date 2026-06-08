import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const createSecureStorage = (): Storage => {
  if (Platform.OS === "web") {
    return AsyncStorage;
  }

  return {
    getItem: async (key: string) => {
      return await SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string) => {
      await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string) => {
      await SecureStore.deleteItemAsync(key);
    },
  };
};

export const secureStorage = createSecureStorage();
