import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Check, ImagePlus, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@apollo/client";
import Colors from "@/constants/colors";
import { useAppDispatch } from "@/store";
import { addListing as addListingAction } from "@/store/providerSlice";
import { categories } from "@/constants/categories";
import { CREATE_LISTING_MUTATION } from "@/lib/mutations";
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
  pricePerHour: Yup.number().positive("Price must be positive").required("Price is required"),
  duration: Yup.number().positive("Duration must be positive").required("Duration is required"),
});

export default function AddListingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [createListing, { loading: saving }] = useMutation(CREATE_LISTING_MUTATION);

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
    pricePerHour: number;
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
            priceCents: Math.round(values.pricePerHour * 100),
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
            pricePerHour: values.pricePerHour,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Formik
        initialValues={{ title: "", description: "", category: "", pricePerHour: 0, duration: 0 }}
        validationSchema={addListingSchema}
        onSubmit={handleSave}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched, isValid }) => (
          <>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Service</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={[
                styles.contentContainer,
                { paddingBottom: insets.bottom + 100 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Service Title</Text>
                  <TextInput
                    style={[styles.input, touched.title && errors.title && styles.inputError]}
                    placeholder="e.g., Professional Home Cleaning"
                    placeholderTextColor="#9CA3AF"
                    value={values.title}
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                  />
                  {touched.title && errors.title && (
                    <Text style={styles.errorText}>{errors.title}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, touched.description && errors.description && styles.inputError]}
                    placeholder="Describe your service in detail..."
                    placeholderTextColor="#9CA3AF"
                    value={values.description}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {touched.description && errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}
                </View>

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
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Price per Hour</Text>
                    <View style={[styles.inputWithPrefix, touched.pricePerHour && errors.pricePerHour && styles.inputError]}>
                      <Text style={styles.inputPrefix}>₦</Text>
                      <TextInput
                        style={[styles.input, styles.inputWithPrefixInput]}
                        placeholder="45"
                        placeholderTextColor="#9CA3AF"
                        value={values.pricePerHour ? values.pricePerHour.toString() : ""}
                        onChangeText={(text) => setFieldValue("pricePerHour", parseFloat(text) || 0)}
                        onBlur={handleBlur("pricePerHour")}
                        keyboardType="numeric"
                      />
                    </View>
                    {touched.pricePerHour && errors.pricePerHour && (
                      <Text style={styles.errorText}>{errors.pricePerHour}</Text>
                    )}
                  </View>

                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Duration (hours)</Text>
                    <TextInput
                      style={[styles.input, touched.duration && errors.duration && styles.inputError]}
                      placeholder="2"
                      placeholderTextColor="#9CA3AF"
                      value={values.duration ? values.duration.toString() : ""}
                      onChangeText={(text) => setFieldValue("duration", parseFloat(text) || 0)}
                      onBlur={handleBlur("duration")}
                      keyboardType="numeric"
                    />
                    {touched.duration && errors.duration && (
                      <Text style={styles.errorText}>{errors.duration}</Text>
                    )}
                  </View>
                </View>

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
              <TouchableOpacity
                style={[styles.saveButton, (!isValid || saving || uploadingPhoto) && styles.saveButtonDisabled]}
                activeOpacity={0.8}
                disabled={!isValid || saving || uploadingPhoto}
                onPress={() => handleSubmit()}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Create Listing</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </Formik>
    </KeyboardAvoidingView>
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  photoHint: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
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
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    marginTop: 8,
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
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
