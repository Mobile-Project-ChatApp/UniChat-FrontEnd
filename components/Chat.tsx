import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface ChatProps {
  title: string;
  icon: string;
  darkMode?: boolean;
}

export default function Chat({ title, icon, darkMode }: ChatProps) {
  const router = useRouter();

  const handlePress = () => {
    console.log("Navigating to Chatroom with:", { title, icon });
    // Use the path that matches your file structure according to TypeScript
    router.push({
      pathname: "/Chatroom/Chatroom",
      params: { title, icon }
    });
  };

  return (
    <TouchableOpacity
      style={[styles.container, darkMode && styles.darkContainer]}
      onPress={handlePress}
    >
      <Image source={{ uri: icon }} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
        <Text style={[styles.lastMessage, darkMode && styles.darkSecondaryText]}>
          Tap to join the conversation
        </Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.time, darkMode && styles.darkSecondaryText]}>Now</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>New</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
  },
  darkContainer: {
    backgroundColor: "#1E1E1E",
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  darkSecondaryText: {
    color: "#aaa",
  },
  infoContainer: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  badge: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});