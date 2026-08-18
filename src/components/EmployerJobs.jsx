import React, { useState, useEffect, useMemo } from 'react';
import { 
    Table, Tag, Button, Space, message, Input, Select, Card, Row, Col, Tooltip, Switch, Modal, Alert 
} from 'antd';
import { 
    FilterOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, 
    ClearOutlined, CalendarOutlined, EnvironmentOutlined,
    ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
    UserOutlined, RocketOutlined, AppstoreOutlined, FireOutlined,
    ExclamationCircleOutlined, DollarOutlined, TeamOutlined, EditOutlined
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

    // Bật / Tắt cả chiến dịch
    const handleToggleStatus = async (record) => {
        const maTin = record.maTin || record.maViTri;
        try {
            const res = await apiClient.patch(`/Employer/jobs/${maTin}/toggle-status`);
            const resPayload = res?.data || res;
            if (resPayload?.success || res?.success) {
                message.success(resPayload?.message || "Đã cập nhật trạng thái tin!");
                fetchMyJobs();
            }
        } catch (error) {
            message.error(error?.response?.data?.message || "Lỗi khi thay đổi trạng thái tin!");
        }
    };

    // Bật / Tắt nhận hồ sơ cho từng vị trí con
    const handleTogglePositionStatus = async (maViTri) => {
        try {
            const res = await apiClient.patch(`/Employer/positions/${maViTri}/toggle-status`);
            const resPayload = res?.data || res;
            if (resPayload?.success || res?.success) {
                message.success(resPayload?.message || "Đã cập nhật trạng thái vị trí!");
                fetchMyJobs();
            }
        } catch (error) {
            message.error(error?.response?.data?.message || "Lỗi khi thay đổi trạng thái vị trí!");
        }
    };

    // Đẩy tin VIP
    const handlePromoteJob = async (record) => {
        const maTin = record.maTin || record.maViTri;
        try {
            const res = await apiClient.patch(`/employer/jobs/${maTin}/promote`);
            const resPayload = res?.data || res;
            if (resPayload?.success || res?.success) {
                message.success("Đã nâng cấp tin tuyển dụng thành tin VIP Nổi bật! 🔥");
                fetchMyJobs();
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Tài khoản chưa có đặc quyền Đẩy tin VIP!";
            Modal.confirm({
                title: 'Đặc quyền Đẩy tin VIP',
                icon: <RocketOutlined style={{ color: '#fa8c16' }} />,
                content: `${errorMsg} Bạn có muốn chuyển đến cửa hàng để nâng cấp gói dịch vụ ngay không?`,
                okText: 'Nâng cấp ngay 🚀',
                cancelText: 'Để sau',
                okButtonProps: { type: 'primary', style: { backgroundColor: '#fa8c16', borderColor: '#fa8c16' } },
                onOk: () => navigate('/employer/service-package')
            });
        }
    };

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
            title: 'Chiến dịch / Tin đăng',
            dataIndex: 'tieuDe',
            key: 'tieuDe',
            width: 320,
            render: (text, record) => {
                const hasRejectedPositions = record.danhSachViTri?.some(v => v.trangThai === 3);
                const titleText = text || record.tenViTri || 'Chiến dịch tuyển dụng';
                return (
                    <div style={{ maxWidth: 300 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap', marginBottom: 4 }}>
                            <Tooltip title={titleText} placement="topLeft">
                                <span style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 600, 
                                    color: '#0f172a',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: '1.4',
                                    cursor: 'pointer'
                                }}>
                                    {titleText}
                                </span>
                            </Tooltip>
                            {record.isPromoted && (
                                <Tag color="gold" icon={<RocketOutlined />} style={{ borderRadius: '10px', fontWeight: 600, margin: 0, fontSize: 11 }}>
                                    VIP
                                </Tag>
                            )}
                            {hasRejectedPositions && (
                                <Tag color="error" icon={<ExclamationCircleOutlined />} style={{ borderRadius: '10px', fontWeight: 600, margin: 0, fontSize: 11 }}>
                                    Có vị trí bị từ chối
                                </Tag>
                            )}
                        </div>
                        {record.tenNganhNghe && (
                            <Tooltip title={`Ngành nghề: ${record.tenNganhNghe}`} placement="bottomLeft">
                                <Tag style={{ 
                                    fontSize: '11px', 
                                    borderRadius: '4px', 
                                    background: '#f8fafc', 
                                    border: '1px solid #e2e8f0', 
                                    color: '#64748b', 
                                    margin: 0,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block'
                                }}>
                                    Ngành: {record.tenNganhNghe}
                                </Tag>
                            </Tooltip>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Ngày đăng',
            dataIndex: 'ngayTao',
            key: 'ngayTao',
            width: 120,
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
            width: 140,
            align: 'center',
            render: (_, record) => renderDeadlineStatus(record.hanNop || record.ngayHetHan)
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 140,
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
                        Đã đóng
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
                <Tooltip title="Xem phễu ứng viên của toàn chiến dịch">
                    <Button 
                        type="text" 
                        onClick={() => navigate(`/employer/candidate-funnel/${record.maViTri || record.maTin}`)}
                        style={{ 
                            background: '#e6f7ff', 
                            color: '#1890ff', 
                            borderRadius: '16px', 
                            fontWeight: 600,
                            padding: '2px 12px',
                            height: '30px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
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
            width: 360,
            render: (_, record) => {
                const maTin = record.maTin || record.maViTri;
                const isRejected = record.trangThai === 3 || record.danhSachViTri?.some(v => v.trangThai === 3);

                return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'nowrap' }}>
                        <Tooltip title="Xem chi tiết tin tuyển dụng">
                            <Button 
                                type="default"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => window.open(`/job/${maTin}`, '_blank')}
                                style={{ borderRadius: 6, fontSize: 12 }}
                            >
                                Chi tiết
                            </Button>
                        </Tooltip>

                        <Tooltip title="Xem phễu ứng viên">
                            <Button 
                                type="primary"
                                ghost
                                size="small"
                                icon={<FilterOutlined />}
                                onClick={() => navigate(`/employer/candidate-funnel/${record.maViTri || maTin}`)}
                                style={{ borderRadius: 6, fontSize: 12 }}
                            >
                                Xem phễu
                            </Button>
                        </Tooltip>

                        {/* NÚT SỬA ĐÚNG VỊ TRÍ CON */}
                        <Button 
                            size="small" 
                            type={isRejected ? "primary" : "default"}
                            danger={isRejected}
                            icon={<EditOutlined />} 
                            onClick={() => navigate(`/employer/edit-job/${record.maTin}?maViTri=${vt.maViTri}`)}
                            style={{ borderRadius: 6 }}
                        >
                            {isRejected ? "Chỉnh sửa & Gửi lại" : "Sửa vị trí"}
                        </Button>

                        {!record.isPromoted && record.trangThai === 1 && (
                            <Tooltip title="Nâng cấp bài đăng thành VIP Nổi bật">
                                <Button 
                                    type="primary"
                                    size="small"
                                    icon={<FireOutlined />}
                                    onClick={() => handlePromoteJob(record)}
                                    style={{ 
                                        backgroundColor: '#fa8c16', 
                                        borderColor: '#fa8c16', 
                                        fontWeight: 600, 
                                        borderRadius: 6,
                                        fontSize: 12
                                    }}
                                >
                                    Đẩy VIP
                                </Button>
                            </Tooltip>
                        )}

                        <Tooltip title={record.trangThai === 1 ? "Tạm dừng nhận hồ sơ cả chiến dịch" : "Mở lại nhận hồ sơ cả chiến dịch"}>
                            <Switch 
                                checked={record.trangThai === 1}
                                onChange={() => handleToggleStatus(record)}
                                size="small"
                                style={{ marginLeft: 2 }}
                            />
                        </Tooltip>
                    </div>
                );
            }
        }
    ];

    // RENDER DANH SÁCH VỊ TRÍ CON KHI MỞ RỘNG DÒNG
    const expandedRowRender = (record) => {
        const viTriList = record.danhSachViTri || [];
        if (viTriList.length === 0) {
            return <div style={{ padding: '8px 16px', color: '#94a3b8' }}>Chưa có danh sách vị trí chi tiết.</div>;
        }

        return (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AppstoreOutlined style={{ color: '#1677ff' }} />
                    Danh sách các vị trí tuyển dụng trong chiến dịch ({viTriList.length}):
                </div>
                <Row gutter={[16, 16]}>
                    {viTriList.map((vt, index) => {
                        const isRejected = vt.trangThai === 3;
                        const isApproved = vt.trangThai === 1;
                        const isClosed = vt.trangThai === 2;
                        const isPending = vt.trangThai === 0;

                        return (
                            <Col xs={24} key={vt.maViTri || index}>
                                <Card 
                                    size="small" 
                                    style={{ 
                                        borderRadius: 8, 
                                        border: isRejected ? '1px solid #fca5a5' : isApproved ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                        backgroundColor: isRejected ? '#fff5f5' : '#ffffff'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                        <div>
                                            <Space size={8}>
                                                <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                                                    {index + 1}. {vt.tenViTri}
                                                </span>
                                                {isApproved && <Tag color="success">Đang mở nhận CV</Tag>}
                                                {isClosed && <Tag color="default">Đã đóng nhận CV</Tag>}
                                                {isPending && <Tag color="warning">Đang chờ Admin duyệt</Tag>}
                                                {isRejected && <Tag color="error">Bị từ chối</Tag>}
                                            </Space>
                                            
                                            <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                                                <Space size={16} wrap>
                                                    <span><DollarOutlined /> Lương: <b>{vt.luong || 'Thỏa thuận'}</b></span>
                                                    <span><TeamOutlined /> Cần tuyển: <b>{vt.soLuongTuyen || 1}</b> người</span>
                                                    <span><UserOutlined /> Đã nộp: <b>{vt.soLuongUngVien || 0}</b> hồ sơ</span>
                                                    <span><CalendarOutlined /> Hạn chót: <b>{vt.ngayHetHan ? new Date(vt.ngayHetHan).toLocaleDateString('vi-VN') : 'Theo chiến dịch'}</b></span>
                                                </Space>
                                            </div>
                                        </div>

                                        <Space size={8}>
                                            <Button 
                                                size="small" 
                                                type="primary" 
                                                ghost
                                                icon={<FilterOutlined />} 
                                                onClick={() => navigate(`/employer/candidate-funnel/${vt.maViTri}`)}
                                                style={{ borderRadius: 6 }}
                                            >
                                                Phễu vị trí ({vt.soLuongUngVien || 0})
                                            </Button>

                                            {/* NÚT SỬA VỊ TRÍ CON */}
                                            <Button 
                                                size="small" 
                                                type={isRejected ? "primary" : "default"}
                                                danger={isRejected}
                                                icon={<EditOutlined />} 
                                                onClick={() => navigate(`/employer/edit-job/${record.maTin}`)}
                                                style={{ borderRadius: 6 }}
                                            >
                                                {isRejected ? "Chỉnh sửa & Gửi lại" : "Sửa vị trí"}
                                            </Button>

                                            {(isApproved || isClosed) && (
                                                <Tooltip title={isApproved ? "Đóng nhận hồ sơ vị trí này" : "Mở lại nhận hồ sơ vị trí này"}>
                                                    <Switch 
                                                        checked={isApproved}
                                                        onChange={() => handleTogglePositionStatus(vt.maViTri)}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            )}
                                        </Space>
                                    </div>

                                    {/* HIỂN THỊ CẢNH BÁO LÝ DO TỪ CHỐI TỪ ADMIN */}
                                    {isRejected && (
                                        <Alert 
                                            type="error"
                                            showIcon
                                            message={<b>Yêu cầu điều chỉnh từ Ban Quản Trị:</b>}
                                            description={vt.lyDoTuChoi || "Nội dung tuyển dụng chưa đạt tiêu chuẩn. Vui lòng kiểm tra lại thông tin hoặc liên hệ Admin để được hỗ trợ."}
                                            style={{ marginTop: 10, borderRadius: 6 }}
                                        />
                                    )}
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </div>
        );
    };

    return (
        <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                    Danh sách tin tuyển dụng đã đăng
                </h2>
                <Button icon={<ReloadOutlined />} onClick={fetchMyJobs} loading={loading} style={{ borderRadius: '6px' }}>
                    Tải lại
                </Button>
            </div>

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
                                <AppstoreOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                                {ind.label}
                            </Option>
                        ))}
                    </Select>
                </Col>

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
                                <EnvironmentOutlined style={{ marginRight: 6, color: '#1677ff' }} />
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
                        <Option value={2}>Đã đóng / Tạm dừng</Option>
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
                rowKey={(record) => record.maTin || record.maViTri} 
                loading={loading}
                scroll={{ x: 1200 }}
                expandable={{
                    expandedRowRender,
                    defaultExpandAllRows: false
                }}
                pagination={{ pageSize: 8, showSizeChanger: true }}
            />
        </Card>
    );
};

export default EmployerJobs;