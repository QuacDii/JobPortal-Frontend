import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space } from 'antd';
import { 
    UserOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined, 
    DashboardOutlined, TeamOutlined, FileSearchOutlined, 
    WalletOutlined, ShoppingCartOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children, user }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Lấy đường dẫn hiện tại để highlight menu

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    // Hàm xử lý khi click vào Menu
    const handleMenuClick = (e) => {
        navigate(e.key); // Chuyển hướng đến đường dẫn được lưu trong 'key'
    };

    // Tự động đổi danh mục menu dựa vào vai trò của tài khoản
    // Đã thay đổi 'key' thành đường dẫn thực tế
    const menuItems = user?.vaiTro === "0" ? [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan Admin' },
        { key: '/admin/users', icon: <TeamOutlined />, label: 'Quản lý Người dùng' },
        { key: '/admin/news', icon: <FileSearchOutlined />, label: 'Phê duyệt Tin tức' },
    ] : [
        { key: '/employer/dashboard', icon: <DashboardOutlined />, label: 'Bảng tin tuyển dụng' },
        { key: '/employer/post-job', icon: <FileSearchOutlined />, label: 'Đăng tin mới' },
        { key: '/employer/candidates', icon: <TeamOutlined />, label: 'Quản lý Ứng viên' },
        { type: 'divider' }, 
        { key: '/employer/wallet', icon: <WalletOutlined />, label: 'Ví MoMo & Nạp tiền' },
        { key: '/employer/service-package', icon: <ShoppingCartOutlined />, label: 'Bảng giá & Dịch vụ' },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Thanh Menu dọc bên trái */}
            <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
                <div style={{ height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold', background: '#002140' }}>
                    {collapsed ? 'JN' : 'PANEL CONTROL'}
                </div>
                <Menu 
                    theme="dark" 
                    mode="inline" 
                    // Tự động bôi sáng menu item dựa vào URL hiện tại
                    selectedKeys={[location.pathname]} 
                    items={menuItems} 
                    onClick={handleMenuClick}
                />
            </Sider>

            <Layout>
                {/* Thanh Header bên trên */}
                <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
                    <Button 
                        type="text" 
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                        onClick={() => setCollapsed(!collapsed)} 
                        style={{ fontSize: '16px', width: 64, height: 64 }} 
                    />
                    
                    <Space size="middle">
                        <span style={{ color: '#595959' }}>Xin chào, <b>{user?.hoTen || 'Quản trị viên'}</b> ({user?.vaiTro === "0" ? "Admin" : "Nhà tuyển dụng"})</span>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
                        <Button type="primary" danger ghost icon={<LogoutOutlined />} onClick={handleLogout}>
                            Đăng xuất
                        </Button>
                    </Space>
                </Header>

                {/* Nội dung hiển thị của từng trang */}
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280, borderRadius: 8, position: 'relative' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;