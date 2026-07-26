import React, { useEffect, useState } from 'react';
import { Alert, Row, Col, Card, Statistic, Spin } from 'antd';
import { SafetyCertificateOutlined, ApartmentOutlined, CheckSquareOutlined, AppstoreOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const AdminDashboard = () => {
    const [pendingCompanyCount, setPendingCompanyCount] = useState(0);
    const [pendingCampaignCount, setPendingCampaignCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Khớp chính xác route /pending-job-posts từ Backend
            const [resCompanies, resCampaigns] = await Promise.all([
                apiClient.get('/AdminApproval/pending-companies', { headers }),
                apiClient.get('/AdminApproval/pending-job-posts', { headers })
            ]);

            const companiesData = resCompanies?.data || resCompanies;
            const campaignsData = resCampaigns?.data || resCampaigns;

            setPendingCompanyCount(Array.isArray(companiesData) ? companiesData.length : 0);
            setPendingCampaignCount(Array.isArray(campaignsData) ? campaignsData.length : 0);
        } catch (error) {
            console.error("Lỗi tải thống kê Admin:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

    return (
        <div>
            <h2 style={{ marginBottom: 24 }}>👑 Hệ thống quản trị JobsNow Admin</h2>
            
            {(pendingCompanyCount > 0 || pendingCampaignCount > 0) && (
                <Alert 
                    message="Hệ thống cần chú ý!" 
                    description={`Bạn đang có ${pendingCompanyCount} Doanh nghiệp mới và ${pendingCampaignCount} Tin/Chiến dịch tuyển dụng đang chờ phê duyệt.`} 
                    type="warning" 
                    showIcon 
                    style={{ marginBottom: 24 }} 
                />
            )}

            <Row gutter={16} style={{ marginBottom: 32 }}>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic 
                            title="Doanh nghiệp chờ duyệt" 
                            value={pendingCompanyCount} 
                            prefix={<ApartmentOutlined style={{ color: '#fa8c16' }} />} 
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic 
                            title="Chiến dịch chờ duyệt" 
                            value={pendingCampaignCount} 
                            prefix={<CheckSquareOutlined style={{ color: '#1890ff' }} />} 
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic title="Ngành nghề hệ thống" value={55} prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic title="Tài khoản an toàn" value={1204} prefix={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;