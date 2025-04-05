import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { fetchAllAnnouncements, fetchImportantAnnouncements, fetchRecentAnnouncements } from '../../api/announcementsApi';

interface Announcement {
  id: number;
  title: string;
  content: string;
  sender: string;
  senderAvatar: string;
  date: string;
  important: boolean;
  chatRoomId?: number;
}

enum AnnouncementFilter {
  ALL = "all",
  IMPORTANT = "important",
  RECENT = "recent"
}

export default function AnnouncementScreen() {
  const { darkMode } = useContext(ThemeContext);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<AnnouncementFilter>(AnnouncementFilter.ALL);

  useEffect(() => {
    loadAnnouncements();
  }, [currentFilter]);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      switch (currentFilter) {
        case AnnouncementFilter.IMPORTANT:
          result = await fetchImportantAnnouncements();
          break;
        case AnnouncementFilter.RECENT:
          result = await fetchRecentAnnouncements();
          break;
        case AnnouncementFilter.ALL:
        default:
          result = await fetchAllAnnouncements();
          break;
      }
      
      // Format dates from API response
      const formattedAnnouncements = result.map((announcement: any) => ({
        ...announcement,
        date: new Date(announcement.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }));
      
      setAnnouncements(formattedAnnouncements);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError("Failed to load announcements. Please try again later.");
      
      // For development purposes, load mock data when API fails
      setAnnouncements([
        {
          id: 1,
          title: "New Course Registration Open",
          content: "Registration for Spring 2025 courses is now open. Please complete your registration by March 25th.",
          sender: "Academic Office",
          senderAvatar: "https://pbs.twimg.com/profile_images/1878018568199036928/rQEIyiM-_400x400.jpg",
          date: "March 10, 2025",
          important: true,
        },
        {
          id: 2,
          title: "Campus Wi-Fi Maintenance",
          content: "The campus Wi-Fi network will undergo scheduled maintenance this weekend.",
          sender: "IT Department",
          senderAvatar: "https://pbs.twimg.com/media/FTI52wzVUAgCr3d.jpg:large",
          date: "March 9, 2025",
          important: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: AnnouncementFilter) => {
    setCurrentFilter(filter);
  };

  const AnnouncementItem = ({ announcement }: { announcement: Announcement }) => (
    <View style={[
      styles.announcementItem,
      darkMode && styles.darkAnnouncementItem
    ]}>
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
        ]}>{announcement.date}</Text>
      </View>
      <Text style={[
        styles.announcementContent,
        darkMode && styles.darkText
      ]}>{announcement.content}</Text>
      <View style={styles.senderInfo}>
        <Image source={{ uri: announcement.senderAvatar }} style={styles.senderAvatar} />
        <Text style={[
          styles.senderName,
          darkMode && styles.darkSecondaryText
        ]}>From: {announcement.sender}</Text>
      </View>
      <View style={[
        styles.actionButtons,
        darkMode && styles.darkBorder
      ]}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color={darkMode ? "#82B1FF" : "#4A90E2"} />
          <Text style={[
            styles.actionButtonText,
            darkMode && styles.darkActionButtonText
          ]}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={darkMode ? "#82B1FF" : "#4A90E2"} />
          <Text style={[
            styles.actionButtonText,
            darkMode && styles.darkActionButtonText
          ]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle" size={48} color={darkMode ? "#82B1FF" : "#4A90E2"} />
            <Text style={[styles.emptyText, darkMode && styles.darkText]}>
              No announcements to display
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
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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