import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Row, Col, Card, Form, Input, Button, Avatar, Spin, message,
    Typography, Switch, Badge, Modal, Space, Tag, DatePicker, Upload
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined,
    SaveOutlined, CrownFilled, RadarChartOutlined, RocketOutlined,
    FireFilled, CheckCircleFilled, UploadOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../api/apiClient';
import JobAlertManager from './JobAlertManager';

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

const UserProfile = ({ user }) => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // State cho Sidebar bên phải (Đồng bộ chuẩn 100% với AppliedJobs)
    const [isSearchingJob, setIsSearchingJob] = useState(false);
    const [isSearchingJobLoading, setIsSearchingJobLoading] = useState(false);
    const [isJobAlertModalOpen, setIsJobAlertModalOpen] = useState(false);
    const [cvList, setCvList] = useState([]);
    const [liveAvatar, setLiveAvatar] = useState(null);
    const [profileData, setProfileData] = useState(null);

    const token = localStorage.getItem('token');
    const decoded = parseJwt(token || '');
    const userId = decoded?.nameid || decoded?.maUser || decoded?.id || user?.maUser;
    const isVipUser = decoded?.isVip === 'true' || decoded?.isVip === true;
    const userName = profileData?.hoTen || decoded?.HoTen || user?.hoTen || 'Ứng viên';

    const isEmailVerified = Boolean(
        profileData?.isEmailVerified === true ||
        profileData?.isEmailVerified === 1 ||
        profileData?.daXacThucEmail === true ||
        decoded?.isEmailVerified === 'true' ||
        decoded?.isEmailVerified === true
    );

    const fetchUserProfile = async () => {
        if (!token || !userId) {
            message.error("Vui lòng đăng nhập để xem thông tin cá nhân!");
            setLoading(false);
            return;
        }

        try {
            // 1. Tải Profile chi tiết
            const res = await apiClient.get(`/User/profile/${userId}`);
            const data = res.data || res;
            setProfileData(data);

            // Set Form Data
            form.setFieldsValue({
                hoTen: data.hoTen || '',
                email: data.email || '',
                soDienThoai: data.soDienThoai || '',
                diaChi: data.diaChi || '',
                ngaySinh: data.ngaySinh ? dayjs(data.ngaySinh) : null
            });

            if (data.trangThaiTimViec !== undefined) {
                setIsSearchingJob(data.trangThaiTimViec);
            }

            // 2. Tải danh sách CV
            const cvRes = await apiClient.get(`/Cv/user/${userId}`).catch(() => []);
            const actualCvs = Array.isArray(cvRes) ? cvRes : (cvRes?.data || []);
            setCvList(actualCvs);

            // 3. Tải Avatar
            const avatarRes = await apiClient.get(`/Cv/primary-avatar/${userId}`).catch(() => null);
            setLiveAvatar(avatarRes?.url || avatarRes?.data?.url);

        } catch (error) {
            console.error("Lỗi lấy Profile:", error);
            message.error("Không thể tải thông tin hồ sơ!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    // Xử lý Cập nhật thông tin tài khoản
    const handleSubmitProfile = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                hoTen: values.hoTen,
                soDienThoai: values.soDienThoai,
                diaChi: values.diaChi,
                ngaySinh: values.ngaySinh ? values.ngaySinh.format('YYYY-MM-DD') : null,
                avatar: liveAvatar
            };

            const res = await apiClient.put(`/User/profile/${userId}`, payload);
            if (res?.success || res?.status === 200) {
                message.success(res?.message || "Cập nhật thông tin tài khoản thành công!");
                fetchUserProfile();
            } else {
                message.success("Cập nhật thông tin tài khoản thành công!");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại!";
            message.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // Bật/tắt trạng thái tìm việc
    const handleToggleJobSearch = async (checked) => {
        setIsSearchingJobLoading(true);
        try {
            await apiClient.put(`/User/toggle-job-search/${userId}`, { isSearching: checked }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setIsSearchingJob(checked);
            message.success(checked ? 'Đã bật trạng thái tìm việc!' : 'Đã ẩn hồ sơ khỏi Nhà tuyển dụng!');
        } catch (error) {
            message.error('Cập nhật trạng thái thất bại!');
            setIsSearchingJob(!checked);
        } finally {
            setIsSearchingJobLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0', background: '#f5f7fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#595959', fontSize: '15px' }}>Đang tải thông tin cá nhân...</div>
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '30px 40px' }}>
            <Row gutter={[24, 24]} style={{ maxWidth: '1300px', margin: '0 auto' }}>

                {/* 🌟 NỬA BÊN TRÁI: FORM ĐỔI THÔNG TIN CÁ NHÂN (SPAN 16) */}
                <Col xs={24} lg={16}>
                    <Card
                        style={{ borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}
                        styles={{ body: { padding: '32px' } }}
                    >
                        <div style={{ marginBottom: '28px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                            <Title level={3} style={{ margin: '0 0 6px 0', color: '#0f172a', fontWeight: 700 }}>
                                👤 Thông tin cá nhân
                            </Title>
                            <Text type="secondary" style={{ fontSize: '14.5px' }}>
                                Quản lý thông tin hồ sơ và địa chỉ liên lạc tài khoản của bạn
                            </Text>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmitProfile}
                        >
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label={<span style={{ fontWeight: 600, color: '#334155' }}>Họ và tên</span>}
                                        name="hoTen"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                                    >
                                        <Input
                                            size="large"
                                            prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                                            placeholder="VD: Nguyễn Văn A"
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label={<span style={{ fontWeight: 600, color: '#334155' }}>Địa chỉ Email (Chỉ đọc)</span>}
                                        name="email"
                                    >
                                        <Input
                                            size="large"
                                            disabled
                                            prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                                            suffix={
                                                isEmailVerified ? (
                                                    <Tag color="success" icon={<SafetyCertificateOutlined />} style={{ margin: 0 }}>Đã xác thực</Tag>
                                                ) : (
                                                    <Tag color="warning" style={{ cursor: 'pointer', margin: 0 }} onClick={() => navigate('/verify-email')}>Cần xác thực</Tag>
                                                )
                                            }
                                            style={{ borderRadius: '8px', backgroundColor: '#f1f5f9' }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={submitting}
                                    icon={<SaveOutlined />}
                                    style={{ borderRadius: '8px', fontWeight: 600, padding: '0 32px', height: '46px' }}
                                >
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </Col>

                {/* 🌟 NỬA BÊN PHẢI: GIỮ NGUYÊN BẢN CẤU TRÚC TỪ APPLIEDJOBS (SPAN 8) */}
                <Col xs={24} lg={8}>
                    {/* CARD THÔNG TIN USER & VIP BADGE */}
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
                                <Avatar size={76} src={liveAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} style={{ border: isVipUser ? '3px solid #faad14' : '3px solid #e8e8e8' }} />
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

                    {/* CARD BẬT/TẮT TÌM VIỆC & JOB ALERTS */}
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

            {/* MODAL CÀI ĐẶT JOB ALERT */}
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
        </div>
    );
};

export default UserProfile;