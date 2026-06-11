import axios, { AxiosError } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const TOKEN_STORAGE_KEY = 'business_nexus_token';

const api = axios.create({
  baseURL: `${API_URL}/api`
});

// Attach the JWT to every request when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize backend errors into Error objects with a readable message
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the server. Is the backend running?'
        : error.message);
    return Promise.reject(new Error(message));
  }
);

export default api;
