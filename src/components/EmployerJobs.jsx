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

    // Lấy danh sách vị trí việc làm của công ty
    const fetchMyJobs = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/employer/my-jobs');
            
            const resData = response?.data || response;
            if (resData && resData.status === "SUCCESS") {
                setJobs(resData.data || []);
            } else if (Array.isArray(resData)) {
                setJobs(resData);
            } else if (resData && Array.isArray(resData.data)) {
                setJobs(resData.data);
            }
        } catch (error) {
            message.error("Lỗi khi tải danh sách tin tuyển dụng");
        }
        setLoading(false);
    };

    // Định nghĩa các cột hiển thị trong bảng
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
            render: (status) => {
                // Phân rã hiển thị nhãn theo từng mã trạng thái nghiệp vụ
                if (status === 0) return <Tag color="orange">Chờ duyệt</Tag>;
                if (status === 1) return <Tag color="green">Đang hiển thị</Tag>;
                if (status === 2) return <Tag color="red">Bị từ chối / Đã đóng</Tag>;
                return <Tag color="default">Ẩn</Tag>;
            }
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
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/jobs/${record.maTin}`, '_blank')}
                    >
                        Xem chi tiết
                    </Button>
                    {record.trangThai === 1 && (
                        <Button 
                            type="primary" 
                            icon={<FilterOutlined />} 
                            onClick={() => navigate(`/employer/candidate-funnel/${record.maViTri}`)}
                        >
                            Xem Phễu
                        </Button>
                    )}
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