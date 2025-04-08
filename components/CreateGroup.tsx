import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { showToast } from "@/utils/showToast";
import { createGroupChat } from "@/services/chatroomApi";

export default function CreateGroup({
  visible,
  onClose,
  onGroupCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: { id: string; name: string; description: string }) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName || !groupDescription) {
      showToast("error", "Missing Fields", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const newGroup = await createGroupChat({ name: groupName, description: groupDescription });
      showToast("success", "Group Created", "Your group chat has been created.");
      onGroupCreated(newGroup); // Pass the new group to the parent component
      setGroupDescription("");
      setGroupName("");
    } catch (error) {
      console.error("Error creating group:", error);
      showToast("error", "Error", "Failed to create group. Please try again.");
      setGroupDescription("");
      setGroupName("");
    } finally {
      setLoading(false);
      setGroupDescription("");
      setGroupName("");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Create Group</Text>

          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TextInput
            style={styles.input}
            placeholder="Group Description"
            value={groupDescription}
            onChangeText={setGroupDescription}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateGroup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  createButton: {
    backgroundColor: "#4A90E2",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});