import axiosInstance from "@/utils/axiosInstance";

//import { API_BASE_URL } from "@env";

const API_URL_REG = "/api/users";
const API_URL_LOG = "/auth";

export const registerUser = async (username, email, passwordHash) => {
  console.log("registerUser call:", {
    username,
    email,
    passwordHash,
  });
  return axiosInstance.post(`${API_URL_REG}`, {
    username,
    email,
    passwordHash,
  });
};

export const verifyEmailCode = async (email, code) => {
  return axiosInstance.post(`${API_URL}/verify-email`, { email, code });
};

export const loginUser = async (email, password) => {
  const response = await axiosInstance.post(`${API_URL_LOG}/login`, {
    email,
    password,
  });

  const { accessToken, refreshToken } = response.data;
  //console.log("loginUser response:", response.data);
  return {
    refreshToken,
    accessToken,
  };
};

export const refreshToken = async (token) => {
  const response = await axiosInstance.post(`${API_URL_LOG}/refresh`, {
    refreshToken: token,
  });
  return response.data.refreshToken;
};

export const fetchUserProfile = async () => {
  return axiosInstance.get(`${API_URL_LOG}/profile`);
};

// Test connection function to debug connectivity issues
export const testConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    console.log("Connection successful!", response.data);
    return true;
  } catch (error) {
    console.error("Connection test failed:", error.message);
    return false;
  }
};

// Dynamic API configuration function - can be used to update API base URL at runtime
export const updateApiBaseUrl = async (newBaseUrl) => {
  try {
    console.log(`Updating API base URL to: ${newBaseUrl}`);
    // Here you could also save this to AsyncStorage for persistence
    // await AsyncStorage.setItem("apiBaseUrl", newBaseUrl);
    return true;
  } catch (error) {
    console.error("Failed to update API base URL:", error.message);
    return false;
  }
};
