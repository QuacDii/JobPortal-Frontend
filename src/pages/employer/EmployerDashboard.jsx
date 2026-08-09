import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Row, Col, Card, Table, Tag, Button, 
    DatePicker, Radio, Space, Typography, Spin, Switch, message, Tooltip, Progress, Result 
} from 'antd';
import { 
    EyeOutlined, EditOutlined, 
    UsergroupAddOutlined, FileDoneOutlined, RiseOutlined, 
    UnlockOutlined, CheckCircleOutlined, PauseCircleOutlined,
    BarChartOutlined, PieChartOutlined, TrophyOutlined, CalendarOutlined,
    LineChartOutlined, ClockCircleOutlined, CloseOutlined, SolutionOutlined,
    ArrowRightOutlined, ExclamationCircleOutlined, MailOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import dayjs from 'dayjs';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const EmployerDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isCompanyApprovedApi, setIsCompanyApprovedApi] = useState(false);

    // 🌟 1. TỰ ĐỘNG GỌI API KIỂM TRA TRẠNG THÁI CÔNG TY TỪ DATABASE
    useEffect(() => {
        apiClient.get('/employer/company')
            .then(res => {
                const data = res?.data || res;
                if (data && (data.trangThai === 1 || data.trangThai === true)) {
                    setIsCompanyApprovedApi(true);
                }
            })
            .catch(() => {});
    }, []);
    
    // Đọc token an toàn
    const token = localStorage.getItem('token');
    let tokenData = {};
    try {
        if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            tokenData = JSON.parse(jsonPayload);
        }
    } catch (e) {}

    const isEmailVerified = Boolean(
        user?.isEmailVerified === true || 
        tokenData.isEmailVerified === 'true' || 
        tokenData.isEmailVerified === true || 
        tokenData.daXacThucEmail === true
    );

    // 🌟 2. ĐỒNG BỘ ĐIỀU KIỆN DUYỆT VỚI ADMINLAYOUT
    const isProfileApproved = isCompanyApprovedApi || Boolean(
        user?.isApproved === true ||
        tokenData.isApproved === true ||
        tokenData.isApproved === 'true' ||
        user?.trangThaiDoanhNghiep === 1 ||
        tokenData.trangThai === 1 ||
        tokenData.companyStatus === 1 ||
        user?.trangThai === 1 ||
        user?.daXacThuc === true
    );

    const canAccessAllFeatures = isEmailVerified && isProfileApproved;

    const [quickFilter, setQuickFilter] = useState('30d');
    const [dateRange, setDateRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);

    const [dashboardData, setDashboardData] = useState({
        summary: {},
        charts: { dailyTrends: [], statusDistribution: [] },
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
                ...rawData,
                charts: {
                    ...rawData?.charts,
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
        if (canAccessAllFeatures && dateRange && dateRange[0] && dateRange[1]) {
            fetchDashboardData(dateRange[0], dateRange[1]);
        } else {
            setLoading(false);
        }
    }, [dateRange, canAccessAllFeatures]);

    // Màn hình khóa nếu thực sự chưa được duyệt
    if (!canAccessAllFeatures) {
        return (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', maxWidth: '600px', margin: '0 auto' }}>
                    <Result
                        icon={
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                backgroundColor: !isEmailVerified ? '#ffe4e6' : '#fef3c7',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                color: !isEmailVerified ? '#e11d48' : '#d97706',
                                marginBottom: '12px'
                            }}>
                                {!isEmailVerified ? <MailOutlined /> : <ClockCircleOutlined />}
                            </div>
                        }
                        title={
                            <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                                {!isEmailVerified && isProfileApproved
                                    ? 'Hồ sơ đã được duyệt nhưng chưa xác thực Email'
                                    : !isEmailVerified
                                    ? 'Cần xác thực Email tài khoản'
                                    : 'Hồ sơ Doanh nghiệp đang chờ kiểm duyệt'
                                }
                            </span>
                        }
                        subTitle={
                            <span style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, display: 'block', margin: '8px 0 20px 0' }}>
                                {!isEmailVerified && isProfileApproved
                                    ? 'Hồ sơ pháp lý doanh nghiệp của bạn đã được Ban quản trị phê duyệt thành công! Vui lòng hoàn tất xác thực OTP Email để kích hoạt toàn bộ báo cáo thống kê.'
                                    : !isEmailVerified
                                    ? 'Bạn cần xác thực mã OTP gửi về Email để mở khóa tính năng Bảng điều khiển và Thống kê tuyển dụng.'
                                    : 'Hồ sơ pháp lý của bạn đã được ghi nhận và đang được Ban quản trị thẩm định. Các báo cáo thống kê sẽ tự động kích hoạt sau khi hồ sơ được duyệt.'
                                }
                            </span>
                        }
                        extra={
                            <Button 
                                type="primary" 
                                size="large"
                                icon={<ArrowRightOutlined />}
                                style={{
                                    height: '46px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    backgroundColor: !isEmailVerified ? '#e11d48' : '#1890ff',
                                    borderColor: !isEmailVerified ? '#e11d48' : '#1890ff',
                                    padding: '0 28px'
                                }}
                                onClick={() => navigate(!isEmailVerified ? '/verify-email' : '/employer/company-profile')}
                            >
                                {!isEmailVerified ? 'Xác thực OTP Email ngay' : 'Kiểm tra hồ sơ xác minh'}
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

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

    const handleToggleStatus = async (maTin) => {
        try {
            const res = await apiClient.patch(`/Employer/jobs/${maTin}/toggle-status`);
            if (res?.data?.success || res?.success) {
                message.success(res?.data?.message || res?.message || "Đã cập nhật trạng thái!");
                fetchDashboardData(dateRange[0], dateRange[1]);
            }
        } catch (error) {
            message.error(error?.response?.data?.message || "Lỗi khi thay đổi trạng thái tin!");
        }
    };

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

    const rawStatusList = dashboardData.charts?.statusDistribution || [];
    const getStatusCount = (keywords) => {
        const found = rawStatusList.find(item => {
            const name = (item.statusName || item.StatusName || '').toLowerCase();
            return keywords.some(kw => name.includes(kw));
        });
        if (!found) return 0;
        return found.count ?? found.Count ?? 0;
    };

    const statusDisplayItems = [
        { name: 'Mới nộp', count: getStatusCount(['chờ duyệt', 'mới']), color: '#faad14', bgColor: '#fffbe6', icon: <ClockCircleOutlined /> },
        { name: 'Đã xem', count: getStatusCount(['đã duyệt', 'đã xem']), color: '#1890ff', bgColor: '#e6f7ff', icon: <SolutionOutlined /> },
        { name: 'Hẹn phỏng vấn', count: getStatusCount(['hẹn phỏng vấn', 'phỏng vấn']), color: '#722ed1', bgColor: '#f9f0ff', icon: <CalendarOutlined /> },
        { name: 'Từ chối', count: getStatusCount(['từ chối']), color: '#ff4d4f', bgColor: '#fff1f0', icon: <CloseOutlined /> },
    ];

    const totalApps = statusDisplayItems.reduce((acc, curr) => acc + curr.count, 0);

    const columns = [
        {
            title: 'Tiêu đề tin tuyển dụng',
            dataIndex: 'tieuDe',
            key: 'tieuDe',
            render: (text, record) => (
                <div>
                    <Text strong style={{ color: '#262626', display: 'block', fontSize: '14px' }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Đăng ngày: {new Date(record.ngayDang).toLocaleDateString('vi-VN')}</Text>
                </div>
            )
        },
        {
            title: 'Lượt xem',
            dataIndex: 'luotXem',
            key: 'luotXem',
            align: 'center',
            render: (val) => <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>{val}</Text>
        },
        {
            title: 'CV Đã nộp',
            dataIndex: 'soCvNop',
            key: 'soCvNop',
            align: 'center',
            render: (val) => <Text style={{ color: '#fa8c16', fontWeight: 'bold' }}>{val}</Text>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            align: 'center',
            render: (status) => {
                if (status === 1) return <Tag color="success" icon={<CheckCircleOutlined />}>Đang hiển thị</Tag>;
                if (status === 2) return <Tag color="warning" icon={<PauseCircleOutlined />}>Đã tạm dừng</Tag>;
                return <Tag color="error">Đã hết hạn</Tag>;
            }
        },
        {
            title: 'Thao tác nhanh',
            key: 'action',
            align: 'center',
            render: (_, record) => {
                const jobId = record.maTin || record.MaTin || record.id || record.Id;
                return (
                    <Space size="small">
                        <Button type="primary" ghost size="small" icon={<EyeOutlined />} onClick={() => navigate(`/employer/candidate-funnel/${jobId}`)} />
                        <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/employer/jobs/${jobId}`)} />
                    </Space>
                );
            }
        }
    ];

    const renderKpiCard = (title, value, icon, color, bgColor, suffix = "") => (
        <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff' }} bodyStyle={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: bgColor, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{icon}</div>
                <div>
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>{title}</Text>
                    <Text strong style={{ fontSize: '20px', color: '#1f1f1f' }}>{value} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{suffix}</span></Text>
                </div>
            </div>
        </Card>
    );

    const summary = dashboardData.summary || {};

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px', color: '#262626' }}>
            <div style={{ maxWidth: 1300, margin: '0 auto' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                        <Col xs={24} md={10}>
                            <Title level={3} style={{ color: '#1f1f1f', margin: 0 }}>📊 Thống kê Tuyển dụng</Title>
                            <Text type="secondary">Phân tích hiệu suất bài đăng và ứng viên thời gian thực</Text>
                        </Col>
                        <Col xs={24} md={14} style={{ textAlign: 'right' }}>
                            <Space wrap style={{ justifyContent: 'flex-end' }}>
                                <Radio.Group value={quickFilter} onChange={handleQuickFilterChange} optionType="button" buttonStyle="solid">
                                    <Radio.Button value="7d">7 ngày qua</Radio.Button>
                                    <Radio.Button value="30d">1 tháng</Radio.Button>
                                    <Radio.Button value="180d">6 tháng qua</Radio.Button>
                                    <Radio.Button value="365d">1 năm</Radio.Button>
                                </Radio.Group>
                                <RangePicker value={dateRange} onChange={handleCustomRangeChange} format="DD/MM/YYYY" />
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tin đang đăng", summary.tinDangDang || 0, <FileDoneOutlined />, "#52c41a", "#f6ffed")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Hồ sơ mới", summary.hoSoMoiChuaDuyet || 0, <UsergroupAddOutlined />, "#faad14", "#fffbe6")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Mở CV còn lại", summary.luotXemCvConLai || 0, <UnlockOutlined />, "#1890ff", "#e6f7ff")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tổng lượt xem", summary.tongLuotXemTin || 0, <EyeOutlined />, "#13c2c2", "#e6fffb")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tổng CV nộp", summary.tongCvNop || 0, <RiseOutlined />, "#fa8c16", "#fff7e6")}</Col>
                    <Col xs={12} sm={8} lg={4}>{renderKpiCard("Tỷ lệ chuyển đổi", summary.tyLeChuyenDoi || 0, <TrophyOutlined />, "#722ed1", "#f9f0ff", "%")}</Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col xs={24}>
                        <Card title="Xu hướng Lượt xem tin tuyển dụng" bordered={false} style={{ borderRadius: '12px' }}>
                            <Line {...viewsChartConfig} height={240} />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default EmployerDashboard;