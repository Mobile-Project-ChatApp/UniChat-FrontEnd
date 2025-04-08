import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { showToast } from "@/utils/showToast";
import { resetPassword } from "@/services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      showToast("error", "Missing Email", "Please enter your email address.");
      return;
    }
    console.log("Submitting reset for:", email, password); // Debugging line

    try {
      setLoading(true);
      await resetPassword(email, password);
      showToast("success", "Password reset successfully. ", "Please log in.");
      router.replace("/auth/login");
    } catch (error) {
      console.error("Reset error:", error);
      showToast("error", "Error", "Failed to send reset link.");
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
        <Text style={styles.title}>Forgot Password 🔐</Text>
        <Text style={styles.subtitle}>
          Enter your email to reset your password.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your new password"
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
            style={[styles.button, !email && styles.disabledButton]}
            disabled={!email || !password}
            onPress={handleReset}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.replace("/auth/login")}
          style={styles.backToLogin}
        >
          <Text style={styles.clickText}>← Back to Login</Text>
        </TouchableOpacity>
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
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
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

  backToLogin: {
    marginTop: 20,
    alignItems: "center",
  },

  clickText: {
    color: "#4A69BD",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
