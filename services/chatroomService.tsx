import axios from "axios";

const API_BASE_URL = "http://145.85.233.182:5222/api";

export const fetchChatRooms = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/chatroom`);
        return response.data;
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        throw error;
    }
};

export const createGroupChat = async (data: { name: string; description: string }) => {
  const response = await axios.post(`${API_BASE_URL}/chatroom`, data);
  return response.data;
};