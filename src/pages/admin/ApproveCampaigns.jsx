import React, { useEffect, useState } from 'react';
import { 
    Table, Button, Space, message, Card, Popconfirm, Tag, Row, Col,
    Drawer, Descriptions, Typography, Avatar, Badge, List, Tooltip 
} from 'antd';
import { 
    CheckOutlined, CloseOutlined, NotificationOutlined, 
    CalendarOutlined, EyeOutlined, BuildOutlined, DollarOutlined, 
    TeamOutlined, SolutionOutlined, RocketOutlined 
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text, Paragraph } = Typography;

const ApproveCampaigns = () => {
    const [jobPosts, setJobPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State quản lý Drawer xem chi tiết Tin & Vị trí tuyển dụng
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // 1. Tải danh sách chiến dịch / tin tuyển dụng chờ duyệt từ Server
    const fetchPendingJobPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await apiClient.get('/AdminApproval/pending-job-posts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payload = response?.data || response;
            setJobPosts(Array.isArray(payload) ? payload : []);
        } catch (error) {
            console.error("Lỗi tải danh sách tin tuyển dụng:", error);
            message.error("Lỗi khi tải danh sách tin tuyển dụng chờ duyệt!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingJobPosts();
    }, []);

    // 2. Thẩm định Phê duyệt / Từ chối Chiến dịch
    const handleReview = async (id, isApproved) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            await apiClient.put(`/AdminApproval/review-job-post/${id}`, 
                { isApproved }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            message.success(isApproved ? "Đã phê duyệt tin tuyển dụng thành công!" : "Đã từ chối tin tuyển dụng!");
            setDrawerOpen(false);
            fetchPendingJobPosts(); // Tải lại danh sách sau khi xử lý
        } catch (error) {
            console.error("Lỗi kiểm duyệt tin:", error);
            message.error("Có lỗi xảy ra trong quá trình xử lý!");
        } finally {
            setSubmitting(false);
        }
    };

    // 3. Mở Drawer xem chi tiết chiến dịch và các vị trí
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
            title: 'Doanh Nghiệp Tuyển Dụng',
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
            title: 'Số vị trí tuyển',
            dataIndex: 'danhSachViTri',
            key: 'soLuongViTri',
            align: 'center',
            render: (viTriList) => (
                <Tooltip title={`${viTriList?.length || 0} vị trí cần tuyển trong chiến dịch này`}>
                    <Badge count={viTriList?.length || 0} showZero color="#10b981" />
                </Tooltip>
            )
        },
        {
            title: 'Hạn chót ứng tuyển',
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
            title: 'Thao tác thẩm định',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="default" 
                        icon={<EyeOutlined />} 
                        onClick={() => handleOpenDetail(record)}
                        style={{ borderColor: '#cbd5e1' }}
                    >
                        Xem & Thẩm định
                    </Button>
                    <Popconfirm
                        title="Xác nhận phê duyệt"
                        description="Duyệt chiến dịch này công khai lên cổng việc làm?"
                        onConfirm={() => handleReview(record.maTin, true)}
                        okText="Duyệt ngay"
                        cancelText="Hủy"
                    >
                        <Button type="primary" icon={<CheckOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                            Duyệt nhanh
                        </Button>
                    </Popconfirm>
                </Space>
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

            {/* DRAWER CHI TIẾT CHIẾN DỊCH VÀ CÁC VỊ TRÍ */}
            <Drawer
                title={
                    <Space>
                        <SolutionOutlined style={{ color: '#1677ff' }} />
                        <span>Chi tiết Chiến dịch tuyển dụng #{selectedJob?.maTin}</span>
                    </Space>
                }
                width={720}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                extra={
                    <Space>
                        <Popconfirm
                            title="Xác nhận từ chối"
                            description="Bạn chắc chắn muốn từ chối chiến dịch tuyển dụng này?"
                            onConfirm={() => handleReview(selectedJob?.maTin, false)}
                            okText="Từ chối"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger icon={<CloseOutlined />} loading={submitting}>
                                Từ chối tin
                            </Button>
                        </Popconfirm>
                        <Button 
                            type="primary" 
                            icon={<CheckOutlined />} 
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            loading={submitting}
                            onClick={() => handleReview(selectedJob?.maTin, true)}
                        >
                            Phê duyệt chiến dịch
                        </Button>
                    </Space>
                }
            >
                {selectedJob && (
                    <div>
                        {/* THÔNG TIN TỔNG QUAN DOANH NGHIỆP */}
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
                            📋 Các vị trí công việc chi tiết ({selectedJob.danhSachViTri?.length || 0}):
                        </Title>

                        {/* DANH SÁCH BÓC TÁCH TỪNG VỊ TRÍ CÔNG VIỆC */}
                        <List
                            itemLayout="vertical"
                            dataSource={selectedJob.danhSachViTri || []}
                            renderItem={(viTri, index) => (
                                <Card 
                                    key={viTri.maViTri || index} 
                                    style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}
                                    bodyStyle={{ padding: 16 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 16, color: '#1e293b' }}>
                                            {index + 1}. {viTri.tenViTri}
                                        </Text>
                                        <Tag color="geekblue">{viTri.tenNganh || 'Chưa phân ngành'}</Tag>
                                    </div>

                                    <Row gutter={[16, 8]} style={{ marginBottom: 12, backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: 6 }}>
                                        <Col span={12}>
                                            <Text type="secondary"><DollarOutlined /> Mức lương: </Text>
                                            <Text strong style={{ color: '#16a34a' }}>{viTri.luong || 'Thỏa thuận'}</Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text type="secondary"><TeamOutlined /> Số lượng tuyển: </Text>
                                            <Text strong>{viTri.soLuongTuyen} người</Text>
                                        </Col>
                                    </Row>

                                    <Descriptions column={1} size="small" layout="vertical">
                                        <Descriptions.Item label={<Text strong style={{ color: '#475569' }}>Mô tả công việc:</Text>}>
                                            <Paragraph style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13, color: '#334155' }}>
                                                {viTri.moTaCongViec || 'Chưa cập nhật'}
                                            </Paragraph>
                                        </Descriptions.Item>
                                        
                                        <Descriptions.Item label={<Text strong style={{ color: '#475569' }}>Yêu cầu ứng viên:</Text>}>
                                            <Paragraph style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13, color: '#334155' }}>
                                                {viTri.yeuCauUngVien || 'Chưa cập nhật'}
                                            </Paragraph>
                                        </Descriptions.Item>

                                        {viTri.quyenLoi && (
                                            <Descriptions.Item label={<Text strong style={{ color: '#475569' }}>Quyền lợi & Chế độ:</Text>}>
                                                <Paragraph style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13, color: '#334155' }}>
                                                    {viTri.quyenLoi}
                                                </Paragraph>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </Card>
                            )}
                        />
                    </div>
                )}
            </Drawer>
        </Card>
    );
};

export default ApproveCampaigns;