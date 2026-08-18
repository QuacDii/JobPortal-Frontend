import React, { useEffect, useState } from 'react';
import { 
    Table, Button, Space, message, Card, Modal, Input, Tag, Row, Col,
    Drawer, Descriptions, Typography, Avatar, Badge, List, Tooltip, Alert, Popconfirm 
} from 'antd';
import { 
    CheckOutlined, CloseOutlined, NotificationOutlined, 
    CalendarOutlined, EyeOutlined, BuildOutlined, DollarOutlined, 
    TeamOutlined, SolutionOutlined, RocketOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text, Paragraph } = Typography;

const ApproveCampaigns = () => {
    const [jobPosts, setJobPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State quản lý Drawer và Thẩm định
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [rejectingViTri, setRejectingViTri] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchPendingJobPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await apiClient.get('/AdminApproval/pending-job-posts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payload = response?.data || response;
            const list = Array.isArray(payload) ? payload : [];
            setJobPosts(list);

            if (selectedJob) {
                const updated = list.find(j => j.maTin === selectedJob.maTin);
                if (updated) {
                    setSelectedJob(updated);
                } else {
                    setDrawerOpen(false); // Đóng Drawer nếu toàn bộ vị trí trong chiến dịch đã được duyệt/từ chối xong
                }
            }
        } catch (error) {
            message.error("Lỗi khi tải danh sách tin tuyển dụng chờ duyệt!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingJobPosts();
    }, []);

    // 1. Duyệt / Từ chối riêng 1 vị trí
    const handleReviewPosition = async (maViTri, isApproved, lyDo = null) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const res = await apiClient.put('/AdminApproval/review-position', 
                { maViTri, isApproved, lyDoTuChoi: lyDo },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res?.data?.success || res?.success) {
                message.success(isApproved ? "Đã duyệt vị trí thành công!" : "Đã từ chối vị trí!");
                setIsRejectModalOpen(false);
                setRejectReason('');
                setRejectingViTri(null);
                fetchPendingJobPosts();
            }
        } catch (error) {
            message.error("Lỗi khi thẩm định vị trí!");
        } finally {
            setSubmitting(false);
        }
    };

    // 2. Duyệt TẤT CẢ vị trí trong 1 chiến dịch
    const handleApproveAll = async (maTin) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const res = await apiClient.put(`/AdminApproval/approve-all-positions/${maTin}`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res?.data?.success || res?.success) {
                message.success("Đã phê duyệt toàn bộ vị trí trong chiến dịch!");
                setDrawerOpen(false);
                fetchPendingJobPosts();
            }
        } catch (error) {
            message.error("Lỗi khi duyệt toàn bộ vị trí!");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDetail = (record) => {
        setSelectedJob(record);
        setDrawerOpen(true);
    };

    const columns = [
        {
            title: 'Tiêu đề Chiến dịch / Tin đăng',
            dataIndex: 'tieuDeChienDich',
            key: 'tieuDeChienDich',
            render: (text, record) => (
                <div>
                    <Space size={8}>
                        <NotificationOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                        <Text strong style={{ fontSize: 14 }}>{text}</Text>
                    </Space>
                    {record.isPromoted && (
                        <Tag color="gold" style={{ marginLeft: 8, borderRadius: 10 }}>
                            🔥 Tin nổi bật
                        </Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Doanh Nghiệp',
            dataIndex: 'tenCongTy',
            key: 'tenCongTy',
            render: (text, record) => (
                <Space>
                    <Avatar 
                        src={record.logoCongTy} 
                        icon={<BuildOutlined />} 
                        style={{ backgroundColor: '#e2e8f0', color: '#64748b' }} 
                        size="small"
                    />
                    <Text strong style={{ color: '#334155' }}>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Chờ duyệt',
            dataIndex: 'danhSachViTri',
            key: 'soLuongViTri',
            align: 'center',
            render: (viTriList) => {
                const pendingCount = viTriList?.filter(v => v.trangThai === 0).length || 0;
                return (
                    <Tooltip title={`${pendingCount}/${viTriList?.length || 0} vị trí đang chờ duyệt`}>
                        <Badge count={pendingCount} showZero color={pendingCount > 0 ? "#faad14" : "#10b981"} />
                    </Tooltip>
                );
            }
        },
        {
            title: 'Hạn chót chiến dịch',
            dataIndex: 'ngayHetHan',
            key: 'ngayHetHan',
            render: (date) => (
                <Text type="secondary">
                    <CalendarOutlined style={{ marginRight: 6 }} />
                    {new Date(date).toLocaleDateString('vi-VN')}
                </Text>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    onClick={() => handleOpenDetail(record)}
                >
                    Xem & Thẩm định
                </Button>
            ),
        },
    ];

    return (
        <Card 
            title={
                <Space align="center">
                    <RocketOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                    <h3 style={{ margin: 0 }}>Kiểm duyệt Tin tuyển dụng & Chiến dịch</h3>
                </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
            <Table 
                columns={columns} 
                dataSource={jobPosts} 
                rowKey="maTin" 
                loading={loading}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: 'Hiện tại không có chiến dịch nào đang chờ duyệt.' }}
            />

            {/* DRAWER THẨM ĐỊNH CHI TIẾT */}
            <Drawer
                title={
                    <Space>
                        <SolutionOutlined style={{ color: '#1677ff' }} />
                        <span>Thẩm định Chiến dịch #{selectedJob?.maTin}</span>
                    </Space>
                }
                width={780}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                extra={
                    selectedJob && (
                        <Popconfirm
                            title="Duyệt tất cả vị trí?"
                            description="Phê duyệt toàn bộ các vị trí đang chờ trong chiến dịch này lên hệ thống?"
                            onConfirm={() => handleApproveAll(selectedJob.maTin)}
                            okText="Duyệt tất cả"
                            cancelText="Hủy"
                        >
                            <Button 
                                type="primary" 
                                icon={<CheckCircleOutlined />} 
                                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                                loading={submitting}
                            >
                                Duyệt tất cả vị trí
                            </Button>
                        </Popconfirm>
                    )
                }
            >
                {selectedJob && (
                    <div>
                        <Card size="small" style={{ backgroundColor: '#f8fafc', borderRadius: 10, marginBottom: 20, border: '1px solid #e2e8f0' }}>
                            <Space size={16} align="start">
                                <Avatar size={54} src={selectedJob.logoCongTy} icon={<BuildOutlined />} />
                                <div>
                                    <Title level={5} style={{ margin: 0, color: '#0f172a' }}>{selectedJob.tieuDeChienDich}</Title>
                                    <Text type="secondary">{selectedJob.tenCongTy}</Text>
                                    <div style={{ marginTop: 6 }}>
                                        <Tag color="blue"><CalendarOutlined /> Hạn nộp: {new Date(selectedJob.ngayHetHan).toLocaleDateString('vi-VN')}</Tag>
                                        {selectedJob.isPromoted && <Tag color="gold">🔥 Tin VIP Promoted</Tag>}
                                    </div>
                                </div>
                            </Space>
                        </Card>

                        <Title level={5} style={{ color: '#334155', marginBottom: 12 }}>
                            📋 Danh sách các vị trí tuyển dụng ({selectedJob.danhSachViTri?.length || 0}):
                        </Title>

                        <List
                            itemLayout="vertical"
                            dataSource={selectedJob.danhSachViTri || []}
                            renderItem={(viTri, index) => (
                                <Card 
                                    key={viTri.maViTri || index} 
                                    style={{ 
                                        marginBottom: 16, 
                                        borderRadius: 10, 
                                        border: viTri.trangThai === 1 
                                            ? '1px solid #86efac' 
                                            : viTri.trangThai === 3 
                                            ? '1px solid #fca5a5' 
                                            : '1px solid #cbd5e1' 
                                    }}
                                    bodyStyle={{ padding: 16 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 16, color: '#1e293b' }}>
                                            {index + 1}. {viTri.tenViTri}
                                        </Text>
                                        <Space>
                                            {viTri.trangThai === 1 && <Tag color="success">Đã duyệt</Tag>}
                                            {viTri.trangThai === 3 && <Tag color="error">Bị từ chối</Tag>}
                                            {viTri.trangThai === 0 && <Tag color="warning">Chờ thẩm định</Tag>}
                                            <Tag color="geekblue">{viTri.tenNganh || 'Chưa phân ngành'}</Tag>
                                        </Space>
                                    </div>

                                    <Row gutter={[16, 8]} style={{ marginBottom: 12, backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: 6 }}>
                                        <Col span={8}><Text type="secondary"><DollarOutlined /> Lương: </Text><Text strong style={{ color: '#16a34a' }}>{viTri.luong || 'Thỏa thuận'}</Text></Col>
                                        <Col span={8}><Text type="secondary"><TeamOutlined /> Tuyển: </Text><Text strong>{viTri.soLuongTuyen} người</Text></Col>
                                        <Col span={8}><Text type="secondary"><CalendarOutlined /> Hạn chót: </Text><Text strong>{viTri.ngayHetHan ? new Date(viTri.ngayHetHan).toLocaleDateString('vi-VN') : 'Theo chiến dịch'}</Text></Col>
                                    </Row>

                                    <Descriptions column={1} size="small" layout="vertical">
                                        <Descriptions.Item label={<Text strong style={{ color: '#475569' }}>Mô tả công việc:</Text>}>
                                            <Paragraph style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13 }}>{viTri.moTaCongViec}</Paragraph>
                                        </Descriptions.Item>
                                        <Descriptions.Item label={<Text strong style={{ color: '#475569' }}>Yêu cầu ứng viên:</Text>}>
                                            <Paragraph style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13 }}>{viTri.yeuCauUngVien}</Paragraph>
                                        </Descriptions.Item>
                                        {viTri.quyenLoi && (
                                            <Descriptions.Item label={<Text strong style={{ color: '#475569' }}>Quyền lợi & Chế độ:</Text>}>
                                                <Paragraph style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13 }}>{viTri.quyenLoi}</Paragraph>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>

                                    {viTri.trangThai === 3 && viTri.lyDoTuChoi && (
                                        <Alert 
                                            type="error" 
                                            message={<Text strong>Lý do từ chối: {viTri.lyDoTuChoi}</Text>}
                                            style={{ marginTop: 10, borderRadius: 6 }}
                                        />
                                    )}

                                    {/* Nút thao tác riêng cho vị trí */}
                                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        {viTri.trangThai !== 3 && (
                                            <Button 
                                                danger 
                                                size="middle"
                                                icon={<CloseOutlined />}
                                                loading={submitting}
                                                onClick={() => {
                                                    setRejectingViTri(viTri);
                                                    setIsRejectModalOpen(true);
                                                }}
                                            >
                                                Từ chối vị trí này
                                            </Button>
                                        )}
                                        {viTri.trangThai !== 1 && (
                                            <Button 
                                                type="primary" 
                                                size="middle"
                                                icon={<CheckOutlined />}
                                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                                loading={submitting}
                                                onClick={() => handleReviewPosition(viTri.maViTri, true)}
                                            >
                                                Duyệt vị trí này
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            )}
                        />
                    </div>
                )}
            </Drawer>

            {/* MODAL TỪ CHỐI VỊ TRÍ */}
            <Modal
                title={`Từ chối vị trí: ${rejectingViTri?.tenViTri}`}
                open={isRejectModalOpen}
                onCancel={() => {
                    setIsRejectModalOpen(false);
                    setRejectReason('');
                    setRejectingViTri(null);
                }}
                onOk={() => {
                    if (!rejectReason.trim()) {
                        message.warning("Vui lòng nhập lý do từ chối vị trí này!");
                        return;
                    }
                    handleReviewPosition(rejectingViTri.maViTri, false, rejectReason.trim());
                }}
                okText="Xác nhận từ chối"
                okButtonProps={{ danger: true, loading: submitting }}
                cancelText="Hủy"
            >
                <div style={{ marginTop: 12 }}>
                    <Text strong style={{ display: 'block', marginBottom: 6 }}>Lý do từ chối vị trí:</Text>
                    <Input.TextArea 
                        rows={4} 
                        placeholder="VD: Mô tả công việc chưa rõ ràng, mức lương vi phạm chính sách..." 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </div>
            </Modal>
        </Card>
    );
};

export default ApproveCampaigns;