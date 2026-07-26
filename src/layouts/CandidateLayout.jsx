import React, { useState } from 'react';
import { Layout, Space, Button, Modal, Form, Input } from 'antd';
import { 
    UserOutlined, 
    LockOutlined,
    BellOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import UserDropdown from '../components/UserDropdown';
import CreateCvMenu from '../components/CreateCvMenu';
import JobsMenu from '../components/JobsMenu';
import './css/CandidateLayout.css';

const { Header, Content } = Layout;

const CandidateLayout = ({ children, user }) => {
    const navigate = useNavigate();
    const location = useLocation(); 
    
    // 1. STATE QUẢN LÝ ĐĂNG NHẬP VÀ POPUP
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    // 2. HÀM KIỂM TRA QUYỀN TRƯỚC KHI THAO TÁC
    const handleProtectedAction = (targetPath) => {
        if (!user) {
            setIsPopupOpen(true);
        } else {
            navigate(targetPath);
        }
    };

    // 3. HÀM XỬ LÝ ĐĂNG NHẬP NHANH TRÊN POPUP
    const handlePopupLogin = (values) => {
        setLoginLoading(true);
        apiClient.post('/Auth/login', values)
            .then(res => {
                localStorage.setItem('token', res.data.token);
                setIsPopupOpen(false);
                alert('Đăng nhập thành công!');
                window.location.reload(); 
            })
            .catch(err => {
                console.error(err);
                alert('Tài khoản hoặc mật khẩu không chính xác!');
            })
            .finally(() => {
                setLoginLoading(false);
            });
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* ==========================================
                HEADER THANH ĐIỀU HƯỚNG TỔNG
            ========================================== */}
            <Header className="topcv-header">
                
                {/* Khối bên trái: LOGO & MENU */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    
                    {/* Logo JobsNow */}
                    <div 
                        style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.5px', cursor: 'pointer' }} 
                        onClick={() => navigate('/')}
                    >
                        JOBS<span style={{ color: '#1890ff' }}>NOW</span>
                    </div>

                    {/* Thanh Menu Chính */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        
                        {/* 1. Menu "Việc làm" */}
                        <JobsMenu handleProtectedAction={handleProtectedAction} />

                        {/* 2. Menu "Tạo CV" */}
                        <CreateCvMenu />

                        {/* 3. Tab "Công ty" (Đã được chèn vào đây) */}
                        <div 
                            className={`topcv-nav-link ${location.pathname.startsWith('/cong-ty') ? 'active' : ''}`}
                            onClick={() => navigate('/cong-ty')}
                        >
                            Công ty
                        </div>

                    </div>
                </div>

                {/* Khối bên phải: ĐỒNG BỘ THEO TRẠNG THÁI USER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    
                    {user ? (
                        // Đã đăng nhập
                        <Space size={12}>
                            <div className="header-icon-btn"><BellOutlined /></div>
                            <UserDropdown user={user} />
                        </Space>
                    ) : (
                        // Chưa đăng nhập
                        <Space size={10}>
                            <Button className="btn-topcv-register" onClick={() => navigate('/register')}>
                                Đăng ký
                            </Button>
                            <Button className="btn-topcv-login" onClick={() => navigate('/login')}>
                                Đăng nhập
                            </Button>
                        </Space>
                    )}
                </div>
            </Header>

            {/* ==========================================
                NỘI DUNG RUỘT
            ========================================== */}
            <Content>{children}</Content>

            {/* ==========================================
                POPUP ĐĂNG NHẬP NHANH
            ========================================== */}
            <Modal
                title={<div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>Chào mừng bạn quay lại JOBSNOW</div>}
                open={isPopupOpen}
                onCancel={() => setIsPopupOpen(false)}
                footer={null}
                width={400}
                centered
            >
                <div style={{ textAlign: 'center', color: '#8c8c8c', marginBottom: '24px' }}>
                    Vui lòng đăng nhập để tiếp tục sử dụng tính năng này
                </div>

                <Form layout="vertical" onFinish={handlePopupLogin}>
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Vui lòng nhập Email ứng viên!' }]}
                    >
                        <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập email của bạn" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập mật khẩu" size="large" />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '32px', marginBottom: 8 }}>
                        <Button type="primary" htmlType="submit" block size="large" loading={loginLoading} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 600 }}>
                            Đăng nhập ngay
                        </Button>
                    </Form.Item>
                </Form>
                
                <div style={{ textAlign: 'center', marginTop: '16px', color: '#8c8c8c' }}>
                    Chưa có tài khoản? <span style={{ color: '#1890ff', cursor: 'pointer', fontWeight: 500 }} onClick={() => { setIsPopupOpen(false); navigate('/register'); }}>Đăng ký ngay</span>
                </div>
            </Modal>

        </Layout>
    );
};

export default CandidateLayout;