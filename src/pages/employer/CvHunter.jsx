import React, { useState, useEffect } from 'react';
import { Table, Button, message, Input } from 'antd';
import { UnlockOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient'; // Đảm bảo đường dẫn đúng

const CvHunter = () => {
    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCvs = async (keyword = "") => {
        setLoading(true);
        const data = await apiClient.get(`/employer/hunt-cv?keyword=${keyword}`);
        setCvs(data);
        setLoading(false);
    };

    const handleUnlock = async (maCv) => {
        try {
            await apiClient.post(`/employer/unlock-cv/${maCv}`);
            message.success("Mở khóa thành công!");
            fetchCvs(); // Reload lại để lấy data thật
        } catch (err) {
            message.error(err.response?.data || "Lỗi mở khóa");
        }
    };

    const columns = [
        { title: 'Tên ứng viên', dataIndex: 'hoTen' },
        { title: 'Email', dataIndex: 'email' },
        { title: 'SĐT', dataIndex: 'soDienThoai' },
        {
            title: 'Hành động',
            render: (_, record) => !record.isUnlocked && (
                <Button type="primary" icon={<UnlockOutlined />} onClick={() => handleUnlock(record.maCv)}>
                    Mở khóa (1 lượt)
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Input.Search placeholder="Tìm kiếm theo tên CV..." onSearch={fetchCvs} style={{ marginBottom: 16, width: 300 }} />
            <Table columns={columns} dataSource={cvs} rowKey="maCv" loading={loading} />
        </div>
    );
};
export default CvHunter;