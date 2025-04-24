import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
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
  ToastAndroid,
  Platform,
} from "react-native";
import { getSignalRConnection } from "../utils/SignalRConnection";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from 'react-native-root-toast';
import { API_BASE_URL } from "@/config/apiConfig";

// Helper function for cross-platform toast messages
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS or web, use Alert since Toast is Android-only
    Alert.alert("", message);
  }
};

export default function GroupChatPage() {
  const router = useRouter();
  const { user: authUser } = useContext(AuthContext);
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

  const showToast = (message: string) => {
    if (Platform.OS === 'web') {
      // For web, create a custom visual toast since native ones don't work
      const toastDiv = document.createElement('div');
      toastDiv.style.position = 'fixed';
      toastDiv.style.bottom = '20px';
      toastDiv.style.left = '50%';
      toastDiv.style.transform = 'translateX(-50%)';
      toastDiv.style.backgroundColor = '#333';
      toastDiv.style.color = 'white';
      toastDiv.style.padding = '10px 20px';
      toastDiv.style.borderRadius = '5px';
      toastDiv.style.zIndex = '1000';
      toastDiv.textContent = message;
      
      document.body.appendChild(toastDiv);
      
      setTimeout(() => {
        document.body.removeChild(toastDiv);
      }, 3000);
    } else if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS or other platforms
      Alert.alert("", message);
    }
    
    // Also console log for debugging
    console.log("TOAST:", message);
  };

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

      const token = await AsyncStorage.getItem("accessToken") || 
                   await AsyncStorage.getItem("authToken") || 
                   await AsyncStorage.getItem("token");
      
      if (!token) {
        console.error("No auth token found");
        showToast("You need to be logged in");
        return;
      }
      

      if (!authUser || !authUser.id) {
        console.error("No user found in AuthContext");
        showToast("Authentication error. Please log in again.");
        return;
      }

      const userId = authUser.id;
      

      const response = await axios.delete(
        `${API_BASE_URL}/api/chatroom/${roomId}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      console.log(`User removed from room in database: ${response.status}`);
      

      await connection.invoke("LeaveRoom", parseInt(roomId));
      console.log(`Left room ${roomId}`);
      
      showToast("Left the group successfully");
      
      // Navigate back to the chatrooms list
      router.push({
        pathname: "/", 
      });
    } catch (err) {
      console.error("Error leaving room:", err);
      showToast("Failed to leave the group");
    }
  };

  const handleInvitePress = () => {
    setInviteModalVisible(true);
    setInviteInput("");
  };

  const handleSendInvite = async () => {
    console.log("Starting invitation process for input:", inviteInput);
    
    if (!inviteInput.trim()) {
      console.log("Empty input detected");
      showToast("Please enter a username");
      return;
    }
    
    setInviteLoading(true);
    try {
      console.log("Getting auth token...");
      const token = await AsyncStorage.getItem("accessToken") || 
                   await AsyncStorage.getItem("authToken") || 
                   await AsyncStorage.getItem("token");
      
      if (!token) {
        console.log("No auth token found");
        showToast("You need to be logged in");
        setInviteLoading(false);
        return;
      }
      console.log("Auth token retrieved successfully");
  
      // First find the user by exact username
      try {
        console.log(`Making API call to search for user: ${inviteInput}`);
        console.log(`Request URL: ${API_BASE_URL}/api/users?search=${encodeURIComponent(inviteInput)}`);
        
        const usersResponse = await axios.get(
          `${API_BASE_URL}/api/users?search=${encodeURIComponent(inviteInput)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log("Users search API response status:", usersResponse.status);
        console.log("Users found:", usersResponse.data.length);
        console.log("Raw API response:", JSON.stringify(usersResponse.data));
        
        // Find the exact username match
        const exactMatch = usersResponse.data.find(
          (user: any) => user.username.toLowerCase() === inviteInput.toLowerCase()
        );
        
        if (!exactMatch) {
          console.log("No exact match found for username:", inviteInput);
          console.log("Available usernames:", usersResponse.data.map((u: any) => u.username).join(', '));
          showToast("User not found");
          setInviteLoading(false);
          return;
        }
        
        console.log("Exact match found:", JSON.stringify(exactMatch));
        
        // Check if user is already a member
        console.log("Checking if user is already a member...");
        console.log("Current members:", JSON.stringify(members.map(m => ({ id: m.id, username: m.username }))));
        
        const isMember = members.some(member => member.id === exactMatch.id);
        if (isMember) {
          console.log("User is already a member of this group");
          showToast("User is already a member of this group");
          setInviteLoading(false);
          return;
        }
        
        // Send invitation using the found user ID
        try {
          console.log("Sending invitation with payload:", {
            ReceiverId: exactMatch.id,
            ChatRoomId: parseInt(roomId)
          });
          
          const response = await axios.post(
            `${API_BASE_URL}/api/Invitation`,
            {
              ReceiverId: exactMatch.id,
              ChatRoomId: parseInt(roomId)
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          console.log("Invitation API response:", response.status, response.data);
          showToast("Invitation sent successfully");
          setInviteModalVisible(false);
          setInviteInput("");
        } catch (error: any) {
          console.error("Invitation error:", error);
          console.log("Error response data:", error.response?.data);
          console.log("Error response status:", error.response?.status);
          
          if (error.response) {
            if (error.response.status === 409) {
              console.log("409 Conflict: Invitation already exists or user is already a member");
              showToast("Invitation already exists or user is already a member");
            } else if (error.response.status === 400) {
              console.log("400 Bad Request:", error.response.data);
              showToast(
                typeof error.response.data === 'string' 
                  ? error.response.data 
                  : "Invalid invitation request"
              );
            } else {
              console.log(`Error status ${error.response.status}`);
              showToast("Failed to send invitation");
            }
          } else {
            console.log("Network error or unhandled exception");
            showToast("Network error");
          }
        }
      } catch (searchError: any) {
        console.error("Error in user search:", searchError);
        console.log("Search error response data:", searchError.response?.data);
        console.log("Search error response status:", searchError.response?.status);
        showToast("Failed to find user");
      }
    } catch (error) {
      console.error("Top-level error in invitation process:", error);
      showToast("Failed to find user");
    } finally {
      console.log("Invitation process complete");
      setInviteLoading(false);
      setInviteModalVisible(false);
      setInviteInput("");
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

      {/* Simplified Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setInviteModalVisible(false);
          setInviteInput("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, darkMode && styles.darkModalView]}>
            <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
              Invite User
            </Text>
            
            <Text style={[styles.modalLabel, darkMode && styles.darkText]}>
              Enter username
            </Text>
            
            <TextInput
              style={[styles.input, darkMode && styles.darkInput]}
              value={inviteInput}
              onChangeText={setInviteInput}
              placeholder="Username"
              autoCapitalize="none"
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setInviteModalVisible(false);
                  setInviteInput("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  inviteLoading && styles.disabledButton
                ]}
                onPress={handleSendInvite}
                disabled={inviteLoading}
              >
                <Text style={styles.buttonText}>
                  {inviteLoading ? "Sending..." : "Send Invite"}
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
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
});