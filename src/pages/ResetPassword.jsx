import React, { useState } from 'react';
import { Form, Input, Button, Typography, Row, Col, message } from 'antd';
import { LockOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';

const { Title, Text } = Typography;

const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Lấy chuỗi mã token từ thanh địa chỉ url

    const primaryColor = '#1677ff';
    const textColor = '#475569';
    const headingColor = '#0f172a';

    const onFinish = async (values) => {
        if (!token) {
            message.error('Mã xác thực không hợp lệ hoặc đã bị thiếu!');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/auth/reset-password', {
                token: token,
                newPassword: values.password
            });

            if (response.success) {
                message.success(response.message || 'Khôi phục mật khẩu thành công!');
                navigate('/login'); // Đổi xong chuyển về trang Login
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Khôi phục mật khẩu thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            {/* BANNER BÊN TRÁI */}
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

                <div style={{ maxWidth: 480, zIndex: 1 }}>
                    <div style={{ fontSize: '42px', fontWeight: '900', color: '#ffffff', letterSpacing: '2px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: '24px' }}>
                            JN
                        </div>
                        JOBSNOW
                    </div>
                    <Title level={2} style={{ color: '#ffffff', fontWeight: '700', lineHeight: 1.4, marginBottom: '20px' }}>
                        Bảo mật tài khoản<br />luôn là ưu tiên hàng đầu.
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: 1.6, display: 'block' }}>
                        Tạo mật khẩu mới đủ độ phức tạp để bảo vệ toàn bộ dữ liệu ứng tuyển và thông tin cá nhân của bạn.
                    </Text>
                </div>
            </Col>

            {/* FORM THIẾT LẬP MẬT KHẨU BÊN PHẢI */}
            <Col xs={24} md={14} lg={12} xl={10} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px' }}>
                <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
                    <div style={{ marginBottom: '36px' }}>
                        <Title level={2} style={{ color: headingColor, margin: '0 0 8px 0', fontWeight: '800' }}>
                            Đặt lại mật khẩu 🔑
                        </Title>
                        <Text style={{ color: textColor, fontSize: 15 }}>
                            Vui lòng nhập mật khẩu mới đủ bảo mật cho tài khoản của bạn.
                        </Text>
                    </div>

                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            label={<span style={{ fontWeight: 600, color: headingColor, fontSize: '14px' }}>Mật khẩu mới</span>}
                            name="password"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                { min: 6, message: 'Mật khẩu phải dài từ 6 ký tự trở lên!' }
                            ]}
                            style={{ marginBottom: 20 }}
                        >
                            <Input.Password
                                className="custom-input"
                                size="large"
                                placeholder="Tối thiểu 6 ký tự"
                                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />}
                                style={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={{ fontWeight: 600, color: headingColor, fontSize: '14px' }}>Xác nhận Mật khẩu mới</span>}
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
                            style={{ marginBottom: 32 }}
                        >
                            <Input.Password
                                className="custom-input"
                                size="large"
                                placeholder="Nhập lại mật khẩu mới"
                                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 18 }} />}
                                style={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 24 }}>
                            <Button
                                className="primary-btn-hover"
                                type="primary"
                                size="large"
                                htmlType="submit"
                                loading={loading}
                                block
                                icon={<CheckCircleOutlined />}
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
                                Xác Nhận Đổi Mật Khẩu
                            </Button>
                        </Form.Item>

                        <div style={{ textAlign: 'center' }}>
                            <Button
                                className="hover-link"
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/login')}
                                style={{ color: textColor, fontWeight: 600, fontSize: '14px' }}
                            >
                                Quay lại Đăng nhập
                            </Button>
                        </div>
                    </Form>
                </div>
            </Col>

            {/* CSS HIỆU ỨNG HOVER & NÂNG CẤP GIAO DIỆN */}
            <style>{`
                .primary-btn-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.4) !important;
                    background-color: #0958d9 !important;
                }
                .custom-input:hover, .custom-input:focus {
                    border-color: #1677ff !important;
                    background-color: #ffffff !important;
                    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1) !important;
                }
                .hover-link:hover {
                    color: #1677ff !important;
                    background: transparent !important;
                }
            `}</style>
        </Row>
    );
};

export default ResetPassword;