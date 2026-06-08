import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    
    // State chứa link điều hướng động
    const [returnUrl, setReturnUrl] = useState('/employer/wallet');
    const [btnText, setBtnText] = useState('Quay lại Ví');

    useEffect(() => {
        // Đọc lại mảnh bánh mì đã lưu
        const prevPath = localStorage.getItem('payment_redirect');
        if (prevPath) {
            setReturnUrl(prevPath);
            if (prevPath.includes('service-package')) {
                setBtnText('Tiếp tục mua gói dịch vụ');
            }
            // Đọc xong thì dọn dẹp bộ nhớ
            localStorage.removeItem('payment_redirect');
        }
    }, []);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1 style={{ color: 'green' }}>🎉 Nạp Tiền Thành Công!</h1>
            <p>Mã giao dịch: <strong>{orderId}</strong></p>
            <p>Số dư ví của bạn đã được cập nhật an toàn trong hệ thống.</p>
            <Link to={returnUrl} style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: '#1890ff', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                {btnText}
            </Link>
        </div>
    );
};

export default PaymentSuccess;