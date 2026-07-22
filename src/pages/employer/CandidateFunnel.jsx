import React, { useState, useEffect } from 'react';
import { 
    Table, Tag, Select, Button, Modal, Input, message, 
    Slider, Row, Col, Progress, Card, Space, Typography 
} from 'antd';
import { EyeOutlined, EditOutlined, RobotOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const CandidateFunnel = () => {
    const { maViTri } = useParams(); 
    const navigate = useNavigate();

    // Các State quản lý dữ liệu chính
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);

    // Các State bổ sung cho Bộ lọc nâng cao AI
    const [matchRange, setMatchRange] = useState([0, 100]);
    const [statusFilter, setStatusFilter] = useState(null); // null tức là hiển thị "Tất cả"

    // Các State phục vụ Modal Ghi chú
    const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
    const [currentDon, setCurrentDon] = useState(null);
    const [noteText, setNoteText] = useState("");

    // Quản lý trạng thái đóng mở và dữ liệu form hẹn phỏng vấn
    const [isInterviewModalVisible, setIsInterviewModalVisible] = useState(false);
    const [interviewData, setInterviewData] = useState({ maDon: null, thoiGian: '', diaDiem: '', ghiChu: '' });

    useEffect(() => {
        if (maViTri) {
            fetchCandidates();
        }
    }, [maViTri, matchRange, statusFilter]); // Tự động gọi lại API khi nhà tuyển dụng thay đổi bộ lọc hoặc kéo slider điểm

    // 1. Hàm gọi API lấy danh sách ứng viên tích hợp bộ lọc AI ngầm
    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/recruitment/jobs/${maViTri}/applications`, {
                params: {
                    minMatch: matchRange[0],
                    maxMatch: matchRange[1],
                    trangThai: statusFilter
                }
            });
            // Xử lý bóc tách linh hoạt mảng danh sách trả về
            const resPayload = response?.data || response;
            const actualData = resPayload.data ? resPayload.data : resPayload;

            if (Array.isArray(actualData)) {
                setCandidates(actualData);
            } else {
                setCandidates([]);
                message.warning("Dữ liệu trả về không đúng định dạng danh sách");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            message.error("Lỗi khi tải danh sách ứng viên");
            setCandidates([]); 
        }
        setLoading(false);
    };

    // 2. Hàm cập nhật trạng thái đơn ứng tuyển
    const handleStatusChange = async (maDon, newStatus) => {
        // Nếu chọn trạng thái Hẹn phỏng vấn thì kích hoạt Modal cuộc hẹn
        if (newStatus === 2) {
            setInterviewData({ maDon, thoiGian: '', diaDiem: '', ghiChu: '' });
            setIsInterviewModalVisible(true);
            return;
        }
        // Xử lý các trạng thái khác trực tiếp
        try {
            await apiClient.put(`/employer/applications/${maDon}/status`, {
                status: newStatus,
                ghiChu: null 
            });
            message.success("Cập nhật trạng thái thành công");
            fetchCandidates(); 
        } catch (error) {
            message.error("Lỗi khi cập nhật trạng thái");
        }
    };

    // 3. Gửi thông tin lịch hẹn và kích hoạt gửi email trộn mẫu từ server
    const handleSendInterviewInvite = async () => {
        try {
            await apiClient.put(`/employer/applications/${interviewData.maDon}/status`, {
                status: 2,
                thoiGian: interviewData.thoiGian,
                diaDiem: interviewData.diaDiem,
                ghiChu: interviewData.ghiChu
            });
            message.success("Đã cập nhật trạng thái và gửi thư mời phỏng vấn!");
            setIsInterviewModalVisible(false);
            fetchCandidates();
        } catch (error) {
            message.error("Lỗi hệ thống khi gửi thư mời");
        }
    };

    // 4. Hàm ghi nhận note nội bộ của nhà tuyển dụng
    const handleSaveNote = async () => {
        try {
            await apiClient.put(`/employer/applications/${currentDon.maDon}/status`, {
                status: currentDon.trangThai, 
                ghiChu: noteText
            });
            message.success("Lưu ghi chú thành công");
            setIsNoteModalVisible(false);
            fetchCandidates();
        } catch (error) {
            message.error("Lỗi khi lưu ghi chú");
        }
    };

    const openNoteModal = (record) => {
        setCurrentDon(record);
        setNoteText(record.ghiChu || "");
        setIsNoteModalVisible(true);
    };

    // Hàm phụ trợ: Đổi màu sắc Dynamic cho điểm số Matching AI
    const getMatchColor = (score) => {
        if (score >= 80) return '#52c41a'; // Xanh lá cây (Khớp cao)
        if (score >= 50) return '#fa8c16'; // Màu cam (Trung bình)
        return '#f5222d'; // Màu đỏ (Khớp thấp)
    };

    // Cấu hình các cột của bảng Ant Design Table
    const columns = [
        {
            title: 'Ứng viên',
            key: 'ungVien',
            render: (text, record) => {
                let parsedProfile = {};
                if (record.profileAiJson) {
                    try { parsedProfile = JSON.parse(record.profileAiJson); } catch(e) {}
                }
                return (
                    <div>
                        <strong>{parsedProfile.hoTen || "Ứng viên hệ thống"}</strong>
                        <div style={{ fontSize: '12px', color: 'gray' }}>{parsedProfile.email || "Chưa trích xuất email"}</div>
                        {parsedProfile.viTriHienTai && <Tag color="blue" style={{ marginTop: 4 }}>{parsedProfile.viTriHienTai}</Tag>}
                    </div>
                );
            }
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
            sorter: (a, b) => a.diemMatchingTong - b.diemMatchingTong,
            render: (score) => (
                <Space>
                    <Progress 
                        type="circle" 
                        percent={score} 
                        width={40} 
                        strokeColor={getMatchColor(score)} 
                        format={(percent) => <span style={{ fontSize: 12, fontWeight: 'bold' }}>{percent}%</span>}
                    />
                    <Text strong style={{ color: getMatchColor(score) }}>
                        {score >= 80 ? 'Khớp cao' : score >= 50 ? 'Trung bình' : 'Khớp thấp'}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Trạng thái phễu',
            dataIndex: 'trangThai',
            key: 'trangThai',
            render: (status) => {
                if (status === 0) return <Tag color="blue">Mới nộp</Tag>;
                if (status === 1) return <Tag color="orange">Đã xem</Tag>;
                if (status === 2) return <Tag color="green">Hẹn phỏng vấn</Tag>;
                if (status === 3) return <Tag color="error">Từ chối</Tag>;
                return <Tag color="default">Không rõ</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'hanhDong',
            render: (text, record) => (
                <Space>
                    <Button 
                        type="default" 
                        icon={<EyeOutlined />} 
                        onClick={() => window.open(record.cvUrl, '_blank')}
                    >
                        Xem CV
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<RobotOutlined />} 
                        onClick={() => navigate(`/employer/applications/${record.maDon}/ai-details`)}
                    >
                        Phân tích AI
                    </Button>
                    <Button type="dashed" icon={<EditOutlined />} onClick={() => openNoteModal(record)}>
                        Ghi chú
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            
            {/* THÀNH PHẦN KHỐI BỘ LỌC NÂNG CAO AI TRÊN CÙNG */}
            <Card style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Row gutter={24} align="middle">
                    <Col xs={24} md={6}>
                        <Text strong style={{ color: '#111' }}>Khoảng điểm Matching AI:</Text>
                        <Slider 
                            range 
                            defaultValue={[0, 100]} 
                            value={matchRange} 
                            onChange={(val) => setMatchRange(val)}
                            tooltip={{ formatter: (v) => `${v}%` }}
                        />
                    </Col>
                    <Col xs={24} md={18} style={{ textAlign: 'right' }}>
                        <Text strong style={{ marginRight: 12 }}>Phân loại theo phễu:</Text>
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

            {/* BẢNG DANH SÁCH ỨNG VIÊN CHÍNH */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Title level={4} style={{ marginBottom: 20, color: '#001529' }}>Ứng viên Đăng ký Xếp hạng & Khớp lệnh</Title>
                <Table 
                    columns={columns} 
                    dataSource={candidates} 
                    rowKey="maDon" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            {/* MODAL 1: GHI CHÚ NỘI BỘ */}
            <Modal
                title={`Ghi chú cho ứng viên: ${currentDon?.hoTen}`}
                visible={isNoteModalVisible}
                onOk={handleSaveNote}
                onCancel={() => setIsNoteModalVisible(false)}
                okText="Lưu ghi chú"
                cancelText="Hủy"
            >
                <TextArea 
                    rows={4} 
                    value={noteText} 
                    onChange={(e) => setNoteText(e.target.value)} 
                    placeholder="Nhập nhận xét nội bộ về ứng viên này..."
                />
            </Modal>

            {/* MODAL 2: THIẾT LẬP LỊCH HẸN PHỎNG VẤN */}
            <Modal
                title="Thiết lập Lịch hẹn Phỏng vấn & Gửi Email"
                visible={isInterviewModalVisible}
                onOk={handleSendInterviewInvite}
                onCancel={() => setIsInterviewModalVisible(false)}
                okText="Xác nhận & Gửi Mail"
                cancelText="Hủy bỏ"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: 15 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Thời gian phỏng vấn:</label>
                        <Input 
                            placeholder="VD: 09:30 - Thứ Hai, ngày 15/07/2026" 
                            value={interviewData.thoiGian}
                            onChange={(e) => setInterviewData({...interviewData, thoiGian: e.target.value})}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Địa điểm:</label>
                        <Input 
                            placeholder="VD: Văn phòng công ty hoặc link Google Meet" 
                            value={interviewData.diaDiem}
                            onChange={(e) => setInterviewData({...interviewData, diaDiem: e.target.value})}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Ghi chú / Lời nhắn thêm:</label>
                        <TextArea 
                            rows={3} 
                            placeholder="Yêu cầu trang phục hoặc tài liệu cần mang theo..." 
                            value={interviewData.ghiChu}
                            onChange={(e) => setInterviewData({...interviewData, ghiChu: e.target.value})}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CandidateFunnel;