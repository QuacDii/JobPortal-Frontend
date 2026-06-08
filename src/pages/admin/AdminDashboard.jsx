import React from 'react';
import { Alert, Timeline } from 'antd';

const AdminDashboard = () => {
    return (
        <div>
            <h2>👑 Hệ thống quản trị JobsNow Admin</h2>
            <Alert message="Hệ thống đang hoạt động ổn định. Có 3 tin đăng mới đang chờ bạn duyệt!" type="info" showIcon style={{ marginBottom: 20 }} />
            
            <h3>🔔 Nhật ký hệ thống gần đây:</h3>
            <Timeline style={{ marginTop: 20 }}>
                <Timeline.Item color="green">Đặng Quốc Duy vừa đăng ký tài khoản Ứng viên mới (10 phút trước)</Timeline.Item>
                <Timeline.Item color="blue">Công ty TMA Solutions cập nhật thông tin tuyển dụng (1 tiếng trước)</Timeline.Item>
                <Timeline.Item color="red">Hệ thống chặn 1 ddos tấn công vào cổng API Auth (Hôm qua)</Timeline.Item>
            </Timeline>
        </div>
    );
};

export default AdminDashboard;