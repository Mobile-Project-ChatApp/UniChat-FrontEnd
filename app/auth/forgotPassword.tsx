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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your new password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <MaterialIcons
            name={showPassword ? "visibility-off" : "visibility"}
            size={22}
            color="#ccc"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeIcon}
        >
          <MaterialIcons
            name={showConfirmPassword ? "visibility-off" : "visibility"}
            size={22}
            color="#ccc"
          />
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

  passwordContainer: { position: "relative", marginBottom: 15 },

  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -20 }],
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
