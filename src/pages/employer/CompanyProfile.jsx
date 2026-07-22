import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, Card, message, Typography, Row, Col, Alert, Spin } from 'antd';
import { UploadOutlined, BuildOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CompanyProfile = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [fileList, setFileList] = useState([]);
    const [companyStatus, setCompanyStatus] = useState(null); // null: Chưa tạo, 0: Chờ duyệt, 1: Đã duyệt
    const [currentLogo, setCurrentLogo] = useState(null);

    // 1. TẢI DỮ LIỆU KHI VÀO TRANG
    useEffect(() => {
        fetchCompanyData();
    }, []);

    const fetchCompanyData = async () => {
        try {
            const response = await apiClient.get('/employer/company');
            if (response) {
                // Đổ dữ liệu vào Form
                form.setFieldsValue({
                    tenCongTy: response.tenCongTy,
                    maSoThue: response.maSoThue,
                    quyMo: response.quyMo,
                    diaChi: response.diaChi,
                    moTa: response.moTa,
                    mauEmailInterview: response.mauEmailInterview
                });
                setCompanyStatus(response.trangThai ? 1 : 0);
                setCurrentLogo(response.logo);
            }
        } catch (error) {
            message.error('Không thể tải thông tin doanh nghiệp!');
        } finally {
            setPageLoading(false);
        }
    };

    // 2. XỬ LÝ KHI BẤM NÚT LƯU (Dùng FormData để gửi cả chữ lẫn File)
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('TenCongTy', values.tenCongTy);
            formData.append('MaSoThue', values.maSoThue);
            formData.append('QuyMo', values.quyMo);
            formData.append('DiaChi', values.diaChi);
            formData.append('MoTa', values.moTa);
            formData.append('MauEmailInterview', values.mauEmailInterview || '');

            // Nếu có chọn ảnh mới thì nhét vào FormData
            if (fileList.length > 0) {
                formData.append('LogoFile', fileList[0].originFileObj);
            }

            const response = await apiClient.post('/employer/company', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.success) {
                message.success(response.message);
                setCompanyStatus(0); // Lập tức chuyển thành trạng thái Chờ duyệt
                setFileList([]); // Xóa file trong hàng đợi
                fetchCompanyData(); // Tải lại logo mới nhất
            }
        } catch (error) {
            // Hứng lỗi trùng Mã số thuế hoặc sai định dạng từ Backend
            const errorMsg = error.response?.data?.message || 'Lưu thông tin thất bại!';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // 3. XỬ LÝ NÚT CHỌN ẢNH (Chặn không cho upload tự động)
    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1)); // Chỉ giữ lại 1 file mới nhất
    };

    if (pageLoading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <BuildOutlined style={{ fontSize: '28px', color: '#1890ff', marginRight: 15 }} />
                <Title level={3} style={{ margin: 0 }}>Hồ sơ Doanh nghiệp</Title>
            </div>

            {/* HIỂN THỊ CẢNH BÁO TRẠNG THÁI */}
            {companyStatus === 0 && (
                <Alert 
                    message="Hồ sơ đang chờ kiểm duyệt" 
                    description="Thông tin công ty của bạn đang được Ban quản trị xem xét. Trong thời gian này, bạn không thể đăng tin tuyển dụng mới." 
                    type="warning" 
                    showIcon 
                    icon={<SyncOutlined spin />}
                    style={{ marginBottom: 20 }}
                />
            )}
            {companyStatus === 1 && (
                <Alert 
                    message="Hồ sơ đã được xác thực" 
                    description="Doanh nghiệp của bạn đã được duyệt. Lưu ý: Nếu bạn chỉnh sửa thông tin, hồ sơ sẽ phải chờ duyệt lại từ đầu." 
                    type="success" 
                    showIcon 
                    icon={<CheckCircleOutlined />}
                    style={{ marginBottom: 20 }}
                />
            )}

            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Row gutter={24}>
                        <Col span={16}>
                            <Form.Item label="Tên Công ty" name="tenCongTy" rules={[{ required: true, message: 'Vui lòng nhập tên công ty!' }]}>
                                <Input size="large" placeholder="VD: Công ty CP Công nghệ JobsNow" />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Mã số thuế" name="maSoThue" rules={[{ required: true, message: 'Vui lòng nhập mã số thuế!' }]}>
                                        <Input size="large" placeholder="VD: 0316486544" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Quy mô nhân sự" name="quyMo" rules={[{ required: true, message: 'Vui lòng nhập quy mô!' }]}>
                                        <Input size="large" placeholder="VD: 50 - 150 nhân viên" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Địa chỉ trụ sở" name="diaChi" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}>
                                <Input size="large" placeholder="Nhập địa chỉ đầy đủ của công ty" />
                            </Form.Item>

                            <Form.Item label="Giới thiệu về công ty" name="moTa">
                                <TextArea rows={6} placeholder="Mô tả môi trường làm việc, văn hóa, và lĩnh vực hoạt động..." />
                            </Form.Item>
                            <Form.Item 
                                label="Mẫu Email mời phỏng vấn tùy chỉnh" 
                                name="mauEmailInterview"
                                // Di chuyển toàn bộ hướng dẫn xuống làm ghi chú chân dưới ô nhập liệu
                                extra={
                                    <div style={{ marginTop: 8, fontSize: '13px', color: '#595959', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
                                        <strong>💡 Hướng dẫn trộn dữ liệu động:</strong> Sao chép chuẩn xác các từ khóa dưới đây vào vị trí mong muốn trong thư:
                                        <div style={{ marginTop: 6 }}>
                                            <span style={{ color: '#c41d7f', fontWeight: 'bold', marginRight: 15 }}>{`{TenUngVien}`}</span>
                                            <span style={{ color: '#c41d7f', fontWeight: 'bold', marginRight: 15 }}>{`{TenViTri}`}</span>
                                            <span style={{ color: '#c41d7f', fontWeight: 'bold', marginRight: 15 }}>{`{ThoiGian}`}</span>
                                            <span style={{ color: '#c41d7f', fontWeight: 'bold', marginRight: 15 }}>{`{DiaDiem}`}</span>
                                            <span style={{ color: '#c41d7f', fontWeight: 'bold', marginRight: 15 }}>{`{TenCongTy}`}</span>
                                            <span style={{ color: '#c41d7f', fontWeight: 'bold', marginRight: 15 }}>{`{LinkBaiTest}`}</span>
                                            <span style={{ color: '#c41d7f', fontWeight: 'bold', marginRight: 15 }}>{`{ChuKyEmail}`}</span>
                                        </div>
                                    </div>
                                }
                            >
                                {/* Placeholder lúc này chỉ cần ngắn gọn, sạch sẽ */}
                                <TextArea 
                                    rows={8} 
                                    placeholder="Ví dụ: Chào {TenUngVien}, công ty {TenCongTy} trân trọng mời bạn phỏng vấn vị trí {TenViTri} vào lúc {ThoiGian} tại {DiaDiem}..." 
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8} style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: 20, border: '1px dashed #d9d9d9', padding: '20px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                                <Text strong style={{ display: 'block', marginBottom: 15 }}>Logo Công ty</Text>
                                
                                {/* Hiển thị Logo hiện tại nếu có */}
                                {currentLogo && fileList.length === 0 ? (
                                    <img src={currentLogo} alt="Logo" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: 15, border: '1px solid #eee' }} />
                                ) : (
                                    <div style={{ width: '150px', height: '150px', margin: '0 auto 15px', backgroundColor: '#e6f7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BuildOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
                                    </div>
                                )}

                                <Upload 
                                    beforeUpload={() => false} // Chặn tự động gọi API upload
                                    onChange={handleUploadChange} 
                                    fileList={fileList}
                                    listType="picture"
                                    maxCount={1}
                                    accept="image/png, image/jpeg, image/jpg"
                                >
                                    <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                                </Upload>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 10 }}>Định dạng: JPG, PNG. (Tối ưu: 500x500px)</Text>
                            </div>
                        </Col>
                    </Row>

                    <div style={{ textAlign: 'right', marginTop: 20, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                        <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ width: '150px' }}>
                            Lưu hồ sơ
                        </Button>
                    </div>
                </Form>

            </Card>
        </div>
    );
};

export default CompanyProfile;