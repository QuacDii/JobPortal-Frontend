import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Typography, message, Spin, Select, Modal, Table, Button } from 'antd';
import { UserAddOutlined, FileTextOutlined, SolutionOutlined, DollarOutlined, FileExcelOutlined, ArrowUpOutlined, ArrowDownOutlined, FilterOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx'; 
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminReport = () => {
    const rangePresets = [
        { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
        { label: 'Hôm qua', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
        { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
        { label: '30 ngày qua', value: [dayjs().subtract(30, 'd'), dayjs()] },
        { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
        { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
        { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
    ];
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState({ newUsers: 0, activeJobs: 0, totalApplications: 0, totalRevenue: 0 });
    const [prevMetrics, setPrevMetrics] = useState({ newUsers: 0, totalApplications: 0, totalRevenue: 0 });
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState({ UserRoles: [], HotIndustries: [] });
    const [packages, setPackages] = useState([]);
    
    // CÁC STATE BỘ LỌC
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null); 
    const [dates, setDates] = useState([dayjs().subtract(30, 'day'), dayjs()]);

    const [detailsVisible, setDetailsVisible] = useState(false);
    const [detailsType, setDetailsType] = useState('');
    const [detailsRawType, setDetailsRawType] = useState('');
    const [detailsData, setDetailsData] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const fetchReportData = async (dateRange, packageId = null, role = null) => {
        setLoading(true);
        try {
            const startDate = dateRange[0].format('YYYY-MM-DD');
            const endDate = dateRange[1].format('YYYY-MM-DD');
            let url = `/Report/dashboard?startDate=${startDate}&endDate=${endDate}`;
            
            if (packageId) url += `&maGoi=${packageId}`;
            if (role !== null && role !== undefined) url += `&vaiTro=${role}`; 
            
            const res = await apiClient.get(url);
            const data = res.data || res;
            
            setMetrics(data.metrics || data.Metrics);
            setPrevMetrics(data.prevMetrics || data.PrevMetrics);
            setChartData(data.chartData || data.ChartData);
            setPieData(data.pieData || data.PieData);
            setPackages(data.packages || data.Packages);
        } catch (error) {
            message.error('Không thể tải dữ liệu báo cáo!');
        } finally {
            setLoading(false);
        }
    };

    // Gọi lại API mỗi khi có sự thay đổi về Ngày, Gói hoặc Đối tượng
    useEffect(() => {
        fetchReportData(dates, selectedPackage, selectedRole);
    }, [dates, selectedPackage, selectedRole]);

    const openDetails = async (type, title) => {
        setDetailsRawType(type);
        setDetailsType(title);
        setDetailsVisible(true);
        setDetailsLoading(true);
        try {
            const startDate = dates[0].format('YYYY-MM-DD');
            const endDate = dates[1].format('YYYY-MM-DD');
            let url = `/Report/details?type=${type}&startDate=${startDate}&endDate=${endDate}`;
            
            if (type === 'revenue' && selectedPackage) url += `&maGoi=${selectedPackage}`;
            if (selectedRole !== null && selectedRole !== undefined) url += `&vaiTro=${selectedRole}`; 
            
            const response = await apiClient.get(url);
            setDetailsData(response.data || response);
        } catch (error) {
            message.error('Lỗi khi tải chi tiết!');
        } finally {
            setDetailsLoading(false);
        }
    };

    const renderGrowth = (current, prev) => {
        if (prev === 0) return current > 0 ? <Text type="success" style={{fontSize: 12}}><ArrowUpOutlined /> 100%</Text> : null;
        const percent = ((current - prev) / prev) * 100;
        if (percent > 0) return <Text type="success" style={{fontSize: 12}}><ArrowUpOutlined /> {percent.toFixed(1)}%</Text>;
        if (percent < 0) return <Text type="danger" style={{fontSize: 12}}><ArrowDownOutlined /> {Math.abs(percent).toFixed(1)}%</Text>;
        return <Text type="secondary" style={{fontSize: 12}}>— 0%</Text>;
    };

    const columnTitles = {
        id: 'ID',
        ten: 'Họ và Tên',
        email: 'Email',
        ngayThamGia: 'Ngày Tham Gia',
        tieuDe: 'Tiêu đề chiến dịch',
        ngayHetHan: 'Ngày hết hạn',
        ngayNop: 'Ngày nộp đơn',
        mã_GD: 'Mã Giao Dịch',
        khách_Hàng: 'Khách Hàng',
        gói_Đã_Mua: 'Gói Dịch Vụ',
        số_Tiền: 'Số Tiền (VNĐ)',
        ngày_Mua: 'Ngày Mua',
        vai_Tro: 'Vai Trò'
    };

    const exportToExcel = () => {
        if (detailsData.length === 0) {
            message.warning('Không có dữ liệu để xuất!');
            return;
        }
        const formattedData = detailsData.map(row => {
            let newRow = {};
            for (let key in row) {
                const niceKey = columnTitles[key] || key; 
                const keyLower = key.toLowerCase();
                
                if (keyLower.includes('ngày') || keyLower.includes('ngay')) {
                    newRow[niceKey] = row[key] ? dayjs(row[key]).format('DD/MM/YYYY HH:mm') : '';
                } else {
                    newRow[niceKey] = row[key];
                }
            }
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DuLieu");
        XLSX.writeFile(workbook, `BaoCao_${detailsRawType}_${dayjs().format('DDMMYYYY')}.xlsx`);
    };

    const detailColumns = detailsData.length > 0 ? Object.keys(detailsData[0]).map(key => ({
        title: columnTitles[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
        dataIndex: key,
        render: (text) => {
            const keyLower = key.toLowerCase();
            if (keyLower.includes('ngay') || keyLower.includes('ngày')) {
                return text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '';
            }
            if (keyLower.includes('tien') || keyLower.includes('tiền')) {
                return new Intl.NumberFormat('vi-VN').format(text) + ' đ';
            }
            return text;
        }
    })) : [];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <Title level={3} style={{ margin: 0 }}><FilterOutlined /> Thống kê & Báo cáo</Title>
                <div style={{ display: 'flex', gap: 16 }}>
                    
                    <Select 
                        placeholder="Tất cả đối tượng" 
                        allowClear 
                        style={{ width: 180 }} 
                        onChange={setSelectedRole}
                    >
                        <Option value={1}>Nhà tuyển dụng</Option>
                        <Option value={2}>Ứng viên</Option>
                    </Select>

                    <Select placeholder="Tất cả gói dịch vụ" allowClear style={{ width: 220 }} onChange={setSelectedPackage}>
                        {packages.map(p => (<Option key={p.maGoi || p.MaGoi} value={p.maGoi || p.MaGoi}>{p.tenGoi || p.TenGoi}</Option>))}
                    </Select>
                    
                    <RangePicker presets={rangePresets} value={dates} onChange={(vals) => vals && setDates(vals)} format="DD/MM/YYYY" allowClear={false}/>
                </div>
            </div>

            <Spin spinning={loading} description="Đang tính toán dữ liệu...">
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable onClick={() => openDetails('users', 'Người dùng mới')} style={{ borderRadius: 8, borderColor: '#1890ff' }}>
                            <Statistic title="Người dùng mới" value={metrics.newUsers} prefix={<UserAddOutlined style={{ color: '#1890ff' }} />} />
                            <div style={{ marginTop: 8 }}>{renderGrowth(metrics.newUsers, prevMetrics.newUsers)} với kỳ trước</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable onClick={() => openDetails('jobs', 'Bài đăng hoạt động')} style={{ borderRadius: 8, borderColor: '#52c41a' }}>
                            <Statistic title="Bài đăng đang chạy" value={metrics.activeJobs} prefix={<FileTextOutlined style={{ color: '#52c41a' }} />} />
                            <div style={{ marginTop: 8 }}><Text type="secondary" style={{fontSize: 12}}>Snapshot tại thời điểm hiện tại</Text></div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable onClick={() => openDetails('applications', 'Lượt ứng tuyển')} style={{ borderRadius: 8, borderColor: '#faad14' }}>
                            <Statistic title="Lượt ứng tuyển" value={metrics.totalApplications} prefix={<SolutionOutlined style={{ color: '#faad14' }} />} />
                            <div style={{ marginTop: 8 }}>{renderGrowth(metrics.totalApplications, prevMetrics.totalApplications)} với kỳ trước</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable onClick={() => openDetails('revenue', 'Lịch sử Mua hàng')} style={{ borderRadius: 8, borderColor: '#f5222d' }}>
                            <Statistic title="Tổng doanh thu (VNĐ)" value={metrics.totalRevenue} prefix={<DollarOutlined style={{ color: '#f5222d' }} />} />
                            <div style={{ marginTop: 8 }}>{renderGrowth(metrics.totalRevenue, prevMetrics.totalRevenue)} với kỳ trước</div>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card title={`Dòng tiền ${selectedPackage ? '(Đã lọc theo gói)' : ''}`} variant="borderless" style={{ borderRadius: 8, height: '100%' }}>
                            <div style={{ height: 350, width: '100%' }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" />
                                            <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value)} />
                                            <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'} />
                                            <Legend />
                                            <Bar dataKey="revenue" name="Doanh thu" fill="#1890ff" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Không có dữ liệu.</div>}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Tỷ lệ Người dùng tham gia" variant="borderless" style={{ borderRadius: 8, height: '100%' }}>
                            <div style={{ height: 350, width: '100%' }}>
                                {(pieData.UserRoles || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData.UserRoles} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {pieData.UserRoles.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Chưa có dữ liệu.</div>}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Spin>

            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                        <span>Chi tiết: {detailsType} {selectedRole === 1 ? '(Nhà tuyển dụng)' : selectedRole === 2 ? '(Ứng viên)' : ''}</span>
                        <Button type="primary" icon={<FileExcelOutlined />} onClick={exportToExcel} style={{backgroundColor: '#107c41', borderColor: '#107c41'}}>Xuất file Excel</Button>
                    </div>
                }
                open={detailsVisible}
                onCancel={() => setDetailsVisible(false)}
                footer={null}
                width={900}
            >
                <Table dataSource={detailsData} columns={detailColumns} rowKey={(record) => record.ID || record.Mã_GD || Math.random()} loading={detailsLoading} pagination={{ pageSize: 10 }} size="small" bordered />
            </Modal>
        </div>
    );
};

export default AdminReport;