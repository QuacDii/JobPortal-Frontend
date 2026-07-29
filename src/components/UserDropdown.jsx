import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, Avatar, Menu, Typography, Divider, Button } from 'antd';
import './css/UserDropdown.css';
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
            fullName: decoded.HoTen || decoded.name || '',
            email: decoded.email || decoded.emailaddress || '',
            isVip: decoded.isVip === 'true' || decoded.isVip === true
        };
    } catch (error) {
        return null;
    }
};
const UserDropdown = ({ user, onLogout }) => {
    const navigate = useNavigate();

    // 1. STATE LƯU TRỮ LINK ẢNH REALTIME LẤY TỪ CV CHÍNH
    const [liveAvatar, setLiveAvatar] = useState(null);

    const displayName = user?.hoTen || 'Người dùng';
    const displayEmail = user?.email || 'Chưa cập nhật email';

    // 2. 🔄 TỰ ĐỘNG GỌI API LẤY ẢNH CV CHÍNH KHI ĐĂNG NHẬP THÀNH CÔNG (PHÒNG THỦ ĐA TẦNG)
    useEffect(() => {
        // Dự phòng trường hợp maUser bị biến thể thành id hoặc userId từ Token
        const userId = user?.maUser || user?.userId || user?.id;

        if (userId) {
            apiClient.get(`/Cv/primary-avatar/${userId}`)
                .then(res => {
                    // Đề phòng Interceptor tự động bóc tách dữ liệu JSON
                    const actualData = res?.data !== undefined ? res.data : res;

                    if (actualData) {
                        // Trường hợp 1: API trả về một Object chứa URL dạng { url: "http://..." }
                        if (typeof actualData === 'object' && actualData.url) {
                            setLiveAvatar(actualData.url);
                        }
                        // Trường hợp 2: API trả về thẳng một chuỗi chuỗi String URL
                        else if (typeof actualData === 'string' && actualData.trim().startsWith('http')) {
                            setLiveAvatar(actualData);
                        }
                    }
                })
                .catch(err => {
                    console.error("Lỗi đồng bộ ảnh đại diện từ CV chính:", err);
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
                {
                    key: 'viec-lam-da-ung-tuyen', label: 'Việc làm đã ứng tuyển',
                    onClick: () => navigate('/viec-lam')
                },
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

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const isVip = userInfo?.isVip || false;

    const popoverContent = (
        <div style={{ width: '340px', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '12px' }}>
                <Avatar size={56} src={displayAvatar} style={{ border: '2px solid #00b14f' }} />
                {isVip && (
                    <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', background: '#faad14', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px', border: '1px solid #141414', whiteSpace: 'nowrap' }}>
                        PRO / VIP
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{displayName}</Text>
                    <Text style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>{displayEmail}</Text>
                </div>
            </div>
            {!isVip && (
                <div style={{ padding: '0 20px 12px 20px' }}>
                    <Button
                        block
                        onClick={() => navigate('/upgrade-vip')}
                        style={{ background: 'linear-gradient(90deg, #faad14, #ffc53d)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px' }}
                    >
                        Nâng cấp tài khoản VIP
                    </Button>
                </div>
            )}

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