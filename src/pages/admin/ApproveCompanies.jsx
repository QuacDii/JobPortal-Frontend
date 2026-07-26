import React, { useEffect, useState } from 'react';
import { Table, Button, Card, message, Tag } from 'antd';
import { ApartmentOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const ApproveCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchPendingCompanies = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await apiClient.get('/AdminApproval/pending-companies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payload = response?.data || response;
            setCompanies(Array.isArray(payload) ? payload : (payload?.data || []));
        } catch (error) {
            message.error("Lỗi khi tải danh sách chờ duyệt!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingCompanies();
    }, []);

    const columns = [
        {
            title: 'Tên Doanh Nghiệp',
            dataIndex: 'tenCongTy',
            key: 'tenCongTy',
            render: (text) => <b><ApartmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />{text}</b>
        },
        {
            title: 'Mã số thuế',
            dataIndex: 'maSoThue',
            key: 'maSoThue',
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Người đại diện',
            dataIndex: 'nguoiDaiDien',
            key: 'nguoiDaiDien',
        },
        {
            title: 'Email liên hệ',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    onClick={() => navigate(`/admin/company-detail/${record.maCongTy}`)}
                >
                    Xem hồ sơ
                </Button>
            ),
        },
    ];

    return (
        <Card title={<h3 style={{ margin: 0 }}>Kiểm duyệt Doanh nghiệp mới</h3>}>
            <Table 
                columns={columns} 
                dataSource={companies} 
                rowKey="maCongTy" 
                loading={loading}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: 'Không có doanh nghiệp nào đang chờ duyệt.' }}
            />
        </Card>
    );
};

export default ApproveCompanies;