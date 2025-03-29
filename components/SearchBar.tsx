import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  darkMode?: boolean;
}

export default function SearchBar({ darkMode }: SearchBarProps) {
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Ionicons name="search" size={20} color={darkMode ? "#aaa" : "#666"} style={styles.searchIcon} />
      <TextInput
        placeholder="Search chats..."
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        style={[styles.searchInput, darkMode && styles.darkSearchInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  darkContainer: {
    backgroundColor: "#333",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  darkSearchInput: {
    color: "#fff",
  },
});