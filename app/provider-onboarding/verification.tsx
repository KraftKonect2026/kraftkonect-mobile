import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, ArrowRight, Camera, Shield, Upload, Loader2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useProviderOnboarding } from "./context";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { Button } from "@/components/Button";

export default function VerificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { verification, setVerification } = useProviderOnboarding();
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  const handleUpload = async (type: 'id' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        if (type === 'id') setUploadingId(true);
        else setUploadingSelfie(true);

        const url = await uploadImageToCloudinary(result.assets[0].uri);

        setVerification({
          ...verification,
          [type === 'id' ? 'idUrl' : 'selfieUrl']: url
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setUploadingId(false);
      setUploadingSelfie(false);
    }
  };

  const isValid = !!verification.idUrl && !!verification.selfieUrl;
  const checkmarkContainerStyle = styles.checkmarkContainer;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.step}>Step 3 of 5</Text>
          <Text style={styles.title}>Verify your identity</Text>
          <Text style={styles.subtitle}>
            This helps us keep KraftKonect safe and trustworthy for everyone
          </Text>
        </View>

        <View style={styles.verificationContainer}>
          <View style={styles.securityBadge}>
            <Shield size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.securityText}>
              Your information is encrypted and secure
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.uploadCard, !!verification.idUrl && styles.uploadCardComplete]}
            activeOpacity={0.7}
            onPress={() => handleUpload('id')}
            disabled={uploadingId}
          >
            <View style={styles.uploadIconContainer}>
              {uploadingId ? (
                <Loader2 size={24} color={Colors.primary} />
              ) : (
                <Upload
                  size={28}
                  color={verification.idUrl ? Colors.primary : "#6B7280"}
                  strokeWidth={2}
                />
              )}
            </View>
            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadTitle}>Upload Government ID</Text>
              <Text style={styles.uploadDescription}>
                {verification.idUrl
                  ? "ID uploaded successfully"
                  : uploadingId
                    ? "Uploading..."
                    : "Passport, driver's license, or national ID"}
              </Text>
            </View>
            {verification.idUrl && (
              <View style={checkmarkContainerStyle}>
                <View style={styles.checkmark} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadCard, !!verification.selfieUrl && styles.uploadCardComplete]}
            activeOpacity={0.7}
            onPress={() => handleUpload('selfie')}
            disabled={uploadingSelfie}
          >
            <View style={styles.uploadIconContainer}>
              {uploadingSelfie ? (
                <Loader2 size={24} color={Colors.primary} />
              ) : (
                <Camera
                  size={28}
                  color={verification.selfieUrl ? Colors.primary : "#6B7280"}
                  strokeWidth={2}
                />
              )}
            </View>
            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadTitle}>Take a Selfie</Text>
              <Text style={styles.uploadDescription}>
                {verification.selfieUrl
                  ? "Selfie uploaded successfully"
                  : uploadingSelfie
                    ? "Uploading..."
                    : "Hold your ID next to your face"}
              </Text>
            </View>
            {verification.selfieUrl && (
              <View style={checkmarkContainerStyle}>
                <View style={styles.checkmark} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Why do we need this?</Text>
            <Text style={styles.infoText}>
              • Verify your identity{"\n"}
              • Build trust with customers{"\n"}
              • Comply with safety regulations{"\n"}
              • Protect your account security
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title="Continue"
          onPress={() => router.push("/provider-onboarding/experience" as any)}
          disabled={!isValid}
          icon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
        />
      </View>
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  titleContainer: {
    marginBottom: 32,
  },
  step: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  verificationContainer: {
    gap: 16,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500" as const,
  },
  uploadCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderStyle: "dashed",
    gap: 16,
  },
  uploadCardComplete: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
    borderStyle: "solid",
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  uploadDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    width: 12,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FFFFFF",
    transform: [{ rotate: "-45deg" }],
    marginBottom: 3,
  },
  infoCard: {
    padding: 20,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
