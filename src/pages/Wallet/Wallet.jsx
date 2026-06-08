import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import paymentService from '../../services/paymentService';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode'; // Import thư viện giải mã

const Wallet = () => {
    const [soTien, setSoTien] = useState(50000);
    const [isLoading, setIsLoading] = useState(false);
    const [maUser, setMaUser] = useState(null);
    const navigate = useNavigate();

    // Hook này chạy ngay khi vào trang, để kiểm tra xem User đã đăng nhập chưa
    useEffect(() => {
        // Lấy token do AuthController cấp từ localStorage 
        // (Tùy bạn lưu tên là 'token' hay 'accessToken' lúc code trang Login)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

        if (!token) {
            toast.error("Vui lòng đăng nhập để sử dụng Ví điện tử!");
            navigate('/login'); // Chưa đăng nhập thì đá về trang Login
            return;
        }

        try {
            // Giải mã Token để lấy thông tin User
            const decodedToken = jwtDecode(token);
            
            // Trong ASP.NET Core, ClaimTypes.NameIdentifier thường được map thành key này:
            // "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" 
            // hoặc "nameid" hoặc "sub"
            const userId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
                        || decodedToken.nameid 
                        || decodedToken.sub;

            if (userId) {
                setMaUser(parseInt(userId, 10)); // Lưu mã User vào State để dùng
            } else {
                throw new Error("Không tìm thấy định danh người dùng trong Token");
            }
        } catch (error) {
            console.error("Lỗi giải mã token:", error);
            toast.error("Phiên đăng nhập bị lỗi, vui lòng đăng nhập lại!");
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            navigate('/login');
        }
    }, [navigate]);

    // Hàm gọi API tạo QR / URL Thanh toán
    const handleNapTien = async (e) => {
        e.preventDefault();
        
        if (!maUser) {
            toast.error("Đang tải thông tin người dùng, vui lòng thử lại sau!");
            return;
        }

        if (soTien < 10000) {
            toast.warning("Số tiền nạp tối thiểu là 10.000đ");
            return;
        }

        setIsLoading(true);
        try {
            const response = await paymentService.createPaymentUrl(maUser, soTien);
            if (response && response.url) {
                // LƯU VẾT: Ghi nhớ rằng user đang đứng ở trang Wallet
                localStorage.setItem('payment_redirect', '/employer/wallet');

                toast.info("Đang chuyển hướng đến cổng thanh toán MoMo...");
                window.location.href = response.url;
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo giao dịch!");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Nếu chưa lấy được maUser (đang check token) thì hiện Loading mờ
    if (maUser === null) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang xác thực thông tin...</div>;
    }

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '25px', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <Button 
                type="link" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/employer/dashboard')}
                style={{ marginBottom: '15px', padding: 0 }}
            >
                Quay lại
            </Button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#D82D8B', margin: '0 0 10px 0' }}>Ví Điện Tử TKVL</h2>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Hệ thống thanh toán qua MoMo Sandbox</p>
            </div>
            
            <form onSubmit={handleNapTien}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#333' }}>
                        Số tiền cần nạp (VNĐ):
                    </label>
                    <input 
                        type="number" 
                        value={soTien} 
                        onChange={(e) => setSoTien(e.target.value)} 
                        min="10000"
                        step="10000"
                        required 
                        style={{ 
                            width: '100%', padding: '12px', boxSizing: 'border-box',
                            border: '1px solid #ccc', borderRadius: '6px', fontSize: '16px' 
                        }}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ 
                        width: '100%', padding: '14px', background: isLoading ? '#ccc' : '#A50064', 
                        color: 'white', border: 'none', borderRadius: '6px', 
                        cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold',
                        fontSize: '16px', transition: 'background 0.3s'
                    }}>
                    {isLoading ? 'Đang tạo giao dịch...' : 'NẠP TIỀN BẰNG MOMO'}
                </button>
            </form>
        </div>
    );
};

export default Wallet;