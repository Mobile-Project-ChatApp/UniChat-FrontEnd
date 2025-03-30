import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

interface HeaderProps {
  username: string;
  avatar: any;
  darkMode?: boolean;
}

export default function Header({ username, avatar, darkMode }: HeaderProps) {
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.userInfo}>
        <Image source={typeof avatar === 'string' ? { uri: avatar } : avatar} style={styles.avatar} />
        <Text style={[styles.username, darkMode && styles.darkText]}>
          Welcome, {username}
        </Text>
      </View>
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
  darkText: {
    color: "#fff",
  },
});