import axiosInstance from "@/utils/axiosInstance";

// Get all chatrooms the user is a member of
export const fetchUserChatrooms = async () => {
  const response = await axiosInstance.get('/api/chatroom/user');
  return response.data;
};

// Get all announcements for a specific chatroom
export const fetchChatroomAnnouncements = async (chatroomId) => {
  const response = await axiosInstance.get(`/api/Announcement/chatroom/${chatroomId}`);
  return response.data;
};

// Get important announcements for a specific chatroom
export const fetchChatroomImportantAnnouncements = async (chatroomId) => {
  const response = await axiosInstance.get(`/api/Announcement/chatroom/${chatroomId}/important`);
  return response.data;
};

// Get recent announcements for a specific chatroom
export const fetchChatroomRecentAnnouncements = async (chatroomId) => {
  const response = await axiosInstance.get(`/api/Announcement/chatroom/${chatroomId}/recent`);
  return response.data;
};

// Fetch all announcements from all user's chatrooms
export const fetchAllAnnouncements = async () => {
  // First get all user's chatrooms
  const chatrooms = await fetchUserChatrooms();
  
  // Then fetch announcements for each chatroom
  const announcementPromises = chatrooms.map(chatroom => 
    fetchChatroomAnnouncements(chatroom.id)
  );
  
  // Wait for all requests to complete
  const announcementsArrays = await Promise.all(announcementPromises);
  
  // Flatten the array of arrays into a single array
  const allAnnouncements = announcementsArrays.flat();
  
  // Sort by date (newest first)
  return allAnnouncements.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
};

// Fetch all important announcements from all user's chatrooms
export const fetchImportantAnnouncements = async () => {
  const chatrooms = await fetchUserChatrooms();
  const announcementPromises = chatrooms.map(chatroom => 
    fetchChatroomImportantAnnouncements(chatroom.id)
  );
  const announcementsArrays = await Promise.all(announcementPromises);
  const allAnnouncements = announcementsArrays.flat();
  return allAnnouncements.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
};

// Fetch all recent announcements from all user's chatrooms
export const fetchRecentAnnouncements = async (days = 7) => {
  const chatrooms = await fetchUserChatrooms();
  const announcementPromises = chatrooms.map(chatroom => 
    fetchChatroomRecentAnnouncements(chatroom.id)
  );
  const announcementsArrays = await Promise.all(announcementPromises);
  const allAnnouncements = announcementsArrays.flat();
  return allAnnouncements.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
};