import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Row, Col, Card, Table, Tag, Button, 
    DatePicker, Radio, Space, Typography, Spin, Switch, message, Tooltip, Progress 
} from 'antd';
import { 
    EyeOutlined, EditOutlined, 
    UsergroupAddOutlined, FileDoneOutlined, RiseOutlined, 
    UnlockOutlined, CheckCircleOutlined, PauseCircleOutlined,
    BarChartOutlined, PieChartOutlined, TrophyOutlined, CalendarOutlined,
    LineChartOutlined, ClockCircleOutlined, CloseOutlined, SolutionOutlined
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

            // 1. Chuẩn hóa DailyTrends
            const rawTrends = rawData?.charts?.dailyTrends || rawData?.Charts?.DailyTrends || [];
            const normalizedTrends = rawTrends.map(item => ({
                date: String(item.date || item.Date || ''),
                views: Number(item.views ?? item.Views ?? 0),
                applications: Number(item.applications ?? item.Applications ?? 0)
            }));

            // 2. Chuẩn hóa TopJobs & lấy ID an toàn
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

    // --- BIỂU ĐỒ 1: LƯỢT XEM TIN ---
    const viewsChartConfig = {
        data: dashboardData.charts?.dailyTrends || [],
        xField: 'date',
        yField: 'views',
        color: '#1890ff',
        smooth: true,
        meta: {
            date: { alias: 'Thời gian' },
            views: { 
                alias: 'Lượt xem tin',
                formatter: (v) => `${v} lượt`
            }
        },
        point: {
            size: 4,
            shape: 'circle',
            style: { fill: '#fff', stroke: '#1890ff', lineWidth: 2 },
            state: { active: { style: { r: 6, fill: '#1890ff' } } }
        },
        xAxis: {
            label: {
                autoHide: false,
                autoRotate: false,
                style: { fill: '#595959', fontSize: 11 }
            }
        },
        yAxis: {
            min: 0,
            minInterval: 1,
            grid: { line: { style: { stroke: '#f5f5f5', lineDash: [4, 4] } } }
        },
        tooltip: {
            showCrosshairs: true,
            formatter: (val) => {
                return { 
                    name: 'Lượt xem tin', 
                    value: `${val ?? 0} lượt` 
                };
            },
            items: [
                { channel: 'y', name: 'Lượt xem tin', valueFormatter: (v) => `${v} lượt` }
            ]
        }
    };

    // --- BIỂU ĐỒ 2: LƯỢT NỘP CV ---
    const appsChartConfig = {
        data: dashboardData.charts?.dailyTrends || [],
        xField: 'date',
        yField: 'applications',
        color: '#52c41a',
        smooth: true,
        meta: {
            date: { alias: 'Thời gian' },
            applications: { 
                alias: 'Lượt nộp CV',
                formatter: (v) => `${v} hồ sơ`
            }
        },
        point: {
            size: 4,
            shape: 'circle',
            style: { fill: '#fff', stroke: '#52c41a', lineWidth: 2 },
            state: { active: { style: { r: 6, fill: '#52c41a' } } }
        },
        xAxis: {
            label: {
                autoHide: false,
                autoRotate: false,
                style: { fill: '#595959', fontSize: 11 }
            }
        },
        yAxis: {
            min: 0,
            minInterval: 1,
            grid: { line: { style: { stroke: '#f5f5f5', lineDash: [4, 4] } } }
        },
        tooltip: {
            showCrosshairs: true,
            formatter: (val) => {
                return { 
                    name: 'Lượt nộp CV', 
                    value: `${val ?? 0} hồ sơ` 
                };
            },
            items: [
                { channel: 'y', name: 'Lượt nộp CV', valueFormatter: (v) => `${v} hồ sơ` }
            ]
        }
    };

    // --- XỬ LÝ DỮ LIỆU TRẠNG THÁI HỒ SƠ ---
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
        { 
            name: 'Mới nộp', 
            count: getStatusCount(['chờ duyệt', 'mới']), 
            color: '#faad14', 
            bgColor: '#fffbe6',
            icon: <ClockCircleOutlined /> 
        },
        { 
            name: 'Đã xem', 
            count: getStatusCount(['đã duyệt', 'đã xem']), 
            color: '#1890ff', 
            bgColor: '#e6f7ff',
            icon: <SolutionOutlined /> 
        },
        { 
            name: 'Hẹn phỏng vấn', 
            count: getStatusCount(['hẹn phỏng vấn', 'phỏng vấn']), 
            color: '#722ed1', 
            bgColor: '#f9f0ff',
            icon: <CalendarOutlined /> 
        },
        { 
            name: 'Từ chối', 
            count: getStatusCount(['từ chối']), 
            color: '#ff4d4f', 
            bgColor: '#fff1f0',
            icon: <CloseOutlined /> 
        },
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
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Đăng ngày: {new Date(record.ngayDang).toLocaleDateString('vi-VN')}
                    </Text>
                </div>
            )
        },
        {
            title: 'Lượt xem',
            dataIndex: 'luotXem',
            key: 'luotXem',
            align: 'center',
            sorter: (a, b) => a.luotXem - b.luotXem,
            render: (val) => <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>{val}</Text>
        },
        {
            title: 'CV Đã nộp',
            dataIndex: 'soCvNop',
            key: 'soCvNop',
            align: 'center',
            sorter: (a, b) => a.soCvNop - b.soCvNop,
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
                if (status === 3) return <Tag color="error">Đã hết hạn</Tag>;
                return <Tag color="default">Nháp</Tag>;
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
                        {/* 1. Mắt: Chuyển tới trang phễu ứng viên chuẩn Route App.jsx */}
                        <Tooltip title="Xem danh sách ứng viên">
                            <Button 
                                type="primary" 
                                ghost 
                                size="small"
                                icon={<EyeOutlined />} 
                                onClick={() => {
                                    if (!jobId) return message.warning("Không tìm thấy mã tin!");
                                    navigate(`/employer/candidate-funnel/${jobId}`);
                                }} 
                            />
                        </Tooltip>
                        
                        {/* 2. Bút: Chuyển tới chi tiết tin tuyển dụng chuẩn Route App.jsx */}
                        <Tooltip title="Xem chi tiết tin tuyển dụng">
                            <Button 
                                size="small"
                                icon={<EditOutlined />} 
                                onClick={() => {
                                    if (!jobId) return message.warning("Không tìm thấy mã tin!");
                                    navigate(`/employer/jobs/${jobId}`);
                                }} 
                            />
                        </Tooltip>

                        {/* 3. Công tắc: Bật/tắt trạng thái tin tuyển dụng */}
                        <Tooltip title={record.trangThai === 1 ? "Tạm dừng nhận hồ sơ" : "Mở lại nhận hồ sơ"}>
                            <Switch 
                                checked={record.trangThai === 1} 
                                disabled={record.trangThai === 3}
                                onChange={() => {
                                    if (!jobId) return message.warning("Không tìm thấy mã tin!");
                                    handleToggleStatus(jobId);
                                }} 
                                size="small"
                            />
                        </Tooltip>
                    </Space>
                );
            }
        }
    ];

    const renderKpiCard = (title, value, icon, color, bgColor, suffix = "") => (
        <Card 
            bordered={false} 
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff' }}
            bodyStyle={{ padding: '16px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                    width: '44px', height: '44px', borderRadius: '10px', 
                    background: bgColor, color: color, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', fontSize: '20px' 
                }}>
                    {icon}
                </div>
                <div>
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>{title}</Text>
                    <Text strong style={{ fontSize: '20px', color: '#1f1f1f' }}>
                        {value} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{suffix}</span>
                    </Text>
                </div>
            </div>
        </Card>
    );

    const summary = dashboardData.summary || {};

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px', color: '#262626' }}>
            <style>{`
                .single-panel-rangepicker .ant-picker-panels > *:nth-child(2) {
                    display: none !important;
                }
                .single-panel-rangepicker .ant-picker-panels > *:first-child {
                    border-right: none !important;
                }
            `}</style>

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

                                <RangePicker 
                                    value={dateRange} 
                                    onChange={handleCustomRangeChange}
                                    format="DD/MM/YYYY"
                                    popupClassName="single-panel-rangepicker"
                                    suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
                                    style={{ borderRadius: '6px' }}
                                    renderExtraFooter={() => (
                                        <div style={{ textAlign: 'center', padding: '4px 0' }}>
                                            <Button 
                                                type="link" 
                                                size="small" 
                                                onClick={() => {
                                                    const today = dayjs();
                                                    handleCustomRangeChange([today, today]);
                                                }}
                                            >
                                                Hôm nay
                                            </Button>
                                        </div>
                                    )}
                                />
                            </Space>
                        </Col>
                    </Row>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px' }}>
                        <Spin size="large" tip="Đang cập nhật số liệu thống kê..." />
                    </div>
                ) : (
                    <>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col xs={12} sm={8} lg={4}>
                                {renderKpiCard("Tin đang đăng", summary.tinDangDang || 0, <FileDoneOutlined />, "#52c41a", "#f6ffed")}
                            </Col>
                            <Col xs={12} sm={8} lg={4}>
                                {renderKpiCard("Hồ sơ mới", summary.hoSoMoiChuaDuyet || 0, <UsergroupAddOutlined />, "#faad14", "#fffbe6")}
                            </Col>
                            <Col xs={12} sm={8} lg={4}>
                                {renderKpiCard("Mở CV còn lại", summary.luotXemCvConLai || 0, <UnlockOutlined />, "#1890ff", "#e6f7ff")}
                            </Col>
                            <Col xs={12} sm={8} lg={4}>
                                {renderKpiCard("Tổng lượt xem", summary.tongLuotXemTin || 0, <EyeOutlined />, "#13c2c2", "#e6fffb")}
                            </Col>
                            <Col xs={12} sm={8} lg={4}>
                                {renderKpiCard("Tổng CV nộp", summary.tongCvNop || 0, <RiseOutlined />, "#fa8c16", "#fff7e6")}
                            </Col>
                            <Col xs={12} sm={8} lg={4}>
                                {renderKpiCard("Tỷ lệ chuyển đổi", summary.tyLeChuyenDoi || 0, <TrophyOutlined />, "#722ed1", "#f9f0ff", "%")}
                            </Col>
                        </Row>

                        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                            <Col xs={24}>
                                <Card 
                                    title={<Space><LineChartOutlined style={{ color: '#1890ff' }} /><Text strong>Xu hướng Lượt xem tin tuyển dụng</Text></Space>} 
                                    bordered={false}
                                    style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff' }}
                                >
                                    <Line {...viewsChartConfig} height={240} />
                                </Card>
                            </Col>
                            
                            <Col xs={24}>
                                <Card 
                                    title={<Space><BarChartOutlined style={{ color: '#52c41a' }} /><Text strong>Xu hướng Lượt nộp hồ sơ CV</Text></Space>} 
                                    bordered={false}
                                    style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff' }}
                                >
                                    <Line {...appsChartConfig} height={240} />
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[24, 24]}>
                            <Col xs={24} lg={9}>
                                <Card 
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Space><PieChartOutlined style={{ color: '#fa8c16' }} /><Text strong>Trạng thái Hồ sơ ứng tuyển</Text></Space>
                                            <Tag color="blue" style={{ borderRadius: '12px', padding: '0 10px' }}>Tổng: {totalApps} CV</Tag>
                                        </div>
                                    } 
                                    bordered={false}
                                    style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', height: '100%' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
                                        {statusDisplayItems.map((item) => {
                                            const percent = totalApps > 0 ? Math.round((item.count / totalApps) * 100) : 0;
                                            return (
                                                <div 
                                                    key={item.name} 
                                                    style={{ 
                                                        background: item.bgColor, 
                                                        padding: '12px 16px', 
                                                        borderRadius: '8px', 
                                                        borderLeft: `4px solid ${item.color}` 
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Space align="center">
                                                            <span style={{ color: item.color, fontSize: '15px' }}>{item.icon}</span>
                                                            <Text strong style={{ fontSize: '14px' }}>{item.name}</Text>
                                                        </Space>
                                                        <div>
                                                            <Text strong style={{ fontSize: '16px', color: item.color }}>{item.count}</Text>
                                                            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>hồ sơ</Text>
                                                        </div>
                                                    </div>
                                                    <Progress 
                                                        percent={percent} 
                                                        strokeColor={item.color} 
                                                        size="small" 
                                                        style={{ marginTop: '6px' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </Col>

                            <Col xs={24} lg={15}>
                                <Card 
                                    title={<Space><TrophyOutlined style={{ color: '#faad14' }} /><Text strong>Top Tin tuyển dụng có hiệu suất cao nhất</Text></Space>} 
                                    bordered={false}
                                    style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', height: '100%' }}
                                >
                                    <Table 
                                        dataSource={dashboardData.topJobs || []} 
                                        columns={columns} 
                                        rowKey="maTin" 
                                        pagination={false}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}

            </div>
        </div>
    );
};

export default EmployerDashboard;