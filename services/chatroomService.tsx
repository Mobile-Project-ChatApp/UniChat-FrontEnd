import axios from "axios";

import { API_BASE_URL } from "../config/apiConfig"; // Import API_BASE_URL

export const fetchChatRooms = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/chatroom`);
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