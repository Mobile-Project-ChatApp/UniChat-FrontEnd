import React, { useContext, useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { AuthContext } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { fetchChatRooms, fetchOwnChatRooms } from "@/services/chatroomService";
import GroupChat from "@/types/GroupChat";
import Entypo from "@expo/vector-icons/Entypo";
import CreateGroup from "@/components/CreateGroup";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const { notifications, hasUnread } = useContext(NotificationContext);
  const router = useRouter();

  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [allGroups, setAllGroups] = useState<GroupChat[]>([]); // Store all groups
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "own">("all");

  const DefaultGroupIcon =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSg5K8ooFP05Qm9qt1hBvApo5z4FCGefVx5w&s";

  const loadChatRooms = async () => {
    try {
      const chatRooms = await fetchChatRooms(); // Fetch all chat rooms
      setAllGroups(chatRooms); // Store all groups

      // Apply search filter if needed
      if (searchText.trim()) {
        const filteredRooms = chatRooms.filter((room: any) =>
          room.name.toLowerCase().includes(searchText.toLowerCase())
        );
        setGroups(filteredRooms);
      } else {
        setGroups(chatRooms);
      }
    } catch (error) {
      console.error("Failed to load chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnChatRooms = async () => {
    try {
      if (!user) {
        console.warn("No user logged in, skipping chat room fetch.");
        setGroups([]);
        setAllGroups([]);
        return;
      }

      const chatRooms = await fetchOwnChatRooms();
      setAllGroups(chatRooms); // Store all user's chat rooms

      // Apply search filter if needed
      if (searchText.trim()) {
        const filteredRooms = chatRooms.filter((room) =>
          room.name.toLowerCase().includes(searchText.toLowerCase())
        );
        setGroups(filteredRooms);
      } else {
        setGroups(chatRooms);
      }
    } catch (error) {
      console.error("Failed to load own chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search text changes
  const handleSearch = (text: string) => {
    setSearchText(text);

    if (!text.trim()) {
      setGroups(allGroups);
      return;
    }

    const filtered = allGroups.filter((group) =>
      group.name.toLowerCase().includes(text.toLowerCase())
    );

    setGroups(filtered);
  };

  useEffect(() => {
    if (activeFilter === "all") {
      loadChatRooms();
    } else {
      loadOwnChatRooms();
    }
  }, [user, activeFilter]);

  const toggleAllChats = () => {
    setActiveFilter("all");
    setSearchText("");
  };

  const toggleOwnChats = () => {
    setActiveFilter("own");
    setSearchText("");
  };

  useFocusEffect(
    useCallback(() => {
      if (activeFilter === "all") {
        loadChatRooms();
      } else {
        loadOwnChatRooms();
      }
    }, [activeFilter])
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, darkMode && styles.darkContainer]}
      >
        <Text style={[styles.header, darkMode && styles.darkText]}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <Header
        username={user?.username ?? "Guest"}
        avatar={
          user?.profilePicture ?? require("@/assets/images/avatar/1.jpeg")
        }
        darkMode={darkMode}
        hasUnreadNotifications={hasUnread}
      />

      <Text style={[styles.header, darkMode && styles.darkText]}>Chats</Text>

      <View style={styles.searchContainer}>
        <SearchBar
          darkMode={darkMode}
          onSearch={handleSearch}
          searchText={searchText}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={toggleAllChats}
          style={[
            styles.filterButton,
            activeFilter === "all" && styles.filterButtonActive,
            darkMode && activeFilter !== "all" && styles.darkFilterButton,
          ]}
        >
          <Text
            style={[
              activeFilter === "all"
                ? styles.filterButtonTextActive
                : styles.filterButtonText,
              darkMode && activeFilter !== "all" && styles.darkFilterButtonText,
            ]}
          >
            All Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleOwnChats}
          style={[
            styles.filterButton,
            activeFilter === "own" && styles.filterButtonActive,
            darkMode && activeFilter !== "own" && styles.darkFilterButton,
          ]}
        >
          <Text
            style={[
              activeFilter === "own"
                ? styles.filterButtonTextActive
                : styles.filterButtonText,
              darkMode && activeFilter !== "own" && styles.darkFilterButtonText,
            ]}
          >
            Own Chats
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.chatListContainer}>
          {groups.length === 0 ? (
            <Text style={[styles.noChatsText, darkMode && styles.darkText]}>
              {searchText.trim()
                ? `No chats found matching "${searchText}"`
                : "No chats found. Join or create a group!"}
            </Text>
          ) : (
            groups.map((group) => (
              <View
                key={group.id}
                style={[
                  styles.chatItemContainer,
                  darkMode && styles.darkChatItemContainer,
                ]}
              >
                <Chat
                  title={group.name}
                  roomId={group.id}
                  icon={DefaultGroupIcon}
                  darkMode={darkMode}
                />
              </View>
            ))
          )}
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

      <CreateGroup
        visible={isCreateGroupVisible}
        onClose={() => setIsCreateGroupVisible(false)}
        onGroupCreated={(newGroup) => {
          console.log("New Group Created:", newGroup);

          // Add new group to both state arrays
          const newGroupObject = {
            ...newGroup,
            id: parseInt(newGroup.id),
          } as GroupChat;

          setGroups((prevGroups) => [newGroupObject, ...prevGroups]);
          setAllGroups((prevGroups) => [newGroupObject, ...prevGroups]);

          // Refresh lists
          if (activeFilter === "all") {
            loadChatRooms();
          } else {
            loadOwnChatRooms();
          }

          setIsCreateGroupVisible(false);
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
  noChatsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  darkChatItemContainer: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
});
