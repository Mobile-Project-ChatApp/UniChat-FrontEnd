import React, { useState, useContext } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Switch,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';
import { createAnnouncement } from '../api/announcementsApi';

interface CreateAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  chatRoomId: number;
  onSuccess?: () => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ 
  visible, 
  onClose, 
  chatRoomId,
  onSuccess 
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [important, setImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImportant(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const announcementData = {
        title,
        content,
        important
      };

      await createAnnouncement(chatRoomId, announcementData);
      
      // Reset form and close modal
      resetForm();
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to create announcement:', err);
      setError('Failed to create announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={[
          styles.modalView,
          darkMode && styles.darkModalView
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[
              styles.modalTitle,
              darkMode && styles.darkText
            ]}>New Announcement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={darkMode ? "#FFFFFF" : "#000000"} 
              />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={[
            styles.inputLabel,
            darkMode && styles.darkText
          ]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              darkMode && styles.darkInput
            ]}
            placeholder="Announcement title"
            placeholderTextColor={darkMode ? "#888" : "#999"}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[
            styles.inputLabel,
            darkMode && styles.darkText
          ]}>Content</Text>
          <TextInput
            style={[
              styles.textArea,
              darkMode && styles.darkInput
            ]}
            placeholder="Write your announcement here..."
            placeholderTextColor={darkMode ? "#888" : "#999"}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <View style={styles.switchContainer}>
            <Text style={[
              styles.switchLabel,
              darkMode && styles.darkText
            ]}>Mark as Important</Text>
            <Switch
              value={important}
              onValueChange={setImportant}
              trackColor={{ false: "#767577", true: "#4A90E2" }}
              thumbColor={Platform.OS === 'ios' ? undefined : important ? "#FFFFFF" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Post Announcement</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModalView: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  darkInput: {
    borderColor: '#444',
    color: '#FFFFFF',
    backgroundColor: '#2a2a2a',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    height: 120,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#90CAF9',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAnnouncementModal;