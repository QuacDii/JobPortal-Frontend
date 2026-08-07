import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Spin, Radio, Space } from 'antd';
import { 
    ArrowLeftOutlined, 
    LoadingOutlined, 
    PayCircleOutlined, 
    CheckCircleOutlined, 
    CloseCircleOutlined,
    CreditCardOutlined
} from '@ant-design/icons';
import paymentService from '../../services/paymentService';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const Wallet = () => {
    const [soTien, setSoTien] = useState(50000);
    const [paymentMethod, setPaymentMethod] = useState('vnpay'); // 'vnpay' hoặc 'momo'
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmingManual, setIsConfirmingManual] = useState(false);
    const [maUser, setMaUser] = useState(null);
    const isProcessingRef = useRef(false);
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

    // Polling kiểm tra trạng thái thanh toán
    useEffect(() => {
        let interval = null;
        if (isChecking && checkingOrderId && maUser) {
            isProcessingRef.current = false;

            interval = setInterval(async () => {
                if (isProcessingRef.current) return;

                try {
                    const res = await paymentService.checkStatus(checkingOrderId, maUser);
                    const isPaid = res?.data?.isPaid || res?.isPaid;

                    if (isPaid && !isProcessingRef.current) {
                        isProcessingRef.current = true;
                        clearInterval(interval);

                        setIsChecking(false);
                        setIsModalOpen(false);
                        
                        // 🌟 BỎ TOAST TẠI ĐÂY -> Chỉ điều hướng duy nhất
                        localStorage.setItem('payment_redirect', window.location.pathname);
                        navigate(`/payment-success?orderId=${checkingOrderId}`);
                    }
                } catch (err) {
                    console.error("Lỗi kiểm tra trạng thái:", err);
                }
            }, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isChecking, checkingOrderId, maUser, navigate]);

    const extractOrderId = (url) => {
        try {
            const urlObj = new URL(url);
            const vnpTxnRef = urlObj.searchParams.get('vnp_TxnRef');
            if (vnpTxnRef) return vnpTxnRef;

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
        isProcessingRef.current = false; // 🌟 Reset cờ khóa

        try {
            if (paymentMethod === 'vnpay') {
                const response = await paymentService.createVnPayUrl(maUser, Number(soTien));
                const url = response?.paymentUrl || response?.url || response?.data?.paymentUrl || response?.data?.url || response?.data;
                if (url && typeof url === 'string' && url.startsWith('http')) {
                    localStorage.setItem('payment_redirect', window.location.pathname);
                    window.location.href = url;
                }
            } else {
                const response = await paymentService.createPaymentUrl(maUser, Number(soTien));
                const url = response?.paymentUrl || response?.url || response?.data?.paymentUrl || response?.data?.url || response?.data;
                if (url && typeof url === 'string' && url.startsWith('http')) {
                    const orderId = extractOrderId(url);
                    localStorage.setItem('payment_redirect', window.location.pathname);
                    setPayUrl(url);
                    setCheckingOrderId(orderId);
                    setIsModalOpen(true);
                    setIsChecking(true);
                }
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo giao dịch!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualConfirm = async (resultCode = '0') => {
        if (isProcessingRef.current) return;
        
        // 🌟 KHÓA LẬP TỨC & DỪNG POLLING
        isProcessingRef.current = true;
        setIsChecking(false);

        setIsConfirmingManual(true);
        localStorage.setItem('payment_redirect', window.location.pathname);

        try {
            if (resultCode === '0') {
                await paymentService.confirmFallback({
                    maUser: maUser,
                    amount: Number(soTien),
                    orderId: checkingOrderId,
                    resultCode: '0'
                });
                setIsModalOpen(false);
                navigate(`/payment-success?orderId=${checkingOrderId}`);
            } else {
                setIsModalOpen(false);
                navigate(`/payment-failed?orderId=${checkingOrderId}`);
            }
        } catch (err) {
            console.error("Lỗi xác nhận giả lập:", err);
            toast.error("Thao tác thất bại, vui lòng thử lại!");
            isProcessingRef.current = false;
        } finally {
            setIsConfirmingManual(false);
        }
    };
    if (maUser === null) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang xác thực thông tin...</div>;
    }

    const isVnPay = paymentMethod === 'vnpay';
    const primaryColor = isVnPay ? '#005baa' : '#A50064';

    return (
        <div style={{ maxWidth: '440px', margin: '50px auto', padding: '25px', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employer/dashboard')} style={{ marginBottom: '15px', padding: 0 }}>
                Quay lại Bảng điều khiển
            </Button>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: primaryColor, margin: '0 0 10px 0' }}>Ví Điện Tử TKVL</h2>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Hỗ trợ thanh toán qua VNPay & MoMo</p>
            </div>
            
            <form onSubmit={handleNapTien}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#333' }}>Chọn cổng thanh toán:</label>
                    <Radio.Group 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ width: '100%' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Radio.Button value="vnpay" style={{ width: '100%', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                <CreditCardOutlined style={{ color: '#005baa', marginRight: 8 }} /> Thanh toán qua VNPay (ATM / QR)
                            </Radio.Button>
                            <Radio.Button value="momo" style={{ width: '100%', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                <PayCircleOutlined style={{ color: '#A50064', marginRight: 8 }} /> Thanh toán qua Ví MoMo
                            </Radio.Button>
                        </Space>
                    </Radio.Group>
                </div>

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
                        background: (isLoading || isChecking) ? '#ccc' : primaryColor, 
                        color: 'white', border: 'none', borderRadius: '6px', 
                        cursor: (isLoading || isChecking) ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold', fontSize: '16px'
                    }}>
                    {isLoading ? 'Đang tạo giao dịch...' : `NẠP TIỀN BẰNG ${isVnPay ? 'VNPAY' : 'MOMO'}`}
                </button>
            </form>

            <Modal
                title={<span style={{ color: primaryColor, fontSize: '18px' }}><PayCircleOutlined /> Thanh toán qua {isVnPay ? 'VNPay' : 'MoMo'} (Sandbox)</span>}
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setIsChecking(false); }}
                footer={null}
                centered
            >
                <div style={{ textAlign: 'center', padding: '15px 0' }}>
                    <p style={{ fontSize: '15px', color: '#333' }}>
                        Đơn nạp tiền <b>#{checkingOrderId}</b> đã sẵn sàng. Vui lòng nhấn mở trang thanh toán hoặc chọn kết quả giả lập bên dưới:
                    </p>
                    
                    <a 
                        href={payUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block', width: '100%', padding: '12px 0',
                            backgroundColor: primaryColor, color: '#fff', fontWeight: 'bold',
                            fontSize: '15px', borderRadius: '6px', textAlign: 'center',
                            textDecoration: 'none', margin: '5px 0 15px 0'
                        }}
                    >
                        MỞ TRANG THANH TOÁN {isVnPay ? 'VNPAY' : 'MOMO'}
                    </a>

                    <div style={{ padding: '10px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '6px', marginBottom: '15px' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: '#d48806', marginRight: '8px' }} spin />} />
                        <span style={{ color: '#d48806', fontWeight: '500', fontSize: '13px' }}>
                            Đang tự động lắng nghe kết quả giao dịch...
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <Button 
                            danger
                            type="default"
                            icon={<CloseCircleOutlined />}
                            loading={isConfirmingManual}
                            onClick={() => handleManualConfirm('1006')}
                            style={{ flex: 1, height: '42px', fontWeight: 'bold', fontSize: '14px' }}
                        >
                            ❌ Giả lập Thất bại
                        </Button>
                        <Button 
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={isConfirmingManual}
                            onClick={() => handleManualConfirm('0')}
                            style={{ 
                                flex: 1, height: '42px', backgroundColor: '#52c41a', 
                                borderColor: '#52c41a', fontWeight: 'bold', fontSize: '14px' 
                            }}
                        >
                            ✔️ Giả lập Thành công
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Wallet;