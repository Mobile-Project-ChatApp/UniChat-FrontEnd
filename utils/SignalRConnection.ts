import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/apiConfig";

let connection: signalR.HubConnection | null = null;

export const initializeSignalRConnection = async (): Promise<signalR.HubConnection> => {
  if (connection) {
    return connection; // Return the existing connection if already initialized
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/chatHub`, {
      accessTokenFactory: async () => {
        const token = await AsyncStorage.getItem("accessToken");
        return token || "";
      },
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  connection.onclose((error) => {
    if (error) {
      console.error("SignalR connection closed due to error:", error.message);
    } else {
      console.log("SignalR connection closed gracefully.");
    }
  });

  try {
    await connection.start();
    console.log("SignalR Connected.");
  } catch (err) {
    console.error("SignalR Connection Error:", err);
  }

  return connection;
};

export const getSignalRConnection = (): signalR.HubConnection | null => {
  return connection;
};

export const stopSignalRConnection = async (): Promise<void> => {
  if (connection) {
    await connection.stop();
    console.log("SignalR connection stopped.");
    connection = null;
  }
};