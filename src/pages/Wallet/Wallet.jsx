import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Spin } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined, PayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import paymentService from '../../services/paymentService';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const Wallet = () => {
    const [soTien, setSoTien] = useState(50000);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmingManual, setIsConfirmingManual] = useState(false);
    const [maUser, setMaUser] = useState(null);
    
    const [payUrl, setPayUrl] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkingOrderId, setCheckingOrderId] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!token) {
            toast.error("Vui lòng đăng nhập để sử dụng Ví điện tử!");
            navigate('/login');
            return;
        }
        try {
            const decodedToken = jwtDecode(token);
            const userId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
                        || decodedToken.nameid 
                        || decodedToken.sub;
            if (userId) setMaUser(parseInt(userId, 10));
        } catch (error) {
            console.error("Lỗi giải mã token:", error);
            navigate('/login');
        }
    }, [navigate]);

    // Polling hỏi trạng thái tự động (nếu Sandbox MoMo hoạt động bình thường)
    useEffect(() => {
        let interval = null;
        if (isChecking && checkingOrderId && maUser) {
            interval = setInterval(async () => {
                try {
                    const res = await paymentService.checkStatus(checkingOrderId, maUser);
                    if (res?.data?.isPaid || res?.isPaid) {
                        toast.success(`Nạp tiền thành công cho đơn hàng #${checkingOrderId}!`);
                        setIsChecking(false);
                        setIsModalOpen(false);
                        setTimeout(() => window.location.reload(), 1000);
                    }
                } catch (err) {
                    console.error("Lỗi kiểm tra trạng thái:", err);
                }
            }, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isChecking, checkingOrderId, maUser]);

    const extractOrderId = (url) => {
        try {
            const urlObj = new URL(url);
            const tParam = urlObj.searchParams.get('t');
            if (tParam) {
                const decoded = atob(tParam);
                const parts = decoded.split('|');
                if (parts.length >= 2) return parts[1];
            }
        } catch (e) {
            console.error("Lỗi bóc tách orderId:", e);
        }
        return Date.now().toString();
    };

    const handleNapTien = async (e) => {
        e.preventDefault();
        if (!maUser) return toast.error("Đang tải thông tin người dùng!");
        if (Number(soTien) < 10000) return toast.warning("Tối thiểu 10.000đ");

        setIsLoading(true);
        try {
            const response = await paymentService.createPaymentUrl(maUser, Number(soTien));
            const url = response?.url || response?.data?.url || response?.data;

            if (url && typeof url === 'string' && url.startsWith('http')) {
                const orderId = extractOrderId(url);
                setPayUrl(url);
                setCheckingOrderId(orderId);
                setIsModalOpen(true);
                setIsChecking(true);
            } else {
                toast.error("Không nhận được liên kết thanh toán từ MoMo!");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo giao dịch!");
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý xác nhận thủ công khi MoMo Sandbox bị treo
    const handleManualConfirm = async () => {
        setIsConfirmingManual(true);
        try {
            await paymentService.confirmFallback({
                maUser: maUser,
                amount: Number(soTien),
                orderId: checkingOrderId,
                resultCode: '0'
            });
            toast.success(`Giao dịch #${checkingOrderId} đã được xác nhận thành công!`);
            setIsModalOpen(false);
            setIsChecking(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error("Lỗi xác nhận thủ công:", err);
            toast.error("Xác nhận thất bại, vui lòng thử lại!");
        } finally {
            setIsConfirmingManual(false);
        }
    };

    if (maUser === null) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang xác thực thông tin...</div>;

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '25px', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employer/dashboard')} style={{ marginBottom: '15px', padding: 0 }}>
                Quay lại
            </Button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#D82D8B', margin: '0 0 10px 0' }}>Ví Điện Tử TKVL</h2>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Hệ thống thanh toán qua MoMo Sandbox</p>
            </div>
            
            <form onSubmit={handleNapTien}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#333' }}>Số tiền cần nạp (VNĐ):</label>
                    <input 
                        type="number" 
                        value={soTien} 
                        onChange={(e) => setSoTien(e.target.value)} 
                        min="10000" step="10000" 
                        disabled={isLoading || isChecking} 
                        required 
                        style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '6px', fontSize: '16px' }}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading || isChecking}
                    style={{ 
                        width: '100%', padding: '14px', 
                        background: (isLoading || isChecking) ? '#ccc' : '#A50064', 
                        color: 'white', border: 'none', borderRadius: '6px', 
                        cursor: (isLoading || isChecking) ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold', fontSize: '16px'
                    }}>
                    {isLoading ? 'Đang tạo giao dịch...' : 'NẠP TIỀN BẰNG MOMO'}
                </button>
            </form>

            <Modal
                title={<span style={{ color: '#A50064', fontSize: '18px' }}><PayCircleOutlined /> Kích hoạt thanh toán MoMo</span>}
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setIsChecking(false); }}
                footer={null}
                centered
            >
                <div style={{ textAlign: 'center', padding: '15px 0' }}>
                    <p style={{ fontSize: '15px', color: '#333' }}>
                        Giao dịch <b>#{checkingOrderId}</b> đã sẵn sàng. Vui lòng nhấn nút bên dưới để mở cổng MoMo:
                    </p>
                    
                    <a 
                        href={payUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block', width: '100%', padding: '14px 0',
                            backgroundColor: '#A50064', color: '#fff', fontWeight: 'bold',
                            fontSize: '16px', borderRadius: '6px', textAlign: 'center',
                            textDecoration: 'none', margin: '10px 0 20px 0'
                        }}
                    >
                        MỞ TRANG THANH TOÁN MOMO
                    </a>

                    <div style={{ padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '6px', marginBottom: '15px' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 18, color: '#d48806', marginRight: '8px' }} spin />} />
                        <span style={{ color: '#d48806', fontWeight: '500', fontSize: '13px' }}>
                            Đang tự động lắng nghe kết quả từ MoMo...
                        </span>
                    </div>

                    {/* NÚT XÁC NHẬN THỦ CÔNG KHI MOMO SANDBOX BỊ TREO */}
                    <Button 
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={isConfirmingManual}
                        onClick={handleManualConfirm}
                        style={{ 
                            width: '100%', height: '45px', backgroundColor: '#52c41a', 
                            borderColor: '#52c41a', fontWeight: 'bold', fontSize: '15px' 
                        }}
                    >
                        Tôi đã nhập OTP trên MoMo (Xác nhận ngay)
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Wallet;