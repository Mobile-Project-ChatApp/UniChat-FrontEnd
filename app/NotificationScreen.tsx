import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import NotificationCard from "../components/NotificationCard";
import { ThemeContext } from "../contexts/ThemeContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import ModalBase from "react-native-modal";
import { MaterialIcons } from "@expo/vector-icons";

const filters = ["All", "Mentioned", "Unread", "Announcements"];

export default function NotificationScreen() {
  const { darkMode } = useContext(ThemeContext);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<
    string | null
  >(null);
  const { notifications, setNotifications } = useContext(NotificationContext);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setModalVisible(false);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setModalVisible(false);
  }, []);

  const openModal = useCallback((id: string) => {
    setActiveNotificationId(id);
    setModalVisible(true);
  }, []);

  const closeModal = () => {
    setModalVisible(false);
    setActiveNotificationId(null);
  };

  const filteredNotifications = notifications
    .filter((n) => {
      switch (selectedFilter) {
        case "Mentioned":
          return n.type === "mention";
        case "Announcements":
          return n.type === "announcement";
        case "Unread":
          return !n.read;
        default:
          return true;
      }
    })
    .sort((a, b) => Number(a.read) - Number(b.read));

  const activeNotification = notifications.find(
    (n) => n.id === activeNotificationId
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, darkMode && styles.darkText]}>
          Notifications
        </Text>
        <TouchableOpacity onPress={() => setActionModalVisible(true)}>
          <View
            style={[
              styles.threeDotIcon,
              { backgroundColor: darkMode ? "#333" : "#eee" },
            ]}
          >
            <MaterialIcons
              name="more-horiz"
              size={24}
              color={darkMode ? "#eee" : "#333"}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.scrollContainer}>
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter
                  ? styles.filterButtonActive
                  : darkMode
                  ? styles.darkFilterButton
                  : styles.filterButton,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter
                    ? styles.filterButtonTextActive
                    : darkMode
                    ? styles.darkFilterButtonText
                    : styles.filterButtonText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              darkMode={darkMode}
              type={item.type as any}
              content={item.content}
              read={item.read}
              onMarkRead={() => handleMarkRead(item.id)}
              onDelete={() => handleDelete(item.id)}
              onMorePress={() => openModal(item.id)}
            />
          )}
        />
      </View>

      {modalVisible && activeNotification && (
        <ModalBase
          isVisible={modalVisible}
          onBackdropPress={closeModal}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, darkMode && styles.darkModal]}>
            {!activeNotification.read && (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleMarkRead(activeNotification.id)}
              >
                <MaterialIcons
                  name="done"
                  size={20}
                  color={darkMode ? "#fff" : "#000"}
                />
                <Text style={[styles.modalText, darkMode && styles.darkText]}>
                  Mark as Read
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleDelete(activeNotification.id)}
            >
              <MaterialIcons name="delete" size={20} color="#FF3B30" />
              <Text style={[styles.modalText, { color: "#FF3B30" }]}>
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ModalBase>
      )}

      {/* Modal for 'Mark as all read' */}
      {actionModalVisible && (
        <ModalBase
          isVisible={actionModalVisible}
          onBackdropPress={() => setActionModalVisible(false)}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, darkMode && styles.darkModal]}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, read: true }))
                );
                setActionModalVisible(false);
              }}
            >
              <MaterialIcons
                name="done-all"
                size={20}
                color={darkMode ? "#fff" : "#000"}
              />
              <Text style={[styles.modalText, darkMode && styles.darkText]}>
                Mark All as Read
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ModalBase>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  contentWrapper: {
    marginTop: 35,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    //marginHorizontal: 20,
    marginTop: 35,
    marginBottom: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 15,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
  threeDotIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
    columnGap: 6,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  darkFilterButton: {
    backgroundColor: "#333",
  },
  filterButtonActive: {
    backgroundColor: "#4A90E2",
  },
  filterButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  darkFilterButtonText: {
    color: "#ccc",
  },
  filterButtonTextActive: {
    color: "white",
    fontWeight: "500",
  },

  modalContainer: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  darkModal: {
    backgroundColor: "#2a2a2a",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  modalText: {
    fontSize: 16,
    color: "#000",
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#eee",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
