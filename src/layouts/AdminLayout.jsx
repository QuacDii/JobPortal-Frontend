import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Space, Tag } from 'antd';
import {
    UserOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined,
    DashboardOutlined, TeamOutlined, BuildOutlined, AppstoreOutlined,
    WalletOutlined, ShoppingCartOutlined, SafetyCertificateOutlined,
    DatabaseOutlined, CheckSquareOutlined, EnvironmentOutlined,
    TagOutlined, ApartmentOutlined, BarChartOutlined, ShoppingOutlined,
    FileTextOutlined, IdcardOutlined, ExclamationCircleOutlined, SyncOutlined,
    ClockCircleOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children, user }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isCompanyApprovedApi, setIsCompanyApprovedApi] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleMenuClick = (e) => {
        navigate(e.key);
    };

    const isAdmin = user?.vaiTro === "0" || user?.vaiTro === 0;

    // Tự động kiểm tra trạng thái duyệt công ty từ Database
    useEffect(() => {
        if (!isAdmin) {
            apiClient.get('/employer/company')
                .then(res => {
                    const data = res?.data || res;
                    if (data && (data.trangThai === 1 || data.trangThai === true)) {
                        setIsCompanyApprovedApi(true);
                    }
                })
                .catch(() => {});
        }
    }, [isAdmin]);

    // Đọc token lấy cờ xác thực Email
    const token = localStorage.getItem('token');
    let tokenData = {};
    try {
        if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            tokenData = JSON.parse(jsonPayload);
        }
    } catch (e) { }

    const isEmailVerified = Boolean(
        user?.isEmailVerified === true ||
        tokenData.isEmailVerified === 'true' ||
        tokenData.isEmailVerified === true ||
        tokenData.daXacThucEmail === true
    );

    const isProfileApproved = isCompanyApprovedApi || Boolean(
        user?.isApproved === true ||
        tokenData.isApproved === true ||
        tokenData.isApproved === 'true' ||
        user?.trangThaiDoanhNghiep === 1 ||
        tokenData.trangThai === 1 ||
        tokenData.companyStatus === 1 ||
        user?.trangThai === 1 ||
        user?.daXacThuc === true
    );

    const canAccessAllFeatures = isEmailVerified && isProfileApproved;

    const renderHeaderStatusTag = () => {
        if (isAdmin) return null;
        if (!isEmailVerified) {
            return <Tag color="error" style={{ borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}><ExclamationCircleOutlined /> Chưa xác thực Email</Tag>;
        }
        if (isProfileApproved) {
            return <Tag color="success" style={{ borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}><SafetyCertificateOutlined /> Đã xác thực &amp; Duyệt</Tag>;
        }
        return <Tag color="warning" style={{ borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}><ClockCircleOutlined /> Chờ duyệt hồ sơ</Tag>;
    };

    const adminMenuItems = [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan Admin' },
        { type: 'divider' },
        {
            key: 'sub-approval', icon: <SafetyCertificateOutlined />, label: 'Kiểm duyệt hệ thống',
            children: [
                { key: '/admin/approve-job-posts', icon: <CheckSquareOutlined />, label: 'Duyệt Tin tuyển dụng' },
                { key: '/admin/approve-companies', icon: <ApartmentOutlined />, label: 'Duyệt Doanh nghiệp' },
            ]
        },
        {
            key: 'sub-categories', icon: <DatabaseOutlined />, label: 'Quản lý Danh mục',
            children: [
                { key: '/admin/categories/industries', icon: <AppstoreOutlined />, label: 'Ngành nghề' },
                { key: '/admin/categories/skills', icon: <TagOutlined />, label: 'Kỹ năng' },
                { key: '/admin/categories/locations', icon: <EnvironmentOutlined />, label: 'Khu vực (Tỉnh/Phường)' },
            ]
        },
        { type: 'divider' },
        { key: '/admin/cv-templates', icon: <FileTextOutlined />, label: 'Quản lý Mẫu CV' },
        { key: '/admin/users', icon: <TeamOutlined />, label: 'Quản lý Người dùng' },
        { key: '/admin/packages', icon: <ShoppingOutlined />, label: 'Quản lý Gói dịch vụ' },
        { key: '/admin/reports', icon: <BarChartOutlined />, label: 'Báo cáo & Thống kê' }
    ];

    const employerMenuItems = [
        { key: '/employer/dashboard', icon: <DashboardOutlined />, label: 'Bảng điều khiển' },
        { type: 'divider' },
        {
            key: 'sub-recruitment', icon: <AppstoreOutlined />, label: 'Quản lý Tuyển dụng', disabled: !canAccessAllFeatures,
            children: [
                { key: '/employer/post-job', label: 'Đăng tin tuyển dụng', disabled: !canAccessAllFeatures },
                { key: '/employer/jobs', label: 'Danh sách tin đã đăng', disabled: !canAccessAllFeatures },
                { key: '/employer/cv-hunter', label: 'Săn ứng viên (CV Hunt)', disabled: !canAccessAllFeatures },
            ]
        },
        {
            key: 'sub-company', icon: <BuildOutlined />, label: 'Hồ sơ Doanh nghiệp', disabled: !canAccessAllFeatures,
            children: [
                { key: '/employer/company-profile', label: 'Thông tin Công ty', disabled: !canAccessAllFeatures }
            ]
        },
        { type: 'divider' },
        {
            key: 'sub-finance', icon: <WalletOutlined />, label: 'Tài chính & Dịch vụ', disabled: !canAccessAllFeatures,
            children: [
                { key: '/employer/service-package', icon: <ShoppingCartOutlined />, label: 'Cửa hàng Dịch vụ', disabled: !canAccessAllFeatures },
                { key: '/employer/wallet', icon: <WalletOutlined />, label: 'Ví điện tử', disabled: !canAccessAllFeatures },
            ]
        }
    ];

    const menuItems = isAdmin ? adminMenuItems : employerMenuItems;
    const defaultOpenKeys = ['sub-approval', 'sub-categories', 'sub-recruitment', 'sub-company', 'sub-finance'].filter(key => {
        if (key === 'sub-approval' && location.pathname.includes('/admin/approve-')) return true;
        if (key === 'sub-categories' && location.pathname.includes('/admin/categories')) return true;
        if (key === 'sub-recruitment' && (location.pathname.includes('/post-job') || location.pathname.includes('/jobs') || location.pathname.includes('/cv-hunter'))) return true;
        if (key === 'sub-company' && location.pathname.includes('/company-profile')) return true;
        if (key === 'sub-finance' && (location.pathname.includes('/wallet') || location.pathname.includes('/service-package'))) return true;
        return false;
    });

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={260} trigger={null} collapsible collapsed={collapsed} theme="dark">
                <div style={{ height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 20, fontWeight: '900', background: '#002140', letterSpacing: '1px' }}>
                    {collapsed ? 'JN' : 'JOBSNOW PANEL'}
                </div>
                <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} defaultOpenKeys={defaultOpenKeys} items={menuItems} onClick={handleMenuClick} />
            </Sider>

            <Layout>
                <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 1 }}>
                    <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '18px', width: 64, height: 64 }} />
                    <Space size="large">
                        {renderHeaderStatusTag()}
                        <span style={{ color: '#595959', fontSize: '15px' }}>Xin chào, <b style={{ color: '#1890ff' }}>{user?.hoTen || (isAdmin ? 'Quản trị viên' : 'Nhà tuyển dụng')}</b></span>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                        <Button type="primary" danger ghost icon={<LogoutOutlined />} onClick={handleLogout} style={{ borderRadius: '6px' }}>Đăng xuất</Button>
                    </Space>
                </Header>

                <Content style={{ margin: '24px 24px', padding: 0, minHeight: 280, position: 'relative' }}>
                    {!isAdmin && !canAccessAllFeatures && (
                        <div style={{
                            background: !isEmailVerified
                                ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
                                : 'linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)',
                            border: !isEmailVerified ? '1px solid #fecdd3' : '1px solid #fde68a',
                            borderRadius: '12px',
                            padding: '20px 24px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    backgroundColor: !isEmailVerified ? '#f43f5e' : '#d97706', color: '#ffffff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                                    boxShadow: !isEmailVerified ? '0 4px 10px rgba(244,63,94,0.3)' : '0 4px 10px rgba(217,119,6,0.3)'
                                }}>
                                    {!isEmailVerified ? <ExclamationCircleOutlined /> : <SyncOutlined spin />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a', marginBottom: '2px' }}>
                                        {!isEmailVerified
                                            ? 'Tài khoản chưa xác thực Email'
                                            : 'Tài khoản Doanh nghiệp chưa được xác thực'
                                        }
                                    </div>
                                    <div style={{ color: '#475569', fontSize: '13.5px', lineHeight: 1.5 }}>
                                        {!isEmailVerified
                                            ? 'Vui lòng hoàn tất xác thực OTP Email để bắt đầu gửi hồ sơ pháp lý lên hệ thống.'
                                            : 'Vui lòng bổ sung hồ sơ/giấy phép xác thực doanh nghiệp. Các chức năng Đăng tin, Săn CV và Dịch vụ sẽ tự động mở sau khi được xác thực.'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* 🌟 CHỈ HIỂN THỊ NÚT KHI CHƯA XÁC THỰC EMAIL. NẾU ĐÃ XÁC THỰC EMAIL NHƯNG ĐANG CHỜ DUYỆT HỒ SƠ THÌ BỎ NÚT MŨI TÊN */}
                            {!isEmailVerified && (
                                <Button
                                    type="primary"
                                    icon={<ArrowRightOutlined />}
                                    style={{
                                        height: '42px', padding: '0 22px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                                        backgroundColor: '#e11d48',
                                        borderColor: '#e11d48',
                                        boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                                    }}
                                    onClick={() => navigate('/verify-email')}
                                >
                                    Xác thực OTP Email ngay
                                </Button>
                            )}
                        </div>
                    )}

                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;