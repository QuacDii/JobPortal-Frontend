import React, { useState, useEffect } from 'react';
import { 
    Form, Input, Button, Upload, Card, message, Typography, 
    Row, Col, Alert, Spin, Image, Tag, Space, Divider, Tooltip, Avatar 
} from 'antd';
import { 
    UploadOutlined, BuildOutlined, CheckCircleOutlined, 
    SyncOutlined, WarningOutlined, FileImageOutlined, 
    FilePdfOutlined, MailOutlined, SafetyCertificateOutlined,
    EnvironmentOutlined, NumberOutlined, TeamOutlined, EditOutlined
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CompanyProfile = ({ onStatusChange }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    
    const [logoFileList, setLogoFileList] = useState([]);
    const [frontFileList, setFrontFileList] = useState([]);
    const [backFileList, setBackFileList] = useState([]);

    const [currentLogo, setCurrentLogo] = useState(null);
    const [currentFront, setCurrentFront] = useState(null);
    const [currentBack, setCurrentBack] = useState(null);
    
    const [companyStatus, setCompanyStatus] = useState(null);
    const [yeuCauBoSung, setYeuCauBoSung] = useState(null);

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const fetchCompanyData = async () => {
        try {
            const response = await apiClient.get('/employer/company');
            const data = response?.data || response;
            if (data && data.tenCongTy) {
                form.setFieldsValue({
                    tenCongTy: data.tenCongTy,
                    maSoThue: data.maSoThue,
                    quyMo: data.quyMo,
                    diaChi: data.diaChi,
                    moTa: data.moTa,
                    mauEmailInterview: data.mauEmailInterview
                });
                setCompanyStatus(data.trangThai ? 1 : 0);
                setCurrentLogo(data.logo);
                setCurrentFront(data.giayPhepKinhDoanhMatTruoc);
                setCurrentBack(data.giayPhepKinhDoanhMatSau);
                setYeuCauBoSung(data.yeuCauBoSung);
                if (onStatusChange) onStatusChange(data.trangThai ? "APPROVED" : "PENDING");
            } else {
                if (onStatusChange) onStatusChange("NO_COMPANY");
            }
        } catch (error) {
            message.error('Không thể tải thông tin doanh nghiệp!');
        } finally {
            setPageLoading(false);
        }
    };

    // Hàm Validate File Client trước khi đưa vào Form State
    const validateFileBeforeUpload = (file, isImageOnly = false) => {
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('Dung lượng tệp không được vượt quá 10MB!');
            return Upload.LIST_IGNORE;
        }

        const allowedFormats = isImageOnly 
            ? ['image/jpeg', 'image/png', 'image/webp']
            : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

        const isValidFormat = allowedFormats.includes(file.type);
        if (!isValidFormat) {
            message.error(isImageOnly ? 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)!' : 'Chỉ chấp nhận file Ảnh hoặc PDF!');
            return Upload.LIST_IGNORE;
        }

        return false; // Ngăn Antd tự động HTTP Request
    };

    const isPdfUrl = (url) => url && url.toLowerCase().endsWith('.pdf');

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('TenCongTy', values.tenCongTy);
            formData.append('MaSoThue', values.maSoThue);
            formData.append('QuyMo', values.quyMo);
            formData.append('DiaChi', values.diaChi);
            formData.append('MoTa', values.moTa || '');
            formData.append('MauEmailInterview', values.mauEmailInterview || '');

            if (logoFileList.length > 0) formData.append('LogoFile', logoFileList[0].originFileObj);
            if (frontFileList.length > 0) formData.append('GiayPhepKinhDoanhMatTruocFile', frontFileList[0].originFileObj);
            if (backFileList.length > 0) formData.append('GiayPhepKinhDoanhMatSauFile', backFileList[0].originFileObj);

            const response = await apiClient.post('/employer/company', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const resPayload = response?.data || response;
            if (resPayload.success) {
                message.success("Lưu hồ sơ thành công, đã gửi chờ Admin kiểm duyệt!");
                setCompanyStatus(0);
                setYeuCauBoSung(null);
                setLogoFileList([]);
                setFrontFileList([]);
                setBackFileList([]);
                fetchCompanyData();
                if (onStatusChange) onStatusChange("PENDING");
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lưu thông tin thất bại!');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" tip="Đang tải dữ liệu hồ sơ..." /></div>;

    return (
        <div style={{ padding: '24px', maxWidth: '1180px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            
            {/* HEADER HERO BANNER */}
            <Card 
                style={{ 
                    marginBottom: 24, 
                    borderRadius: 12, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                    border: '1px solid #e2e8f0'
                }}
                bodyStyle={{ padding: '20px 24px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <Space size={16} align="center">
                        <Avatar 
                            size={64} 
                            src={currentLogo} 
                            icon={<BuildOutlined />} 
                            style={{ backgroundColor: '#1677ff', boxShadow: '0 2px 8px rgba(22,119,255,0.2)' }}
                        />
                        <div>
                            <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                                {form.getFieldValue('tenCongTy') || 'Hồ sơ Doanh nghiệp'}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Quản lý thông tin công ty và hồ sơ pháp lý xác minh
                            </Text>
                        </div>
                    </Space>

                    <div>
                        {companyStatus === 1 && (
                            <Tag color="success" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                                <CheckCircleOutlined /> ĐÃ XÁC THỰC PHÁP LÝ
                            </Tag>
                        )}
                        {companyStatus === 0 && !yeuCauBoSung && (
                            <Tag color="warning" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                                <SyncOutlined spin /> ĐANG THẨM ĐỊNH HỒ SƠ
                            </Tag>
                        )}
                        {yeuCauBoSung && (
                            <Tag color="error" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                                <WarningOutlined /> CẦN BỔ SUNG THÔNG TIN
                            </Tag>
                        )}
                    </div>
                </div>
            </Card>

            {/* CÁC THÔNG BÁO TỪ BAN QUẢN TRỊ */}
            {yeuCauBoSung && (
                <Alert
                    message={<Text strong style={{ color: '#991b1b', fontSize: 15 }}>YÊU CẦU BỔ SUNG / CHỈNH SỬA TỪ ADMIN</Text>}
                    description={
                        <div style={{ marginTop: 6, fontSize: 14, color: '#334155' }}>
                            <Paragraph style={{ marginBottom: 4 }}>
                                <strong>Nội dung phản hồi: </strong>
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{yeuCauBoSung}</span>
                            </Paragraph>
                            <Text type="secondary" italic>
                                * Vui lòng điều chỉnh thông tin theo yêu cầu trên và bấm "Lưu & Nộp lại hồ sơ".
                            </Text>
                        </div>
                    }
                    type="error"
                    showIcon
                    icon={<WarningOutlined style={{ fontSize: 20 }} />}
                    style={{ marginBottom: 24, borderRadius: 10, border: '1px solid #fca5a5', backgroundColor: '#fef2f2' }}
                />
            )}

            {companyStatus === 0 && !yeuCauBoSung && (
                <Alert 
                    message={<Text strong style={{ color: '#9a3412' }}>Hồ sơ đang trong quá trình duyệt</Text>}
                    description="Thông tin công ty và bản scan Giấy phép kinh doanh của bạn đã được gửi đến Ban quản trị. Quá trình xác minh thường mất từ 1 - 24 giờ làm việc." 
                    type="warning" 
                    showIcon 
                    icon={<SyncOutlined spin style={{ color: '#ea580c' }} />}
                    style={{ marginBottom: 24, borderRadius: 10, backgroundColor: '#fff7ed', border: '1px solid #ffedd5' }}
                />
            )}

            {/* FORM CHÍNH */}
            <Form layout="vertical" form={form} onFinish={onFinish}>
                <Row gutter={[24, 24]} align="stretch">
    
                    {/* CỘT TRÁI: THÔNG TIN CHUNG & EMAIL */}
                    <Col xs={24} lg={15} style={{ display: 'flex', flexDirection: 'column' }}>
                        
                        {/* CARD 1: THÔNG TIN CÔNG TY */}
                        <Card 
                            title={
                                <Space>
                                    <BuildOutlined style={{ color: '#1677ff' }} />
                                    <span>Thông tin chung Doanh nghiệp</span>
                                </Space>
                            }
                            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}
                        >
                            <Form.Item 
                                label="Tên Công ty chính thức" 
                                name="tenCongTy" 
                                rules={[{ required: true, message: 'Vui lòng nhập tên công ty!' }]}
                            >
                                <Input size="large" placeholder="VD: Công ty TNHH Công Nghệ JobsNow" prefix={<BuildOutlined style={{ color: '#cbd5e1' }} />} />
                            </Form.Item>
                            
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item 
                                        label="Mã số thuế" 
                                        name="maSoThue" 
                                        rules={[{ required: true, message: 'Vui lòng nhập mã số thuế!' }]}
                                    >
                                        <Input size="large" placeholder="VD: 0101234567" prefix={<NumberOutlined style={{ color: '#cbd5e1' }} />} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        label="Quy mô nhân sự" 
                                        name="quyMo" 
                                        rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập quy mô!' }]}
                                    >
                                        <Input size="large" placeholder="VD: 100 - 500 nhân sự" prefix={<TeamOutlined style={{ color: '#cbd5e1' }} />} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item 
                                label="Địa chỉ trụ sở chính" 
                                name="diaChi" 
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ công ty!' }]}
                            >
                                <Input size="large" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" prefix={<EnvironmentOutlined style={{ color: '#cbd5e1' }} />} />
                            </Form.Item>

                            <Form.Item label="Giới thiệu về công ty" name="moTa">
                                <TextArea rows={3} placeholder="Mô tả tầm nhìn, sứ mệnh, văn hóa doanh nghiệp..." showCount maxLength={1000} />
                            </Form.Item>
                        </Card>

                        {/* CARD 2: CẤU HÌNH MẪU EMAIL (ÉP BẰNG CHÂN VỚI CỘT PHẢI) */}
                        <Card 
                            title={
                                <Space>
                                    <MailOutlined style={{ color: '#1677ff' }} />
                                    <span>Mẫu Email Mời Phỏng Vấn (Tự động)</span>
                                </Space>
                            }
                            style={{ 
                                borderRadius: 12, 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                width: '100%'
                            }}
                            styles={{ 
                                body: { 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    flex: 1,
                                    width: '100%'
                                } 
                            }}
                        >
                            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                                Thiết lập mẫu email sẵn có. Hệ thống sẽ tự động điền các từ khóa thông tin khi bạn duyệt ứng viên sang bước Phỏng vấn.
                            </Paragraph>

                            <div style={{ marginBottom: 12, padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: 8, fontSize: 12, width: '100%' }}>
                                <Text strong style={{ color: '#475569', display: 'block', marginBottom: 4 }}>Từ khóa hệ thống hỗ trợ:</Text>
                                <Space wrap size={[6, 6]}>
                                    <Tag color="blue">{`{TenUngVien}`}</Tag>
                                    <Tag color="blue">{`{TenViTri}`}</Tag>
                                    <Tag color="blue">{`{TenCongTy}`}</Tag>
                                    <Tag color="blue">{`{ThoiGian}`}</Tag>
                                    <Tag color="blue">{`{DiaDiem}`}</Tag>
                                    <Tag color="green">{`{LinkBaiTest}`}</Tag>
                                    <Tag color="purple">{`{ChuKyEmail}`}</Tag>
                                </Space>
                            </div>

                            {/* FORM ITEM KHÔNG BỊ BÓP CHIỀU NGANG */}
                            <Form.Item 
                                name="mauEmailInterview" 
                                style={{ 
                                    marginBottom: 0, 
                                    flex: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    width: '100%'
                                }}
                                className="full-height-form-item"
                            >
                                <TextArea 
                                    style={{ 
                                        flex: 1, 
                                        minHeight: '180px', 
                                        height: '100%', 
                                        width: '100%',
                                        resize: 'none' 
                                    }} 
                                    placeholder={`Chào {TenUngVien},\n\nCông ty {TenCongTy} trân trọng mời bạn tham gia phỏng vấn vị trí {TenViTri}.\n• Thời gian: {ThoiGian}\n• Địa điểm: {DiaDiem}\n\n{LinkBaiTest}\n\nTrân trọng,\n{ChuKyEmail}`} 
                                />
                            </Form.Item>

                            {/* BỔ SUNG WIDTH 100% CHO TẤT CẢ CONTAINER ANTD BÊN TRONG */}
                            <style>{`
                                .full-height-form-item,
                                .full-height-form-item .ant-form-item-row,
                                .full-height-form-item .ant-form-item-control,
                                .full-height-form-item .ant-form-item-control-input,
                                .full-height-form-item .ant-form-item-control-input-content {
                                    height: 100% !important;
                                    width: 100% !important;
                                    display: flex !important;
                                    flex-direction: column !important;
                                    flex: 1 !important;
                                }
                                .full-height-form-item textarea {
                                    width: 100% !important;
                                }
                            `}</style>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: LOGO & TÀI LIỆU PHÁP LÝ */}
                    <Col xs={24} lg={9}>
                        
                        {/* CARD 3: LOGO DOANH NGHIỆP */}
                        <Card 
                            title="Logo Thương Hiệu" 
                            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24, textAlign: 'center' }}
                        >
                            <div style={{ padding: '12px 0' }}>
                                {currentLogo && logoFileList.length === 0 ? (
                                    <div style={{ marginBottom: 16 }}>
                                        <Image 
                                            src={currentLogo} 
                                            style={{ width: 110, height: 110, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', padding: 4 }} 
                                        />
                                    </div>
                                ) : null}

                                <Upload 
                                    beforeUpload={(file) => validateFileBeforeUpload(file, true)} 
                                    onChange={({ fileList }) => setLogoFileList(fileList.slice(-1))} 
                                    fileList={logoFileList} 
                                    maxCount={1} 
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />}>Tải Logo Mới</Button>
                                </Upload>
                                <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Định dạng: JPG, PNG, WEBP (Tối đa 10MB)</Text>
                                </div>
                            </div>
                        </Card>

                        {/* CARD 4: GIẤY PHÉP KINH DOANH */}
                        <Card 
                            title={
                                <Space>
                                    <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                                    <span>Xác Minh Giấy Phép KD</span>
                                </Space>
                            }
                            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                                Vui lòng tải lên bản chụp/scan Giấy phép kinh doanh chính thức (Ảnh chụp rõ nét hoặc file PDF).
                            </Paragraph>

                            {/* UPLOAD GPKD MẶT TRƯỚC */}
                            <div style={{ marginBottom: 20, border: '1px dashed #0284c7', padding: '16px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f0f9ff' }}>
                                <Text strong style={{ display: 'block', marginBottom: 8, color: '#0369a1' }}>
                                    <FileImageOutlined /> Mặt Trước / Bản Chính (PDF/Ảnh)
                                </Text>

                                {currentFront && frontFileList.length === 0 && (
                                    <div style={{ marginBottom: 12 }}>
                                        {isPdfUrl(currentFront) ? (
                                            <Button type="primary" ghost icon={<FilePdfOutlined />} href={currentFront} target="_blank" size="small">
                                                Xem File GPKD (PDF)
                                            </Button>
                                        ) : (
                                            <Image src={currentFront} style={{ maxHeight: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                                        )}
                                    </div>
                                )}

                                <Upload 
                                    beforeUpload={(file) => validateFileBeforeUpload(file, false)} 
                                    onChange={({ fileList }) => setFrontFileList(fileList.slice(-1))} 
                                    fileList={frontFileList} 
                                    maxCount={1} 
                                    accept="image/*,.pdf"
                                >
                                    <Button icon={<UploadOutlined />}>Tải tệp mặt trước</Button>
                                </Upload>
                            </div>

                            {/* UPLOAD GPKD MẶT SAU */}
                            <div style={{ border: '1px dashed #0284c7', padding: '16px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f0f9ff' }}>
                                <Text strong style={{ display: 'block', marginBottom: 8, color: '#0369a1' }}>
                                    <FileImageOutlined /> Mặt Sau (Tùy chọn)
                                </Text>

                                {currentBack && backFileList.length === 0 && (
                                    <div style={{ marginBottom: 12 }}>
                                        {isPdfUrl(currentBack) ? (
                                            <Button type="primary" ghost icon={<FilePdfOutlined />} href={currentBack} target="_blank" size="small">
                                                Xem File Mặt Sau (PDF)
                                            </Button>
                                        ) : (
                                            <Image src={currentBack} style={{ maxHeight: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                                        )}
                                    </div>
                                )}

                                <Upload 
                                    beforeUpload={(file) => validateFileBeforeUpload(file, false)} 
                                    onChange={({ fileList }) => setBackFileList(fileList.slice(-1))} 
                                    fileList={backFileList} 
                                    maxCount={1} 
                                    accept="image/*,.pdf"
                                >
                                    <Button icon={<UploadOutlined />}>Tải tệp mặt sau</Button>
                                </Upload>
                            </div>
                        </Card>

                    </Col>
                </Row>

                {/* BOTTOM ACTION BAR */}
                <div 
                    style={{ 
                        marginTop: 24, 
                        padding: '20px 24px', 
                        backgroundColor: '#ffffff', 
                        borderRadius: 12, 
                        boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}
                >
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        size="large" 
                        loading={loading} 
                        icon={<EditOutlined />}
                        style={{ 
                            minWidth: 260,
                            height: 46,
                            fontSize: 15,
                            fontWeight: 600,
                            borderRadius: 8,
                            boxShadow: '0 4px 14px rgba(22,119,255,0.3)'
                        }}
                    >
                        Lưu & Nộp lại hồ sơ
                    </Button>

                    <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic', color: '#64748b' }}>
                        * Hệ thống sẽ lưu thông tin và gửi yêu cầu xác minh lại tới Ban quản trị.
                    </Text>
                </div>
            </Form>
        </div>
    );
};

export default CompanyProfile;