import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useRouter } from "expo-router";
import { AuthContext } from "../../contexts/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>

      <Text style={styles.subText}>
        Don't have an account yet?{" "}
        <TouchableOpacity onPress={() => router.push("/auth/register")}>
          <Text style={styles.signUpText}>Register</Text>
        </TouchableOpacity>
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.rowContainer}>
        <View style={styles.checkboxContainer}>
          <BouncyCheckbox
            isChecked={keepLoggedIn}
            onPress={() => setKeepLoggedIn(!keepLoggedIn)}
            fillColor="#4A69BD"
            text="Keep me logged in"
            textStyle={{ color: "#333", textDecorationLine: "none" }}
            size={16}
          />
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/forgotPassword")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        style={[styles.button, (!email || !password) && styles.disabledButton]}
        disabled={!email || !password}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
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

  subText: {
    color: "#333",
    fontSize: 14,
    marginBottom: 20,
  },

  signUpText: {
    color: "#4A69BD",
    fontWeight: "bold",
    textDecorationLine: "underline",
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

  rowContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },

  checkboxContainer: {
    flexDirection: "row",
    //alignItems: "center",
    flex: 1,
  },

  forgotPassword: {
    color: "#4A69BD",
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "right",
    flexShrink: 1,
  },

  button: {
    backgroundColor: "#f2f9d9",
    padding: 14,
    borderRadius: 8,
    width: "100%",
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
});
