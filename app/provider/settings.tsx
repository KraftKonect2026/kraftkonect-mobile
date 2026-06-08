import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  CreditCard,
  Navigation,
} from "lucide-react-native";
import * as Location from "expo-location";
import { useQuery, useMutation } from "@apollo/client";
import Colors from "@/constants/colors";
import { MY_PROVIDER_PROFILE_QUERY } from "@/lib/queries";
import { UPDATE_PROVIDER_LOCATION_MUTATION } from "@/lib/mutations";

export default function ProviderSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [newMessages, setNewMessages] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [gpsBoost, setGpsBoost] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const locationSub = useRef<Location.LocationSubscription | null>(null);

  const { data: profileData } = useQuery(MY_PROVIDER_PROFILE_QUERY);

  const [updateProviderLocation] = useMutation(UPDATE_PROVIDER_LOCATION_MUTATION);

  // Sync initial GPS state from server
  useEffect(() => {
    if (profileData?.myProviderProfile?.gpsEnabled != null) {
      setGpsBoost(profileData.myProviderProfile.gpsEnabled);
    }
  }, [profileData]);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      locationSub.current?.remove();
    };
  }, []);

  const startLocationWatch = async () => {
    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 100,
      },
      (loc) => {
        updateProviderLocation({
          variables: {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            enabled: true,
          },
        }).catch(() => {});
      },
    );
  };

  const handleGpsToggle = async (value: boolean) => {
    if (gpsLoading) return;
    setGpsLoading(true);

    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Location permission was denied. Enable it in your device settings to use GPS Boost.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings(),
              },
            ],
          );
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        await updateProviderLocation({
          variables: {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            enabled: true,
          },
        });

        setGpsBoost(true);
        await startLocationWatch();
      } else {
        locationSub.current?.remove();
        locationSub.current = null;

        await updateProviderLocation({
          variables: { enabled: false },
        });

        setGpsBoost(false);
      }
    } catch {
      Alert.alert("Error", "Failed to update GPS Boost. Please try again.");
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* GPS Boost */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GPS BOOST</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, gpsBoost && styles.iconContainerActive]}>
                  <Navigation
                    size={20}
                    color={gpsBoost ? Colors.success : "#6B7280"}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>GPS Boost</Text>
                  <Text style={styles.settingDescription}>
                    Share your live location to rank higher and get a &apos;Near you now&apos; badge
                  </Text>
                </View>
              </View>
              <Switch
                value={gpsBoost}
                onValueChange={handleGpsToggle}
                disabled={gpsLoading}
                trackColor={{ false: "#E5E7EB", true: Colors.success }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
            {gpsBoost && (
              <View style={styles.gpsActiveBanner}>
                <Navigation size={14} color={Colors.success} strokeWidth={2} />
                <Text style={styles.gpsActiveBannerText}>
                  Live location active · +15 ranking boost applied
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Bell size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Booking Updates</Text>
                  <Text style={styles.settingDescription}>
                    New bookings and status changes
                  </Text>
                </View>
              </View>
              <Switch
                value={bookingUpdates}
                onValueChange={setBookingUpdates}
                trackColor={{ false: "#E5E7EB", true: Colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Bell size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>New Messages</Text>
                  <Text style={styles.settingDescription}>
                    Customer messages and inquiries
                  </Text>
                </View>
              </View>
              <Switch
                value={newMessages}
                onValueChange={setNewMessages}
                trackColor={{ false: "#E5E7EB", true: Colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Bell size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Promotions & Tips</Text>
                  <Text style={styles.settingDescription}>
                    Marketing tips and platform updates
                  </Text>
                </View>
              </View>
              <Switch
                value={promotions}
                onValueChange={setPromotions}
                trackColor={{ false: "#E5E7EB", true: Colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION CHANNELS</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#E5E7EB", true: Colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#E5E7EB", true: Colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  "Payout Methods",
                  "This feature allows you to manage your payout bank accounts and payment methods.",
                  [{ text: "OK" }],
                );
              }}
            >
              <View style={styles.iconContainer}>
                <CreditCard size={20} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>Payout Methods</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  "Payout History",
                  "This feature shows all your past payouts and transaction history.",
                  [{ text: "OK" }],
                );
              }}
            >
              <View style={styles.iconContainer}>
                <FileText size={20} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>Payout History</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY & LEGAL</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                Linking.openURL("https://yourwebsite.com/privacy").catch(() => {
                  Alert.alert("Error", "Unable to open Privacy Policy");
                });
              }}
            >
              <View style={styles.iconContainer}>
                <Shield size={20} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                Linking.openURL("https://yourwebsite.com/terms").catch(() => {
                  Alert.alert("Error", "Unable to open Terms of Service");
                });
              }}
            >
              <View style={styles.iconContainer}>
                <FileText size={20} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                Linking.openURL("https://yourwebsite.com/help").catch(() => {
                  Alert.alert("Error", "Unable to open Help Center");
                });
              }}
            >
              <View style={styles.iconContainer}>
                <HelpCircle size={20} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>Help Center</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  "Contact Support",
                  "Email: support@yourapp.com\nPhone: +1 (555) 123-4567",
                  [
                    { text: "OK" },
                    {
                      text: "Email",
                      onPress: () => {
                        Linking.openURL("mailto:support@yourapp.com");
                      },
                    },
                  ],
                );
              }}
            >
              <View style={styles.iconContainer}>
                <HelpCircle size={20} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: "#D1FAE5",
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#2C2C2C",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  gpsActiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#A7F3D0",
  },
  gpsActiveBannerText: {
    fontSize: 13,
    color: "#065F46",
    fontWeight: "500" as const,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#2C2C2C",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 68,
  },
});
