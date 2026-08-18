import React, { useState, useEffect } from 'react';
import { 
    Table, Tag, Button, Modal, Input, message, Tooltip,
    Slider, Row, Col, Progress, Card, Space, Typography, Alert, Spin, Image, Popover, Tabs, Badge
} from 'antd';
import { 
    RobotOutlined, FilePdfOutlined, CalendarOutlined, 
    CrownOutlined, EyeOutlined, FormOutlined, SwapOutlined, 
    CheckCircleOutlined, CloseCircleOutlined, AppstoreOutlined, ArrowLeftOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const { Text, Title } = Typography;
const { TextArea } = Input;

const CandidateFunnel = () => {
    const { maViTri } = useParams(); 
    const navigate = useNavigate();
    
    const [candidates, setCandidates] = useState([]);
    const [positions, setPositions] = useState([]);
    const [campaignTitle, setCampaignTitle] = useState('');
    const [activePositionKey, setActivePositionKey] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    // --- STATE LỌC & AI MATCHING ---
    const [matchRange, setMatchRange] = useState([0, 100]);
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    // --- STATE XEM CV & HẸN PHỎNG VẤN ---
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isViewCvModalOpen, setIsViewCvModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState(0);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [interviewData, setInterviewData] = useState({ thoiGian: '', diaDiem: '', linkBaiTest: '', ghiChu: '' });

    useEffect(() => {
        checkSubscription();
        if (maViTri) {
            fetchCandidates();
        }
    }, [maViTri]);

    // 1. Kiểm tra gói dịch vụ
    const checkSubscription = async () => {
        try {
            const response = await apiClient.get('/employer/check-subscription');
            const isSubscribed = response?.isPremium ?? response?.data?.isPremium ?? false;
            setIsPremium(Boolean(isSubscribed));
        } catch (error) {
            setIsPremium(false);
        }
    };

    // 2. Lấy danh sách ứng viên & các vị trí thuộc chiến dịch
    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/employer/jobs/${maViTri}/candidates`);
            const payload = response?.data || response;
            
            const list = Array.isArray(payload) ? payload : (payload?.data || payload?.candidates || []);
            let posList = payload?.positions || [];
            
            setCandidates(Array.isArray(list) ? list : []);
            
            // Tự động phân tách danh sách vị trí nếu backend trả về danh sách ứng viên tổng hợp
            if (posList.length === 0 && list.length > 0) {
                const uniqueMap = new Map();
                list.forEach(item => {
                    if (item.maViTri && !uniqueMap.has(item.maViTri)) {
                        uniqueMap.set(item.maViTri, {
                            maViTri: item.maViTri,
                            tenViTri: item.tenViTri || `Vị trí #${item.maViTri}`,
                            soLuongUngVien: list.filter(c => c.maViTri === item.maViTri).length
                        });
                    }
                });
                posList = Array.from(uniqueMap.values());
            }

            setPositions(posList);

            if (payload?.tieuDeChienDich) {
                setCampaignTitle(payload.tieuDeChienDich);
            }

            // Thiết lập vị trí hiển thị mặc định
            if (posList.length > 0) {
                const matchedPos = posList.find(p => String(p.maViTri) === String(maViTri));
                const defaultKey = matchedPos ? String(matchedPos.maViTri) : String(posList[0].maViTri);
                setActivePositionKey(prev => prev || defaultKey);
            }
        } catch (error) {
            message.error("Lỗi khi tải danh sách ứng viên!");
            setCandidates([]);
            setPositions([]);
        } finally {
            setLoading(false);
        }
    };

    // Khi chuyển Tab giữa các vị trí: Xóa sạch hàng đã chọn để chống so sánh chéo vị trí
    const handleTabChange = (key) => {
        setActivePositionKey(key);
        setSelectedRowKeys([]);
        setSelectedCandidates([]);
        setStatusFilter(null);
        setMatchRange([0, 100]);
    };

    // Vị trí đang được xem phễu hiện tại
    const currentPosition = positions.find(p => String(p.maViTri) === String(activePositionKey));

    // Tập ứng viên nộp riêng cho vị trí đang chọn
    const currentPositionCandidates = candidates.filter(cand => 
        !activePositionKey || String(cand.maViTri) === String(activePositionKey)
    );

    // Lọc theo trạng thái và khoảng điểm AI Matching cho vị trí đó
    const filteredCandidates = currentPositionCandidates.filter(cand => {
        const score = cand.diemMatchingTong || 0; 
        const matchesScore = score >= matchRange[0] && score <= matchRange[1];
        const matchesStatus = (statusFilter === null || statusFilter === undefined) 
            ? true 
            : cand.trangThai === statusFilter;

        return matchesScore && matchesStatus;
    });

    const renderBulletList = (text) => {
        if (!text) return <p style={{ margin: '4px 0 8px 0', fontSize: 12, color: '#94a3b8' }}>Không có</p>;
        const items = text
            .split(/(?:\r?\n|\s*-\s+)/)
            .map(item => item.trim())
            .filter(Boolean);
        if (items.length === 0) return <p style={{ margin: '4px 0 8px 0', fontSize: 12, color: '#94a3b8' }}>Không có</p>;
        return (
            <ul style={{ margin: '4px 0 10px 0', paddingLeft: 18, fontSize: 12, lineHeight: '1.5' }}>
                {items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                        {item}
                    </li>
                ))}
            </ul>
        );
    };

    // 4. Kích hoạt AI chấm điểm lại
    const handleTriggerAiSingle = async (maDon) => {
        try {
            message.loading({ content: "Đang gửi yêu cầu phân tích AI...", key: "ai_loading" });
            const res = await apiClient.post(`/recruitment/applications/${maDon}/re-analyze`);
            if (res?.data?.success || res?.success) {
                message.success({ content: "Phân tích AI hoàn tất!", key: "ai_loading" });
                fetchCandidates();
            }
        } catch (err) {
            message.error({ content: "Lỗi khi kích hoạt phân tích AI", key: "ai_loading" });
        }
    };

    // 5. Cập nhật trạng thái phễu
    const handleUpdateStatus = async (maDon, targetStatus, extraData = {}) => {
        try {
            const response = await apiClient.put(`/employer/applications/${maDon}/status`, {
                status: targetStatus,
                thoiGian: extraData.thoiGian,
                diaDiem: extraData.diaDiem,
                linkBaiTest: extraData.linkBaiTest,
                ghiChu: extraData.ghiChu
            });
            if (response?.data?.success || response?.success) {
                message.success("Cập nhật trạng thái phễu thành công!");
                setIsViewCvModalOpen(false);
                setIsInterviewModalOpen(false);
                fetchCandidates();
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Cập nhật trạng thái thất bại!");
        }
    };

    // 6. Mở Modal Xem CV
    const handleOpenViewCvModal = async (record) => {
        setSelectedCandidate(record);
        setIsViewCvModalOpen(true);
        if (record.trangThai === 0) {
            setNewStatus(1);
            setCandidates(prevList => 
                prevList.map(item => item.maDon === record.maDon ? { ...item, trangThai: 1 } : item)
            );
            try {
                await apiClient.put(`/employer/applications/${record.maDon}/status`, { status: 1 });
            } catch (error) {
                console.error("Lỗi cập nhật trạng thái đã xem:", error);
            }
        } else {
            setNewStatus(record.trangThai);
        }
    };

    const handleConfirmStatusChange = () => {
        if (newStatus === 2) {
            setIsViewCvModalOpen(false);
            setInterviewData({ thoiGian: '', diaDiem: '', linkBaiTest: '', ghiChu: '' });
            setIsInterviewModalOpen(true);
        } else {
            handleUpdateStatus(selectedCandidate.maDon, newStatus);
        }
    };

    const isPdfUrl = (url) => {
        if (!url) return false;
        const cleanUrl = url.split('?')[0].toLowerCase();
        return cleanUrl.endsWith('.pdf') || cleanUrl.includes('/pdf/') || cleanUrl.includes('application/pdf');
    };

    const renderCvViewer = (cvUrl) => {
        if (!cvUrl) {
            return (
                <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                    <Text type="secondary">Ứng viên không có tệp CV đính kèm hoặc tạo trực tiếp từ CV Builder.</Text>
                </div>
            );
        }
        if (isPdfUrl(cvUrl)) {
            const pdfViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(cvUrl)}&embedded=true`;
            return (
                <iframe 
                    src={pdfViewerUrl} 
                    title="CV Candidate PDF" 
                    style={{ width: '100%', height: '550px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
            );
        }
        return (
            <div style={{ 
                width: '100%', height: '500px', maxHeight: '500px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                backgroundColor: '#0f172a08', borderRadius: 8, padding: 12, overflow: 'hidden' 
            }}>
                <Image 
                    src={cvUrl} 
                    alt="CV Candidate" 
                    style={{ maxHeight: '480px', maxWidth: '100%', objectFit: 'contain' }} 
                />
            </div>
        );
    };

    const renderStatusTag = (status) => {
        if (status === 0) return <Tag color="blue">Mới nộp</Tag>;
        if (status === 1) return <Tag color="orange">Đã xem</Tag>;
        if (status === 2) return <Tag color="green">Hẹn phỏng vấn</Tag>;
        if (status === 3) return <Tag color="error">Từ chối</Tag>;
        return <Tag color="default">Không rõ</Tag>;
    };

    const getMatchColor = (score) => {
        if (score >= 80) return '#52c41a';
        if (score >= 50) return '#fa8c16';
        return '#f5222d';
    };

    const renderMatchDetailPopover = (record) => (
        <div style={{ width: 260, padding: 4 }}>
            <Text strong style={{ display: 'block', marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 4 }}>
                📊 Chi tiết Phân tích AI
            </Text>
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>🎯 Kỹ năng:</span><b>{record.diemKyNang || 0}/100</b>
                    </div>
                    <Progress percent={record.diemKyNang || 0} size="small" showInfo={false} strokeColor="#1890ff" />
                </div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>💼 Kinh nghiệm:</span><b>{record.diemKinhNghiem || 0}/100</b>
                    </div>
                    <Progress percent={record.diemKinhNghiem || 0} size="small" showInfo={false} strokeColor="#52c41a" />
                </div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>🏢 Lĩnh vực:</span><b>{record.diemLinhVuc || 0}/100</b>
                    </div>
                    <Progress percent={record.diemLinhVuc || 0} size="small" showInfo={false} strokeColor="#fa8c16" />
                </div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>📊 Cấp bậc:</span><b>{record.diemCapBac || 0}/100</b>
                    </div>
                    <Progress percent={record.diemCapBac || 0} size="small" showInfo={false} strokeColor="#722ed1" />
                </div>
            </Space>
        </div>
    );

    const renderCompactTag = (text, isSuccess) => {
        if (!text) return null;
        const Icon = isSuccess ? CheckCircleOutlined : CloseCircleOutlined;
        const color = isSuccess ? 'success' : 'error';
        return (
            <Tooltip 
                title={<div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 2px', lineHeight: '1.5' }}>{text}</div>} 
                placement="bottomLeft"
                overlayStyle={{ maxWidth: 450 }}
            >
                <Tag 
                    color={color} 
                    style={{ 
                        fontSize: 11, margin: '2px 0', borderRadius: 4, maxWidth: 350,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer'
                    }}
                >
                    <Icon style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
                </Tag>
            </Tooltip>
        );
    };

    // --- CỘT BẢNG PREMIUM ---
    const premiumColumns = [
        {
            title: 'Ứng viên',
            key: 'ungVien',
            render: (_, record) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>{record.hoTen || "Ứng viên"}</Text>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{record.email}</div>
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        {renderCompactTag(record.diemManhTieuBieu, true)}
                        {renderCompactTag(record.diemConThieu, false)}
                    </div>
                </div>
            )
        },
        {
            title: 'Ngày nộp',
            dataIndex: 'ngayNop',
            key: 'ngayNop',
            width: 130,
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Độ khớp AI (Matching)',
            dataIndex: 'diemMatchingTong',
            key: 'diemMatchingTong',
            width: 190,
            sorter: (a, b) => (a.diemMatchingTong || 0) - (b.diemMatchingTong || 0),
            render: (score, record) => (
                <Popover content={renderMatchDetailPopover(record)} trigger="hover" placement="right">
                    <div style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Progress 
                            type="circle" 
                            percent={score || 0} 
                            width={40} 
                            strokeColor={getMatchColor(score || 0)} 
                            format={(percent) => <span style={{ fontSize: 11, fontWeight: 'bold' }}>{percent}%</span>}
                        />
                        <div>
                            <Text strong style={{ color: getMatchColor(score || 0), display: 'block' }}>
                                {score >= 80 ? 'Khớp cao' : score >= 50 ? 'Trung bình' : 'Khớp thấp'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>Rê chuột soi chỉ số</Text>
                        </div>
                    </div>
                </Popover>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 140,
            render: (status) => renderStatusTag(status)
        },
        {
            title: 'Hành động',
            key: 'hanhDong',
            width: 180,
            align: 'center',
            render: (_, record) => {
                if (record.isPendingAi) {
                    return (
                        <Button 
                            type="default"
                            style={{ borderColor: '#fa8c16', color: '#fa8c16' }}
                            icon={<RobotOutlined />} 
                            onClick={() => handleTriggerAiSingle(record.maDon)}
                        >
                            Chấm điểm AI ngay
                        </Button>
                    );
                }
                return (
                    <Button 
                        type="primary" 
                        icon={<RobotOutlined />} 
                        onClick={() => navigate(`/employer/applications/${record.maDon}/ai-details`)}
                    >
                        Phân tích AI & Duyệt
                    </Button>
                );
            }
        }
    ];

    // --- CỘT BẢNG BASIC ---
    const basicColumns = [
        {
            title: 'Ứng viên',
            key: 'ungVien',
            render: (_, record) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>{record.hoTen || "Ứng viên"}</Text>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{record.email}</div>
                </div>
            )
        },
        {
            title: 'Ngày nộp đơn',
            dataIndex: 'ngayNop',
            key: 'ngayNop',
            width: 140,
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Trạng thái phễu',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 140,
            render: (status) => renderStatusTag(status)
        },
        {
            title: 'Hành động',
            key: 'hanhDong',
            width: 160,
            align: 'center',
            render: (_, record) => (
                <Button 
                    type="primary"
                    ghost
                    icon={<EyeOutlined />} 
                    onClick={() => handleOpenViewCvModal(record)}
                >
                    Xem CV & Duyệt
                </Button>
            )
        }
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys, selectedRows) => {
            if (keys.length > 3) {
                message.warning("Chỉ được chọn tối đa 3 ứng viên trong cùng vị trí để so sánh!");
                return;
            }
            setSelectedRowKeys(keys);
            setSelectedCandidates(selectedRows);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;

    // Danh sách Tab Vị trí tuyển dụng
    const tabItems = positions.map(pos => {
        const count = candidates.filter(c => String(c.maViTri) === String(pos.maViTri)).length;
        return {
            key: String(pos.maViTri),
            label: (
                <span style={{ fontSize: 14, fontWeight: 600, padding: '0 4px' }}>
                    <AppstoreOutlined style={{ marginRight: 6 }} />
                    {pos.tenViTri}
                    <Badge 
                        count={count} 
                        overflowCount={99} 
                        style={{ 
                            marginLeft: 8, 
                            backgroundColor: String(activePositionKey) === String(pos.maViTri) ? '#1677ff' : '#94a3b8' 
                        }} 
                    />
                </span>
            )
        };
    });

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
            
            {/* Header: Nút quay lại & Tiêu đề Chiến dịch */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employer/jobs')}>
                        Quay lại
                    </Button>
                    {campaignTitle && (
                        <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                            Chiến dịch: <span style={{ color: '#1677ff' }}>{campaignTitle}</span>
                        </Title>
                    )}
                </Space>
                {currentPosition && (
                    <Space size={12}>
                        <Tag color="blue" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6 }}>
                            Cấp bậc: <b>{currentPosition.capBac || 'Không yêu cầu'}</b>
                        </Tag>
                        <Tag color="green" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6 }}>
                            Chỉ tiêu: <b>{currentPosition.soLuongTuyen || 1} nhân sự</b>
                        </Tag>
                    </Space>
                )}
            </div>

            {/* TAB CHUYỂN ĐỔI VỊ TRÍ ĐỘC LẬP */}
            {positions.length > 0 && (
                <Tabs
                    activeKey={activePositionKey}
                    onChange={handleTabChange}
                    type="card"
                    size="large"
                    items={tabItems}
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* BỘ LỌC PHỄU ỨNG VIÊN CHO VỊ TRÍ HIỆN TẠI */}
            <Card style={{ marginBottom: 20, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Row gutter={[24, 16]} align="middle">
                    
                    {/* Lọc Trạng thái phễu */}
                    <Col xs={24} md={isPremium ? 12 : 24}>
                        <Text strong style={{ marginRight: 8, display: 'inline-block', marginBottom: 8 }}>
                            Trạng thái hồ sơ:
                        </Text>
                        <Space wrap style={{ marginTop: 4 }}>
                            <Button type={statusFilter === null ? "primary" : "default"} onClick={() => setStatusFilter(null)}>
                                Tất cả ({currentPositionCandidates.length})
                            </Button>
                            <Button type={statusFilter === 0 ? "primary" : "default"} onClick={() => setStatusFilter(0)}>
                                Mới nộp
                            </Button>
                            <Button type={statusFilter === 1 ? "primary" : "default"} onClick={() => setStatusFilter(1)}>
                                Đã xem
                            </Button>
                            <Button 
                                type={statusFilter === 2 ? "primary" : "default"} 
                                style={statusFilter === 2 ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : {}} 
                                onClick={() => setStatusFilter(2)}
                            >
                                Hẹn phỏng vấn
                            </Button>
                            <Button danger type={statusFilter === 3 ? "primary" : "default"} onClick={() => setStatusFilter(3)}>
                                Từ chối
                            </Button>
                        </Space>
                    </Col>

                    {/* Lọc điểm Matching AI (Gói Premium) */}
                    {isPremium && (
                        <>
                            <Col xs={24} md={7}>
                                <Text strong style={{ color: '#0f172a' }}>
                                    <CrownOutlined style={{ color: '#fa8c16', marginRight: 6 }} />
                                    Điểm Matching AI:
                                </Text>
                                <Slider 
                                    range 
                                    value={matchRange} 
                                    onChange={(val) => setMatchRange(val)}
                                    tooltip={{ formatter: (v) => `${v}%` }}
                                />
                            </Col>
                            <Col xs={24} md={5} style={{ textAlign: 'right' }}>
                                <Tooltip title={selectedCandidates.length < 2 ? "Tick chọn từ 2 đến 3 ứng viên trong cùng vị trí để so sánh" : ""}>
                                    <Button 
                                        type="primary" 
                                        icon={<SwapOutlined />}
                                        onClick={() => {
                                            if (selectedCandidates.length < 2) {
                                                message.warning("Vui lòng chọn ít nhất 2 ứng viên trong cùng vị trí để so sánh!");
                                                return;
                                            }
                                            setIsCompareModalOpen(true);
                                        }}
                                        style={{ 
                                            backgroundColor: '#722ed1', borderColor: '#722ed1',
                                            fontWeight: '600', opacity: selectedCandidates.length < 2 ? 0.5 : 1
                                        }}
                                    >
                                        So sánh ({selectedCandidates.length}/3)
                                    </Button>
                                </Tooltip>
                            </Col>
                        </>
                    )}
                </Row>
            </Card>

            {/* BẢNG HỒ SƠ ỨNG VIÊN THUỘC VỊ TRÍ ĐANG CHỌN */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                        {isPremium ? <RobotOutlined style={{ color: '#1677ff', marginRight: 8 }} /> : <UserOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
                        Danh sách ứng viên ứng tuyển vị trí: <span style={{ color: '#1677ff' }}>{currentPosition?.tenViTri || 'Vị trí'}</span> ({filteredCandidates.length})
                    </Title>
                    {isPremium && (
                        <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                            * Tick chọn ô vuông đầu dòng để so sánh ứng viên cho vị trí này
                        </Text>
                    )}
                </div>
                
                <Table 
                    rowSelection={isPremium ? rowSelection : null}
                    columns={isPremium ? premiumColumns : basicColumns} 
                    dataSource={filteredCandidates}
                    rowKey="maDon" 
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Chưa có hồ sơ nào ứng tuyển vào vị trí này.' }}
                />
            </div>

            {/* MODAL SO SÁNH SONG SONG 2 - 3 ỨNG VIÊN CÙNG 1 VỊ TRÍ */}
            <Modal
                title={
                    <div>
                        <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                            <SwapOutlined /> So sánh ứng viên vị trí: {currentPosition?.tenViTri}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Đối chiếu năng lực và chỉ số Matching AI giữa các ứng viên cùng ứng tuyển một vị trí
                        </Text>
                    </div>
                }
                open={isCompareModalOpen}
                onCancel={() => setIsCompareModalOpen(false)}
                footer={[<Button key="close" onClick={() => setIsCompareModalOpen(false)}>Đóng</Button>]}
                width={1000}
                centered
            >
                <Row gutter={16} style={{ marginTop: 20, display: 'flex', alignItems: 'stretch' }}>
                    {selectedCandidates.map(cand => (
                        <Col 
                            span={24 / selectedCandidates.length} 
                            key={cand.maDon}
                            style={{ display: 'flex' }}
                        >
                            <Card 
                                style={{ 
                                    borderRadius: 8, 
                                    borderTop: `4px solid ${getMatchColor(cand.diemMatchingTong || 0)}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '100%' 
                                }}
                                bodyStyle={{ 
                                    padding: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1
                                }}
                            >
                                <Title level={5} style={{ marginBottom: 2 }}>{cand.hoTen}</Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>{cand.email}</Text>
                                
                                <div style={{ textAlign: 'center', margin: '14px 0' }}>
                                    <Progress 
                                        type="circle" 
                                        percent={cand.diemMatchingTong || 0} 
                                        width={65} 
                                        strokeColor={getMatchColor(cand.diemMatchingTong || 0)} 
                                    />
                                </div>
                                <Space direction="vertical" style={{ width: '100%', fontSize: 13 }} size={8}>
                                    <div>🎯 Kỹ năng: <b>{cand.diemKyNang || 0}/100</b></div>
                                    <div>💼 Kinh nghiệm: <b>{cand.diemKinhNghiem || 0}/100</b></div>
                                    <div>🏢 Lĩnh vực: <b>{cand.diemLinhVuc || 0}/100</b></div>
                                    <div>📊 Cấp bậc: <b>{cand.diemCapBac || 0}/100</b></div>
                                </Space>
                                
                                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 10, marginTop: 12, flex: 1 }}>
                                    <Text type="success" strong style={{ fontSize: 12 }}>🟢 Điểm mạnh tiêu biểu:</Text>
                                    {renderBulletList(cand.diemManhTieuBieu)}
                                    
                                    <Text type="danger" strong style={{ fontSize: 12 }}>🔴 Điểm còn thiếu:</Text>
                                    {renderBulletList(cand.diemConThieu)}
                                </div>

                                <Button 
                                    type="primary" 
                                    block 
                                    style={{ marginTop: 16, fontWeight: 'bold' }}
                                    onClick={() => {
                                        setIsCompareModalOpen(false);
                                        navigate(`/employer/applications/${cand.maDon}/ai-details`);
                                    }}
                                >
                                    Xem chi tiết & Duyệt
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Modal>

            {/* MODAL SOI CV & CHUYỂN TRẠNG THÁI */}
            <Modal
                title={
                    <Space>
                        <FilePdfOutlined style={{ color: '#1677ff' }} />
                        <span>Xem CV & Cập nhật Trạng thái: {selectedCandidate?.hoTen}</span>
                    </Space>
                }
                open={isViewCvModalOpen}
                onCancel={() => setIsViewCvModalOpen(false)}
                onOk={handleConfirmStatusChange}
                okText="Cập nhật trạng thái"
                cancelText="Đóng"
                width={850}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                    {renderCvViewer(selectedCandidate?.cvUrl)}
                    <Card size="small" style={{ backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                        <Row align="middle" justify="space-between">
                            <Col>
                                <Text strong><FormOutlined /> Chuyển trạng thái phễu ứng viên:</Text>
                            </Col>
                            <Col>
                                <Space>
                                    <Button 
                                        type={newStatus === 1 ? "primary" : "default"} 
                                        onClick={() => setNewStatus(1)}
                                    >
                                        Đã xem
                                    </Button>
                                    <Button 
                                        type={newStatus === 2 ? "primary" : "default"} 
                                        style={newStatus === 2 ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : {}}
                                        onClick={() => setNewStatus(2)}
                                    >
                                        Hẹn phỏng vấn
                                    </Button>
                                    <Button 
                                        danger 
                                        type={newStatus === 3 ? "primary" : "default"} 
                                        onClick={() => setNewStatus(3)}
                                    >
                                        Từ chối
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </div>
            </Modal>

            {/* MODAL HẸN PHỎNG VẤN */}
            <Modal
                title={
                    <Space>
                        <CalendarOutlined style={{ color: '#16a34a' }} />
                        <span>Gửi thư mời phỏng vấn: {selectedCandidate?.hoTen}</span>
                    </Space>
                }
                open={isInterviewModalOpen}
                onCancel={() => setIsInterviewModalOpen(false)}
                onOk={() => {
                    if (!interviewData.thoiGian || !interviewData.diaDiem) {
                        message.warning("Vui lòng nhập Thời gian và Địa điểm phỏng vấn!");
                        return;
                    }
                    handleUpdateStatus(selectedCandidate.maDon, 2, interviewData);
                }}
                okText="Gửi Thư Mời & Email"
                cancelText="Hủy"
                width={540}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Thời gian phỏng vấn <Text type="danger">*</Text></Text>
                        <Input 
                            placeholder="VD: 09:30 Sáng - Thứ 6, Ngày 20/11/2026" 
                            value={interviewData.thoiGian}
                            onChange={(e) => setInterviewData({ ...interviewData, thoiGian: e.target.value })}
                        />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Địa điểm / Link Online <Text type="danger">*</Text></Text>
                        <Input 
                            placeholder="VD: Tầng 5, Tòa nhà JobsNow hoặc Link Google Meet..." 
                            value={interviewData.diaDiem}
                            onChange={(e) => setInterviewData({ ...interviewData, diaDiem: e.target.value })}
                        />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Link bài test kỹ năng (Tùy chọn)</Text>
                        <Input 
                            placeholder="https://..." 
                            value={interviewData.linkBaiTest}
                            onChange={(e) => setInterviewData({ ...interviewData, linkBaiTest: e.target.value })}
                        />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Ghi chú nội bộ</Text>
                        <TextArea 
                            rows={2} 
                            placeholder="Ghi chú riêng cho Hội đồng phỏng vấn..." 
                            value={interviewData.ghiChu}
                            onChange={(e) => setInterviewData({ ...interviewData, ghiChu: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CandidateFunnel;