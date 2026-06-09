import { ArrowLeft, User } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

import { useAppSelector, useAppDispatch } from "@/store";
import { updateUser as updateUserAction } from "@/store/authSlice";
import Colors from "@/constants/colors";
import { Image } from "expo-image";

const editProfileSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9+\-\s()]*$/, "Invalid phone number")
    .min(10, "Phone number must be at least 10 digits"),
  address: Yup.string(),
});

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleSave = async (values: { name: string; email: string; phone: string }) => {
    await dispatch(updateUserAction({ name: values.name, email: values.email, phone: values.phone }));
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <Formik
        initialValues={{
          name: user?.name || "",
          email: user?.email || "",
          phone: "",
          address: "",
        }}
        validationSchema={editProfileSchema}
        onSubmit={handleSave}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
          <>
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                  {user?.avatarUrl ? (
                    <Image
                      source={{ uri: user.avatarUrl }}
                      style={{ width: "100%", height: "100%", borderRadius: 50 }}
                    />
                  ) : (
                    <User size={48} color={Colors.primary} strokeWidth={2} />
                  )}
                </View>
                <TouchableOpacity style={styles.changePhotoButton} activeOpacity={0.7}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  touched={touched.name}
                  error={errors.name}
                />

                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  touched={touched.email}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={values.phone}
                  onChangeText={handleChange("phone")}
                  onBlur={handleBlur("phone")}
                  touched={touched.phone}
                  error={errors.phone}
                  keyboardType="phone-pad"
                />

                <Input
                  label="Address (Optional)"
                  placeholder="Enter your address"
                  value={values.address}
                  onChangeText={handleChange("address")}
                  onBlur={handleBlur("address")}
                  multiline
                  numberOfLines={3}
                  style={{ height: 100, borderRadius: 20 }}
                  inputStyle={{ textAlignVertical: "top", paddingTop: 12 }}
                />
              </View>
            </ScrollView>

            <View
              style={[
                styles.bottomActions,
                { paddingBottom: insets.bottom + 16 },
              ]}
            >
              <Button
                title="Save Changes"
                onPress={() => handleSubmit()}
                loading={isSubmitting}
              />
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
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
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
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: "#2C2C2C",
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
    height: 100,
    paddingTop: 14,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
