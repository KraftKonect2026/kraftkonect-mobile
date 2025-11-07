import { LogOut, Search, Star } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  { id: "1", name: "Plumbing", icon: "🔧" },
  { id: "2", name: "Electrical", icon: "⚡" },
  { id: "3", name: "Carpentry", icon: "🔨" },
  { id: "4", name: "Painting", icon: "🎨" },
  { id: "5", name: "Cleaning", icon: "🧹" },
  { id: "6", name: "Landscaping", icon: "🌿" },
];

const featured = [
  { id: "1", name: "John Smith", service: "Expert Plumber", rating: 4.9 },
  { id: "2", name: "Sarah Johnson", service: "Licensed Electrician", rating: 4.8 },
  { id: "3", name: "Mike Davis", service: "Master Carpenter", rating: 5.0 },
];

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name || "User"}!</Text>
              <Text style={styles.subtitle}>Find your perfect service provider</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={signOut}
              activeOpacity={0.7}
            >
              <LogOut size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for services..."
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Experts</Text>
            <View style={styles.featuredList}>
              {featured.map((expert) => (
                <TouchableOpacity
                  key={expert.id}
                  style={styles.expertCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.expertAvatar}>
                    <Text style={styles.expertInitial}>
                      {expert.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.expertInfo}>
                    <Text style={styles.expertName}>{expert.name}</Text>
                    <Text style={styles.expertService}>{expert.service}</Text>
                    <View style={styles.ratingContainer}>
                      <Star size={14} color="#FFA500" fill="#FFA500" />
                      <Text style={styles.rating}>{expert.rating}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  logoutButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 10,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "31%",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  featuredList: {
    gap: 12,
  },
  expertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expertAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  expertInitial: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  expertService: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
});
