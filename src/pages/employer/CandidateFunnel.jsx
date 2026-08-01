import React, { useState, useEffect } from 'react';
import { 
    Table, Tag, Button, Modal, Input, message, 
    Slider, Row, Col, Progress, Card, Space, Typography, Alert, Spin, Image 
} from 'antd';
import { 
    RobotOutlined, FilePdfOutlined, CalendarOutlined, 
    CrownOutlined, EyeOutlined, FormOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const { Text, Title } = Typography;
const { TextArea } = Input;

const CandidateFunnel = () => {
    const { maViTri } = useParams(); 
    const navigate = useNavigate();

    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    // State lọc AI (Gói Premium)
    const [matchRange, setMatchRange] = useState([0, 100]);
    const [statusFilter, setStatusFilter] = useState(null);

    // Modal Xem CV & Duyệt (Gói Thường)
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isViewCvModalOpen, setIsViewCvModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState(0);

    // Modal Hẹn phỏng vấn
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [interviewData, setInterviewData] = useState({ thoiGian: '', diaDiem: '', linkBaiTest: '', ghiChu: '' });

    useEffect(() => {
        checkSubscription(); // Gọi API 1: Kiểm tra gói
        if (maViTri) {
            fetchCandidates(); // Gọi API 2: Lấy ứng viên
        }
    }, [maViTri, statusFilter]);

    // 1. Hàm kiểm tra quyền Premium
    const checkSubscription = async () => {
        try {
            const response = await apiClient.get('/employer/check-subscription');
            const isSubscribed = response?.isPremium ?? response?.data?.isPremium ?? false;
            setIsPremium(Boolean(isSubscribed));
        } catch (error) {
            console.error("Lỗi kiểm tra gói dịch vụ:", error);
            setIsPremium(false);
        }
    };

    const handleTriggerAiSingle = async (maDon) => {
        try {
            message.loading({ content: "Đang gửi yêu cầu phân tích AI...", key: "ai_loading" });
            const res = await apiClient.post(`/recruitment/applications/${maDon}/re-analyze`);
            if (res?.data?.success || res?.success) {
                message.success({ content: "Phân tích AI hoàn tất!", key: "ai_loading" });
                fetchCandidates(); // Reload lại bảng phễu
            }
        } catch (err) {
            message.error({ content: "Lỗi khi kích hoạt phân tích AI", key: "ai_loading" });
        }
    };

    // 2. Hàm lấy danh sách ứng viên
    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/employer/jobs/${maViTri}/candidates`);
            const list = Array.isArray(response) 
                ? response 
                : (Array.isArray(response?.data) ? response.data : []);

            let filtered = list;
            if (statusFilter !== null && statusFilter !== undefined) {
                filtered = filtered.filter(c => c.trangThai === statusFilter);
            }
            setCandidates(filtered);
        } catch (error) {
            console.error("Lỗi khi tải danh sách ứng viên:", error);
            message.error("Lỗi khi tải danh sách ứng viên!");
            setCandidates([]); 
        } finally {
            setLoading(false);
        }
    };

    // Hàm cập nhật trạng thái đơn ứng tuyển (Có đóng Modal & Reload lại bảng)
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

    // 🔥 CẢI TIẾN LỚN: XỬ LÝ MỞ MODAL CV MƯỢT MÀ, KHÔNG TỰ ĐÓNG VÀ CẬP NHẬT NGẦM TRẠNG THÁI "ĐÃ XEM"
    const handleOpenViewCvModal = async (record) => {
        setSelectedCandidate(record);
        setIsViewCvModalOpen(true); // Mở Modal ngay lập tức!

        // Nếu ứng viên đang ở trạng thái "Mới nộp" (0)
        if (record.trangThai === 0) {
            setNewStatus(1); // Set giao diện trong Modal thành "Đã xem" (1)
            
            // Cập nhật ngay trên State local để UI bên ngoài đổi màu Tag thành "Đã xem"
            setCandidates(prevList => 
                prevList.map(item => item.maDon === record.maDon ? { ...item, trangThai: 1 } : item)
            );

            // Bắn API âm thầm cập nhật vào DB (Silent Update)
            try {
                await apiClient.put(`/employer/applications/${record.maDon}/status`, { status: 1 });
            } catch (error) {
                console.error("Lỗi cập nhật ngầm trạng thái đã xem:", error);
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

    const isPdfUrl = (url) => url && url.toLowerCase().endsWith('.pdf');

    const renderCvViewer = (cvUrl) => {
        if (!cvUrl) {
            return (
                <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                    <Text type="secondary">Ứng viên không có tệp CV đính kèm.</Text>
                </div>
            );
        }

        if (isPdfUrl(cvUrl)) {
            return (
                <iframe 
                    src={cvUrl} 
                    title="CV Candidate PDF" 
                    style={{ width: '100%', height: '500px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
            );
        }

        return (
            <div style={{ 
                width: '100%', 
                height: '500px', 
                maxHeight: '500px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#0f172a08', 
                borderRadius: 8, 
                padding: 12, 
                overflow: 'hidden' 
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

    // BẢNG GÓI PREMIUM (AI RECRUITMENT)
    const premiumColumns = [
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
            title: 'Ngày nộp',
            dataIndex: 'ngayNop',
            key: 'ngayNop',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Độ khớp AI (Matching)',
            dataIndex: 'diemMatchingTong',
            key: 'diemMatchingTong',
            sorter: (a, b) => (a.diemMatchingTong || 0) - (b.diemMatchingTong || 0),
            render: (score) => (
                <Space>
                    <Progress 
                        type="circle" 
                        percent={score || 0} 
                        width={38} 
                        strokeColor={getMatchColor(score || 0)} 
                        format={(percent) => <span style={{ fontSize: 11, fontWeight: 'bold' }}>{percent}%</span>}
                    />
                    <Text strong style={{ color: getMatchColor(score || 0) }}>
                        {score >= 80 ? 'Khớp cao' : score >= 50 ? 'Trung bình' : 'Khớp thấp'}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Trạng thái phễu',
            dataIndex: 'trangThai',
            key: 'trangThai',
            render: (status) => renderStatusTag(status)
        },
        {
            title: 'Hành động',
            key: 'hanhDong',
            align: 'center',
            render: (_, record) => {
                // Nếu CV cũ chưa được phân tích AI
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

    // BẢNG GÓI THƯỜNG (BASIC)
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
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Trạng thái phễu',
            dataIndex: 'trangThai',
            key: 'trangThai',
            render: (status) => renderStatusTag(status)
        },
        {
            title: 'Hành động',
            key: 'hanhDong',
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

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
            
            {/* GIAO DIỆN PREMIUM */}
            {isPremium ? (
                <>
                    <Card style={{ marginBottom: 20, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Row gutter={24} align="middle">
                            <Col xs={24} md={8}>
                                <Text strong style={{ color: '#0f172a' }}><CrownOutlined style={{ color: '#fa8c16', marginRight: 6 }} />Khoảng điểm Matching AI:</Text>
                                <Slider 
                                    range 
                                    defaultValue={[0, 100]} 
                                    value={matchRange} 
                                    onChange={(val) => setMatchRange(val)}
                                    tooltip={{ formatter: (v) => `${v}%` }}
                                />
                            </Col>
                            <Col xs={24} md={16} style={{ textAlign: 'right' }}>
                                <Text strong style={{ marginRight: 12 }}>Phân loại phễu:</Text>
                                <Space wrap>
                                    <Button type={statusFilter === null ? "primary" : "default"} onClick={() => setStatusFilter(null)}>Tất cả</Button>
                                    <Button type={statusFilter === 0 ? "primary" : "default"} onClick={() => setStatusFilter(0)}>Mới nộp</Button>
                                    <Button type={statusFilter === 1 ? "primary" : "default"} onClick={() => setStatusFilter(1)}>Đã xem</Button>
                                    <Button type={statusFilter === 2 ? "primary" : "default"} onClick={() => setStatusFilter(2)}>Hẹn phỏng vấn</Button>
                                    <Button type={statusFilter === 3 ? "primary" : "default"} onClick={() => setStatusFilter(3)}>Từ chối</Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Title level={4} style={{ marginBottom: 16, color: '#0f172a' }}>
                            <RobotOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                            Danh sách Ứng viên (Chế độ Phân tích AI)
                        </Title>
                        <Table 
                            columns={premiumColumns} 
                            dataSource={candidates} 
                            rowKey="maDon" 
                            pagination={{ pageSize: 10 }}
                        />
                    </div>
                </>
            ) : (
                /* GIAO DIỆN THƯỜNG */
                <>
                    <Alert
                        message={<Text strong style={{ color: '#1e40af', fontSize: 15 }}><CrownOutlined /> Tài khoản Tiêu chuẩn</Text>}
                        description={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                                <span>Nâng cấp <b>Gói AI Recruitment</b> để kích hoạt tính năng tự động bóc tách kỹ năng, chấm % độ hợp CV và lọc ứng viên thông minh.</span>
                                <Button type="primary" style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }} onClick={() => navigate('/employer/service-packages')}>
                                    Nâng cấp Premium
                                </Button>
                            </div>
                        }
                        type="info"
                        showIcon={false}
                        style={{ marginBottom: 20, borderRadius: 10, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                    />

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Title level={4} style={{ marginBottom: 16, color: '#0f172a' }}>
                            Danh sách Ứng viên Nộp đơn
                        </Title>
                        <Table 
                            columns={basicColumns} 
                            dataSource={candidates} 
                            rowKey="maDon" 
                            pagination={{ pageSize: 10 }}
                        />
                    </div>
                </>
            )}

            {/* MODAL SOI CV & DUYỆT */}
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