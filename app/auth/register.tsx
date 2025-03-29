import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { showToast } from "@/utils/showToast";
import { AuthContext } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { ThemeContext } from '../../contexts/ThemeContext';
import { createThemedStyles } from '../../assets/ThemeStyle';

export const useTheme = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const styles = createThemedStyles(darkMode);
  
  return { darkMode, toggleDarkMode, styles };
};

export default function Register() {
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      showToast("error", "Missing Fields", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await register({ username, email, password });
    } catch (error) {
      console.error("Register error:", error);
      showToast(
        "error",
        "Unexpected Error",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      //router.replace("/auth/login");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4A69BD"
          style={{ marginTop: 20 }}
        />
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            (!username || !email || !password) && styles.disabledButton,
          ]}
          disabled={!username || !email || !password}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomTextContainer}>
        <Text style={styles.signInText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={styles.signInLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },

  label: {
    color: "#333",
    alignSelf: "flex-start",
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },

  button: {
    backgroundColor: "#f2f9d9",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },

  disabledButton: {
    backgroundColor: "#f2f9d9", // Greyed out when disabled
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  bottomTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  signInText: {
    fontSize: 14,
    color: "#333",
  },

  signInLink: {
    color: "#4A69BD",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
