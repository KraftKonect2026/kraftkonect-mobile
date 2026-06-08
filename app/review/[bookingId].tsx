import { X, Star, AlertCircle } from "lucide-react-native";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";

import Colors from "@/constants/colors";
import { BOOKING_DETAIL_QUERY } from "@/lib/queries";
import { CREATE_REVIEW_MUTATION } from "@/lib/mutations";

// ── Constants ─────────────────────────────────────────────────────────────────

const REVIEW_TAGS = [
  "Punctual",
  "Polite",
  "Great Work",
  "Professional",
  "Would book again",
  "Not satisfied",
];

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

// Build the final comment the backend receives.
// Tags are prepended so they contribute to the 10-char minimum even when
// the freeform text is short.
function buildComment(tags: string[], text: string): string {
  const parts: string[] = [];
  if (tags.length) parts.push(tags.join(", "));
  if (text.trim()) parts.push(text.trim());
  return parts.join(" · ");
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;

  // ── Load booking ────────────────────────────────────────────────────────────

  const { data, loading: bookingLoading, error: bookingError } = useQuery(
    BOOKING_DETAIL_QUERY,
    {
      variables: { id: bookingId },
      skip: !bookingId,
      fetchPolicy: "network-only",
    },
  );

  const raw = data?.booking;

  // Guard: redirect if booking is not completed
  useEffect(() => {
    if (!raw) return;
    if (raw.status !== "completed") {
      Alert.alert(
        "Not available yet",
        "You can only leave a review once the job is marked as completed.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    }
  }, [raw]);

  // ── Mutation ─────────────────────────────────────────────────────────────────

  const [createReview, { loading: submitting }] = useMutation(CREATE_REVIEW_MUTATION);

  const handleSubmit = async () => {
    if (rating === 0) return;

    const comment = buildComment(selectedTags, reviewText);

    // Backend requires comment ≥ 10 chars
    if (comment.length < 10) {
      setSubmitError(
        "Please write a short comment or select at least one tag so your feedback is helpful.",
      );
      return;
    }

    setSubmitError(null);

    try {
      await createReview({
        variables: {
          bookingId,
          rating,
          comment,
          photos: [],
        },
      });

      // Show success animation then navigate back
      setSubmitted(true);
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      setTimeout(() => router.back(), 2000);
    } catch (e: any) {
      const msg: string = e?.message ?? "Something went wrong";
      if (msg.toLowerCase().includes("already")) {
        setSubmitError("You have already reviewed this booking.");
      } else if (msg.toLowerCase().includes("completed")) {
        setSubmitError("Only completed bookings can be reviewed.");
      } else {
        setSubmitError(msg);
      }
    }
  };

  // ── States ──────────────────────────────────────────────────────────────────

  if (bookingLoading) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (bookingError || !raw) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <AlertCircle size={40} color="#9CA3AF" strokeWidth={1.5} />
        <Text style={styles.errorStateTitle}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.errorStateLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const providerName = raw.provider?.name ?? "the artisan";

  // Success screen
  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={[styles.successContainer, { paddingTop: insets.top }]}>
          <Animated.View
            style={[styles.successContent, { transform: [{ scale: successScale }] }]}
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

  // ── Form ────────────────────────────────────────────────────────────────────

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    setSubmitError(null);
  };

  const canSubmit = rating > 0 && !submitting;

  return (
    <View style={styles.container}>
      {/* Header */}
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Provider name */}
        <View style={styles.providerSection}>
          <Text style={styles.rateText}>
            Rate your experience with{"\n"}
            <Text style={styles.providerName}>{providerName}</Text>
          </Text>
        </View>

        {/* Star rating */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => { setRating(star); setSubmitError(null); }}
              activeOpacity={0.7}
              style={styles.starButton}
            >
              <Star
                size={48}
                color={star <= rating ? "#F59E0B" : "#E5E7EB"}
                fill={star <= rating ? "#F59E0B" : "transparent"}
                strokeWidth={2}
              />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
        )}

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Quick feedback (optional)</Text>
          <View style={styles.tagsContainer}>
            {REVIEW_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Freeform comment */}
        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>
            Share more about your experience (optional)
          </Text>
          <TextInput
            style={styles.textInput}
            value={reviewText}
            onChangeText={(t) => { setReviewText(t); setSubmitError(null); }}
            placeholder="Tell us what you think..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{reviewText.length}/500</Text>
        </View>

        {/* Submission error */}
        {submitError && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#991B1B" strokeWidth={2} />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.submitButtonText,
                !canSubmit && styles.submitButtonTextDisabled,
              ]}
            >
              Submit Review
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  centeredState: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 40,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  errorStateLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600" as const,
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
  closeButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: "#2C2C2C" },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  providerSection: { alignItems: "center", marginBottom: 32 },
  rateText: { fontSize: 20, color: "#6B7280", textAlign: "center", lineHeight: 30 },
  providerName: { fontSize: 22, fontWeight: "700" as const, color: "#2C2C2C" },

  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  starButton: { padding: 4 },
  ratingLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#F59E0B",
    textAlign: "center",
    marginBottom: 32,
  },

  tagsSection: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  tagSelected: { backgroundColor: "#EFF6FF", borderColor: Colors.primary },
  tagText: { fontSize: 14, fontWeight: "500" as const, color: "#6B7280" },
  tagTextSelected: { color: Colors.primary, fontWeight: "600" as const },

  textSection: { marginBottom: 24 },
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
  charCount: { fontSize: 12, color: "#9CA3AF", textAlign: "right", marginTop: 8 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: "#991B1B",
    lineHeight: 20,
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
  skipButtonText: { fontSize: 16, fontWeight: "600" as const, color: "#6B7280" },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.primary,
    justifyContent: "center",
    minHeight: 52,
  },
  submitButtonDisabled: { backgroundColor: "#E5E7EB" },
  submitButtonText: { fontSize: 16, fontWeight: "600" as const, color: "#FFFFFF" },
  submitButtonTextDisabled: { color: "#9CA3AF" },

  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 40,
  },
  successContent: { alignItems: "center" },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  checkmark: { fontSize: 56, color: "#059669", fontWeight: "700" as const },
  successTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: { fontSize: 16, color: "#6B7280", textAlign: "center", lineHeight: 24 },
});
