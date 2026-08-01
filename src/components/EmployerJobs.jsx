import React, { useState, useEffect, useMemo } from 'react';
import { 
    Table, Tag, Button, Space, message, Input, Select, Card, Row, Col, Tooltip 
} from 'antd';
import { 
    FilterOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, 
    ClearOutlined, CalendarOutlined, EnvironmentOutlined,
    ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
    UserOutlined, RocketOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const { Option } = Select;

const EmployerJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // STATE BỘ LỌC
    const [searchText, setSearchText] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/employer/my-jobs');
            const resData = response?.data || response;
            if (resData && resData.status === "SUCCESS") {
                setJobs(resData.data || []);
            } else if (Array.isArray(resData)) {
                setJobs(resData);
            } else if (resData && Array.isArray(resData.data)) {
                setJobs(resData.data);
            }
        } catch (error) {
            message.error("Lỗi khi tải danh sách tin tuyển dụng");
        } finally {
            setLoading(false);
        }
    };

    // ✨ GỢI Ý NGÀNH NGHỀ ĐỘNG TỪ DỮ LIỆU TIN ĐÃ ĐĂNG
    const industryOptions = useMemo(() => {
        const map = new Map();
        jobs.forEach(job => {
            if (Array.isArray(job.danhSachNganhObj)) {
                job.danhSachNganhObj.forEach(item => {
                    if (item.id && !map.has(item.id)) {
                        map.set(item.id, item.name);
                    }
                });
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
    }, [jobs]);

    // ✨ GỢI Ý KHU VỰC ĐỘNG TỪ BẢNG CHI TIẾT VỊ TRÍ
    const locationOptions = useMemo(() => {
        const set = new Set();
        jobs.forEach(job => {
            if (Array.isArray(job.danhSachKhuVuc)) {
                job.danhSachKhuVuc.forEach(loc => {
                    if (loc) set.add(loc);
                });
            }
        });
        return Array.from(set);
    }, [jobs]);

    const renderDeadlineStatus = (deadlineDateStr) => {
        if (!deadlineDateStr) return <span style={{ color: '#bfbfbf' }}>Chưa quy định</span>;
        
        const now = new Date();
        const deadline = new Date(deadlineDateStr);
        const formattedDate = deadline.toLocaleDateString('vi-VN');
        
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let statusTag;
        if (diffDays < 0) {
            statusTag = <Tag color="error" style={{ borderRadius: '10px', margin: 0, padding: '0 8px' }}>Đã hết hạn</Tag>;
        } else if (diffDays === 0) {
            statusTag = <Tag color="warning" icon={<ClockCircleOutlined />} style={{ borderRadius: '10px', margin: 0, padding: '0 8px' }}>Hết hạn hôm nay</Tag>;
        } else if (diffDays <= 5) {
            statusTag = <Tag color="warning" style={{ borderRadius: '10px', margin: 0, padding: '0 8px' }}>Còn {diffDays} ngày</Tag>;
        } else {
            statusTag = <Tag color="success" style={{ borderRadius: '10px', margin: 0, padding: '0 8px' }}>Còn {diffDays} ngày</Tag>;
        }

        return (
            <Space direction="vertical" size={2} align="center" style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#262626', fontWeight: 500 }}>{formattedDate}</span>
                {statusTag}
            </Space>
        );
    };

    // LỌC DỮ LIỆU ĐỘNG
    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchSearch = !searchText || 
                (job.tieuDe && job.tieuDe.toLowerCase().includes(searchText.toLowerCase())) ||
                (job.tenNganhNghe && job.tenNganhNghe.toLowerCase().includes(searchText.toLowerCase()));

            const matchIndustry = !selectedIndustry || 
                (Array.isArray(job.danhSachMaNganh) && job.danhSachMaNganh.includes(selectedIndustry));

            const matchLocation = !selectedLocation || 
                (Array.isArray(job.danhSachKhuVuc) && job.danhSachKhuVuc.includes(selectedLocation));

            const matchStatus = selectedStatus === null || selectedStatus === undefined || 
                job.trangThai === selectedStatus;

            return matchSearch && matchIndustry && matchLocation && matchStatus;
        });
    }, [jobs, searchText, selectedIndustry, selectedLocation, selectedStatus]);

    const handleResetFilters = () => {
        setSearchText('');
        setSelectedIndustry(null);
        setSelectedLocation(null);
        setSelectedStatus(null);
    };

    const columns = [
        {
            title: 'Chiến dịch / Vị trí',
            dataIndex: 'tieuDe',
            key: 'tieuDe',
            width: 320,
            render: (text, record) => (
                <Space direction="vertical" size={4} style={{ display: 'flex' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                            {text || record.tenViTri}
                        </span>
                        {record.isPromoted && (
                            <Tag color="gold" icon={<RocketOutlined />} style={{ borderRadius: '10px', fontWeight: 600, margin: 0 }}>
                                VIP
                            </Tag>
                        )}
                    </div>
                    {record.tenNganhNghe && (
                        <div>
                            <Tag style={{ fontSize: '12px', borderRadius: '4px', background: '#f5f5f5', border: '1px solid #e8e8e8', color: '#595959', margin: 0 }}>
                                Ngành: {record.tenNganhNghe}
                            </Tag>
                        </div>
                    )}
                </Space>
            )
        },
        {
            title: 'Ngày đăng',
            dataIndex: 'ngayTao',
            key: 'ngayTao',
            width: 130,
            align: 'center',
            render: (date) => (
                <div style={{ fontSize: '13px', color: '#595959', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarOutlined style={{ color: '#8c8c8c' }} />
                    {date ? new Date(date).toLocaleDateString('vi-VN') : '---'}
                </div>
            )
        },
        {
            title: 'Hạn nộp / Thời hạn',
            key: 'hanNop',
            width: 160,
            align: 'center',
            render: (_, record) => renderDeadlineStatus(record.hanNop || record.ngayHetHan)
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 150,
            align: 'center',
            render: (status) => {
                if (status === 0) return (
                    <Tag icon={<ClockCircleOutlined />} color="warning" style={{ borderRadius: '12px', padding: '2px 10px', fontWeight: 500 }}>
                        Chờ duyệt
                    </Tag>
                );
                if (status === 1) return (
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: '12px', padding: '2px 10px', fontWeight: 500 }}>
                        Đang hiển thị
                    </Tag>
                );
                if (status === 2) return (
                    <Tag icon={<CloseCircleOutlined />} color="error" style={{ borderRadius: '12px', padding: '2px 10px', fontWeight: 500 }}>
                        Đã đóng / Từ chối
                    </Tag>
                );
                return <Tag color="default" style={{ borderRadius: '12px', padding: '2px 10px' }}>Ẩn</Tag>;
            }
        },
        {
            title: 'Ứng viên',
            key: 'soLuong',
            align: 'center',
            width: 100,
            render: (_, record) => (
                <Tooltip title="Xem danh sách ứng viên đã nộp">
                    <Button 
                        type="text" 
                        onClick={() => navigate(`/employer/candidate-funnel/${record.maViTri || record.maTin}`)}
                        style={{ 
                            background: '#e6f7ff', 
                            color: '#1890ff', 
                            borderRadius: '16px', 
                            fontWeight: 600,
                            padding: '2px 14px',
                            height: '32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid #91d5ff'
                        }}
                    >
                        <UserOutlined />
                        {record.soLuongUngVien || 0}
                    </Button>
                </Tooltip>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            width: 190,
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="default"
                        size="middle"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/employer/jobs/${record.maTin || record.maViTri}`, '_blank')}
                        style={{ borderRadius: '6px' }}
                    >
                        Chi tiết
                    </Button>
                    {record.trangThai === 1 && (
                        <Button 
                            type="primary" 
                            size="middle"
                            icon={<FilterOutlined />} 
                            onClick={() => navigate(`/employer/candidate-funnel/${record.maViTri || record.maTin}`)}
                            style={{ borderRadius: '6px', backgroundColor: '#1890ff' }}
                        >
                            Phễu
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                    Danh sách Tin đã đăng
                </h2>
                <Button icon={<ReloadOutlined />} onClick={fetchMyJobs} loading={loading} style={{ borderRadius: '6px' }}>
                    Tải lại
                </Button>
            </div>

            {/* THANH BỘ LỌC TÍCH HỢP GÕ TÌM KIẾM TRỰC TIẾP */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Tìm theo tiêu đề tin..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                </Col>

                {/* Combobox Ngành nghề: Hỗ trợ Gõ tìm kiếm theo tên ngành */}
                <Col xs={24} sm={12} md={6}>
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="-- Tìm / Chọn ngành nghề --"
                        value={selectedIndustry}
                        onChange={(val) => setSelectedIndustry(val)}
                        allowClear
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {industryOptions.map((ind) => (
                            <Option key={ind.value} value={ind.value} label={ind.label}>
                                <AppstoreOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                {ind.label}
                            </Option>
                        ))}
                    </Select>
                </Col>

                {/* Combobox Khu vực: Hỗ trợ Gõ tìm kiếm theo tên khu vực */}
                <Col xs={24} sm={12} md={6}>
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="-- Tìm / Chọn khu vực --"
                        value={selectedLocation}
                        onChange={(val) => setSelectedLocation(val)}
                        allowClear
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {locationOptions.map((loc, idx) => (
                            <Option key={idx} value={loc} label={loc}>
                                <EnvironmentOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                {loc}
                            </Option>
                        ))}
                    </Select>
                </Col>

                <Col xs={18} sm={8} md={4}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="-- Trạng thái --"
                        value={selectedStatus}
                        onChange={(val) => setSelectedStatus(val)}
                        allowClear
                    >
                        <Option value={0}>Chờ duyệt</Option>
                        <Option value={1}>Đang hiển thị</Option>
                        <Option value={2}>Bị từ chối / Đóng</Option>
                    </Select>
                </Col>

                <Col xs={6} sm={4} md={2}>
                    <Button icon={<ClearOutlined />} onClick={handleResetFilters} block danger title="Xóa bộ lọc" style={{ borderRadius: '6px' }}>
                        Xóa
                    </Button>
                </Col>
            </Row>

            <Table 
                columns={columns} 
                dataSource={filteredJobs} 
                rowKey={(record) => record.maViTri || record.maTin} 
                loading={loading}
                pagination={{ pageSize: 8, showSizeChanger: true }}
            />
        </Card>
    );
};

export default EmployerJobs;