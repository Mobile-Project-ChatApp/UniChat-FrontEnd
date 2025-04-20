import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native'
import { AuthContext } from '@/contexts/AuthContext';

export default function GroupChatPage() {

  
  const { user } = useContext(AuthContext);
  const { roomId, icon, title }: any = useLocalSearchParams();
  const { darkMode } = useContext(ThemeContext);

  const HandleBackPress = () => {
    console.log("Back button pressed");
    router.back();
  }

  const HandleEditPress = () => {
    console.log("Edit button pressed");
  }

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={HandleBackPress}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style= {{fontWeight: 'bold'}}>Group Info</Text>
          <TouchableOpacity onPress={HandleEditPress}>
            <Text style= {{fontWeight: 'semibold'}}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.Infoheader}>
          <Image
            source={{ uri: icon }}
            style={styles.icon}
          />
          <Text style={styles.title}>{title}</Text>
        </View>
        
      </SafeAreaView>
    </View>
  )
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
  icon: {
    width: 70,
    height: 70,
    borderRadius: 50,
    marginBottom: 5,
  },
  edit: {
    fontSize: 13,
    fontWeight: 'semibold',
    color: '#527b4d',
    marginBottom: 10
  }
});
