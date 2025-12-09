import axios from 'axios';
import conf from '../config/config';
import { toastService } from '../services/toastService';

// In-memory token
let currentAccessToken = null;

// Load token from localStorage on app start
export const loadToken = () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    currentAccessToken = token;
  }
};

loadToken();

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

let checkBackendStatus = null;
export const setupAxiosInterceptors = (callback) => {
  checkBackendStatus = callback;
};

const api = axios.create({
  baseURL: conf.baseUrl,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — always use currentAccessToken
api.interceptors.request.use(
  (config) => {
    if (currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (response.data?.accessToken) {
      currentAccessToken = response.data.accessToken;
      localStorage.setItem('accessToken', currentAccessToken); // Keep in sync
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      if (checkBackendStatus) await checkBackendStatus();
      toastService.error('No internet or server is down');
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${conf.baseUrl}/api/refresh-token`, {}, {
          withCredentials: true
        });

        if (!data.accessToken) throw new Error("No token");

        currentAccessToken = data.accessToken;
        localStorage.setItem('accessToken', currentAccessToken); // Sync
        processQueue(null, currentAccessToken);
        originalRequest.headers.Authorization = `Bearer ${currentAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        currentAccessToken = null;
        localStorage.removeItem('accessToken');
        toastService.error('Session expired. Logging out...');
        setTimeout(() => window.location.href = '/login', 1000);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const msg = error.response?.data?.message || 'Request failed';
    if (!originalRequest.url?.includes('/health')) {
      toastService.error(msg);
    }

    return Promise.reject(error);
  }
);

export default api;