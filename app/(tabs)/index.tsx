import React, { useContext, useEffect, useState } from "react";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { AuthContext } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { fetchChatRooms } from "@/services/chatroomService";
import GroupChat from "@/types/GroupChat";
import Entypo from '@expo/vector-icons/Entypo';
import CreateGroup from "@/components/CreateGroup";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  const { notifications, hasUnread } = useContext(NotificationContext);

  const router = useRouter();

  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);

  const DefaultGroupIcon = ("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSg5K8ooFP05Qm9qt1hBvApo5z4FCGefVx5w&s");

  const loadChatRooms = async () => {
    try {
        const chatRooms = await fetchChatRooms(); // Fetch chat rooms from the API
        setGroups(chatRooms);
    } catch (error) {
        console.error("Failed to load chat rooms:", error);
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
    loadChatRooms();
}, []);

if (loading) {
    return (
        <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
            <Text style={[styles.header, darkMode && styles.darkText]}>Loading...</Text>
        </SafeAreaView>
    );
}

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <Header
        username={user?.username ?? "Guest"}
        avatar={
          user?.profilePicture ??
          require("@/assets/images/avatar/default-avatar.jpeg")
        }
        darkMode={darkMode}
        hasUnreadNotifications={hasUnread}
      />

      <Text style={[styles.header, darkMode && styles.darkText]}>Chats</Text>

      <View style={styles.searchContainer}>
        <SearchBar darkMode={darkMode} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, styles.filterButtonActive]}
        >
          <Text style={styles.filterButtonTextActive}>All Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, darkMode && styles.darkFilterButton]}
        >
          <Text
            style={[
              styles.filterButtonText,
              darkMode && styles.darkFilterButtonText,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, darkMode && styles.darkFilterButton]}
        >
          <Text
            style={[
              styles.filterButtonText,
              darkMode && styles.darkFilterButtonText,
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.chatListContainer}>
          {groups.map((group) => (
            <View key={group.id} style={[
              styles.chatItemContainer, 
              darkMode && styles.darkChatItemContainer
            ]}>
              <Chat title={group.name} roomId= {group.id} icon={DefaultGroupIcon} darkMode={darkMode} />
            </View>
          ))}
        </View>
      </ScrollView>
      <View>
        <TouchableOpacity
          style={styles.CreateGroupIcon}
          onPress={() => setIsCreateGroupVisible(true)}
        >
          <Entypo name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Create Group Modal */}
      <CreateGroup
        visible={isCreateGroupVisible}
        onClose={() => setIsCreateGroupVisible(false)}
        onGroupCreated={(newGroup) => {
          console.log("New Group Created:", newGroup); // Debugging
          setGroups((prevGroups) => [
            { ...newGroup, id: parseInt(newGroup.id) } as GroupChat, 
            ...prevGroups
          ]); // Add the new group to the state
          loadChatRooms()
          setIsCreateGroupVisible(false); // Close the modal
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 15,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
  CreateGroupIcon: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: "#5d43ba",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 5,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  darkFilterButton: {
    backgroundColor: "#333",
  },
  filterButtonActive: {
    backgroundColor: "#4A90E2",
  },
  filterButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  darkFilterButtonText: {
    color: "#ccc",
  },
  filterButtonTextActive: {
    color: "white",
    fontWeight: "500",
  },
  chatListContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
  },
  chatItemContainer: {
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1, // Add border width
    borderColor: "#e0e0e0", // Light gray border for light mode
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  darkChatItemContainer: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333", // Darker border for dark mode
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
});
