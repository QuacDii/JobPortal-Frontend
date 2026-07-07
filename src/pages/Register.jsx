import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined, ShopOutlined, GoogleOutlined, FacebookFilled } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; 
import apiClient from '../api/apiClient';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';

const FacebookLogin = FacebookLoginRaw.default || FacebookLoginRaw;
const { Title, Text } = Typography;

const Register = () => {
    const navigate = useNavigate();
    const { roleType } = useParams(); 
    const [loading, setLoading] = useState(false);

    // Tự động cấu hình Vai Trò dựa theo URL (/register/employer hoặc /register/candidate)
    const isEmployer = roleType === 'employer';
    const finalRoleValue = isEmployer ? 1 : 2; // 1: Nhà tuyển dụng, 2: Ứng viên
    const themeColor = isEmployer ? '#52c41a' : '#1890ff';

    // 1. Hàm xử lý Đăng ký bằng Form truyền thống
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/auth/register', {
                email: values.email,
                matKhau: values.password,
                hoTen: values.hoTen,
                vaiTro: finalRoleValue
            });

            if (response.success) {
                message.success('Đăng ký tài khoản thành công! Hãy đăng nhập ngay.');
                navigate('/login');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Đăng ký thất bại, vui lòng kiểm tra lại!';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // 2. Hàm xử lý Đăng ký / Đăng nhập bằng Google
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                const response = await apiClient.post('/auth/google-login', {
                    accessToken: tokenResponse.access_token,
                    vaiTro: finalRoleValue
                });

                if (response.success) {
                    localStorage.setItem('token', response.token);
                    message.success('Xác thực tài khoản Google thành công!');
                    window.location.href = '/'; // Chuyển hướng về trang chủ để cập nhật lại Header component
                }
            } catch (error) {
                message.error('Xác thực Google thất bại. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => message.error('Đăng nhập bằng Google bị hủy!')
    });

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#141414' }}>
            <Card style={{ width: 450, borderRadius: 12, border: '1px solid #303030', background: '#1f1f1f', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                
                <div style={{ textAlign: 'center', marginBottom: 25 }}>
                    <Title level={2} style={{ color: themeColor, margin: 0 }}>
                        {isEmployer ? 'ĐĂNG KÝ DOANH NGHIỆP' : 'ĐĂNG KÝ ỨNG VIÊN'}
                    </Title>
                    <Text style={{ color: '#8c8c8c' }}>
                        {isEmployer ? 'Tạo tài khoản nhà tuyển dụng cho doanh nghiệp' : 'Tạo tài khoản ứng viên tìm việc làm nhanh'}
                    </Text>
                </div>

                <Form name="register_form" layout="vertical" onFinish={onFinish} autoComplete="off">
                    
                    <Form.Item name="hoTen" rules={[{ required: true, message: isEmployer ? 'Vui lòng nhập tên công ty/đại diện!' : 'Vui lòng nhập họ tên của bạn!' }]}>
                        <Input prefix={isEmployer ? <ShopOutlined style={{ color: '#bfbfbf' }} /> : <UserOutlined style={{ color: '#bfbfbf' }} />} placeholder={isEmployer ? "Nhập tên công ty hoặc người đại diện" : "Nhập họ và tên đầy đủ"} size="large" style={{ background: '#141414', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}>
                        <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập tài khoản Email" size="large" style={{ background: '#141414', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu phải dài từ 6 ký tự trở lên!' }]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập mật khẩu bảo mật" size="large" style={{ background: '#141414', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item name="confirmPassword" dependencies={['password']} hasFeedback rules={[{ required: true, message: 'Vui lòng xác nhận lại mật khẩu!' }, ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp!'));
                            },
                        })]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập lại mật khẩu để xác nhận" size="large" style={{ background: '#141414', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: themeColor, borderColor: themeColor }}>
                            Xác Nhận Đăng Ký Form
                        </Button>
                    </Form.Item>

                    <Divider plain style={{ color: '#8c8c8c', borderColor: '#303030', fontSize: 13, margin: '24px 0' }}>
                        Hoặc đăng ký nhanh bằng
                    </Divider>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        {/* BUTTON GOOGLE */}
                        <Button 
                            size="large" 
                            icon={<GoogleOutlined style={{ fontSize: 18 }} />} 
                            style={{ 
                                flex: 1,
                                backgroundColor: '#EE0000', 
                                color: '#fff', 
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => loginWithGoogle()}
                        >
                            Google
                        </Button>

                        {/* COMPONENT FACEBOOK LOGIN */}
                        <FacebookLogin
                            appId="1594501296013131" 
                            fields="name,email,picture"
                            callback={async (response) => {
                                if (response.accessToken) {
                                    try {
                                        // 👉 ĐÃ SỬA: Gửi kèm cả vaiTro giống y chang bên Google
                                        const res = await apiClient.post('/auth/facebook-login', {
                                            accessToken: response.accessToken,
                                            vaiTro: finalRoleValue
                                        });
                                        
                                        if (res.data.success) {
                                            message.success(res.data.message || 'Xác thực tài khoản Facebook thành công!');
                                            localStorage.setItem('token', res.data.token);
                                            
                                            // 👉 ĐÃ SỬA CHÍ MẠNG: Thay thế hàm không tồn tại bằng điều hướng chuẩn
                                            window.location.href = '/'; 
                                        }
                                    } catch (error) {
                                        console.error("Lỗi crash logic Frontend trong khối then:", error);
                                        message.error('Đăng nhập Facebook thất bại tại Server!');
                                    }
                                } else {
                                    message.error('Hủy kết nối Facebook!');
                                }
                            }}
                            render={renderProps => (
                                <Button 
                                    size="large" 
                                    icon={<FacebookFilled style={{ fontSize: 18 }} />} 
                                    style={{ flex: 1, backgroundColor: '#1877f2', color: '#fff', border: 'none'}}
                                    onClick={renderProps.onClick}
                                >
                                    Facebook
                                </Button>
                            )}
                        />
                    </div>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '24px', color: '#a6a6a6', fontSize: '14px' }}>
                    Bạn đã có tài khoản?{' '}
                    <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                        Đăng nhập ngay
                    </span>
                </div>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/register')} style={{ color: '#8c8c8c', padding: 0 }}>
                        Chọn lại vai trò khác
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Register;