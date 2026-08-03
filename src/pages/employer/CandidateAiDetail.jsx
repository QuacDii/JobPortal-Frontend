import React, { useState, useEffect } from 'react';
import { 
    Row, Col, Card, Tag, Progress, Input, Button, message, 
    Spin, Select, Typography, Space, Divider, Modal, DatePicker 
} from 'antd';
import { 
    RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, 
    SaveOutlined, ArrowLeftOutlined, MailOutlined, PhoneOutlined, 
    EnvironmentOutlined, EyeOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '../../api/apiClient';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const CandidateAiDetail = () => {
    const { maDon } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [aiDetail, setAiDetail] = useState(null);
    const [noteText, setNoteText] = useState("");
    
    // Các State phục vụ Modal hẹn phỏng vấn
    const [isInterviewModalVisible, setIsInterviewModalVisible] = useState(false);
    const [interviewData, setInterviewData] = useState({ thoiGian: null, diaDiem: '', linkBaiTest: '', ghiChu: '' });
    
    // 🌟 1. STATE QUẢN LÝ HIỆU ỨNG LOADING KHI GỬI MAIL
    const [sendingMail, setSendingMail] = useState(false);

    useEffect(() => {
        if (maDon) {
            fetchAiDetails();
        }
    }, [maDon]);

    const fetchAiDetails = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/recruitment/applications/${maDon}/ai-details`);
            const resPayload = response?.data || response;
            const actualData = resPayload.data ? resPayload.data : resPayload;
            
            console.log(">>> Dữ liệu AI Detail từ Server:", actualData);
            if (actualData && (actualData.aiAnalysis || actualData.maDon)) {
                setAiDetail(actualData);
                setNoteText(actualData.ghiChuTuyenDung || "");
            } else {
                message.error("Không tìm thấy dữ liệu phân tích của hồ sơ này!");
            }
        } catch (error) {
            console.error(error);
            message.error("Lỗi hệ thống khi tải chi tiết AI");
        }
        setLoading(false);
    };

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 2) {
            setInterviewData({ thoiGian: null, diaDiem: '', linkBaiTest: '', ghiChu: '' });
            setIsInterviewModalVisible(true);
            return;
        }
        try {
            await apiClient.put(`/employer/applications/${maDon}/status`, {
                status: newStatus,
                ghiChu: null 
            });
            message.success("Cập nhật trạng thái ứng viên thành công!");
            fetchAiDetails(); 
        } catch (error) {
            const msg = error.response?.data?.message || "Không thể cập nhật trạng thái do vi phạm logic phễu";
            message.error(msg);
        }
    };

    // 🌟 HÀM FORMAT THỜI GIAN SANG TIẾNG VIỆT TỰ NHIÊN
    const formatVietnameseDateTime = (dateObj) => {
        if (!dateObj) return '';
        const daysVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const d = dayjs(dateObj);
        const dayName = daysVi[d.day()];
        return `${d.format('HH:mm')} - ${dayName}, ngày ${d.format('DD/MM/YYYY')}`;
    };

    // 🌟 2. HÀM GỬI LỊCH PHỎNG VẤN KÈM EFFECT LOADING
    const handleSendInterviewInvite = async () => {
        if (!interviewData.thoiGian) {
            message.warning("Vui lòng chọn Thời gian phỏng vấn!");
            return;
        }
        if (dayjs(interviewData.thoiGian).isBefore(dayjs())) {
            message.warning("Thời gian phỏng vấn không được nhỏ hơn thời điểm hiện tại!");
            return;
        }
        if (!interviewData.diaDiem || !interviewData.diaDiem.trim()) {
            message.warning("Vui lòng nhập Địa điểm phỏng vấn!");
            return;
        }

        setSendingMail(true); // ⚡ Bật hiệu ứng Loading
        try {
            const formattedTime = formatVietnameseDateTime(interviewData.thoiGian);

            await apiClient.put(`/employer/applications/${maDon}/status`, {
                status: 2,
                thoiGian: formattedTime,
                diaDiem: interviewData.diaDiem,
                linkBaiTest: interviewData.linkBaiTest, 
                ghiChu: interviewData.ghiChu || null
            });
            message.success("Đã cập nhật trạng thái và gửi thư mời phỏng vấn thành công!");
            setIsInterviewModalVisible(false);
            fetchAiDetails();
        } catch (error) {
            message.error("Lỗi hệ thống khi gửi thư mời phỏng vấn");
        } finally {
            setSendingMail(false); // ⚡ Tắt hiệu ứng Loading dù thành công hay thất bại
        }
    };

    const handleSaveNote = async () => {
        try {
            await apiClient.put(`/employer/applications/${maDon}/status`, {
                status: aiDetail?.trangThaiHienTai, 
                ghiChu: noteText
            });
            message.success("Đã lưu ghi chú nội bộ tuyển dụng thành công!");
        } catch (error) {
            message.error("Lỗi khi lưu ghi chú");
        }
    };

    // VÔ HIỆU HÓA CÁC NGÀY / GIỜ TRONG QUÁ KHỨ
    const disabledDate = (current) => {
        return current && current < dayjs().startOf('day');
    };

    const disabledDateTime = (current) => {
        if (!current) return {};
        const now = dayjs();
        if (current.isSame(now, 'day')) {
            return {
                disabledHours: () => Array.from({ length: now.hour() }, (_, i) => i),
                disabledMinutes: (selectedHour) => {
                    if (selectedHour === now.hour()) {
                        return Array.from({ length: now.minute() }, (_, i) => i);
                    }
                    return [];
                }
            };
        }
        return {};
    };

    const renderBulletPoints = (text, type) => {
        if (!text) return <li>Không có ghi nhận từ hệ thống</li>;
        const icon = type === 'strengths' 
            ? <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            : <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />;
            
        return text.split('\n').map((line, i) => {
            const cleanLine = line.replace(/^-\s*/, '');
            if (!cleanLine.trim()) return null;
            return (
                <li key={i} style={{ listStyleType: 'none', marginBottom: 8, display: 'flex', alignItems: 'flex-start', color: '#595959' }}>
                    {icon} <span>{cleanLine}</span>
                </li>
            );
        });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Spin tip="Hệ thống AI đang trích xuất dữ liệu chi tiết..." size="large" />
            </div>
        );
    }

    let profile = {};
    if (aiDetail?.aiAnalysis?.profileExtractedJson) {
        try { profile = JSON.parse(aiDetail.aiAnalysis.profileExtractedJson); } catch (e) {}
    }

    const ai = aiDetail?.aiAnalysis || {};
    const rawCvUrl = 
            aiDetail?.cvUrl || 
            aiDetail?.duongDanCv || 
            aiDetail?.duongDan || 
            aiDetail?.cvPath ||
            aiDetail?.maCvNavigation?.duongDan ||
            profile?.cvUrl || 
            profile?.duongDan;

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                Quay lại danh sách phễu ứng viên
            </Button>
            
            <Row gutter={24}>
                {/* CỘT TRÁI: THÔNG TIN HỒ SƠ CƠ BẢN */}
                <Col xs={24} md={6}>
                    <Card style={{ borderRadius: 12, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#f0f3ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', margin: '0 auto 16px' }}>
                            {profile.hoTen ? profile.hoTen.charAt(0) : 'U'}
                        </div>
                        
                        <Title level={3} style={{ marginBottom: 4 }}>{profile.hoTen || "Ứng viên hệ thống"}</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{profile.viTriHienTai || "Chức danh chưa rõ"}</Text>
                        
                        <Button 
                            type="primary" 
                            ghost 
                            icon={<EyeOutlined />} 
                            block 
                            style={{ marginBottom: 20, borderRadius: 6 }}
                            onClick={() => {
                                if (rawCvUrl) {
                                    window.open(rawCvUrl, '_blank');
                                } else {
                                    message.warning("Không tìm thấy đường dẫn file CV gốc!");
                                }
                            }}
                        >
                            Xem CV gốc (PDF)
                        </Button>

                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, color: '#475569' }}>
                            <div><MailOutlined style={{ marginRight: 8 }} /> {profile.email || "N/A"}</div>
                            <div><PhoneOutlined style={{ marginRight: 8 }} /> {profile.sdt || "N/A"}</div>
                            <div><EnvironmentOutlined style={{ marginRight: 8 }} /> {profile.noiCuTru || "Chưa rõ"}</div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div><strong>Kinh nghiệm:</strong> {profile.namKinhNghiem || "0 năm"}</div>
                            <div><strong>Học vấn:</strong> {profile.hocVan || "Chưa cập nhật"}</div>
                            {profile.chungChi && <div><strong>Chứng chỉ:</strong> {profile.chungChi}</div>}
                        </div>

                        <Divider style={{ margin: '20px 0' }} />

                        <div style={{ textAlign: 'left' }}>
                            <Text strong type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>TRẠNG THÁI HIỆN TẠI</Text>
                            <Select 
                                value={aiDetail?.trangThaiHienTai} 
                                style={{ width: '100%' }}
                                onChange={handleStatusChange}
                            >
                                <Option value={0} disabled={aiDetail?.trangThaiHienTai > 0}>Mới nộp</Option>
                                <Option value={1} disabled={aiDetail?.trangThaiHienTai > 1}>Đã xem</Option>
                                <Option value={2}>Hẹn phỏng vấn (Gửi Email)</Option>
                                <Option value={3}>Từ chối</Option>
                            </Select>
                        </div>
                    </Card>
                </Col>

                {/* CỘT PHẢI: KẾT QUẢ PHÂN TÍCH AI */}
                <Col xs={24} md={18}>
                    <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 24 }}>
                            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                                <RobotOutlined style={{ color: '#10b981', marginRight: 8 }} /> Phân tích Matching gần nhất
                            </Title>
                            <Tag color="cyan" style={{ fontSize: 16, padding: '4px 12px', borderRadius: 20, fontWeight: 'bold', marginLeft: 'auto' }}>
                                {ai.diemMatchingTong || 0}% Match
                            </Tag>
                        </div>

                        <Row gutter={[32, 16]} style={{ marginBottom: 28 }}>
                            <Col span={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text strong>Kỹ năng</Text><Text strong>{ai.diemKyNang || 0}%</Text>
                                </div>
                                <Progress percent={ai.diemKyNang} showInfo={false} strokeColor="#3b82f6" strokeWidth={6} />
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text strong>Kinh nghiệm</Text><Text strong>{ai.diemKinhNghiem || 0}%</Text>
                                </div>
                                <Progress percent={ai.diemKinhNghiem} showInfo={false} strokeColor="#10b981" strokeWidth={6} />
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text strong>Lĩnh vực</Text><Text strong>{ai.diemLinhVuc || 0}%</Text>
                                </div>
                                <Progress percent={ai.diemLinhVuc} showInfo={false} strokeColor="#f59e0b" strokeWidth={6} />
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text strong>Cấp bậc</Text><Text strong>{ai.diemCapBac || 0}%</Text>
                                </div>
                                <Progress percent={ai.diemCapBac} showInfo={false} strokeColor="#8b5cf6" strokeWidth={6} />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 16, borderRadius: 8, height: '100%' }}>
                                    <Text strong style={{ color: '#16a34a', display: 'block', marginBottom: 12 }}>✔️ Điểm mạnh tiêu biểu</Text>
                                    <ul style={{ paddingLeft: 4, margin: 0 }}>{renderBulletPoints(ai.diemManhTieuBieu, 'strengths')}</ul>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 8, height: '100%' }}>
                                    <Text strong style={{ color: '#dc2626', display: 'block', marginBottom: 12 }}>❌ Điểm còn thiếu</Text>
                                    <ul style={{ paddingLeft: 4, margin: 0 }}>{renderBulletPoints(ai.diemConThieu, 'weaknesses')}</ul>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 28 }}>
                            <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 12, color: '#64748b', letterSpacing: '0.5px' }}>TẤT CẢ KỸ NĂNG TRÍCH XUẤT</Text>
                            <Space wrap>
                                {profile.kyNangNoiBat && profile.kyNangNoiBat.length > 0 ? (
                                    profile.kyNangNoiBat.map((skill, idx) => (
                                        <Tag key={idx} style={{ background: '#eef2f6', border: 'none', color: '#4f46e5', padding: '4px 12px', borderRadius: 6, fontWeight: 500 }}>
                                            {skill}
                                        </Tag>
                                    ))
                                ) : <Text type="secondary">Không phát hiện từ khóa kỹ năng</Text>}
                            </Space>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text strong style={{ fontSize: 12, color: '#64748b' }}>📑 GHI CHÚ TUYỂN DỤNG</Text>
                                <Button type="text" size="small" icon={<SaveOutlined />} onClick={handleSaveNote} style={{ color: '#4f46e5', fontWeight: 500 }}>
                                    Lưu ghi chú
                                </Button>
                            </div>
                            <TextArea 
                                rows={4} 
                                value={noteText} 
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Nhập nhận xét nội bộ tuyển dụng về hồ sơ ứng viên này..."
                                style={{ borderRadius: 8 }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* 🌟 3. MODAL TÍCH HỢP PROPS CONFIRMLOADING & ĐÓNG DÙNG THỰC THỂ */}
            <Modal
                title="Thiết lập Lịch hẹn Phỏng vấn & Gửi Email"
                open={isInterviewModalVisible}
                onOk={handleSendInterviewInvite}
                onCancel={() => !sendingMail && setIsInterviewModalVisible(false)}
                confirmLoading={sendingMail} // ⚡ Xoay Spinner ngay trên nút "Xác nhận & Gửi Mail"
                okText="Xác nhận & Gửi Mail"
                cancelText="Hủy bỏ"
                cancelButtonProps={{ disabled: sendingMail }} // ⚡ Khóa nút Hủy khi đang gửi
                maskClosable={!sendingMail} // ⚡ Không cho bấm ra ngoài để tắt modal khi đang gửi
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: 15 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Thời gian phỏng vấn:</label>
                        <DatePicker 
                            showTime={{ format: 'HH:mm' }}
                            format="HH:mm - DD/MM/YYYY"
                            placeholder="VD: 09:30 - Thứ Hai, ngày 15/07/2026"
                            style={{ width: '100%' }}
                            value={interviewData.thoiGian ? dayjs(interviewData.thoiGian) : null}
                            onChange={(date) => setInterviewData({ ...interviewData, thoiGian: date })}
                            disabledDate={disabledDate}
                            disabledTime={disabledDateTime}
                            disabled={sendingMail}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Địa điểm:</label>
                        <Input 
                            placeholder="VD: Văn phòng công ty hoặc link Google Meet" 
                            value={interviewData.diaDiem}
                            onChange={(e) => setInterviewData({ ...interviewData, diaDiem: e.target.value })}
                            disabled={sendingMail}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Đường dẫn bài kiểm tra / Test đầu vào (Nếu có):</label>
                        <Input 
                            placeholder="VD: https://hackerrank.com/company-test-abc hoặc Google Forms" 
                            value={interviewData.linkBaiTest}
                            onChange={(e) => setInterviewData({ ...interviewData, linkBaiTest: e.target.value })}
                            disabled={sendingMail}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Ghi chú / Lời nhắn thêm:</label>
                        <TextArea 
                            rows={3} 
                            placeholder="Yêu cầu trang phục hoặc tài liệu cần mang theo..." 
                            value={interviewData.ghiChu}
                            onChange={(e) => setInterviewData({ ...interviewData, ghiChu: e.target.value })}
                            disabled={sendingMail}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CandidateAiDetail;