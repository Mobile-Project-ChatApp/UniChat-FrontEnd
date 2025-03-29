import React, { useState, useEffect, useContext } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { User, SettingItemProps, AppNavigationProp } from '../../types/types';
import { navigateToLogin } from '../../services/navigationHelper';
import { AuthContext } from '../../contexts/AuthContext';


export default function SettingsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [language, setLanguage] = useState('English');
  const { logout, deleteAccount } = useContext(AuthContext);

  const navigation = useNavigation<AppNavigationProp>();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        console.log('User data from AsyncStorage:', userData); // Debug log
        
        if (userData) {
          const parsedData = JSON.parse(userData);
          console.log('Parsed user data:', parsedData); // Debug log
          setUser(parsedData);
          setDarkMode(parsedData.darkMode || false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !darkMode;
      setDarkMode(newDarkMode);
      
      // Update user object
      if (user) {
        const updatedUser = { ...user, darkMode: newDarkMode };
        setUser(updatedUser);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        console.log('Dark mode updated:', newDarkMode); // Debug log
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };

  const handleLogOut = async () => {
    try {
      logout(); // Call the context method
    } catch (error) {
      console.error('Error logging out:', error);
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

      if (!result.canceled && user) {
        const updatedUser = { ...user, profilePicture: result.assets[0].uri };
        setUser(updatedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };
  
  // Debug log
  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.header, darkMode && styles.darkText]}>Settings</Text>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage}>
            <Image 
              source={{ 
                uri: user?.profilePicture || 'https://example.com/default-avatar.jpg' 
              }} 
              style={styles.profileImage} 
            />
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.username, darkMode && styles.darkText]}>
            {user?.username || 'User'}
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
            onPress={() => {
              /* Show language picker */
              Alert.alert('Language', 'Language selection coming soon!');
            }}
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
    backgroundColor: '#e1e1e1', // Placeholder color
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
});