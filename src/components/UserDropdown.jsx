import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, Avatar, Menu, Typography, Divider, Button, Tag, Tooltip } from 'antd';
import './css/UserDropdown.css';
import apiClient from '../api/apiClient';
import {
    DownOutlined,
    SolutionOutlined,
    FilePdfOutlined,
    LogoutOutlined,
    CrownFilled,
    FireFilled,
    SettingOutlined,
    UserOutlined,
    KeyOutlined,
    MailOutlined,
    CheckCircleFilled,
    HeartOutlined,
    SendOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const getIsEmailVerifiedFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        const base64Url = token.split('.')[1];
        const decoded = JSON.parse(decodeURIComponent(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));

        const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (role === "0") return true;

        return decoded.isEmailVerified === 'true' || decoded.isEmailVerified === true;
    } catch (e) {
        return false;
    }
};

const UserDropdown = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [liveAvatar, setLiveAvatar] = useState(null);
    const [isEmailVerified, setIsEmailVerified] = useState(getIsEmailVerifiedFromToken());
    const [vipState, setVipState] = useState({
        isVip: false,
        daysLeft: null,
        tenGoi: 'Miễn phí'
    });

    const isDarkMode = false;

    const themeColors = {
        popoverBg: isDarkMode ? '#1f1f1f' : '#ffffff',
        textColor: isDarkMode ? '#ffffff' : '#262626',
        subTextColor: isDarkMode ? '#a6a6a6' : '#595959',
        borderColor: isDarkMode ? '#333333' : '#e8e8e8',
        shadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.12)',
        hoverItemBg: 'rgba(24, 144, 255, 0.08)',
        hoverItemColor: '#1890ff',
        triggerHoverBg: 'rgba(24, 144, 255, 0.1)'
    };

    const customStyles = `
      .user-dropdown-trigger {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: transparent;
      }
      .user-dropdown-trigger:hover {
        background: ${themeColors.triggerHoverBg};
        transform: translateY(-1px);
      }
      .vip-avatar-glow {
        box-shadow: 0 0 12px rgba(250, 173, 20, 0.5);
        animation: vip-pulse 2s infinite ease-in-out;
      }
      @keyframes vip-pulse {
        0% { box-shadow: 0 0 8px rgba(250, 173, 20, 0.4); }
        50% { box-shadow: 0 0 18px rgba(250, 173, 20, 0.8); }
        100% { box-shadow: 0 0 8px rgba(250, 173, 20, 0.4); }
      }
      .vip-badge-premium {
        background: linear-gradient(135deg, #faad14 0%, #ffe58f 50%, #faad14 100%);
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
        box-shadow: 0 2px 6px rgba(250, 173, 20, 0.4);
      }
      @keyframes gradient-shift {
        0% { background-position: 100% 50%; }
        50% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }
      .premium-menu .ant-menu-item {
        border-radius: 8px !important;
        margin-bottom: 4px !important;
        color: ${themeColors.textColor} !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .premium-menu .ant-menu-item:hover {
        background-color: ${themeColors.hoverItemBg} !important;
        color: ${themeColors.hoverItemColor} !important;
        transform: translateX(4px);
      }
      .premium-menu .ant-menu-submenu-title {
        color: ${themeColors.textColor} !important;
        border-radius: 8px !important;
      }
      .premium-menu .ant-menu-submenu-title:hover {
        color: ${themeColors.hoverItemColor} !important;
      }
      .premium-menu .logout-item:hover {
        background-color: rgba(255, 77, 79, 0.12) !important;
        color: #ff4d4f !important;
      }
      .premium-menu .logout-item:hover .ant-menu-item-icon {
        color: #ff4d4f !important;
      }
      .btn-3d-hover {
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      .btn-3d-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(250, 173, 20, 0.35);
      }
    `;

    const displayName = user?.hoTen || user?.fullName || 'Người dùng';
    const displayEmail = user?.email || 'Chưa cập nhật email';

    const fetchVipStatus = () => {
        const token = localStorage.getItem('token');
        if (token) {
            apiClient.get('/Service/balance')
                .then(res => {
                    const balData = res.data !== undefined ? res.data : res;
                    let days = null;
                    if (balData?.ngayHetHanGoi) {
                        const expireDate = new Date(balData.ngayHetHanGoi);
                        const today = new Date();
                        const diffTime = expireDate - today;
                        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    setVipState({
                        isVip: days !== null && days > 0,
                        daysLeft: days,
                        tenGoi: balData?.tenGoiHienTai || 'Miễn phí'
                    });
                })
                .catch(err => console.error("Lỗi lấy thông tin VIP:", err));
        }
    };

    useEffect(() => {
        fetchVipStatus();
        window.addEventListener('update_vip_status', fetchVipStatus);
        return () => window.removeEventListener('update_vip_status', fetchVipStatus);
    }, []);

    useEffect(() => {
        const userId = user?.maUser || user?.userId || user?.id;
        if (userId) {
            apiClient.get(`/Cv/primary-avatar/${userId}`)
                .then(res => {
                    const actualData = res?.data !== undefined ? res.data : res;
                    if (actualData) {
                        if (typeof actualData === 'object' && actualData.url) setLiveAvatar(actualData.url);
                        else if (typeof actualData === 'string' && actualData.trim().startsWith('http')) setLiveAvatar(actualData);
                    }
                })
                .catch(() => { });

            apiClient.get(`/User/profile/${userId}`)
                .then(res => {
                    const data = res.data || res;
                    if (data?.isEmailVerified !== undefined) setIsEmailVerified(data.isEmailVerified);
                })
                .catch(() => { });
        }
    }, [user]);

    const displayAvatar = liveAvatar || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

    const handleLogout = () => {
        if (onLogout) onLogout();
        else {
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
                {
                    key: 'viec-lam-da-luu',
                    icon: <HeartOutlined style={{ color: '#ff4d4f' }} />,
                    label: 'Việc làm yêu thích',
                    onClick: () => navigate('/viec-lam-da-luu') 
                },
                {
                    key: 'viec-lam-da-ung-tuyen',
                    icon: <SendOutlined style={{ color: '#1890ff' }} />,
                    label: 'Việc làm đã ứng tuyển',
                    onClick: () => navigate('/viec-lam') 
                },
            ],
        },
        {
            key: 'quan-ly-cv',
            icon: <FilePdfOutlined style={{ fontSize: 18 }} />,
            label: <span style={{ fontWeight: 500 }}>Quản lý CV</span>,
            children: [
                {
                    key: 'cv-cua-toi',
                    label: 'CV của tôi',
                    onClick: () => navigate('/manage-cv')
                }
            ],
        },
        {
            key: 'quan-ly-tai-khoan',
            icon: <SettingOutlined style={{ fontSize: 18 }} />,
            label: <span style={{ fontWeight: 500 }}>Quản lý tài khoản</span>,
            children: [
                {
                    key: 'thong-tin-ca-nhan',
                    icon: <UserOutlined />,
                    label: 'Thông tin cá nhân',
                    onClick: () => navigate('/profile')
                },
                {
                    key: 'xac-thuc-email',
                    icon: <MailOutlined />,
                    label: 'Xác thực Email',
                    onClick: () => navigate('/verify-email')
                },
                {
                    key: 'doi-mat-khau',
                    icon: <KeyOutlined />,
                    label: 'Quên / Đổi mật khẩu',
                    onClick: () => navigate('/forgot-password')
                },
            ],
        },
        { type: 'divider', style: { borderColor: themeColors.borderColor, margin: '8px 0' } },
        {
            key: 'dang-xuat',
            className: 'logout-item',
            icon: <LogoutOutlined style={{ fontSize: 18 }} />,
            label: <span style={{ fontWeight: 500 }}>Đăng xuất</span>,
            onClick: handleLogout
        }
    ];

    const actualIsVip = vipState.isVip;
    const isExpiringSoon = actualIsVip && vipState.daysLeft !== null && vipState.daysLeft <= 7;

    const popoverContent = (
        <div style={{ width: '340px', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 16px 20px', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                    <Avatar
                        size={58}
                        src={displayAvatar}
                        className={actualIsVip ? 'vip-avatar-glow' : ''}
                        style={{ border: actualIsVip ? '2px solid #faad14' : '2px solid #1890ff' }}
                    />
                    {actualIsVip && (
                        <div className="vip-badge-premium" style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', color: '#000', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                            PRO / VIP
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Text style={{ color: themeColors.textColor, fontSize: 17, fontWeight: '700', letterSpacing: '0.3px' }} ellipsis>{displayName}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 2 }}>
                        <Text style={{ color: themeColors.subTextColor, fontSize: 13, maxWidth: '170px' }} ellipsis>{displayEmail}</Text>
                        {isEmailVerified ? (
                            <Tooltip title="Email đã được xác thực">
                                <CheckCircleFilled style={{ color: '#52c41a', fontSize: '14px' }} />
                            </Tooltip>
                        ) : (
                            <Tooltip title="Email chưa xác thực - Bấm để xác thực ngay">
                                <Tag
                                    color="warning"
                                    onClick={() => navigate('/verify-email')} // Khớp <Route path="/verify-email" />[cite: 15]
                                    style={{ cursor: 'pointer', margin: 0, padding: '0 5px', fontSize: '10px', borderRadius: '4px' }}
                                >
                                    Chưa xác thực
                                </Tag>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 20px 16px 20px' }}>
                {actualIsVip ? (
                    <>
                        {isExpiringSoon && (
                            <div style={{ color: '#ff4d4f', backgroundColor: 'rgba(255, 77, 79, 0.08)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px', border: '1px solid rgba(255, 77, 79, 0.3)' }}>
                                <FireFilled style={{ fontSize: '16px' }} />
                                <span>Gói VIP hết hạn sau <b style={{ fontSize: '14px' }}>{vipState.daysLeft} ngày</b></span>
                            </div>
                        )}
                        <Button
                            block
                            className="btn-3d-hover"
                            onClick={() => navigate('/upgrade-vip')} // Khớp <Route path="/upgrade-vip" />[cite: 15]
                            style={{ background: 'rgba(250, 173, 20, 0.1)', color: '#faad14', fontWeight: 'bold', border: '1px solid #faad14', borderRadius: '8px', height: '40px' }}
                        >
                            Gia hạn gói VIP
                        </Button>
                    </>
                ) : (
                    <Button
                        block
                        className="btn-3d-hover"
                        icon={<CrownFilled />}
                        onClick={() => navigate('/upgrade-vip')} // Khớp <Route path="/upgrade-vip" />[cite: 15]
                        style={{ background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', height: '40px', fontSize: '14px' }}
                    >
                        Nâng cấp tài khoản VIP
                    </Button>
                )}
            </div>

            <Divider style={{ margin: '0', borderColor: themeColors.borderColor }} />

            <div style={{ padding: '8px' }}>
                <Menu
                    className="premium-menu"
                    mode="inline"
                    items={menuItems}
                    style={{ backgroundColor: 'transparent', borderRight: 'none' }}
                    theme="light"
                />
            </div>
        </div>
    );

    return (
        <>
            <style>{customStyles}</style>
            <Popover
                content={popoverContent}
                trigger="click"
                placement="bottomRight"
                arrow={false}
                overlayInnerStyle={{
                    backgroundColor: themeColors.popoverBg,
                    padding: 0,
                    border: `1px solid ${themeColors.borderColor}`,
                    borderRadius: '12px',
                    boxShadow: `0 10px 30px ${themeColors.shadowColor}`
                }}
            >
                <div className="user-dropdown-trigger" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px', padding: '6px 14px', borderRadius: '24px' }}>
                    <Avatar src={displayAvatar} size={32} style={{ border: actualIsVip ? '1.5px solid #faad14' : '1px solid #1890ff' }} />
                    <span style={{ color: '#262626', fontWeight: 500, fontSize: '14px' }}>{displayName}</span>
                    <DownOutlined style={{ color: '#8c8c8c', fontSize: 12, marginLeft: '2px' }} />
                </div>
            </Popover>
        </>
    );
};

export default UserDropdown;