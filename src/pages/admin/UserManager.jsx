import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Tag, Switch, message, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient'; 

const { Title, Text } = Typography;

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // 1. GỌI API LẤY DANH SÁCH USER
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/User');
            const data = response.data !== undefined ? response.data : response; 
            setUsers(data || []);
        } catch (error) {
            message.error('Lỗi khi tải danh sách người dùng!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 2. HÀM KHÓA / MỞ KHÓA TÀI KHOẢN (BAN / UNBAN)
    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            // Đảo ngược trạng thái hiện tại gửi xuống API
            const newStatus = !currentStatus; 
            await apiClient.put(`/User/toggle-status/${userId}`, { trangThai: newStatus });
            
            // Cập nhật giao diện ngay lập tức
            setUsers(users.map(u => u.maUser === userId ? { ...u, trangThai: newStatus } : u));
            message.success(newStatus ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản này!');
        } catch (error) {
            message.error('Không thể cập nhật trạng thái!');
        }
    };

    // 3. BỘ LỌC TÌM KIẾM THEO TÊN HOẶC EMAIL
    const filteredUsers = users.filter((user) => {
        const keyword = searchText.toLowerCase();
        const matchName = user.hoTen?.toLowerCase().includes(keyword);
        const matchEmail = user.email?.toLowerCase().includes(keyword);
        return matchName || matchEmail;
    });

    // 4. CẤU HÌNH CỘT CHO BẢNG
    const columns = [
        {
            title: 'ID',
            dataIndex: 'maUser',
            key: 'maUser',
            width: 80,
            align: 'center',
        },
        {
            title: 'Thông tin người dùng',
            key: 'info',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.hoTen}</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>{record.email}</Text>
                </Space>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'vaiTro',
            key: 'vaiTro',
            width: 180,
            render: (role) => {
                // Phân loại màu sắc theo bảng User (0: Admin, 1: NTD, 2: Ứng viên)
                if (role === 0 || role === "0") return <Tag color="red">Admin</Tag>;
                if (role === 1 || role === "1") return <Tag color="orange">Nhà tuyển dụng</Tag>;
                return <Tag color="blue">Ứng viên</Tag>;
            },
            filters: [
                { text: 'Admin', value: 0 },
                { text: 'Nhà tuyển dụng', value: 1 },
                { text: 'Ứng viên', value: 2 },
            ],
            onFilter: (value, record) => record.vaiTro === value,
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'ngayTao',
            key: 'ngayTao',
            width: 150,
            align: 'center',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
            sorter: (a, b) => new Date(a.ngayTao) - new Date(b.ngayTao),
        },
        {
            title: 'Khóa / Mở khóa',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                // Nếu là Admin (vaiTro === 0) thì không cho phép tự khóa chính mình
                <Switch 
                    checked={record.trangThai} 
                    onChange={() => handleToggleStatus(record.maUser, record.trangThai)}
                    disabled={record.vaiTro === 0 || record.vaiTro === "0"} 
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Bị khóa"
                    style={{ backgroundColor: record.trangThai ? '#52c41a' : '#ff4d4f' }}
                />
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <Title level={3} style={{ margin: 0 }}><UserOutlined /> Quản lý Người dùng</Title>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Input.Search
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        allowClear
                        size="large"
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 350 }}
                    />
                </div>
            </div>

            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table 
                    columns={columns} 
                    dataSource={filteredUsers} 
                    rowKey="maUser" 
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    bordered
                />
            </Card>
        </div>
    );
};

export default UserManager;