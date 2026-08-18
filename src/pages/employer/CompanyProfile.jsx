import React, { useState, useEffect } from 'react';
import { 
    Form, Input, Button, Upload, Card, message, Typography, 
    Row, Col, Alert, Spin, Image, Tag, Space, Avatar 
} from 'antd';
import { 
    UploadOutlined, BuildOutlined, CheckCircleOutlined, 
    SyncOutlined, WarningOutlined, FileImageOutlined, 
    FilePdfOutlined, MailOutlined, SafetyCertificateOutlined,
    EnvironmentOutlined, NumberOutlined, TeamOutlined, EditOutlined,
    InfoCircleOutlined, IdcardOutlined, BulbOutlined
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';
import '../css/CompanyProfile.css';

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
    
    const [logoPreview, setLogoPreview] = useState(null);
    const [companyStatus, setCompanyStatus] = useState(null);
    const [yeuCauBoSung, setYeuCauBoSung] = useState(null);
    const [hasPendingUpdate, setHasPendingUpdate] = useState(false);

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const getActualFile = (fileItem) => {
        if (!fileItem) return null;
        if (fileItem.originFileObj instanceof File) return fileItem.originFileObj;
        if (fileItem instanceof File) return fileItem;
        return null;
    };

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
                    mauEmailInterview: data.mauEmailInterview,
                    chuKyEmail: data.chuKyEmail
                });
                setCompanyStatus(data.trangThai ? 1 : 0);
                setCurrentLogo(data.logo);
                setCurrentFront(data.giayPhepKinhDoanhMatTruoc);
                setCurrentBack(data.giayPhepKinhDoanhMatSau);
                setYeuCauBoSung(data.yeuCauBoSung);
                setHasPendingUpdate(!!data.duLieuChoDuyetJson);
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
        return false;
    };

    const isPdfUrl = (url) => url && url.toLowerCase().endsWith('.pdf');

    const onFinish = async (values) => {
        const logoFile = getActualFile(logoFileList[0]);
        const frontFile = getActualFile(frontFileList[0]);
        const backFile = getActualFile(backFileList[0]);
        const hasLogo = currentLogo || logoFile;
        if (!hasLogo) {
            message.error("Vui lòng tải lên Logo của doanh nghiệp!");
            return;
        }
        const hasFrontGpkd = currentFront || frontFile;
        if (!hasFrontGpkd) {
            message.error("Vui lòng tải lên Giấy phép kinh doanh (Mặt trước / Bản chính)!");
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('TenCongTy', values.tenCongTy);
            formData.append('MaSoThue', values.maSoThue);
            formData.append('QuyMo', values.quyMo);
            formData.append('DiaChi', values.diaChi);
            formData.append('MoTa', values.moTa || '');
            formData.append('MauEmailInterview', values.mauEmailInterview || '');
            formData.append('ChuKyEmail', values.chuKyEmail || '');
            
            if (logoFile) formData.append('LogoFile', logoFile);
            if (frontFile) formData.append('GiayPhepKinhDoanhMatTruocFile', frontFile);
            if (backFile) formData.append('GiayPhepKinhDoanhMatSauFile', backFile);

            const response = await apiClient.post('/employer/company', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const resPayload = response?.data || response;
            if (resPayload.success) {
                message.success(resPayload.message || "Lưu thông tin hồ sơ thành công!");
                setLogoFileList([]);
                setFrontFileList([]);
                setBackFileList([]);
                setLogoPreview(null);
                fetchCompanyData();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lưu thông tin thất bại!');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" tip="Đang tải dữ liệu hồ sơ..." /></div>;

    const displayLogoUrl = logoPreview || currentLogo;

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            
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
                            src={displayLogoUrl} 
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
                        {companyStatus === 1 && !hasPendingUpdate && (
                            <Tag color="success" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                                <CheckCircleOutlined /> ĐÃ XÁC THỰC PHÁP LÝ
                            </Tag>
                        )}
                        {companyStatus === 1 && hasPendingUpdate && (
                            <Tag color="processing" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                                <SyncOutlined spin /> ĐANG CHỜ DUYỆT CẬP NHẬT
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

            {/* THÔNG BÁO TỪ ADMIN */}
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
                    message={<Text strong style={{ color: '#9a3412' }}>Hồ sơ đang trong quá trình thẩm định lần đầu</Text>}
                    description="Thông tin công ty và bản scan Giấy phép kinh doanh của bạn đã được gửi đến Ban quản trị. Quá trình xác minh thường mất từ 1 - 24 giờ làm việc." 
                    type="warning" 
                    showIcon 
                    icon={<SyncOutlined spin style={{ color: '#ea580c' }} />}
                    style={{ marginBottom: 24, borderRadius: 10, backgroundColor: '#fff7ed', border: '1px solid #ffedd5' }}
                />
            )}

            {companyStatus === 1 && hasPendingUpdate && (
                <Alert 
                    message={<Text strong style={{ color: '#1e40af' }}>Yêu cầu thay đổi thông tin đang chờ Admin thẩm định</Text>}
                    description="Các cập nhật về Logo, Mô tả hay Mẫu email đã có hiệu lực ngay. Yêu cầu thay đổi thông tin pháp lý (Tên/MST/GPKD) đang chờ duyệt. Trong thời gian này, tài khoản của bạn vẫn hoạt động và đăng tin tuyển dụng bình thường." 
                    type="info" 
                    showIcon 
                    icon={<InfoCircleOutlined style={{ color: '#2563eb' }} />}
                    style={{ marginBottom: 24, borderRadius: 10, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                />
            )}

            {/* FORM CHÍNH */}
            <Form layout="vertical" form={form} onFinish={onFinish}>
                
                {/* TẦNG 1: THÔNG TIN CÔNG TY & LOGO / PHÁP LÝ */}
                <Row gutter={[24, 24]} align="stretch" style={{ marginBottom: 24 }}>
                    
                    {/* CỘT TRÁI: THÔNG TIN CÔNG TY */}
                    <Col xs={24} lg={15} style={{ display: 'flex', flexDirection: 'column' }}>
                        <Card 
                            title={
                                <Space>
                                    <BuildOutlined style={{ color: '#1677ff' }} />
                                    <span>Thông tin chung Doanh nghiệp</span>
                                </Space>
                            }
                            style={{ 
                                borderRadius: 12, 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            styles={{
                                body: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1
                                }
                            }}
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
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập mã số thuế!' },
                                            { pattern: /^\d+$/, message: 'Mã số thuế chỉ được nhập chữ số!' }
                                        ]}
                                    >
                                        <Input size="large" placeholder="VD: 0101234567" prefix={<NumberOutlined style={{ color: '#cbd5e1' }} />} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        label="Quy mô nhân sự (Số lượng)" 
                                        name="quyMo" 
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập quy mô nhân sự!' },
                                            { 
                                                pattern: /^[\p{L}\p{N}\s]+$/u, 
                                                message: 'Quy mô nhân sự chỉ được nhập chữ và số, không chứa ký tự đặc biệt!' 
                                            }
                                        ]}
                                    >
                                        <Input size="large" placeholder="VD: 100 nhân sự hoặc Trên 500 người" prefix={<TeamOutlined style={{ color: '#cbd5e1' }} />} />
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

                            <Form.Item 
                                label="Giới thiệu về công ty" 
                                name="moTa"
                                rules={[{ required: true, message: 'Vui lòng nhập giới thiệu về công ty!' }]}
                                style={{ marginBottom: 16 }}
                            >
                                <TextArea 
                                    autoSize={{ minRows: 5, maxRows: 8 }}
                                    placeholder="Mô tả tầm nhìn, sứ mệnh, văn hóa doanh nghiệp..." 
                                    showCount 
                                    maxLength={1000} 
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>

                            <div style={{ 
                                marginTop: 'auto', 
                                padding: '12px 16px', 
                                backgroundColor: '#f8fafc', 
                                borderRadius: 8, 
                                border: '1px dashed #cbd5e1', 
                                fontSize: 12 
                            }}>
                                <Text strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                    <BulbOutlined style={{ color: '#eab308' }} /> Gợi ý giúp hồ sơ thương hiệu thu hút ứng viên hơn:
                                </Text>
                                <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', lineHeight: 1.6 }}>
                                    <li>Lĩnh vực hoạt động cốt lõi và sản phẩm/dịch vụ tiêu biểu.</li>
                                    <li>Tầm nhìn chiến lược, sứ mệnh và giá trị văn hóa doanh nghiệp.</li>
                                    <li>Môi trường làm việc, cơ hội thăng tiến và đãi ngộ nổi bật.</li>
                                </ul>
                            </div>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: LOGO & GIẤY PHÉP KINH DOANH */}
                    <Col xs={24} lg={9} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        
                        {/* LOGO DOANH NGHIỆP */}
                        <Card 
                            title={
                                <Space>
                                    <span>Logo Thương Hiệu</span>
                                    <Text type="danger">*</Text>
                                </Space>
                            } 
                            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'center' }}
                        >
                            <div style={{ padding: '4px 0' }}>
                                {displayLogoUrl && (
                                    <div style={{ marginBottom: 10 }}>
                                        <Image 
                                            src={displayLogoUrl} 
                                            style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', padding: 4 }} 
                                        />
                                    </div>
                                )}
                                <Upload 
                                    beforeUpload={(file) => validateFileBeforeUpload(file, true)} 
                                    onChange={({ fileList }) => {
                                        const singleList = fileList.slice(-1);
                                        setLogoFileList(singleList);
                                        const fileObj = getActualFile(singleList[0]);
                                        if (fileObj) {
                                            setLogoPreview(URL.createObjectURL(fileObj));
                                        } else {
                                            setLogoPreview(null);
                                        }
                                    }} 
                                    fileList={logoFileList} 
                                    maxCount={1} 
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />} size="middle">Tải Logo Mới</Button>
                                </Upload>
                                <div style={{ marginTop: 6 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Định dạng: JPG, PNG, WEBP (Tối đa 10MB)</Text>
                                </div>
                            </div>
                        </Card>

                        {/* GIẤY PHÉP KINH DOANH */}
                        <Card 
                            title={
                                <Space>
                                    <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                                    <span>Xác Minh Giấy Phép KD</span>
                                </Space>
                            } 
                            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: 1 }}
                        >
                            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                                Vui lòng tải lên bản chụp/scan Giấy phép kinh doanh chính thức (Ảnh chụp rõ nét hoặc file PDF).
                            </Paragraph>
                            <div style={{ marginBottom: 12, border: '1px dashed #0284c7', padding: '10px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f0f9ff' }}>
                                <Text strong style={{ display: 'block', marginBottom: 4, color: '#0369a1', fontSize: 13 }}>
                                    <FileImageOutlined /> Mặt Trước / Bản Chính <Text type="danger">*</Text>
                                </Text>
                                {currentFront && frontFileList.length === 0 && (
                                    <div style={{ marginBottom: 6 }}>
                                        {isPdfUrl(currentFront) ? (
                                            <Button type="primary" ghost icon={<FilePdfOutlined />} href={currentFront} target="_blank" size="small">
                                                Xem File GPKD (PDF)
                                            </Button>
                                        ) : (
                                            <Image src={currentFront} style={{ maxHeight: 75, objectFit: 'contain', borderRadius: 6, border: '1px solid #cbd5e1' }} />
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
                                    <Button icon={<UploadOutlined />} size="small">Tải tệp mặt trước</Button>
                                </Upload>
                            </div>
                            <div style={{ border: '1px dashed #0284c7', padding: '10px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f0f9ff' }}>
                                <Text strong style={{ display: 'block', marginBottom: 4, color: '#0369a1', fontSize: 13 }}>
                                    <FileImageOutlined /> Mặt Sau (Tùy chọn)
                                </Text>
                                {currentBack && backFileList.length === 0 && (
                                    <div style={{ marginBottom: 6 }}>
                                        {isPdfUrl(currentBack) ? (
                                            <Button type="primary" ghost icon={<FilePdfOutlined />} href={currentBack} target="_blank" size="small">
                                                Xem File Mặt Sau (PDF)
                                            </Button>
                                        ) : (
                                            <Image src={currentBack} style={{ maxHeight: 75, objectFit: 'contain', borderRadius: 6, border: '1px solid #cbd5e1' }} />
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
                                    <Button icon={<UploadOutlined />} size="small">Tải tệp mặt sau</Button>
                                </Upload>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* TẦNG 2: MẪU MAIL & CHỮ KÝ CHIẾM FULL CHIỀU NGANG */}
                <Card 
                    title={
                        <Space>
                            <MailOutlined style={{ color: '#1677ff' }} />
                            <span>Giao tiếp HR Automation (Mẫu Mail & Chữ ký)</span>
                        </Space>
                    }
                    style={{ 
                        borderRadius: 12, 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: 24
                    }}
                >
                    <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                        Thiết lập mẫu email phỏng vấn và chữ ký thương hiệu. Hệ thống sẽ tự động ghép thông tin khi bạn duyệt ứng viên.
                    </Paragraph>
                    <div style={{ marginBottom: 20, padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: 8, fontSize: 12 }}>
                        <Text strong style={{ color: '#475569', display: 'block', marginBottom: 6 }}>Từ khóa hệ thống hỗ trợ:</Text>
                        <Space wrap size={[6, 6]}>
                            <Tag color="blue">{`{TenUngVien}`}</Tag>
                            <Tag color="blue">{`{TenViTri}`}</Tag>
                            <Tag color="blue">{`{TenCongTy}`}</Tag>
                            <Tag color="blue">{`{ThoiGian}`}</Tag>
                            <Tag color="blue">{`{DiaDiem}`}</Tag>
                            <Tag color="green">{`{LinkBaiTest}`}</Tag>
                        </Space>
                    </div>

                    {/* HÀNG CÂN BẰNG TỰ ĐỘNG GIỮA 2 CỘT */}
                    <Row gutter={[20, 20]} align="stretch">
                        <Col xs={24} lg={14} className="email-form-col">
                            <Form.Item 
                                label={
                                    <Space>
                                        <MailOutlined style={{ color: '#1677ff' }} />
                                        <span>Mẫu Thư Mời Phỏng Vấn (Nội dung chính)</span>
                                    </Space>
                                }
                                name="mauEmailInterview" 
                                className="email-form-item"
                            >
                                <TextArea 
                                    placeholder={`Chào {TenUngVien},\n\nCông ty {TenCongTy} trân trọng mời bạn tham gia phỏng vấn vị trí {TenViTri}.\n• Thời gian: {ThoiGian}\n• Địa điểm: {DiaDiem}\n\n{LinkBaiTest}`} 
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} lg={10} className="email-form-col">
                            <Form.Item 
                                label={
                                    <Space>
                                        <IdcardOutlined style={{ color: '#1677ff' }} />
                                        <span>Chữ ký Email Doanh nghiệp (Cuối thư)</span>
                                    </Space>
                                }
                                name="chuKyEmail" 
                                className="email-form-item"
                            >
                                <TextArea 
                                    placeholder={`Trân trọng,\nPhòng Tuyển dụng - Công ty JobsNow\nHotline: 090x xxx xxx | Website: jobsnow.vn\nĐịa chỉ: Tòa nhà ABC, Q.1, TP.HCM`} 
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* BOTTOM ACTION BAR */}
                <div 
                    style={{ 
                        padding: '20px 24px', 
                        backgroundColor: '#ffffff', 
                        borderRadius: 12, 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
                        * Thông tin phụ (Logo, Mô tả, Quy mô, Chữ ký Email) sẽ được cập nhật ngay. Thay đổi Tên/MST/GPKD sẽ gửi thẩm định lại.
                    </Text>
                </div>
            </Form>
        </div>
    );
};

export default CompanyProfile;