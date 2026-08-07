import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Result, Button } from 'antd';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId') || searchParams.get('vnp_TxnRef');
    
    const [returnUrl, setReturnUrl] = useState('/employer/wallet');
    const [btnText, setBtnText] = useState('Quay lại Ví');

    useEffect(() => {
        const prevPath = localStorage.getItem('payment_redirect');
        if (prevPath) {
            setReturnUrl(prevPath);
            if (prevPath.includes('service-package')) {
                setBtnText('Quay lại Cửa hàng gói');
            }
            localStorage.removeItem('payment_redirect');
        }
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Result
                status="success"
                title="🎉 Giao Dịch Hoàn Tất Thành Công!"
                subTitle={`Hệ thống đã ghi nhận mã đơn hàng: ${orderId || 'Thành công'}. Các quyền lợi dịch vụ của bạn đã được kích hoạt tự động an toàn.`}
                extra={[
                    <Button type="primary" key="console" size="large">
                        <Link to={returnUrl}>{btnText}</Link>
                    </Button>
                ]}
            />
        </div>
    );
};

export default PaymentSuccess;