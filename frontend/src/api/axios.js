import axios from "axios";

// Normalize the base URL to prevent trailing slashes and ensure proper fallbacks
const rawBaseURL = import.meta.env.VITE_API_URL;
export const API_BASE_URL = (rawBaseURL ? rawBaseURL.replace(/\/+$/, "") : "") || "http://localhost:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
