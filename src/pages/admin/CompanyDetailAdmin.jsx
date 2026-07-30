import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, Descriptions, Tag, Button, Image, Typography, Modal, 
    Input, message, Spin, Row, Col, Divider, Space, Popconfirm, Tabs, Tooltip, Alert, Badge 
} from 'antd';
import { 
    ArrowLeftOutlined, CheckOutlined, CloseOutlined, FormOutlined, 
    ApartmentOutlined, FileTextOutlined, FilePdfOutlined,
    BulbOutlined, MailOutlined, PictureOutlined, CopyOutlined, ExportOutlined,
    SyncOutlined, ArrowRightOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CompanyDetailAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('front_new');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestNote, setRequestNote] = useState('');

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiClient.get(`/AdminApproval/company-detail/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res?.data || res;
            setCompany(data);
            
            // Nếu là yêu cầu cập nhật, mặc định chọn tab GPKD Mới
            if (data?.loaiYeuCau === "UPDATE") {
                setActiveTab('front_new');
            } else {
                setActiveTab('front');
            }
        } catch (error) {
            message.error("Lỗi khi tải chi tiết hồ sơ công ty!");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType, yeuCauText = '') => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await apiClient.put(`/AdminApproval/review-company/${id}`, {
                actionType,
                yeuCauBoSung: yeuCauText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (actionType === "APPROVE") message.success("Đã phê duyệt yêu cầu & gửi email thông báo!");
            if (actionType === "REJECT") message.success("Đã xử lý từ chối!");
            if (actionType === "REQUEST_ADDITION") message.info("Đã gửi yêu cầu bổ sung tới nhà tuyển dụng!");
            
            navigate('/admin/approve-companies');
        } catch (error) {
            message.error("Xử lý thất bại!");
        } finally {
            setSubmitting(false);
            setIsModalOpen(false);
        }
    };

    const handleCopy = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        message.success(`Đã sao chép ${label}!`);
    };

    const quickReasonTemplates = [
        "Mã số thuế khai báo không trùng khớp với Mã số doanh nghiệp trên Giấy phép kinh doanh đính kèm.",
        "Ảnh chụp/scan Giấy phép kinh doanh bị mờ, lóa sáng hoặc mất góc. Vui lòng tải bản scan rõ nét hơn.",
        "Tên công ty khai báo chưa chính xác so với Giấy đăng ký kinh doanh chính thức.",
        "Giấy phép kinh doanh mới hết hạn hoặc không hợp lệ. Vui lòng cung cấp bản ghi mới nhất."
    ];

    const isPdfUrl = (url) => url && url.toLowerCase().endsWith('.pdf');

    const renderDocumentViewer = (url, title) => {
        if (!url) {
            return (
                <div style={{ height: 'calc(100vh - 210px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                    <FileTextOutlined style={{ fontSize: 40, color: '#94a3b8', marginBottom: 12 }} />
                    <Text type="secondary">Không có tệp {title}</Text>
                </div>
            );
        }

        if (isPdfUrl(url)) {
            return (
                <div style={{ height: 'calc(100vh - 210px)', display: 'flex', flexDirection: 'column', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '6px 12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <Text style={{ fontSize: 12 }} type="secondary"><FilePdfOutlined style={{ color: '#ff4d4f' }} /> Tệp PDF Giấy phép kinh doanh</Text>
                        <Button type="link" size="small" icon={<ExportOutlined />} href={url} target="_blank">Mở tab mới</Button>
                    </div>
                    <iframe 
                        src={url} 
                        title={title} 
                        style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
                    />
                </div>
            );
        }

        return (
            <div style={{ height: 'calc(100vh - 210px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a08', borderRadius: 8, padding: 12, overflow: 'hidden' }}>
                <Image 
                    src={url} 
                    alt={title}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                />
            </div>
        );
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;
    if (!company) return <div style={{ padding: 24 }}>Không tìm thấy thông tin doanh nghiệp!</div>;

    const isUpdate = company.loaiYeuCau === "UPDATE" && company.thongTinChoDuyet;
    const pendingData = company.thongTinChoDuyet || {};

    // Cấu hình Tabs xem tài liệu
    const tabItems = isUpdate ? [
        {
            key: 'front_new',
            label: (<span><Tag color="green">MỚI</Tag> GPKD Mặt trước</span>),
            children: renderDocumentViewer(pendingData.giayPhepKinhDoanhMatTruoc, "GPKD Mới (Mặt trước)")
        },
        {
            key: 'back_new',
            label: (<span><Tag color="green">MỚI</Tag> GPKD Mặt sau</span>),
            children: renderDocumentViewer(pendingData.giayPhepKinhDoanhMatSau, "GPKD Mới (Mặt sau)")
        },
        {
            key: 'front_old',
            label: (<span><Tag color="default">CỦ</Tag> GPKD Hiện tại</span>),
            children: renderDocumentViewer(company.giayPhepKinhDoanhMatTruoc, "GPKD Cũ (Hiện tại)")
        }
    ] : [
        {
            key: 'front',
            label: (<span><FileTextOutlined /> GPKD Mặt trước</span>),
            children: renderDocumentViewer(company.giayPhepKinhDoanhMatTruoc, "GPKD Mặt trước")
        },
        {
            key: 'back',
            label: (<span><FileTextOutlined /> GPKD Mặt sau</span>),
            children: renderDocumentViewer(company.giayPhepKinhDoanhMatSau, "GPKD Mặt sau")
        },
        {
            key: 'logo',
            label: (<span><PictureOutlined /> Logo Công ty</span>),
            children: (
                <div style={{ height: 'calc(100vh - 210px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 8 }}>
                    {company.logo ? (
                        <Image src={company.logo} style={{ maxHeight: '80%', objectFit: 'contain' }} />
                    ) : (
                        <Text type="secondary">Chưa tải Logo</Text>
                    )}
                </div>
            )
        }
    ];

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '12px 20px', backgroundColor: '#f1f5f9', boxSizing: 'border-box', overflow: 'hidden' }}>
            
            {/* 1. THANH HEADER TRÊN CÙNG */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexShrink: 0 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/approve-companies')} size="middle">
                    Quay lại danh sách
                </Button>
                <Title level={4} style={{ margin: 0, color: '#0f172a', fontSize: 18 }}>
                    <ApartmentOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                    THẨM ĐỊNH HỒ SƠ: <span style={{ color: '#1e40af' }}>{company.tenCongTy}</span>
                </Title>
                <Space>
                    {isUpdate ? (
                        <Tag color="blue" icon={<SyncOutlined spin />} style={{ fontSize: 13, padding: '4px 10px' }}>
                            Yêu cầu cập nhật thông tin
                        </Tag>
                    ) : (
                        <Tag color="orange" style={{ fontSize: 13, padding: '4px 10px' }}>
                            Đăng ký xác minh lần đầu
                        </Tag>
                    )}
                </Space>
            </div>

            {/* 2. BỐ CỤC SPLIT-SCREEN CÂN BẰNG */}
            <Row gutter={16} style={{ flex: 1, minHeight: 0 }}>
                
                {/* CỘT TRÁI: SOI GIẤY PHÉP KINH DOANH */}
                <Col xs={24} lg={12} style={{ height: '100%' }}>
                    <Card 
                        title={<Text strong style={{ color: '#0f172a', fontSize: 14 }}><FileTextOutlined /> TÀI LIỆU PHÁP LÝ (SOI TRỰC TIẾP)</Text>}
                        style={{ height: '100%', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                        bodyStyle={{ padding: '8px 12px 12px' }}
                    >
                        <Tabs 
                            activeKey={activeTab} 
                            onChange={setActiveTab} 
                            items={tabItems} 
                            size="small" 
                            tabBarStyle={{ marginBottom: 8 }}
                        />
                    </Card>
                </Col>

                {/* CỘT PHẢI: ĐỐI SOÁT & SO SÁNH CỦ VS MỚI (DIFF) */}
                <Col xs={24} lg={12} style={{ height: '100%' }}>
                    <Card 
                        style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
                    >
                        {/* A. BẢNG ACTION BANNER (CỐ ĐỊNH) */}
                        <div style={{ padding: '10px 16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <Text strong style={{ fontSize: 14, color: '#334155' }}>Quyết định:</Text>
                            <Space wrap>
                                <Popconfirm
                                    title={isUpdate ? "Xác nhận hủy yêu cầu cập nhật này?" : "Xác nhận từ chối và xóa hồ sơ?"}
                                    description={isUpdate ? "Doanh nghiệp vẫn tiếp tục hoạt động bằng thông tin cũ." : "Tài khoản doanh nghiệp sẽ bị xoá khỏi hàng chờ."}
                                    onConfirm={() => handleAction("REJECT")}
                                    okText="Từ chối"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true, loading: submitting }}
                                >
                                    <Button danger icon={<CloseOutlined />}>
                                        Từ chối
                                    </Button>
                                </Popconfirm>

                                <Button 
                                    icon={<FormOutlined />} 
                                    style={{ backgroundColor: '#fa8c16', color: '#fff', borderColor: '#fa8c16' }} 
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    Yêu cầu bổ sung
                                </Button>

                                <Popconfirm
                                    title={isUpdate ? "Đồng ý áp dụng thông tin mới cho Doanh nghiệp?" : "Phê duyệt chính thức cho Doanh nghiệp này?"}
                                    description="Dữ liệu mới sẽ được đè vào hệ thống và gửi email thông báo."
                                    onConfirm={() => handleAction("APPROVE")}
                                    okText="Duyệt ngay"
                                    cancelText="Hủy"
                                >
                                    <Button 
                                        type="primary" 
                                        icon={<CheckOutlined />} 
                                        style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }} 
                                        loading={submitting} 
                                    >
                                        Duyệt hồ sơ
                                    </Button>
                                </Popconfirm>
                            </Space>
                        </div>

                        {/* B. KHU VỰC ĐỐI SOÁT NỘI DUNG (CUỘN ĐỘC LẬP) */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                            
                            {/* BANNER THÔNG BÁO CHẾ ĐỘ CẬP NHẬT */}
                            {isUpdate && (
                                <Alert
                                    message="Yêu cầu Cập nhật Thông tin Pháp lý"
                                    description="Doanh nghiệp này đang hoạt động bình thường và gửi yêu cầu điều chỉnh Tên/MST/GPKD. Các trường màu xanh lá là thông tin MỚI do NTD yêu cầu."
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16, borderRadius: 8 }}
                                />
                            )}

                            <Text strong style={{ color: '#2563eb', fontSize: 14, display: 'block', marginBottom: 12 }}>
                                <FileTextOutlined /> {isUpdate ? "BẢNG SO SÁNH THÔNG TIN (CỦ VS MỚI)" : "THÔNG TIN DOANH NGHIỆP KHAI BÁO"}
                            </Text>

                            <Descriptions bordered column={1} size="small" labelStyle={{ width: '32%', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                                
                                {/* 1. MÃ SỐ THUẾ */}
                                <Descriptions.Item label="Mã số thuế">
                                    {isUpdate && pendingData.maSoThue !== company.maSoThue ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <Text type="secondary" delete style={{ fontSize: 13 }}>Đang dùng: {company.maSoThue}</Text>
                                            <Space>
                                                <Tag color="green" style={{ fontSize: 14, fontWeight: 'bold' }}>
                                                    Mới: {pendingData.maSoThue}
                                                </Tag>
                                                <Tooltip title="Sao chép MST mới">
                                                    <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(pendingData.maSoThue, "MST mới")} />
                                                </Tooltip>
                                            </Space>
                                        </div>
                                    ) : (
                                        <Space>
                                            <Tag color="geekblue" style={{ fontSize: 15, fontWeight: 'bold', padding: '2px 8px' }}>
                                                {company.maSoThue}
                                            </Tag>
                                            <Tooltip title="Sao chép MST">
                                                <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(company.maSoThue, "MST")} />
                                            </Tooltip>
                                        </Space>
                                    )}
                                </Descriptions.Item>
                                
                                {/* 2. TÊN CÔNG TY */}
                                <Descriptions.Item label="Tên công ty">
                                    {isUpdate && pendingData.tenCongTy !== company.tenCongTy ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <Text type="secondary" delete style={{ fontSize: 13 }}>Đang dùng: {company.tenCongTy}</Text>
                                            <Space>
                                                <Text strong style={{ fontSize: 14, color: '#16a34a' }}>Mới: {pendingData.tenCongTy}</Text>
                                                <Tooltip title="Sao chép Tên công ty mới">
                                                    <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(pendingData.tenCongTy, "Tên công ty mới")} />
                                                </Tooltip>
                                            </Space>
                                        </div>
                                    ) : (
                                        <Space>
                                            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{company.tenCongTy}</Text>
                                            <Tooltip title="Sao chép Tên công ty">
                                                <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(company.tenCongTy, "Tên công ty")} />
                                            </Tooltip>
                                        </Space>
                                    )}
                                </Descriptions.Item>

                                <Descriptions.Item label="Người đại diện">
                                    <Text strong>{company.nguoiDaiDien || "Chưa khai báo"}</Text>
                                </Descriptions.Item>

                                <Descriptions.Item label="Email liên hệ">
                                    {company.email}
                                </Descriptions.Item>

                                <Descriptions.Item label="Địa chỉ trụ sở">
                                    {company.diaChi}
                                </Descriptions.Item>

                                <Descriptions.Item label="Quy mô">
                                    {company.quyMo || "Chưa khai báo"}
                                </Descriptions.Item>
                            </Descriptions>

                            <Divider style={{ margin: '16px 0' }} />

                            <div style={{ marginBottom: 16 }}>
                                <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                                     Giới thiệu doanh nghiệp:
                                </Text>
                                <Paragraph style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', margin: 0, fontSize: 13 }}>
                                    {company.moTa || "Không có nội dung mô tả."}
                                </Paragraph>
                            </div>

                            <div>
                                <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                                    <MailOutlined style={{ color: '#2563eb' }} /> Mẫu Email Phỏng Vấn (NTD cài đặt):
                                </Text>
                                <Paragraph style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', whiteSpace: 'pre-line', margin: 0, fontSize: 13 }}>
                                    {company.mauEmailInterview || "Nhà tuyển dụng chưa thiết lập mẫu email phỏng vấn."}
                                </Paragraph>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* MODAL YÊU CẦU BỔ SUNG */}
            <Modal
                title={
                    <Space>
                        <FormOutlined style={{ color: '#fa8c16' }} />
                        <span>Gửi yêu cầu bổ sung / Chỉnh sửa hồ sơ</span>
                    </Space>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => {
                    if (!requestNote.trim()) {
                        message.warning("Vui lòng nhập chi tiết phản hồi cần bổ sung!");
                        return;
                    }
                    handleAction("REQUEST_ADDITION", requestNote);
                }}
                okText="Gửi thông báo & Email"
                cancelText="Hủy"
                confirmLoading={submitting}
                width={580}
            >
                <Paragraph style={{ marginBottom: 12, fontSize: 13 }}>
                    Nội dung phản hồi sẽ được gửi tự động qua Email cho Nhà tuyển dụng:
                </Paragraph>

                <div style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>
                        <BulbOutlined style={{ color: '#fa8c16' }} /> Mẫu phản hồi nhanh:
                    </Text>
                    <Space wrap size={[4, 4]}>
                        {quickReasonTemplates.map((template, idx) => (
                            <Tag 
                                key={idx} 
                                color="orange" 
                                style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}
                                onClick={() => setRequestNote(template)}
                            >
                                + Mẫu {idx + 1}
                            </Tag>
                        ))}
                    </Space>
                </div>

                <TextArea 
                    rows={4} 
                    value={requestNote} 
                    onChange={(e) => setRequestNote(e.target.value)} 
                    placeholder="Nhập chi tiết yêu cầu Nhà tuyển dụng điều chỉnh..." 
                />
            </Modal>
        </div>
    );
};

export default CompanyDetailAdmin;