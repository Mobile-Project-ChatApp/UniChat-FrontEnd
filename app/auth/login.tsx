import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { showToast } from "@/utils/showToast";
import { useRouter } from "expo-router";
import { AuthContext } from "../../contexts/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast(
        "error",
        "Missing Fields",
        "Please enter both email and password."
      );
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (error) {
      console.error("Login error:", error);
      showToast(
        "error",
        "Login failed",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back 👋</Text>

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

        <View style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPassword}>Forgot your password?</Text>
          <TouchableOpacity onPress={() => router.push("/auth/forgotPassword")}>
            <Text style={styles.clickText}>Click here</Text>
          </TouchableOpacity>
        </View>

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
              (!email || !password) && styles.disabledButton,
            ]}
            disabled={!email || !password}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomTextContainer}>
          <Text style={styles.subText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={styles.clickText}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },

  label: {
    color: "#333",
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },

  forgotPasswordContainer: {
    flexDirection: "row",
    marginBottom: 20,
    //justifyContent: "flex-end",
  },

  forgotPassword: {
    fontSize: 14,
    color: "#333",
    //fontWeight: "600",
  },

  button: {
    backgroundColor: "#f2f9d9",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#f2f9d9",
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

  subText: {
    fontSize: 14,
    color: "#333",
  },

  clickText: {
    color: "#4A69BD",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
