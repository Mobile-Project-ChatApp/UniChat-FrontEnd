import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:5/api/users";

export const registerUser = async (username, email, passwordHash) => {
  return axios.post(`${API_URL}/register`, { username, email, passwordHash });
};

// Login user and store JWT token
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  const token = response.data.token;

  // Store token in AsyncStorage for future authentication
  await AsyncStorage.setItem("authToken", token);
  return token;
};

export const fetchUsers = async () => {
  const token = await AsyncStorage.getItem("authToken");

  return axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchUserById = async (id) => {
  const token = await AsyncStorage.getItem("authToken");

  return axios.get(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUser = async (id, username, email, passwordHash) => {
  const token = await AsyncStorage.getItem("authToken");

  return axios.put(
    `${API_URL}/${id}`,
    { username, email, passwordHash },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

export const deleteUser = async (id) => {
  const token = await AsyncStorage.getItem("authToken");

  return axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
