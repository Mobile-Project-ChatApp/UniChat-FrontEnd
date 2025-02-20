import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import React from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.input} 
        placeholder="Search" 
        placeholderTextColor="gray"
        autoCapitalize="none"
      />
      
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    input: {

        padding: 12,
        fontSize: 16,
        color: 'black',
        backgroundColor: 'lightgray',
        width: '90%',
        borderRadius: 25,
    },
})
