import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const { Title, Text } = Typography;

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/auth/forgot-password', { email: values.email });
            if (response.data.success) {
                message.success(response.data.message);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#141414' }}>
            <Card style={{ width: 420, borderRadius: 12, border: '1px solid #303030', background: '#1f1f1f', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: '#1890ff', margin: 0 }}>QUÊN MẬT KHẨU</Title>
                    <Text style={{ color: '#8c8c8c' }}>Nhập email hệ thống để nhận liên kết đặt lại mật khẩu</Text>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập đúng định dạng Email!' }]}>
                        <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập tài khoản Email của bạn" size="large" style={{ background: '#141414', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: '#1890ff', borderColor: '#1890ff' }}>
                            Gửi Yêu Cầu Khôi Phục
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} style={{ color: '#8c8c8c', padding: 0 }}>
                        Quay lại Đăng nhập
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ForgotPassword;