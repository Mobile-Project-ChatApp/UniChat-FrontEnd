import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CreateAnnouncementModal from './CreateAnnouncementModal';

interface AnnouncementButtonProps {
  chatRoomId: number;
  isAdmin: boolean;
  onAnnouncementCreated?: () => void;
  darkMode?: boolean;
}

const AnnouncementButton: React.FC<AnnouncementButtonProps> = ({ 
  chatRoomId, 
  isAdmin, 
  onAnnouncementCreated,
  darkMode = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    if (isAdmin) {
      setModalVisible(true);
    }
  };

  const handleSuccess = () => {
    if (onAnnouncementCreated) {
      onAnnouncementCreated();
    }
  };

  // Don't render anything if user is not an admin
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.button, darkMode && styles.darkButton]} 
        onPress={handlePress}
        accessibilityLabel="Create announcement"
      >
        <Ionicons 
          name="megaphone-outline" 
          size={20} 
          color={darkMode ? "#82B1FF" : "#4A90E2"} 
        />
        <Text style={[styles.buttonText, darkMode && styles.darkButtonText]}>
          Announcement
        </Text>
      </TouchableOpacity>
      
      <CreateAnnouncementModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        chatRoomId={chatRoomId}
        onSuccess={handleSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  darkButton: {
    backgroundColor: '#263238',
  },
  buttonText: {
    marginLeft: 5,
    color: '#4A90E2',
    fontWeight: '500',
  },
  darkButtonText: {
    color: '#82B1FF',
  },
});

export default AnnouncementButton;