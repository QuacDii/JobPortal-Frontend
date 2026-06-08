import React from 'react';
import { Card, Row, Col, Button, Typography } from 'antd';
import { UserOutlined, ShopOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const RegisterChoose = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#141414', padding: 20 }}>
            <Card style={{ width: 700, borderRadius: 16, background: '#1f1f1f', border: '1px solid #303030', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                
                <div style={{ textAlign: 'center', marginBottom: 35 }}>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>CHÀO MỪNG BẠN ĐẾN VỚI JOBSNOW</Title>
                    <Paragraph style={{ color: '#8c8c8c', marginTop: 5, fontSize: 15 }}>Vui lòng chọn loại tài khoản phù hợp với mục tiêu của bạn</Paragraph>
                </div>

                <Row gutter={24}>
                    {/* LỰA CHỌN 1: ỨNG VIÊN */}
                    <Col span={12}>
                        <Card 
                            hoverable 
                            style={{ background: '#141414', border: '1px solid #303030', textAlign: 'center', borderRadius: 12 }}
                            onClick={() => navigate('/register/candidate')}
                        >
                            <UserOutlined style={{ fontSize: 50, color: '#1890ff', marginBottom: 15 }} />
                            <Title level={4} style={{ color: '#fff', margin: 0 }}>Tôi là Ứng viên</Title>
                            <Paragraph style={{ color: '#8c8c8c', marginTop: 8, height: 45 }}>Tìm kiếm hàng ngàn cơ hội việc làm và xây dựng CV chuyên nghiệp.</Paragraph>
                            <Button type="primary" block style={{ marginTop: 10, fontWeight: '500' }}>Đăng ký tìm việc</Button>
                        </Card>
                    </Col>

                    {/* LỰA CHỌN 2: NHÀ TUYỂN DỤNG */}
                    <Col span={12}>
                        <Card 
                            hoverable 
                            style={{ background: '#141414', border: '1px solid #303030', textAlign: 'center', borderRadius: 12 }}
                            onClick={() => navigate('/register/employer')}
                        >
                            <ShopOutlined style={{ fontSize: 50, color: '#52c41a', marginBottom: 15 }} />
                            <Title level={4} style={{ color: '#fff', margin: 0 }}>Tôi là Nhà tuyển dụng</Title>
                            <Paragraph style={{ color: '#8c8c8c', marginTop: 8, height: 45 }}>Đăng tin tuyển dụng, tìm kiếm nhân tài và quản lý chiến dịch hiệu quả.</Paragraph>
                            <Button type="primary" color="success" variant="solid" block style={{ marginTop: 10, fontWeight: '500', background: '#52c41a', border: '#52c41a' }}>Đăng tin tuyển dụng</Button>
                        </Card>
                    </Col>
                </Row>

                <div style={{ textAlign: 'center', marginTop: 30 }}>
                    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} style={{ color: '#8c8c8c' }}>
                        Quay lại trang Đăng nhập
                    </Button>
                </div>

            </Card>
        </div>
    );
};

export default RegisterChoose;