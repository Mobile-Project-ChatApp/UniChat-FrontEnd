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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "@/contexts/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { initializeSignalRConnection, stopSignalRConnection, getSignalRConnection } from "../../utils/SignalRConnection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../config/apiConfig";
import { AuthContext } from "@/contexts/AuthContext";

export default function Chatroom() {
  const { title, icon, roomId }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);

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

  const sendMessage = async () => {
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
  };

  useEffect(() => {
    fetchChatroomInfo();
  }, []);

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
                : [styles.otherMessage, darkMode && styles.darkOtherMessage],
            ]}
          >
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