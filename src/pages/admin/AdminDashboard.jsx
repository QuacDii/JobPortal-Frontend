import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Select, Spin, Alert, Button, Space } from 'antd';
import { 
    ApartmentOutlined, CheckSquareOutlined, DollarCircleOutlined, 
    UserOutlined, ArrowRightOutlined, ReloadOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '../../api/apiClient';

const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + ' đ';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30days');

    // STATE DỮ LIỆU
    const [pendingCompanies, setPendingCompanies] = useState(0);
    const [pendingJobs, setPendingJobs] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);

    const [chartData, setChartData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Tính khoảng ngày dựa vào Select
            const endDate = dayjs().format('YYYY-MM-DD');
            let startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
            if (timeRange === 'today') startDate = dayjs().startOf('day').format('YYYY-MM-DD');
            if (timeRange === '7days') startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

            // Call song song các API Thống kê & Báo cáo
            const [resCompanies, resJobs, resReport, resTx] = await Promise.all([
                apiClient.get('/AdminApproval/pending-companies', { headers }).catch(() => []),
                apiClient.get('/AdminApproval/pending-job-posts', { headers }).catch(() => []),
                apiClient.get(`/Report/dashboard?startDate=${startDate}&endDate=${endDate}`).catch(() => null),
                apiClient.get(`/Report/details?type=revenue&startDate=${startDate}&endDate=${endDate}`).catch(() => [])
            ]);

            // 1. Số lượng duyệt
            const companiesList = resCompanies?.data || resCompanies;
            const jobsList = resJobs?.data || resJobs;
            setPendingCompanies(Array.isArray(companiesList) ? companiesList.length : 0);
            setPendingJobs(Array.isArray(jobsList) ? jobsList.length : 0);

            // 2. Dữ liệu báo cáo tổng quan & Biểu đồ
            const reportData = resReport?.data || resReport;
            if (reportData) {
                setTotalRevenue(reportData?.metrics?.totalRevenue || reportData?.Metrics?.totalRevenue || 0);
                setTotalUsers(reportData?.metrics?.newUsers || reportData?.Metrics?.newUsers || 0);
                setChartData(reportData?.chartData || reportData?.ChartData || []);
            }

            // 3. Giao dịch VIP gần nhất (Lấy 5 dòng đầu)
            const txData = resTx?.data || resTx;
            setRecentTransactions(Array.isArray(txData) ? txData.slice(0, 5) : []);

        } catch (error) {
            console.error("Lỗi tải dữ liệu Dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    // Cấu trúc cột cho bảng Giao dịch gần nhất
    const txColumns = [
        {
            title: 'Khách hàng',
            dataIndex: 'khách_Hàng',
            key: 'khách_Hàng',
            render: (text, record) => text || record.email || 'Khách hàng'
        },
        {
            title: 'Số tiền',
            dataIndex: 'số_Tiền',
            key: 'số_Tiền',
            render: (val) => <b style={{ color: '#1890ff' }}>{formatVND(val)}</b>
        },
        {
            title: 'Cổng TT',
            dataIndex: 'phương_Thức',
            key: 'phương_Thức',
            render: (text) => (
                <Tag color={text?.includes('MOMO') ? 'magenta' : 'geekblue'}>
                    {text || 'VNPay'}
                </Tag>
            )
        }
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Đang tải dữ liệu tổng quan..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* 1. THANH HEADER DÙNG BỘ LỌC THỜI GIAN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>👑 Hệ thống quản trị JobsNow Admin</h2>
                <Space>
                    <Select value={timeRange} onChange={setTimeRange} style={{ width: 150 }}>
                        <Select.Option value="today">Hôm nay</Select.Option>
                        <Select.Option value="7days">7 ngày qua</Select.Option>
                        <Select.Option value="30days">30 ngày qua</Select.Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} />
                </Space>
            </div>

            {/* CẢNH BÁO NẾU CÓ BÀI CHỜ DUYỆT */}
            {(pendingCompanies > 0 || pendingJobs > 0) && (
                <Alert 
                    message="Cần xử lý phê duyệt!" 
                    description={`Hiện đang có ${pendingCompanies} Doanh nghiệp và ${pendingJobs} Tin tuyển dụng đang chờ bạn duyệt.`} 
                    type="warning" 
                    showIcon 
                    action={
                        <Button size="small" type="primary" onClick={() => navigate('/admin/approval')}>
                            Duyệt ngay
                        </Button>
                    }
                    style={{ marginBottom: 24 }} 
                />
            )}

            {/* 2. CÁC THẺ STATISTIC */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable onClick={() => navigate('/admin/approve-companies')}>
                        <Statistic 
                            title="Doanh nghiệp chờ duyệt" 
                            value={pendingCompanies} 
                            prefix={<ApartmentOutlined style={{ color: '#fa8c16' }} />} 
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable onClick={() => navigate('/admin/approve-job-posts')}>
                        <Statistic 
                            title="Chiến dịch chờ duyệt" 
                            value={pendingJobs} 
                            prefix={<CheckSquareOutlined style={{ color: '#1890ff' }} />} 
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable onClick={() => navigate('/admin/reports')}>
                        <Statistic 
                            title="Tổng doanh thu VIP" 
                            value={totalRevenue} 
                            formatter={(val) => formatVND(val)}
                            prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />} 
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable onClick={() => navigate('/admin/users')}>
                        <Statistic 
                            title="Người dùng mới" 
                            value={totalUsers} 
                            prefix={<UserOutlined style={{ color: '#722ed1' }} />} 
                        />
                    </Card>
                </Col>
            </Row>

            {/* 3. BIỂU ĐỒ & BẢNG GIAO DỊCH GẦN ĐÂY */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={15}>
                    <Card 
                        title="📈 Biểu đồ doanh thu & Tăng trưởng" 
                        extra={
                            <Button type="link" onClick={() => navigate('/admin/reports')}>
                                Báo cáo chi tiết <ArrowRightOutlined />
                            </Button>
                        }
                    >
                        <div style={{ height: 320, width: '100%' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" />
                                        <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                                        <Tooltip formatter={(value) => [formatVND(value), "Doanh thu"]} />
                                        <Bar dataKey="revenue" name="Doanh thu (VNĐ)" fill="#1890ff" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8c8c8c' }}>
                                    Chưa có dữ liệu doanh thu trong khoảng thời gian chọn.
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={9}>
                    <Card 
                        title="💳 Giao dịch VIP mới nhất"
                        extra={
                            <Button type="link" onClick={() => navigate('/admin/reports')}>
                                Xem tất cả
                            </Button>
                        }
                    >
                        <Table 
                            dataSource={recentTransactions} 
                            columns={txColumns} 
                            rowKey={(r) => r.ID || r.Mã_GD || Math.random()} 
                            pagination={false} 
                            size="small" 
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;