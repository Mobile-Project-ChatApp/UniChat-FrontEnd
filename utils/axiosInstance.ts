import axios, { AxiosInstance } from "axios";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: "http://10.10.17.235:5222",
  withCredentials: true,
  // ensures cookies (like your JWT) are included in requests — required for HttpOnly cookie-based authentication
});

export default axiosInstance;
