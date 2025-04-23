import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { initializeSignalRConnection } from "@/utils/SignalRConnection";
import { API_BASE_URL } from "@/config/apiConfig";

interface ChatProps {
  title: string;
  icon: string;
  darkMode?: boolean;
  roomId: number;
}

export default function Chat({ title, icon, darkMode, roomId }: ChatProps) {
  const router = useRouter();

  const handlePress = async () => {
    console.log("Joining Chatroom:", { title, icon, roomId });
    
    try {
      // Initialize and connect to SignalR
      const connection = await initializeSignalRConnection();
      
      if (connection) {
        // Check if connection is already established
        if (connection.state !== "Connected") {
          await connection.start();
        }
        
        // Join the room
        await connection.invoke("JoinRoom", roomId);
        console.log(`Successfully joined room ${roomId}`);
        
        // Navigate to the chatroom after successfully joining
        router.push({
          pathname: "/Chatroom/Chatroom",
          params: { title, icon, roomId },
        });
      } else {
        console.error("Failed to initialize SignalR connection");
        // Still navigate, connection will be attempted again in the Chatroom component
        router.push({
          pathname: "/Chatroom/Chatroom",
          params: { title, icon, roomId },
        });
      }
    } catch (error) {
      console.error("Error joining room:", error);
      // Still navigate, connection will be attempted again in the Chatroom component
      router.push({
        pathname: "/Chatroom/Chatroom",
        params: { title, icon, roomId },
      });
    }
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