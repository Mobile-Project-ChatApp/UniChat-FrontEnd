import React, { useState, useContext, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Chatroom() {
  const { title, icon, chatroomId }: any = useLocalSearchParams();
  const { title, icon, roomId }: any = useLocalSearchParams(); // Assume roomId is passed as a parameter
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [messages, setMessages] = useState([
    { id: "1", text: "Hello!", time: "10:30 AM", sender: "other" },
    { id: "2", text: "Hey, how's it going?", time: "10:32 AM", sender: "me" },
    { id: "3", text: "All good! You?", time: "10:35 AM", sender: "other" },
  ]);

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

  const API_BASE_URL = "http://145.85.233.182:5222"; // Replace with your API base URL

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