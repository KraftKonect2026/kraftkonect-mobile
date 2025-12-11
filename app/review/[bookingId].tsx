import { X, Star } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";

import { mockBookings } from "@/mocks/bookings";
import Colors from "@/constants/colors";

const reviewTags = [
  "Punctual",
  "Polite",
  "Great Work",
  "Professional",
  "Would book again",
  "Not satisfied",
];

const reviewSchema = Yup.object().shape({
  rating: Yup.number()
    .min(1, "Please select a rating")
    .required("Rating is required"),
  selectedTags: Yup.array().of(Yup.string()),
  review: Yup.string()
    .max(500, "Review must be at most 500 characters"),
});

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();

  const booking = mockBookings.find((b) => b.id === bookingId);

  const [submitted, setSubmitted] = useState(false);
  const [successScale] = useState(new Animated.Value(0));

  if (!booking) {
    return null;
  }

  const handleSubmit = () => {
    setSubmitted(true);
    Animated.spring(successScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      router.back();
    }, 2000);
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={[styles.successContainer, { paddingTop: insets.top }]}>
          <Animated.View
            style={[
              styles.successContent,
              { transform: [{ scale: successScale }] },
            ]}
          >
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Thanks for your feedback!</Text>
            <Text style={styles.successText}>
              Your review helps others make informed decisions
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ rating: 0, selectedTags: [] as string[], review: "" }}
        validationSchema={reviewSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit: formikSubmit, setFieldValue, values, errors, touched }) => (
          <>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <X size={24} color="#2C2C2C" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Leave a Review</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.providerSection}>
                <Text style={styles.rateText}>
                  Rate your experience with{"\n"}
                  <Text style={styles.providerName}>{booking.providerName}</Text>
                </Text>
              </View>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setFieldValue("rating", star)}
                    activeOpacity={0.7}
                    style={styles.starButton}
                  >
                    <Star
                      size={48}
                      color={star <= values.rating ? "#F59E0B" : "#E5E7EB"}
                      fill={star <= values.rating ? "#F59E0B" : "transparent"}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {touched.rating && errors.rating && (
                <Text style={styles.errorText}>{errors.rating}</Text>
              )}

              {values.rating > 0 && (
                <Text style={styles.ratingLabel}>
                  {values.rating === 1 && "Poor"}
                  {values.rating === 2 && "Fair"}
                  {values.rating === 3 && "Good"}
                  {values.rating === 4 && "Very Good"}
                  {values.rating === 5 && "Excellent"}
                </Text>
              )}

              <View style={styles.tagsSection}>
                <Text style={styles.sectionTitle}>Quick feedback (optional)</Text>
                <View style={styles.tagsContainer}>
                  {reviewTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tag,
                        values.selectedTags.includes(tag) && styles.tagSelected,
                      ]}
                      onPress={() => {
                        const newTags = values.selectedTags.includes(tag)
                          ? values.selectedTags.filter((t) => t !== tag)
                          : [...values.selectedTags, tag];
                        setFieldValue("selectedTags", newTags);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          values.selectedTags.includes(tag) && styles.tagTextSelected,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.textSection}>
                <Text style={styles.sectionTitle}>
                  Share more about your experience (optional)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={values.review}
                  onChangeText={handleChange("review")}
                  onBlur={handleBlur("review")}
                  placeholder="Tell us what you think..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{values.review.length}/500</Text>
                {touched.review && errors.review && (
                  <Text style={styles.errorText}>{errors.review}</Text>
                )}
              </View>
            </ScrollView>

            <View
              style={[
                styles.bottomActions,
                { paddingBottom: insets.bottom + 16 },
              ]}
            >
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  values.rating === 0 && styles.submitButtonDisabled,
                ]}
                onPress={() => formikSubmit()}
                activeOpacity={0.8}
                disabled={values.rating === 0}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    values.rating === 0 && styles.submitButtonTextDisabled,
                  ]}
                >
                  Submit Review
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  providerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  rateText: {
    fontSize: 20,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 30,
  },
  providerName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#F59E0B",
    textAlign: "center",
    marginBottom: 32,
  },
  tagsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  tagSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  tagTextSelected: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  textSection: {
    marginBottom: 32,
  },
  textInput: {
    height: 140,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 15,
    color: "#2C2C2C",
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 8,
    textAlign: "center",
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  submitButtonTextDisabled: {
    color: "#9CA3AF",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 40,
  },
  successContent: {
    alignItems: "center",
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 56,
    color: "#059669",
    fontWeight: "700" as const,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
});
