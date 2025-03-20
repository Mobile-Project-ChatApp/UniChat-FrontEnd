import User from "@/types/Users";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";

export default function Header({
  username,
  avatar,
}: {
  username: string;
  avatar: ImageSourcePropType;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        <View style={styles.avatarContainer}>
          <Image source={avatar} style={styles.avatar} />
        </View>
        <Text style={styles.username}>{username}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="search-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <View style={styles.notificationBadge}></View>
          <MaterialIcons name="notifications" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderRadius: 22,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
  },
  username: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#333",
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 10,
    marginLeft: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    zIndex: 1,
  }
});