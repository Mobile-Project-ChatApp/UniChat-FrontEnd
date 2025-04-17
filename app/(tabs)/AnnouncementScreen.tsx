import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  RECENT = "recent"
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
  const [currentFilter, setCurrentFilter] = useState<AnnouncementFilter>(AnnouncementFilter.ALL);
  const [userChatrooms, setUserChatrooms] = useState<Chatroom[]>([]);

  useEffect(() => {
    const getTokenFromStorage = async () => {
      try {
        let token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          token = await AsyncStorage.getItem('authToken');
        }
        
        if (!token) {
          token = await AsyncStorage.getItem('token');
        }

        console.log('Token from AsyncStorage:', token ? 'Found' : 'Not found');
        setStoredToken(token);
      } catch (error) {
        console.error('Error retrieving token from AsyncStorage:', error);
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
        console.warn('No token available for API request');
        setError("You need to be logged in to view announcements");
        setLoading(false);
        return;
      }
  
      console.log('Making API request with token:', effectiveToken.substring(0, 10) + '...');
      
      // Using the correct endpoint from Swagger docs with proper capitalization
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ChatRoom`, {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Chatrooms API response:', response.status);
        
        if (Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} chatrooms`);
          setUserChatrooms(response.data);
        } else {
          console.error('Unexpected response format:', response.data);
          setError("Invalid chatroom data format");
          setUserChatrooms([]);
        }
      } catch (error) {
        console.error('Error fetching chatrooms:', error);
        
        if (axios.isAxiosError(error)) {
          console.error('Axios error status:', error.response?.status);
          console.error('Axios error data:', error.response?.data);
        }
        
        setError("Failed to load your chatrooms");
        setLoading(false);
        setUserChatrooms([]);
      }
    } catch (err) {
      console.error("Failed to fetch user chatrooms:", err);
      
      if (axios.isAxiosError(err)) {
        console.error('Axios error status:', err.response?.status);
        console.error('Axios error data:', err.response?.data);
      }
      
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
        console.warn('No token available for announcements API request');
        setError("You need to be logged in to view announcements");
        setLoading(false);
        return;
      }

      let allAnnouncements: Announcement[] = [];

      for (const chatroom of userChatrooms) {
        let endpoint = `${API_BASE_URL}/api/Announcement/chatroom/${chatroom.id}`;
        
        if (currentFilter === AnnouncementFilter.IMPORTANT) {
          endpoint += '/important';
        } else if (currentFilter === AnnouncementFilter.RECENT) {
          endpoint += '/recent';
        }

        try {
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${effectiveToken}`
            }
          });

          const chatroomAnnouncements = response.data;
          allAnnouncements = [...allAnnouncements, ...chatroomAnnouncements];
        } catch (chatroomErr) {
          console.warn(`Failed to fetch announcements for chatroom ${chatroom.id}:`, chatroomErr);
        }
      }

      allAnnouncements.sort((a, b) => 
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      );
      
      const formattedAnnouncements = allAnnouncements.map(announcement => ({
        ...announcement,
        formattedDate: new Date(announcement.dateCreated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }));
      
      setAnnouncements(formattedAnnouncements);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError("Failed to load announcements. Please try again later.");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: AnnouncementFilter) => {
    setCurrentFilter(filter);
  };

  const AnnouncementItem = ({ announcement }: { announcement: Announcement }) => {
    const getChatroomName = () => {
      const chatroom = userChatrooms.find(room => room.id === announcement.chatroomId);
      return chatroom?.name || "Unknown Group";
    };

    return (
      <View style={[
        styles.announcementItem,
        darkMode && styles.darkAnnouncementItem
      ]}>
        <View style={styles.chatroomBadge}>
          <Ionicons name="people" size={12} color="white" style={styles.badgeIcon} />
          <Text style={styles.chatroomText}>
            {getChatroomName()}
          </Text>
        </View>
        
        {announcement.important && (
          <View style={styles.importantBanner}>
            <Ionicons name="warning" size={16} color="white" />
            <Text style={styles.importantText}>Important</Text>
          </View>
        )}
        
        <View style={styles.announcementHeader}>
          <Text style={[
            styles.announcementTitle,
            darkMode && styles.darkText
          ]}>{announcement.title}</Text>
          <Text style={[
            styles.announcementDate,
            darkMode && styles.darkSecondaryText
          ]}>{announcement.formattedDate || new Date(announcement.dateCreated).toLocaleDateString()}</Text>
        </View>
        
        <Text style={[
          styles.announcementContent,
          darkMode && styles.darkText
        ]}>{announcement.content}</Text>
        
        <View style={styles.senderInfo}>
          {announcement.sender?.profilePicture ? (
            <Image 
              source={{ uri: announcement.sender.profilePicture }} 
              style={styles.senderAvatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {announcement.sender?.username.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <Text style={[
            styles.senderName,
            darkMode && styles.darkSecondaryText
          ]}>From: {announcement.sender?.username || "Unknown"}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      darkMode && styles.darkContainer
    ]}>
      <Text style={[
        styles.header,
        darkMode && styles.darkText
      ]}>Announcements</Text>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              currentFilter === AnnouncementFilter.ALL && styles.filterButtonActive,
              currentFilter !== AnnouncementFilter.ALL && darkMode && styles.darkFilterButton
            ]}
            onPress={() => handleFilterChange(AnnouncementFilter.ALL)}
          >
            <Text style={currentFilter === AnnouncementFilter.ALL 
              ? styles.filterButtonTextActive 
              : [styles.filterButtonText, darkMode && styles.darkFilterButtonText]
            }>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              currentFilter === AnnouncementFilter.IMPORTANT && styles.filterButtonActive,
              currentFilter !== AnnouncementFilter.IMPORTANT && darkMode && styles.darkFilterButton
            ]}
            onPress={() => handleFilterChange(AnnouncementFilter.IMPORTANT)}
          >
            <Text style={currentFilter === AnnouncementFilter.IMPORTANT 
              ? styles.filterButtonTextActive 
              : [styles.filterButtonText, darkMode && styles.darkFilterButtonText]
            }>Important</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              currentFilter === AnnouncementFilter.RECENT && styles.filterButtonActive,
              currentFilter !== AnnouncementFilter.RECENT && darkMode && styles.darkFilterButton
            ]}
            onPress={() => handleFilterChange(AnnouncementFilter.RECENT)}
          >
            <Text style={currentFilter === AnnouncementFilter.RECENT 
              ? styles.filterButtonTextActive 
              : [styles.filterButtonText, darkMode && styles.darkFilterButtonText]
            }>Recent</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={darkMode ? "#82B1FF" : "#4A90E2"} />
            <Text style={[styles.loadingText, darkMode && styles.darkText]}>
              Loading announcements...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={darkMode ? "#FF6B6B" : "#FF3B30"} />
            <Text style={[styles.errorText, darkMode && styles.darkText]}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadAnnouncements}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : userChatrooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle" size={48} color={darkMode ? "#82B1FF" : "#4A90E2"} />
            <Text style={[styles.emptyText, darkMode && styles.darkText]}>
              You are not a member of any chatrooms
            </Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle" size={48} color={darkMode ? "#82B1FF" : "#4A90E2"} />
            <Text style={[styles.emptyText, darkMode && styles.darkText]}>
              No announcements to display in your chatrooms
            </Text>
          </View>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementItem key={announcement.id} announcement={announcement} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 15,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSecondaryText: {
    color: '#AAAAAA',
  },
  scrollContainer: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    minWidth: 90,
    alignItems: 'center',
  },
  darkFilterButton: {
    backgroundColor: '#333333',
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  darkFilterButtonText: {
    color: '#AAAAAA',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  announcementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  darkAnnouncementItem: {
    backgroundColor: '#1E1E1E',
  },
  importantBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  importantText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 12,
  },
  chatroomBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#4A90E2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatroomText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  badgeIcon: {
    marginRight: 4,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    marginTop: 15,
    marginLeft: 5,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  announcementDate: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 10,
  },
  announcementContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  senderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarInitial: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  senderName: {
    fontSize: 14,
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  darkBorder: {
    borderTopColor: '#333333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#4A90E2',
  },
  darkActionButtonText: {
    color: '#82B1FF',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});