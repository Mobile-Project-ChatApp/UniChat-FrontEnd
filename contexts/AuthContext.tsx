import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import User from "../types/Users"; // Import User interface
import users from "../hardcodedData/users";

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (username: string) => Promise<void>;
  register: (username: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        console.log("Loaded user from AsyncStorage:", storedUser);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };
    loadUser();
  }, []);

  const login = async (username: string) => {
    const foundUser = users.find((u) => u.username === username);
    if (foundUser) {
      console.log("Logging in user:", foundUser);
      setUser(foundUser);
      await AsyncStorage.setItem("user", JSON.stringify(foundUser));
      router.replace("/(tabs)");
    } else {
      alert("User not found!");
    }
  };

  const register = async (username: string) => {
    const newUser: User = {
      username,
      avatar: require("../assets/images/avatar/default-avatar.jpeg"),
    };
    users.push(newUser);
    await login(username);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
    router.replace("/WelcomeScreen");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
