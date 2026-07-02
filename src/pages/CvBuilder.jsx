import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Form, Input, Typography, Divider, Button, Space, Upload, message, Spin, Select, Slider, Tooltip } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    DownloadOutlined,
    SaveOutlined,
    ArrowLeftOutlined,
    FileTextFilled,
    FormatPainterOutlined,
    AppstoreAddOutlined,
    LayoutOutlined,
    SwapOutlined,
    LoadingOutlined,
    CloseOutlined,
    PhoneFilled,
    MailFilled,
    EnvironmentFilled
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ========================================================
// HÀM GIẢI MÃ JWT TOKEN ĐỂ LẤY THÔNG TIN USER HỆ THỐNG
// ========================================================
const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        return {
            userId: decoded.nameid || decoded.maUser || decoded.id || decoded.sub,
            fullName: decoded.HoTen || decoded.name || '',
            email: decoded.email || decoded.emailaddress || ''
        };
    } catch (error) {
        console.error("Lỗi giải mã JWT Token:", error);
        return null;
    }
};

// ========================================================
// HÀM DỮ LIỆU GỢI Ý MẪU
// ========================================================
const getMockSuggestedData = (lang) => {
    if (lang === 'en') {
        return {
            jobTitle: 'Sales Executive / Key Account Manager',
            summary: 'Dynamic and results-oriented professional with a proven track record in driving sales growth and building strong client relationships.',
            skills: 'B2B Sales, Negotiation, CRM (Salesforce), English (Fluent), Problem Solving',
            experience: [
                { id: 1, time: '01/2023 - Present', title: 'Sales Executive at ABC Corp', description: '- Managed a portfolio of 50+ B2B clients.\n- Exceeded quarterly sales targets by 20%.\n- Identified and developed new business opportunities.' }
            ]
        };
    }
    return {
        jobTitle: 'Nhân viên Kinh doanh',
        summary: 'Là một người năng động, hướng tới kết quả với bề dày thành tích trong việc thúc đẩy tăng trưởng doanh số và xây dựng mối quan hệ khách hàng.',
        skills: 'Bán hàng B2B, Đàm phán thương lượng, Sử dụng phần mềm CRM, Tiếng Anh giao tiếp',
        experience: [
            { id: 1, time: '01/2023 - Hiện tại', title: 'Nhân viên Kinh doanh tại Công ty ABC', description: '- Quản lý và chăm sóc danh mục hơn 50 khách hàng doanh nghiệp (B2B).\n- Vượt 20% chỉ tiêu doanh số hàng quý liên tiếp trong năm 2023.\n- Tìm kiếm và phát triển thành công 15 đối tác chiến lược mới.' }
        ]
    };
};

const CvBuilder = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Đọc tham số URL
    const templateId = searchParams.get('templateId') || '1';
    const cvId = searchParams.get('cvId');
    const source = searchParams.get('source');
    const lang = searchParams.get('lang');
    const positionId = searchParams.get('position');

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId || null;

    const [cvTitle, setCvTitle] = useState('Hồ sơ xin việc mới');
    const [pageLoading, setPageLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    // ==========================================
    // 1. STATE QUẢN LÝ CẤU HÌNH GIAO DIỆN (UI SETTINGS)
    // ==========================================
    const [activeMenu, setActiveMenu] = useState('design');
    const [fontFamily, setFontFamily] = useState('Roboto, sans-serif');
    const [fontSize, setFontSize] = useState(50);
    const [lineHeight, setLineHeight] = useState(1.5);
    const [themeColor, setThemeColor] = useState('#1890ff');

    const themeColors = ['#1890ff', '#00b14f', '#f5222d', '#fa8c16', '#722ed1', '#262626'];
    const fontOptions = [
        { label: 'Roboto', value: 'Roboto, sans-serif' },
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Times New Roman', value: '"Times New Roman", serif' },
        { label: 'Nunito', value: 'Nunito, sans-serif' }
    ];

    // ==========================================
    // 2. STATE DỮ LIỆU CV GỐC
    // ==========================================
    const [cvData, setCvData] = useState({
        personalInfo: {
            fullName: '', jobTitle: '', email: '', phone: '', address: '', avatar: ''
        },
        summary: '',
        skills: '',
        experience: []
    });

    useEffect(() => {
        const initializeCvData = async () => {
            setPageLoading(true);
            try {
                if (cvId && token) {
                    const res = await axios.get(`http://localhost:5279/api/Cv/${cvId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.data) {
                        if (res.data.tieuDe) setCvTitle(res.data.tieuDe);
                        if (res.data.maHex) setThemeColor(res.data.maHex); // Load lại màu đã lưu
                        if (res.data.fontChu) setFontFamily(res.data.fontChu); // Load lại font đã lưu
                        if (res.data.duLieuCv) {
                            try { setCvData(JSON.parse(res.data.duLieuCv)); }
                            catch (e) { console.error("Lỗi parse dữ liệu CV cũ:", e); }
                        }
                    }
                } else {
                    let initialData = {
                        personalInfo: {
                            fullName: userInfo?.fullName || '',
                            email: userInfo?.email || '',
                            phone: '', address: '', avatar: '', jobTitle: ''
                        },
                        summary: '', skills: '', experience: []
                    };
                    setCvTitle(`CV_${(userInfo?.fullName || 'UngVien').replace(/\s+/g, '')}_Moi`);

                    if (source === 'suggested') {
                        try {
                            const suggestedContent = getMockSuggestedData(lang);
                            initialData = {
                                ...initialData,
                                personalInfo: { ...initialData.personalInfo, jobTitle: suggestedContent.jobTitle },
                                summary: suggestedContent.summary,
                                skills: suggestedContent.skills,
                                experience: suggestedContent.experience
                            };
                            message.success('Đã tải nội dung CV mẫu gợi ý!');
                        } catch (err) {
                            message.error("Lỗi tải dữ liệu gợi ý.");
                        }
                    }
                    setCvData(initialData);
                }
            } catch (err) {
                console.error("Lỗi tải CV:", err);
                message.error('Không thể khởi tạo dữ liệu CV!');
            } finally {
                setPageLoading(false);
            }
        };
        initializeCvData();
    }, [cvId, token, source, lang, positionId]);

    // ==========================================
    // CÁC HÀM XỬ LÝ NHẬP LIỆU
    // ==========================================
    const handleCvImageUpload = (info) => {
        if (info.file.status === 'uploading') {
            setImageLoading(true); return;
        }
        if (info.file.status === 'done') {
            setImageLoading(false);
            setCvData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, avatar: info.file.response.url } }));
            message.success('Tải ảnh thành công!');
        } else if (info.file.status === 'error') {
            setImageLoading(false); message.error('Tải ảnh thất bại!');
        }
    };

    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setCvData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [name]: value } }));
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setCvData(prev => ({ ...prev, [name]: value }));
    };

    const addExperience = () => {
        const newExp = { id: Date.now(), time: '', title: '', description: '' };
        setCvData(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
    };

    const removeExperience = (id) => {
        setCvData(prev => ({ ...prev, experience: prev.experience.filter(item => item.id !== id) }));
    };

    const handleExperienceChange = (id, field, value) => {
        const updatedExp = cvData.experience.map(item => item.id === id ? { ...item, [field]: value } : item);
        setCvData(prev => ({ ...prev, experience: updatedExp }));
    };

    const handleDownloadPDF = () => window.print();

    // ==========================================
    // LƯU CV
    // ==========================================
    const handleSaveCV = async () => {
        if (!token || !userId) {
            message.warning('Vui lòng đăng nhập tài khoản!'); navigate('/login'); return;
        }

        const hideLoading = message.loading('Đang xử lý lưu hồ sơ...', 0);
        try {
            const cvPageElement = document.querySelector('.cv-preview-page');
            let uploadedImageUrl = cvData.personalInfo.avatar || "";

            if (cvPageElement) {
                const canvas = await html2canvas(cvPageElement, {
                    useCORS: true,
                    scale: 3,
                    logging: false
                });

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const formData = new FormData();
                formData.append('file', blob, 'cv_screenshot.png');

                const uploadRes = await axios.post('http://localhost:5279/api/Upload/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedImageUrl = uploadRes.data.url;
            }

            const payload = {
                maCv: cvId ? parseInt(cvId) : null,
                maUser: parseInt(userId),
                maMau: parseInt(templateId),
                maHex: themeColor,
                tieuDe: cvTitle,
                duLieuCv: JSON.stringify(cvData),
                isPublic: true,
                duongDan: uploadedImageUrl,
                fontChu: fontFamily,
                ngonNgu: lang || 'vi'
            };

            await axios.post('http://localhost:5279/api/Cv', payload, { headers: { 'Authorization': `Bearer ${token}` } });
            hideLoading();
            message.success('Lưu hồ sơ thành công!');
            navigate('/manage-cv');
        } catch (err) {
            console.error(err); hideLoading(); message.error('Lỗi khi lưu dữ liệu!');
        }
    };

    if (pageLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}><Spin size="large" /></div>;

    const computedFontSize = 12 + (fontSize / 100) * 8;

    // ==========================================
    // 🎨 HÀM RENDER TEMPLATE 1 (MẪU 1 CỘT)
    // ==========================================
    const renderTemplate1 = () => (
        <div style={{ padding: '50px', color: '#333' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '30px' }}>
                {cvData?.personalInfo?.avatar && (
                    <img
                        src={cvData.personalInfo.avatar}
                        alt="CV Avatar"
                        style={{ width: '105px', height: '140px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d9d9d9', flexShrink: 0 }}
                    />
                )}
                <div style={{ flex: 1, textAlign: cvData?.personalInfo?.avatar ? 'left' : 'center' }}>
                    <Title level={2} style={{ margin: 0, color: themeColor, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'inherit' }}>
                        {cvData.personalInfo.fullName || 'HỌ VÀ TÊN'}
                    </Title>
                    <Text style={{ fontSize: `${computedFontSize + 3}px`, fontWeight: 500, color: '#595959', fontFamily: 'inherit' }}>
                        {cvData.personalInfo.jobTitle || 'Vị trí ứng tuyển'}
                    </Text>
                    <div style={{ marginTop: '12px', fontSize: `${computedFontSize - 1}px`, color: '#8c8c8c' }}>
                        <span>{cvData.personalInfo.phone}</span>
                        <Divider type="vertical" />
                        <span>{cvData.personalInfo.email}</span>
                        <Divider type="vertical" />
                        <span>{cvData.personalInfo.address}</span>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ borderBottom: `2px solid ${themeColor}`, paddingBottom: '4px', textTransform: 'uppercase', color: themeColor, fontFamily: 'inherit' }}>Mục tiêu nghề nghiệp</Title>
                <div className="whitespace-pre" style={{ marginTop: '8px', color: '#333' }}>
                    {cvData.summary}
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ borderBottom: `2px solid ${themeColor}`, paddingBottom: '4px', textTransform: 'uppercase', color: themeColor, fontFamily: 'inherit' }}>Kỹ năng & Ngoại ngữ</Title>
                <div className="whitespace-pre" style={{ marginTop: '8px', color: '#333' }}>
                    {cvData.skills}
                </div>
            </div>

            <div>
                <Title level={5} style={{ borderBottom: `2px solid ${themeColor}`, paddingBottom: '4px', textTransform: 'uppercase', color: themeColor, fontFamily: 'inherit' }}>Kinh nghiệm / Dự án</Title>
                <div style={{ marginTop: '16px' }}>
                    {cvData.experience.map((exp, index) => (
                        <div key={exp.id || index} style={{ marginBottom: '16px', display: 'flex' }}>
                            <div style={{ width: '150px', flexShrink: 0, fontWeight: 500, color: '#595959' }}>
                                {exp.time}
                            </div>
                            <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid #e8e8e8' }}>
                                <div style={{ fontWeight: 600, color: '#262626', fontSize: `${computedFontSize + 1}px` }}>{exp.title}</div>
                                <div className="whitespace-pre" style={{ marginTop: '4px', color: '#595959' }}>
                                    {exp.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ==========================================
    // 🎨 HÀM RENDER TEMPLATE 2 (MẪU 2 CỘT)
    // ==========================================
    const renderTemplate2 = () => {
        const accentColor = themeColor === '#1890ff' ? '#f39c12' : themeColor;

        return (
            <div style={{ display: 'flex', minHeight: '297mm', color: '#333' }}>
                {/* CỘT TRÁI */}
                <div style={{ width: '38%', backgroundColor: '#434a54', padding: '40px 24px', color: '#fff' }}>
                    {cvData?.personalInfo?.avatar && (
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <img
                                src={cvData.personalInfo.avatar}
                                alt="Avatar"
                                style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '3px solid #5a626c' }}
                            />
                        </div>
                    )}

                    <div style={{ textAlign: 'left', marginBottom: '40px' }}>
                        <Title level={3} style={{ margin: 0, color: accentColor, textTransform: 'uppercase', fontFamily: 'inherit', fontWeight: 700 }}>
                            {cvData.personalInfo.fullName || 'HỌ VÀ TÊN'}
                        </Title>
                        <Text style={{ fontSize: `${computedFontSize}px`, color: '#fff', fontFamily: 'inherit', display: 'block', marginTop: '4px' }}>
                            {cvData.personalInfo.jobTitle || 'Vị trí ứng tuyển'}
                        </Text>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <Title level={5} style={{ color: accentColor, borderBottom: `1px solid ${accentColor}`, paddingBottom: '8px', marginBottom: '16px', fontFamily: 'inherit' }}>
                            Thông tin cá nhân
                        </Title>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: `${computedFontSize - 1}px` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><PhoneFilled style={{ color: accentColor }} /> {cvData.personalInfo.phone}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><MailFilled style={{ color: accentColor }} /> {cvData.personalInfo.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><EnvironmentFilled style={{ color: accentColor }} /> {cvData.personalInfo.address}</div>
                        </div>
                    </div>

                    <div>
                        <Title level={5} style={{ color: accentColor, borderBottom: `1px solid ${accentColor}`, paddingBottom: '8px', marginBottom: '16px', fontFamily: 'inherit' }}>
                            Kỹ năng
                        </Title>
                        <div className="whitespace-pre" style={{ fontSize: `${computedFontSize - 1}px`, lineHeight: '1.8' }}>
                            {cvData.skills}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div style={{ width: '62%', backgroundColor: '#fff', padding: '40px 32px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <Title level={4} style={{ color: accentColor, borderBottom: `2px solid ${accentColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '16px', fontFamily: 'inherit' }}>
                            Mục tiêu nghề nghiệp
                        </Title>
                        <div className="whitespace-pre" style={{ fontSize: `${computedFontSize}px`, lineHeight: '1.6', textAlign: 'justify' }}>
                            {cvData.summary}
                        </div>
                    </div>

                    <div>
                        <Title level={4} style={{ color: accentColor, borderBottom: `2px solid ${accentColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>
                            Kinh nghiệm làm việc
                        </Title>

                        {cvData.experience.map((exp, index) => (
                            <div key={exp.id || index} style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                    <strong style={{ fontSize: `${computedFontSize + 1}px`, color: '#333' }}>{exp.title}</strong>
                                    <span style={{ fontSize: `${computedFontSize - 1}px`, color: '#666', fontWeight: 500 }}>{exp.time}</span>
                                </div>
                                <div className="whitespace-pre" style={{ fontSize: `${computedFontSize}px`, lineHeight: '1.6', color: '#444' }}>
                                    {exp.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="cv-builder-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#1f1f1f', overflow: 'hidden' }}>

            <style>{`
                .cv-builder-header {
                    background-color: #141414; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d2d2d; z-index: 10;
                }
                .cv-title-input {
                    color: #fff !important; font-weight: 600; font-size: 16px; background-color: transparent !important; border: 1px solid #333 !important; border-radius: 4px; padding: 4px 12px; width: 300px;
                }
                .cv-title-input:hover, .cv-title-input:focus { border-color: #1890ff !important; }
                
                .builder-body { display: flex; flex: 1; height: calc(100vh - 65px); }
                
                .sidebar-menu { width: 80px; background-color: #141414; border-right: 1px solid #2d2d2d; display: flex; flexDirection: column; align-items: center; padding-top: 16px; }
                .menu-btn { width: 64px; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8c8c8c; cursor: pointer; border-radius: 8px; margin-bottom: 8px; transition: all 0.3s; }
                .menu-btn:hover { background-color: #242424; color: #fff; }
                .menu-btn.active { background-color: #242424; color: #1890ff; }
                .menu-btn .anticon { font-size: 20px; margin-bottom: 4px; }
                .menu-btn span { font-size: 11px; text-align: center; line-height: 1.2; }

                .settings-panel { width: 320px; background-color: #1a1a1a; border-right: 1px solid #2d2d2d; padding: 20px; overflow-y: auto; color: #fff; transition: all 0.3s ease; }
                .settings-panel.hidden { width: 0; padding: 0; border: none; overflow: hidden; }
                
                .workspace-area { flex: 1; padding: 24px; overflow-y: auto; background-color: #242424; }
                
                .form-container-scroll { max-height: 100%; overflow-y: auto; padding-right: 8px; }
                .form-container-scroll::-webkit-scrollbar, .workspace-area::-webkit-scrollbar, .settings-panel::-webkit-scrollbar { width: 6px; }
                .form-container-scroll::-webkit-scrollbar-thumb, .workspace-area::-webkit-scrollbar-thumb, .settings-panel::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }

                /* Cập nhật CSS của trang A4: Xóa padding cứng để hỗ trợ tràn viền */
                .cv-preview-page {
                    background: white; border-radius: 4px; min-height: 297mm; box-shadow: 0 8px 24px rgba(0,0,0,0.3); color: #333; transition: all 0.3s ease; overflow: hidden;
                }
                .whitespace-pre { white-space: pre-wrap; }
                
                .color-circle { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
                .color-circle:hover { transform: scale(1.1); }
                .color-circle.active { border-color: #fff; box-shadow: 0 0 0 2px #1890ff; }

                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact;}
                    .no-print { display: none !important; }
                    .builder-body { display: block !important; height: auto !important; }
                    .workspace-area { background: white !important; padding: 0 !important; overflow: visible !important; }
                    .print-full-width { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; }
                    .cv-preview-page { box-shadow: none !important; border-radius: 0 !important; }
                }
            `}</style>

            <div className="cv-builder-header no-print">
                <Space size="large">
                    <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#aaa' }} onClick={() => navigate('/manage-cv')}>
                        Quản lý CV
                    </Button>
                    <Divider type="vertical" style={{ backgroundColor: '#333', height: '20px' }} />
                    <Space size="small">
                        <FileTextFilled style={{ color: '#1890ff', fontSize: '18px' }} />
                        <Input
                            className="cv-title-input"
                            variant="borderless"
                            value={cvTitle}
                            onChange={(e) => setCvTitle(e.target.value)}
                            placeholder="Tên CV..."
                        />
                    </Space>
                </Space>
                <Space size="middle">
                    <Button type="default" icon={<SaveOutlined />} onClick={handleSaveCV} style={{ backgroundColor: 'transparent', borderColor: '#1890ff', color: '#1890ff' }}>
                        Lưu hồ sơ
                    </Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF} style={{ backgroundColor: '#00b14f', borderColor: '#00b14f' }}>
                        Tải PDF
                    </Button>
                </Space>
            </div>

            <div className="builder-body">
                <div className="sidebar-menu no-print">
                    <div className={`menu-btn ${activeMenu === 'design' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'design' ? null : 'design')}>
                        <FormatPainterOutlined />
                        <span>Thiết kế & Font</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'add' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'add' ? null : 'add')}>
                        <AppstoreAddOutlined />
                        <span>Thêm mục</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'layout' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'layout' ? null : 'layout')}>
                        <LayoutOutlined />
                        <span>Bố cục</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'templates' ? 'active' : ''}`} onClick={() => navigate('/thu-vien-cv')}>
                        <SwapOutlined />
                        <span>Đổi mẫu CV</span>
                    </div>
                </div>

                <div className={`settings-panel no-print ${!activeMenu ? 'hidden' : ''}`}>
                    {activeMenu === 'design' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <Title level={5} style={{ color: '#fff', margin: 0 }}>Thiết kế & Font</Title>
                                <Button type="text" icon={<CloseOutlined />} style={{ color: '#8c8c8c' }} onClick={() => setActiveMenu(null)} />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <Text style={{ color: '#a6a6a6', display: 'block', marginBottom: '8px', fontSize: '13px' }}>FONT CHỮ</Text>
                                <Select
                                    value={fontFamily}
                                    onChange={setFontFamily}
                                    style={{ width: '100%' }}
                                    dropdownStyle={{ backgroundColor: '#242424', color: '#fff' }}
                                >
                                    {fontOptions.map(font => (
                                        <Option key={font.value} value={font.value}>
                                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <Text style={{ color: '#a6a6a6', display: 'block', marginBottom: '8px', fontSize: '13px' }}>CỠ CHỮ</Text>
                                <Slider
                                    min={0} max={100}
                                    value={fontSize}
                                    onChange={setFontSize}
                                    tooltip={{ formatter: null }}
                                    trackStyle={{ backgroundColor: '#00b14f' }}
                                    handleStyle={{ borderColor: '#00b14f' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8c8c8c', fontSize: '12px' }}>
                                    <span>Nhỏ</span><span>Trung bình</span><span>Siêu lớn</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <Text style={{ color: '#a6a6a6', display: 'block', marginBottom: '8px', fontSize: '13px' }}>KHOẢNG CÁCH DÒNG</Text>
                                <Slider
                                    min={1.0} max={2.0} step={0.1}
                                    value={lineHeight}
                                    onChange={setLineHeight}
                                    tooltip={{ formatter: null }}
                                    trackStyle={{ backgroundColor: '#00b14f' }}
                                    handleStyle={{ borderColor: '#00b14f' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8c8c8c', fontSize: '12px' }}>
                                    <span>1.0</span><span>2.0</span>
                                </div>
                            </div>

                            <div>
                                <Text style={{ color: '#a6a6a6', display: 'block', marginBottom: '12px', fontSize: '13px' }}>MÀU CHỦ ĐỀ</Text>
                                <Space size="middle" wrap>
                                    {themeColors.map(color => (
                                        <div
                                            key={color}
                                            className={`color-circle ${themeColor === color ? 'active' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setThemeColor(color)}
                                        />
                                    ))}
                                </Space>
                            </div>
                        </div>
                    )}
                    {activeMenu !== 'design' && (
                        <div style={{ textAlign: 'center', marginTop: '50px', color: '#595959' }}>
                            Tính năng đang được phát triển...
                        </div>
                    )}
                </div>

                <div className="workspace-area">
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={10} className="no-print form-container-scroll">
                            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                                <Card title={<span style={{ color: '#fff' }}>Thông tin cá nhân</span>} size="small" bordered={false} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                                    <Form layout="vertical" requiredMark={false}>
                                        <Form.Item label={<span style={{ color: '#aaa' }}>Ảnh đại diện</span>}>
                                            <Upload name="file" listType="picture-card" showUploadList={false} action="http://localhost:5279/api/Upload/image" onChange={handleCvImageUpload}>
                                                {cvData?.personalInfo?.avatar ? <img src={cvData.personalInfo.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} /> : <span style={{ color: '#aaa' }}>{imageLoading ? <LoadingOutlined /> : <PlusOutlined />}<div style={{ marginTop: 8 }}>Tải ảnh</div></span>}
                                            </Upload>
                                        </Form.Item>
                                        <Form.Item label={<span style={{ color: '#aaa' }}>Họ và Tên</span>}><Input name="fullName" value={cvData.personalInfo.fullName} onChange={handlePersonalInfoChange} style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #333' }} /></Form.Item>
                                        <Form.Item label={<span style={{ color: '#aaa' }}>Vị trí ứng tuyển</span>}><Input name="jobTitle" value={cvData.personalInfo.jobTitle} onChange={handlePersonalInfoChange} style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #333' }} /></Form.Item>
                                        <Row gutter={16}>
                                            <Col span={12}><Form.Item label={<span style={{ color: '#aaa' }}>Email</span>}><Input name="email" value={cvData.personalInfo.email} onChange={handlePersonalInfoChange} style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #333' }} /></Form.Item></Col>
                                            <Col span={12}><Form.Item label={<span style={{ color: '#aaa' }}>Số điện thoại</span>}><Input name="phone" value={cvData.personalInfo.phone} onChange={handlePersonalInfoChange} style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #333' }} /></Form.Item></Col>
                                        </Row>
                                        <Form.Item label={<span style={{ color: '#aaa' }}>Địa chỉ</span>}><Input name="address" value={cvData.personalInfo.address} onChange={handlePersonalInfoChange} style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #333' }} /></Form.Item>
                                    </Form>
                                </Card>

                                <Card title={<span style={{ color: '#fff' }}>Tóm tắt & Kỹ năng</span>} size="small" bordered={false} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                                    <Form layout="vertical">
                                        <Form.Item label={<span style={{ color: '#aaa' }}>Mục tiêu nghề nghiệp</span>}>
                                            <TextArea rows={5} name="summary" value={cvData.summary} onChange={handleTextChange} style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #333' }} />
                                        </Form.Item>
                                        <Form.Item label={<span style={{ color: '#aaa' }}>Kỹ năng & Ngoại ngữ</span>}>
                                            <TextArea rows={4} name="skills" value={cvData.skills} onChange={handleTextChange} style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #333' }} />
                                        </Form.Item>
                                    </Form>
                                </Card>

                                <Card title={<span style={{ color: '#fff' }}>Kinh nghiệm làm việc</span>} size="small" bordered={false} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                                    {cvData.experience.map((exp) => (
                                        <div key={exp.id} style={{ marginBottom: '16px', padding: '12px', border: '1px dashed #444', borderRadius: '6px', backgroundColor: '#242424' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span style={{ color: '#aaa' }}>Thời gian</span>}>
                                                    <Input value={exp.time} onChange={(e) => handleExperienceChange(exp.id, 'time', e.target.value)} style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333' }} />
                                                </Form.Item>
                                                <Form.Item label={<span style={{ color: '#aaa' }}>Công ty / Vị trí</span>}>
                                                    <Input value={exp.title} onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)} style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333' }} />
                                                </Form.Item>
                                                <Form.Item label={<span style={{ color: '#aaa' }}>Mô tả công việc</span>}>
                                                    <TextArea rows={4} value={exp.description} onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)} style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333' }} />
                                                </Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}>
                                                <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => removeExperience(exp.id)}>Xóa</Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={addExperience} style={{ color: '#1890ff', borderColor: '#444' }}>
                                        Thêm kinh nghiệm
                                    </Button>
                                </Card>
                            </Space>
                        </Col>

                        <Col xs={24} lg={14} className="print-full-width">
                            <div style={{ position: 'sticky', top: '0' }}>
                                <div
                                    className="cv-preview-page"
                                    style={{
                                        fontFamily: fontFamily,
                                        lineHeight: lineHeight,
                                        fontSize: `${computedFontSize}px`
                                    }}
                                >
                                    {/* KIỂM TRA MÃ MẪU (TEMPLATE ID) ĐỂ VẼ GIAO DIỆN TƯƠNG ỨNG */}
                                    {String(templateId) === '2' ? renderTemplate2() : renderTemplate1()}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
};

export default CvBuilder;