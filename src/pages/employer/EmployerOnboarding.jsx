import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Result } from 'antd';
import { ShopOutlined, FileProtectOutlined, EnvironmentOutlined, HourglassOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Paragraph } = Typography;

const EmployerOnboarding = ({ onStatusChange, currentStatus }) => {
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/auth/onboarding', values);

            if (response.success || response.data?.success) {
                message.success("Khai báo hồ sơ thành công! Đang chờ Admin phê duyệt.");
                onStatusChange("PENDING");
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Khai báo thất bại!");
        } finally {
            setLoading(false);
        }
    };

    // Giao diện khi ĐÃ GỬI hồ sơ và đang CHỜ ADMIN DUYỆT
    if (currentStatus === "PENDING") {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Card style={{ width: 600, textAlign: 'center', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Result
                        icon={<HourglassOutlined style={{ color: '#fa8c16', fontSize: 64 }} />}
                        title="Hồ sơ doanh nghiệp đang chờ phê duyệt!"
                        subTitle="Hệ thống đang tiến hành xác minh thông tin Mã số thuế và Doanh nghiệp của bạn. Tiến trình này thường mất từ 10 - 15 phút. Bạn sẽ nhận được toàn quyền truy cập tuyển dụng ngay khi Admin phê duyệt."
                        extra={[
                            <Button type="primary" key="refresh" onClick={() => window.location.reload()} style={{ backgroundColor: '#1890ff' }}>
                                F5 Kiểm tra lại trạng thái
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    // Giao diện FORM KHAI BÁO (Dành cho NO_COMPANY)
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
            <Card style={{ width: 550, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: '#1890ff', margin: 0 }}>HOÀN THIỆN HỒ SƠ DOANH NGHIỆP</Title>
                    <Paragraph type="secondary" style={{ marginTop: 8 }}>
                        Bạn vừa đăng ký tài khoản thành công! Hãy cung cấp thông tin công ty để Admin kích hoạt tính năng đăng tuyển dụng.
                    </Paragraph>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="tenCongTy" label="Tên công ty phát hành tuyển dụng" rules={[{ required: true, message: 'Vui lòng nhập tên công ty!' }]}>
                        <Input prefix={<ShopOutlined />} placeholder="Ví dụ: Công ty TNHH FPT Software" size="large" />
                    </Form.Item>

                    <Form.Item name="maSoThue" label="Mã số thuế doanh nghiệp (Để đối chiếu xác minh)" rules={[{ required: true, message: 'Vui lòng nhập mã số thuế!' }]}>
                        <Input prefix={<FileProtectOutlined />} placeholder="Nhập mã số thuế doanh nghiệp" size="large" />
                    </Form.Item>

                    <Form.Item name="diaChi" label="Địa chỉ trụ sở chính" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ công ty!' }]}>
                        <Input prefix={<EnvironmentOutlined />} placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP" size="large" />
                    </Form.Item>

                    <Form.Item name="moTa" label="Mô tả ngắn về công ty (Không bắt buộc)">
                        <Input.TextArea rows={3} placeholder="Giới thiệu sơ lược về lĩnh vực hoạt động, văn hóa..." />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', marginTop: 12 }}>
                        Gửi hồ sơ đăng ký doanh nghiệp
                    </Button>
                </Form>
            </Card>
        </div>
    );
};

export default EmployerOnboarding;