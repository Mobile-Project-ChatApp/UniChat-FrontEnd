import { NavigatorScreenParams } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, RouteProp } from "@react-navigation/native";

// Type for User
export interface User {
  id: number;
  username: string;
  email: string;
  profilePicture: string;
  createdAt: string;
  isAdmin?: boolean;
  status?: string;
  darkMode?: boolean;
}

// Type for GroupChat
export interface GroupChat {
  id: number;
  title: string;
  icon: string;
  members: string[];
  messages: string[];
  createdAt: string;
  admin: string;
}

// Type for notification
export type NotificationType = "invite" | "kick" | "mention" | "announcement";
export interface AppNotification {
  id: string;
  type: NotificationType;
  content: string;
  read: boolean;
  targetGroupId?: number;
  groupName?: string;
}

// Type for SettingItem props
export interface SettingItemProps {
  title: string;
  value?: string;
  onPress: () => void;
  isToggle?: boolean;
  isOn?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  darkMode?: boolean;
}

// Define your root navigation param list
export type RootStackParamList = {
  Login: undefined;
  Settings: undefined;
  Home: undefined;
};

export type AppNavigationProp = NavigationProp<RootStackParamList>;
