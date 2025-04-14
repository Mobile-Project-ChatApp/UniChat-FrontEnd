import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { AppNotification } from "@/types/types";
//import { fetchNotificationsByUser } from "@/api/notificationApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";
import { sampleNotifications } from "@/hardcodedData/notifications";

type NotificationContextType = {
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  hasUnread: boolean;
};

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  setNotifications: () => {},
  hasUnread: false,
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const hasInitialized = useRef(false);

  const hasUnread = notifications.some((n) => !n.read);

  // temp for testing without API
  useEffect(() => {
    if (user) {
      setNotifications(sampleNotifications);
    }
  }, [user]);

  // useEffect(() => {
  //   const loadNotifications = async () => {
  //     try {
  //       const token = await AsyncStorage.getItem("accessToken");
  //       if (token && user) {
  //         const result = await fetchNotificationsByUser(token);
  //         setNotifications(result.data);
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch notifications", error);
  //     }
  //   };

  //   if (user) {
  //     loadNotifications();
  //   }
  // }, [user]);

  return (
    <NotificationContext.Provider
      value={{ notifications, setNotifications, hasUnread }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
