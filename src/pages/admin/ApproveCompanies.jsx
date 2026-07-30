import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Tag, Button, Typography, Space, Input, Tabs, message, Badge } from 'antd';
import { ApartmentOutlined, EyeOutlined, SearchOutlined, SyncOutlined, UserAddOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;

const ApproveCompanies = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');

    useEffect(() => {
        fetchPendingCompanies();
    }, []);

    const fetchPendingCompanies = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiClient.get('/AdminApproval/pending-companies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(res?.data || res || []);
        } catch (error) {
            message.error("Lỗi khi tải danh sách hàng chờ thẩm định!");
        } finally {
            setLoading(false);
        }
    };

    // Lọc danh sách theo Tab và Từ khóa tìm kiếm
    const filteredCompanies = companies.filter(item => {
        const matchesSearch = 
            item.tenCongTy?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.maSoThue?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.email?.toLowerCase().includes(searchText.toLowerCase());

        if (activeTab === 'NEW') return matchesSearch && item.loaiYeuCau === 'NEW';
        if (activeTab === 'UPDATE') return matchesSearch && item.loaiYeuCau === 'UPDATE';
        return matchesSearch;
    });

    const countNew = companies.filter(c => c.loaiYeuCau === 'NEW').length;
    const countUpdate = companies.filter(c => c.loaiYeuCau === 'UPDATE').length;

    const columns = [
        {
            title: 'Doanh nghiệp / MST',
            dataIndex: 'tenCongTy',
            key: 'tenCongTy',
            render: (text, record) => (
                <div>
                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{text}</Text>
                    <div>
                        <Tag color="geekblue" style={{ fontSize: 12, marginTop: 4 }}>MST: {record.maSoThue}</Tag>
                    </div>
                </div>
            )
        },
        {
            title: 'Loại yêu cầu',
            dataIndex: 'loaiYeuCau',
            key: 'loaiYeuCau',
            render: (type) => (
                type === 'UPDATE' ? (
                    <Tag color="blue" icon={<SyncOutlined spin />}>Yêu cầu Cập nhật</Tag>
                ) : (
                    <Tag color="orange" icon={<UserAddOutlined />}>Đăng ký Mới</Tag>
                )
            )
        },
        {
            title: 'Người đại diện / Email',
            dataIndex: 'nguoiDaiDien',
            key: 'nguoiDaiDien',
            render: (text, record) => (
                <div>
                    <Text strong>{text || 'Chưa rõ'}</Text>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{record.email}</div>
                </div>
            )
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'diaChi',
            key: 'diaChi',
            ellipsis: true
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    size="small" 
                    onClick={() => navigate(`/admin/company-detail/${record.maCongTy}`)}
                >
                    Thẩm định
                </Button>
            )
        }
    ];

    const tabItems = [
        {
            key: 'ALL',
            label: (<span>Tất cả hàng chờ <Badge count={companies.length} overflowCount={99} style={{ backgroundColor: '#1677ff', marginLeft: 6 }} /></span>)
        },
        {
            key: 'NEW',
            label: (<span><UserAddOutlined /> Đăng ký mới <Badge count={countNew} overflowCount={99} style={{ backgroundColor: '#fa8c16', marginLeft: 6 }} /></span>)
        },
        {
            key: 'UPDATE',
            label: (<span><SyncOutlined /> Yêu cầu cập nhật <Badge count={countUpdate} overflowCount={99} style={{ backgroundColor: '#52c41a', marginLeft: 6 }} /></span>)
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>
                        <ApartmentOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                        HÀNG CHỜ THẨM ĐỊNH HỒ SƠ DOANH NGHIỆP
                    </Title>
                    <Input 
                        placeholder="Tìm theo tên, MST, email..." 
                        prefix={<SearchOutlined />} 
                        style={{ width: 280 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

                <Table 
                    columns={columns} 
                    dataSource={filteredCompanies} 
                    rowKey="maCongTy" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default ApproveCompanies;