import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { NotificationType } from "../types/types";

interface NotificationCardProps {
  type: NotificationType;
  content: string;
  read: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
  onMorePress: () => void;
  darkMode?: boolean;
}

function NotificationCard({
  type,
  content,
  read,
  onMorePress,
  darkMode,
}: NotificationCardProps) {
  const getIcon = () => {
    switch (type) {
      case "invite":
      case "kick":
        return "group";
      case "mention":
        return "alternate-email";
      case "announcement":
        return "campaign";
      default:
        return "notifications";
    }
  };

  return (
    <View
      style={[
        styles.card,
        read && styles.readCard,
        darkMode && styles.darkCard,
      ]}
    >
      <MaterialIcons
        name={getIcon()}
        size={24}
        color={darkMode ? "#82B1FF" : "#4A90E2"}
        style={styles.icon}
      />
      <Text style={[styles.text, darkMode && styles.darkText]}>{content}</Text>

      <TouchableOpacity onPress={onMorePress}>
        <MaterialIcons
          name="more-horiz"
          size={20}
          color={darkMode ? "#aaa" : "#666"}
        />
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(NotificationCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  readCard: {
    opacity: 0.6,
  },
  darkCard: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
});
