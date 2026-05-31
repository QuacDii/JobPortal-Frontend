import React, { useState } from 'react';
import { Form, Input, Button, Typography, Row, Col, message } from 'antd';
// Đã xóa LinkedinFilled
import { MailOutlined, LockOutlined, GoogleOutlined, FacebookFilled } from '@ant-design/icons';
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

    const primaryColor = '#1890ff'; 
    const inputBg = '#272a31';
    const textColor = '#a6a6a6';

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

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/auth/login', {
                email: values.email,
                matKhau: values.matKhau 
            });

            if (response.data.success) {
                message.success(response.data.message);
                localStorage.setItem('token', response.data.token);
                handleRoleNavigation(response.data.token);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại!';
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

                if (response.data.success) {
                    message.success(response.data.message);
                    localStorage.setItem('token', response.data.token);
                    handleRoleNavigation(response.data.token);
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
        <div style={{ minHeight: '100vh', backgroundColor: '#1a1b20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 520, padding: '40px 20px' }}>
                
                <div style={{ marginBottom: 32 }}>
                    <Title level={3} style={{ color: primaryColor, margin: 0, fontWeight: '700' }}>
                        Chào mừng bạn đã quay trở lại
                    </Title>
                    <Text style={{ color: textColor, fontSize: 14 }}>
                        Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng
                    </Text>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    
                    <Form.Item
                        label={<span style={{ color: textColor }}>Email</span>}
                        name="email"
                        rules={[{ required: true, type: 'email', message: 'Vui lòng nhập đúng định dạng Email!' }]}
                        style={{ marginBottom: 20 }}
                    >
                        <Input
                            size="large"
                            placeholder="Nhập email của bạn"
                            prefix={<MailOutlined style={{ color: primaryColor, marginRight: 8, fontSize: 18 }} />}
                            style={{ backgroundColor: inputBg, color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '10px 14px' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: textColor }}>Password</span>}
                        name="matKhau"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu đăng nhập!' }]}
                        style={{ marginBottom: 12 }}
                    >
                        <Input.Password
                            size="large"
                            placeholder="••••••••••••"
                            prefix={<LockOutlined style={{ color: primaryColor, marginRight: 8, fontSize: 18 }} />}
                            style={{ backgroundColor: inputBg, color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '10px 14px' }}
                        />
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginBottom: 24 }}>
                        <a href="/forgot-password" style={{ color: primaryColor, fontSize: 14 }}>Quên mật khẩu</a>
                    </div>

                    <Form.Item style={{ marginBottom: 24 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            block
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor, fontWeight: 'bold', height: 44, fontSize: 16 }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', color: textColor, marginBottom: 16, fontSize: 13 }}>
                        Hoặc đăng nhập bằng
                    </div>
                    
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={12}>
                            <Button 
                                size="large" 
                                block 
                                icon={<GoogleOutlined />} 
                                onClick={() => loginWithGoogle()}
                                style={{ backgroundColor: '#ea4335', color: '#fff', border: 'none', fontWeight: '500' }}
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
                                            if (res.data.success) {
                                                message.success(res.data.message);
                                                localStorage.setItem('token', res.data.token);
                                                handleRoleNavigation(res.data.token); 
                                            }
                                        } catch (error) {
                                            message.error('Đăng nhập Facebook thất bại tại Server!');
                                        }
                                    } else {
                                        message.error('Hủy kết nối Facebook!');
                                    }
                                }}
                                render={renderProps => (
                                    <Button 
                                        size="large" 
                                        block
                                        icon={<FacebookFilled />} 
                                        style={{ backgroundColor: '#1877f2', color: '#fff', border: 'none', fontWeight: '500' }}
                                        onClick={renderProps.onClick}
                                    >
                                        Facebook
                                    </Button>
                                )}
                            />
                        </Col>
                    </Row>

                    <div style={{ textAlign: 'center', marginBottom: 40, borderBottom: '1px solid #333', paddingBottom: 24 }}>
                        <span style={{ color: textColor }}>Bạn chưa có tài khoản? </span>
                        <a href="/register" style={{ color: primaryColor, fontWeight: 'bold' }}>Đăng ký ngay</a>
                    </div>

                    <div style={{ textAlign: 'center', color: textColor, fontSize: 13, lineHeight: '1.8' }}>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>
                            Bạn gặp khó khăn khi tạo tài khoản?
                        </div>
                        <div>
                            Vui lòng gọi tới số <span style={{ color: primaryColor, fontWeight: 'bold' }}>1900 6868</span> (giờ hành chính).
                        </div>
                        <div style={{ marginTop: 24, color: primaryColor, fontWeight: '500' }}>
                            © 2026. All Rights Reserved. JobsNow.
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Login;