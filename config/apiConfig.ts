import { Platform } from "react-native";

const getLocalIp = () => {
  return "192.168.0.104"; // Replace with your local IP address if needed

};

const getApiUrl = () => {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return `http://${getLocalIp()}:5222`;
  } else {
    return "http://localhost:5222";
  }
};

const DEV_API_URL = getApiUrl();
const PROD_API_URL = "https://unichat-api.example.com";
export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// export const API_BASE_URL = "https://b45f-85-131-120-201.ngrok-free.app";

console.log(`Configured API_BASE_URL: ${API_BASE_URL}`);
