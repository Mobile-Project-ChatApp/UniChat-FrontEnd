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
  const [translateToFinnish, setTranslateToFinnish] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<{ [key: string]: string }>({});

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

  // Toggle translation and translate the clicked message
  const toggleTranslation = async (messageId: string, text: string) => {
    const newTranslateState = !translateToFinnish;
    setTranslateToFinnish(newTranslateState);

    if (newTranslateState) {
      // Translate only the most recent 20 messages to avoid overload
      const newTranslations: { [key: string]: string } = {};
      const visibleMessages = messages.slice(0, 20); // Limit to recent messages
      for (const msg of visibleMessages) {
        try {
          const translatedText = await translateText(msg.text, "fi");
          newTranslations[msg.id] = translatedText;
        } catch (error) {
          console.error(`Failed to translate message ${msg.id}:`, error);
          newTranslations[msg.id] = msg.text; // Fallback to original
        }
      }
      setTranslatedMessages(newTranslations);
    } else {
      // Clear translations to revert to English
      setTranslatedMessages({});
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
      const connection = await initializeSignalRConnection();

      // Handle server errors
      connection.on("error", (error) => {
        console.error("SignalR server error:", error);
      });

      connection.on("ReceiveMessage", async (message) => {
        const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
        const isValidDate = !isNaN(timestamp.getTime());
        let messageText = message.messageText;

        // Translate to Finnish if enabled
        if (translateToFinnish) {
          messageText = await translateText(message.messageText, "fi");
          setTranslatedMessages((prev) => ({
            ...prev,
            [message.id.toString()]: messageText,
          }));
        }

        setMessages((prevMessages) => [
          {
            id: message.id.toString(),
            text: message.messageText, // Store original text
            time: (isValidDate ? timestamp : new Date()).toLocaleTimeString([], {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            senderId: message.senderId,
            sender: message.sender?.username,
            senderUsername: message.sender?.username || members.find((m) => m.id === message.senderId)?.username || "Unknown",
          },
          ...prevMessages,
        ]);
      });

      // Check connection state before invoking
      if (roomId && connection.state === "Connected") {
        try {
          await connection.invoke("JoinRoom", parseInt(roomId));
          console.log(`Joined room ${roomId}`);
        } catch (error) {
          console.error("Failed to join room:", error);
        }
      } else if (roomId) {
        console.warn("SignalR not connected, attempting to reconnect...");
        try {
          await connection.start();
          await connection.invoke("JoinRoom", parseInt(roomId));
          console.log(`Joined room ${roomId} after reconnect`);
        } catch (error) {
          console.error("Reconnection failed:", error);
        }
      }
    };

    setupConnection();

    return () => {
      stopSignalRConnection();
    };
  }, [roomId]); // Removed translateToFinnish from dependencies

  const sendMessage = async () => {
    const connection = getSignalRConnection();
    if (!connection || !roomId) {
      console.error("No connection or room selected.");
      return;
    }

    if (inputText.trim() === "") {
      console.error("Message is empty. Please type a message.");
      return;
    }

    try {
      // Check connection state
      if (connection.state !== "Connected") {
        console.warn("SignalR not connected, attempting to reconnect...");
        await connection.start();
      }

      await connection.invoke("SendMessage", parseInt(roomId), inputText);

      let messageText = inputText;
      if (translateToFinnish) {
        messageText = await translateText(inputText, "fi");
        setTranslatedMessages((prev) => ({
          ...prev,
          [String(messages.length + 1)]: messageText,
        }));
      }

      const newMessage = {
        id: String(messages.length + 1),
        text: inputText, // Store original text
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
        senderId: currentUserId,
        senderUsername: currentUsername || "Unknown",
      };
      setMessages([newMessage, ...messages]);
      setInputText("");
    } catch (err) {
      console.error("Failed to send message:", err);
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
        <TouchableOpacity onPress={EnterChatPage}>
          <View style={[styles.header, darkMode && styles.darkHeader]}>
            <Image source={{ uri: icon }} style={styles.icon} />
            <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
          </View>
        </TouchableOpacity>
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
              {translateToFinnish && translatedMessages[item.id] ? translatedMessages[item.id] : item.text}
            </Text>
            <Text style={[styles.messageTime, darkMode && styles.darkMessageTime]}>{item.time}</Text>
            <TouchableOpacity
              onPress={() => toggleTranslation(item.id, item.text)}
              style={[styles.translateButton, darkMode && styles.darkTranslateButton]}
            >
              <Ionicons
                name={translateToFinnish ? "language-outline" : "language"}
                size={20}
                color={darkMode ? "#ccc" : "#666"}
              />
            </TouchableOpacity>
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