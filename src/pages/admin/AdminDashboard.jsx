import React from 'react';
import { Alert, Timeline, Row, Col, Card, Statistic } from 'antd';
import { SafetyCertificateOutlined, ApartmentOutlined, CheckSquareOutlined, AppstoreOutlined } from '@ant-design/icons';

const AdminDashboard = () => {
    return (
        <div>
            <h2 style={{ marginBottom: 24 }}>👑 Hệ thống quản trị JobsNow Admin</h2>
            
            <Alert 
                message="Hệ thống cần chú ý!" 
                description="Bạn đang có 5 Doanh nghiệp mới và 12 Chiến dịch tuyển dụng đang chờ phê duyệt." 
                type="warning" 
                showIcon 
                style={{ marginBottom: 24 }} 
            />

            {/* Các thẻ Thống kê nhanh */}
            <Row gutter={16} style={{ marginBottom: 32 }}>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic title="Doanh nghiệp chờ duyệt" value={5} prefix={<ApartmentOutlined style={{ color: '#fa8c16' }} />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic title="Chiến dịch chờ duyệt" value={12} prefix={<CheckSquareOutlined style={{ color: '#1890ff' }} />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic title="Ngành nghề hệ thống" value={34} prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic title="Tài khoản an toàn" value={1204} prefix={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />} />
                    </Card>
                </Col>
            </Row>
            
            <h3 style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>🔔 Nhật ký hệ thống gần đây:</h3>
            <Timeline style={{ marginTop: 20 }}>
                <Timeline.Item color="orange"><b>Công ty FPT Software</b> vừa tạo chiến dịch tuyển dụng mới. Đang chờ duyệt. (10 phút trước)</Timeline.Item>
                <Timeline.Item color="orange"><b>TMA Solutions</b> vừa đăng ký hồ sơ doanh nghiệp. Đang chờ xác minh mã số thuế. (30 phút trước)</Timeline.Item>
                <Timeline.Item color="green">Quản trị viên đã thêm mới <b>Ngành nghề: Trí tuệ nhân tạo (AI)</b> vào danh mục. (2 giờ trước)</Timeline.Item>
                <Timeline.Item color="blue">Đặng Quốc Duy vừa đăng ký tài khoản Ứng viên mới. (Hôm qua)</Timeline.Item>
            </Timeline>
        </div>
    );
};

export default AdminDashboard;