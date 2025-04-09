
import axiosInstance from "@/utils/axiosInstance";


const API_URL_CHAT = "/api";

export const fetchChatRooms = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL_CHAT}/chatroom`);
        return response.data;
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        throw error;
    }
};

export const createGroupChat = async (data: { name: string; description: string }) => {
  const response = await axiosInstance.post(`${API_URL_CHAT}/chatroom`, data);
  return response.data;
};