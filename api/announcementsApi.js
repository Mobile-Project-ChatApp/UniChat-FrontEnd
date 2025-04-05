import axiosInstance from "@/utils/axiosInstance";

const API_URL = "/api/announcements";

export const fetchAllAnnouncements = async () => {
  const response = await axiosInstance.get(`${API_URL}`);
  return response.data;
};

export const fetchImportantAnnouncements = async () => {
  const response = await axiosInstance.get(`${API_URL}/important`);
  return response.data;
};

export const fetchRecentAnnouncements = async (days = 7) => {
  const response = await axiosInstance.get(`${API_URL}/recent?days=${days}`);
  return response.data;
};

// Update this endpoint to match your AnnouncementsController
export const createAnnouncement = async (chatRoomId, announcementData) => {
  const response = await axiosInstance.post(
    `${API_URL}/chatroom/${chatRoomId}`, 
    announcementData
  );
  return response.data;
};

// Optional: Add endpoint to fetch announcements for a specific chat room
export const fetchChatRoomAnnouncements = async (chatRoomId) => {
  const response = await axiosInstance.get(`${API_URL}/chatroom/${chatRoomId}`);
  return response.data;
};