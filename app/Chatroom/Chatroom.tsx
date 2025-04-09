import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "@/contexts/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function Chatroom() {
  const { title, icon, chatroomId }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [messages, setMessages] = useState([
    { id: "1", text: "Hello!", time: "10:30 AM", sender: "other" },
    { id: "2", text: "Hey, how's it going?", time: "10:32 AM", sender: "me" },
    { id: "3", text: "All good! You?", time: "10:35 AM", sender: "other" },
  ]);
  const [inputText, setInputText] = useState("");
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        console.log("Fetching user ID from AsyncStorage...");
        const id = await AsyncStorage.getItem('userId');
        console.log("User ID retrieved:", id);
        setUserId(id);
      } catch (error) {
        console.error('Error retrieving user ID:', error);
        Alert.alert("Error", "Could not get user data. Please try logging in again.");
      }
    };
    
    getUserId();
    console.log("Chatroom initialized with chatroomId:", chatroomId);
  }, []);

  useEffect(() => {
    console.log("Modal visibility updated:", announcementModalVisible);
  }, [announcementModalVisible]);

  const sendMessage = () => {
    if (inputText.trim() === "") return;
    const newMessage = {
      id: String(messages.length + 1),
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      sender: "me",
    };
    setMessages([newMessage, ...messages]);
    setInputText("");
  };

  const sendAnnouncement = async () => {
    console.log("Starting sendAnnouncement process...");
    console.log("Input validation: Title:", announcementTitle.trim() ? "✓" : "✗", "Content:", announcementContent.trim() ? "✓" : "✗");
    
    if (announcementTitle.trim() === "" || announcementContent.trim() === "") {
      console.log("Validation failed: Missing title or content");
      Alert.alert("Error", "Please enter both a title and content for the announcement.");
      return;
    }

    console.log("User ID check:", userId ? "✓" : "✗", "Chatroom ID check:", chatroomId ? "✓" : "✗");
    if (!userId || !chatroomId) {
      console.log("Validation failed: Missing user ID or chatroom ID");
      Alert.alert("Error", "Missing user ID or chatroom ID.");
      return;
    }

    setIsLoading(true);
    console.log("Setting loading state to true");
    
    try {
      // Prepare announcement data
      console.log("Preparing announcement data...");
      const parsedUserId = parseInt(userId);
      const parsedChatroomId = parseInt(chatroomId);
      
      console.log("Parsed IDs - UserID:", parsedUserId, "ChatroomID:", parsedChatroomId);
      
      const announcementData = {
        senderId: parsedUserId,
        chatroomId: parsedChatroomId,
        title: announcementTitle,
        content: announcementContent,
        important: isImportant,
      };
      
      console.log("Announcement data prepared:", JSON.stringify(announcementData));
      
      // Get auth token
      console.log("Fetching auth token...");
      const token = await AsyncStorage.getItem('authToken');
      console.log("Auth token retrieved:", token ? "✓" : "✗");
      
      if (!token) {
        console.log("No auth token found");
        Alert.alert("Authentication Error", "You need to be logged in to send announcements.");
        setIsLoading(false);
        return;
      }
      
      // Determine proper API URL based on platform
      const apiBaseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5222' 
        : 'http://10.0.2.2:5222'; // Use 10.0.2.2 for Android emulator

      console.log(`Using API base URL: ${apiBaseUrl}`);
      
      // Make API call to create announcement
      console.log("Sending API request to create announcement...");
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
      
      console.log("API Response received. Status:", response.status);
      console.log("Response data:", JSON.stringify(response.data));
      
      if (response.status === 200 || response.status === 201) {
        console.log("Announcement sent successfully");
        
        // Add the announcement to the messages
        const newMessage = {
          id: String(messages.length + 1),
          text: `📢 ${isImportant ? '⚠️ ' : ''}${announcementTitle}: ${announcementContent}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          sender: "announcement",
        };
        
        console.log("Adding announcement to messages:", newMessage);
        setMessages([newMessage, ...messages]);
        
        // Reset form fields
        setAnnouncementTitle("");
        setAnnouncementContent("");
        setIsImportant(false);
        setAnnouncementModalVisible(false);
        console.log("Form fields reset and modal closed");
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:");
        console.error("- Status:", error.response?.status);
        console.error("- Status text:", error.response?.statusText);
        console.error("- Response data:", JSON.stringify(error.response?.data));
        console.error("- Request URL:", error.config?.url);
        console.error("- Request method:", error.config?.method);
        
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
        if (error instanceof Error) {
          console.error("Non-Axios error:", error.message);
        } else {
          console.error("Unknown error:", error);
        }
        Alert.alert(
          "Error", 
          "Network or server problem. Please check your connection and try again."
        );
      }
    } finally {
      console.log("Resetting loading state");
      setIsLoading(false);
    }
  };

  const navigateToSendAnnouncement = () => {
    console.log("Opening announcement modal...");
    setAnnouncementModalVisible(true);
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* HEADER */}
      <SafeAreaView style={darkMode ? { backgroundColor: "#1E1E1E" } : { backgroundColor: "#f0f0f0" }}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <Image source={{ uri: icon }} style={styles.icon} />
          <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
          <TouchableOpacity
            style={styles.announcementButton}
            onPress={navigateToSendAnnouncement}
          >
            <Ionicons name="notifications" size={24} color={darkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* MESSAGES */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.sender === "me"
                ? [styles.myMessage, darkMode && styles.darkMyMessage]
                : item.sender === "announcement"
                ? [styles.announcementMessage, darkMode && styles.darkAnnouncementMessage]
                : [styles.otherMessage, darkMode && styles.darkOtherMessage],
            ]}
          >
            <Text style={[styles.messageText, darkMode && styles.darkMessageText]}>
              {item.text}
            </Text>
            <Text style={[styles.messageTime, darkMode && styles.darkMessageTime]}>
              {item.time}
            </Text>
          </View>
        )}
        contentContainerStyle={[styles.messagesList, darkMode && styles.darkMessagesList]}
        inverted={true}
      />

      {/* INPUT */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.inputContainer, darkMode && styles.darkInputContainer]}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={darkMode ? "#aaa" : "#999"}
            style={[styles.input, darkMode && styles.darkInput]}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ANNOUNCEMENT MODAL */}
      <Modal visible={announcementModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, darkMode && styles.darkModalTitle]}>
              Send Announcement
            </Text>
            
            <Text style={[styles.modalLabel, darkMode && styles.darkModalLabel]}>Title</Text>
            <TextInput
              placeholder="Enter announcement title"
              placeholderTextColor={darkMode ? "#aaa" : "#999"}
              style={[styles.modalInput, darkMode && styles.darkModalInput]}
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
            />
            
            <Text style={[styles.modalLabel, darkMode && styles.darkModalLabel]}>Content</Text>
            <TextInput
              placeholder="Type your announcement content"
              placeholderTextColor={darkMode ? "#aaa" : "#999"}
              style={[styles.modalTextArea, darkMode && styles.darkModalInput]}
              value={announcementContent}
              onChangeText={setAnnouncementContent}
              multiline={true}
            />
            
            <View style={styles.importantContainer}>
              <TouchableOpacity 
                onPress={() => {
                  console.log("Important toggled from:", isImportant, "to:", !isImportant);
                  setIsImportant(!isImportant);
                }}
                style={styles.checkboxContainer}
              >
                <View style={[
                  styles.checkbox, 
                  isImportant && styles.checkboxChecked,
                  darkMode && styles.darkCheckbox,
                  isImportant && darkMode && styles.darkCheckboxChecked
                ]}>
                  {isImportant && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
                <Text style={[styles.checkboxLabel, darkMode && styles.darkText]}>
                  Mark as Important
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  console.log("Cancel button pressed, closing modal");
                  setAnnouncementModalVisible(false);
                  setAnnouncementTitle("");
                  setAnnouncementContent("");
                  setIsImportant(false);
                }}
                style={styles.modalCancelButton}
                disabled={isLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  console.log("Send button pressed");
                  sendAnnouncement();
                }} 
                style={[
                  styles.modalSendButton,
                  isLoading && styles.modalSendButtonDisabled
                ]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSendText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  darkHeader: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 10,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    justifyContent: "flex-end",
  },
  darkMessagesList: {
    backgroundColor: "#121212",
  },
  messageContainer: {
    maxWidth: "75%",
    padding: 7,
    borderRadius: 10,
    marginVertical: 5,
  },
  myMessage: {
    backgroundColor: "#6bf050",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  darkMyMessage: {
    backgroundColor: "#004D40",
  },
  otherMessage: {
    backgroundColor: "#aac4a5",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  darkOtherMessage: {
    backgroundColor: "#303030",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
  },
  darkMessageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 12,
    color: "#a0a1a0",
    textAlign: "right",
    marginTop: 5,
  },
  darkMessageTime: {
    color: "#ccc",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  darkInputContainer: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: "#000",
  },
  darkInput: {
    color: "#fff",
  },
  sendButton: {
    backgroundColor: "#29df04",
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  announcementButton: {
    marginLeft: "auto",
    padding: 10,
  },
  announcementMessage: {
    backgroundColor: "#ffeb3b",
    alignSelf: "center",
    borderRadius: 10,
    width: "90%",
  },
  darkAnnouncementMessage: {
    backgroundColor: "#fbc02d",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  darkModalContent: {
    backgroundColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
    textAlign: "center",
  },
  darkModalTitle: {
    color: "#fff",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#000",
  },
  darkModalLabel: {
    color: "#fff",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    color: "#000",
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    color: "#000",
    height: 100,
    textAlignVertical: "top",
  },
  darkModalInput: {
    borderColor: "#555",
    color: "#fff",
  },
  importantContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#4caf50",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#4caf50",
  },
  darkCheckbox: {
    borderColor: "#81c784",
    backgroundColor: "#333",
  },
  darkCheckboxChecked: {
    backgroundColor: "#2e7d32",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#000",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    padding: 10,
    backgroundColor: "#f44336",
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  modalCancelText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalSendButton: {
    padding: 10,
    backgroundColor: "#4caf50",
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  modalSendButtonDisabled: {
    backgroundColor: "#a5d6a7", // Lighter green when disabled
  },
  modalSendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});