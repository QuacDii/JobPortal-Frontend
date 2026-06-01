import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentFailed = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1 style={{ color: 'red' }}>❌ Giao Dịch Thất Bại / Đã Hủy</h1>
            <p>Mã giao dịch: <strong>{orderId}</strong></p>
            <p>Rất tiếc, giao dịch của bạn không thành công hoặc đã bị hủy.</p>
            <Link to="/wallet" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: 'gray', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                Thử lại
            </Link>
        </div>
    );
};

export default PaymentFailed;