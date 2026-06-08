import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:5279/api', 
    headers: { 'Content-Type': 'application/json' }
});

// Gửi kèm AccessToken vào header của mọi request
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;  
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
    (response) => response, 
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Hết hạn token) và request này chưa từng thử refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Đánh dấu đã thử thách thức refresh
            
            try {
                const oldRefreshToken = localStorage.getItem('refreshToken');
                if (!oldRefreshToken) throw new Error("Không tìm thấy khóa phụ");

                // Gọi API ngầm đổi token mới
                const res = await axios.post('http://localhost:5279/api/auth/refresh-token', {
                    refreshToken: oldRefreshToken
                });

                if (res.data.success) {
                    // Lưu cặp mã mới vào máy
                    localStorage.setItem('token', res.data.accessToken);
                    localStorage.setItem('refreshToken', res.data.refreshToken);

                    // Đính kèm token mới vào request cũ và chạy lại
                    originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Nếu cả RefreshToken cũng hết hạn vĩnh viễn -> Xóa sạch và sút user ra màn login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;