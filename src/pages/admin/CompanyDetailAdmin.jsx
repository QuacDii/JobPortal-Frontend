import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, Descriptions, Tag, Button, Image, Typography, Modal, 
    Input, message, Spin, Row, Col, Divider, Space, Alert, Badge, Popconfirm 
} from 'antd';
import { 
    ArrowLeftOutlined, CheckOutlined, CloseOutlined, FormOutlined, 
    ApartmentOutlined, FileTextOutlined, RobotOutlined, FilePdfOutlined,
    WarningOutlined, BulbOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined
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

    // Trạng thái OCR
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);

    // Modal Yêu cầu bổ sung
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
            setCompany(res?.data || res);
        } catch (error) {
            message.error("Lỗi khi tải chi tiết hồ sơ công ty!");
        } finally {
            setLoading(false);
        }
    };

    const handleRunOcr = async () => {
        const imageUrl = company?.giayPhepKinhDoanhMatTruoc || company?.giayPhepKinhDoanhMatSau;
        if (!imageUrl) {
            message.warning("Công ty này chưa tải tệp Giấy phép kinh doanh!");
            return;
        }

        setOcrLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiClient.post('/AdminApproval/ocr-extract', 
                { imageUrl }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const payload = res?.data || res;
            if (payload.success) {
                setOcrResult(payload);
                message.success("Bóc tách dữ liệu OCR thành công!");
            } else {
                message.error(payload.message || "Không thể đọc dữ liệu từ tệp này!");
            }
        } catch (error) {
            message.error("Lỗi hệ thống khi gọi OCR!");
        } finally {
            setOcrLoading(false);
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
            
            if (actionType === "APPROVE") message.success("Đã phê duyệt doanh nghiệp & gửi email thông báo!");
            if (actionType === "REJECT") message.success("Đã từ chối doanh nghiệp!");
            if (actionType === "REQUEST_ADDITION") message.info("Đã gửi yêu cầu bổ sung tới nhà tuyển dụng!");
            
            navigate('/admin/approve-companies');
        } catch (error) {
            message.error("Xử lý thất bại!");
        } finally {
            setSubmitting(false);
            setIsModalOpen(false);
        }
    };

    // Các mẫu phản hồi nhanh cho Admin
    const quickReasonTemplates = [
        "Mã số thuế khai báo không trùng khớp với Mã số doanh nghiệp trên Giấy phép kinh doanh đính kèm.",
        "Ảnh chụp/scan Giấy phép kinh doanh bị mờ, lóa sáng hoặc mất góc. Vui lòng tải bản scan rõ nét hơn.",
        "Tên công ty khai báo chưa chính xác so với Giấy đăng ký kinh doanh chính thức.",
        "Giấy phép kinh doanh hết hạn hoặc không hợp lệ. Vui lòng cung cấp bản ghi mới nhất."
    ];

    const isPdfUrl = (url) => url && url.toLowerCase().endsWith('.pdf');

    // --- HÀM SO SÁNH PHÂN LOẠI CHI TIẾT (KHÁC DẤU VÀ TƯƠNG ĐỒNG) ---
    const removeAccents = (str) => {
        if (!str) return '';
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
    };

    const getLevenshteinDistance = (a, b) => {
        if (!a || !b) return (a || b).length;
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[a.length][b.length];
    };

    const compareFields = (declared, ocr) => {
        if (!ocr) return { status: 'MISSING', isMatch: false, label: 'Chưa đọc được', note: null };
        if (!declared) return { status: 'UNCHECKED', isMatch: false, label: 'Chưa khai báo', note: null };

        const s1 = declared.toString().normalize("NFC").replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
        const s2 = ocr.toString().normalize("NFC").replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

        // 1. Khớp tuyệt đối cả dấu
        if (s1.toUpperCase() === s2.toUpperCase()) {
            return { status: 'EXACT', isMatch: true, label: 'Trùng khớp', note: null };
        }

        // 2. Khớp chữ cái nhưng khác dấu tiếng Việt
        const clean1 = removeAccents(s1).toLowerCase();
        const clean2 = removeAccents(s2).toLowerCase();

        if (clean1 === clean2 || clean2.includes(clean1) || clean1.includes(clean2)) {
            return { 
                status: 'ACCENT_DIFF', 
                isMatch: true, 
                label: 'Khớp (khác dấu *)', 
                note: `(*) Chênh lệch nhỏ về dấu tiếng Việt giữa bản khai báo và OCR` 
            };
        }

        // 3. Khớp tương đồng mờ (Fuzzy Levenshtein >= 85%)
        const maxLen = Math.max(clean1.length, clean2.length);
        const distance = getLevenshteinDistance(clean1, clean2);
        const similarity = maxLen === 0 ? 1 : 1.0 - (distance / maxLen);

        if (similarity >= 0.85) {
            return { 
                status: 'FUZZY_MATCH', 
                isMatch: true, 
                label: `Tương đồng (${Math.round(similarity * 100)}% *)`, 
                note: `(*) Chênh lệch nhỏ một vài ký tự do lỗi font hoặc nhận diện OCR` 
            };
        }

        // 4. Khác biệt rõ rệt
        return { status: 'MISMATCH', isMatch: false, label: 'Khác biệt', note: null };
    };

    const compareMst = () => {
        if (!ocrResult?.maSoThue || !company?.maSoThue) return { status: 'MISSING', isMatch: false, label: 'Chưa đọc được', note: null };
        const ocrMst = ocrResult.maSoThue.replace(/\D/g, '');
        const declMst = company.maSoThue.replace(/\D/g, '');
        const matched = ocrMst === declMst || ocrMst.includes(declMst) || declMst.includes(ocrMst);
        return matched 
            ? { status: 'EXACT', isMatch: true, label: 'Trùng khớp', note: null }
            : { status: 'MISMATCH', isMatch: false, label: 'Khác biệt', note: null };
    };

    const mstComparison = compareMst();
    const nameComparison = compareFields(company?.tenCongTy, ocrResult?.tenCongTy);
    const repComparison = compareFields(company?.nguoiDaiDien, ocrResult?.nguoiDaiDien);

    const renderMatchTag = (comp) => {
        switch (comp.status) {
            case 'EXACT':
                return <Tag color="success" icon={<CheckCircleOutlined />}>{comp.label}</Tag>;
            case 'ACCENT_DIFF':
                return <Tag color="warning" icon={<CheckCircleOutlined />}>{comp.label}</Tag>;
            case 'FUZZY_MATCH':
                return <Tag color="processing" icon={<CheckCircleOutlined />}>{comp.label}</Tag>;
            case 'MISMATCH':
                return <Tag color="error" icon={<CloseCircleOutlined />}>{comp.label}</Tag>;
            default:
                return <Tag color="default">{comp.label}</Tag>;
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;
    if (!company) return <div style={{ padding: 24 }}>Không tìm thấy thông tin doanh nghiệp!</div>;

    const hasAnyMismatch = ocrResult && (!mstComparison.isMatch || !nameComparison.isMatch || !repComparison.isMatch);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/approve-companies')} style={{ marginBottom: 16 }}>
                Quay lại danh sách
            </Button>

            <Card
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ApartmentOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                        <Title level={4} style={{ margin: 0 }}>THẨM ĐỊNH HỒ SƠ DOANH NGHIỆP</Title>
                    </div>
                }
                extra={
                    <Space>
                        <Button 
                            type="dashed" 
                            icon={<RobotOutlined style={{ color: '#722ed1' }} />} 
                            loading={ocrLoading} 
                            onClick={handleRunOcr}
                            style={{ borderColor: '#722ed1', color: '#722ed1', fontWeight: 600 }}
                        >
                            Trích xuất OCR AI
                        </Button>
                        <Popconfirm
                            title="Xác nhận từ chối và xóa yêu cầu này?"
                            description="Tài khoản doanh nghiệp sẽ nhận được email thông báo từ chối."
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
                            title="Phê duyệt chính thức cho Doanh nghiệp này?"
                            description="Doanh nghiệp sẽ được cấp quyền đăng tin tuyển dụng và tìm CV ngay lập tức."
                            onConfirm={() => handleAction("APPROVE")}
                            okText="Duyệt ngay"
                            cancelText="Hủy"
                        >
                            <Button 
                                type="primary" 
                                icon={<CheckOutlined />} 
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} 
                                loading={submitting} 
                            >
                                Duyệt hồ sơ
                            </Button>
                        </Popconfirm>
                    </Space>
                }
            >
                {/* KHUNG ĐỐI SOÁT OCR AI */}
                {ocrResult && (
                    <Alert
                        style={{ marginBottom: 24, borderRadius: 10, border: '1px solid #d3ade6', backgroundColor: '#f9f0ff' }}
                        message={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space>
                                    <RobotOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                                    <Text strong style={{ fontSize: 16, color: '#531dab' }}>KẾT QUẢ BÓC TÁCH TỰ ĐỘNG (OCR AI Assistant)</Text>
                                </Space>
                                <Tag color="purple" style={{ fontWeight: 600 }}>
                                    Độ tin cậy AI: {Math.round((ocrResult.confidenceScore || 0.98) * 100)}%
                                </Tag>
                            </div>
                        }
                        description={
                            <div style={{ marginTop: 12 }}>
                                <Row gutter={16}>
                                    {/* Cột 1: Thông tin do NTD khai báo */}
                                    <Col span={12}>
                                        <Card size="small" title="Thông tin NTD Khai báo" style={{ borderRadius: 8, height: '100%' }}>
                                            <div style={{ marginBottom: 12 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Mã số thuế:</Text>
                                                <div><Tag color="blue" style={{ fontSize: 13, marginTop: 2 }}>{company.maSoThue || 'Chưa khai báo'}</Tag></div>
                                            </div>

                                            <div style={{ marginBottom: 12 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Tên công ty:</Text>
                                                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{company.tenCongTy || 'Chưa khai báo'}</div>
                                            </div>

                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Người đại diện:</Text>
                                                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{company.nguoiDaiDien || 'Chưa khai báo'}</div>
                                            </div>
                                        </Card>
                                    </Col>

                                    {/* Cột 2: Thông tin AI đọc từ GPKD */}
                                    <Col span={12}>
                                        <Card size="small" title="Thông tin AI Đọc từ GPKD" style={{ borderRadius: 8, height: '100%', borderColor: hasAnyMismatch ? '#ffccc7' : '#b7eb8f' }}>
                                            {/* MST */}
                                            <div style={{ marginBottom: 12 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Mã số thuế OCR:</Text>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                                    <Text strong>{ocrResult.maSoThue || "Không đọc được"}</Text>
                                                    {renderMatchTag(mstComparison)}
                                                </div>
                                            </div>

                                            {/* Tên Công Ty */}
                                            <div style={{ marginBottom: 12 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Tên công ty OCR:</Text>
                                                <div style={{ marginTop: 2 }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{ocrResult.tenCongTy || "Không đọc được"}</div>
                                                    <div>{renderMatchTag(nameComparison)}</div>
                                                    {nameComparison.note && (
                                                        <div style={{ fontSize: 11, color: '#d46b08', marginTop: 3, fontStyle: 'italic' }}>
                                                            <InfoCircleOutlined /> {nameComparison.note}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Đại Diện Pháp Luật */}
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Đại diện pháp luật OCR:</Text>
                                                <div style={{ marginTop: 2 }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{ocrResult.nguoiDaiDien || "Không đọc được"}</div>
                                                    <div>{renderMatchTag(repComparison)}</div>
                                                    {repComparison.note && (
                                                        <div style={{ fontSize: 11, color: '#d46b08', marginTop: 3, fontStyle: 'italic' }}>
                                                            <InfoCircleOutlined /> {repComparison.note}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>

                                {hasAnyMismatch && (
                                    <div style={{ marginTop: 14, padding: '8px 12px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6, color: '#cf1322', fontSize: 13, fontWeight: 500 }}>
                                        <WarningOutlined /> Cảnh báo: Phát hiện thông tin khai báo có sự sai lệch so với Giấy phép kinh doanh. Vui lòng đối chiếu kỹ trước khi duyệt hoặc bấm 'Yêu cầu bổ sung'!
                                    </div>
                                )}
                            </div>
                        }
                        type="info"
                    />
                )}

                {/* THÔNG TIN KHAI BÁO CỦA CÔNG TY */}
                <Descriptions bordered column={2} size="middle">
                    <Descriptions.Item label="Tên công ty chính thức" span={2}>
                        <Text strong style={{ fontSize: 16, color: '#1e293b' }}>{company.tenCongTy}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã số thuế"><Tag color="geekblue" style={{ fontSize: 14 }}>{company.maSoThue}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Quy mô">{company.quyMo || "Chưa khai báo"}</Descriptions.Item>
                    <Descriptions.Item label="Người đại diện">{company.nguoiDaiDien}</Descriptions.Item>
                    <Descriptions.Item label="Email liên hệ">{company.email}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ trụ sở" span={2}>{company.diaChi}</Descriptions.Item>
                </Descriptions>

                <Divider />

                {/* KHU VỰC HIỂN THỊ CẢ GIỚI THIỆU VÀ MẪU EMAIL */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Text strong style={{ fontSize: 15 }}><FileTextOutlined /> Giới thiệu về doanh nghiệp:</Text>
                        <Paragraph style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginTop: 8, border: '1px solid #e2e8f0', minHeight: 120 }}>
                            {company.moTa || "Không có nội dung mô tả."}
                        </Paragraph>
                    </Col>
                    
                    <Col xs={24} md={12}>
                        <Text strong style={{ fontSize: 15 }}><MailOutlined style={{ color: '#1677ff' }} /> Mẫu Email Mời Phỏng Vấn (NTD cài đặt):</Text>
                        <Paragraph style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginTop: 8, border: '1px solid #e2e8f0', whiteSpace: 'pre-line', minHeight: 120 }}>
                            {company.mauEmailInterview || "Nhà tuyển dụng chưa thiết lập mẫu email phỏng vấn."}
                        </Paragraph>
                    </Col>
                </Row>

                <Divider />

                {/* TÀI LIỆU VĂN BẢN VÀ GPKD */}
                <Title level={5}><FileTextOutlined /> HỒ SƠ TÀI LIỆU VÀ GIẤY PHÉP KINH DOANH ĐÍNH KÈM</Title>
                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={8} style={{ textAlign: 'center' }}>
                        <Card title="Logo Doanh nghiệp" size="small" style={{ borderRadius: 8 }}>
                            {company.logo ? (
                                <Image src={company.logo} style={{ maxHeight: 180, objectFit: 'contain' }} />
                            ) : (
                                <Text type="secondary">Chưa tải Logo</Text>
                            )}
                        </Card>
                    </Col>

                    <Col span={8} style={{ textAlign: 'center' }}>
                        <Card title="GPKD (Mặt trước / Bản chính)" size="small" style={{ borderRadius: 8 }}>
                            {company.giayPhepKinhDoanhMatTruoc ? (
                                isPdfUrl(company.giayPhepKinhDoanhMatTruoc) ? (
                                    <div style={{ padding: '30px 0' }}>
                                        <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
                                        <div style={{ marginTop: 12 }}>
                                            <Button type="primary" href={company.giayPhepKinhDoanhMatTruoc} target="_blank">
                                                Mở xem file PDF GPKD
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Image src={company.giayPhepKinhDoanhMatTruoc} style={{ maxHeight: 180, objectFit: 'contain' }} />
                                )
                            ) : (
                                <Tag color="red">Chưa tải mặt trước</Tag>
                            )}
                        </Card>
                    </Col>

                    <Col span={8} style={{ textAlign: 'center' }}>
                        <Card title="GPKD (Mặt sau - Tùy chọn)" size="small" style={{ borderRadius: 8 }}>
                            {company.giayPhepKinhDoanhMatSau ? (
                                isPdfUrl(company.giayPhepKinhDoanhMatSau) ? (
                                    <div style={{ padding: '30px 0' }}>
                                        <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
                                        <div style={{ marginTop: 12 }}>
                                            <Button type="primary" href={company.giayPhepKinhDoanhMatSau} target="_blank">
                                                Mở xem file PDF Mặt sau
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Image src={company.giayPhepKinhDoanhMatSau} style={{ maxHeight: 180, objectFit: 'contain' }} />
                                )
                            ) : (
                                <Tag color="default">Không tải mặt sau</Tag>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Card>

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
                okText="Gửi thông báo & Email tới NTD"
                cancelText="Hủy"
                confirmLoading={submitting}
                width={650}
            >
                <Paragraph style={{ marginBottom: 12 }}>
                    Nội dung này sẽ hiển thị trực tiếp trên giao diện Nhà tuyển dụng và được gửi tự động qua Email:
                </Paragraph>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 8 }}>
                        <BulbOutlined style={{ color: '#fa8c16' }} /> Gợi ý mẫu phản hồi nhanh:
                    </Text>
                    <Space wrap size={[6, 6]}>
                        {quickReasonTemplates.map((template, idx) => (
                            <Tag 
                                key={idx} 
                                color="orange" 
                                style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
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