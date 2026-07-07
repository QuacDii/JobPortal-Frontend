import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message, Badge } from 'antd';
import { FilterOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const EmployerJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        setLoading(true);
        try {
            // Cập nhật đúng port 5279 của bạn
            const response = await apiClient.get('/employer/my-jobs');
            setJobs(response);
        } catch (error) {
            message.error("Lỗi khi tải danh sách tin tuyển dụng");
        }
        setLoading(false);
    };

    const columns = [
        {
            title: 'Chiến dịch / Vị trí',
            dataIndex: 'tieuDe',
            key: 'tieuDe',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Ngày đăng',
            dataIndex: 'ngayTao',
            key: 'ngayTao',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            render: (status) => (
                status === 1 ? <Tag color="green">Đang hiển thị</Tag> 
                             : <Tag color="orange">Chờ duyệt / Ẩn</Tag>
            )
        },
        {
            title: 'Ứng viên',
            key: 'soLuong',
            align: 'center',
            render: (text, record) => (
                <Badge count={record.soLuongUngVien} showZero color="#1890ff" />
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (text, record) => (
                <Space size="middle">
                    <Button 
                        type="primary" 
                        icon={<FilterOutlined />} 
                        // Điều hướng sang trang phễu ứng viên kèm theo tham số maViTri trên URL
                        onClick={() => navigate(`/employer/candidate-funnel/${record.maViTri}`)}
                    >
                        Xem Phễu
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
            <h2 style={{ marginBottom: 20 }}>Danh sách Tin đã đăng</h2>
            <Table 
                columns={columns} 
                dataSource={jobs} 
                rowKey="maViTri" 
                loading={loading}
            />
        </div>
    );
};

export default EmployerJobs;