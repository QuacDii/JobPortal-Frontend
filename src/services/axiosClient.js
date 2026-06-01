import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5279/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.response.use(
    (response) => {
        return response.data; 
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient;