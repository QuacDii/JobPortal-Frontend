import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Button, Avatar, Spin, message, Typography, Empty, Popconfirm } from 'antd';
import { 
    HeartFilled, 
    DeleteOutlined, 
    EnvironmentOutlined, 
    DollarOutlined, 
    UserOutlined,
    SendOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import apiClient from '../api/apiClient';

const { Title, Text } = Typography;

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const SavedJobs = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [savedJobs, setSavedJobs] = useState([]);

    const token = localStorage.getItem('token');
    const decoded = parseJwt(token || '');
    const userId = decoded?.maUser || decoded?.nameid || decoded?.id;

    const BLUE_PRIMARY = '#1890ff';

    const fetchSavedJobs = async () => {
        if (!token || !userId) {
            message.warning("Vui lòng đăng nhập để xem danh sách việc làm yêu thích!");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // 1. Lấy danh sách ID vị trí đã lưu
            const res = await apiClient.get('/Jobs/bookmarked', {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId) }
            });
            const bookmarkedIds = res?.data?.data || res?.data || [];

            if (Array.isArray(bookmarkedIds) && bookmarkedIds.length > 0) {
                // 2. Lấy toàn bộ danh sách việc làm
                const jobsRes = await apiClient.get('/Jobs/search');
                const allJobs = jobsRes?.data?.data || jobsRes?.data || [];

                // 3. Lọc ra các công việc có vị trí nằm trong bookmarkedIds
                const filtered = allJobs.filter(job => {
                    const vitris = job.viTris || [];
                    return vitris.some(v => bookmarkedIds.includes(v.id || v.maViTri));
                });

                setSavedJobs(filtered);
            } else {
                setSavedJobs([]);
            }
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi tải danh sách việc làm yêu thích!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedJobs();
    }, [token, userId]);

    // Bỏ lưu việc làm
    const handleRemoveBookmark = async (maViTri) => {
        try {
            await apiClient.post(`/Jobs/${maViTri}/bookmark`, null, {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId) }
            });
            message.success("Đã xóa khỏi danh sách yêu thích!");
            fetchSavedJobs(); // Tải lại danh sách
        } catch (error) {
            message.error("Không thể xóa việc làm!");
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0', background: '#f5f7fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#595959', fontSize: '15px' }}>Đang tải việc làm yêu thích...</div>
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '30px 40px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <Title level={3} style={{ margin: 0, color: '#0f1e36', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <HeartFilled style={{ color: '#ff4d4f' }} /> Việc làm đã lưu / yêu thích
                        </Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                            Xem lại các vị trí công việc bạn đã quan tâm và sẵn sàng ứng tuyển
                        </Text>
                    </div>
                    <Tag color="red" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '16px' }}>
                        Đã lưu: <b>{savedJobs.length}</b> vị trí
                    </Tag>
                </div>

                {savedJobs.length === 0 ? (
                    <Card style={{ borderRadius: '12px', textAlign: 'center', padding: '40px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Empty 
                            description={<span style={{ color: '#595959', fontSize: '15px' }}>Bạn chưa lưu việc làm nào vào danh sách yêu thích.</span>} 
                        >
                            <Button type="primary" style={{ borderRadius: '6px', marginTop: '10px' }} onClick={() => navigate('/tim-kiem-nganh-nghe')}>
                                Khám phá việc làm ngay
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    savedJobs.map(job => {
                        const vitris = job.viTris || [];
                        const vitriDau = vitris[0] || {};
                        const maViTriId = vitriDau.id || vitriDau.maViTri;

                        return (
                            <Card
                                key={job.maTin}
                                style={{ marginBottom: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}
                                styles={{ body: { padding: '20px' } }}
                            >
                                <Row justify="space-between" align="top" gutter={16}>
                                    <Col flex="auto" style={{ display: 'flex', gap: '16px' }}>
                                        <Avatar 
                                            shape="square" 
                                            size={68} 
                                            src={job.logo || null} 
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div 
                                                onClick={() => navigate(`/job/${job.maTin}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <Title level={4} style={{ margin: '0 0 4px 0', color: '#1e293b', fontWeight: 700, fontSize: '17px' }}>
                                                    {job.tieuDeChienDich}
                                                </Title>
                                            </div>
                                            <Text strong style={{ color: '#475569', fontSize: '14px', display: 'block' }}>{job.companyName}</Text>

                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#64748b', fontSize: '13px', marginTop: '8px' }}>
                                                <span><DollarOutlined style={{ color: '#52c41a' }} /> <strong style={{ color: '#10b981' }}>{vitriDau.salaryRange || vitriDau.luong || 'Thỏa thuận'}</strong></span>
                                                <span><EnvironmentOutlined style={{ color: '#1677ff' }} /> {vitriDau.locationName || 'Toàn quốc'}</span>
                                                {job.deadline && <span><CalendarOutlined /> Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}</span>}
                                            </div>

                                            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {vitris.map((v, i) => (
                                                    <Tag key={i} color="blue" style={{ borderRadius: '4px' }}>
                                                        {v.title || v.tenViTri}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                                        <Button 
                                            type="primary" 
                                            icon={<SendOutlined />}
                                            style={{ borderRadius: '6px', fontWeight: 600 }}
                                            onClick={() => navigate(`/job/${job.maTin}`)}
                                        >
                                            Ứng tuyển ngay
                                        </Button>

                                        <Popconfirm
                                            title="Bỏ lưu việc làm này?"
                                            description="Bạn có chắc muốn xóa việc làm này khỏi danh sách yêu thích?"
                                            onConfirm={() => handleRemoveBookmark(maViTriId)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button 
                                                type="text" 
                                                danger 
                                                icon={<DeleteOutlined />}
                                                style={{ fontSize: '13px' }}
                                            >
                                                Bỏ lưu
                                            </Button>
                                        </Popconfirm>
                                    </Col>
                                </Row>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SavedJobs;