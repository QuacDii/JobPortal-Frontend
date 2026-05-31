import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';

const { Title, Text } = Typography;

const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Lấy chuỗi mã token từ thanh địa chỉ url

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

            if (response.data.success) {
                message.success(response.data.message);
                navigate('/login'); // Đổi xong đá về trang Login ngay
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Khôi phục mật khẩu thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#141414' }}>
            <Card style={{ width: 420, borderRadius: 12, border: '1px solid #303030', background: '#1f1f1f', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: '#52c41a', margin: 0 }}>THIẾT LẬP MẬT KHẨU MỚI</Title>
                    <Text style={{ color: '#8c8c8c' }}>Vui lòng nhập mật khẩu mới bảo mật cao cho tài khoản</Text>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }, { min: 6, message: 'Mật khẩu phải dài từ 6 ký tự trở lên!' }]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mật khẩu mới bảo mật" size="large" style={{ background: '#141414', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item name="confirmPassword" dependencies={['password']} hasFeedback rules={[{ required: true, message: 'Vui lòng xác nhận lại mật khẩu!' }, ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp!'));
                            },
                        })]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập lại mật khẩu mới để xác nhận" size="large" style={{ background: '#141414', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ fontWeight: 'bold', background: '#52c41a', borderColor: '#52c41a' }}>
                            Xác Nhận Đổi Mật Khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ResetPassword;