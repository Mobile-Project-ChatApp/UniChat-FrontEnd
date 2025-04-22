import React, { useContext } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/config/apiConfig";

interface HeaderProps {
  username: string;
  avatar: any;
  darkMode?: boolean;
  hasUnreadNotifications?: boolean;
}

export default function Header({
  username,
  avatar,
  darkMode,
  hasUnreadNotifications,
}: HeaderProps) {
  const router = useRouter();
  const { user: authUser } = useContext(AuthContext);

  // const handleNotificationPress = () => {
  //   router.push("/NotificationScreen");
  // };
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.userInfo}>
        <Image
          source={
            typeof avatar === "string"
              ? { uri: `${API_BASE_URL}${authUser?.profilePicture}` }
              : avatar
          }
          style={styles.avatar}
        />
        <Text style={[styles.username, darkMode && styles.darkText]}>
          Welcome, {username}
        </Text>
      </View>
      {/* <TouchableOpacity
        style={[styles.iconButton, darkMode && styles.darkIconButton]}
        onPress={handleNotificationPress}
      >
        {hasUnreadNotifications && <View style={styles.notificationBadge} />}
        <MaterialIcons name="notifications" size={24} color="#4A90E2" />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  darkContainer: {
    backgroundColor: "#121212",
    borderBottomColor: "#333",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  iconButton: {
    padding: 10,
    marginLeft: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    position: "relative",
  },
  darkIconButton: {
    backgroundColor: "#333",
  },

  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    zIndex: 1,
  },
  darkText: {
    color: "#fff",
  },
});
