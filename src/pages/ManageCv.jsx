import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './css/ManageCv.css';
import { Row, Col, Card, Typography, Button, Space, Switch, Popconfirm, Spin, Empty, message, Avatar, Tooltip, Modal } from 'antd'; // 👉 ĐÃ THÊM Modal
import {
    EditOutlined,
    DeleteOutlined,
    DownloadOutlined,
    PlusOutlined,
    StarFilled,
    StarOutlined,
    CheckCircleFilled,
    EyeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// 👉 ĐÃ SỬA: Hàm đọc Token lấy cả userId và isVip
const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        return {
            userId: decoded.nameid || decoded.maUser || decoded.id || decoded.sub,
            isVip: decoded.isVip === 'true' || decoded.isVip === true
        };
    } catch (error) {
        return null;
    }
};

const ManageCv = () => {
    const navigate = useNavigate();
    const [cvList, setCvList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isSearchingJob, setIsSearchingJob] = useState(false);
    const [liveAvatar, setLiveAvatar] = useState(null);
    const [userName, setUserName] = useState('Ứng viên');

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId;
    const isVipUser = userInfo?.isVip || false;

    const fetchMyCvs = () => {
        if (!token || !userId) {
            message.error('Vui lòng đăng nhập để xem danh sách CV!');
            navigate('/login');
            return;
        }
        setLoading(true);
        apiClient.get(`/Cv/user/${userId}`)
            .then(res => {
                const actualCvs = Array.isArray(res) ? res : (res?.data || []);
                setCvList(actualCvs);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi lấy danh sách CV:", err);
                setCvList([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchMyCvs();

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const decoded = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
                if (decoded.HoTen || decoded.name || decoded.Actort) {
                    setUserName(decoded.HoTen || decoded.name || decoded.Actort || 'Đặng Quốc Duy');
                }
            } catch (e) { }
        }

        if (userId) {
            apiClient.get(`/Cv/primary-avatar/${userId}`)
                .then(res => {
                    if (res && res.url) {
                        setLiveAvatar(res.url);
                    } else if (res?.data?.url) {
                        setLiveAvatar(res.data.url);
                    }
                })
                .catch(err => console.error("Lỗi đồng bộ ảnh:", err));
        }
    }, []);

    //CHẶN TẠO QUÁ 5 CV NẾU KHÔNG PHẢI VIP
    const handleCreateNew = () => {
        if (!isVipUser && cvList.length >= 5) {
            Modal.confirm({
                title: 'Đã đạt giới hạn tạo hồ sơ',
                content: 'Tài khoản miễn phí chỉ được tạo tối đa 5 CV. Hãy nâng cấp VIP để tạo không giới hạn!',
                okText: 'Nâng cấp VIP ngay',
                cancelText: 'Để sau',
                okButtonProps: { style: { backgroundColor: '#faad14', borderColor: '#faad14', color: '#000' } },
                onOk: () => navigate('/upgrade-vip') 
            });
            return;
        }
        navigate('/tao-cv');
    };

    const handleEdit = (maCV) => navigate(`/builder?cvId=${maCV}`);

    const handlePreview = (cv) => {
        const currentId = cv.maCV || cv.maCv;
        window.open(`/xem-cv/${currentId}`, '_blank');
    };

    const handleDelete = (maCV) => {
        apiClient.delete(`/Cv/${maCV}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(() => {
                message.success('Đã xóa CV thành công!');
                setCvList(cvList.filter(cv => (cv.maCV || cv.maCv) !== maCV));
            })
            .catch(err => {
                console.error("Lỗi xóa CV:", err);
                const backendMessage = err.response?.data?.message || err.response?.data;

                if (typeof backendMessage === 'string' && backendMessage.trim() !== '') {
                    message.error(backendMessage);
                } else if (err.response?.status === 400 || err.response?.status === 409) {
                    message.error('Không thể xóa! CV này đang được sử dụng để nộp đơn ứng tuyển.');
                } else {
                    message.error('Xóa CV thất bại! Vui lòng thử lại sau.');
                }
            });
    };

    const handleSetPrimary = (maCV) => {
        apiClient.put(`/Cv/set-primary/${maCV}?maUser=${userId}`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(() => {
                message.success('Đã thiết lập CV chính thành công!');
                setCvList(cvList.map(cv => ({ ...cv, isPrimary: (cv.maCV || cv.maCv) === maCV })));
            })
            .catch(err => message.error('Thiết lập CV chính thất bại!'));
    };

    const handleTogglePublic = (maCV, checked) => {
        apiClient.put(`/Cv/toggle-public/${maCV}`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(() => {
                message.success(checked ? 'Đã bật cho phép NTD tìm kiếm!' : 'Đã tắt cho phép NTD tìm kiếm!');
                setCvList(cvList.map(cv => (cv.maCV || cv.maCv) === maCV ? { ...cv, isPublic: checked } : cv));
            })
            .catch(err => message.error('Cập nhật trạng thái thất bại!'));
    };

    const handleRename = (maCV, newTitle) => {
        if (!newTitle || newTitle.trim() === "") {
            message.warning('Tiêu đề CV không được để trống!');
            return;
        }

        apiClient.put(`/Cv/rename/${maCV}`, { tieuDe: newTitle }, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(() => {
                message.success('Đổi tên CV thành công!');
                setCvList(cvList.map(cv => (cv.maCV || cv.maCv) === maCV ? { ...cv, tieuDe: newTitle } : cv));
            })
            .catch(err => {
                console.error(err);
                message.error('Đổi tên CV thất bại!');
            });
    };

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '40px 10%' }}>
            <Row gutter={[32, 32]}>
                <Col xs={24} lg={16}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={3} style={{ color: '#fff', margin: 0 }}>CV đã tạo trên JOBSNOW</Title>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew} style={{ backgroundColor: '#1890ff', borderRadius: '4px' }}>
                            Tạo CV mới
                        </Button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
                    ) : cvList.length === 0 ? (
                        <Card style={{ backgroundColor: '#242424', border: '1px solid #333', textAlign: 'center', padding: '40px 0' }}>
                            <Empty description={<span style={{ color: '#a6a6a6' }}>Bạn chưa tạo CV nào.</span>} />
                        </Card>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {cvList.map((cv) => {
                                const currentId = cv.maCV || cv.maCv;
                                return (
                                    <Col xs={24} sm={12} key={currentId}>
                                        <div className="cv-card">

                                            <div className="cv-thumbnail-container">
                                                {cv.duongDan ? (
                                                    <img
                                                        src={cv.duongDan}
                                                        alt="CV Preview"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                                                    />
                                                ) : (
                                                    <div style={{ color: '#555', fontWeight: 500 }}>Chưa có ảnh chụp xem trước</div>
                                                )}

                                                <Tooltip title={cv.isPrimary ? "Đây là CV chính của bạn" : "Đặt làm CV chính"}>
                                                    <div className="primary-star" onClick={() => !cv.isPrimary && handleSetPrimary(currentId)}>
                                                        {cv.isPrimary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined style={{ color: '#a6a6a6' }} />}
                                                    </div>
                                                </Tooltip>

                                                <div className="cv-hover-overlay">
                                                    <Button type="primary" icon={<EyeOutlined />} className="overlay-btn" onClick={() => handlePreview(cv)} style={{ backgroundColor: '#00b14f', borderColor: '#00b14f' }}>
                                                        Xem trước
                                                    </Button>
                                                    <Button type="primary" icon={<DownloadOutlined />} className="overlay-btn" style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}>
                                                        Tải xuống
                                                    </Button>
                                                    <Button icon={<EditOutlined />} className="overlay-btn" onClick={() => handleEdit(currentId)}>
                                                        Chỉnh sửa
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="cv-card-body">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1, paddingRight: '12px' }}>
                                                        <Title
                                                            level={5}
                                                            style={{ color: '#fff', margin: '0 0 4px 0' }}
                                                            ellipsis
                                                            editable={{
                                                                icon: <EditOutlined style={{ color: '#1890ff', fontSize: '14px' }} />,
                                                                tooltip: 'Click để đổi tên CV',
                                                                onChange: (val) => handleRename(currentId, val),
                                                            }}
                                                        >
                                                            {cv.tieuDe}
                                                        </Title>
                                                        <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>
                                                            Cập nhật {cv.ngayCapNhat}
                                                        </Text>
                                                    </div>

                                                    <Popconfirm title="Xóa CV này?" onConfirm={() => handleDelete(currentId)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                                                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                                    </Popconfirm>
                                                </div>

                                                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Switch
                                                        checked={cv.isPublic}
                                                        onChange={(checked) => handleTogglePublic(currentId, checked)}
                                                        size="small"
                                                    />
                                                    <Text style={{ color: cv.isPublic ? '#1890ff' : '#a6a6a6', fontSize: '14px', fontWeight: 500 }}>
                                                        Cho phép NTD tìm kiếm
                                                    </Text>
                                                </div>
                                            </div>

                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </Col>

                <Col xs={24} lg={8}>
                    <Card style={{ backgroundColor: '#242424', borderColor: '#333', marginBottom: '24px', borderRadius: '8px' }} bodyStyle={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Avatar
                                size={64}
                                src={liveAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
                            />
                            <div>
                                <Title level={4} style={{ color: '#fff', margin: '0 0 4px 0' }}>{userName}</Title>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            {!isVipUser && (
                                <Button type="link" onClick={() => navigate('/upgrade-vip')} style={{ color: '#faad14', padding: 0, fontWeight: 'bold' }}>
                                    + Nâng cấp tài khoản VIP
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card style={{ backgroundColor: '#242424', borderColor: '#333', borderRadius: '8px' }} bodyStyle={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Switch
                                checked={isSearchingJob}
                                onChange={(val) => setIsSearchingJob(val)}
                            />
                            <Title level={5} style={{ color: '#fff', margin: 0 }}>
                                {isSearchingJob ? 'Đang Bật tìm việc' : 'Đang Tắt tìm việc'}
                            </Title>
                        </div>

                        <Text style={{ color: '#8c8c8c', fontSize: '14px', display: 'block', marginBottom: '16px' }}>
                            Khi bật tìm việc:
                        </Text>

                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <CheckCircleFilled style={{ color: '#a6a6a6', marginTop: '4px' }} />
                                <Text style={{ color: '#a6a6a6', fontSize: '13px' }}>Nhà tuyển dụng có thể tìm thấy và mang đến cho bạn những cơ hội hấp dẫn.</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <CheckCircleFilled style={{ color: '#a6a6a6', marginTop: '4px' }} />
                                <Text style={{ color: '#a6a6a6', fontSize: '13px' }}>Hồ sơ của bạn sẽ hiển thị nổi bật trên kết quả tìm kiếm của Nhà tuyển dụng.</Text>
                            </div>
                        </Space>

                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #333' }}>
                            <Title level={5} style={{ color: '#fff', marginBottom: '8px' }}>Cho phép NTD tìm kiếm hồ sơ</Title>
                            <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                                Có <strong style={{ color: '#1890ff' }}>{(cvList || []).filter(cv => cv.isPublic).length} CV</strong> đang bật cho phép NTD tìm kiếm
                            </Text>
                            <Button type="default" style={{ marginTop: '16px', background: 'transparent', borderColor: '#1890ff', color: '#1890ff', borderRadius: '20px' }}>
                                Quản lý danh sách
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ManageCv;