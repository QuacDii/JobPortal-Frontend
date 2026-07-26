import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import EmployerOnboarding from '../pages/Employer/EmployerOnboarding'; // Đường dẫn tới file Onboarding của bạn

const EmployerGuard = ({ children }) => {
    const [status, setStatus] = useState(null); // Các trạng thái: 'LOADING', 'NO_COMPANY', 'PENDING', 'APPROVED'
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Hàm gọi API kiểm tra trạng thái xét duyệt của Doanh nghiệp
    const checkEmployerStatus = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/auth/employer-status');
            const resPayload = response?.data || response;
            
            if (resPayload && resPayload.success) {
                setStatus(resPayload.status); // Trả về NO_COMPANY, PENDING hoặc APPROVED
            } else {
                setStatus('NO_COMPANY');
            }
        } catch (error) {
            console.error("Không thể kiểm tra trạng thái NTD:", error);
            setStatus('NO_COMPANY');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkEmployerStatus();
    }, [location.pathname]);

    // 1. Màn hình chờ khi đang check status với Server
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <Spin tip="Hệ thống đang xác thực trạng thái hồ sơ doanh nghiệp..." size="large" />
            </div>
        );
    }

    // 2. CHẶN CỨNG: Nếu chưa khai báo (NO_COMPANY) hoặc chờ duyệt (PENDING)
    // Ép người dùng ở lại trang khai báo Onboarding, không render giao diện trang con (children)
    if (status !== 'APPROVED') {
        return (
            <EmployerOnboarding 
                currentStatus={status} 
                onStatusChange={(newStatus) => setStatus(newStatus)} 
            />
        );
    }

    // 3. ĐÃ ĐƯỢC DUYỆT (APPROVED): Mở khóa render toàn bộ trang chức năng
    return children;
};

export default EmployerGuard;