import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, Typography, Row, Col, Divider, message, InputNumber, Cascader } from 'antd';
import { PlusOutlined, DeleteOutlined, SendOutlined, RocketOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PostJob = () => {
    const [form] = Form.useForm(); 
    const [loading, setLoading] = useState(false);

    const [standardSkills, setStandardSkills] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [locations, setLocations] = useState([]);

    // 1. TẢI DỮ LIỆU ĐỘC LẬP - TRÁNH LỖI DÂY CHUYỀN
    useEffect(() => {
        const fetchMasterData = async () => {
            // Khối 1: Tải Kỹ năng (Bọc catch độc lập để nếu lỗi 500 thì các mục khác vẫn chạy)
            try {
                const resSkills = await apiClient.get('/recruitment/skills').catch(err => {
                    console.error("Lỗi tải Kỹ năng:", err);
                    return []; // Trả về mảng rỗng phòng hờ
                });
                
                // Chuẩn hóa dữ liệu Kỹ năng sang { label, value } chuẩn Ant Design
                const mappedSkills = Array.isArray(resSkills)
                    ? resSkills.map(item => ({
                        label: item.tenKyNang || item.label,
                        value: item.maKyNang || item.value
                    }))
                    : [];
                setStandardSkills(mappedSkills);
            } catch (error) {
                console.error("Lỗi xử lý Kỹ năng:", error);
            }

            // Khối 2: Tải Ngành nghề
            try {
                const resInd = await apiClient.get('/recruitment/industries').catch(err => {
                    console.error("Lỗi tải Ngành nghề:", err);
                    return [];
                });
                
                // Chuẩn hóa dữ liệu Ngành nghề sang { label, value }
                const mappedIndustries = Array.isArray(resInd)
                    ? resInd.map(item => ({
                        label: item.tenNganh || item.label,
                        value: item.maNganh || item.value
                    }))
                    : [];
                setIndustries(mappedIndustries);
            } catch (error) {
                console.error("Lỗi xử lý Ngành nghề:", error);
            }

            // Khối 3: Tải Khu vực (Hỗ trợ cấu trúc phân cấp cho Cascader)
            try {
                const resLoc = await apiClient.get('/recruitment/locations').catch(err => {
                    console.error("Lỗi tải Khu vực:", err);
                    return [];
                });
                
                // Chuẩn hóa dữ liệu Tỉnh/Thành -> Quận/Huyện cho Cascader
                const mappedLocations = Array.isArray(resLoc)
                    ? resLoc.map(tp => ({
                        label: tp.tenTP || tp.tenTp || tp.label,
                        value: tp.maTP || tp.maTp || tp.value,
                        children: (tp.phuongXas || tp.phuongXasNavigation || tp.children || []).map(px => ({
                            label: px.tenPhuong || px.label,
                            value: px.maPhuong || px.value
                        }))
                    }))
                    : [];
                setLocations(mappedLocations);
            } catch (error) {
                console.error("Lỗi xử lý Khu vực:", error);
            }
        };
        
        fetchMasterData();
    }, []);

    // 2. XỬ LÝ SUBMIT GỬI DỮ LIỆU XUỐNG API MASTER-DETAIL
    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Định dạng lại payload để khớp chính xác với DTO ở Backend
            const payload = {
                tieuDeChienDich: values.tieuDeChienDich,
                ngayHetHan: values.ngayHetHan.format('YYYY-MM-DD'),
                danhSachViTri: values.danhSachViTri.map(pos => ({
                    tenViTri: pos.tenViTri,
                    soLuongTuyen: pos.soLuongTuyen || 1,
                    luong: pos.luong,
                    moTaCongViec: pos.moTaCongViec,
                    yeuCauUngVien: pos.yeuCauUngVien,
                    quyenLoi: pos.quyenLoi,
                    maNganh: pos.maNganh, 
                    maPhuong: Array.isArray(pos.maPhuong) ? pos.maPhuong[pos.maPhuong.length - 1] : pos.maPhuong,
                    danhSachKyNang: pos.danhSachKyNang || [],
                    nganhNgheKhac: pos.nganhNgheKhac || null
                }))
            };

            const response = await apiClient.post('/recruitment/post-job', payload);
            
            if (response.success || response.data?.success) {
                message.success(response.message || 'Đăng tin thành công!');
                form.resetFields(); // Xóa trắng form sau khi thành công
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đăng tin!';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <RocketOutlined style={{ fontSize: '28px', color: '#1890ff', marginRight: 15 }} />
                <Title level={3} style={{ margin: 0 }}>Tạo Chiến dịch Tuyển dụng mới</Title>
            </div>

            <Form 
                layout="vertical" 
                form={form} 
                onFinish={onFinish}
                initialValues={{ danhSachViTri: [{}] }} 
            >
                {/* --- PHẦN MASTER: THÔNG TIN CHIẾN DỊCH --- */}
                <Card title="Thông tin chung" style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Row gutter={24}>
                        <Col span={16}>
                            <Form.Item 
                                label="Tiêu đề chiến dịch" 
                                name="tieuDeChienDich" 
                                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề chiến dịch!' }]}
                            >
                                <Input size="large" placeholder="VD: Tuyển dụng lập trình viên Quý 3/2026" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                label="Ngày hết hạn nhận CV" 
                                name="ngayHetHan" 
                                rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn!' }]}
                            >
                                <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* --- PHẦN DETAIL: DANH SÁCH VỊ TRÍ CÔNG VIỆC (DYNAMIC FORM) --- */}
                <Form.List name="danhSachViTri">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <Card 
                                    key={key} 
                                    title={<Text strong style={{ color: '#1890ff' }}>Vị trí #{index + 1}</Text>} 
                                    extra={
                                        fields.length > 1 ? (
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)}>
                                                Xóa vị trí này
                                            </Button>
                                        ) : null
                                    }
                                    style={{ marginBottom: 24, border: '1px solid #91d5ff', borderRadius: 8 }}
                                >
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item {...restField} label="Tên vị trí (Chức danh)" name={[name, 'tenViTri']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                                <Input placeholder="VD: Frontend Developer (ReactJS)" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item {...restField} label="Mức lương" name={[name, 'luong']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                                <Input placeholder="VD: 15 - 20 Triệu" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item {...restField} label="Số lượng tuyển" name={[name, 'soLuongTuyen']}>
                                                <InputNumber min={1} style={{ width: '100%' }} placeholder="VD: 2" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item {...restField} label="Ngành nghề" name={[name, 'maNganh']} rules={[{ required: true, message: 'Bắt buộc chọn!' }]}>
                                                <Select 
                                                    options={industries} 
                                                    showSearch 
                                                    placeholder="Chọn ngành nghề (VD: IT - Phần mềm)" 
                                                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                                />
                                            </Form.Item>
                                            
                                            {/* Tự động hiển thị ô nhập khi chọn ngành nghề "Khác" */}
                                            <Form.Item 
                                                noStyle 
                                                shouldUpdate={(prevValues, currentValues) => 
                                                    prevValues.danhSachViTri?.[name]?.maNganh !== currentValues.danhSachViTri?.[name]?.maNganh
                                                }
                                            >
                                                {({ getFieldValue }) => {
                                                    const selectedId = getFieldValue(['danhSachViTri', name, 'maNganh']);

                                                    if (!selectedId) return null;
                                                    
                                                    // Kiểm tra xem ngành được chọn có nhãn là "Khác" hay không
                                                    const isKhac = industries.find(item => item.value === selectedId && item.label === 'Khác');

                                                    return isKhac ? (
                                                        <Form.Item
                                                            {...restField}
                                                            label={<span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Tên ngành nghề cụ thể của bạn</span>}
                                                            name={[name, 'nganhNgheKhac']}
                                                            rules={[{ required: true, message: 'Vui lòng điền tên ngành nghề khác!' }]}
                                                            style={{ marginTop: 10 }}
                                                        >
                                                            <Input placeholder="VD: Kỹ sư Trí tuệ nhân tạo (AI Engineer)..." />
                                                        </Form.Item>
                                                    ) : null;
                                                }}
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item {...restField} label="Khu vực làm việc" name={[name, 'maPhuong']} rules={[{ required: true, message: 'Bắt buộc chọn!' }]}>
                                                <Cascader 
                                                    options={locations} 
                                                    showSearch 
                                                    placeholder="Chọn Tỉnh/Thành phố -> Quận/Huyện" 
                                                    filter={(inputValue, path) =>
                                                        path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Khối nhập Kỹ năng */}
                                    <Form.Item 
                                        {...restField} 
                                        label="Kỹ năng yêu cầu (Nhập hoặc dán danh sách ngăn cách bởi dấu phẩy)" 
                                        name={[name, 'danhSachKyNang']}
                                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 kỹ năng!' }]}
                                    >
                                        <Select
                                            mode="tags"
                                            style={{ width: '100%' }}
                                            placeholder="VD: C#, ReactJS, SQL Server..."
                                            options={standardSkills}
                                            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                            tokenSeparators={[',']}
                                        />
                                    </Form.Item>

                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item {...restField} label="Mô tả công việc" name={[name, 'moTaCongViec']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                                <TextArea rows={4} placeholder="- Phát triển tính năng mới...&#10;- Bảo trì hệ thống..." />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item {...restField} label="Yêu cầu ứng viên" name={[name, 'yeuCauUngVien']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                                <TextArea rows={4} placeholder="- Tối thiểu 1 năm kinh nghiệm...&#10;- Tốt nghiệp chuyên ngành CNTT..." />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item {...restField} label="Quyền lợi được hưởng" name={[name, 'quyenLoi']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                        <TextArea rows={2} placeholder="BHXH đầy đủ, Lương tháng 13, Du lịch hằng năm..." />
                                    </Form.Item>
                                </Card>
                            ))}

                            {/* Nút thêm vị trí mới */}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 50, borderColor: '#1890ff', color: '#1890ff', fontSize: 16 }}>
                                    Thêm vị trí công việc
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Divider />

                <div style={{ textAlign: 'right', marginTop: 20 }}>
                    <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} loading={loading} style={{ height: 50, fontSize: 16, width: 250 }}>
                        Gửi duyệt chiến dịch
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default PostJob;