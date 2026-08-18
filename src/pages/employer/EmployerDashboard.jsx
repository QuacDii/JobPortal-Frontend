import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Row, Col, Card, Table, Tag, Button, 
    DatePicker, Radio, Space, Typography, message, Tooltip 
} from 'antd';
import { 
    EyeOutlined, UsergroupAddOutlined, FileDoneOutlined, RiseOutlined, 
    UnlockOutlined, CheckCircleOutlined, PauseCircleOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import dayjs from 'dayjs';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const EmployerDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quickFilter, setQuickFilter] = useState('30d');
    const [dateRange, setDateRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
    const [dashboardData, setDashboardData] = useState({
        summary: {},
        charts: { dailyTrends: [] },
        topJobs: []
    });

    const fetchDashboardData = async (start, end) => {
        setLoading(true);
        try {
            const startDateStr = start.format('YYYY-MM-DD');
            const endDateStr = end.format('YYYY-MM-DD');
            
            const response = await apiClient.get(
                `/employer/dashboard/analytics?startDate=${startDateStr}&endDate=${endDateStr}`
            );
            const rawData = response?.data?.data || response?.data || response;
            const rawTrends = rawData?.charts?.dailyTrends || rawData?.Charts?.DailyTrends || [];
            
            const normalizedTrends = rawTrends.map(item => ({
                date: String(item.date || item.Date || ''),
                views: Number(item.views ?? item.Views ?? 0),
                applications: Number(item.applications ?? item.Applications ?? 0)
            }));

            const rawTopJobs = rawData?.topJobs || rawData?.TopJobs || [];
            const normalizedTopJobs = rawTopJobs.map(item => ({
                ...item,
                maTin: item.maTin || item.MaTin || item.id || item.Id,
                tieuDe: item.tieuDe || item.TieuDe || item.title || 'Chưa có tiêu đề',
                luotXem: Number(item.luotXem ?? item.LuotXem ?? 0),
                soCvNop: Number(item.soCvNop ?? item.SoCvNop ?? 0),
                trangThai: item.trangThai ?? item.TrangThai ?? 1,
                ngayDang: item.ngayDang || item.NgayDang || new Date()
            }));

            setDashboardData({
                summary: rawData?.summary || rawData?.Summary || {},
                charts: {
                    dailyTrends: normalizedTrends
                },
                topJobs: normalizedTopJobs
            });
        } catch (error) {
            console.error("Lỗi tải Dashboard:", error);
            message.error("Không thể tải số liệu thống kê dashboard!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateRange && dateRange[0] && dateRange[1]) {
            fetchDashboardData(dateRange[0], dateRange[1]);
        }
    }, [dateRange]);

    const handleQuickFilterChange = (e) => {
        const val = e.target.value;
        setQuickFilter(val);
        const now = dayjs();
        if (val === '7d') setDateRange([now.subtract(6, 'day'), now]);
        else if (val === '30d') setDateRange([now.subtract(29, 'day'), now]);
        else if (val === '180d') setDateRange([now.subtract(179, 'day'), now]);
        else if (val === '365d') setDateRange([now.subtract(364, 'day'), now]);
    };

    const handleCustomRangeChange = (dates) => {
        if (dates) {
            setQuickFilter('custom');
            setDateRange(dates);
        }
    };

    // Cấu hình Biểu đồ Lượt xem tin
    const viewsChartConfig = {
        data: dashboardData.charts?.dailyTrends || [],
        xField: 'date',
        yField: 'views',
        color: '#1890ff',
        smooth: true,
        meta: {
            date: { alias: 'Thời gian' },
            views: { alias: 'Lượt xem tin', formatter: (v) => `${v} lượt` }
        },
        point: { size: 4, shape: 'circle', style: { fill: '#fff', stroke: '#1890ff', lineWidth: 2 } },
        xAxis: { label: { style: { fill: '#595959', fontSize: 11 } } },
        yAxis: { min: 0, minInterval: 1 }
    };

    // Cấu hình Biểu đồ Lượt nộp CV
    const appsChartConfig = {
        data: dashboardData.charts?.dailyTrends || [],
        xField: 'date',
        yField: 'applications',
        color: '#52c41a',
        smooth: true,
        meta: {
            date: { alias: 'Thời gian' },
            applications: { alias: 'Lượt nộp CV', formatter: (v) => `${v} hồ sơ` }
        },
        point: { size: 4, shape: 'circle', style: { fill: '#fff', stroke: '#52c41a', lineWidth: 2 } },
        xAxis: { label: { style: { fill: '#595959', fontSize: 11 } } },
        yAxis: { min: 0, minInterval: 1 }
    };

    // Bảng Top tin tuyển dụng - Chỉ mang tính chất hiển thị thống kê
    const columns = [
        {
            title: 'Hạng',
            key: 'rank',
            width: 70,
            align: 'center',
            render: (_, __, index) => {
                const colors = ['#f5222d', '#fa8c16', '#faad14'];
                return index < 3 ? (
                    <Tag color={colors[index]} style={{ borderRadius: '50%', width: 24, height: 24, padding: 0, textAlign: 'center', lineHeight: '22px', fontWeight: 'bold' }}>
                        {index + 1}
                    </Tag>
                ) : (
                    <Text strong style={{ color: '#8c8c8c' }}>{index + 1}</Text>
                );
            }
        },
        {
            title: 'Tiêu đề chiến dịch / Tin tuyển dụng',
            dataIndex: 'tieuDe',
            key: 'tieuDe',
            render: (text, record) => (
                <div>
                    <Text strong style={{ color: '#0f172a', display: 'block', fontSize: '14px' }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Đăng ngày: {new Date(record.ngayDang).toLocaleDateString('vi-VN')}</Text>
                </div>
            )
        },
        {
            title: 'Lượt xem',
            dataIndex: 'luotXem',
            key: 'luotXem',
            align: 'center',
            width: 130,
            render: (val) => <Text style={{ color: '#1890ff', fontWeight: 'bold', fontSize: 15 }}>{val}</Text>
        },
        {
            title: 'CV đã nộp',
            dataIndex: 'soCvNop',
            key: 'soCvNop',
            align: 'center',
            width: 130,
            render: (val) => <Text style={{ color: '#fa8c16', fontWeight: 'bold', fontSize: 15 }}>{val}</Text>
        },
        {
            title: 'Tỷ lệ ứng tuyển',
            key: 'conversion',
            align: 'center',
            width: 140,
            render: (_, record) => {
                const rate = record.luotXem > 0 ? ((record.soCvNop / record.luotXem) * 100).toFixed(1) : 0;
                return <Text strong style={{ color: '#52c41a' }}>{rate}%</Text>;
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            align: 'center',
            width: 140,
            render: (status) => {
                if (status === 1) return <Tag color="success" icon={<CheckCircleOutlined />}>Đang hiển thị</Tag>;
                if (status === 2) return <Tag color="warning" icon={<PauseCircleOutlined />}>Đã tạm dừng</Tag>;
                return <Tag color="error">Đã đóng</Tag>;
            }
        },
        {
            title: 'Phễu ứng viên',
            key: 'action',
            align: 'center',
            width: 120,
            render: (_, record) => {
                const jobId = record.maTin || record.MaTin || record.id || record.Id;
                return (
                    <Tooltip title="Xem danh sách ứng viên đã nộp">
                        <Button 
                            type="primary" 
                            ghost 
                            size="small" 
                            icon={<EyeOutlined />} 
                            onClick={() => navigate(`/employer/candidate-funnel/${jobId}`)}
                            style={{ borderRadius: 6 }}
                        >
                            Xem phễu
                        </Button>
                    </Tooltip>
                );
            }
        }
    ];

    const renderKpiCard = (title, value, icon, color, bgColor, suffix = "") => (
        <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', height: '100%' }} bodyStyle={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: bgColor, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {icon}
                </div>
                <div>
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>{title}</Text>
                    <Text strong style={{ fontSize: '20px', color: '#1f1f1f' }}>{value} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{suffix}</span></Text>
                </div>
            </div>
        </Card>
    );

    const summary = dashboardData.summary || {};

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px', color: '#262626' }}>
            <div style={{ maxWidth: 1300, margin: '0 auto' }}>
                
                {/* BỘ LỌC THỜI GIAN */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                        <Col xs={24} md={10}>
                            <Title level={3} style={{ color: '#1f1f1f', margin: 0 }}>📊 Thống kê Tuyển dụng</Title>
                            <Text type="secondary">Hiệu suất bài đăng và lưu lượng ứng viên theo thời gian thực</Text>
                        </Col>
                        <Col xs={24} md={14} style={{ textAlign: 'right' }}>
                            <Space wrap style={{ justifyContent: 'flex-end' }}>
                                <Radio.Group value={quickFilter} onChange={handleQuickFilterChange} optionType="button" buttonStyle="solid">
                                    <Radio.Button value="7d">7 ngày</Radio.Button>
                                    <Radio.Button value="30d">30 ngày</Radio.Button>
                                    <Radio.Button value="180d">6 tháng</Radio.Button>
                                    <Radio.Button value="365d">1 năm</Radio.Button>
                                </Radio.Group>
                                <RangePicker value={dateRange} onChange={handleCustomRangeChange} format="DD/MM/YYYY" />
                            </Space>
                        </Col>
                    </Row>
                </div>

                {/* KHỐI KPI */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tin đang đăng", summary.tinDangDang || 0, <FileDoneOutlined />, "#52c41a", "#f6ffed")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Hồ sơ mới", summary.hoSoMoiChuaDuyet || 0, <UsergroupAddOutlined />, "#faad14", "#fffbe6")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Mở CV còn lại", summary.luotXemCvConLai || 0, <UnlockOutlined />, "#1890ff", "#e6f7ff")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tổng lượt xem", summary.tongLuotXemTin || 0, <EyeOutlined />, "#13c2c2", "#e6fffb")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tổng CV nộp", summary.tongCvNop || 0, <RiseOutlined />, "#fa8c16", "#fff7e6")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tỷ lệ chuyển đổi", summary.tyLeChuyenDoi || 0, <TrophyOutlined />, "#722ed1", "#f9f0ff", "%")}</Col>
                </Row>

                {/* 1. XU HƯỚNG LƯỢT XEM TIN (100% WIDTH) */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={24}>
                        <Card title="📈 Xu hướng Lượt xem tin tuyển dụng" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <Line {...viewsChartConfig} height={250} />
                        </Card>
                    </Col>
                </Row>

                {/* 2. XU HƯỚNG LƯỢT NỘP CV (100% WIDTH) */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={24}>
                        <Card title="📥 Xu hướng Lượt nộp hồ sơ (CV)" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <Line {...appsChartConfig} height={250} />
                        </Card>
                    </Col>
                </Row>

                {/* 3. TOP TIN TUYỂN DỤNG THU HÚT NHẤT (100% WIDTH) */}
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Card title="🏆 Top tin tuyển dụng thu hút nhiều ứng viên nhất" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <Table 
                                columns={columns} 
                                dataSource={dashboardData.topJobs} 
                                rowKey="maTin" 
                                pagination={false}
                                loading={loading}
                                locale={{ emptyText: 'Chưa có dữ liệu bài đăng trong khoảng thời gian này.' }}
                            />
                        </Card>
                    </Col>
                </Row>

            </div>
        </div>
    );
};

export default EmployerDashboard;