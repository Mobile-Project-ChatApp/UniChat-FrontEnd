import GroupChat from '@/types/GroupChat'
import User from '@/types/Users'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

export default function Chat({title, icon}: GroupChat) {
  return (

    <View style={styles.container}>
        <View style={styles.userContainer}>
            <Image source={{uri: icon}} style={styles.icon} />
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>Toshi: Hello lads</Text>
          </View>
            
            
        </View>
        <View style={styles.timeContainer}>
          <Text>1:00 PM</Text>

        </View>
        
    </View>
    
  )
}


const styles = StyleSheet.create({
    container : {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: 'lightgray',
        borderBottomWidth: 1,
        borderColor: 'gray',
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    icon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16
    },
    message: {
      color: 'gray',
      fontSize: 12
    },
    timeContainer: {
      flexDirection: 'column',      
    }
})