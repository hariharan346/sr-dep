import axios from 'axios';
 
// In production: frontend + backend on same domain, Nginx routes /api/*
// In dev: Vite proxies /api to localhost:5000 (configured in vite.config.js below)
const api = axios.create({
  baseURL: '/api',          // <- Changed from 'http://localhost:5000/api'
  withCredentials: false,
  timeout: 10000,
});
 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
 
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
 
export default api;
