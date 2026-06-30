import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Ensure base URL always points to the '/api' sub-route
  if (envUrl && !envUrl.endsWith('/api') && !envUrl.endsWith('/api/')) {
    const baseUrlStripped = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${baseUrlStripped}/api`;
  }
  return envUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
