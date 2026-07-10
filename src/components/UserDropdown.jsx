import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👉 ĐÃ THÊM: Import thư viện chuyển trang
import { Popover, Avatar, Menu, Typography, Divider } from 'antd';
import apiClient from '../api/apiClient';
import {
    DownOutlined,
    SolutionOutlined,
    FilePdfOutlined,
    SettingOutlined,
    SafetyOutlined,
    LogoutOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const UserDropdown = ({ user, onLogout }) => {
    const navigate = useNavigate(); // 👉 ĐÃ THÊM: Khởi tạo hàm chuyển trang

    // 1. STATE LƯU TRỮ LINK ẢNH REALTIME LẤY TỪ CV CHÍNH
    const [liveAvatar, setLiveAvatar] = useState(null);

    const displayName = user?.hoTen || 'Người dùng';
    const displayEmail = user?.email || 'Chưa cập nhật email';

    // 2. 🔄 TỰ ĐỘNG GỌI API LẤY ẢNH CV CHÍNH KHI ĐĂNG NHẬP THÀNH CÔNG
    useEffect(() => {
        if (user?.maUser) {
            apiClient.get(`/Cv/primary-avatar/${user.maUser}`)
                .then(res => {
                    if (res.data && res.data.url) {
                        setLiveAvatar(res.data.url); 
                    }
                })
                .catch(err => {
                    console.error("Lỗi đồng bộ ảnh đại diện từ CV:", err);
                });
        }
    }, [user]);

    const displayAvatar = liveAvatar || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            localStorage.clear();
            window.location.href = '/';
        }
    };

    const menuItems = [
        {
            key: 'quan-ly-tim-viec',
            icon: <SolutionOutlined style={{ fontSize: 18 }} />,
            label: <span style={{ fontWeight: 500 }}>Quản lý tìm việc</span>,
            children: [
                { key: 'viec-lam-da-luu', label: 'Việc làm đã lưu' },
                { key: 'viec-lam-da-ung-tuyen', label: 'Việc làm đã ứng tuyển' },
            ],
        },
        {
            key: 'quan-ly-cv',
            icon: <FilePdfOutlined style={{ fontSize: 18 }} />,
            label: <span style={{ fontWeight: 500 }}>Quản lý CV & Cover letter</span>,
            children: [
                { 
                    key: 'cv-cua-toi', 
                    label: 'CV của tôi',
                    onClick: () => navigate('/manage-cv')
                },
                { 
                    key: 'cover-letter', 
                    label: 'Cover Letter của tôi' 
                },
            ],
        },
        {
            type: 'divider',
            style: { borderColor: '#333' }
        },
        {
            key: 'dang-xuat',
            className: 'logout-item',
            icon: <LogoutOutlined style={{ fontSize: 18 }} />, 
            label: <span style={{ fontWeight: 500 }}>Đăng xuất</span>, 
            onClick: handleLogout
        }
    ];

    const popoverContent = (
        <div style={{ width: '340px', paddingBottom: '8px' }}>
            <style>{`
                .my-custom-menu.ant-menu-dark .ant-menu-item,
                .my-custom-menu.ant-menu-dark .ant-menu-submenu-title,
                .my-custom-menu.ant-menu-dark .ant-menu-item .anticon,
                .my-custom-menu.ant-menu-dark .ant-menu-item span,
                .my-custom-menu.ant-menu-dark .ant-menu-submenu-title span {
                    color: #a6a6a6 !important;
                }
                
                .my-custom-menu.ant-menu-dark .ant-menu-sub {
                    background-color: transparent !important;
                }
                
                .my-custom-menu.ant-menu-dark .ant-menu-item:not(.logout-item):hover,
                .my-custom-menu.ant-menu-dark .ant-menu-submenu-title:hover {
                    background-color: transparent !important;
                }
                .my-custom-menu.ant-menu-dark .ant-menu-item:not(.logout-item):hover span,
                .my-custom-menu.ant-menu-dark .ant-menu-submenu-title:hover span,
                .my-custom-menu.ant-menu-dark .ant-menu-item:not(.logout-item):hover .anticon,
                .my-custom-menu.ant-menu-dark .ant-menu-submenu-title:hover .anticon {
                    color: #1890ff !important;
                }
                
                .my-custom-menu.ant-menu-dark .logout-item,
                .my-custom-menu.ant-menu-dark .logout-item span,
                .my-custom-menu.ant-menu-dark .logout-item .anticon {
                    color: #ff4d4f !important;
                }
                
                .my-custom-menu.ant-menu-dark .logout-item:hover {
                    background-color: rgba(255, 77, 79, 0.08) !important;
                    border-radius: 6px !important;
                }
                .my-custom-menu.ant-menu-dark .logout-item:hover span,
                .my-custom-menu.ant-menu-dark .logout-item:hover .anticon {
                    background-color: transparent !important;
                    color: #ff7875 !important;
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '12px' }}>
                <Avatar size={56} src={displayAvatar} style={{ border: '2px solid #00b14f' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{displayName}</Text>
                    <Text style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>{displayEmail}</Text>
                </div>
            </div>

            <Divider style={{ margin: '0 0 8px 0', borderColor: '#333' }} />

            <Menu 
                className="my-custom-menu"
                mode="inline" 
                items={menuItems} 
                style={{ backgroundColor: 'transparent', borderRight: 'none' }} 
                theme="dark" 
            />
        </div>
    );

    return (
        <Popover 
            content={popoverContent} 
            trigger="hover" 
            placement="bottomRight"
            arrow={false}
            overlayInnerStyle={{ backgroundColor: '#212121', padding: 0, border: '1px solid #333', borderRadius: '8px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', padding: '4px 12px', borderRadius: '20px' }}>
                <Avatar src={displayAvatar} />
                <span style={{ color: '#fff', fontWeight: 500 }}>{displayName}</span>
                <DownOutlined style={{ color: '#a6a6a6', fontSize: 12 }} />
            </div>
        </Popover>
    );
};

export default UserDropdown;