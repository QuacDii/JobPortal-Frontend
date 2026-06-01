import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1 style={{ color: 'green' }}>🎉 Nạp Tiền Thành Công!</h1>
            <p>Mã giao dịch: <strong>{orderId}</strong></p>
            <p>Số dư ví của bạn đã được cập nhật an toàn trong hệ thống.</p>
            <Link to="/wallet" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                Quay lại Ví
            </Link>
        </div>
    );
};

export default PaymentSuccess;