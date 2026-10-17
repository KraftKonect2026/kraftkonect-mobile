import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { gql, type ApolloClient } from "@apollo/client";

const TOKEN_KEY = "push.expoToken";

const REGISTER = gql`mutation RegisterDeviceToken($token: String!, $platform: String!) { registerDeviceToken(token: $token, platform: $platform) }`;
const UNREGISTER = gql`mutation UnregisterDeviceToken($token: String!) { unregisterDeviceToken(token: $token) }`;

let configured = false;

/**
 * Once at start-up. While the app is open a push is shown as the in-app toast instead of the system banner,
 * so nothing is announced twice; when the app is in the background the system shows it as usual.
 */
export function configurePush(): void {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: true }),
  });
  if (Platform.OS === "android") {
    // The same id the server sends on (channelId: "default").
    void Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#235DE1",
    }).catch(() => undefined);
  }
}

export type PushStatus = "registered" | "denied" | "unavailable";

/**
 * Ask for permission (once, if the system still lets us), get this phone's Expo push token and give it to the server.
 * Never throws: push is a nicety and must not get in the way of signing in.
 */
export async function registerForPush(client: Pick<ApolloClient<unknown>, "mutate">): Promise<PushStatus> {
  try {
    if (!Device.isDevice) return "unavailable"; // simulators cannot receive push
    let { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && canAskAgain) ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== "granted") return "denied";

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (!token) return "unavailable";

    await client.mutate({ mutation: REGISTER, variables: { token, platform: Platform.OS } });
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return "registered";
  } catch {
    return "unavailable";
  }
}

/** Stop pushes to this phone for the person signing out. Call before signing out, while the session still works. */
export async function unregisterPush(client: Pick<ApolloClient<unknown>, "mutate">): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await Promise.race([
      client.mutate({ mutation: UNREGISTER, variables: { token } }),
      new Promise((resolve) => setTimeout(resolve, 3000)), // a bad connection must not block signing out
    ]);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch { /* signing out matters more */ }
}
