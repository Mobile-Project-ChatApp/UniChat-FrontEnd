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
import { initializeSignalRConnection, stopSignalRConnection, getSignalRConnection } from "../../utils/SignalRConnection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { API_BASE_URL } from "../../config/apiConfig";

export default function Chatroom() {
  const params = useLocalSearchParams();
  const { title, icon, roomId }: any = params;
import { API_BASE_URL } from "../../config/apiConfig";
import { AuthContext } from "@/contexts/AuthContext";

export default function Chatroom() {
  const { title, icon, roomId }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();

  // Original chat state
  const [messages, setMessages] = useState<{ id: string; text: string; originalText?: string; time: string; sender: string; isTranslated?: boolean }[]>([]);
  const [messages, setMessages] = useState<{ id: string; text: string; time: string; senderId: number | null; senderUsername: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [description, setDescription] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("EN"); // "EN", "FI", "NL"
  const [translatedMessages, setTranslatedMessages] = useState<{ [key: string]: { [lang: string]: string } }>({});
  const { user: authUser } = useContext(AuthContext);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Announcement state
  const [userId, setUserId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [canSendAnnouncements, setCanSendAnnouncements] = useState(false);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  //Translation States
  const [targetLanguage, setTargetLanguage] = useState<string>("en");
  const [showingOriginal, setShowingOriginal] = useState<{[key: string]: boolean}>({});

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
  //useEffect to load the language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("preferredLanguage");
        if (savedLanguage) {
          console.log("Loaded language preference:", savedLanguage);
          setTargetLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      }
    };
    
    loadLanguagePreference();
  }, []);

  // Translation function
  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      if (targetLang === "en") return text; // Skip translation for English (or your default)
      
      // Use your preferred translation API - this example uses a mock for demonstration
      // In production, you'd replace this with an actual API call
      const API_KEY = "https://translate.googleapis.com"; // Replace with your API key
      
      // Example using Google Translate API (you'll need to set this up)
      const response = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        {},
        {
          params: {
            q: text,
            target: targetLang,
            key: API_KEY,
          },
        }
      );
      
      // Return translated text from response
      return response.data.data.translations[0].translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Fallback to original text if translation fails
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
          connection.on("ReceiveMessage", async (message) => {
            // Only translate messages from others (not from current user)
            let translatedText = message.messageText;
            
            // Check if sender is not the current user
            const isFromOthers = message.sender.username !== "me";
            
            if (isFromOthers && targetLanguage !== "en") {
              try {
                translatedText = await translateText(message.messageText, targetLanguage);
              } catch (e) {
                console.error("Translation failed:", e);
              }
            }
            
            setMessages((prevMessages) => [
              {
                id: message.id.toString(),
                text: translatedText,
                originalText: message.messageText, // Store original text
                time: new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
                sender: message.sender.username,
                isTranslated: isFromOthers && translatedText !== message.messageText,
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
  // Translate text using Google Translate API
  const translateText = async (text: string, target: string): Promise<string> => {
    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodedText}`
      );
      const data = await response.json();
      return data[0][0][0] || text; // Extract translated text, fallback to original if empty
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text on error
    }
  };

  // Add this helper function
  const translateVisibleMessages = async (targetLang: string) => {
    try {
      const visibleMessages = messages.slice(0, 10);
      
      for (const msg of visibleMessages) {
        if (!translatedMessages[msg.id] || !translatedMessages[msg.id][targetLang]) {
          const translatedText = await translateText(msg.text, targetLang);
          
          setTranslatedMessages(prev => ({
            ...prev,
            [msg.id]: {
              ...(prev[msg.id] || {}),
              [targetLang]: translatedText
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error translating messages:", error);
    }
  };

    // Cleanup: Leave the room when unmounting
    return () => {
      if (connection && roomId) {
        connection.invoke("LeaveRoom", parseInt(roomId)).catch((err) => {
          console.error("Error leaving room:", err);
        });
  // Toggle between languages (EN, FI, NL)
  const toggleLanguage = async () => {
    // Cycle through languages: EN -> FI -> NL -> EN
    const nextLanguage = currentLanguage === "EN" ? "FI" : currentLanguage === "FI" ? "NL" : "EN";
    setCurrentLanguage(nextLanguage);
    
    if (nextLanguage !== "EN") {
      // Translate only if switching to non-English
      const targetLang = nextLanguage === "FI" ? "fi" : "nl";
      translateVisibleMessages(targetLang);
    }
  };

  // Set user ID and username from authUser
  useEffect(() => {
    if (authUser) {
      console.log("Current authUser:", authUser);
      setCurrentUserId(Number(authUser.id));
      setCurrentUsername(authUser.username);
      setIsLoading(false);
    } else {
      console.error("authUser is null. Unable to set user ID and username.");
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    const setupConnection = async () => {
      try {
        // Get a fresh access token first
        const accessToken = await AsyncStorage.getItem("accessToken");
        
        if (!accessToken) {
          console.error("No access token found. Please login again.");
          // You might want to redirect to login here
          return;
        }
        
        console.log("Using access token:", accessToken.substring(0, 10) + "...");
        
        const connection = await initializeSignalRConnection();
        
        // Rest of your existing connection setup...
      } catch (error) {
        console.error("SignalR connection setup failed:", error);
      }
    };

    setupConnection();

    return () => {
      stopSignalRConnection();
    };
  }, [roomId]);

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
      // Get a fresh connection reference each time
      const connection = getSignalRConnection();
      
      if (!connection) {
        console.warn("No connection found. Attempting to reconnect...");
        const newConnection = await initializeSignalRConnection();
        
        if (!newConnection || !roomId) {
          console.error("Failed to establish connection or no room ID");
          return;
        }
        
        if (newConnection.state !== "Connected") {
          await newConnection.start();
          await newConnection.invoke("JoinRoom", parseInt(roomId));
        }
        
        await newConnection.invoke("SendMessage", parseInt(roomId), inputText);
      }
      else if (connection.state !== "Connected") {
        console.warn("Connection exists but not in Connected state. Reconnecting...");
        await connection.start();
        await connection.invoke("JoinRoom", parseInt(roomId));
        await connection.invoke("SendMessage", parseInt(roomId), inputText);
      } 
      else {
        // Connection is good, just send the message
        await connection.invoke("SendMessage", parseInt(roomId), inputText);
      }
      
      // Rest of your message handling code
      // Create local message, update translations, etc.
      const newMessage = {
        id: String(messages.length + 1),
        text: inputText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
        senderId: currentUserId,
        senderUsername: currentUsername || "Unknown",
      };
      
      // Optimistically add to messages
      setMessages([newMessage, ...messages]);
      
      // If currently translating, add translations for this message too
      if (currentLanguage !== "EN") {
        const targetLang = currentLanguage === "FI" ? "fi" : "nl";
        const translatedText = await translateText(inputText, targetLang);
        
        setTranslatedMessages((prev) => ({
          ...prev,
          [newMessage.id]: {
            ...(prev[newMessage.id] || {}),
            [targetLang]: translatedText,
          },
        }));
      }
      
      setInputText("");
    } catch (err) {
      console.error("Error sending message:", err);
      // Show error to user if needed
    }
  };

  // Function from branch 1 to fetch chatroom info
  const fetchChatroomInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatroom/${roomId}`);
      const data = await response.json();

      console.log("Chatroom info:", data);
      console.log("Chatroom members:", data.members);

      setDescription(data.description);
      setMembers(data.members);

      // Update the messages state with the fetched messages, sorted by sentAt in descending order
      const formattedMessages = data.messages
        .map((message: any) => {
          const sender = data.members.find((member: any) => member.id === message.senderId);
          return {
            id: message.id.toString(),
            text: message.messageText,
            time: new Date(message.sentAt).toLocaleTimeString([], {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            sentAt: new Date(message.sentAt),
            senderId: message.senderId,
            senderUsername: sender?.username || "Unknown",
          };
        })
        .sort((a: any, b: any) => b.sentAt.getTime() - a.sentAt.getTime());
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching chatroom info:", error);
    }
  }
  
  };

  useEffect(() => {
    fetchChatroomInfo();
  }, []);

  // Function from branch 1 to navigate to GroupChatPage
  const EnterChatPage = () => {
    console.log("Navigating to Chatroom with:", { title, icon, description });
    router.push({
      pathname: "/GroupChatPage",
      params: {
        title,
        icon,
        roomId,
        description,
        members: JSON.stringify(members),
      },
    });
  };

  // Open announcement modal - from branch 2
  const navigateToSendAnnouncement = () => {
    // Reset form state
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setIsImportant(false);
    
    // Show the modal
    setAnnouncementModalVisible(true);
  };

  // Send announcement function from branch 2
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

  // Force userId for dev mode testing - from branch 2
  useEffect(() => {
    if (__DEV__ && !userId) {
      setUserId("3"); // Default test ID for development
    }
  }, [userId]);

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* HEADER - Combined from both branches */}
      <SafeAreaView style={darkMode ? { backgroundColor: "#1E1E1E" } : { backgroundColor: "#f0f0f0" }}>
        <TouchableOpacity onPress={EnterChatPage}>
          <View style={[styles.header, darkMode && styles.darkHeader]}>
            <Image source={{ uri: icon }} style={styles.icon} />
            <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
            
            {/* Added from branch 2 */}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => {
                // Show list of languages or navigate to settings
                router.push('/(tabs)/SettingsScreen');
              }}
            >
              <Ionicons name="language" size={22} color={darkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
            
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
        </TouchableOpacity>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={EnterChatPage} style={styles.headerTitleSection}>
            <Image source={{ uri: icon }} style={styles.icon} />
            <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={toggleLanguage}
            style={[
              styles.languageToggleButton,
              darkMode && styles.darkLanguageToggleButton,
              currentLanguage !== "EN" && styles.activeLanguageToggleButton,
              currentLanguage !== "EN" && darkMode && styles.darkActiveLanguageToggleButton
            ]}
          >
            <Text style={[
              styles.languageToggleText,
              currentLanguage !== "EN" && styles.activeLanguageToggleText,
              darkMode && styles.darkLanguageToggleText
            ]}>
              {currentLanguage}
            </Text>
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
              item.senderId === currentUserId
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
            <Text style={[styles.messageText, darkMode && styles.darkMessageText]}>
              {showingOriginal[item.id] && item.originalText ? item.originalText : item.text}
            </Text>
            {item.isTranslated && (
              <TouchableOpacity 
                onPress={() => setShowingOriginal(prev => ({
                  ...prev, 
                  [item.id]: !prev[item.id]
                }))}
                style={styles.translatedToggle}
              >
                <Text style={styles.translatedIndicator}>
                  {showingOriginal[item.id] ? "(Showing original text)" : "(Translated - tap to see original)"}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.messageTime, darkMode && styles.darkMessageTime]}>
              {item.time}
            </Text>
            <Text style={[styles.senderUsername, darkMode && styles.darkSenderUsername]}>
              {item.senderUsername}
            </Text>
            <Text style={[styles.messageText, darkMode && styles.darkMessageText]}>
              {currentLanguage !== "EN" && 
               translatedMessages[item.id]?.[currentLanguage === "FI" ? "fi" : "nl"] 
                ? translatedMessages[item.id][currentLanguage === "FI" ? "fi" : "nl"] 
                : item.text}
            </Text>
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
    justifyContent: "space-between",
  },
  darkHeader: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  headerTitleSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageToggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  activeLanguageToggleButton: {
    backgroundColor: '#29df04',
  },
  darkLanguageToggleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  darkActiveLanguageToggleButton: {
    backgroundColor: '#1a7a00',
  },
  languageToggleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  activeLanguageToggleText: {
    color: '#fff',
  },
  darkLanguageToggleText: {
    color: '#ddd',
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
  },
  translatedIndicator: {
    fontSize: 10,
    color: "#888",
    fontStyle: "italic",
    marginTop: 2,
  },
  translatedToggle: {
    marginTop: 2,
  },
  languageButton: {
    marginLeft: 10,
    padding: 8,
  senderUsername: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF8B0F",
    marginBottom: 5,
  },
  darkSenderUsername: {
    color: "#FF8B0F",
  },
  translateButton: {
    alignSelf: "flex-end",
    padding: 5,
    marginTop: 5,
  },
  darkTranslateButton: {
    opacity: 0.7,
  },
});