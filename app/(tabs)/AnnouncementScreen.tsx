import React, { useContext } from 'react';
import { SafeAreaView, Text, View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function AnnouncementScreen() {
  // Get dark mode status from ThemeContext
  const { darkMode } = useContext(ThemeContext);

  const announcements = [
    {
      id: 1,
      title: "New Course Registration Open",
      content: "Registration for Spring 2025 courses is now open. Please complete your registration by March 25th. Priority registration is available for senior students until March 15th.",
      sender: "Academic Office",
      senderAvatar: "https://pbs.twimg.com/profile_images/1878018568199036928/rQEIyiM-_400x400.jpg",
      date: "March 10, 2025",
      important: true,
    },
    {
      id: 2,
      title: "Campus Wi-Fi Maintenance",
      content: "The campus Wi-Fi network will undergo scheduled maintenance this weekend. Service interruptions are expected between 10 PM Saturday and 4 AM Sunday.",
      sender: "IT Department",
      senderAvatar: "https://pbs.twimg.com/media/FTI52wzVUAgCr3d.jpg:large",
      date: "March 9, 2025",
      important: false,
    },
    {
      id: 3,
      title: "Library Hours Extended",
      content: "Starting next week, the main library will extend its hours until midnight on weekdays to support students during the exam period.",
      sender: "Library Services",
      senderAvatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s",
      date: "March 8, 2025",
      important: false,
    }
  ];

  interface Announcement {
    id: number;
    title: string;
    content: string;
    sender: string;
    senderAvatar: string;
    date: string;
    important: boolean;
  }

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
          <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
            <Text style={styles.filterButtonTextActive}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[
            styles.filterButton,
            darkMode && styles.darkFilterButton
          ]}>
            <Text style={[
              styles.filterButtonText,
              darkMode && styles.darkFilterButtonText
            ]}>Important</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[
            styles.filterButton,
            darkMode && styles.darkFilterButton
          ]}>
            <Text style={[
              styles.filterButtonText,
              darkMode && styles.darkFilterButtonText
            ]}>Recent</Text>
          </TouchableOpacity>
        </View>

        {announcements.map((announcement) => (
          <AnnouncementItem key={announcement.id} announcement={announcement} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 15,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  darkSecondaryText: {
    color: '#aaa',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  darkFilterButton: {
    backgroundColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  darkFilterButtonText: {
    color: '#ccc',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  announcementItem: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkAnnouncementItem: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  importantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  importantText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: '#000',
  },
  announcementDate: {
    fontSize: 12,
    color: '#666',
  },
  announcementContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 15,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  darkBorder: {
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    color: '#4A90E2',
    marginLeft: 5,
    fontSize: 14,
  },
  darkActionButtonText: {
    color: '#82B1FF',
  }
});