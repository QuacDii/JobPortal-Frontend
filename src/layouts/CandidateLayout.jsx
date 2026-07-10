import React, { useState } from 'react';
import { Layout, Space, Button, Modal, Form, Input } from 'antd';
import { HomeOutlined, FileTextOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import UserDropdown from '../components/UserDropdown';
import CreateCvMenu from '../components/CreateCvMenu';

const { Header, Content } = Layout;

const CandidateLayout = ({ children, user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // 1. STATE QUẢN LÝ ĐĂNG NHẬP VÀ POPUP (Bỏ hoàn toàn state token cũ)
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    // 2. HÀM KIỂM TRA QUYỀN TRƯỚC KHI THAO TÁC (Dựa hoàn toàn vào prop user)
    const handleProtectedAction = (targetPath) => {
        if (!user) {
            // Chưa đăng nhập (hoặc token hết hạn) thì chặn lại và bật Popup lên ngay
            setIsPopupOpen(true);
        } else {
            // Đã đăng nhập hợp lệ thì cho đi tiếp
            navigate(targetPath);
        }
    };

    // 3. HÀM XỬ LÝ ĐĂNG NHẬP NHANH NGAY TRÊN POPUP
    const handlePopupLogin = (values) => {
        setLoginLoading(true);
        apiClient.post('/Auth/login', values)
            .then(res => {
                localStorage.setItem('token', res.data.token);
                setIsPopupOpen(false); // Đóng popup
                alert('Đăng nhập thành công!');
                
                // 👉 MẸO QUAN TRỌNG: Reload lại trang để App.jsx tự động chạy lại luồng jwtDecode,
                // bóc tách thông tin user mới và đồng bộ UI toàn bộ hệ thống ngay lập tức!
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
            
            {/* CSS TÙY CHỈNH STYLE CÁC NÚT ĐĂNG KÝ / ĐĂNG NHẬP CHUẨN TOPCV */}
            <style>{`
                .btn-register {
                    background-color: transparent !important;
                    border: 1px solid #1877f2 !important;
                    color: #1877f2 !important;
                    border-radius: 4px !important;
                    font-weight: 500;
                }
                .btn-register:hover {
                    background-color: rgba(0, 41, 177, 0.1) !important;
                }
                .btn-login {
                    background-color: #1877f2 !important;
                    border: 1px solid #1877f2 !important;
                    color: #fff !important;
                    border-radius: 4px !important;
                    font-weight: 500;
                }
                .btn-login:hover {
                    background-color: #1877f2 !important;
                    border-color: #1877f2 !important;
                }
                .btn-recruiter {
                    background-color: #333 !important;
                    border: 1px solid #444 !important;
                    color: #a6a6a6 !important;
                    border-radius: 4px !important;
                }
                .btn-recruiter:hover {
                    color: #fff !important;
                    border-color: #666 !important;
                }
                
                .ant-layout-header {
                    background-color: #0f1e36 !important; /* Màu xanh đen */
                }
                .nav-item {
                    color: #a6a6a6;
                    cursor: pointer;
                    font-weight: 500;
                    transition: color 0.3s;
                    padding: 0 16px;
                }
                .nav-item:hover, .nav-item.active {
                    color: #fff;
                }
            `}</style>

            {/* ==========================================
                HEADER THANH ĐIỀU HƯỚNG TỔNG
            ========================================== */}
            <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', padding: '0 40px' }}>
                
                {/* Khối bên trái: LOGO & MENU */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <div style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        JOBS<span style={{ color: '#1890ff' }}>NOW</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
                            <HomeOutlined /> Trang chủ
                        </div>
                        
                        {/* Bấm vào đây nếu chưa đăng nhập sẽ bị kích hoạt Popup chặn lại */}
                        <div className={`nav-item ${location.pathname === '/viec-lam' ? 'active' : ''}`} onClick={() => handleProtectedAction('/viec-lam')}>
                            <FileTextOutlined /> Việc làm của tôi
                        </div>

                        {/* Thư viện CV menu tĩnh thả xuống */}
                        <CreateCvMenu />
                    </div>
                </div>

                {/* Khối bên phải: ĐỒNG BỘ TUYỆT ĐỐI THEO PROP USER CỦA APP.JSX */}
                <div>
                    {user ? (
                        // TRẠNG THÁI 1: App.jsx xác nhận có user hợp lệ -> Hiện Dropdown tài khoản
                        <UserDropdown user={user} />
                    ) : (
                        // TRẠNG THÁI 2: Chưa đăng nhập hoặc token hết hạn -> Hiện cụm nút đăng nhập
                        <Space size={12}>
                            <Button className="btn-register" onClick={() => navigate('/register')}>
                                Đăng ký
                            </Button>
                            <Button type="primary" className="btn-login" onClick={() => navigate('/login')}>
                                Đăng nhập
                            </Button>
                            <Button className="btn-recruiter" onClick={() => navigate('/employer/login')}>
                                Đăng tuyển & tìm hồ sơ
                            </Button>
                        </Space>
                    )}
                </div>
            </Header>

            {/* ==========================================
                NỘI DUNG RUỘT CỦA CÁC TRANG TRẢ VỀ
            ========================================== */}
            <Content>{children}</Content>

            {/* ==========================================
                POPUP ĐĂNG NHẬP NHANH (BẬT LÊN KHI CHƯA AUTH)
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
                        <Button type="primary" htmlType="submit" block size="large" loading={loginLoading} style={{ backgroundColor: '#00b14f', borderColor: '#00b14f', fontWeight: 600 }}>
                            Đăng nhập ngay
                        </Button>
                    </Form.Item>
                </Form>
                
                <div style={{ textAlign: 'center', marginTop: '16px', color: '#8c8c8c' }}>
                    Chưa có tài khoản? <span style={{ color: '#1877f2', cursor: 'pointer', fontWeight: 500 }} onClick={() => { setIsPopupOpen(false); navigate('/register'); }}>Đăng ký ngay</span>
                </div>
            </Modal>

        </Layout>
    );
};

export default CandidateLayout;