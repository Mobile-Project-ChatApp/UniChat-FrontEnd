import axios from "axios";

const API_BASE_URL = "http://192.168.0.101:5222/api";

export const fetchChatRooms = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/chatroom`);
        return response.data;
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        throw error;
    }
};