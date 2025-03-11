import React, { useState } from 'react'
import { Text, View, StyleSheet, Image, TouchableOpacity, Switch, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

export default function SettingsScreen() {
  const [name, setName] = useState('Toshi')
  const [avatar, setAvatar] = useState('https://pbs.twimg.com/profile_images/1878018568199036928/rQEIyiM-_400x400.jpg')
  const [onlineStatus, setOnlineStatus] = useState(true)
  const [privateProfile, setPrivateProfile] = useState(false)
  const [language, setLanguage] = useState('English')
  const [darkMode, setDarkMode] = useState(false)

  const languages = ['English', 'Finnish', 'Dutch', 'Spanish', 'German']

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      setAvatar(result.assets[0].uri)
    }
  }

  interface SettingItemProps {
    title: string;
    value?: string;
    onPress: () => void;
    isToggle?: boolean;
    isOn?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
  }

  const SettingItem: React.FC<SettingItemProps> = ({ title, value, onPress, isToggle, isOn, icon }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={isToggle}
    >
      <View style={styles.settingLeft}>
        {icon && <Ionicons name={icon} size={24} color="#4A90E2" style={styles.settingIcon} />}
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        {isToggle ? (
          <Switch 
            value={isOn} 
            onValueChange={onPress}
            trackColor={{ false: "#cccccc", true: "#4A90E2" }}
          />
        ) : (
          <>
            {value && <Text style={styles.settingValue}>{value}</Text>}
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage}>
            <Image source={{ uri: avatar }} style={styles.profileImage} />
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{name}</Text>
          <TouchableOpacity style={styles.editNameButton}>
            <Text style={styles.editNameText}>Edit Name</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem 
            title="Online Status" 
            isToggle={true} 
            isOn={onlineStatus} 
            onPress={() => setOnlineStatus(!onlineStatus)}
            icon="radio-button-on"
          />
          <SettingItem 
            title="Private Profile" 
            isToggle={true} 
            isOn={privateProfile} 
            onPress={() => setPrivateProfile(!privateProfile)}
            icon="lock-closed"
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <SettingItem 
            title="Language" 
            value={language} 
            onPress={() => {/* Show language picker */}}
            icon="globe"
          />
          <SettingItem 
            title="Dark Mode" 
            isToggle={true} 
            isOn={darkMode} 
            onPress={() => setDarkMode(!darkMode)}
            icon="contrast"
          />
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingItem 
            title="Privacy Policy" 
            onPress={() => {/* Navigate to privacy policy */}}
            icon="shield-checkmark"
          />
          <SettingItem 
            title="Terms of Service" 
            onPress={() => {/* Navigate to terms */}}
            icon="document-text"
          />
          <SettingItem 
            title="App Version" 
            value="1.0.0" 
            onPress={() => {/* Do nothing */}}
            icon="information-circle"
          />
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  editNameButton: {
    marginTop: 5,
  },
  editNameText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    color: '#666',
    marginRight: 5,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginVertical: 30,
    paddingVertical: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});