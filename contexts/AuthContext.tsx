import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "@/utils/showToast";
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

  const isValidEmail = (email: string) => {
    return email.endsWith("@oamk.fi") || email.endsWith("@fontys.nl");
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
    if (!isValidEmail(email)) {
      showToast(
        "error",
        "Invalid Email",
        "Email must be an OAMK or Fontys email."
      );
      router.replace("/WelcomeScreen");
      return;
    }

    if (password.length < 8) {
      showToast(
        "error",
        "Weak Password",
        "Password must be at least 8 characters."
      );
      router.replace("/WelcomeScreen");
      return;
    }

    try {
      await registerUser(username, email, password); // Call backend API
      showToast("success", "Registration successful!", "You can now log in.");
      router.replace("/auth/login"); // Redirect to login page
    } catch (error: any) {
      console.error("Registration failed:", error);
      showToast(
        "error",
        "Registration failed",
        error.response?.data.message || "Please try again."
      );
      router.replace("/WelcomeScreen");
    }
  };

  const login = async (email: string, password: string) => {
    if (!isValidEmail(email)) {
      showToast(
        "error",
        "Invalid Email",
        "Email must be an OAMK or Fontys email."
      );
      router.replace("/WelcomeScreen");
      return;
    }

    try {
      const token = await loginUser(email, password); // API call
      const response = await fetchUserProfile(); // Fetch user details
      setUser(response.data);
      showToast("success", "Login successful!", "Welcome back 👋");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login failed:", error);
      showToast("error", "Login failed", "Incorrect email or password.");
      router.replace("/WelcomeScreen");
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
