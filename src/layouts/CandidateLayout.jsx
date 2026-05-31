import React from 'react';
import { Layout, Menu, Space } from 'antd';
import { HomeOutlined, FileTextOutlined } from '@ant-design/icons';
import UserDropdown from '../components/UserDropdown'; 
import CreateCvMenu from '../components/CreateCvMenu';

const { Header, Content, Footer } = Layout;

const CandidateLayout = ({ children, user }) => {
    
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529', padding: '0 20px' }}>
                
                {/* ==========================================
                    CỤM BÊN TRÁI: LOGO + MENU ĐIỀU HƯỚNG
                ========================================== */}
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {/* Logo */}
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>
                        JOBS<span style={{ color: '#1890ff' }}>NOW</span>
                    </div>
                    
                    {/* Menu Ant Design (Trang chủ, Việc làm) */}
                    <Menu 
                        theme="dark" 
                        mode="horizontal" 
                        defaultSelectedKeys={['1']} 
                        style={{ minWidth: 280, marginLeft: 30, background: 'transparent' }}
                    >
                        <Menu.Item key="1" icon={<HomeOutlined />}>Trang chủ</Menu.Item>
                        <Menu.Item key="2" icon={<FileTextOutlined />}>Việc làm của tôi</Menu.Item>
                    </Menu>

                    {/* NHÚNG MEGA MENU TẠO CV VÀO ĐÂY */}
                    <div style={{ marginLeft: 8 }}>
                        <CreateCvMenu />
                    </div>
                </div>

                {/* ==========================================
                    CỤM BÊN PHẢI: PROFILE NGƯỜI DÙNG
                ========================================== */}
                <Space size="middle">
                    {/* Truyền cục data 'user' và hàm 'handleLogout' xuống cho Dropdown xài */}
                    <UserDropdown user={user} onLogout={handleLogout} />
                </Space>
                
            </Header>

            {/* ==========================================
                PHẦN NỘI DUNG CHÍNH (THAY ĐỔI THEO TRANG)
            ========================================== */}
            <Content style={{ padding: '30px 50px', background: '#f5f5f5' }}>
                <div style={{ background: '#fff', padding: 24, minHeight: 380, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    {children}
                </div>
            </Content>

            {/* ==========================================
                FOOTER BÊN DƯỚI CÙNG
            ========================================== */}
            <Footer style={{ textAlign: 'center', color: '#8c8c8c' }}>
                JobsNow ©2026 - Hệ thống hỗ trợ tìm kiếm việc làm thông minh
            </Footer>
        </Layout>
    );
};

export default CandidateLayout;