import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/apiConfig";

let connection: signalR.HubConnection | null = null;

export const initializeSignalRConnection = async (): Promise<signalR.HubConnection> => {
  if (connection) {
    // Close existing connection if it's in a failed state
    if (connection.state === "Disconnected" || connection.state === "Disconnecting") {
      try {
        await connection.stop();
        connection = null;
      } catch (err) {
        console.log("Error stopping previous connection:", err);
      }
    } else {
      return connection; // Return existing valid connection
    }
  }

  // Get fresh token
  const token = await AsyncStorage.getItem("accessToken");
  
  if (!token) {
    console.error("No access token available for SignalR connection");
    throw new Error("Authentication required");
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/chatHub`, {
      accessTokenFactory: () => token,
      transport: signalR.HttpTransportType.WebSockets,
      skipNegotiation: false,
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: retryContext => {
        if (retryContext.previousRetryCount < 3) {
          return 2000; // First few retries happen quickly
        }
        return 5000; // Later retries are slower
      }
    })
    .build();

  // Add global error handler
  connection.onclose(async (error) => {
    console.log("SignalR connection closed", error);
    
    if (error && error.message.includes("401")) {
      console.log("Authentication failure, attempting to refresh token...");
      
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) return;
        
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken })
        });
        
        if (response.ok) {
          const data = await response.json();
          await AsyncStorage.setItem("accessToken", data.accessToken);
          console.log("Token refreshed successfully");
          
          // Try reconnecting with new token
          await initializeSignalRConnection();
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Redirect to login or show authentication error
      }
    }
  });

  try {
    await connection.start();
    console.log("SignalR Connected successfully");
    return connection;
  } catch (err) {
    connection = null;
    console.error("SignalR Connection failed:", err);
    throw err;
  }
};

export const getSignalRConnection = (): signalR.HubConnection | null => {
  return connection;
};

export const stopSignalRConnection = async (): Promise<void> => {
  if (connection) {
    try {
      // Remove all listeners
      connection.off("ReceiveMessage");
      connection.off("UserJoined");
      connection.off("UserLeft");
      
      // Stop the connection
      await connection.stop();
      console.log("SignalR connection stopped.");
      connection = null;
    } catch (error) {
      console.error("Error stopping SignalR connection:", error);
      connection = null;
    }
  }
};

export const ensureConnected = async (): Promise<signalR.HubConnection> => {
  let conn = getSignalRConnection();
  
  if (!conn) {
    conn = await initializeSignalRConnection();
  }
  
  if (conn.state !== "Connected") {
    await conn.start();
  }
  
  return conn;
};