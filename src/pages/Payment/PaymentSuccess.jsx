import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Result, Button } from 'antd';
import apiClient from '../../api/apiClient';

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

        // 2. LÀM MỚI DỮ LIỆU USER NGAY SAU KHI THANH TOÁN (CÁCH 2)
        const refreshUserStatus = async () => {
            try {
                // 1. Gọi API cấp lại Token mới. 
                const response = await apiClient.post('/Auth/refresh-token');

                if (response.data && response.data.token) {
                    // 2. Lưu đè Token mới (chứa hạn VIP mới) vào LocalStorage
                    localStorage.setItem('token', response.data.token);

                    // 3. Kích hoạt sự kiện để Header (UserDropdown) biết và tự động cập nhật UI ngay lập tức
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (error) {
                console.error("Lỗi khi làm mới trạng thái VIP:", error);
            }
        };

        refreshUserStatus();

    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Result
                status="success"
                title="🎉 Giao Dịch Hoàn Tất Thành Công!"
                subTitle={`Hệ thống đã ghi nhận mã đơn hàng: ${orderId || 'Thành công'}. Các quyền lợi dịch vụ của bạn đã được kích hoạt tự động an toàn.`}
                extra={[
                    <Button type="primary" key="console" size="large">
                        <a href={returnUrl}>{btnText}</a>
                    </Button>
                ]}
            />
        </div>
    );
};

export default PaymentSuccess;