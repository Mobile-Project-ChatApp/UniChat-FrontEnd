import axios, { AxiosInstance } from "axios";
import { Platform } from 'react-native';

// Get the appropriate base URL based on platform
const getBaseUrl = () => {
  console.log(`Platform: ${Platform.OS}`); // Debug log
  
  if (Platform.OS === 'android') {
    console.log('Using Android configuration');
    // For Android emulator or physical device, use your actual computer's IP address
    return "http://192.168.1.104:5222"; // Replace with your computer's IP address
  } else if (Platform.OS === 'ios') {
    console.log('Using iOS configuration');
    // For iOS simulators, use your computer's IP address instead of localhost
    return "http://192.168.1.104:5222"; // Replace with your computer's IP address
  } else {
    console.log('Using web configuration');
    // Web or fallback
    return "http://localhost:5222";
  }
};

// Log the selected base URL for debugging
const baseUrl = getBaseUrl();
console.log(`Selected base URL: ${baseUrl}`);

const axiosInstance: AxiosInstance = axios.create({
  baseURL: baseUrl,
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
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
    } else {
      console.error("Error setting up request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;