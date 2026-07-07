import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space } from 'antd';
import { 
    UserOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined, 
    DashboardOutlined, TeamOutlined, BuildOutlined, AppstoreOutlined,
    WalletOutlined, ShoppingCartOutlined, SafetyCertificateOutlined, 
    DatabaseOutlined, CheckSquareOutlined, EnvironmentOutlined, 
    TagOutlined, ApartmentOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children, user }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleMenuClick = (e) => {
        navigate(e.key); 
    };

    // 👉 PHÂN CHIA LẠI CẤU TRÚC MENU THEO YÊU CẦU HÌNH ẢNH
    const menuItems = user?.vaiTro === "0" ? [
        { 
            key: '/admin/dashboard', 
            icon: <DashboardOutlined />, 
            label: 'Tổng quan Admin' 
        },
        { type: 'divider' },
        {
            key: 'sub-approval',
            icon: <SafetyCertificateOutlined />,
            label: 'Kiểm duyệt hệ thống',
            children: [
                { key: '/admin/approve-companies', icon: <ApartmentOutlined />, label: 'Duyệt Doanh nghiệp' },
                { key: '/admin/approve-campaigns', icon: <CheckSquareOutlined />, label: 'Duyệt Chiến dịch' },
            ]
        },
        {
            key: 'sub-categories',
            icon: <DatabaseOutlined />,
            label: 'Quản lý Danh mục',
            children: [
                { key: '/admin/categories/industries', icon: <AppstoreOutlined />, label: 'Ngành nghề' },
                { key: '/admin/categories/skills', icon: <TagOutlined />, label: 'Kỹ năng' },
                { key: '/admin/categories/cities', icon: <EnvironmentOutlined />, label: 'Thành phố' },
                { key: '/admin/categories/wards', icon: <EnvironmentOutlined />, label: 'Phường / Xã' },
            ]
        },
        { type: 'divider' },
        { 
            key: '/admin/users', 
            icon: <TeamOutlined />, 
            label: 'Quản lý Người dùng' 
        }
    ] : [
        // Menu dành cho Nhà tuyển dụng (Giữ nguyên)
        { key: '/employer/dashboard', icon: <DashboardOutlined />, label: 'Bảng điều khiển' },
        { type: 'divider' },
        {
            key: 'sub-recruitment', icon: <AppstoreOutlined />, label: 'Quản lý Tuyển dụng',
            children: [
                { key: '/employer/post-job', label: 'Đăng tin tuyển dụng' },
                { key: '/employer/jobs', label: 'Danh sách tin đã đăng' },
                { key: '/employer/cv-hunter', label: 'Săn ứng viên (CV Hunt)' },
            ]
        },
        {
            key: 'sub-company', icon: <BuildOutlined />, label: 'Hồ sơ Doanh nghiệp',
            children: [
                { key: '/employer/company-profile', label: 'Thông tin Công ty' } 
            ]
        },
        { type: 'divider' }, 
        {
            key: 'sub-finance', icon: <WalletOutlined />, label: 'Tài chính & Dịch vụ',
            children: [
                { key: '/employer/service-package', icon: <ShoppingCartOutlined />, label: 'Cửa hàng Dịch vụ' },
                { key: '/employer/wallet', label: 'Ví điện tử MoMo' },
            ]
        }
    ];

    // Mở sẵn các SubMenu dựa trên URL hiện tại
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
                <Menu 
                    theme="dark" 
                    mode="inline" 
                    selectedKeys={[location.pathname]} 
                    defaultOpenKeys={defaultOpenKeys} 
                    items={menuItems} 
                    onClick={handleMenuClick}
                />
            </Sider>

            <Layout>
                <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 1 }}>
                    <Button 
                        type="text" 
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                        onClick={() => setCollapsed(!collapsed)} 
                        style={{ fontSize: '18px', width: 64, height: 64 }} 
                    />
                    
                    <Space size="large">
                        <span style={{ color: '#595959', fontSize: '15px' }}>
                            Xin chào, <b style={{ color: '#1890ff' }}>{user?.hoTen || 'Quản trị viên'}</b>
                        </span>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                        <Button type="primary" danger ghost icon={<LogoutOutlined />} onClick={handleLogout} style={{ borderRadius: '6px' }}>
                            Đăng xuất
                        </Button>
                    </Space>
                </Header>

                <Content style={{ margin: '24px 24px', padding: 0, minHeight: 280, position: 'relative' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;