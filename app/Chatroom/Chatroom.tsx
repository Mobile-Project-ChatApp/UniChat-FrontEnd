import { router, useLocalSearchParams } from "expo-router";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../config/apiConfig";
import { AuthContext } from "@/contexts/AuthContext";
import { initializeSignalRConnection, stopSignalRConnection, getSignalRConnection } from "../../utils/SignalRConnection";
import axios from 'axios';

export default function Chatroom() {
  const { title, icon, roomId }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);
  const { user: authUser } = useContext(AuthContext);

  // Chat state
  const [messages, setMessages] = useState<{ id: string; text: string; originalText?: string; time: string; senderId: number | null; senderUsername: string; isTranslated?: boolean }[]>([]);
  const [inputText, setInputText] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [description, setDescription] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Translation state
  const [currentLanguage, setCurrentLanguage] = useState("EN"); // "EN", "FI", "NL"
  const [translatedMessages, setTranslatedMessages] = useState<{ [key: string]: { [lang: string]: string } }>({});
  const [showingOriginal, setShowingOriginal] = useState<{ [key: string]: boolean }>({});

  // Announcement state
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [canSendAnnouncements, setCanSendAnnouncements] = useState(false);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isAnnouncementLoading, setIsAnnouncementLoading] = useState(false);

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
      if (!token) token = await AsyncStorage.getItem("authToken");
      if (!token) token = await AsyncStorage.getItem("token");
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  // Set user ID, username, and roles
  useEffect(() => {
    const getUserData = async () => {
      try {
        if (authUser) {
          setCurrentUserId(Number(authUser.id));
          setCurrentUsername(authUser.username);
        } else {
          const token = await getAccessToken();
          if (token) {
            const userInfo = extractUserInfoFromToken(token);
            if (userInfo?.userId) {
              setCurrentUserId(Number(userInfo.userId));
              await AsyncStorage.setItem('userId', userInfo.userId);
            }
          }
        }

        const roles = await AsyncStorage.getItem('userRoles');
        if (roles) {
          try {
            const parsedRoles = JSON.parse(roles);
            setUserRoles(Array.isArray(parsedRoles) ? parsedRoles : []);
            const canAnnounce = Array.isArray(parsedRoles) && parsedRoles.some(
              (role: string) => role.toLowerCase() === 'admin' || role.toLowerCase() === 'moderator'
            );
            setCanSendAnnouncements(canAnnounce);
          } catch (error) {
            console.error("Error parsing user roles:", error);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error retrieving user data:", error);
        setIsLoading(false);
      }
    };

    getUserData();

    // Force userId for dev mode testing
    if (__DEV__ && !currentUserId) {
      setCurrentUserId(3);
    }
  }, [authUser]);

  // Translate text using Google Translate API
  const translateText = async (text: string, target: string): Promise<string> => {
    try {
      if (target === "en") return text;
      const encodedText = encodeURIComponent(text);
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodedText}`
      );
      const data = await response.json();
      return data[0][0][0] || text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  // Translate visible messages
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
              [targetLang]: translatedText,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error translating messages:", error);
    }
  };

  // Toggle language
  const toggleLanguage = async () => {
    const nextLanguage = currentLanguage === "EN" ? "FI" : currentLanguage === "FI" ? "NL" : "EN";
    setCurrentLanguage(nextLanguage);
    if (nextLanguage !== "EN") {
      const targetLang = nextLanguage === "FI" ? "fi" : "nl";
      await translateVisibleMessages(targetLang);
    }
  };

  // SignalR connection setup
  useEffect(() => {
    const setupConnection = async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          console.error("No access token found. Please login again.");
          return;
        }

        const connection = await initializeSignalRConnection();
        connection.on("ReceiveMessage", async (message) => {
          let translatedText = message.messageText;
          const isFromOthers = message.senderId !== currentUserId;

          if (isFromOthers && currentLanguage !== "EN") {
            const targetLang = currentLanguage === "FI" ? "fi" : "nl";
            translatedText = await translateText(message.messageText, targetLang);
          }

          const newMessage = {
            id: message.id.toString(),
            text: isFromOthers ? translatedText : message.messageText,
            originalText: message.messageText,
            time: new Date(message.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            senderId: message.senderId,
            senderUsername: message.senderUsername || "Unknown",
            isTranslated: isFromOthers && translatedText !== message.messageText,
          };

          setMessages((prev) => [newMessage, ...prev]);
        });

        connection.on("UserJoined", (user) => {
          console.log(`${user.username} joined the room`);
        });

        connection.on("UserLeft", (username) => {
          console.log(`${username} left the room`);
        });

        if (connection.state !== "Connected") {
          await connection.start();
          await connection.invoke("JoinRoom", parseInt(roomId));
        }
      } catch (error) {
        console.error("SignalR connection setup failed:", error);
      }
    };

    if (roomId) setupConnection();

    return () => {
      stopSignalRConnection();
    };
  }, [roomId, currentUserId, currentLanguage]);

  // Send message
  const sendMessage = async () => {
    if (!roomId || inputText.trim() === "") return;

    try {
      const connection = getSignalRConnection();
      if (!connection) {
        console.warn("No connection found. Attempting to reconnect...");
        const newConnection = await initializeSignalRConnection();
        if (!newConnection || newConnection.state !== "Connected") {
          await newConnection.start();
          await newConnection.invoke("JoinRoom", parseInt(roomId));
        }
        await newConnection.invoke("SendMessage", parseInt(roomId), inputText);
      } else if (connection.state !== "Connected") {
        await connection.start();
        await connection.invoke("JoinRoom", parseInt(roomId));
        await connection.invoke("SendMessage", parseInt(roomId), inputText);
      } else {
        await connection.invoke("SendMessage", parseInt(roomId), inputText);
      }

      const newMessage = {
        id: String(messages.length + 1),
        text: inputText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
        senderId: currentUserId,
        senderUsername: currentUsername || "Unknown",
      };

      setMessages([newMessage, ...messages]);
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
      Alert.alert("Error", "Failed to send message.");
    }
  };

  // Fetch chatroom info
  const fetchChatroomInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatroom/${roomId}`);
      const data = await response.json();
      setDescription(data.description);
      setMembers(data.members);

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
            senderId: message.senderId,
            senderUsername: sender?.username || "Unknown",
          };
        })
        .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching chatroom info:", error);
    }
  };

  useEffect(() => {
    if (roomId) fetchChatroomInfo();
  }, [roomId]);

  // Navigate to GroupChatPage
  const EnterChatPage = () => {
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

  // Send announcement
  const sendAnnouncement = async () => {
    if (announcementTitle.trim() === "" || announcementContent.trim() === "") {
      Alert.alert("Error", "Please enter both a title and content for the announcement.");
      return;
    }

    if (!currentUserId || !roomId) {
      Alert.alert("Error", "Missing user ID or room ID.");
      return;
    }

    setIsAnnouncementLoading(true);

    try {
      const parsedUserId = parseInt(currentUserId.toString());
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

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Announcement sent successfully!");
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
      setIsAnnouncementLoading(false);
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* HEADER */}
      <SafeAreaView style={darkMode ? { backgroundColor: "#1E1E1E" } : { backgroundColor: "#f0f0f0" }}>
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
              currentLanguage !== "EN" && darkMode && styles.darkActiveLanguageToggleButton,
            ]}
          >
            <Text style={[
              styles.languageToggleText,
              currentLanguage !== "EN" && styles.activeLanguageToggleText,
              darkMode && styles.darkLanguageToggleText,
            ]}>
              {currentLanguage}
            </Text>
          </TouchableOpacity>

          {(canSendAnnouncements || __DEV__) && (
            <TouchableOpacity
              style={styles.announcementButton}
              onPress={() => {
                setAnnouncementTitle("");
                setAnnouncementContent("");
                setIsImportant(false);
                setAnnouncementModalVisible(true);
              }}
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
              item.senderId === currentUserId
                ? [styles.myMessage, darkMode && styles.darkMyMessage]
                : [styles.otherMessage, darkMode && styles.darkOtherMessage],
            ]}
          >
            <Text style={[styles.senderUsername, darkMode && styles.darkSenderUsername]}>
              {item.senderUsername}
            </Text>
            <Text style={[styles.messageText, darkMode && styles.darkMessageText]}>
              {showingOriginal[item.id] && item.originalText
                ? item.originalText
                : currentLanguage !== "EN" && translatedMessages[item.id]?.[currentLanguage === "FI" ? "fi" : "nl"]
                ? translatedMessages[item.id][currentLanguage === "FI" ? "fi" : "nl"]
                : item.text}
            </Text>
            {item.isTranslated && (
              <TouchableOpacity
                onPress={() => setShowingOriginal(prev => ({
                  ...prev,
                  [item.id]: !prev[item.id],
                }))}
                style={styles.translatedToggle}
              >
                <Text style={styles.translatedIndicator}>
                  {showingOriginal[item.id] ? "(Showing original text)" : "(Translated - tap to see original)"}
                </Text>
              </TouchableOpacity>
            )}
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
                  isImportant && darkMode && styles.darkCheckboxChecked,
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
                disabled={isAnnouncementLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendAnnouncement}
                style={[
                  styles.modalSendButton,
                  isAnnouncementLoading && styles.modalSendButtonDisabled,
                ]}
                disabled={isAnnouncementLoading}
              >
                {isAnnouncementLoading ? (
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
  senderUsername: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF8B0F",
    marginBottom: 5,
  },
  darkSenderUsername: {
    color: "#FF8B0F",
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
    padding: 10,
  },
  languageButton: {
    padding: 8,
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
});