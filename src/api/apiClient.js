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

// Bộ lọc chặn dữ liệu trả về từ Server
apiClient.interceptors.response.use(
    (response) => response, 
    async (error) => {
        const originalRequest = error.config;

        // 👉 FIX CHÍ MẠNG: Kiểm tra xem request bị lỗi có phải là luồng đăng nhập/đăng ký hay không
        const isAuthEndpoint = originalRequest.url.includes('/auth/login') || 
                               originalRequest.url.includes('/auth/google-login') || 
                               originalRequest.url.includes('/auth/facebook-login') ||
                               originalRequest.url.includes('/auth/register');

        // Chỉ cố gắng Refresh Token nếu lỗi 401 KHÔNG PHẢI xuất phát từ các trang đăng nhập/đăng ký
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true; // Đánh dấu đã thử refresh
            
            try {
                const oldRefreshToken = localStorage.getItem('refreshToken');
                if (!oldRefreshToken) throw new Error("Không tìm thấy khóa phụ");

                // Gọi API ngầm đổi token mới
                const res = await axios.post('http://localhost:5279/api/auth/refresh-token', {
                    refreshToken: oldRefreshToken
                });

                if (res.data.success) {
                    // ⚠️ ÔNG LƯU Ý: Check xem Backend trả về tên biến là 'token' hay 'accessToken' nhé.
                    // Tui tạm để đồng bộ theo kiểu code cũ của ông:
                    const newAccessToken = res.data.token || res.data.accessToken;
                    const newRefreshToken = res.data.refreshToken;

                    localStorage.setItem('token', newAccessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    // Đính kèm token mới vào request cũ và chạy lại
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Nếu cả RefreshToken cũng hỏng vĩnh viễn -> Sút user ra ngoài đăng nhập lại
                console.error("Phiên đăng nhập hết hạn vĩnh viễn:", refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // Trả lỗi về đúng file Component (.jsx) để xử lý hiện thông báo Toast Antd
        return Promise.reject(error);
    }
);

export default apiClient;