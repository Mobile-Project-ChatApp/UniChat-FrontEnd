import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AuthContext } from '@/contexts/AuthContext';

export default function GroupChatPage() {
  const { user } = useContext(AuthContext);
  const { roomId, icon, title, members, description }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);

  const defaultAvatar = 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4867.jpg'; 

  // Deserialize members
  const parsedMembers = members ? JSON.parse(members) : [];

  const HandleBackPress = () => {
    console.log("Back button pressed");
    router.back();
  };

  const HandleEditPress = () => {
    console.log("Edit button pressed");
    console.log("Group ID:", roomId);
    console.log("Group Icon:", icon);
    console.log("Group Title:", title);
    console.log("Members:", parsedMembers);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={HandleBackPress}>
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
          
        {parsedMembers.slice(0, 8).map((member: any, index: number) => (
          <View key={index} style={styles.MembersItem}>
            <Image source={{ uri: member.avatar || defaultAvatar }} style={styles.icon} />
            <Text>{member.username}</Text>
          </View>
        ))}
        {parsedMembers.length > 8 && (
          <View style={styles.MembersItem}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>...</Text>
          </View>
        )}

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
  // MembersCon: {
  //   flexDirection: 'row',
  //   alignItems: 'flex-start',
  //   columnGap: 10,
  //   backgroundColor: 'lightblue',
  //   padding: 10,
  // },
  MembersCon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
    padding: 10,
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
    color: '#595959',
  },
  
});
