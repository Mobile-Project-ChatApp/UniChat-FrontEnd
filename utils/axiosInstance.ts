import axios, { AxiosInstance } from "axios";
import { Platform } from 'react-native';
import { API_BASE_URL } from "../config/apiConfig"; // Import API_BASE_URL

// Log the selected base URL for debugging
console.log(`Using API base URL: ${API_BASE_URL}`);

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, // Use imported API_BASE_URL
  withCredentials: true,
  timeout: 20000, // Increased timeout to 20 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor for better error handling
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`Sending request to: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`Response received: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error("Request timeout. Server might be down or unreachable.");
    } else if (error.response) {
      console.error(`Server responded with status: ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
      console.error("Request details:", {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      console.error("Error setting up request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;