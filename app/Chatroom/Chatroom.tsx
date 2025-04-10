import { useLocalSearchParams, useRouter } from "expo-router";
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
import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { API_BASE_URL } from "../../config/apiConfig";

export default function Chatroom() {
  const params = useLocalSearchParams();
  const { title, icon, roomId }: any = params;
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();

  // Original chat state
  const [messages, setMessages] = useState<{ id: string; text: string; time: string; sender: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  // Announcement state
  const [userId, setUserId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [canSendAnnouncements, setCanSendAnnouncements] = useState(false);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Extract user info from token
  const extractUserInfoFromToken = (token: string) => {
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      return { userId };
    } catch (error) {
      console.error("Error extracting user info from token:", error);
      return null;
    }
  };

  // Get access token with fallbacks
  const getAccessToken = async () => {
    try {
      let token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        token = await AsyncStorage.getItem("authToken");
      }
      
      if (!token) {
        token = await AsyncStorage.getItem("token");
      }
      
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };
  
  // Get user data for announcements
  useEffect(() => {
    const getUserData = async () => {
      try {
        // First try to get userId from storage
        let id = await AsyncStorage.getItem('userId');
        
        // If userId is missing, try to extract from token
        if (!id) {
          const token = await getAccessToken();
          if (token) {
            const userInfo = extractUserInfoFromToken(token);
            if (userInfo?.userId) {
              id = userInfo.userId;
              // Save it for future use
              if (id) {
                await AsyncStorage.setItem('userId', id);
              }
            }
          }
        }
        
        setUserId(id);
        
        const roles = await AsyncStorage.getItem('userRoles');
        
        if (roles) {
          try {
            const parsedRoles = JSON.parse(roles);
            setUserRoles(Array.isArray(parsedRoles) ? parsedRoles : []);
            
            // Check if user can send announcements (admin or moderator)
            const canAnnounce = Array.isArray(parsedRoles) && parsedRoles.some(
              (role: string) => role.toLowerCase() === 'admin' || role.toLowerCase() === 'moderator'
            );
            
            setCanSendAnnouncements(canAnnounce);
          } catch (parseError) {
            console.error("Error parsing user roles:", parseError);
            setUserRoles([]);
          }
        }
      } catch (error) {
        console.error('Error retrieving user data:', error);
      }
    };
    
    getUserData();
  }, []);

  // Initialize SignalR connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chatHub`, {
        accessTokenFactory: async () => {
          const token = await getAccessToken();
          return token || "";
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  // Connect to SignalR and join room
  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(async () => {
          // Join the room
          if (roomId) {
            await connection.invoke("JoinRoom", parseInt(roomId));
          }

          // Handle receiving messages
          connection.on("ReceiveMessage", (message) => {
            setMessages((prevMessages) => [
              {
                id: message.id.toString(),
                text: message.messageText,
                time: new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
                sender: message.sender.username,
              },
              ...prevMessages,
            ]);
          });

          // Handle user events
          connection.on("UserJoined", (user) => {
            console.log(`${user.username} joined the room`);
          });

          connection.on("UserLeft", (username) => {
            console.log(`${username} left the room`);
          });
        })
        .catch((err) => console.error("SignalR Connection Error: ", err));
    }

    // Cleanup: Leave the room when unmounting
    return () => {
      if (connection && roomId) {
        connection.invoke("LeaveRoom", parseInt(roomId)).catch((err) => {
          console.error("Error leaving room:", err);
        });
      }
    };
  }, [connection, roomId]);

  // Send regular message
  const sendMessage = async () => {
    if (!roomId) {
      console.error("No room selected. Please join a room first.");
      return;
    }

    if (inputText.trim() === "") {
      return;
    }

    try {
      if (connection) {
        // Send the message to the backend
        await connection.invoke("SendMessage", parseInt(roomId), inputText);

        // Add the message locally
        const newMessage = {
          id: String(messages.length + 1),
          text: inputText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          sender: "me",
        };
        setMessages([newMessage, ...messages]);
        setInputText(""); // Clear the input field
      } else {
        console.error("Connection is not established.");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Open announcement modal
  const navigateToSendAnnouncement = () => {
    // Reset form state
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setIsImportant(false);
    
    // Show the modal
    setAnnouncementModalVisible(true);
  };

  const sendAnnouncement = async () => {
    if (announcementTitle.trim() === "" || announcementContent.trim() === "") {
      Alert.alert("Error", "Please enter both a title and content for the announcement.");
      return;
    }
  
    if (!userId || !roomId) {
      Alert.alert("Error", "Missing user ID or room ID.");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const parsedUserId = parseInt(userId);
      const parsedChatroomId = parseInt(roomId);
  
      if (isNaN(parsedUserId) || isNaN(parsedChatroomId)) {
        Alert.alert("Error", "Invalid user or chatroom identifier.");
        return;
      }
  
      const announcementData = {
        senderId: parsedUserId,
        chatroomId: parsedChatroomId,
        title: announcementTitle,
        content: announcementContent,
        important: isImportant,
      };
  
      const token = await getAccessToken();
  
      if (!token) {
        Alert.alert("Authentication Error", "You need to be logged in to send announcements.");
        return;
      }
  
      console.log("Sending announcement data:", announcementData);
  
      const response = await axios.post(
        `${API_BASE_URL}/api/Announcement`,
        announcementData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("Backend response:", response.data);
  
      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Announcement sent successfully!");
        // Close the modal after successful submission
        setAnnouncementModalVisible(false);
        setAnnouncementTitle("");
        setAnnouncementContent("");
        setIsImportant(false);
      } else {
        Alert.alert("Warning", "Announcement may not have been sent correctly.");
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
  
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
  
        if (error.response?.status === 500) {
          Alert.alert("Server Error", "An internal server error occurred. Please try again later.");
        } else if (error.response?.status === 401) {
          Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
        } else if (error.response?.status === 403) {
          Alert.alert("Permission Denied", "You don't have permission to send announcements in this chatroom.");
        } else {
          Alert.alert("Error", `Failed to send announcement: ${error.response?.data?.message || error.message}`);
        }
      } else {
        Alert.alert("Network Error", "Could not connect to the server. Please check your internet connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Force userId for dev mode testing
  useEffect(() => {
    if (__DEV__ && !userId) {
      setUserId("3"); // Default test ID for development
    }
  }, [userId]);

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* HEADER */}
      <SafeAreaView style={darkMode ? { backgroundColor: "#1E1E1E" } : { backgroundColor: "#f0f0f0" }}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <Image source={{ uri: icon }} style={styles.icon} />
          <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
          
          {/* Only show announcement button if user has permission */}
          {(canSendAnnouncements || __DEV__) && (
            <TouchableOpacity
              style={styles.announcementButton}
              onPress={navigateToSendAnnouncement}
            >
              <Ionicons name="notifications" size={24} color={darkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          )}
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
            {item.sender !== "me" && item.sender !== "announcement" && (
              <Text style={[styles.senderName, darkMode && styles.darkText]}>
                {item.sender}
              </Text>
            )}
            <Text style={[styles.messageText, darkMode && styles.darkMessageText]}>{item.text}</Text>
            <Text style={[styles.messageTime, darkMode && styles.darkMessageTime]}>{item.time}</Text>
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
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ANNOUNCEMENT MODAL */}
      <Modal 
        visible={announcementModalVisible} 
        transparent 
        animationType="slide"
        onRequestClose={() => setAnnouncementModalVisible(false)}
      >
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
                onPress={() => setIsImportant(!isImportant)}
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
                onPress={sendAnnouncement} 
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
    flex: 1,
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
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#555",
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
  // Announcement styles
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
    backgroundColor: "#a5d6a7",
  },
  modalSendText: {
    color: "#fff",
    fontWeight: "bold",
  },
  debugModalInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
  },
  debugModalText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#666',
  }
});