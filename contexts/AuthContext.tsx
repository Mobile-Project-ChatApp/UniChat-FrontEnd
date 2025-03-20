import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { registerUser, loginUser, fetchUserProfile } from "../api/userApi";
import User from "../types/Users";

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<void>;
  register: (newUser: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
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
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log("Current user:", user);
  }, [user]);

  useEffect(() => {
    // Auto-login if token exists
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        try {
          const response = await fetchUserProfile();
          setUser(response.data);
        } catch (error) {
          console.error("Failed to load user:", error);
          await AsyncStorage.removeItem("authToken");
        }
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const token = await loginUser(email, password); // API call
      const response = await fetchUserProfile(); // Fetch user details
      setUser(response.data);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login failed:", error);
      alert(error.response?.data.message || "Login failed.");
    }
  };

  // Register a new user
  const register = async ({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }) => {
    if (password.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    try {
      await registerUser(username, email, password); // Call backend API
      alert("Registration successful! Please log in.");
      router.replace("/auth/login"); // Redirect to login page
    } catch (error: any) {
      console.error("Registration failed:", error);
      alert(error.response?.data.message || "Registration failed.");
    }
  };

  // Logout the user
  const logout = async () => {
    await AsyncStorage.removeItem("authToken");
    setUser(null);
    router.replace("/WelcomeScreen");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
