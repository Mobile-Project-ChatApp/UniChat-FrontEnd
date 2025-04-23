import { ThemeContext } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { getSignalRConnection } from "../utils/SignalRConnection";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "@/config/apiConfig";

export default function GroupChatPage() {
  const router = useRouter();
  const {
    roomId,
    icon,
    title: initialTitle,
    description: initialDescription,
  }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);

  const defaultAvatar =
    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4867.jpg";

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(initialTitle || "");
  const [editDescription, setEditDescription] = useState(
    initialDescription || ""
  );
  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState(initialDescription || "");

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [roomId]);

  const fetchMembers = async () => {
    if (!roomId) {
      console.error("No room ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/chatroom/${roomId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch chatroom: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.members) {
        console.log("GroupChatPage: Found members:", data.members);
        setMembers(data.members);

        // Update title and description from the API response if available
        if (data.name) {
          setTitle(data.name);
          setEditTitle(data.name);
        }
        if (data.description) {
          setDescription(data.description);
          setEditDescription(data.description);
        }
      } else {
        console.warn(
          "GroupChatPage: No members found or unexpected data format"
        );
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching chatroom members:", error);
    } finally {
      setLoading(false);
    }
  };

  const HandleLeaveGroup = async () => {
    const connection = getSignalRConnection();
    if (!connection || !roomId) {
      console.error("No connection or room selected.");
      return;
    }

    try {
      await connection.invoke("LeaveRoom", parseInt(roomId));
      console.log(`Left room ${roomId}`);
      router.back(); // Navigate back after leaving the group
      router.back();
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  const handleInvitePress = () => {
    setInviteModalVisible(true);
  };

  const handleSendInvite = async () => {
    if (!inviteInput.trim()) {
      Alert.alert("Error", "Please enter a username or email to invite.");
      return;
    }
    
    setInviteLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken") || 
                    await AsyncStorage.getItem("authToken") || 
                    await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Authentication Error", "You need to be logged in.");
        return;
      }
  
      // First, search for the user to get their ID
      const userSearchResponse = await axios.get(
        `${API_BASE_URL}/api/users?search=${encodeURIComponent(inviteInput)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      // If no user found, show an error
      if (!userSearchResponse.data || userSearchResponse.data.length === 0) {
        Alert.alert("Error", "User not found. Please check the username.");
        setInviteLoading(false);
        return;
      }
  
      // Get the user ID from the search results
      const userId = userSearchResponse.data[0].id;
      
      // Now send the invitation with the numeric user ID
      const response = await axios.post(
        `${API_BASE_URL}/api/Invitation`,
        {
          ReceiverId: userId,  // Use numeric ID instead of username
          ChatRoomId: parseInt(roomId)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Invitation sent!");
        setInviteModalVisible(false);
        setInviteInput("");
      }
    } catch (error) {
      console.error("Invitation error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        if (axios.isAxiosError(error) && error.response) {
          console.log("Error status:", error.response.status);
        } else {
          console.error("Unexpected error:", error);
        }
        if (axios.isAxiosError(error) && error.response) {
          console.log("Error data:", error.response.data);
        } else {
          console.error("Unexpected error:", error);
        }
        
        // Extract validation error messages if available
        let errorMessage = "Failed to send invitation.";
        if (error.response.data && error.response.data.errors) {
          const errorDetails = Object.values(error.response.data.errors)
            .flat()
            .join("\n");
          errorMessage = errorDetails || errorMessage;
        }
        
        Alert.alert("Error", errorMessage);
      } else {
        Alert.alert("Error", "Failed to connect to the server.");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const HandleEditPress = () => {
    setIsModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Error", "Group name cannot be empty");
      return;
    }

    try {
      const token =
        (await AsyncStorage.getItem("accessToken")) ||
        (await AsyncStorage.getItem("authToken")) ||
        (await AsyncStorage.getItem("token"));

      if (!token) {
        Alert.alert(
          "Authentication Error",
          "You need to be logged in to edit group details"
        );
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/Chatroom/${roomId}`,
        {
          id: parseInt(roomId),
          name: editTitle,
          description: editDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        // Update local state
        setTitle(editTitle);
        setDescription(editDescription);
        setIsModalVisible(false);

        // Update params to refresh when going back
        router.setParams({
          title: editTitle,
          description: editDescription,
        });

        Alert.alert("Success", "Group information updated successfully");
      } else {
        Alert.alert("Error", "Failed to update group information");
      }
    } catch (error) {
      console.error("Error updating group information:", error);
      Alert.alert("Error", "Failed to update group information");
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{ fontWeight: "bold" }}>Group Info</Text>
          <TouchableOpacity onPress={HandleEditPress}>
            <Text style={styles.edit}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.Infoheader}>
          <Image source={{ uri: icon }} style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <Text style={styles.Memberstitle}>Members:</Text>
        <View style={styles.MembersCon}>
          {members.slice(0, 8).map((member: any, index: number) => (
            <View key={index} style={styles.MembersItem}>
              <Image
                source={{
                  uri: member.profilePicture
                    ? `${API_BASE_URL}${member.profilePicture}`
                    : defaultAvatar,
                }}
                style={styles.icon}
              />
              <Text>{member.username}</Text>
            </View>
          ))}
          {members.length > 8 && (
            <View style={styles.MembersItem}>
              <Text style={{ fontSize: 24, fontWeight: "bold" }}>...</Text>
            </View>
          )}
        </View>

        <View style={styles.ButtonCon}>
          <TouchableOpacity onPress={handleInvitePress}>
            <Text style={styles.InviteBtn}>Invite People</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={HandleLeaveGroup}>
            <Text style={styles.LeaveBtn}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Edit Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, darkMode && styles.darkModalView]}>
            <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
              Edit Group
            </Text>

            <Text style={[styles.modalLabel, darkMode && styles.darkText]}>
              Group Name
            </Text>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter group name"
            />

            <Text style={[styles.modalLabel, darkMode && styles.darkText]}>
              Description
            </Text>
            <TextInput
              style={[styles.textArea, darkMode && styles.darkInput]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter description"
              multiline={true}
              numberOfLines={3}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, darkMode && styles.darkModalView]}>
            <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
              Invite User
            </Text>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput]}
              value={inviteInput}
              onChangeText={setInviteInput}
              placeholder="Enter username or email"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setInviteModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSendInvite}
                disabled={inviteLoading}
              >
                <Text style={styles.buttonText}>
                  {inviteLoading ? "Sending..." : "Send"}
                </Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f0f0f0",
    marginTop: 35,
  },
  Infoheader: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#cbcaca",
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f58814",
  },
  description: {
    fontSize: 14,
    color: "#595959",
    fontWeight: "300",
  },
  icon: {
    width: 70,
    height: 70,
    borderRadius: 50,
    marginBottom: 5,
  },
  edit: {
    fontSize: 13,
    fontWeight: "500",
    color: "#595959",
  },
  MembersCon: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    columnGap: 5,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  Memberstitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1c1c1c",
    marginBottom: 10,
  },
  MembersItem: {
    width: "22%",
    aspectRatio: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    fontSize: 17,
    fontWeight: "500",
  },
  ButtonCon: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    rowGap: 10,
    marginTop: 10,
  },
  LeaveBtn: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    padding: 10,
    backgroundColor: "#ff0000",
    borderRadius: 10,
    width: 200,
  },
  InviteBtn: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    padding: 10,
    backgroundColor: "#2dffbf",
    borderRadius: 10,
    width: 200,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModalView: {
    backgroundColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  darkText: {
    color: "white",
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    height: 100,
    textAlignVertical: "top",
  },
  darkInput: {
    borderColor: "#555",
    color: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#f44336",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
