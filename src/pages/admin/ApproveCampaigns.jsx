import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Popconfirm, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, NotificationOutlined, CalendarOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const ApproveCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lấy danh sách chiến dịch chờ duyệt
    const fetchPendingCampaigns = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await apiClient.get('/AdminApproval/pending-campaigns', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCampaigns(response.data);
        } catch (error) {
            message.error("Lỗi khi tải danh sách chiến dịch chờ duyệt!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingCampaigns();
    }, []);

    // Xử lý Duyệt / Từ chối
    const handleReview = async (id, isApproved) => {
        try {
            const token = localStorage.getItem('token');
            await  apiClient.put(`/AdminApproval/review-campaign/${id}`, 
                { isApproved }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            message.success(isApproved ? "Chiến dịch đã được online!" : "Đã từ chối chiến dịch!");
            fetchPendingCampaigns(); // Reload danh sách sau khi thao tác
        } catch (error) {
            message.error("Có lỗi xảy ra trong quá trình xử lý!");
        }
    };

    const columns = [
        {
            title: 'Tiêu đề chiến dịch',
            dataIndex: 'tieuDeChienDich',
            key: 'tieuDeChienDich',
            render: (text, record) => (
                <div>
                    <b><NotificationOutlined style={{ marginRight: 8, color: '#1890ff' }}/>{text}</b>
                    {record.isPromoted && <Tag color="gold" style={{ marginLeft: 8 }}>🔥 Tin nổi bật</Tag>}
                </div>
            )
        },
        {
            title: 'Tên Doanh Nghiệp',
            dataIndex: 'tenCongTy',
            key: 'tenCongTy',
            render: (text) => <span style={{ fontWeight: 500, color: '#595959' }}>{text}</span>
        },
        {
            title: 'Hạn chót ứng tuyển',
            dataIndex: 'ngayHetHan',
            key: 'ngayHetHan',
            render: (date) => (
                <span><CalendarOutlined style={{ marginRight: 5 }}/>{new Date(date).toLocaleDateString('vi-VN')}</span>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Popconfirm
                        title="Duyệt chiến dịch này lên hệ thống?"
                        onConfirm={() => handleReview(record.maTin, true)}
                        okText="Duyệt"
                        cancelText="Hủy"
                    >
                        <Button type="primary" icon={<CheckOutlined />} style={{ backgroundColor: '#52c41a' }}>
                            Duyệt
                        </Button>
                    </Popconfirm>
                    
                    <Popconfirm
                        title="Bạn muốn từ chối chiến dịch này?"
                        onConfirm={() => handleReview(record.maTin, false)}
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
        <Card title={<h3 style={{ margin: 0 }}>Kiểm duyệt Chiến dịch Tuyển dụng</h3>}>
            <Table 
                columns={columns} 
                dataSource={campaigns} 
                rowKey="maTin" 
                loading={loading}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: 'Không có chiến dịch nào đang chờ duyệt.' }}
            />
        </Card>
    );
};

export default ApproveCampaigns;