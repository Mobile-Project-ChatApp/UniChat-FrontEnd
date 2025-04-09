import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ThemeContext } from "@/contexts/ThemeContext";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function SendAnnouncement() {
  const { darkMode } = useContext(ThemeContext);
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { chatroomId } = params;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debug params
  useEffect(() => {
    console.log("SendAnnouncement: Route params received:", JSON.stringify(params));
    console.log("Chatroom ID from params:", chatroomId);
    console.log("Params type:", typeof chatroomId, Array.isArray(chatroomId));
  }, [params]);

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        console.log("SendAnnouncement: Fetching user ID from AsyncStorage...");
        const id = await AsyncStorage.getItem('userId');
        console.log("SendAnnouncement: User ID retrieved:", id);
        setUserId(id);
      } catch (error) {
        console.error('SendAnnouncement: Error retrieving user ID:', error);
        Alert.alert("Error", "Could not get user data. Please try logging in again.");
      }
    };
    getUserId();
  }, []);

  const handleSend = async () => {
    console.log("SendAnnouncement: Starting handleSend process...");
    console.log("SendAnnouncement: Input validation - Title:", title.trim() ? "✓" : "✗", "Content:", content.trim() ? "✓" : "✗");
    
    if (!title || !content) {
      console.log("SendAnnouncement: Validation failed - Missing title or content");
      Alert.alert("Error", "Please enter both a title and content for the announcement.");
      return;
    }

    console.log("SendAnnouncement: User ID check:", userId ? "✓" : "✗", "Chatroom ID check:", chatroomId ? "✓" : "✗");
    if (!userId || !chatroomId) {
      console.log("SendAnnouncement: Validation failed - Missing user ID or chatroom ID");
      Alert.alert("Error", "Missing user ID or chatroom ID.");
      return;
    }

    setIsLoading(true);
    console.log("SendAnnouncement: Setting loading state to true");
    
    try {
      // Format chatroom ID correctly
      let formattedChatroomId = chatroomId;
      if (Array.isArray(chatroomId)) {
        console.log("SendAnnouncement: Chatroom ID is an array, taking first element");
        formattedChatroomId = chatroomId[0];
      }
      
      // Prepare announcement data
      console.log("SendAnnouncement: Preparing announcement data...");
      console.log("SendAnnouncement: User ID type:", typeof userId);
      console.log("SendAnnouncement: Chatroom ID type:", typeof formattedChatroomId);
      
      const parsedUserId = parseInt(userId);
      const parsedChatroomId = parseInt(formattedChatroomId as string);
      
      console.log("SendAnnouncement: Parsed IDs - UserID:", parsedUserId, "ChatroomID:", parsedChatroomId);
      
      const announcementData = {
        senderId: parsedUserId,
        chatroomId: parsedChatroomId,
        title: title,
        content: content,
        important: isImportant,
        // DateCreated is handled by the backend with default DateTime.Now
      };
      
      console.log("SendAnnouncement: Announcement data prepared:", JSON.stringify(announcementData));
      
      // Get auth token
      console.log("SendAnnouncement: Fetching auth token...");
      const token = await AsyncStorage.getItem('authToken');
      console.log("SendAnnouncement: Auth token retrieved:", token ? "✓" : "✗");
      
      if (!token) {
        console.log("SendAnnouncement: No auth token found");
        Alert.alert("Authentication Error", "You need to be logged in to send announcements.");
        setIsLoading(false);
        return;
      }

      // Determine proper API URL based on platform
      const apiBaseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5222' 
        : 'http://10.0.2.2:5222'; // Use 10.0.2.2 for Android emulator
      
      console.log(`SendAnnouncement: Using API base URL: ${apiBaseUrl}`);
      
      // Make API call to create announcement
      console.log("SendAnnouncement: Sending API request to create announcement...");
      const response = await axios.post(
        `${apiBaseUrl}/api/Announcement`, 
        announcementData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("SendAnnouncement: API Response received. Status:", response.status);
      console.log("SendAnnouncement: Response data:", JSON.stringify(response.data));
      
      if (response.status === 200 || response.status === 201) {
        console.log("SendAnnouncement: Announcement sent successfully");
        Alert.alert(
          "Success", 
          "Announcement has been sent successfully!",
          [
            { 
              text: "OK", 
              onPress: () => {
                console.log("SendAnnouncement: Navigating back to Chatroom");
                navigation.goBack(); 
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("SendAnnouncement: Error sending announcement:", error);
      
      if (axios.isAxiosError(error)) {
        console.error("SendAnnouncement: Axios error details:");
        console.error("- Status:", error.response?.status);
        console.error("- Status text:", error.response?.statusText);
        console.error("- Response data:", JSON.stringify(error.response?.data));
        console.error("- Request URL:", error.config?.url);
        console.error("- Request method:", error.config?.method);
        console.error("- Request headers:", JSON.stringify(error.config?.headers));
        console.error("- Request data:", JSON.stringify(error.config?.data));
        
        if (error.response?.status === 401) {
          Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
        } else if (error.response?.status === 403) {
          Alert.alert("Permission Denied", "You don't have permission to send announcements in this chatroom.");
        } else {
          Alert.alert(
            "Error",
            `Failed to send announcement: ${error.response?.data?.message || error.message || 'Unknown error'}`
          );
        }
      } else {
        console.error("SendAnnouncement: Non-Axios error:", error);
        Alert.alert(
          "Error", 
          "Network or server problem. Please check your connection and try again."
        );
      }
    } finally {
      console.log("SendAnnouncement: Resetting loading state");
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.header, darkMode && styles.darkText]}>
        Send Announcement
      </Text>
      <Text style={[styles.label, darkMode && styles.darkLabel]}>Title</Text>
      <TextInput
        style={[styles.input, darkMode && styles.darkInput]}
        placeholder="Enter announcement title"
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        value={title}
        onChangeText={(text) => {
          console.log("SendAnnouncement: Title changed:", text);
          setTitle(text);
        }}
      />

      <Text style={[styles.label, darkMode && styles.darkLabel]}>Content</Text>
      <TextInput
        style={[styles.textArea, darkMode && styles.darkInput]}
        placeholder="Enter announcement content"
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        value={content}
        onChangeText={(text) => {
          console.log("SendAnnouncement: Content changed:", text);
          setContent(text);
        }}
        multiline
      />

      <Text style={[styles.label, darkMode && styles.darkLabel]}>Importance</Text>
      <Picker
        selectedValue={isImportant ? "Important" : "Normal"}
        style={[styles.picker, darkMode && styles.darkPicker]}
        onValueChange={(itemValue) => {
          const newValue = itemValue === "Important";
          console.log("SendAnnouncement: Important changed:", newValue);
          setIsImportant(newValue);
        }}
      >
        <Picker.Item label="Normal" value="Normal" />
        <Picker.Item label="Important" value="Important" />
      </Picker>

      {/* Debug info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Debug Info:</Text>
          <Text style={styles.debugText}>User ID: {userId || 'Not set'}</Text>
          <Text style={styles.debugText}>Chatroom ID: {chatroomId || 'Not set'}</Text>
          <Text style={styles.debugText}>Important: {isImportant ? 'Yes' : 'No'}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
        onPress={() => {
          console.log("SendAnnouncement: Send button pressed");
          handleSend();
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.sendButtonText}>Send Announcement</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#000",
  },
  darkLabel: {
    color: "#fff",
  },
  darkText: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    color: "#000",
  },
  darkInput: {
    borderColor: "#555",
    color: "#fff",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    height: 100,
    marginBottom: 15,
    color: "#000",
    textAlignVertical: "top",
  },
  picker: {
    height: 50,
    marginBottom: 15,
  },
  darkPicker: {
    color: "#fff",
  },
  sendButton: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#a5d6a7", // Lighter green when disabled
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  debugContainer: {
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
});