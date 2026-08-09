import React, { useState, useEffect } from 'react';
import { Layout, Space, Button, Modal, Form, Input, Row, Col, Divider, Typography, message } from 'antd';
import {
    MailOutlined,
    LockOutlined,
    GoogleOutlined,
    FacebookFilled
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';
import apiClient from '../api/apiClient';
import UserDropdown from '../components/UserDropdown';
import CreateCvMenu from '../components/CreateCvMenu';
import JobsMenu from '../components/JobsMenu';
import './css/CandidateLayout.css';

const FacebookLogin = FacebookLoginRaw.default || FacebookLoginRaw;
const { Header, Content } = Layout;
const { Text } = Typography;

const CandidateLayout = ({ children, user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loginForm] = Form.useForm();

    // STATE QUẢN LÝ ĐĂNG NHẬP VÀ POPUP
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(user);

    // CẬP NHẬT USER DỮ LIỆU MỚI TỪ PROP
    useEffect(() => {
        setCurrentUser(user);
    }, [user]);

    // LẮNG NGHE SỰ KIỆN MUA VIP THÀNH CÔNG ĐỂ TỰ ĐỘNG LÀM MỚI HEADER REAL-TIME
    useEffect(() => {
        const handleVipUpdate = () => {
            apiClient.get('/Service/balance')
                .then(res => {
                    const balData = res.data !== undefined ? res.data : res;
                    const isVipActive = balData?.ngayHetHanGoi && new Date(balData.ngayHetHanGoi) > new Date();

                    setCurrentUser(prev => ({
                        ...prev,
                        isVip: isVipActive,
                        tenGoiHienTai: balData?.tenGoiHienTai
                    }));
                })
                .catch(err => console.error("Lỗi cập nhật VIP Header:", err));
        };

        window.addEventListener('update_vip_status', handleVipUpdate);
        return () => window.removeEventListener('update_vip_status', handleVipUpdate);
    }, []);

    const handleRoleNavigation = (token) => {
        try {
            const decoded = jwtDecode(token);
            const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
                || decoded.role
                || decoded.VaiTro;

            if (String(role) === "0") {
                window.location.href = '/admin/dashboard';
            } else if (String(role) === "1") {
                window.location.href = '/employer/dashboard';
            } else {
                window.location.reload();
            }
        } catch (e) {
            window.location.reload();
        }
    };

    // HÀM KIỂM TRA QUYỀN TRƯỚC KHI THAO TÁC
    const handleProtectedAction = (targetPath) => {
        if (!currentUser) {
            setIsPopupOpen(true);
        } else {
            navigate(targetPath);
        }
    };

    // HÀM XỬ LÝ ĐĂNG NHẬP NHANH TRÊN POPUP
    const handlePopupLogin = async (values) => {
        try {
            setLoginLoading(true);
            const response = await apiClient.post('/Auth/login', {
                email: values.email,
                password: values.matKhau || values.password,
                matKhau: values.matKhau || values.password
            });

            const result = response.data !== undefined ? response.data : response;
            const token = result?.token || result?.accessToken;

            if (token) {
                message.success('Đăng nhập thành công!');
                localStorage.setItem('token', token);
                setIsPopupOpen(false);
                handleRoleNavigation(token);
            } else {
                message.error(result?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Đăng nhập thất bại!');
        } finally {
            setLoginLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await apiClient.post('/auth/google-login', { accessToken: tokenResponse.access_token });
                const result = response.data !== undefined ? response.data : response;
                const token = result?.token || result?.accessToken;

                if (token) {
                    message.success('Đăng nhập Google thành công!');
                    localStorage.setItem('token', token);
                    setIsPopupOpen(false);
                    handleRoleNavigation(token);
                }
            } catch (error) { message.error('Đăng nhập Google thất bại!'); }
        },
        onError: () => message.error('Kết nối Google thất bại!')
    });

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
            {/* HEADER THANH ĐIỀU HƯỚNG TỔNG */}
            <Header style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #f0f0f0',
                padding: '0 32px',
                height: '68px',
                lineHeight: '68px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
            }}>
                {/* KHỐI LOGO VÀ MENU BÊN TRÁI */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
                    {/* LOGO THƯƠNG HIỆU */}
                    <div
                        className="logo-hover"
                        style={{
                            color: '#0f172a',
                            fontSize: '24px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onClick={() => navigate('/')}
                    >
                        <div style={{
                            width: '36px', height: '36px', backgroundColor: '#1890ff', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold'
                        }}>
                            JN
                        </div>
                        <span>JOBS<span style={{ color: '#1890ff' }}>NOW</span></span>
                    </div>

                    {/* MENU ĐIỀU HƯỚNG BÊN TRÁI */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <JobsMenu handleProtectedAction={handleProtectedAction} />
                        <CreateCvMenu />
                        <div
                            className={`candidate-nav-item ${location.pathname.startsWith('/cong-ty') ? 'active' : ''}`}
                            onClick={() => navigate('/cong-ty')}
                        >
                            Công ty
                        </div>
                    </div>
                </div>

                {/* KHỐI USER VÀ NÚT TÍNH NĂNG BÊN PHẢI */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {currentUser ? (
                        <UserDropdown user={currentUser} />
                    ) : (
                        <Space size={12}>
                            <Button
                                className="btn-register-hover"
                                onClick={() => navigate('/register')}
                                style={{
                                    height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: 600,
                                    borderColor: '#d9d9d9', color: '#0f172a'
                                }}
                            >
                                Đăng ký
                            </Button>
                            <Button
                                type="primary"
                                className="btn-login-hover"
                                onClick={() => navigate('/login')}
                                style={{
                                    height: '40px', padding: '0 22px', borderRadius: '8px', fontWeight: 600,
                                    backgroundColor: '#1890ff', borderColor: '#1890ff',
                                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.25)'
                                }}
                            >
                                Đăng nhập
                            </Button>
                        </Space>
                    )}
                </div>
            </Header>

            {/* NỘI DUNG CHÍNH TRANG */}
            <Content style={{ backgroundColor: '#f5f7fa' }}>
                {children}
            </Content>

            {/* POPUP ĐĂNG NHẬP GIỐNG FILE XEM CV MẪU */}
            <Modal
                title={<span style={{ color: '#333333', fontSize: '20px' }}>Đăng nhập để tiếp tục</span>}
                open={isPopupOpen}
                onCancel={() => { setIsPopupOpen(false); loginForm.resetFields(); }}
                footer={null}
                width={420}
                className="custom-modal"
                styles={{ content: { backgroundColor: '#ffffff', border: '1px solid #e8e8e8' } }}
                centered
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Text style={{ color: '#595959', fontSize: '14px' }}>
                        Vui lòng đăng nhập để có thể sử dụng chức năng đã chọn.
                    </Text>
                </div>

                <Form form={loginForm} layout="vertical" onFinish={handlePopupLogin} requiredMark={false}>
                    <Form.Item
                        label={<span style={{ color: '#333333', fontWeight: '500' }}>Email</span>}
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không đúng định dạng!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#8c8c8c' }} />}
                            placeholder="Nhập email của bạn"
                            size="large"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #d9d9d9',
                                color: '#333333',
                                borderRadius: '6px'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#333333', fontWeight: '500' }}>Mật khẩu</span>}
                        name="matKhau"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                            placeholder="Nhập mật khẩu"
                            size="large"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #d9d9d9',
                                color: '#333333',
                                borderRadius: '6px'
                            }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            loading={loginLoading}
                            style={{
                                backgroundColor: '#1890ff',
                                borderColor: '#1890ff',
                                fontWeight: 'bold',
                                height: '44px',
                                borderRadius: '6px'
                            }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    <Divider plain style={{ borderColor: '#d9d9d9', margin: '20px 0' }}>
                        <span style={{ color: '#595959', fontSize: '13px', padding: '0 10px' }}>
                            Hoặc đăng nhập bằng
                        </span>
                    </Divider>

                    <Row gutter={16} style={{ marginBottom: 10 }}>
                        <Col span={12}>
                            <Button
                                size="large"
                                block
                                icon={<GoogleOutlined />}
                                onClick={() => loginWithGoogle()}
                                style={{
                                    backgroundColor: '#ea4335',
                                    color: '#fff',
                                    border: 'none',
                                    fontWeight: '600',
                                    borderRadius: 6
                                }}
                            >
                                Google
                            </Button>
                        </Col>
                        <Col span={12}>
                            <FacebookLogin
                                appId="1594501296013131"
                                fields="name,email,picture"
                                scope="public_profile,email"
                                callback={async (response) => {
                                    if (response.accessToken) {
                                        try {
                                            const res = await apiClient.post('/auth/facebook-login', { accessToken: response.accessToken });
                                            const result = res.data !== undefined ? res.data : res;
                                            const token = result?.token || result?.accessToken;

                                            if (token) {
                                                message.success('Đăng nhập Facebook thành công!');
                                                localStorage.setItem('token', token);
                                                setIsPopupOpen(false);
                                                handleRoleNavigation(token);
                                            }
                                        } catch (error) {
                                            message.error('Đăng nhập Facebook thất bại!');
                                        }
                                    }
                                }}
                                render={renderProps => (
                                    <Button
                                        size="large"
                                        block
                                        icon={<FacebookFilled />}
                                        style={{
                                            backgroundColor: '#1877f2',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: '600',
                                            borderRadius: 6
                                        }}
                                        onClick={renderProps.onClick}
                                    >
                                        Facebook
                                    </Button>
                                )}
                            />
                        </Col>
                    </Row>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <span style={{ color: '#595959' }}>Chưa có tài khoản? </span>
                        <a
                            style={{ color: '#1890ff', fontWeight: '500', cursor: 'pointer' }}
                            onClick={() => { setIsPopupOpen(false); navigate('/register'); }}
                        >
                            Đăng ký ngay
                        </a>
                    </div>
                </Form>
            </Modal>
        </Layout>
    );
};

export default CandidateLayout;