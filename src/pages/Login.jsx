import React, { useState } from 'react';
import { Form, Input, Button, Typography, Row, Col, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, GoogleOutlined, FacebookFilled, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/apiClient';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';

const FacebookLogin = FacebookLoginRaw.default || FacebookLoginRaw;
const { Title, Text } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const primaryColor = '#1677ff';
    const textColor = '#475569';
    const headingColor = '#0f172a';

    const handleRoleNavigation = (token) => {
        const decoded = jwtDecode(token);
        const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        if (role === "0") {
            window.location.href = '/admin/dashboard';
        } else if (role === "1") {
            window.location.href = '/employer/dashboard';
        } else {
            window.location.href = '/';
        }
    };

    const handleLogin = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const response = await apiClient.post('/auth/login', {
                email: values.email,
                matKhau: values.matKhau
            });

            if (response.success) {
                message.success(response.message || 'Đăng nhập thành công!');
                localStorage.setItem('token', response.token);
                handleRoleNavigation(response.token);
            }
        } catch (error) {
            if (error.errorFields) return;
            const errorMsg = error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await apiClient.post('/auth/google-login', {
                    accessToken: tokenResponse.access_token
                });

                if (response.success) {
                    message.success(response.message || 'Đăng nhập Google thành công!');
                    localStorage.setItem('token', response.token);
                    handleRoleNavigation(response.token);
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message || 'Đăng nhập Google thất bại!';
                message.error(errorMsg);
            }
        },
        onError: () => {
            message.error('Kết nối tài khoản Google thất bại!');
        }
    });

    return (
        <Row style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            {/* TẤM BANNER BÊN TRÁI */}
            <Col xs={0} md={10} lg={12} xl={14} style={{
                background: 'linear-gradient(135deg, #002140 0%, #0050b3 50%, #1890ff 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%'
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%'
                }}></div>

                <div style={{ maxWidth: 500, zIndex: 1 }}>
                    <div style={{ fontSize: '42px', fontWeight: '900', color: '#ffffff', letterSpacing: '2px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: '24px' }}>
                            JN
                        </div>
                        JOBSNOW
                    </div>
                    <Title level={2} style={{ color: '#ffffff', fontWeight: '700', lineHeight: 1.4, marginBottom: '20px' }}>
                        Kết nối nhân tài,<br />Kiến tạo tương lai.
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: 1.6, display: 'block' }}>
                        Nền tảng tuyển dụng thông minh tích hợp công nghệ AI. Giúp bạn quản lý hồ sơ, tìm kiếm cơ hội và xây dựng sự nghiệp mơ ước chỉ với vài cú click.
                    </Text>

                    <div className="glass-card" style={{
                        marginTop: '40px', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease', cursor: 'default'
                    }}>
                        <Text style={{ color: '#ffffff', fontSize: '14px', fontStyle: 'italic' }}>
                            "JobsNow đã giúp chúng tôi rút ngắn 50% thời gian tìm kiếm những ứng viên chất lượng nhất."
                        </Text>
                    </div>
                </div>
            </Col>

            {/* FORM ĐĂNG NHẬP BÊN PHẢI */}
            <Col xs={24} md={14} lg={12} xl={10} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px' }}>
                <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>

                    <div className="mobile-only-header" style={{ display: 'none', marginBottom: '32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#002140', letterSpacing: '1px' }}>JOBSNOW</div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <Title level={2} style={{ color: headingColor, margin: '0 0 8px 0', fontWeight: '800' }}>
                            Chào mừng trở lại!
                        </Title>
                        <Text style={{ color: textColor, fontSize: 15 }}>
                            Đăng nhập để tiếp tục hành trình sự nghiệp của bạn.
                        </Text>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handleLogin}>
                        <Form.Item
                            label={<span style={{ color: headingColor, fontWeight: 600, fontSize: '14px' }}>Địa chỉ Email</span>}
                            name="email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tài khoản Email!' },
                                { type: 'email', message: 'Email không đúng định dạng!' }
                            ]}
                            style={{ marginBottom: 24 }}
                        >
                            <Input
                                className="custom-input"
                                size="large"
                                placeholder="VD: nguyenvan.a@gmail.com"
                                prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />}
                                style={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}
                            />
                        </Form.Item>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ color: headingColor, fontWeight: 600, fontSize: '14px' }}>
                                <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>Mật khẩu
                            </span>
                            <a
                                href="/forgot-password"
                                className="hover-link"
                                style={{ color: primaryColor, fontSize: '13.5px', fontWeight: 600, transition: 'all 0.3s ease' }}
                            >
                                Quên mật khẩu?
                            </a>
                        </div>

                        {/* Ô NHẬP MẬT KHẨU */}
                        <Form.Item
                            name="matKhau"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu đăng nhập!' }]}
                            style={{ marginBottom: 32 }}
                        >
                            <Input.Password
                                className="custom-input"
                                size="large"
                                placeholder="Nhập mật khẩu bảo mật"
                                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />}
                                style={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 32 }}>
                            <Button
                                className="primary-btn-hover"
                                type="primary"
                                size="large"
                                htmlType="submit"
                                loading={loading}
                                block
                                icon={<ArrowRightOutlined />}
                                iconPosition="end"
                                style={{
                                    backgroundColor: primaryColor,
                                    fontWeight: '700',
                                    height: '48px',
                                    fontSize: '16px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 14px rgba(22, 119, 255, 0.25)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Đăng nhập
                            </Button>
                        </Form.Item>

                        <Divider style={{ borderColor: '#e2e8f0', color: '#64748b', fontSize: '13px' }} plain>
                            Hoặc đăng nhập nhanh qua
                        </Divider>

                        <Row gutter={16} style={{ marginBottom: 32 }}>
                            <Col span={12}>
                                <Button
                                    className="social-btn-hover"
                                    size="large"
                                    block
                                    icon={<GoogleOutlined style={{ color: '#ea4335', fontSize: '18px' }} />}
                                    onClick={() => loginWithGoogle()}
                                    style={{
                                        color: headingColor,
                                        fontWeight: '600',
                                        borderRadius: '8px',
                                        height: '46px',
                                        borderColor: '#e2e8f0',
                                        backgroundColor: '#ffffff',
                                        transition: 'all 0.3s ease'
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
                                                const res = await apiClient.post('/auth/facebook-login', {
                                                    accessToken: response.accessToken
                                                });

                                                if (res.success) {
                                                    localStorage.setItem('token', res.token);
                                                    if (res.requireUpdateEmail) localStorage.setItem('requireEmailVerification', 'true');
                                                    handleRoleNavigation(res.token);
                                                }
                                            } catch (error) {
                                                message.error('Đăng nhập Facebook thất bại tại Server!');
                                            }
                                        }
                                    }}
                                    render={renderProps => (
                                        <Button
                                            className="social-btn-hover facebook-btn-hover"
                                            size="large"
                                            block
                                            icon={<FacebookFilled style={{ color: '#1877f2', fontSize: '18px' }} />}
                                            style={{
                                                color: headingColor,
                                                fontWeight: '600',
                                                borderRadius: '8px',
                                                height: '46px',
                                                borderColor: '#e2e8f0',
                                                backgroundColor: '#ffffff',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={renderProps.onClick}
                                        >
                                            Facebook
                                        </Button>
                                    )}
                                />
                            </Col>
                        </Row>

                        <div style={{ textAlign: 'center', fontSize: '15px' }}>
                            <span style={{ color: textColor }}>Bạn chưa có tài khoản? </span>
                            <a href="/register" className="hover-link" style={{ color: primaryColor, fontWeight: '700', transition: 'all 0.3s ease' }}>Tạo tài khoản mới</a>
                        </div>
                    </Form>
                </div>
            </Col>

            {/* CSS CHỌN LỌC XỬ LÝ HIỆU ỨNG HOVER VÀ RESPONSIVE */}
            <style>{`
                /* Hiệu ứng Nút Đăng nhập chính */
                .primary-btn-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.4) !important;
                    background-color: #0958d9 !important;
                }

                /* Hiệu ứng Nút Google/Facebook */
                .social-btn-hover:hover {
                    transform: translateY(-2px);
                    border-color: #1677ff !important;
                    color: #1677ff !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
                }
                
                /* Hiệu ứng cho riêng chữ Facebook khi hover đổi sang xanh dương */
                .facebook-btn-hover:hover {
                    border-color: #1877f2 !important;
                    color: #1877f2 !important;
                }

                /* Hiệu ứng Input */
                .custom-input:hover, .custom-input:focus, .custom-input-focused {
                    border-color: #1677ff !important;
                    background-color: #ffffff !important;
                    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1) !important;
                }

                /* Hiệu ứng Thẻ Glass (Trích dẫn) */
                .glass-card:hover {
                    background-color: rgba(255, 255, 255, 0.15) !important;
                    border-color: rgba(255, 255, 255, 0.4) !important;
                    transform: translateX(4px);
                }

                /* Hiệu ứng Link Text */
                .hover-link:hover {
                    text-decoration: underline;
                    opacity: 0.8;
                }

                @media (max-width: 768px) {
                    .mobile-only-header {
                        display: block !important;
                    }
                }
            `}</style>
        </Row>
    );
};

export default Login;