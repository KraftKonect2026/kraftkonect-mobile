import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,  } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import { Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Radius, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { GradientHeader } from "@/components/GradientHeader";
import { categories } from "@/constants/categories";
import { MY_LISTINGS_QUERY } from "@/lib/queries";
import { UPDATE_LISTING_MUTATION } from "@/lib/mutations";
import { useToast } from "@/lib/toast";

export default function EditListingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();

  const { data, loading: loadingListing } = useQuery(MY_LISTINGS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [updateListing, { loading: saving }] = useMutation(UPDATE_LISTING_MUTATION);

  const listing = (data?.myProviderProfile?.services ?? []).find(
    (l: any) => l.id === id,
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [duration, setDuration] = useState("");

  // Populate the form once the listing loads from the backend.
  useEffect(() => {
    if (listing) {
      setTitle(listing.title ?? "");
      setDescription(listing.description ?? "");
      setCategory(listing.category ?? "");
      setPricePerHour(((listing.priceCents ?? 0) / 100).toString());
      setDuration(((listing.durationMinutes ?? 0) / 60).toString());
    }
  }, [listing?.id]);

  if (loadingListing && !listing) {
    return (
      <ScreenBackground>
        <View style={[styles.container, styles.errorContainer]}>
          <Stack.Screen options={{ headerShown: false }} />
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  if (!listing) {
    return (
      <ScreenBackground>
        <Stack.Screen options={{ headerShown: false }} />
        <GradientHeader title="Edit Service" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Listing not found</Text>
        </View>
      </ScreenBackground>
    );
  }

  const isValid =
    title.length > 0 &&
    description.length > 0 &&
    category.length > 0 &&
    pricePerHour.length > 0 &&
    duration.length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    try {
      await updateListing({
        variables: {
          id: listing.id,
          input: {
            title,
            description,
            category,
            priceCents: Math.round(parseFloat(pricePerHour) * 100),
            durationMinutes: Math.round(parseFloat(duration) * 60),
          },
        },
      });
      showToast("success", "Listing updated.");
      router.back();
    } catch (e: any) {
      showToast("error", e.message || "Couldn't update the listing. Please try again.");
    }
  };

  return (
    <ScreenBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <GradientHeader title="Edit Service" showBack />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Input
            label="Service Title"
            placeholder="e.g., Professional Home Cleaning"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Description"
            placeholder="Describe your service in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, borderRadius: 20 }}
            inputStyle={{ textAlignVertical: "top", paddingTop: 12 }}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    category === cat.id && styles.categoryChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setCategory(cat.id)}
                >
                  {category === cat.id && (
                    <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat.id && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputGroupHalf}>
              <Input
                label="Price per Hour"
                placeholder="45"
                value={pricePerHour}
                onChangeText={setPricePerHour}
                keyboardType="numeric"
                icon={<Text style={{ fontSize: 16, fontWeight: "600", color: "#2C2C2C" }}>₦</Text>}
              />
            </View>

            <View style={styles.inputGroupHalf}>
              <Input
                label="Duration (hours)"
                placeholder="2"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={!isValid}
        />
      </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2C2C2C",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...glassSurface,
    borderRadius: Radius.md,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#2C2C2C",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingLeft: 16,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginRight: 4,
  },
  inputWithPrefixInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderTopWidth: 1,
    borderTopColor: "rgba(17,24,39,0.06)",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
