import { useLocalSearchParams } from "expo-router";
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
import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../config/apiConfig"; // Import API_BASE_URL

export default function Chatroom() {
  const { title, icon, roomId }: any = useLocalSearchParams(); // Assume roomId is passed as a parameter
  const { darkMode } = useContext(ThemeContext);

  const [messages, setMessages] = useState<{ id: string; text: string; time: string; sender: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  const getAccessToken = async () => {
    const token = await AsyncStorage.getItem("accessToken"); // Retrieve token from storage
    if (!token) {
      console.error("Access token is missing");
    }
    return token;
  };


  useEffect(() => {
    // Initialize SignalR connection
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chatHub`, {

        accessTokenFactory: async () => {
          const token = await getAccessToken(); // Use the helper function
          return token || ""; // Return the token or an empty string
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    return () => {
      // Cleanup connection on unmount
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(async () => {
          console.log("SignalR Connected.");

          // Join the room
          if (roomId) {
            await connection.invoke("JoinRoom", parseInt(roomId));
            console.log(`Joined room ${roomId}`);
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

          // Handle user joined
          connection.on("UserJoined", (user) => {
            console.log(`${user.username} joined the room`);
          });

          // Handle user left
          connection.on("UserLeft", (username) => {
            console.log(`${username} left the room`);
          });
        })
        .catch((err) => console.error("SignalR Connection Error: ", err));
    }

    // Cleanup: Leave the room when unmounting
    return () => {
      if (connection && roomId) {
        connection.invoke("LeaveRoom", parseInt(roomId)).then(() => {
          console.log(`Left room ${roomId}`);
        }).catch((err) => {
          console.error("Error leaving room:", err);
        });
      }
    };
  }, [connection, roomId]);

  const sendMessage = async () => {
    if (!roomId) {
      console.error("No room selected. Please join a room first.");
      return;
    }

    if (inputText.trim() === "") {
      console.error("Message is empty. Please type a message.");
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

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* HEADER */}
      <SafeAreaView style={darkMode ? { backgroundColor: "#1E1E1E" } : { backgroundColor: "#f0f0f0" }}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <Image source={{ uri: icon }} style={styles.icon} />
          <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
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
                : [styles.otherMessage, darkMode && styles.darkOtherMessage],
            ]}
          >
            <Text style={[styles.messageText, darkMode && styles.darkMessageText]}>{item.text}</Text>
            <Text style={[styles.messageTime, darkMode && styles.darkMessageTime]}>{item.time}</Text>
          </View>
        )}
        contentContainerStyle={[styles.messagesList, darkMode && styles.darkMessagesList]}
        inverted={true} // Ensure messages appear from bottom to top
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
    justifyContent: "flex-end", // Ensures messages stay at the bottom
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
    backgroundColor: "#004D40", // Darker green for dark mode
  },
  otherMessage: {
    backgroundColor: "#aac4a5",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  darkOtherMessage: {
    backgroundColor: "#303030", // Darker grey for dark mode
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
  },
  darkMessageText: {
    color: "#fff", // Keep white text in dark mode too
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
});