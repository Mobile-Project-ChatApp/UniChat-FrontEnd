import GroupChat from '@/types/GroupChat'
import User from '@/types/Users'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import React from 'react'
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function Chat({title, icon}: GroupChat) {

  const EnterChat = () => {
    console.warn('Enter the chat', title)
    router.push({
      pathname: "/Chatroom/Chatroom",
      params: { title, icon }, // Passing the title as a parameter
    });
  }
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={EnterChat}
      activeOpacity={0.7}
    >
      <View style={styles.chatHeader}>
        <View style={styles.userContainer}>
          <View style={styles.iconWrapper}>
            <Image source={{uri: icon}} style={styles.icon} />
            <View style={styles.statusIndicator}></View>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>Toshi: Hello lads</Text>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>1:00 PM</Text>
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>2</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconWrapper: {
        position: 'relative',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    textContainer: {
        flex: 1,
    },
    icon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "#fff",
    },
    statusIndicator: {
        position: 'absolute',
        width: 12,
        height: 12,
        backgroundColor: '#4CD964',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
        bottom: 0,
        right: 0,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#222',
        marginBottom: 4
    },
    message: {
        color: '#666',
        fontSize: 14
    },
    timeContainer: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 50,
    },
    timeText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8
    },
    unreadBadge: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    unreadText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold'
    }
})