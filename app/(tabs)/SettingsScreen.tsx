import React, { useState, useEffect, useContext } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, Switch, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { User, SettingItemProps, AppNavigationProp } from '../../types/types';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function SettingsScreen() {
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [language, setLanguage] = useState('English');
  const [languageCode, setLanguageCode] = useState('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { user: authUser, logout, deleteAccount } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  
  const navigation = useNavigation<AppNavigationProp>();

  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'hi', name: 'Hindi' },
  ];
  
  useEffect(() => {
    console.log('Current authUser:', authUser);
  }, [authUser]);

  const handleLogOut = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Load saved language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguageCode = await AsyncStorage.getItem('preferredLanguage');
        if (savedLanguageCode) {
          setLanguageCode(savedLanguageCode);
          // Find the language name for the saved code
          const languageItem = LANGUAGES.find(lang => lang.code === savedLanguageCode);
          if (languageItem) {
            setLanguage(languageItem.name);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    
    loadLanguagePreference();
  }, []);

  // Handle language selection
  const selectLanguage = async (code: string, name: string) => {
    try {
      await AsyncStorage.setItem('preferredLanguage', code);
      setLanguageCode(code);
      setLanguage(name);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error saving language preference:', error);
      Alert.alert('Error', 'Failed to save language preference.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Success', 'Your account has been deleted.');
            } catch (error) {
              if (error instanceof Error) {
                Alert.alert('Error', error.message || 'Failed to delete account.');
              } else {
                Alert.alert('Error', 'Failed to delete account.');
              }
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && authUser) {
        const updatedUser = { ...authUser, profilePicture: result.assets[0].uri };
        
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to update profile picture.");
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.header, darkMode && styles.darkText]}>Settings</Text>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage}>
            <Image 
              source={{ 
                uri: authUser?.profilePicture || "@/assets/images/avatar/default-avatar.jpeg" 
              }} 
              style={styles.profileImage} 
            />
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.username, darkMode && styles.darkText]}>
            {authUser?.username || "Guest"}
          </Text>
          <TouchableOpacity style={styles.editNameButton}>
            <Text style={styles.editNameText}>Edit Name</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Account</Text>
          <SettingItem
            title="Online Status"
            isToggle={true}
            isOn={onlineStatus}
            onPress={() => setOnlineStatus(!onlineStatus)}
            icon="radio-button-on"
            darkMode={darkMode}
          />
          <SettingItem
            title="Private Profile"
            isToggle={true}
            isOn={privateProfile}
            onPress={() => setPrivateProfile(!privateProfile)}
            icon="lock-closed"
            darkMode={darkMode}
          />
          <SettingItem
            title="Delete Account"
            onPress={handleDeleteAccount}
            icon="trash"
            darkMode={darkMode}
          />
        </View>

        <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Appearance</Text>
        <SettingItem
          title="Language"
          value={language}
          onPress={() => setShowLanguageModal(true)}
          icon="globe"
          darkMode={darkMode}
        />
        <SettingItem
          title="Dark Mode"
          isToggle={true}
          isOn={darkMode}
          onPress={toggleDarkMode}
          icon="contrast"
          darkMode={darkMode}
        />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, darkMode && styles.darkModalTitle]}>
              Select Language
            </Text>
            
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    languageCode === item.code && styles.selectedLanguageItem,
                    darkMode && styles.darkLanguageItem,
                  ]}
                  onPress={() => selectLanguage(item.code, item.name)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      languageCode === item.code && styles.selectedLanguageText,
                      darkMode && styles.darkText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {languageCode === item.code && (
                    <Ionicons name="checkmark" size={22} color={darkMode ? "#82B1FF" : "#4A90E2"} />
                  )}
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={[styles.closeButton, darkMode && styles.darkCloseButton]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[styles.closeButtonText, darkMode && styles.darkCloseButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  value, 
  onPress, 
  isToggle, 
  isOn, 
  icon, 
  darkMode 
}) => (
  <TouchableOpacity
    style={[styles.settingItem, darkMode && styles.darkSettingItem]}
    onPress={onPress}
    disabled={isToggle}
  >
    <View style={styles.settingLeft}>
      {icon && <Ionicons name={icon} size={24} color={darkMode ? "#82B1FF" : "#4A90E2"} style={styles.settingIcon} />}
      <Text style={[styles.settingTitle, darkMode && styles.darkText]}>{title}</Text>
    </View>
    <View style={styles.settingRight}>
      {isToggle ? (
        <Switch
          value={isOn}
          onValueChange={onPress}
          trackColor={{ false: '#cccccc', true: darkMode ? '#82B1FF' : '#4A90E2' }}
        />
      ) : (
        <>
          {value && <Text style={[styles.settingValue, darkMode && styles.darkTextSecondary]}>{value}</Text>}
          <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
        </>
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 15,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  darkTextSecondary: {
    color: '#aaa',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e1e1e1',
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
  darkSettingItem: {
    borderBottomColor: '#333',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  darkModalContent: {
    backgroundColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
    textAlign: 'center',
  },
  darkModalTitle: {
    color: '#fff',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkLanguageItem: {
    borderBottomColor: '#333',
  },
  selectedLanguageItem: {
    backgroundColor: '#f0f8ff',
  },
  languageText: {
    fontSize: 16,
    color: '#000',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  darkCloseButton: {
    backgroundColor: '#444',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  darkCloseButtonText: {
    color: '#fff',
  },
});