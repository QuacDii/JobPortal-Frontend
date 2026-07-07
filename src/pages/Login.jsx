import React, { useState } from 'react';
import { Form, Input, Button, Typography, Row, Col, message } from 'antd';
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
    const [form] = Form.useForm();

    // HỆ MÀU SẮC LIGHT MODE
    const primaryColor = '#1890ff'; 
    const textColor = '#595959'; 
    const headingColor = '#262626'; 

    // Hàm điều hướng thông minh dựa vào Quyền (Role) trong Token
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

    // 👉 HÀM XỬ LÝ ĐĂNG NHẬP CHUẨN (Dùng Async/Await quản lý thủ công)
    const handleLogin = async () => {
        try {
            // 1. Ép Antd quét kiểm tra các ô dữ liệu xem điền đúng/đủ chưa
            const values = await form.validateFields();
            
            console.log("🚀 [DEBUG] Form hợp lệ! Đang bắn API đăng nhập với data:", values);
            setLoading(true);

            // 2. Gọi API xuống Backend
            const response = await apiClient.post('/auth/login', {
                email: values.email,
                matKhau: values.matKhau 
            });

            if (response.success) {
                message.success(response.message);
                localStorage.setItem('token', response.token);
                handleRoleNavigation(response.token);
            }
        } catch (error) {
            // Nếu là lỗi do người dùng điền thiếu Form thì dừng lại, không báo lỗi API
            if (error.errorFields) {
                console.warn("❌ Người dùng chưa điền đủ Form:", error);
                return;
            }
            
            console.error("❌ Lỗi từ API Backend:", error);
            const errorMsg = error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Hàm đăng nhập bằng Google
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await apiClient.post('/auth/google-login', {
                    accessToken: tokenResponse.access_token 
                });

                if (response.success) {
                    message.success(response.message);
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
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            
            <div style={{ width: '100%', maxWidth: 480, backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                    <Title level={3} style={{ color: headingColor, margin: '0 0 8px 0', fontWeight: '800' }}>
                        Chào mừng bạn quay lại!
                    </Title>
                    <Text style={{ color: textColor, fontSize: 14 }}>
                        Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng.
                    </Text>
                </div>

                {/* 👉 ĐÃ SỬA: Form chỉ làm nhiệm vụ giữ trạng thái, không tham gia vào hành vi submit của HTML */}
                <Form form={form} layout="vertical">
                    
                    {/* Ô NHẬP EMAIL */}
                    <Form.Item
                        label={<span style={{ color: headingColor, fontWeight: 500 }}>Email</span>}
                        name="email"
                        rules={[{ required: true, message: 'Vui lòng nhập tài khoản Email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}
                        style={{ marginBottom: 20 }}
                    >
                        <Input
                            size="large"
                            placeholder="Nhập email của bạn"
                            prefix={<MailOutlined style={{ color: '#bfbfbf', marginRight: 8, fontSize: 18 }} />}
                            style={{ borderRadius: 6, padding: '10px 14px' }}
                        />
                    </Form.Item>

                    {/* Ô NHẬP MẬT KHẨU */}
                    <Form.Item
                        label={<span style={{ color: headingColor, fontWeight: 500 }}>Mật khẩu</span>}
                        name="matKhau"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu đăng nhập!' }]}
                        style={{ marginBottom: 12 }}
                    >
                        <Input.Password
                            size="large"
                            placeholder="Nhập mật khẩu của bạn" 
                            prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8, fontSize: 18 }} />}
                            style={{ borderRadius: 6, padding: '10px 14px' }}
                        />
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginBottom: 24 }}>
                        <a href="/forgot-password" style={{ color: primaryColor, fontSize: 14, fontWeight: 500 }}>Quên mật khẩu?</a>
                    </div>

                    {/* NÚT ĐĂNG NHẬP THỦ CÔNG CHỐNG RELOAD */}
                    <Form.Item style={{ marginBottom: 24 }}>
                        <Button
                            type="primary"
                            size="large"
                            loading={loading}
                            block
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor, fontWeight: 'bold', height: 44, fontSize: 16, borderRadius: 6 }}
                            onClick={handleLogin} // 👉 Gọi đích danh hàm điều khiển bằng tay
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', color: textColor, marginBottom: 16, fontSize: 13, position: 'relative' }}>
                        <span style={{ backgroundColor: '#fff', padding: '0 10px', position: 'relative', zIndex: 1 }}>Hoặc đăng nhập bằng</span>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: '#e8e8e8', zIndex: 0 }}></div>
                    </div>
                    
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        {/* NÚT GOOGLE */}
                        <Col span={12}>
                            <Button 
                                size="large" 
                                block 
                                icon={<GoogleOutlined />} 
                                onClick={() => loginWithGoogle()}
                                style={{ backgroundColor: '#ea4335', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }}
                            >
                                Google
                            </Button>
                        </Col>
                        
                        {/* NÚT FACEBOOK */}
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
                                                message.success(res.message);
                                                localStorage.setItem('token', res.token);
                                                handleRoleNavigation(res.token); 
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
                                        style={{ backgroundColor: '#1877f2', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }}
                                        onClick={renderProps.onClick}
                                    >
                                        Facebook
                                    </Button>
                                )}
                            />
                        </Col>
                    </Row>

                    <div style={{ textAlign: 'center', marginBottom: 30, borderBottom: '1px solid #e8e8e8', paddingBottom: 24 }}>
                        <span style={{ color: textColor }}>Bạn chưa có tài khoản? </span>
                        <a href="/register" style={{ color: primaryColor }}>Đăng ký ngay</a>
                    </div>

                    <div style={{ textAlign: 'center', color: textColor, fontSize: 13, lineHeight: '1.8' }}>
                        <div style={{ fontWeight: 'bold', color: headingColor }}>
                            Bạn gặp khó khăn khi tạo tài khoản?
                        </div>
                        <div>
                            Vui lòng gọi tới số <span style={{ color: primaryColor, fontWeight: 'bold' }}>1900 6868</span> (giờ hành chính).
                        </div>
                        <div style={{ marginTop: 15, color: '#bfbfbf', fontWeight: '500' }}>
                            © 2026. All Rights Reserved. JobsNow.
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Login;