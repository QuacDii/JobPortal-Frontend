import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Modal, Spin } from 'antd';
import { MailOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/apiClient';
import './css/VerifyEmail.css';

const { Title, Text } = Typography;

const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        return {
            userId: decoded.nameid || decoded.maUser || decoded.id || decoded.sub,
            email: decoded.email || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || '',
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            isEmailVerified: decoded.isEmailVerified === 'true' || decoded.isEmailVerified === true
        };
    } catch (error) {
        return null;
    }
};

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);

    const [userEmail, setUserEmail] = useState(userInfo?.email || '');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // 🌟 1. CHUYỂN HƯỚNG BỎ QUA NẾU LÀ ADMIN HOẶC ĐÃ XÁC THỰC
    useEffect(() => {
        if (userInfo) {
            if (userInfo.role === "0") {
                message.info('Tài khoản Quản trị viên không cần xác thực Email!');
                navigate('/admin/dashboard');
            } else if (userInfo.isEmailVerified) {
                message.info('Tài khoản của bạn đã được xác thực Email trước đó!');
                navigate(userInfo.role === "1" ? '/employer/dashboard' : '/manage-cv');
            }
        }
    }, []);

    // Đếm ngược 60s cho nút gửi lại mã OTP
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    // Lấy thông tin Email thực tế từ Profile nếu token mang Email Facebook ảo
    useEffect(() => {
        if (userInfo?.userId) {
            apiClient.get(`/User/profile/${userInfo.userId}`)
                .then(res => {
                    const data = res.data || res;
                    if (data?.email) {
                        setUserEmail(data.email);
                        form.setFieldsValue({ email: data.email });
                    }
                })
                .catch(() => {});
        }
    }, [userInfo?.userId, form]);

    // GỬI MÃ OTP VỀ EMAIL
    const handleSendOtp = async () => {
        try {
            const values = await form.validateFields(['email']);
            const targetEmail = values.email.trim();

            setIsSendingOtp(true);

            // Nếu email khác email trong Token, tiến hành cập nhật trước
            if (targetEmail !== userInfo?.email && userEmail.endsWith('@facebook.com')) {
                await apiClient.put('/auth/update-email', {
                    userId: parseInt(userInfo.userId),
                    newEmail: targetEmail
                });
            }

            const res = await apiClient.post('/auth/send-otp', { email: targetEmail });
            if (res.success || res.status === 200) {
                message.success('Đã gửi mã OTP 6 số thành công về Email!');
                setOtpSent(true);
                setUserEmail(targetEmail);
                setCountdown(60);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại!';
            message.error(errorMsg);
        } finally {
            setIsSendingOtp(false);
        }
    };

    // XÁC THỰC MÃ OTP
    const handleVerifyOtp = async (values) => {
    if (!values.otpCode || values.otpCode.length < 6) {
        return message.warning('Vui lòng nhập đủ 6 chữ số mã OTP!');
    }

    setIsVerifying(true);
    try {
        const res = await apiClient.post('/auth/verify-otp', {
            email: userEmail,
            otpCode: values.otpCode
        });

        const resData = res?.data !== undefined ? res.data : res;

        if (resData.success || res.status === 200) {
            // Lưu token mới nếu Backend có trả về
            if (resData.token) {
                localStorage.setItem('token', resData.token);
            }

            Modal.success({
                title: 'Xác thực thành công!',
                content: 'Tài khoản của bạn đã được xác nhận Email chính chủ. Dữ liệu hệ thống đã được cập nhật.',
                okText: 'Hoàn tất',
                onOk: () => {
                    try {
                        const tokenToDecode = resData.token || localStorage.getItem('token');
                        const newDecoded = jwtDecode(tokenToDecode);
                        
                        // Đọc linh hoạt cả claim dài và claim ngắn
                        const role = String(
                            newDecoded.role || 
                            newDecoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 
                            newDecoded.vaiTro || 
                            userInfo?.role || 
                            ""
                        );

                        if (role === "1") {
                            window.location.href = '/employer/dashboard'; // Nhà tuyển dụng
                        } else if (role === "0") {
                            window.location.href = '/admin/dashboard'; // Admin
                        } else {
                            window.location.href = '/manage-cv'; // Ứng viên
                        }
                    } catch (e) {
                        window.location.href = '/';
                    }
                }
            });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error?.message || 'Mã OTP không chính xác hoặc đã hết hạn!';
        message.error(errorMsg);
    } finally {
        setIsVerifying(false);
    }
};

    return (
        <div className="verify-email-container">
            <div className="verify-email-card">
                <div className="verify-email-icon-box">
                    <SafetyCertificateOutlined />
                </div>

                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <Title level={3} style={{ color: '#262626', margin: '0 0 8px 0', fontWeight: '700' }}>
                        Xác thực Email tài khoản
                    </Title>
                    <Text style={{ color: '#595959', fontSize: '14px' }}>
                        Nhập Email của bạn để nhận mã OTP xác nhận chính chủ từ JobsNow
                    </Text>
                </div>

                <Form form={form} layout="vertical" onFinish={handleVerifyOtp} initialValues={{ email: userEmail }}>
                    <Form.Item
                        label={<span style={{ fontWeight: 600, color: '#262626' }}>Địa chỉ Email nhận mã</span>}
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập địa chỉ Email!' },
                            { type: 'email', message: 'Email không đúng định dạng!' }
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="VD: nguyenvana@gmail.com"
                            prefix={<MailOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                            disabled={otpSent}
                            addonAfter={
                                <Button
                                    type="text"
                                    disabled={countdown > 0 || isSendingOtp}
                                    onClick={handleSendOtp}
                                    style={{ color: '#1890ff', fontWeight: 600, padding: '0 8px' }}
                                >
                                    {isSendingOtp ? <Spin size="small" /> : countdown > 0 ? `Gửi lại (${countdown}s)` : otpSent ? 'Gửi lại mã' : 'Nhận mã OTP'}
                                </Button>
                            }
                        />
                    </Form.Item>

                    {otpSent && (
                        <Form.Item
                            label={<span style={{ fontWeight: 600, color: '#262626' }}>Mã xác nhận OTP (6 chữ số)</span>}
                            name="otpCode"
                            rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
                            style={{ marginTop: '20px' }}
                        >
                            <Input.OTP
                                size="large"
                                length={6}
                                className="otp-input-large"
                                style={{ width: '100%', justifyContent: 'space-between' }}
                            />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginTop: '32px', marginBottom: '16px' }}>
                        {otpSent ? (
                            <Button
                                type="primary"
                                size="large"
                                block
                                htmlType="submit"
                                loading={isVerifying}
                                className="btn-primary-blue"
                            >
                                Xác nhận OTP
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleSendOtp}
                                loading={isSendingOtp}
                                className="btn-primary-blue"
                            >
                                Gửi mã xác nhận về Email
                            </Button>
                        )}
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate(-1)}
                            style={{ color: '#8c8c8c' }}
                        >
                            Quay lại trang trước
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default VerifyEmail;