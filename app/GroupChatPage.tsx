import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { getSignalRConnection } from "../utils/SignalRConnection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';

import { API_BASE_URL } from '@/config/apiConfig';

// Import avatar images directly
const avatarImages :any = {
  avatar1: require('@/assets/images/avatar/avatar1.png'),
  avatar2: require('@/assets/images/avatar/avatar2.png'),
  avatar3: require('@/assets/images/avatar/avatar3.png'),
  avatar4: require('@/assets/images/avatar/avatar4.png'),
  avatar5: require('@/assets/images/avatar/avatar5.png'),
  avatar6: require('@/assets/images/avatar/avatar6.png'),
  avatar7: require('@/assets/images/avatar/avatar7.png'),
  avatar8: require('@/assets/images/avatar/avatar8.png'),
};

// Helper function to get the correct image source
const getAvatarSource = (path: any) => {
  if (!path) return require('@/assets/images/avatar/default-avatar.jpeg');
  
  if (path.startsWith('/avatars/')) {
    // Extract avatar name (e.g., "avatar1.png" from "/avatars/avatar1.png")
    const avatarName = path.split('/').pop().split('.')[0];
    return avatarImages[avatarName] || require('@/assets/images/avatar/default-avatar.jpeg');
  }
  
  // If it's a full URL, use it directly
  if (path.startsWith('http')) {
    return { uri: path };
  }
  
  // For paths relative to the API
  return { uri: `${API_BASE_URL}${path}` };
};

export default function GroupChatPage() {
  const router = useRouter();
  const { roomId, icon, title: initialTitle, description: initialDescription }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);

  const defaultAvatar = 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4867.jpg'; 

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(initialTitle || "");
  const [editDescription, setEditDescription] = useState(initialDescription || "");
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState(initialDescription || "");

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
  
      // Step 1: Fetch chatroom data to get member IDs
      const chatroomResponse = await fetch(`${API_BASE_URL}/api/chatroom/${roomId}`);
      
      if (!chatroomResponse.ok) {
        throw new Error(`Failed to fetch chatroom: ${chatroomResponse.status}`);
      }
  
      const chatroomData = await chatroomResponse.json();
  
      if (chatroomData && chatroomData.members) {
        console.log("GroupChatPage: Found members:", chatroomData.members);
  
        // Step 2: Get access token for authenticated API calls
        const token = await getAccessToken();
        if (!token) {
          throw new Error("No access token found. Please log in.");
        }
  
        // Step 3: Fetch detailed user data for each member
        const memberPromises = chatroomData.members.map(async (member: any) => {
          try {
            const userResponse = await axios.get(
              `${API_BASE_URL}/api/users/${member.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
  
            if (userResponse.status === 200) {
              const profilePicture = userResponse.data.profilePicture || defaultAvatar;
              return {
                id: userResponse.data.id,
                username: userResponse.data.username,
                profilePicture: profilePicture,
                profilePictureSource: getAvatarSource(profilePicture),
                email: userResponse.data.email,
                // Add other fields as needed
              };
            } else {
              console.warn(`Failed to fetch user ${member.id}: ${userResponse.status}`);
              return {
                id: member.id,
                username: member.username || "Unknown",
                profilePicture: defaultAvatar,
              };
            }
          } catch (error) {
            console.error(`Error fetching user ${member.id}:`, error);
            return {
              id: member.id,
              username: member.username || "Unknown",
              profilePicture: defaultAvatar,
            };
          }
        });
  
        // Step 4: Wait for all user data to be fetched
        const detailedMembers = await Promise.all(memberPromises);
        setMembers(detailedMembers);
  
        // Update title and description from fetched data if available
        if (chatroomData.name) setTitle(chatroomData.name);
        if (chatroomData.description) setDescription(chatroomData.description);
      } else {
        console.warn("GroupChatPage: No members found or unexpected data format");
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching chatroom members:", error);
      Alert.alert("Error", "Failed to load group members. Please try again.");
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

  const HandleEditPress = () => {
    setEditTitle(title);
    setEditDescription(description);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Error", "Group name cannot be empty.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const token = await getAccessToken();
      
      if (!token) {
        Alert.alert("Authentication Error", "You need to be logged in to edit the group.");
        setIsSaving(false);
        return;
      }

      const updateData = {
        id: parseInt(roomId),
        name: editTitle,
        description: editDescription
      };
      
      console.log("Updating chatroom with data:", updateData);
      
      const response = await axios.put(
        `${API_BASE_URL}/api/Chatroom/${roomId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Update response:", response.data);
      
      if (response.status === 200 || response.status === 204) {
        // Update local state with new values
        setTitle(editTitle);
        setDescription(editDescription);
        setIsEditModalVisible(false);
        Alert.alert("Success", "Group information updated successfully");
      } else {
        Alert.alert("Warning", "Update may not have been saved correctly.");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          data: error.response?.data,
        });
        
        if (error.response?.status === 500) {
          Alert.alert("Server Error", "An internal server error occurred. Please try again later.");
        } else if (error.response?.status === 401) {
          Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
        } else if (error.response?.status === 403) {
          Alert.alert("Permission Denied", "You don't have permission to edit this group.");
        } else {
          Alert.alert("Error", `Failed to update group: ${error.response?.data?.message || error.message}`);
        }
      } else {
        Alert.alert("Network Error", "Could not connect to the server. Please check your internet connection.");
      }
    } finally {
      setIsSaving(false);
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
          <Image source={getAvatarSource(icon)} style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <Text style={styles.Memberstitle}>Members:</Text>
        <View style={styles.MembersCon}>
          {members.slice(0, 8).map((member: any, index: number) => (
            <View key={index} style={styles.MembersItem}>
              <Image source={member.profilePictureSource || getAvatarSource(member.profilePicture)} style={styles.icon} />
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
          <TouchableOpacity>
            <Text style={styles.InviteBtn}>Invite People</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.InviteBtn}>Share Group</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={HandleLeaveGroup}>
            <Text style={styles.LeaveBtn}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Edit Group Modal */}
      <Modal 
        visible={isEditModalVisible} 
        transparent 
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, darkMode && styles.darkModalTitle]}>
              Edit Group
            </Text>
            
            <Text style={[styles.modalLabel, darkMode && styles.darkModalLabel]}>Group Name</Text>
            <TextInput
              placeholder="Enter group name"
              placeholderTextColor={darkMode ? "#aaa" : "#999"}
              style={[styles.modalInput, darkMode && styles.darkModalInput]}
              value={editTitle}
              onChangeText={setEditTitle}
            />
            
            <Text style={[styles.modalLabel, darkMode && styles.darkModalLabel]}>Description</Text>
            <TextInput
              placeholder="Enter group description"
              placeholderTextColor={darkMode ? "#aaa" : "#999"}
              style={[styles.modalTextArea, darkMode && styles.darkModalInput]}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCancelButton}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveEdit} 
                style={[
                  styles.modalSaveButton,
                  isSaving && styles.modalSaveButtonDisabled
                ]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  Infoheader: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#cbcaca',
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f58814',
  },
  description: {
    fontSize: 14,
    color: '#595959',
    fontWeight: '300',
  },
  icon: {
    width: 70,
    height: 70,
    borderRadius: 50,
    marginBottom: 5,
  },
  edit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#595959',
  },
  MembersCon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    columnGap: 5,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: '#f0f0f0',
  },  
  Memberstitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1c',
    marginBottom: 10,
  },
  MembersItem: {
    width: '22%', // 4 items per row with some spacing
    aspectRatio: 1, // Make it square
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    fontSize: 17,
    fontWeight: '500',
  },
  ButtonCon: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    rowGap: 10,
    marginTop: 10,
  },
  LeaveBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#ff0000',
    borderRadius: 10,
  },
  InviteBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#2dffbf',
    borderRadius: 10,
  },
  
  // Modal styles (similar to SendAnnouncement modal)
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
    marginBottom: 20,
    color: "#000",
    height: 100,
    textAlignVertical: "top",
  },
  darkModalInput: {
    borderColor: "#555",
    color: "#fff",
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
  modalSaveButton: {
    padding: 10,
    backgroundColor: "#4A90E2",
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
