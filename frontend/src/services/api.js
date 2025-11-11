import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  getUserProfile: (id) => api.get(`/users/profile/${id}`),
  getLeaderboard: (limit = 50) => api.get(`/users/leaderboard?limit=${limit}`),
};

// Game API
export const gameAPI = {
  createGame: (data) => api.post('/games', data),
  getAvailableGames: () => api.get('/games'),
  getGame: (id) => api.get(`/games/${id}`),
  joinGame: (id) => api.post(`/games/${id}/join`),
  leaveGame: (id) => api.delete(`/games/${id}/leave`),
};

export default api;
