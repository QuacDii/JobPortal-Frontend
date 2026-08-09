import React, { useState } from 'react';
import { Form, Input, Button, Typography, Row, Col, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined, ShopOutlined, GoogleOutlined, FacebookFilled, ArrowRightOutlined } from '@ant-design/icons';
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
    const [form] = Form.useForm();

    const isEmployer = roleType === 'employer';
    const finalRoleValue = isEmployer ? 1 : 2; 
    const themeColor = isEmployer ? '#52c41a' : '#1677ff';

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
                    window.location.href = '/'; 
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
        <Row style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            {/* BANNER BÊN TRÁI */}
            <Col xs={0} md={10} lg={12} xl={14} style={{
                background: isEmployer 
                    ? 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)' 
                    : 'linear-gradient(135deg, #002140 0%, #0050b3 50%, #1890ff 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.5s ease'
            }}>
                <div style={{ maxWidth: 480, zIndex: 1 }}>
                    <div style={{ fontSize: '42px', fontWeight: '900', color: '#ffffff', letterSpacing: '2px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColor, fontSize: '24px' }}>
                            {isEmployer ? <ShopOutlined /> : <UserOutlined />}
                        </div>
                        JOBSNOW
                    </div>
                    <Title level={2} style={{ color: '#ffffff', fontWeight: '700', lineHeight: 1.4, marginBottom: '20px' }}>
                        {isEmployer ? 'Tìm kiếm nhân tài xuất sắc cho Doanh nghiệp' : 'Khám phá hàng ngàn công việc chất lượng'}
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: 1.6, display: 'block' }}>
                        {isEmployer 
                            ? 'Tạo tài khoản Nhà tuyển dụng để tiếp cận hàng triệu ứng viên tiềm năng và tối ưu quy trình tuyển dụng ngay hôm nay.' 
                            : 'Xây dựng hồ sơ ấn tượng, kết nối trực tiếp với các Nhà tuyển dụng hàng đầu và nhận gợi ý công việc tự động từ AI.'}
                    </Text>
                </div>
            </Col>

            {/* FORM ĐĂNG KÝ BÊN PHẢI */}
            <Col xs={24} md={14} lg={12} xl={10} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px' }}>
                <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <Title level={2} style={{ color: '#0f172a', margin: '0 0 8px 0', fontWeight: '800' }}>
                            {isEmployer ? 'Đăng ký Doanh nghiệp 🏢' : 'Đăng ký Ứng viên 🚀'}
                        </Title>
                        <Text style={{ color: '#475569', fontSize: 15 }}>
                            {isEmployer ? 'Nhập thông tin doanh nghiệp để bắt đầu tuyển dụng.' : 'Tạo tài khoản tìm việc làm hoàn toàn miễn phí.'}
                        </Text>
                    </div>

                    <Form form={form} name="register_form" layout="vertical" onFinish={onFinish} autoComplete="off">
                        
                        <Form.Item 
                            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>{isEmployer ? 'Tên Công ty / Người đại diện' : 'Họ và tên đầy đủ'}</span>}
                            name="hoTen" 
                            rules={[{ required: true, message: isEmployer ? 'Vui lòng nhập tên công ty/đại diện!' : 'Vui lòng nhập họ tên của bạn!' }]}
                            style={{ marginBottom: 18 }}
                        >
                            <Input 
                                className="custom-input"
                                prefix={isEmployer ? <ShopOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} /> : <UserOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />} 
                                placeholder={isEmployer ? "VD: Công ty TNHH TechNova" : "VD: Nguyễn Văn A"} 
                                size="large" 
                                style={{ borderRadius: '8px', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                            />
                        </Form.Item>

                        <Form.Item 
                            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Địa chỉ Email</span>}
                            name="email" 
                            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}
                            style={{ marginBottom: 18 }}
                        >
                            <Input 
                                className="custom-input"
                                prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />} 
                                placeholder="VD: account@company.com" 
                                size="large" 
                                style={{ borderRadius: '8px', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                            />
                        </Form.Item>

                        <Form.Item 
                            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Mật khẩu</span>}
                            name="password" 
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu phải dài từ 6 ký tự trở lên!' }]}
                            style={{ marginBottom: 18 }}
                        >
                            <Input.Password 
                                className="custom-input"
                                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />} 
                                placeholder="Tối thiểu 6 ký tự" 
                                size="large" 
                                style={{ borderRadius: '8px', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                            />
                        </Form.Item>

                        <Form.Item 
                            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Xác nhận Mật khẩu</span>}
                            name="confirmPassword" 
                            dependencies={['password']} 
                            hasFeedback 
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận lại mật khẩu!' }, 
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                                        return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp!'));
                                    },
                                })
                            ]}
                            style={{ marginBottom: 28 }}
                        >
                            <Input.Password 
                                className="custom-input"
                                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />} 
                                placeholder="Nhập lại mật khẩu" 
                                size="large" 
                                style={{ borderRadius: '8px', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 24 }}>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                size="large" 
                                block 
                                loading={loading} 
                                icon={<ArrowRightOutlined />}
                                iconPosition="end"
                                className="register-submit-btn"
                                style={{ 
                                    backgroundColor: themeColor, 
                                    borderColor: themeColor,
                                    height: '48px',
                                    fontWeight: '700',
                                    borderRadius: '8px',
                                    fontSize: '16px'
                                }}
                            >
                                Xác Nhận Đăng Ký
                            </Button>
                        </Form.Item>

                        <Divider style={{ borderColor: '#e2e8f0', color: '#64748b', fontSize: '13px' }} plain>
                            Hoặc đăng ký nhanh bằng
                        </Divider>

                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <Button 
                                    className="social-btn-hover"
                                    size="large" 
                                    block
                                    icon={<GoogleOutlined style={{ color: '#ea4335', fontSize: '18px' }} />} 
                                    onClick={() => loginWithGoogle()}
                                    style={{ 
                                        borderRadius: '8px',
                                        height: '46px',
                                        fontWeight: '600',
                                        borderColor: '#e2e8f0',
                                        color: '#0f172a'
                                    }}
                                >
                                    Google
                                </Button>
                            </Col>

                            <Col span={12}>
                                <FacebookLogin
                                    appId="1594501296013131" 
                                    fields="name,email,picture"
                                    callback={async (response) => {
                                        if (response.accessToken) {
                                            try {
                                                const res = await apiClient.post('/auth/facebook-login', {
                                                    accessToken: response.accessToken,
                                                    vaiTro: finalRoleValue
                                                });
                                                
                                                if (res.data.success) {
                                                    message.success(res.data.message || 'Xác thực Facebook thành công!');
                                                    localStorage.setItem('token', res.data.token);
                                                    window.location.href = '/'; 
                                                }
                                            } catch (error) {
                                                message.error('Đăng nhập Facebook thất bại tại Server!');
                                            }
                                        }
                                    }}
                                    render={renderProps => (
                                        <Button 
                                            className="social-btn-hover"
                                            size="large" 
                                            block
                                            icon={<FacebookFilled style={{ color: '#1877f2', fontSize: '18px' }} />} 
                                            onClick={renderProps.onClick}
                                            style={{ 
                                                borderRadius: '8px',
                                                height: '46px',
                                                fontWeight: '600',
                                                borderColor: '#e2e8f0',
                                                color: '#0f172a'
                                            }}
                                        >
                                            Facebook
                                        </Button>
                                    )}
                                />
                            </Col>
                        </Row>
                    </Form>

                    <div style={{ textAlign: 'center', color: '#475569', fontSize: '14.5px', marginBottom: '16px' }}>
                        Bạn đã có tài khoản?{' '}
                        <span style={{ color: themeColor, fontWeight: '700', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                            Đăng nhập ngay
                        </span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/register')} style={{ color: '#64748b' }}>
                            Chọn lại vai trò khác
                        </Button>
                    </div>
                </div>
            </Col>

            <style>{`
                .register-submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
                    opacity: 0.9;
                }
                .social-btn-hover:hover {
                    transform: translateY(-2px);
                    border-color: ${themeColor} !important;
                    color: ${themeColor} !important;
                }
                .custom-input:hover, .custom-input:focus {
                    border-color: ${themeColor} !important;
                    background-color: #ffffff !important;
                    box-shadow: 0 0 0 2px ${themeColor}20 !important;
                }
            `}</style>
        </Row>
    );
};

export default Register;