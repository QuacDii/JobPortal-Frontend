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

// 🌟 Giải mã an toàn JWT Token kể cả khi có ký tự tiếng Việt
const parseJwt = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        return {
            userId: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 
                    decoded.nameid || 
                    decoded.maUser || 
                    decoded.id || 
                    decoded.sub
        };
    } catch (e) {
        return null;
    }
};

const SavedJobs = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [savedJobs, setSavedJobs] = useState([]);
    const [bookmarkedIdsList, setBookmarkedIdsList] = useState([]);

    const token = localStorage.getItem('token');
    const userInfo = parseJwt(token || '');
    const userId = userInfo?.userId;

    const fetchSavedJobs = async () => {
        if (!token || !userId) {
            message.warning("Vui lòng đăng nhập để xem danh sách việc làm yêu thích!");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // 1. Lấy danh sách ID đã lưu từ API
            const res = await apiClient.get('/Jobs/bookmarked', {
                headers: { 
                    Authorization: `Bearer ${token}`, 
                    maUser: parseInt(userId, 10) 
                }
            });

            const resData = res?.data !== undefined ? res.data : res;
            
            // Chuẩn hóa lấy danh sách ID vị trí và ID tin
            const rawViTriIds = resData?.viTriIds || resData?.data || (Array.isArray(resData) ? resData : []);
            const rawTinIds = resData?.maTinIds || [];

            const numViTriIds = rawViTriIds.map(Number).filter(Boolean);
            const numTinIds = rawTinIds.map(Number).filter(Boolean);

            setBookmarkedIdsList(numViTriIds);

            if (numViTriIds.length > 0 || numTinIds.length > 0) {
                // 2. Lấy danh sách việc làm để lọc
                const jobsRes = await apiClient.get('/Jobs/search');
                const jobsData = jobsRes?.data !== undefined ? jobsRes.data : jobsRes;
                const allJobs = Array.isArray(jobsData?.data) 
                    ? jobsData.data 
                    : Array.isArray(jobsData) 
                        ? jobsData 
                        : [];

                // 🌟 Lọc chuẩn xác với Number()
                const filtered = allJobs.filter(job => {
                    const maTinNum = Number(job.maTin || job.id);
                    const isMatchMaTin = numTinIds.includes(maTinNum);

                    const vitris = job.viTris || [];
                    const isMatchViTri = vitris.some(v => numViTriIds.includes(Number(v.id || v.maViTri)));

                    return isMatchMaTin || isMatchViTri;
                });

                setSavedJobs(filtered);
            } else {
                setSavedJobs([]);
            }
        } catch (error) {
            console.error("Chi tiết lỗi tải tin đã lưu:", error);
            message.error("Lỗi khi tải danh sách việc làm yêu thích!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedJobs();
    }, [token, userId]);

    // 🌟 Hàm xóa bookmark chuẩn xác
    const handleRemoveBookmark = async (targetId) => {
        try {
            await apiClient.post(`/Jobs/${targetId}/bookmark`, null, {
                headers: { 
                    Authorization: `Bearer ${token}`, 
                    maUser: parseInt(userId, 10) 
                }
            });
            message.success("Đã xóa khỏi danh sách yêu thích!");
            fetchSavedJobs();
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
                        Đã lưu: <b>{savedJobs.length}</b> chiến dịch
                    </Tag>
                </div>

                {savedJobs.length === 0 ? (
                    <Card style={{ borderRadius: '12px', textAlign: 'center', padding: '40px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Empty 
                            description={<span style={{ color: '#595959', fontSize: '15px' }}>Bạn chưa lưu việc làm nào vào danh sách yêu thích.</span>} 
                        >
                            <Button type="primary" style={{ borderRadius: '6px', marginTop: '10px' }} onClick={() => navigate('/jobs')}>
                                Khám phá việc làm ngay
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    savedJobs.map(job => {
                        const vitris = job.viTris || [];
                        const vitriDau = vitris[0] || {};
                        
                        // 🌟 TÌM CHÍNH XÁC ID VỊ TRÍ ĐÃ LƯU ĐỂ TRUYỀN VÀO HÀM XÓA (Tránh bug xóa nhầm vị trí)
                        const matchedSavedViTri = vitris.find(v => bookmarkedIdsList.includes(Number(v.id || v.maViTri)));
                        const targetDeleteId = matchedSavedViTri 
                            ? (matchedSavedViTri.id || matchedSavedViTri.maViTri) 
                            : (vitriDau.id || vitriDau.maViTri || job.maTin);

                        return (
                            <Card
                                key={job.maTin}
                                style={{ marginBottom: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}
                                styles={{ body: { padding: '20px' } }}
                            >
                                <Row justify="space-between" align="top" gutter={20} wrap={false}>
                                    
                                    {/* CỘT TRÁI */}
                                    <Col flex="1" style={{ minWidth: 0, display: 'flex', gap: '16px' }}>
                                        <Avatar 
                                            shape="square" 
                                            size={68} 
                                            src={job.logo || null} 
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div 
                                                onClick={() => navigate(`/job/${job.maTin}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <Title 
                                                    level={4} 
                                                    title={job.tieuDeChienDich}
                                                    style={{ 
                                                        margin: '0 0 4px 0', 
                                                        color: '#1e293b', 
                                                        fontWeight: 700, 
                                                        fontSize: '17px',
                                                        lineHeight: 1.4,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {job.tieuDeChienDich}
                                                </Title>
                                            </div>
                                            <Text 
                                                strong 
                                                title={job.companyName}
                                                style={{ 
                                                    color: '#475569', 
                                                    fontSize: '14px', 
                                                    display: 'block',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {job.companyName}
                                            </Text>

                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#64748b', fontSize: '13px', marginTop: '8px' }}>
                                                <span><DollarOutlined style={{ color: '#52c41a' }} /> <strong style={{ color: '#10b981' }}>{vitriDau.salaryRange || vitriDau.luong || 'Thỏa thuận'}</strong></span>
                                                <span><EnvironmentOutlined style={{ color: '#1677ff' }} /> {vitriDau.locationName || 'Toàn quốc'}</span>
                                                {job.deadline && <span><CalendarOutlined /> Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}</span>}
                                            </div>

                                            {/* Tag vị trí tuyển dụng */}
                                            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {vitris.map((v, i) => {
                                                    const tagTitle = v.title || v.tenViTri;
                                                    return (
                                                        <Tag 
                                                            key={i} 
                                                            color="blue" 
                                                            title={tagTitle}
                                                            style={{ 
                                                                borderRadius: '4px',
                                                                maxWidth: '100%',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {tagTitle}
                                                        </Tag>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Col>

                                    {/* CỘT PHẢI */}
                                    <Col flex="0 0 auto" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
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
                                            onConfirm={() => handleRemoveBookmark(targetDeleteId)}
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