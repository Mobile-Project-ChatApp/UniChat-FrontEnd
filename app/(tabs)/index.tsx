import React, { useContext } from "react";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { AuthContext } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  const Groups = [
    {
      id: 1,
      title: "OAMK Students",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s",
    },
    {
      id: 2,
      title: "Fonty Students",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png",
    },
    {
      id: 3,
      title: "Front-End Developers",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s",
    },
    {
      id: 4,
      title: "Back-End Developers",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png",
    },
    {
      id: 5,
      title: "IT Bachelor Programme",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s",
    },
    {
      id: 6,
      title: "React Native Course Students",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <Header
        username={user?.username ?? "Guest"}
        avatar={
          user?.profilePicture ?? require("@/assets/images/avatar/default-avatar.jpeg")
        }
        darkMode={darkMode}
      />

      <Text style={[styles.header, darkMode && styles.darkText]}>Chats</Text>
      
      <View style={styles.searchContainer}>
        <SearchBar darkMode={darkMode} />
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
          <Text style={styles.filterButtonTextActive}>All Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, darkMode && styles.darkFilterButton]}>
          <Text style={[styles.filterButtonText, darkMode && styles.darkFilterButtonText]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, darkMode && styles.darkFilterButton]}>
          <Text style={[styles.filterButtonText, darkMode && styles.darkFilterButtonText]}>Favorites</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.chatListContainer}>
          {Groups.map((group) => (
            <View key={group.id} style={[
              styles.chatItemContainer, 
              darkMode && styles.darkChatItemContainer
            ]}>
              <Chat title={group.title} icon={group.icon} darkMode={darkMode} />
            </View>
          ))}
        </View>
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
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
  chatListContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
  },
  chatItemContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,  // Add border width
    borderColor: '#e0e0e0',  // Light gray border for light mode
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  darkChatItemContainer: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',  // Darker border for dark mode
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
});