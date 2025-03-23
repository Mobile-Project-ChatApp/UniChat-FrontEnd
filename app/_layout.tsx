import React, { useContext, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { Stack, useRouter } from "expo-router";
import { AuthProvider, AuthContext } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        console.log("Stored User in AsyncStorage:", storedUser);
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
      router.replace("/WelcomeScreen"); //Redirect to Welcome Screen when user is null
    }
  }, [user, loading]);

  if (loading) return null;

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="WelcomeScreen" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
          </>
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
      <Toast />
    </AuthProvider>
  );
}

//Wrap the entire app inside `AuthProvider`
// export default function Layout() {
//   return (
//     <AuthProvider>
//       <RootLayout />
//     </AuthProvider>
//   );
// }
