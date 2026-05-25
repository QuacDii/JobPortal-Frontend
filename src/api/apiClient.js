import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://localhost:5279/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Tự động đính kèm JWT Token vào header của mọi request nếu có
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;