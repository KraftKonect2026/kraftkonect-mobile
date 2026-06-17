import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,  } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Check, ImagePlus, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@apollo/client";
import Colors from "@/constants/colors";
import { Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { GradientHeader } from "@/components/GradientHeader";
import { useAppDispatch } from "@/store";
import { addListing as addListingAction } from "@/store/providerSlice";
import { categories } from "@/constants/categories";
import { CREATE_LISTING_MUTATION } from "@/lib/mutations";
import { MY_LISTINGS_QUERY } from "@/lib/queries";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { useToast } from "@/lib/toast";

const addListingSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, "Title must be at least 5 characters")
    .required("Title is required"),
  description: Yup.string()
    .min(20, "Description must be at least 20 characters")
    .required("Description is required"),
  category: Yup.string().required("Category is required"),
  minPrice: Yup.number().positive("Min price must be positive").required("Min price is required"),
  maxPrice: Yup.number()
    .positive("Max price must be positive")
    .required("Max price is required")
    .min(Yup.ref("minPrice"), "Max price cannot be less than min price"),
  duration: Yup.number().positive("Duration must be positive").required("Duration is required"),
});

export default function AddListingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [createListing, { loading: saving }] = useMutation(CREATE_LISTING_MUTATION, {
    // Refresh the provider's services list so the new listing appears immediately.
    refetchQueries: [{ query: MY_LISTINGS_QUERY }],
    awaitRefetchQueries: true,
  });

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });
      if (result.canceled) return;
      setUploadingPhoto(true);
      const url = await uploadImageToCloudinary(result.assets[0].uri);
      setPhotos((prev) => [...prev, url]);
    } catch {
      Alert.alert("Upload failed", "Couldn't upload that photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (url: string) =>
    setPhotos((prev) => prev.filter((p) => p !== url));

  const handleSave = async (values: {
    title: string;
    description: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    duration: number;
  }) => {
    if (photos.length === 0) {
      showToast("error", "Add at least one photo so customers can see your work.");
      return;
    }
    try {
      const { data } = await createListing({
        variables: {
          input: {
            title: values.title,
            description: values.description,
            category: values.category,
            priceCents: Math.round(values.minPrice * 100),
            minPriceCents: Math.round(values.minPrice * 100),
            maxPriceCents: Math.round(values.maxPrice * 100),
            durationMinutes: Math.round(values.duration * 60),
            currency: "ngn",
            photos,
          },
        },
      });

      // Keep the local provider services tab in sync with the new listing.
      if (data?.createListing) {
        dispatch(
          addListingAction({
            title: values.title,
            description: values.description,
            category: values.category,
            pricePerHour: values.minPrice,
            duration: values.duration,
            visible: true,
            photos,
          }),
        );
      }

      showToast("success", "Service listing created!");
      router.back();
    } catch (e: any) {
      showToast("error", e.message || "Couldn't create the listing. Please try again.");
    }
  };

  return (
    <ScreenBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <Formik
        initialValues={{ title: "", description: "", category: "", minPrice: 0, maxPrice: 0, duration: 0 }}
        validationSchema={addListingSchema}
        onSubmit={handleSave}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched, isValid }) => (
          <>
            <GradientHeader title="Add Service" showBack />

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
                  value={values.title}
                  onChangeText={handleChange("title")}
                  onBlur={handleBlur("title")}
                  touched={touched.title}
                  error={errors.title}
                />

                <Input
                  label="Description"
                  placeholder="Describe your service in detail..."
                  value={values.description}
                  onChangeText={handleChange("description")}
                  onBlur={handleBlur("description")}
                  touched={touched.description}
                  error={errors.description}
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
                          values.category === cat.id && styles.categoryChipSelected,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setFieldValue("category", cat.id)}
                      >
                        {values.category === cat.id && (
                          <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                        )}
                        <Text
                          style={[
                            styles.categoryChipText,
                            values.category === cat.id && styles.categoryChipTextSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {touched.category && errors.category && (
                    <Text style={styles.errorText}>{errors.category}</Text>
                  )}
                </View>

                <View style={styles.row}>
                  <View style={styles.inputGroupHalf}>
                    <Input
                      label="Min Price"
                      placeholder="e.g. 5000"
                      value={values.minPrice ? values.minPrice.toString() : ""}
                      onChangeText={(text) => setFieldValue("minPrice", parseFloat(text) || 0)}
                      onBlur={handleBlur("minPrice")}
                      touched={touched.minPrice}
                      error={errors.minPrice}
                      keyboardType="numeric"
                      icon={<Text style={{ fontSize: 16, fontWeight: "600", color: "#2C2C2C" }}>₦</Text>}
                    />
                  </View>

                  <View style={styles.inputGroupHalf}>
                    <Input
                      label="Max Price"
                      placeholder="e.g. 15000"
                      value={values.maxPrice ? values.maxPrice.toString() : ""}
                      onChangeText={(text) => setFieldValue("maxPrice", parseFloat(text) || 0)}
                      onBlur={handleBlur("maxPrice")}
                      touched={touched.maxPrice}
                      error={errors.maxPrice}
                      keyboardType="numeric"
                      icon={<Text style={{ fontSize: 16, fontWeight: "600", color: "#2C2C2C" }}>₦</Text>}
                    />
                  </View>
                </View>

                <Input
                  label="Duration (hours)"
                  placeholder="2"
                  value={values.duration ? values.duration.toString() : ""}
                  onChangeText={(text) => setFieldValue("duration", parseFloat(text) || 0)}
                  onBlur={handleBlur("duration")}
                  touched={touched.duration}
                  error={errors.duration}
                  keyboardType="numeric"
                />

                {/* Photos — required so the listing surfaces to customers */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Photos of your work</Text>
                  <View style={styles.photosRow}>
                    {photos.map((url) => (
                      <View key={url} style={styles.photoThumb}>
                        <Image source={{ uri: url }} style={styles.photoImage} contentFit="cover" />
                        <TouchableOpacity
                          style={styles.photoRemove}
                          onPress={() => removePhoto(url)}
                          activeOpacity={0.8}
                        >
                          <X size={12} color="#FFFFFF" strokeWidth={3} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addPhotoButton}
                      onPress={handleAddPhoto}
                      activeOpacity={0.7}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <ImagePlus size={24} color={Colors.primary} strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.photoHint}>
                    At least one photo is required for your service to appear in search.
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>💡 Tips for a great listing</Text>
                  <Text style={styles.infoText}>
                    • Be specific about what&apos;s included{"\n"}
                    • List your experience and qualifications{"\n"}
                    • Set competitive pricing{"\n"}
                    • Add photos to showcase your work
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
              <Button
                title="Create Listing"
                onPress={() => handleSubmit()}
                loading={saving}
                disabled={!isValid || uploadingPhoto}
              />
            </View>
          </>
        )}
      </Formik>
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
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 4,
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
  photosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: { width: "100%", height: "100%", backgroundColor: "#F3F4F6" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(219,234,254,0.7)",
  },
  photoHint: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
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
  infoCard: {
    padding: 20,
    backgroundColor: "rgba(219,234,254,0.7)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.18)",
    borderRadius: Radius.md,
    marginTop: 8,
    ...Shadows.soft,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 24,
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
});
