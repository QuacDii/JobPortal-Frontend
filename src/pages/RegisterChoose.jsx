import React from 'react';
import { Card, Row, Col, Button, Typography } from 'antd';
import { UserOutlined, ShopOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './css/RegisterChoose.css';

const { Title, Paragraph, Text } = Typography;

const RegisterChoose = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: 20 }}>
            <Card style={{ maxWidth: 760, width: '100%', borderRadius: 20, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', padding: '20px 10px' }}>
                
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#1677ff', letterSpacing: '1px', marginBottom: '8px' }}>
                        JOBSNOW
                    </div>
                    <Title level={2} style={{ color: '#0f172a', margin: 0, fontWeight: '800' }}>
                        TẠO TÀI KHOẢN MỚI
                    </Title>
                    <Paragraph style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
                        Vui lòng lựa chọn loại tài khoản phù hợp với nhu cầu của bạn
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]}>
                    {/* LỰA CHỌN 1: ỨNG VIÊN */}
                    <Col xs={24} sm={12}>
                        <div 
                            className="role-card choice-candidate"
                            onClick={() => navigate('/register/candidate')}
                        >
                            <div className="icon-wrapper candidate-icon">
                                <UserOutlined />
                            </div>
                            <Title level={4} style={{ color: '#0f172a', margin: '0 0 8px 0', fontWeight: '700' }}>
                                Tôi là Ứng viên
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '13.5px', minHeight: 42, marginBottom: 20, lineHeight: 1.5 }}>
                                Tìm kiếm hàng ngàn cơ hội việc làm hấp dẫn, tạo CV chuyên nghiệp và ứng tuyển nhanh chóng.
                            </Paragraph>
                            <Button 
                                type="primary" 
                                block 
                                icon={<ArrowRightOutlined />}
                                iconPosition="end"
                                className="btn-role btn-candidate"
                            >
                                Đăng ký Tìm việc
                            </Button>
                        </div>
                    </Col>

                    {/* LỰA CHỌN 2: NHÀ TUYỂN DỤNG */}
                    <Col xs={24} sm={12}>
                        <div 
                            className="role-card choice-employer"
                            onClick={() => navigate('/register/employer')}
                        >
                            <div className="icon-wrapper employer-icon">
                                <ShopOutlined />
                            </div>
                            <Title level={4} style={{ color: '#0f172a', margin: '0 0 8px 0', fontWeight: '700' }}>
                                Tôi là Nhà tuyển dụng
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '13.5px', minHeight: 42, marginBottom: 20, lineHeight: 1.5 }}>
                                Đăng tin tuyển dụng hiệu quả, tìm kiếm ứng viên tiềm năng và quản lý chiến dịch thông minh.
                            </Paragraph>
                            <Button 
                                type="primary" 
                                block 
                                icon={<ArrowRightOutlined />}
                                iconPosition="end"
                                className="btn-role btn-employer"
                            >
                                Đăng ký Tuyển dụng
                            </Button>
                        </div>
                    </Col>
                </Row>

                <div style={{ textAlign: 'center', marginTop: 36 }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/login')} 
                        style={{ color: '#64748b', fontWeight: 600 }}
                        className="hover-back-btn"
                    >
                        Quay lại trang Đăng nhập
                    </Button>
                </div>

            </Card>
        </div>
    );
};

export default RegisterChoose;