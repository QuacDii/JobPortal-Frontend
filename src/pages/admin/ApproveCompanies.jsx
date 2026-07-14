import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Popconfirm, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, ApartmentOutlined } from '@ant-design/icons';
import axios from 'axios';

const ApproveCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hàm gọi API lấy danh sách chờ duyệt
    const fetchPendingCompanies = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5279/api/AdminApproval/pending-companies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(response.data);
        } catch (error) {
            message.error("Lỗi khi tải danh sách chờ duyệt!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingCompanies();
    }, []);

    // Hàm xử lý Phê duyệt / Từ chối
    const handleReview = async (id, isApproved) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5279/api/AdminApproval/review-company/${id}`, 
                { isApproved }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            message.success(isApproved ? "Phê duyệt thành công!" : "Đã từ chối doanh nghiệp!");
            fetchPendingCompanies(); // Reload lại bảng
        } catch (error) {
            message.error("Có lỗi xảy ra trong quá trình xử lý!");
        }
    };

    const columns = [
        {
            title: 'Tên Doanh Nghiệp',
            dataIndex: 'tenCongTy',
            key: 'tenCongTy',
            render: (text) => <b><ApartmentOutlined style={{ marginRight: 8, color: '#1890ff' }}/>{text}</b>
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
            render: (_, record) => (
                <Space size="middle">
                    <Popconfirm
                        title="Bạn có chắc chắn muốn phê duyệt doanh nghiệp này?"
                        onConfirm={() => handleReview(record.maCongTy, true)}
                        okText="Phê duyệt"
                        cancelText="Hủy"
                    >
                        <Button type="primary" icon={<CheckOutlined />} style={{ backgroundColor: '#52c41a' }}>
                            Duyệt
                        </Button>
                    </Popconfirm>
                    
                    <Popconfirm
                        title="Bạn có chắc chắn muốn từ chối (xóa) yêu cầu này?"
                        onConfirm={() => handleReview(record.maCongTy, false)}
                        okText="Từ chối"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<CloseOutlined />}>
                            Từ chối
                        </Button>
                    </Popconfirm>
                </Space>
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