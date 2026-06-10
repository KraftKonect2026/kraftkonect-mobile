import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Alert, ActivityIndicator } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  DollarSign,
  Settings as SettingsIcon,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Star,
  Camera,
} from "lucide-react-native";
import { useQuery, useMutation } from "@apollo/client";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useAppSelector, useAppDispatch } from "@/store";
import { updateUser as updateUserAction } from "@/store/authSlice";
import { MY_PROVIDER_PROFILE_QUERY, BOOKINGS_FOR_PROVIDER_QUERY } from "@/lib/queries";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { UPDATE_MY_PROVIDER_PROFILE_MUTATION, EDIT_PROFILE_MUTATION } from "@/lib/mutations";

function isWithinLast7Days(isoDate: string): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate).getTime();
  return Date.now() - d <= 7 * 24 * 60 * 60 * 1000;
}

export default function ProviderProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const { data: profileData, refetch: refetchProfile } = useQuery(MY_PROVIDER_PROFILE_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const { data: bookingsData } = useQuery(BOOKINGS_FOR_PROVIDER_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [updateMyProviderProfile] = useMutation(UPDATE_MY_PROVIDER_PROFILE_MUTATION);
  const [editProfile] = useMutation(EDIT_PROFILE_MUTATION);

  const profile = profileData?.myProviderProfile;
  const rating = profile?.rating != null ? Number(profile.rating).toFixed(1) : "—";
  const reviewCount = profile?.reviewCount ?? 0;

  const earningsThisWeek = (bookingsData?.bookingsForProvider ?? [])
    .filter((b: any) => b.status === "completed" && isWithinLast7Days(b.createdAt))
    .reduce((sum: number, b: any) => sum + (b.totalPriceCents ?? 0) / 100, 0);

  const pickAndUpload = async (
    aspect: [number, number],
    onUpload: (url: string) => Promise<void>,
    setUploading: (v: boolean) => void,
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(result.assets[0].uri);
      await onUpload(url);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleChangeAvatar = () =>
    pickAndUpload([1, 1], async (url) => {
      await editProfile({ variables: { avatarUrl: url } });
      dispatch(updateUserAction({ avatarUrl: url }));
    }, setAvatarUploading);

  const handleChangeBanner = () =>
    pickAndUpload([16, 9], async (url) => {
      await updateMyProviderProfile({ variables: { input: { banner: url } } });
      await refetchProfile();
    }, setBannerUploading);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          {/* Banner */}
          <TouchableOpacity
            style={styles.bannerContainer}
            activeOpacity={0.85}
            onPress={handleChangeBanner}
            disabled={bannerUploading}
          >
            {profile?.banner ? (
              <Image
                source={{ uri: profile.banner }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}
            <View style={styles.bannerOverlay}>
              {bannerUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Camera size={20} color="#fff" strokeWidth={2} />
              )}
              <Text style={styles.bannerOverlayText}>
                {bannerUploading ? "Uploading…" : "Change Banner"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.85}
            onPress={handleChangeAvatar}
            disabled={avatarUploading}
          >
            <View style={styles.avatar}>
              {profile?.avatar || user?.avatarUrl ? (
                <Image
                  source={{ uri: profile?.avatar || user?.avatarUrl }}
                  style={{ width: "100%", height: "100%", borderRadius: 50 }}
                />
              ) : (
                <User size={48} color={Colors.primary} strokeWidth={2} />
              )}
            </View>
            <View style={styles.avatarCameraBadge}>
              {avatarUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={14} color="#fff" strokeWidth={2.5} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{user?.name || "Provider"}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FCD34D" strokeWidth={2} fill="#FCD34D" />
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.ratingCount}>
              ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
            </Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Earnings This Week</Text>
          <Text style={styles.earningsValue}>₦{earningsThisWeek.toLocaleString()}</Text>
          <TouchableOpacity
            style={styles.earningsButton}
            activeOpacity={0.8}
            onPress={() => router.push("/provider/earnings" as any)}
          >
            <DollarSign size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.earningsButtonText}>View Earnings</Text>
            <ChevronRight size={16} color={Colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => router.push("/edit-profile" as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <User size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Edit Profile</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push("/provider/settings" as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <SettingsIcon size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Settings</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
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
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <HelpCircle size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Help Center</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.fab, { bottom: insets.bottom + 96 }]}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.9}
          onPress={() => router.replace("/(app)/profile" as any)}
        >
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fabButtonText}>Switch to Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 24,
  },
  profileCard: {
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
  },
  bannerContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#E5E7EB",
    marginBottom: 0,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  bannerPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${Colors.primary}22`,
  },
  bannerOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    margin: 8,
  },
  bannerOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  avatarWrapper: {
    marginTop: -40,
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  ratingCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  earningsCard: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  earningsTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  earningsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    gap: 6,
  },
  earningsButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  fab: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fabButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
