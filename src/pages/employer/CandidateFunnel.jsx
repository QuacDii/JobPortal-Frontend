import React, { useState, useEffect } from 'react';
import { 
    Table, Tag, Select, Button, Modal, Input, message, 
    Slider, Row, Col, Progress, Card, Space, Typography 
} from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const { Text, Title } = Typography;

const CandidateFunnel = () => {
    const { maViTri } = useParams(); 
    const navigate = useNavigate();

    // Các State quản lý dữ liệu chính
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);

    // Các State bổ sung cho Bộ lọc nâng cao AI
    const [matchRange, setMatchRange] = useState([0, 100]);
    const [statusFilter, setStatusFilter] = useState(null);

    useEffect(() => {
        if (maViTri) {
            fetchCandidates();
        }
    }, [maViTri, matchRange, statusFilter]);

    // 1. Hàm gọi API lấy danh sách ứng viên
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

            const resPayload = response?.data || response;
            const actualData = resPayload.data ? resPayload.data : resPayload;
            if (Array.isArray(actualData)) {
                setCandidates(actualData);
            } else {
                setCandidates([]);
            }
        } catch (error) {
            console.error("Lỗi:", error);
            message.error("Lỗi khi tải danh sách ứng viên");
            setCandidates([]); 
        }
        setLoading(false);
    };

    const getMatchColor = (score) => {
        if (score >= 80) return '#52c41a';
        if (score >= 50) return '#fa8c16';
        return '#f5222d';
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
            align: 'center',
            render: (_, record) => (
                /* CHỈ GIỮ LẠI 1 NÚT PHÂN TÍCH AI DUY NHẤT */
                <Button 
                    type="primary" 
                    icon={<RobotOutlined />} 
                    onClick={() => navigate(`/employer/applications/${record.maDon}/ai-details`)}
                >
                    Phân tích AI
                </Button>
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
        </div>
    );
};

export default CandidateFunnel;