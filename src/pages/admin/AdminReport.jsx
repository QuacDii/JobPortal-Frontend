import React, { useState, useEffect } from 'react';
import {
    Card, Row, Col, Statistic, DatePicker, Typography, message, Spin, Select, Modal, Table, Button, Tag, Space
} from 'antd';
import {
    UserAddOutlined, FileTextOutlined, SolutionOutlined, DollarOutlined,
    FileExcelOutlined, ArrowUpOutlined, ArrowDownOutlined, FilterOutlined,
    CrownOutlined, ReloadOutlined, BarChartOutlined
} from '@ant-design/icons';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import apiClient from '../../api/apiClient';
import '../css/AdminReport.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + ' đ';

const AdminReport = () => {
    const rangePresets = [
        { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
        { label: 'Hôm qua', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
        { label: '7 ngày qua', value: [dayjs().subtract(7, 'day'), dayjs()] },
        { label: '30 ngày qua', value: [dayjs().subtract(30, 'day'), dayjs()] },
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

    // BỘ LỌC
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [dates, setDates] = useState([dayjs().subtract(30, 'day'), dayjs()]);

    // MODAL CHI TIẾT
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
            const data = res?.data !== undefined ? res.data : res;

            setMetrics(data.metrics || data.Metrics || { newUsers: 0, activeJobs: 0, totalApplications: 0, totalRevenue: 0 });
            setPrevMetrics(data.prevMetrics || data.PrevMetrics || { newUsers: 0, totalApplications: 0, totalRevenue: 0 });
            setChartData(data.chartData || data.ChartData || []);
            const rawPie = data.pieData || data.PieData || {};
            setPieData({
                userRoles: rawPie.userRoles || rawPie.UserRoles || [],
                hotIndustries: rawPie.hotIndustries || rawPie.HotIndustries || []
            });
            setPackages(data.packages || data.Packages || []);
        } catch (error) {
            console.error("Lỗi báo cáo:", error);
            message.error('Không thể tải dữ liệu báo cáo!');
        } finally {
            setLoading(false);
        }
    };

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
            const raw = response?.data !== undefined ? response.data : response;
            setDetailsData(Array.isArray(raw) ? raw : []);
        } catch (error) {
            message.error('Lỗi khi tải chi tiết!');
        } finally {
            setDetailsLoading(false);
        }
    };

    const renderGrowth = (current, prev) => {
        if (!prev || prev === 0) return current > 0 ? <Text type="success" style={{ fontSize: 12 }}><ArrowUpOutlined /> +100%</Text> : <Text type="secondary" style={{ fontSize: 12 }}>0%</Text>;
        const percent = ((current - prev) / prev) * 100;
        if (percent > 0) return <Text type="success" style={{ fontSize: 12 }}><ArrowUpOutlined /> +{percent.toFixed(1)}%</Text>;
        if (percent < 0) return <Text type="danger" style={{ fontSize: 12 }}><ArrowDownOutlined /> {percent.toFixed(1)}%</Text>;
        return <Text type="secondary" style={{ fontSize: 12 }}>0%</Text>;
    };

    // 🌟 1. HÀM KIỂM TRA CHUẨN XÁC GÓI ỨNG VIÊN HAY NHÀ TUYỂN DỤNG
    const checkIsCandidatePackage = (p) => {
        const pTarget = p.doiTuongSuDung ?? p.DoiTuongSuDung ?? p.doiTuong ?? p.DoiTuong;
        const pName = (p.tenGoi || p.TenGoi || '').toLowerCase();

        // 1. Kiểm tra theo trường DoiTuongSuDung trong CSDL (2: Ứng viên, 1: Nhà tuyển dụng)
        if (pTarget === 2 || pTarget === '2' || pTarget === 'UV' || pTarget === 'UngVien' || pTarget === 'Ứng viên') {
            return true;
        }
        if (pTarget === 1 || pTarget === '1' || pTarget === 'NTD' || pTarget === 'NhaTuyenDung' || pTarget === 'Nhà tuyển dụng') {
            return false;
        }

        // 2. Dự phòng nhận diện qua tên gói nếu trường trong DB bị null
        const isCandidateName = pName.includes('ứng viên') || pName.includes('uv') || pName.includes('cv') || pName.includes('pdf') || pName.includes('sự nghiệp');
        return isCandidateName;
    };

    // 🌟 2. LỌC DANH SÁCH GÓI THEO ĐỐI TƯỢNG ĐANG CHỌN
    const availablePackages = packages.filter(p => {
        if (!selectedRole) return true; // Nếu chọn "Tất cả đối tượng" -> Hiển thị toàn bộ gói
        const isCandidate = checkIsCandidatePackage(p);

        if (selectedRole === 2) return isCandidate;     // Lọc lấy gói Ứng viên (Role = 2)
        if (selectedRole === 1) return !isCandidate;    // Lọc lấy gói Nhà tuyển dụng (Role = 1)
        return true;
    });

    // 3. Hàm xử lý khi thay đổi Vai trò (Tự động reset ô chọn Gói về null)
    const handleRoleChange = (roleValue) => {
        setSelectedRole(roleValue);
        setSelectedPackage(null); // Reset gói dịch vụ đã chọn
    };

    const exportToExcel = () => {
        if (detailsData.length === 0) {
            message.warning('Không có dữ liệu để xuất!');
            return;
        }

        const formattedData = detailsData.map(row => {
            let newRow = {};
            for (let key in row) {
                const niceKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const keyLower = key.toLowerCase();

                if (keyLower.includes('ngay') || keyLower.includes('date')) {
                    newRow[niceKey] = row[key] ? dayjs(row[key]).format('DD/MM/YYYY HH:mm') : '';
                } else if (keyLower.includes('tien') || keyLower.includes('amount') || keyLower.includes('so_tien')) {
                    newRow[niceKey] = row[key] ? Number(row[key]).toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ';
                } else {
                    newRow[niceKey] = row[key];
                }
            }
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DuLieu_BaoCao");
        XLSX.writeFile(workbook, `JobsNow_BaoCao_${detailsRawType}_${dayjs().format('DDMMYYYY')}.xlsx`);
    };

    const detailColumns = detailsData.length > 0 ? Object.keys(detailsData[0]).map(key => ({
        title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        dataIndex: key,
        render: (text) => {
            const keyLower = key.toLowerCase();
            if (keyLower.includes('ngay') || keyLower.includes('date')) {
                return text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-';
            }
            if (keyLower.includes('tien') || keyLower.includes('amount') || keyLower.includes('so_tien')) {
                return <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{formatVND(text)}</span>;
            }
            if (keyLower.includes('vaitro') || keyLower.includes('vai_tro')) {
                return text === 1 ? <Tag color="blue">NTD</Tag> : <Tag color="green">Ứng viên</Tag>;
            }
            if (keyLower.includes('phuongthuc') || keyLower.includes('phuong_thuc')) {
                return <Tag color={text?.includes('MOMO') ? 'magenta' : 'geekblue'}>{text || 'Hệ thống'}</Tag>;
            }
            return text || '-';
        }
    })) : [];

    return (
        <div className="admin-report-container">
            {/* HEADER THỐNG KÊ & BỘ LỌC */}
            <div className="report-header-bar">
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <FilterOutlined style={{ color: '#1890ff' }} /> Thống kê & Báo cáo
                    </Title>
                    <Text type="secondary">Phân tích hiệu suất tăng trưởng, lượt ứng tuyển và doanh thu hệ thống</Text>
                </div>

                <Space wrap className="report-filter-group">
                    {/* LỌC THEO VAI TRÒ */}
                    <Select
                        placeholder="Tất cả đối tượng"
                        allowClear
                        style={{ width: 170 }}
                        onChange={handleRoleChange}
                        value={selectedRole}
                        className="report-select"
                    >
                        <Option value={1}>Nhà tuyển dụng</Option>
                        <Option value={2}>Ứng viên</Option>
                    </Select>

                    {/* LỌC THEO GÓI DỊCH VỤ (ĐÃ ĐƯỢC LỌC ĐỘNG BỞI availablePackages) */}
                    <Select
                        placeholder="Tất cả gói dịch vụ"
                        allowClear
                        style={{ width: 230 }}
                        onChange={setSelectedPackage}
                        value={selectedPackage}
                        className="report-select"
                    >
                        {availablePackages.map(p => {
                            const pId = p.maGoi || p.MaGoi || p.id;
                            const pName = p.tenGoi || p.TenGoi || '';
                            const isCandidate = checkIsCandidatePackage(p);

                            return (
                                <Option key={pId} value={pId}>
                                    <Tag color={isCandidate ? 'green' : 'blue'} style={{ marginRight: 6, fontWeight: 'bold' }}>
                                        {isCandidate ? 'UV' : 'NTD'}
                                    </Tag>
                                    {pName}
                                </Option>
                            );
                        })}
                    </Select>

                    <RangePicker
                        presets={rangePresets}
                        value={dates}
                        onChange={(vals) => vals && setDates(vals)}
                        format="DD/MM/YYYY"
                        allowClear={false}
                    />

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchReportData(dates, selectedPackage, selectedRole)}
                    />
                </Space>
            </div>

            <Spin spinning={loading} tip="Đang tính toán dữ liệu...">
                {/* 4 THẺ THỐNG KÊ */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable onClick={() => openDetails('users', 'Người dùng mới')}>
                            <Statistic
                                title="Người dùng mới"
                                value={metrics.newUsers}
                                prefix={<UserAddOutlined style={{ color: '#1890ff' }} />}
                            />
                            <div style={{ marginTop: 8 }}>{renderGrowth(metrics.newUsers, prevMetrics.newUsers)} so với kỳ trước</div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable onClick={() => openDetails('jobs', 'Tin tuyển dụng hoạt động')}>
                            <Statistic
                                title="Tin tuyển dụng chạy"
                                value={metrics.activeJobs}
                                prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                            />
                            <div style={{ marginTop: 8 }}><Tag color="green">Đang hoạt động</Tag></div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable onClick={() => openDetails('applications', 'Lượt ứng tuyển')}>
                            <Statistic
                                title="Lượt nộp CV"
                                value={metrics.totalApplications}
                                prefix={<SolutionOutlined style={{ color: '#faad14' }} />}
                            />
                            <div style={{ marginTop: 8 }}>{renderGrowth(metrics.totalApplications, prevMetrics.totalApplications)} so với kỳ trước</div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable onClick={() => openDetails('revenue', 'Lịch sử Doanh thu')}>
                            <Statistic
                                title="Tổng doanh thu"
                                value={metrics.totalRevenue}
                                precision={0}
                                suffix="đ"
                                prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                            />
                            <div style={{ marginTop: 8 }}>{renderGrowth(metrics.totalRevenue, prevMetrics.totalRevenue)} so với kỳ trước</div>
                        </Card>
                    </Col>
                </Row>

                {/* BIỂU ĐỒ BẢNG BIỂU */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card title={<Space><BarChartOutlined /><b>Doanh thu Theo Thời Gian {selectedPackage ? '(Đã lọc theo gói)' : ''}</b></Space>}>
                            <div style={{ height: 320, width: '100%' }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" />
                                            <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                                            <Tooltip formatter={(value) => [formatVND(value), "Doanh thu"]} />
                                            <Legend />
                                            <Bar dataKey="revenue" name="Doanh thu (VNĐ)" fill="#1890ff" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text type="secondary">Không có dữ liệu doanh thu trong khoảng thời gian này.</Text>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card title={<Space><CrownOutlined /><b>Cấu trúc Người dùng</b></Space>}>
                            <div style={{ height: 320, width: '100%' }}>
                                {/* 🌟 Lấy linh hoạt cả userRoles (chữ thường) và UserRoles (chữ hoa) */}
                                {((pieData?.userRoles || pieData?.UserRoles || []).length > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData.userRoles || pieData.UserRoles}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={55}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                nameKey="name"
                                            >
                                                {(pieData.userRoles || pieData.UserRoles).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text type="secondary">Chưa có dữ liệu người dùng.</Text>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Spin>

            {/* MODAL CHI TIẾT */}
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                        <span>Chi tiết: <b>{detailsType}</b></span>
                        <Button
                            type="primary"
                            icon={<FileExcelOutlined />}
                            onClick={exportToExcel}
                            style={{ backgroundColor: '#107c41', borderColor: '#107c41' }}
                        >
                            Xuất Excel
                        </Button>
                    </div>
                }
                open={detailsVisible}
                onCancel={() => setDetailsVisible(false)}
                footer={null}
                width={900}
            >
                <Table
                    dataSource={detailsData}
                    columns={detailColumns}
                    rowKey={(record) => record.ID || record.id || record.maGD || Math.random()}
                    loading={detailsLoading}
                    pagination={{ pageSize: 8 }}
                    size="small"
                    bordered
                    scroll={{ x: 'max-content' }}
                />
            </Modal>
        </div>
    );
};

export default AdminReport;