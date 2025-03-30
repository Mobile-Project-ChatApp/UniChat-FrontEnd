import React, { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { Stack, useRouter } from "expo-router";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { AuthProvider, AuthContext } from "../contexts/AuthContext";
import { ThemeProvider, ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from 'expo-status-bar';
import { View } from "react-native";

// Wrapper component to access the context values
function MainLayout() {
  const { user, setUser } = React.useContext(AuthContext);
  const { darkMode } = React.useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Apply the selected theme to the navigation
  const navigationTheme = darkMode ? DarkTheme : DefaultTheme;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null); // ensure welcome screen is shown if no user is found
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      console.log("Redirecting to WelcomeScreen");
      router.replace("/WelcomeScreen"); // Redirect to Welcome Screen when user is null
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: darkMode ? '#121212' : '#FFFFFF' }} />
    );
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ 
        headerShown: false,
        // Apply theme colors to stack navigator
        contentStyle: { 
          backgroundColor: darkMode ? '#121212' : '#FFFFFF' 
        }
      }}>
        {!user ? (
          <>
            <Stack.Screen name="WelcomeScreen" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
          </>
        ) : (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="Chatroom" />
          </>
          
        )}
      </Stack>
      <Toast />
    </NavigationThemeProvider>
  );
}

// Root component that provides all the context providers
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}