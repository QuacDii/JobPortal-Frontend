import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Button, Switch, Avatar, Spin, message, Typography, Empty, Badge, Modal, Space } from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
    FileTextOutlined,
    CalendarOutlined,
    CheckCircleFilled,
    DollarOutlined,
    UserOutlined,
    CrownFilled,
    RadarChartOutlined,
    RocketOutlined,
    FireFilled
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import JobAlertManager from './JobAlertManager';

const { Title, Text } = Typography;

const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);
        return {
            userId: decoded.nameid || decoded.maUser || decoded.id || decoded.sub,
            isVip: decoded.isVip === 'true' || decoded.isVip === true,
            userName: decoded.HoTen || decoded.name || 'Ứng viên'
        };
    } catch (error) {
        return null;
    }
};

const getRemindedListFromStorage = () => {
    try {
        const stored = localStorage.getItem('reminded_applications');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const AppliedJobs = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    // Các state đồng bộ chức năng Sidebar bên phải
    const [isSearchingJob, setIsSearchingJob] = useState(false);
    const [isSearchingJobLoading, setIsSearchingJobLoading] = useState(false);
    const [isJobAlertModalOpen, setIsJobAlertModalOpen] = useState(false);
    const [cvList, setCvList] = useState([]);
    const [liveAvatar, setLiveAvatar] = useState(null);

    // State quản lý loading cho từng nút Nhắc NTD
    const [remindingId, setRemindingId] = useState(null);

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const [remindedList, setRemindedList] = useState(getRemindedListFromStorage());
    const userId = userInfo?.userId;
    const isVipUser = userInfo?.isVip || false;
    const userName = userInfo?.userName || user?.hoTen || 'Ứng viên';

    const BLUE_PRIMARY = '#1890ff';
    const BLUE_LIGHT_BG = '#e6f7ff';
    const BLUE_BORDER = '#91d5ff';

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !userId) {
                message.error("Vui lòng đăng nhập để xem danh sách!");
                setLoading(false);
                return;
            }

            try {
                const appRes = await apiClient.get('/JobApplication/my-applications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const appData = appRes.data !== undefined ? appRes.data : appRes;
                setApplications(Array.isArray(appData) ? appData : []);

                const profileRes = await apiClient.get(`/User/profile/${userId}`);
                const profileData = profileRes.data || profileRes;
                if (profileData.trangThaiTimViec !== undefined) setIsSearchingJob(profileData.trangThaiTimViec);

                const cvRes = await apiClient.get(`/Cv/user/${userId}`);
                const actualCvs = Array.isArray(cvRes) ? cvRes : (cvRes?.data || []);
                setCvList(actualCvs);

                const avatarRes = await apiClient.get(`/Cv/primary-avatar/${userId}`);
                setLiveAvatar(avatarRes?.url || avatarRes?.data?.url);

            } catch (error) {
                console.error(error);
                message.error("Đã xảy ra lỗi khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, userId]);

    const handleToggleJobSearch = async (checked) => {
        setIsSearchingJobLoading(true);
        try {
            await apiClient.put(`/User/toggle-job-search/${userId}`, { isSearching: checked }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setIsSearchingJob(checked);
            message.success(checked ? 'Đã bật trạng thái tìm việc! Hồ sơ của bạn đã sẵn sàng.' : 'Đã ẩn hồ sơ khỏi Nhà tuyển dụng!');
        } catch (error) {
            console.error(error);
            message.error('Cập nhật trạng thái thất bại. Vui lòng thử lại!');
            setIsSearchingJob(!checked);
        } finally {
            setIsSearchingJobLoading(false);
        }
    };

    // Xử lý chức năng Nhắc Nhở Nhà Tuyển Dụng
    const handleRemindEmployer = async (app) => {
        // Kiểm tra xem mã đơn này đã từng nhắc chưa
        if (remindedList.includes(app.maDon)) {
            message.info("Bạn đã gửi nhắc nhở cho đơn này rồi!");
            return;
        }

        if (!app.ngayNop) return;

        try {
            setRemindingId(app.maDon);
            await apiClient.post(`/JobApplication/remind-employer/${app.maDon}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Đã gửi thông báo nhắc nhở lịch sự đến Nhà tuyển dụng thành công!');

            // 🌟 Lưu mã đơn vào localStorage để không cho bấm lần thứ 2
            const updated = [...remindedList, app.maDon];
            setRemindedList(updated);
            localStorage.setItem('reminded_applications', JSON.stringify(updated));

        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi gửi nhắc nhở!');
        } finally {
            setRemindingId(null);
        }
    };

    const filterTabs = [
        { key: 'all', label: 'Tất cả' },
        { key: '0', label: 'Tiếp nhận' },
        { key: '1', label: 'Đã xem' },
        { key: '2', label: 'Phù hợp' },
        { key: '3', label: 'Chưa phù hợp' },
    ];

    const filteredApplications = applications.filter(app => {
        if (activeTab === 'all') return true;
        return app?.trangThai?.toString() === activeTab;
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0', background: '#f5f7fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#595959', fontSize: '15px' }}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '30px 40px' }}>
            <Row gutter={[24, 24]} style={{ maxWidth: '1300px', margin: '0 auto' }}>

                <Col xs={24} lg={16}>
                    <Title level={3} style={{ marginBottom: '20px', color: '#0f1e36', fontWeight: 700 }}>
                        Việc làm đã ứng tuyển
                    </Title>

                    <div style={{
                        backgroundColor: BLUE_LIGHT_BG,
                        border: `1px solid ${BLUE_BORDER}`,
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <BellOutlined style={{ fontSize: '24px', color: BLUE_PRIMARY }} />
                        <div>
                            <Text strong style={{ color: '#003a8c' }}> Bạn có thể nhấn nút "Nhắc NTD" nếu đã quá 7 ngày từ lúc ứng tuyển mà vẫn chưa được phản hồi. </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '13px' }}>Hệ thống sẽ thay bạn gửi một lời nhắc lịch sự, chuyên nghiệp tới nhà tuyển dụng.</Text>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {filterTabs.map(tab => (
                            <div
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    transition: 'all 0.3s',
                                    backgroundColor: activeTab === tab.key ? BLUE_PRIMARY : '#fff',
                                    color: activeTab === tab.key ? '#fff' : '#595959',
                                    border: activeTab === tab.key ? `1px solid ${BLUE_PRIMARY}` : '1px solid #d9d9d9',
                                }}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>

                    {filteredApplications.length === 0 ? (
                        <Card style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}><Empty description="Không tìm thấy việc làm nào trong danh mục này." /></Card>
                    ) : (
                        filteredApplications.map(app => (
                            <Card
                                key={app.maDon}
                                style={{ marginBottom: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                styles={{ body: { padding: '20px' } }}
                            >
                                <Row justify="space-between" align="top">
                                    <Col style={{ display: 'flex', gap: '16px' }}>
                                        <Avatar
                                            shape="square"
                                            size={64}
                                            src={app.logo || null}
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#f0f2f5', border: '1px solid #f0f0f0', color: '#bfbfbf', borderRadius: '8px' }}
                                        />
                                        <div>
                                            <div
                                                style={{ display: 'inline-block' }}
                                                onClick={() => navigate(`/job/${app.maTin || app.maTinTuyenDung || app.maViTri}`)}
                                                onMouseEnter={(e) => e.currentTarget.style.color = BLUE_PRIMARY}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#262626'}
                                            >
                                                <Title level={5} style={{ margin: 0, color: 'inherit', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}>
                                                    {app.tenViTri}
                                                </Title>
                                            </div>

                                            <Text strong style={{ color: '#595959', display: 'block', margin: '4px 0' }}>{app.tenCongTy}</Text>

                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#8c8c8c', fontSize: '13px', marginTop: '6px' }}>
                                                <span><CalendarOutlined /> Ứng tuyển: {app.ngayNop ? new Date(app.ngayNop).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</span>
                                                <span>
                                                    <FileTextOutlined /> CV: <strong style={{ color: '#595959', marginLeft: '4px' }}>{app.tieuDeCV || app.tieuDeCv || 'Hồ sơ của tôi'}</strong>
                                                </span>

                                                <span><DollarOutlined /> Lương: {app.luong || 'Thỏa thuận'}</span>
                                            </div>

                                            <div style={{ marginTop: '10px' }}>
                                                <Tag color="blue" style={{ borderRadius: '4px', fontWeight: 500 }}>
                                                    Độ phù hợp Cao
                                                </Tag>
                                            </div>
                                        </div>
                                    </Col>

                                    <Col style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                        {app.trangThai === 0 && <Tag color="gold">Hồ sơ đã tiếp nhận</Tag>}
                                        {app.trangThai === 1 && <Tag color="blue">Nhà tuyển dụng đã xem</Tag>}
                                        {app.trangThai === 2 && <Tag color="green">Đạt yêu cầu</Tag>}
                                        {app.trangThai === 3 && <Tag color="red">Chưa phù hợp</Tag>}
                                        
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                            {(() => {
                                                const isReminded = remindedList.includes(app.maDon);
                                                return (
                                                    <Button
                                                        size="small"
                                                        icon={<BellOutlined />}
                                                        loading={remindingId === app.maDon}
                                                        disabled={isReminded}
                                                        onClick={() => handleRemindEmployer(app)}
                                                        style={isReminded ? {
                                                            backgroundColor: '#f5f5f5',
                                                            borderColor: '#d9d9d9',
                                                            color: '#bfbfbf',
                                                            cursor: 'not-allowed'
                                                        } : {
                                                            borderColor: BLUE_PRIMARY,
                                                            color: BLUE_PRIMARY
                                                        }}
                                                    >
                                                        {isReminded ? 'Đã nhắc NTD' : 'Nhắc NTD'}
                                                    </Button>
                                                );
                                            })()}
                                        </div>
                                    </Col>
                                </Row>

                                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #f0f0f0', fontSize: '13px', color: '#8c8c8c' }}>
                                    {app.trangThai === 3 ? (
                                        <span style={{ color: '#ff4d4f' }}>● Nhà tuyển dụng đánh giá hồ sơ của bạn chưa phù hợp vào lúc {app.ngayNop ? new Date(app.ngayNop).toLocaleDateString('vi-VN') : 'gần đây'}. Đừng nản lòng, nhiều cơ hội khác đang chờ bạn!</span>
                                    ) : (
                                        <span>● Hệ thống đã cập nhật trạng thái kết nối tự động tới nhà tuyển dụng thành công.</span>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        style={{
                            backgroundColor: '#ffffff',
                            borderColor: isVipUser ? '#faad14' : '#e8e8e8',
                            marginBottom: '24px',
                            borderRadius: '16px',
                            boxShadow: isVipUser ? '0 8px 24px rgba(250, 173, 20, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                        styles={{ body: { padding: '24px' } }}
                    >
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <Badge dot={isVipUser} offset={[-8, 60]} color="#faad14" style={{ width: 18, height: 18, boxShadow: '0 0 0 3px #ffffff' }}>
                                <Avatar size={76} src={liveAvatar || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} style={{ border: isVipUser ? '3px solid #faad14' : '3px solid #e8e8e8' }} />
                            </Badge>
                            <div>
                                <Title level={4} style={{ color: '#262626', margin: '0 0 6px 0', fontSize: '18px' }}>{userName}</Title>
                                {isVipUser ? (
                                    <Tag color="gold" style={{ margin: 0, borderRadius: '4px', border: 'none', background: 'linear-gradient(90deg, #faad14, #ffc53d)', color: '#000', fontWeight: 'bold' }}>
                                        <CrownFilled /> PRO / VIP
                                    </Tag>
                                ) : (
                                    <Tag color="default" style={{ margin: 0, borderRadius: '4px', background: '#f5f5f5', color: '#595959', border: '1px solid #d9d9d9' }}>
                                        Tài khoản Tiêu chuẩn
                                    </Tag>
                                )}
                            </div>
                        </div>

                        {!isVipUser && (
                            <div style={{ marginTop: '24px' }}>
                                <Button block type="primary" onClick={() => navigate('/upgrade-vip')} style={{ background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', height: '44px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(250, 173, 20, 0.2)' }}>
                                    <RocketOutlined /> Nâng cấp VIP - Mở khóa đặc quyền
                                </Button>
                            </div>
                        )}
                    </Card>

                    <Card style={{ backgroundColor: '#ffffff', borderColor: '#e8e8e8', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} styles={{ body: { padding: '28px 24px' } }}>
                        <div style={{
                            padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px',
                            background: isSearchingJob ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)' : '#f5f5f5',
                            border: `1px solid ${isSearchingJob ? '#91d5ff' : '#d9d9d9'}`
                        }}>
                            <Switch
                                checked={isSearchingJob}
                                loading={isSearchingJobLoading}
                                onChange={handleToggleJobSearch}
                                style={{ background: isSearchingJob ? '#1890ff' : '#bfbfbf' }}
                            />
                            <div>
                                <Title level={5} style={{ color: isSearchingJob ? '#1890ff' : '#262626', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                                    {isSearchingJob ? <><RadarChartOutlined spin style={{ fontSize: '18px' }} /> Đang bật tìm việc</> : 'Đang tắt tìm việc'}
                                </Title>
                                <Text style={{ color: '#595959', fontSize: '13px' }}>
                                    {isSearchingJob ? 'Hồ sơ đang được ưu tiên hiển thị' : 'Nhà tuyển dụng không thể thấy bạn'}
                                </Text>
                            </div>
                        </div>

                        <Text style={{ color: '#262626', fontSize: '14px', display: 'block', marginBottom: '16px', fontWeight: 600 }}>
                            Lợi ích khi bật trạng thái tìm việc:
                        </Text>

                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ background: '#e6f7ff', borderRadius: '50%', padding: '4px' }}>
                                    <CheckCircleFilled style={{ color: '#1890ff', fontSize: '14px', display: 'block' }} />
                                </div>
                                <Text style={{ color: '#595959', fontSize: '13.5px', lineHeight: '1.6' }}>Được các Headhunter hàng đầu săn đón và mời ứng tuyển.</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ background: '#e6f7ff', borderRadius: '50%', padding: '4px' }}>
                                    <CheckCircleFilled style={{ color: '#1890ff', fontSize: '14px', display: 'block' }} />
                                </div>
                                <Text style={{ color: '#595959', fontSize: '13.5px', lineHeight: '1.6' }}>Hồ sơ nổi bật hơn trên hệ thống tìm kiếm ứng viên.</Text>
                            </div>
                        </Space>

                        {isSearchingJob && (
                            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px dashed #e8e8e8', animation: 'fadeIn 0.4s ease-in-out' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <FireFilled style={{ color: '#ff4d4f', fontSize: '16px' }} />
                                    <Title level={5} style={{ color: '#262626', margin: 0, fontSize: '15px' }}>Job Alerts (Báo việc làm mới)</Title>
                                </div>
                                <Text style={{ color: '#595959', fontSize: '13.5px', display: 'block', marginBottom: '16px' }}>
                                    Hệ thống sẽ gửi email việc làm phù hợp nhất cho bạn hàng ngày.
                                </Text>
                                <Button
                                    type="dashed"
                                    block
                                    style={{ borderColor: '#1890ff', color: '#1890ff', borderRadius: '8px', fontWeight: 500, height: '40px', background: '#e6f7ff' }}
                                    onClick={() => setIsJobAlertModalOpen(true)}
                                >
                                    + Cài đặt ngành nghề quan tâm
                                </Button>
                            </div>
                        )}

                        <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #e8e8e8' }}>
                            <Title level={5} style={{ color: '#262626', marginBottom: '8px', fontSize: '15px' }}>Mở khóa CV công khai</Title>
                            <Text style={{ color: '#595959', fontSize: '13.5px' }}>
                                Bạn đang có <strong style={{ color: '#1890ff', fontSize: '16px', margin: '0 4px' }}>{(cvList || []).filter(cv => cv.isPublic).length} CV</strong> cho phép Nhà tuyển dụng xem chi tiết.
                            </Text>
                        </div>
                    </Card>
                </Col>

            </Row>

            <Modal
                title={null}
                open={isJobAlertModalOpen}
                onCancel={() => setIsJobAlertModalOpen(false)}
                footer={null}
                width={700}
                styles={{ body: { padding: 0, backgroundColor: 'transparent' } }}
                modalRender={(node) => (
                    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>{node}</div>
                )}
            >
                <JobAlertManager />
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default AppliedJobs;