import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getSignalRConnection } from "../utils/SignalRConnection"

import { API_BASE_URL } from '@/config/apiConfig';


export default function GroupChatPage() {
  const router = useRouter();
  const { roomId, icon, title, description }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);

  const defaultAvatar = 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4867.jpg'; 



  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // // Deserialize members
  // const parsedMembers = members ? JSON.parse(members) : [];
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
      } else {
        console.warn("GroupChatPage: No members found or unexpected data format");
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

  const HandleEditPress = () => {
    console.log("Edit pressed");
  }

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
              <Image source={{ uri: member.avatar || defaultAvatar }} style={styles.icon} />
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

  ButtonCon : {
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

  
});
