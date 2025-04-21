import React, { useContext } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AuthContext } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { API_BASE_URL } from "@/config/apiConfig";

export default function AvatarScreen() {
  const router = useRouter();
  const { user: authUser, updateUser } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  const avatarOptions = Array.from({ length: 8 }, (_, i) => ({
    uri: `/avatars/avatar${i + 1}.png`,
  }));

  const handleAvatarSelect = async (avatarUri: string) => {
    try {
      await updateUser({ profilePicture: avatarUri });
      Alert.alert("Success", "Avatar updated successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update avatar");
    }
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.title, darkMode && styles.darkText]}>
        Please Choose Your Avatar
      </Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {avatarOptions.map((avatar, index) => {
          const isSelected = authUser?.profilePicture === avatar.uri;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleAvatarSelect(avatar.uri)}
              style={[styles.avatarBox, isSelected && styles.selectedBorder]}
            >
              <Image
                source={{ uri: `${API_BASE_URL}${avatar.uri}` }}
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  avatarBox: {
    width: "47%",
    aspectRatio: 1,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
  },
  avatarImage: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
    borderRadius: 100,
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: "#4A90E2",
    backgroundColor: "#eaf4ff",
  },
});
