import React, { useContext, useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "@/utils/showToast";

interface Announcement {
  id: number;
  title: string;
  content: string;
  dateCreated: string;
  important: boolean;
  chatroomId: number;
  senderId: number;
  sender?: {
    username: string;
    profilePicture?: string;
  };
  chatroom?: {
    name: string;
  };
  formattedDate?: string;
}

interface Chatroom {
  id: number;
  name: string;
}

enum AnnouncementFilter {
  ALL = "all",
  IMPORTANT = "important",
  RECENT = "recent",
}

export default function AnnouncementScreen() {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const authContext = useContext(AuthContext) as any;
  const contextToken = authContext.token;

  const [storedToken, setStoredToken] = useState<string | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<AnnouncementFilter>(
    AnnouncementFilter.ALL
  );
  const [userChatrooms, setUserChatrooms] = useState<Chatroom[]>([]);

  useEffect(() => {
    const getTokenFromStorage = async () => {
      try {
        let token = await AsyncStorage.getItem("accessToken");

        if (!token) {
          token = await AsyncStorage.getItem("authToken");
        }

        if (!token) {
          token = await AsyncStorage.getItem("token");
        }

        setStoredToken(token);
      } catch (error) {
        console.error("Error retrieving token from AsyncStorage:", error);
      }
    };

    getTokenFromStorage();
  }, []);

  const getEffectiveToken = () => {
    return contextToken || storedToken;
  };

  useEffect(() => {
    if (getEffectiveToken()) {
      loadUserChatrooms();
    }
  }, [contextToken, storedToken]);

  useEffect(() => {
    if (userChatrooms.length > 0) {
      loadAnnouncements();
    }
  }, [currentFilter, userChatrooms, contextToken, storedToken]);

  const loadUserChatrooms = async () => {
    try {
      const effectiveToken = getEffectiveToken();

      if (!effectiveToken) {
        setError("You need to be logged in to view announcements");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/ChatRoom`, {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
            "Content-Type": "application/json",
          },
        });

        if (Array.isArray(response.data)) {
          setUserChatrooms(response.data);
        } else {
          setError("Invalid chatroom data format");
          setUserChatrooms([]);
        }
      } catch (error) {
        setError("Failed to load your chatrooms");
        setLoading(false);
        setUserChatrooms([]);
      }
    } catch (err) {
      setError("Failed to load your chatrooms");
      setLoading(false);
      setUserChatrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);

    try {
      const effectiveToken = getEffectiveToken();

      if (!effectiveToken) {
        setError("You need to be logged in to view announcements");
        setLoading(false);
        return;
      }

      let allAnnouncements: Announcement[] = [];

      for (const chatroom of userChatrooms) {
        let endpoint = `${API_BASE_URL}/api/Announcement/chatroom/${chatroom.id}`;

        if (currentFilter === AnnouncementFilter.IMPORTANT) {
          endpoint += "/important";
        } else if (currentFilter === AnnouncementFilter.RECENT) {
          endpoint += "/recent";
        }

        try {
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${effectiveToken}`,
            },
          });

          const chatroomAnnouncements = response.data;
          allAnnouncements = [...allAnnouncements, ...chatroomAnnouncements];
        } catch (chatroomErr) {
          // Ignore failed chatroom fetches
        }
      }

      allAnnouncements.sort(
        (a, b) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      );

      const formattedAnnouncements = allAnnouncements.map((announcement) => ({
        ...announcement,
        formattedDate: new Date(announcement.dateCreated).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        ),
      }));

      setAnnouncements(formattedAnnouncements);
    } catch (err) {
      setError("Failed to load announcements. Please try again later.");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: AnnouncementFilter) => {
    setCurrentFilter(filter);
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    const effectiveToken = getEffectiveToken();
    console.log("Attempting to delete announcement:", announcementId);
    console.log(
      "Effective token:",
      effectiveToken ? effectiveToken.substring(0, 20) + "..." : "null"
    );
    if (!effectiveToken) {
      showToast(
        "error",
        "Not logged in",
        "You need to be logged in to delete announcements."
      );
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/api/Announcement/${announcementId}`, {
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
        },
      });
      console.log("Delete successful for announcement:", announcementId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      showToast(
        "success",
        "Announcement deleted",
        "The announcement was deleted successfully."
      );
    } catch (err: any) {
      if (err.response) {
        console.log("Delete failed:", err.response.status, err.response.data);
        showToast(
          "error",
          "Delete failed",
          `Failed to delete announcement. (${err.response.status}: ${err.response.data})`
        );
      } else {
        console.log("Delete failed:", err.message);
        showToast("error", "Delete failed", "Failed to delete announcement.");
      }
    }
  };

  const AnnouncementItem = ({
    announcement,
  }: {
    announcement: Announcement;
  }) => {
    const getChatroomName = () => {
      const chatroom = userChatrooms.find(
        (room) => room.id === announcement.chatroomId
      );
      return chatroom?.name || "Unknown Group";
    };

    // Only show delete button if the current user is the sender
    const isOwner = user && announcement.senderId === user.id;

    return (
      <View
        style={[
          styles.announcementItem,
          darkMode && styles.darkAnnouncementItem,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.chatroomBadge}>
            <Ionicons
              name="people"
              size={12}
              color="white"
              style={styles.badgeIcon}
            />
            <Text style={styles.chatroomText}>{getChatroomName()}</Text>
          </View>

          {announcement.important && (
            <View style={styles.importantBanner}>
              <Ionicons name="warning" size={14} color="white" />
              <Text style={styles.importantText}>Important</Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.announcementHeader}>
            <Text
              style={[styles.announcementTitle, darkMode && styles.darkText]}
            >
              {announcement.title}
            </Text>
            <Text
              style={[
                styles.announcementDate,
                darkMode && styles.darkSecondaryText,
              ]}
            >
              {announcement.formattedDate ||
                new Date(announcement.dateCreated).toLocaleDateString()}
            </Text>
          </View>

          <Text
            style={[styles.announcementContent, darkMode && styles.darkText]}
          >
            {announcement.content}
          </Text>

          <View style={styles.senderInfo}>
            {announcement.sender?.profilePicture ? (
              <Image
                source={{ uri: announcement.sender.profilePicture }}
                style={styles.senderAvatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {announcement.sender?.username?.charAt(0).toUpperCase() ||
                    "?"}
                </Text>
              </View>
            )}
            <Text
              style={[styles.senderName, darkMode && styles.darkSecondaryText]}
            >
              From: {announcement.sender?.username || "Unknown"}
            </Text>

            {isOwner && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  console.log(
                    "Delete button pressed for announcement:",
                    announcement.id
                  );
                  handleDeleteAnnouncement(announcement.id);
                }}
              >
                <Ionicons name="trash" size={16} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.header, darkMode && styles.darkText]}>
        Announcements
      </Text>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              currentFilter === AnnouncementFilter.ALL &&
                styles.filterButtonActive,
              currentFilter !== AnnouncementFilter.ALL &&
                darkMode &&
                styles.darkFilterButton,
            ]}
            onPress={() => handleFilterChange(AnnouncementFilter.ALL)}
          >
            <Text
              style={
                currentFilter === AnnouncementFilter.ALL
                  ? styles.filterButtonTextActive
                  : [
                      styles.filterButtonText,
                      darkMode && styles.darkFilterButtonText,
                    ]
              }
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              currentFilter === AnnouncementFilter.IMPORTANT &&
                styles.filterButtonActive,
              currentFilter !== AnnouncementFilter.IMPORTANT &&
                darkMode &&
                styles.darkFilterButton,
            ]}
            onPress={() => handleFilterChange(AnnouncementFilter.IMPORTANT)}
          >
            <Text
              style={
                currentFilter === AnnouncementFilter.IMPORTANT
                  ? styles.filterButtonTextActive
                  : [
                      styles.filterButtonText,
                      darkMode && styles.darkFilterButtonText,
                    ]
              }
            >
              Important
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              currentFilter === AnnouncementFilter.RECENT &&
                styles.filterButtonActive,
              currentFilter !== AnnouncementFilter.RECENT &&
                darkMode &&
                styles.darkFilterButton,
            ]}
            onPress={() => handleFilterChange(AnnouncementFilter.RECENT)}
          >
            <Text
              style={
                currentFilter === AnnouncementFilter.RECENT
                  ? styles.filterButtonTextActive
                  : [
                      styles.filterButtonText,
                      darkMode && styles.darkFilterButtonText,
                    ]
              }
            >
              Recent
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={darkMode ? "#82B1FF" : "#4A90E2"}
            />
            <Text style={[styles.loadingText, darkMode && styles.darkText]}>
              Loading announcements...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={darkMode ? "#FF6B6B" : "#FF3B30"}
            />
            <Text style={[styles.errorText, darkMode && styles.darkText]}>
              {error}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadAnnouncements}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : userChatrooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="information-circle"
              size={48}
              color={darkMode ? "#82B1FF" : "#4A90E2"}
            />
            <Text style={[styles.emptyText, darkMode && styles.darkText]}>
              You are not a member of any chatrooms
            </Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="information-circle"
              size={48}
              color={darkMode ? "#82B1FF" : "#4A90E2"}
            />
            <Text style={[styles.emptyText, darkMode && styles.darkText]}>
              No announcements to display in your chatrooms
            </Text>
          </View>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              announcement={announcement}
            />
          ))
        )}

        {/* Add bottom padding to ensure last item is fully visible */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 45,
    marginBottom: 20,
    letterSpacing: -0.5,
    color: "#1A1A1A",
    marginLeft: 6,
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSecondaryText: {
    color: "#B0B0B0",
  },
  scrollContainer: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#EEEEEE",
    minWidth: 100,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  darkFilterButton: {
    backgroundColor: "#333333",
  },
  filterButtonActive: {
    backgroundColor: "#4A90E2",
    elevation: 2,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  filterButtonText: {
    color: "#666666",
    fontWeight: "600",
    fontSize: 13,
  },
  darkFilterButtonText: {
    color: "#AAAAAA",
  },
  filterButtonTextActive: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  announcementItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    marginLeft: 10,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  darkAnnouncementItem: {
    backgroundColor: "#1E1E1E",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
  },
  importantBanner: {
    backgroundColor: "#FF3B30",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  importantText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 12,
  },
  chatroomBadge: {
    backgroundColor: "#4A90E2",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  chatroomText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  badgeIcon: {
    marginRight: 5,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    marginTop: 14,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    color: "#1A1A1A",
    lineHeight: 24,
  },
  announcementDate: {
    fontSize: 13,
    color: "#888888",
    marginLeft: 10,
    marginTop: 2,
  },
  announcementContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    color: "#333333",
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    marginTop: 4,
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarInitial: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  senderName: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFEAEA",
    borderRadius: 16,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
  bottomPadding: {
    height: 24,
  },
});
