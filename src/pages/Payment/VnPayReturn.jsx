import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import apiClient from '../../api/apiClient';

const VnPayReturn = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const processVnPayReturn = async () => {
            try {
                // Gọi API backend kèm theo toàn bộ query string từ VNPay
                const res = await apiClient.get(`/Payment/vnpay-callback${location.search}`);
                const data = res?.data || res;

                if (data?.success) {
                    navigate(`/payment-success?orderId=${data.orderId || ''}`);
                } else {
                    navigate(`/payment-failed?orderId=${data?.orderId || ''}&code=${data?.responseCode || ''}`);
                }
            } catch (error) {
                navigate('/payment-failed');
            }
        };

        processVnPayReturn();
    }, [location.search, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
            <Spin size="large" />
            <h3>Đang xác thực kết quả thanh toán từ VNPay...</h3>
        </div>
    );
};

export default VnPayReturn;