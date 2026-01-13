import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
    (config) => {
        let token = localStorage.getItem('token');
        if (token) {
            // Remove any invalid characters (newlines, carriage returns, etc.)
            token = token.trim().replace(/[\r\n]/g, '');
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Errors (especially 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: Logout on 401
        if (error.response && error.response.status === 401) {
            // localStorage.removeItem('token');
            // window.location.href = '/login'; // Or use a cleaner way to redirect
        }
        return Promise.reject(error);
    }
);

export default api;
