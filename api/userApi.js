import axios from "axios";

const API_BASE_URL = "http://10.10.17.235";

const API_URL = `${API_BASE_URL}:5222/api/users`;

export const registerUser = async (username, email, passwordHash) => {
  return axios.post(`${API_URL}`, { username, email, passwordHash });
};
