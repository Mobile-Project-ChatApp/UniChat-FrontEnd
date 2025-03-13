import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
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

  const login = async (email: string, password: string) => {
    if (users.length === 0) {
      alert("No users found! Please register.");
      return;
    }

    const foundUser = users.find((u: User) => u.email === email);

    if (!foundUser) {
      alert("User not found!");
      return;
    }

    const passwordHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );

    if (foundUser.passwordHash !== passwordHash) {
      alert("Incorrect password!");
      return;
    }

    setUser(foundUser);
    router.replace("/(tabs)");
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

    const passwordHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );

    const newUser: User = {
      username,
      email,
      passwordHash,
      profilePicture: require("../assets/images/avatar/default-avatar.jpeg"),
      createdAt: new Date().toISOString(),
    };

    if (users.some((u) => u.email === email)) {
      alert("Email already exists! Please login.");
      return;
    }

    setUsers([...users, newUser]);
    alert("Registration successful! Please log in.");
    router.replace("/auth/login");
  };

  // Logout the user
  const logout = async () => {
    setUser(null);
    router.replace("/WelcomeScreen");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
