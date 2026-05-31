import React from 'react';
import { Statistic, Row, Col, Card } from 'antd';
import { FileTextOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';

const EmployerDashboard = () => {
    return (
        <div>
            <h2>📊 Báo cáo phân tích tuyển dụng</h2>
            <Row gutter={16} style={{ marginTop: 20 }}>
                <Col span={8}>
                    <Card><Statistic title="Tin đang đăng" value={4} prefix={<FileTextOutlined />} valueStyle={{ color: '#3f8600' }} /></Card>
                </Col>
                <Col span={8}>
                    <Card><Statistic title="Hồ sơ ứng tuyển mới" value={12} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} /></Card>
                </Col>
                <Col span={8}>
                    <Card><Statistic title="Lượt xem CV còn lại" value={0} prefix={<EyeOutlined />} valueStyle={{ color: '#cf1322' }} /></Card>
                </Col>
            </Row>
        </div>
    );
};

export default EmployerDashboard;