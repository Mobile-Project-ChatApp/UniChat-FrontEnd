import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = 'http://192.168.1.104';
const API_URL = `${API_BASE_URL}:5222/api/users`;

export const registerUser = async (username, email, passwordHash) => {
  try {
    console.log(`Attempting to register: ${username}, ${email}`);
    console.log(`Full request URL: ${API_URL}`);
    console.log('Request data:', { username, email, passwordHash });
    
    const response = await axios.post(
      `${API_URL}`, 
      { username, email, passwordHash },
      { 
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Registration successful:', response.data);
    return response;
  } catch (error) {
    console.error('Registration error type:', error.constructor.name);
    console.error('Registration error message:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log('Error response data:', error.response.data);
      console.log('Error response status:', error.response.status);
      console.log('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received. Request details:', 
        JSON.stringify(error.request, null, 2).substring(0, 500) + '...');
    } else {
      // Something happened in setting up the request
      console.log('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log(`Attempting to login: ${email}`);
    console.log(`Login URL: ${API_URL}/login`);
    
    const response = await axios.post(`${API_URL}/login`, { email, password });
    console.log('Login successful');
    const token = response.data.token;
    await AsyncStorage.setItem("authToken", token);
    return token;
  } catch (error) {
    console.error('Login error type:', error.constructor.name);
    console.error('Login error message:', error.message);
    
    if (error.response) {
      console.log('Error response data:', error.response.data);
      console.log('Error response status:', error.response.status);
    }
    throw error;
  }
};

export const fetchUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }
    console.log('Fetching user profile');
    const response = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Profile fetch successful');
    return response;
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    if (error.response) {
      console.log('Error response data:', error.response.data);
      console.log('Error response status:', error.response.status);
    }
    throw error;
  }
};

// Test connection function to debug connectivity issues
export const testConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('Connection successful!', response.data);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error.message);
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
    console.error('Failed to update API base URL:', error.message);
    return false;
  }
};