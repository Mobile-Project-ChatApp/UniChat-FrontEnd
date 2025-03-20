import axios from "axios";

const API_BASE_URL = "http://10.10.17.235";

const API_URL = `${API_BASE_URL}:5222/api/users`;

export const registerUser = async (username, email, passwordHash) => {
  return axios.post(`${API_URL}`, { username, email, passwordHash });
};

export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  const token = response.data.token;

  await AsyncStorage.setItem("authToken", token);
  return token;
};

export const fetchUserProfile = async () => {
  const token = await AsyncStorage.getItem("authToken");
  return axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
