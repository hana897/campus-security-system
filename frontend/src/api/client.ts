import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request Interceptor: Attach security auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('soc_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Uniform error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error.response?.status === 401 && !String(error.config?.url || '').includes('/auth/login/')) {
      localStorage.removeItem('soc_token');
      window.dispatchEvent(new Event('scsams:unauthorized'));
    }
    const customError = {
      message: error.response?.data?.message || error.response?.data?.error || 'Security service did not respond. Check terminal connection.',
      status: error.response?.status || 500,
    };
    return Promise.reject(customError);
  }
);
