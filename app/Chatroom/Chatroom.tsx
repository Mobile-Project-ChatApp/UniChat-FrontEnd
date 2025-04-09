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
import * as signalR from "@microsoft/signalr";

export default function Chatroom() {
  // Get parameters from route with default values to avoid undefined
  const params = useLocalSearchParams();
  const chatroomId = params.chatroomId as string || '';
  const title = params.title as string || 'Chatroom';
  const icon = params.icon as string || 'https://via.placeholder.com/150';
  
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [canSendAnnouncements, setCanSendAnnouncements] = useState(false);

  // Announcement variables
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Chat variables
  const [messages, setMessages] = useState<{ id: string; text: string; time: string; sender: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Define API URL based on environment - use localhost for web in dev mode
  const API_BASE_URL = __DEV__ 
    ? Platform.OS === 'web' 
      ? 'http://localhost:5222'
      : 'http://10.0.2.2:5222' // For Android emulator
    : 'https://145.85.233.168:5222'; // Use HTTPS for production

  // Check if chatroomId is valid on component mount
  useEffect(() => {
    console.log("Chatroom initialized with chatroomId:", chatroomId);
    
    if (!chatroomId) {
      console.error("No chatroomId provided to Chatroom component");
      Alert.alert(
        "Error", 
        "No chatroom selected. Redirecting to home screen.",
        [{ text: "OK", onPress: () => router.replace("/") }]
      );
    }
  }, [chatroomId, router]);

  // Get auth token consistently across the app
  const getAuthToken = async () => {
    try {
      // First try to get authToken
      let token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        // If no authToken, try token (legacy name)
        token = await AsyncStorage.getItem("token");
      }
      
      if (!token) {
        console.error("Auth token is missing");
        return null;
      }
      
      return token;
    } catch (error) {
      console.error("Error fetching auth token:", error);
      return null;
    }
  };

  // Try to refresh the token if needed
  const refreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.error("No refresh token available");
        return false;
      }
      
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });
      
      if (response.status === 200) {
        await AsyncStorage.setItem("authToken", response.data.token);
        await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  };

  // Get user data on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log("Fetching user data from AsyncStorage...");
        const id = await AsyncStorage.getItem('userId');
        const roles = await AsyncStorage.getItem('userRoles');
        const token = await getAuthToken();
        
        console.log("User ID retrieved:", id);
        console.log("User roles retrieved:", roles);
        console.log("Auth token available:", !!token);
        
        if (!id || !token) {
          console.log("Missing user data or token, attempting to refresh token...");
          const refreshed = await refreshToken();
          
          if (!refreshed) {
            console.log("Token refresh failed, redirecting to login");
            Alert.alert(
              "Session Expired", 
              "Please log in again.",
              [{ text: "OK", onPress: () => router.replace("/WelcomeScreen") }]
            );
            return;
          }
          
          // Try to get user data again after refresh
          const refreshedId = await AsyncStorage.getItem('userId');
          setUserId(refreshedId);
        } else {
          setUserId(id);
        }
        
        if (roles) {
          try {
            const parsedRoles = JSON.parse(roles);
            setUserRoles(Array.isArray(parsedRoles) ? parsedRoles : []);
            
            // Check if user can send announcements (admin or moderator)
            const canAnnounce = Array.isArray(parsedRoles) && parsedRoles.some(
              (role: string) => role.toLowerCase() === 'admin' || role.toLowerCase() === 'moderator'
            );
            setCanSendAnnouncements(canAnnounce);
            console.log("Can send announcements:", canAnnounce);
          } catch (parseError) {
            console.error("Error parsing user roles:", parseError);
            setUserRoles([]);
          }
        }
      } catch (error) {
        console.error('Error retrieving user data:', error);
        Alert.alert("Error", "Could not get user data. Please try logging in again.");
      }
    };
    
    getUserData();
  }, [router]);

  // Initialize SignalR connection only if chatroomId is available
  useEffect(() => {
    if (!chatroomId) {
      console.log("Not initializing SignalR - no chatroomId provided");
      return;
    }
    
    console.log("Initializing SignalR connection...");
    
    // Only proceed with SignalR connection after we have an auth token
    const initializeSignalR = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setConnectionError("No authentication token available");
          return;
        }
        
        const newConnection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/chatHub`, {
            accessTokenFactory: () => token,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 20000]) // Retry with backoff
          .configureLogging(signalR.LogLevel.Information)
          .build();

        // Handle connection events
        newConnection.onreconnecting(error => {
          console.log("SignalR reconnecting:", error);
          setIsConnected(false);
        });

        newConnection.onreconnected(connectionId => {
          console.log("SignalR reconnected with ID:", connectionId);
          setIsConnected(true);
          setConnectionError(null);
        });

        newConnection.onclose(error => {
          console.log("SignalR connection closed:", error);
          setIsConnected(false);
          if (error) {
            setConnectionError("Connection closed: " + error);
          }
        });

        setConnection(newConnection);
      } catch (error) {
        console.error("Error initializing SignalR:", error);
        setConnectionError("Failed to initialize chat connection");
      }
    };
    
    initializeSignalR();
    
    return () => {
      // Cleanup will be handled by the connection effect below
    };
  }, [chatroomId]);

  // Start and stop SignalR connection
  useEffect(() => {
    if (!connection) return;
    
    console.log("Starting SignalR connection and joining room...");
    
    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR Connected.");
        setIsConnected(true);
        setConnectionError(null);

        // Join the room if chatroomId is available
        if (chatroomId) {
          try {
            const roomIdNumber = parseInt(chatroomId);
            if (isNaN(roomIdNumber)) {
              console.error("Invalid chatroom ID format:", chatroomId);
              return;
            }
            
            await connection.invoke("JoinRoom", roomIdNumber);
            console.log(`Joined room ${chatroomId}`);
          } catch (error) {
            console.error("Error joining room:", error);
            setConnectionError("Failed to join chatroom");
          }
        }

        // Handle receiving messages
        connection.on("ReceiveMessage", (message) => {
          console.log("Received message:", message);
          setMessages((prevMessages) => [
            {
              id: message.id?.toString() || Date.now().toString(),
              text: message.messageText,
              time: new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              sender: message.sender?.username || "unknown",
            },
            ...prevMessages,
          ]);
        });

        // Handle user joined/left events
        connection.on("UserJoined", (user) => {
          console.log(`${user.username} joined the room`);
        });

        connection.on("UserLeft", (username) => {
          console.log(`${username} left the room`);
        });
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
        setIsConnected(false);
        setConnectionError("Failed to connect to chat server");
        
        // Show alert for connection issues
        Alert.alert(
          "Connection Error",
          "Failed to connect to the chat server. Please check your internet connection and try again.",
          [{ text: "OK", onPress: () => {} }]
        );
      }
    };

    startConnection();

    // Cleanup: Leave the room and stop connection when unmounting
    return () => {
      if (connection) {
        console.log("Cleaning up SignalR connection");
        
        if (chatroomId && isConnected) {
          const roomIdNumber = parseInt(chatroomId);
          if (!isNaN(roomIdNumber)) {
            // Try to leave room gracefully before stopping connection
            connection.invoke("LeaveRoom", roomIdNumber)
              .then(() => console.log(`Left room ${chatroomId}`))
              .catch((err) => console.error("Error leaving room:", err))
              .finally(() => {
                connection.stop()
                  .catch(err => console.error("Error stopping connection:", err));
              });
          } else {
            connection.stop()
              .catch(err => console.error("Error stopping connection:", err));
          }
        } else {
          connection.stop()
            .catch(err => console.error("Error stopping connection:", err));
        }
      }
    };
  }, [connection, chatroomId]);

  // Log modal visibility changes
  useEffect(() => {
    console.log("Modal visibility updated:", announcementModalVisible);
  }, [announcementModalVisible]);

  // Send a chat message
  const sendMessage = async () => {
    if (!chatroomId) {
      Alert.alert("Error", "No chatroom selected. Please join a chatroom first.");
      return;
    }

    if (inputText.trim() === "") {
      return; // Just ignore empty messages
    }

    if (!isConnected) {
      Alert.alert("Error", "Not connected to chat server. Please try again.");
      return;
    }

    try {
      if (connection) {
        const roomIdNumber = parseInt(chatroomId);
        if (isNaN(roomIdNumber)) {
          console.error("Invalid chatroom ID format:", chatroomId);
          return;
        }
        
        console.log(`Sending message to room ${roomIdNumber}: ${inputText}`);
        
        // Send the message to the backend
        await connection.invoke("SendMessage", roomIdNumber, inputText);

        // Add the message locally
        const newMessage = {
          id: Date.now().toString(),
          text: inputText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          sender: "me",
        };
        setMessages((prev) => [newMessage, ...prev]);
        setInputText(""); // Clear the input field
      } else {
        Alert.alert("Error", "Chat connection not established.");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // Open announcement modal
  const navigateToSendAnnouncement = () => {
    console.log("Opening announcement modal...");
    setAnnouncementModalVisible(true);
  };

  // Send announcement
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
      // Parse IDs safely
      const parsedUserId = userId ? parseInt(userId) : null;
      const parsedChatroomId = chatroomId ? parseInt(chatroomId) : null;
      
      if (isNaN(parsedUserId ?? NaN) || isNaN(parsedChatroomId ?? NaN)) {
        console.log("Invalid ID format: UserId or ChatroomId is not a number");
        Alert.alert("Error", "Invalid user or chatroom identifier.");
        setIsLoading(false);
        return;
      }
      
      console.log("Parsed IDs - UserID:", parsedUserId, "ChatroomID:", parsedChatroomId);
      
      // Prepare announcement data
      console.log("Preparing announcement data...");
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
      const token = await getAuthToken();
      console.log("Auth token retrieved:", token ? "✓" : "✗");
      
      if (!token) {
        console.log("No auth token found");
        Alert.alert("Authentication Error", "You need to be logged in to send announcements.");
        setIsLoading(false);
        return;
      }

      // Simple token format validation
      if (token.split('.').length !== 3) {
        console.log("Token format appears invalid");
        Alert.alert("Authentication Error", "Your session token appears invalid. Please log in again.");
        setIsLoading(false);
        return;
      }
      
      console.log(`Using API base URL: ${API_BASE_URL}`);
      
      // Make API call to create announcement
      console.log("Sending API request to create announcement...");
      const response = await axios.post(
        `${API_BASE_URL}/api/Announcement`, 
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
          id: Date.now().toString(),
          text: `📢 ${isImportant ? '⚠️ ' : ''}${announcementTitle}: ${announcementContent}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          sender: "announcement",
        };
        
        console.log("Adding announcement to messages:", newMessage);
        setMessages(prevMessages => [newMessage, ...prevMessages]);
        
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
          Alert.alert(
            "Authentication Error", 
            "Your session has expired. Please log in again.",
            [{ text: "OK", onPress: () => router.replace("/WelcomeScreen") }]
          );
        } else if (error.response?.status === 403) {
          Alert.alert("Permission Denied", "You don't have permission to send announcements in this chatroom.");
        } else {
          Alert.alert(
            "Error",
            `Failed to send announcement: ${error.response?.data?.message || error.message || 'Unknown error'}`
          );
        }
      } else {
        console.error("Non-Axios error:", error instanceof Error ? error.message : String(error));
        Alert.alert(
          "Network Error", 
          "Could not connect to the server. Please check your internet connection and try again."
        );
      }
    } finally {
      console.log("Resetting loading state");
      setIsLoading(false);
    }
  };

  // Show offline indicator or error message if not connected
  const renderConnectionStatus = () => {
    if (connectionError) {
      return (
        <View style={styles.connectionError}>
          <Text style={styles.connectionErrorText}>{connectionError}</Text>
          <TouchableOpacity 
            onPress={() => router.replace({
              pathname: "/Chatroom/Chatroom",
              params: { chatroomId, title, icon }
            })}
            style={styles.reconnectButton}
          >
            <Text style={styles.reconnectText}>Reconnect</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!isConnected) {
      return (
        <View style={styles.offlineIndicator}>
          <ActivityIndicator color="#ff6347" size="small" />
          <Text style={styles.offlineText}>Connecting...</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* HEADER */}
      <SafeAreaView style={darkMode ? { backgroundColor: "#1E1E1E" } : { backgroundColor: "#f0f0f0" }}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Image 
            source={{ uri: icon }} 
            style={styles.icon}
            onError={() => console.log("Failed to load icon")}
          />
          <Text style={[styles.title, darkMode && styles.darkText]}>{title || "Chatroom"}</Text>
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

      {/* CONNECTION STATUS */}
      {renderConnectionStatus()}

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
              <Text style={[styles.senderName, darkMode && styles.darkSecondaryText]}>
                {item.sender}
              </Text>
            )}
            <Text style={[styles.messageText, darkMode && styles.darkMessageText]}>{item.text}</Text>
            <Text style={[styles.messageTime, darkMode && styles.darkMessageTime]}>{item.time}</Text>
          </View>
        )}
        contentContainerStyle={[
          styles.messagesList, 
          darkMode && styles.darkMessagesList,
          messages.length === 0 && styles.emptyMessageList
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, darkMode && styles.darkText]}>
              No messages yet. Be the first to send one!
            </Text>
          </View>
        }
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
            onSubmitEditing={sendMessage} // Send message on Enter key press
            editable={isConnected} // Disable input when not connected
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]}
            disabled={!isConnected}
          >
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

      {/* DEBUG INFO (DEV MODE ONLY) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>DEBUG INFO</Text>
          <Text style={styles.debugText}>User ID: {userId || 'Not set'}</Text>
          <Text style={styles.debugText}>Chatroom ID: {chatroomId || 'Not set'}</Text>
          <Text style={styles.debugText}>Roles: {JSON.stringify(userRoles)}</Text>
          <Text style={styles.debugText}>Can Send Announcements: {canSendAnnouncements ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Connected: {isConnected ? 'Yes' : 'No'}</Text>
          <TouchableOpacity onPress={() => setAnnouncementModalVisible(true)}>
            <Text style={[styles.debugText, { color: 'blue' }]}>Open Announcement Modal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={[styles.debugText, { color: 'red' }]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flex: 1, // Allow title to take up remaining space
  },
  darkText: {
    color: "#fff",
  },
  backButton: {
    marginRight: 10,
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
  emptyMessageList: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
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
    color: "#000", // Changed to black for better readability
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
  darkSecondaryText: {
    color: "#aaa",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
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
    borderRadius: 20,
    backgroundColor: "#fff", // Added for clarity
    borderWidth: 1,
    borderColor: "#e0e0e0", 
  },
  darkInput: {
    color: "#fff",
    backgroundColor: "#2c2c2c",
    borderColor: "#444",
  },
  sendButton: {
    backgroundColor: "#29df04",
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#aaaaaa",
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
  connectionError: {
    backgroundColor: "#ffebee",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  connectionErrorText: {
    color: "#b71c1c",
    fontSize: 14,
    flex: 1,
  },
  reconnectButton: {
    backgroundColor: "#ef5350",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  reconnectText: {
    color: "white",
    fontWeight: "600",
  },
  offlineIndicator: {
    backgroundColor: "#fff3e0",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  offlineText: {
    color: "#e65100",
    marginLeft: 8,
    fontSize: 14,
  },
  debugContainer: {
    position: 'absolute',
    bottom: 70,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    maxWidth: 200,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});