import React, { useState, useEffect } from 'react';
import useCvStore from '../store/useCvStore';
import apiClient from '../api/apiClient';
import LayoutManager from '../components/LayoutManager';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
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
    UndoOutlined,
    RedoOutlined,
    EyeOutlined,
    EditOutlined
} from '@ant-design/icons';

import MasterTemplate from '../components/MasterTemplate';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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
        return null;
    }
};

const CvBuilder = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const templateId = searchParams.get('templateId') || '1';
    const cvId = searchParams.get('cvId');
    const source = searchParams.get('source');
    const lang = searchParams.get('lang');
    const positionId = searchParams.get('position');

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId || null;

    const [cvTitle, setCvTitle] = useState('CV chưa đặt tên');
    const [pageLoading, setPageLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    // Mặc định mở tab Nội dung để người dùng dễ nhập liệu
    const [activeMenu, setActiveMenu] = useState('content');

    const cvData = useCvStore(state => state.cvData);
    const { fontFamily, fontSize, lineHeight, themeColor } = useCvStore(state => state.layoutSettings);

    const setInitialData = useCvStore(state => state.setInitialData);
    const updateCvData = useCvStore(state => state.updateCvData);
    const updateLayoutSetting = useCvStore(state => state.updateLayoutSetting);

    // Bảng màu giống TopCV
    const themeColors = ['#00b14f', '#1890ff', '#f5222d', '#fa8c16', '#722ed1', '#262626'];
    const fontOptions = [
        { label: 'Roboto', value: 'Roboto, sans-serif' },
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Times New Roman', value: '"Times New Roman", serif' },
        { label: 'Nunito', value: 'Nunito, sans-serif' }
    ];

    useEffect(() => {
        const initializeCvData = async () => {
            setPageLoading(true);
            try {
                if (cvId && token) {
                    // KỊCH BẢN 1: CHỈNH SỬA CV ĐÃ LƯU
                    const res = await apiClient.get(`/Cv/${cvId}`);
                    
                    // Giải pháp phòng vệ đa tầng: Tự động tương thích với mọi loại Interceptor bóc tách
                    const actualCv = res?.data ? res.data : res;
                    
                    if (actualCv) {
                        if (actualCv.tieuDe) setCvTitle(actualCv.tieuDe);
                        
                        // Tiến hành chuyển đổi chuỗi JSON thô sang Object cấu trúc bản vẽ
                        const layoutJson = actualCv.customLayoutJson 
                            ? (typeof actualCv.customLayoutJson === 'string' ? JSON.parse(actualCv.customLayoutJson) : actualCv.customLayoutJson) 
                            : null;
                            
                        const contentData = actualCv.duLieuCv 
                            ? (typeof actualCv.duLieuCv === 'string' ? JSON.parse(actualCv.duLieuCv) : actualCv.duLieuCv) 
                            : null;
                            
                        setInitialData(layoutJson, contentData);
                    }
                } else {
                    let initialContent = {};

                    // ⚡ KIỂM TRA LỰA CHỌN CỦA NGƯỜI DÙNG TỪ URL
                    if (source === 'scratch') {
                        // LỰA CHỌN 1: TỜ GIẤY TRẮNG TINH
                        initialContent = {
                            personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', address: '', avatar: '' },
                            summary: '', skills: '', experience: [], education: [], activities: [], projects: [], awards: [], certificates: [], references: [], hobbies: ''
                        };
                    }
                    else if (source === 'suggested') {
                        // LỰA CHỌN 2: BƠM DỮ LIỆU MỒI ĐÚNG CHUYÊN NGÀNH
                        initialContent = {
                            personalInfo: {
                                fullName: 'Đặng Quốc Duy',
                                jobTitle: 'Software Engineer Intern',
                                email: userInfo?.email || 'dangquocduy2004@gmail.com',
                                phone: '0123 456 789',
                                address: 'TP.HCM / Cần Thơ',
                                avatar: ''
                            },
                            summary: 'Định hướng phát triển chuyên sâu về Backend và hệ thống nhúng (Embedded). Trải qua quá trình học tập, tôi đã tích lũy kinh nghiệm làm việc với Java, .NET và quản lý mã nguồn qua GitHub. Mục tiêu của tôi là áp dụng kiến thức vào các dự án thực tế và không ngừng học hỏi để trở thành một Software Engineer toàn diện.',
                            skills: 'Ngôn ngữ: Java, C# (.NET)\nCông cụ: GitHub, Git\nĐịnh hướng: Backend, Frontend, Embedded Software',
                            experience: [],
                            education: [
                                { id: 1, time: '2022 - Hiện tại', school: 'Đại học / Học viện', major: 'Kỹ thuật phần mềm (Software Engineering)', description: '• Tham gia các khóa học chuyên sâu về thuật toán và phát triển phần mềm.' }
                            ],
                            projects: [
                                {
                                    id: 1,
                                    name: 'Thực tập chuyên ngành: Hệ thống vé rạp chiếu phim',
                                    technologies: 'Java, .NET',
                                    role: 'Backend Developer',
                                    description: '• Tham gia kiểm thử (testing) và quản lý hệ thống đặt vé đa nền tảng.\n• Tối ưu luồng dữ liệu xử lý vé cho các suất chiếu khung giờ tối (19:30 - 22:40).',
                                    link: 'https://github.com/your-profile'
                                }
                            ],
                            activities: [], awards: [], certificates: [], references: [], hobbies: 'Đọc sách, Cập nhật công nghệ mới'
                        };

                        // Nếu người dùng chọn ngôn ngữ tiếng Anh
                        if (lang === 'en') {
                            initialContent.summary = 'Software Engineering student oriented towards Backend and Embedded systems...';
                            initialContent.personalInfo.jobTitle = 'Software Engineer Intern';
                            // (Bạn có thể thêm logic dịch tiếng Anh cho các trường khác tại đây)
                        }
                    }
                    else if (source === 'upload-linkedin') {
                        // LỰA CHỌN 3: BÓC TÁCH DỮ LIỆU TỪ FILE ĐÃ TẢI LÊN
                        message.info("Hệ thống đang trích xuất dữ liệu từ CV của bạn...");
                        // Tạm thời trả về form trống cho đến khi Backend làm xong API bóc tách
                        initialContent = {
                            personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', address: '', avatar: '' },
                            summary: '', skills: '', experience: [], education: [], activities: [], projects: [], awards: [], certificates: [], references: [], hobbies: ''
                        };
                    }
                    setCvTitle(`CV_${(userInfo?.fullName || 'UngVien').replace(/\s+/g, '')}_Moi`);

                    let templateLayout = null;

                    // 👉 2. LẤY BẢN VẼ JSON TỪ DATABASE
                    if (templateId) {
                        try {
                            const templateRes = await apiClient.get(`/MauCv/${templateId}`);
                            let rawData = templateRes?.layoutJson || templateRes?.LayoutJson || templateRes?.data?.layoutJson;
                            if (rawData) {
                                try {
                                    // BƯỚC 1: Dọn dẹp ký tự ẩn (BOM) và khoảng trắng thừa do Copy/Paste
                                    if (typeof rawData === 'string') {
                                        rawData = rawData.replace(/^\uFEFF/, '').trim();
                                    }

                                    // BƯỚC 2: Dịch chuỗi thành Object
                                    let parsedData = typeof rawData === 'object' ? rawData : JSON.parse(rawData);

                                    // BƯỚC 3: Chống lỗi Double-Serialization từ Backend (.NET)
                                    if (typeof parsedData === 'string') {
                                        parsedData = JSON.parse(parsedData);
                                    }

                                    templateLayout = parsedData;
                                    console.log("✅ NẠP BẢN VẼ THÀNH CÔNG:", templateLayout);

                                } catch (parseError) {
                                    console.error("🔴 LỖI CÚ PHÁP JSON TỪ DATABASE:", parseError);
                                    console.log("CHUỖI BỊ LỖI LÀ:", rawData);
                                    alert("Mã JSON trong SQL Server bị lỗi cú pháp! Hãy mở tab Console (F12) để xem chi tiết.");
                                }
                            }
                        } catch (err) {
                            console.error("Lỗi gọi API lấy Mẫu CV:", err);
                        }
                    }

                    // 👉 3. BƠM CẢ BẢN VẼ VÀ DỮ LIỆU MỒI VÀO CỖ MÁY
                    setInitialData(templateLayout, initialContent);
                }
            } catch (err) {
                console.error("Lỗi tải CV:", err);
            } finally {
                setPageLoading(false);
            }
        };
        initializeCvData();
    }, [cvId, templateId, token, source, lang, positionId, userInfo?.fullName, userInfo?.email, setInitialData]);

    const handleCvImageUpload = (info) => {
        if (info.file.status === 'uploading') { setImageLoading(true); return; }
        if (info.file.status === 'done') {
            setImageLoading(false);
            updateCvData('personalInfo', { ...cvData.personalInfo, avatar: info.file.response.url });
            message.success('Tải ảnh thành công!');
        } else if (info.file.status === 'error') {
            setImageLoading(false); message.error('Tải ảnh thất bại!');
        }
    };

    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        updateCvData('personalInfo', { ...cvData.personalInfo, [name]: value });
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        updateCvData(name, value);
    };

    const addExperience = () => {
        const newExp = { id: Date.now(), time: '', title: '', description: '' };
        updateCvData('experience', [...cvData.experience, newExp]);
    };

    const removeExperience = (id) => {
        updateCvData('experience', cvData.experience.filter(item => item.id !== id));
    };

    const handleExperienceChange = (id, field, value) => {
        const updatedExp = cvData.experience.map(item => item.id === id ? { ...item, [field]: value } : item);
        updateCvData('experience', updatedExp);
    };

    const handleDownloadPDF = () => {
        const element = document.querySelector('.cv-preview-page');

        const opt = {
            margin: 0,
            filename: `${cvTitle || 'CV_Cua_Toi'}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        message.loading({ content: 'Đang tạo PDF...', key: 'pdf_loading' });

        html2pdf().set(opt).from(element).save().then(() => {
            message.success({ content: 'Tải PDF thành công!', key: 'pdf_loading', duration: 2 });
        }).catch(err => {
            console.error("Lỗi xuất PDF:", err);
            message.error({ content: 'Có lỗi xảy ra khi tải PDF!', key: 'pdf_loading', duration: 2 });
        });
    };

    const handleSaveCV = async () => {
        if (!token || !userId) { message.warning('Vui lòng đăng nhập tài khoản!'); navigate('/login'); return; }
        const hideLoading = message.loading('Đang xử lý lưu hồ sơ...', 0);
        try {
            const cvPageElement = document.querySelector('.cv-preview-page');
            let uploadedImageUrl = cvData.personalInfo.avatar || "";

            if (cvPageElement) {
                const canvas = await html2canvas(cvPageElement, { useCORS: true, scale: 2, logging: false });
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const formData = new FormData();
                formData.append('file', blob, 'cv_screenshot.png');
                const uploadRes = await apiClient.post('/Upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                uploadedImageUrl = uploadRes?.url || uploadRes?.data?.url || uploadRes;
            }

            const layoutJsonData = useCvStore.getState().layoutSchema;
            const contentDataToSave = useCvStore.getState().cvData;

            const payload = {
                maCv: cvId ? parseInt(cvId) : null, maUser: parseInt(userId), maMau: parseInt(templateId),
                maHex: themeColor, tieuDe: cvTitle, duLieuCv: JSON.stringify(contentDataToSave),
                customLayoutJson: JSON.stringify(layoutJsonData), isPublic: true, duongDan: uploadedImageUrl,
                fontChu: fontFamily, ngonNgu: lang || 'vi'
            };

            await apiClient.post('/Cv', payload);
            hideLoading(); message.success('Lưu hồ sơ thành công!'); navigate('/manage-cv');
        } catch (err) {
            hideLoading(); 
            const errorMessage = err.response?.data?.message || err.data?.message || 'Lỗi hệ thống khi lưu dữ liệu CV!';
            message.error(errorMessage);
        }
    };

    if (pageLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}><Spin size="large" /></div>;

    return (
        <div className="cv-builder-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#141414', overflow: 'hidden' }}>

            <style>{`
                /* HEADER TOPCV STYLE */
                .cv-builder-header { background-color: #1a1a1a; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; z-index: 10; }
                .cv-title-input { color: #fff !important; font-weight: 500; font-size: 15px; background-color: transparent !important; border: 1px solid transparent !important; padding: 4px 8px; width: 300px; transition: 0.3s; }
                .cv-title-input:hover, .cv-title-input:focus { border-color: #333 !important; background-color: #242424 !important; border-radius: 4px; }
                
                .builder-body { display: flex; flex: 1; height: calc(100vh - 65px); overflow: hidden; }
                
                /* SIDEBAR TOPCV STYLE */
                .sidebar-menu { width: 90px; min-width: 90px; flex-shrink: 0; background-color: #1a1a1a; border-right: 1px solid #333; display: flex; flex-direction: column; align-items: center; padding-top: 16px; }
                .menu-btn { width: 100%; height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a6a6a6; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; }
                .menu-btn:hover { background-color: #242424; color: #fff; }
                .menu-btn.active { background-color: rgba(0, 177, 79, 0.1); color: #00b14f; border-left: 3px solid #00b14f; }
                .menu-btn .anticon { font-size: 22px; margin-bottom: 6px; }
                .menu-btn span { font-size: 11px; text-align: center; font-weight: 500; }

                /* SETTINGS / CONTENT PANEL */
                .settings-panel { width: 380px; min-width: 380px; background-color: #1f1f1f; border-right: 1px solid #333; display: flex; flex-direction: column; transition: all 0.3s ease; }
                .settings-panel.hidden { width: 0; min-width: 0; border: none; overflow: hidden; }
                .panel-header { padding: 16px 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
                .panel-content { flex: 1; overflow-y: auto; padding: 20px; }
                .panel-content::-webkit-scrollbar { width: 6px; }
                .panel-content::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }

                /* WORKSPACE (CV PREVIEW) */
                .workspace-area { flex: 1; background-color: #0f0f0f; overflow-y: auto; display: flex; justify-content: center; align-items: flex-start; padding: 40px; }
                .workspace-area::-webkit-scrollbar { width: 8px; }
                .workspace-area::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
                
                .cv-preview-page { background-color: #ffffff !important; width: 210mm; min-height: 297mm; border-radius: 4px; box-shadow: 0 12px 48px rgba(0,0,0,0.6); color: #333; overflow: hidden; flex-shrink: 0; }
                
                /* CUSTOM FORMS & SLIDERS */
                .custom-form-label { color: #a6a6a6 !important; font-size: 13px; margin-bottom: 4px; display: block; }
                .custom-input { background-color: #141414 !important; color: #fff !important; border: 1px solid #333 !important; border-radius: 6px; }
                .custom-input:focus { border-color: #00b14f !important; box-shadow: none !important; }
                
                .color-circle { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; display: inline-block; }
                .color-circle:hover { transform: scale(1.1); }
                .color-circle.active { border-color: #fff; box-shadow: 0 0 0 2px #00b14f; }
            `}</style>

            {/* HEADER */}
            <div className="cv-builder-header no-print">
                <Space size="middle" align="center">
                    <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#8c8c8c' }} onClick={() => navigate('/manage-cv')} />
                    <Space size="small">
                        <FileTextFilled style={{ color: '#00b14f', fontSize: '20px' }} />
                        <Input className="cv-title-input" value={cvTitle} onChange={(e) => setCvTitle(e.target.value)} placeholder="Tên CV..." />
                    </Space>
                </Space>
                <Space size="middle">
                    <Tooltip title="Hoàn tác"><Button type="text" icon={<UndoOutlined />} style={{ color: '#8c8c8c' }} /></Tooltip>
                    <Tooltip title="Làm lại"><Button type="text" icon={<RedoOutlined />} style={{ color: '#8c8c8c' }} /></Tooltip>
                    <Button type="default" icon={<EyeOutlined />} style={{ backgroundColor: '#242424', borderColor: '#333', color: '#fff' }}>Xem trước</Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}>Tải PDF</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveCV} style={{ backgroundColor: '#00b14f', borderColor: '#00b14f', fontWeight: 500 }}>Lưu CV</Button>
                </Space>
            </div>

            <div className="builder-body">
                {/* SIDEBAR */}
                <div className="sidebar-menu no-print">
                    <div className={`menu-btn ${activeMenu === 'design' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'design' ? null : 'design')}>
                        <FormatPainterOutlined /><span>Thiết kế & Font</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'content' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'content' ? null : 'content')}>
                        <EditOutlined /><span>Nội dung CV</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'layout' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'layout' ? null : 'layout')}>
                        <LayoutOutlined /><span>Bố cục</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'templates' ? 'active' : ''}`} onClick={() => navigate('/thu-vien-cv')}>
                        <SwapOutlined /><span>Đổi mẫu CV</span>
                    </div>
                </div>

                {/* SETTINGS / CONTENT PANEL */}
                <div className={`settings-panel no-print ${!activeMenu ? 'hidden' : ''}`}>
                    {activeMenu && (
                        <div className="panel-header">
                            <Title level={5} style={{ color: '#fff', margin: 0 }}>
                                {activeMenu === 'design' && 'Thiết kế & Font'}
                                {activeMenu === 'content' && 'Chỉnh sửa Nội dung'}
                                {activeMenu === 'layout' && 'Quản lý Bố cục'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} style={{ color: '#8c8c8c' }} onClick={() => setActiveMenu(null)} />
                        </div>
                    )}

                    <div className="panel-content">
                        {/* TAB 1: THIẾT KẾ */}
                        {activeMenu === 'design' && (
                            <div>
                                <div style={{ marginBottom: '24px' }}>
                                    <span className="custom-form-label">FONT CHỮ</span>
                                    <Select value={fontFamily} onChange={(val) => updateLayoutSetting && updateLayoutSetting('fontFamily', val)} style={{ width: '100%' }} dropdownStyle={{ backgroundColor: '#242424', color: '#fff' }} className="custom-input">
                                        {fontOptions.map(font => <Option key={font.value} value={font.value}><span style={{ fontFamily: font.value }}>{font.label}</span></Option>)}
                                    </Select>
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <span className="custom-form-label">CỠ CHỮ</span>
                                    <Slider min={0} max={100} value={fontSize} onChange={(val) => updateLayoutSetting && updateLayoutSetting('fontSize', val)} tooltip={{ formatter: null }} trackStyle={{ backgroundColor: '#00b14f' }} handleStyle={{ borderColor: '#00b14f' }} />
                                </div>
                                <div style={{ marginBottom: '32px' }}>
                                    <span className="custom-form-label">KHOẢNG CÁCH DÒNG</span>
                                    <Slider min={1.0} max={2.0} step={0.1} value={lineHeight} onChange={(val) => updateLayoutSetting && updateLayoutSetting('lineHeight', val)} tooltip={{ formatter: null }} trackStyle={{ backgroundColor: '#00b14f' }} handleStyle={{ borderColor: '#00b14f' }} />
                                </div>
                                <div>
                                    <span className="custom-form-label" style={{ marginBottom: '12px' }}>MÀU CHỦ ĐỀ</span>
                                    <Space size="middle" wrap>
                                        {themeColors.map(color => (
                                            <div key={color} className={`color-circle ${themeColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => updateLayoutSetting && updateLayoutSetting('themeColor', color)} />
                                        ))}
                                    </Space>

                                    {/* Khối gradient màu sắc mô phỏng TopCV */}
                                    <div style={{ marginTop: '20px', height: '150px', borderRadius: '8px', background: 'linear-gradient(to right, #00b14f, #1890ff)', position: 'relative', border: '1px solid #333' }}>
                                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', color: '#fff', fontSize: '12px', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>Tùy chỉnh màu</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: NỘI DUNG CV (Đưa cụm Form cũ vào đây) */}
                        {activeMenu === 'content' && (
                            <Space direction="vertical" size="large" style={{ display: 'flex' }}>
                                <Card title={<span style={{ color: '#fff' }}>Thông tin cá nhân</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    <Form layout="vertical" requiredMark={false}>
                                        <Form.Item label={<span className="custom-form-label">Ảnh đại diện</span>}>
                                            <Upload 
                                                name="file" 
                                                listType="picture-card" 
                                                showUploadList={false} 
                                                action="http://localhost:5279/api/Upload/image" 
                                                headers={{
                                                    Authorization: `Bearer ${localStorage.getItem('token')}`
                                                }}
                                                
                                                onChange={handleCvImageUpload}
                                            >
                                                {cvData?.personalInfo?.avatar ? (
                                                    <img src={cvData.personalInfo.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                                ) : (
                                                    <span style={{ color: '#a6a6a6' }}>
                                                        {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
                                                        <div style={{ marginTop: 8 }}>Tải ảnh</div>
                                                    </span>
                                                )}
                                            </Upload>
                                        </Form.Item>
                                        <Form.Item label={<span className="custom-form-label">Họ và Tên</span>}><Input name="fullName" value={cvData.personalInfo.fullName} onChange={handlePersonalInfoChange} className="custom-input" /></Form.Item>
                                        <Form.Item label={<span className="custom-form-label">Vị trí ứng tuyển</span>}><Input name="jobTitle" value={cvData.personalInfo.jobTitle} onChange={handlePersonalInfoChange} className="custom-input" /></Form.Item>
                                        <Form.Item label={<span className="custom-form-label">Email</span>}><Input name="email" value={cvData.personalInfo.email} onChange={handlePersonalInfoChange} className="custom-input" /></Form.Item>
                                        <Form.Item label={<span className="custom-form-label">Số điện thoại</span>}><Input name="phone" value={cvData.personalInfo.phone} onChange={handlePersonalInfoChange} className="custom-input" /></Form.Item>
                                        <Form.Item label={<span className="custom-form-label">Địa chỉ</span>}><Input name="address" value={cvData.personalInfo.address} onChange={handlePersonalInfoChange} className="custom-input" /></Form.Item>
                                    </Form>
                                </Card>

                                <Card title={<span style={{ color: '#fff' }}>Tóm tắt & Kỹ năng</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    <Form layout="vertical">
                                        <Form.Item label={<span className="custom-form-label">Mục tiêu nghề nghiệp</span>}>
                                            <TextArea rows={5} name="summary" value={cvData.summary} onChange={handleTextChange} className="custom-input" />
                                        </Form.Item>
                                        <Form.Item label={<span className="custom-form-label">Kỹ năng & Ngoại ngữ</span>}>
                                            <TextArea rows={4} name="skills" value={cvData.skills} onChange={handleTextChange} className="custom-input" />
                                        </Form.Item>
                                    </Form>
                                </Card>

                                <Card title={<span style={{ color: '#fff' }}>Kinh nghiệm làm việc</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    {cvData.experience.map((exp) => (
                                        <div key={exp.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span className="custom-form-label">Thời gian</span>}><Input value={exp.time} onChange={(e) => handleExperienceChange(exp.id, 'time', e.target.value)} className="custom-input" /></Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Công ty / Vị trí</span>}><Input value={exp.title} onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)} className="custom-input" /></Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Mô tả công việc</span>}><TextArea rows={4} value={exp.description} onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)} className="custom-input" /></Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => removeExperience(exp.id)}>Xóa</Button></div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={addExperience} style={{ color: '#00b14f', borderColor: '#00b14f', backgroundColor: 'rgba(0,177,79,0.1)' }}>Thêm kinh nghiệm</Button>
                                </Card>
                                <Card title={<span style={{ color: '#fff' }}>Học vấn</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    {(cvData.education || []).map((edu) => (
                                        <div key={edu.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span className="custom-form-label">Thời gian</span>}>
                                                    <Input value={edu.time} onChange={(e) => {
                                                        const updated = cvData.education.map(item => item.id === edu.id ? { ...item, time: e.target.value } : item);
                                                        updateCvData('education', updated);
                                                    }} className="custom-input" placeholder="Ví dụ: 09/2022 - Hiện tại" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Trường / Trung tâm</span>}>
                                                    <Input value={edu.school} onChange={(e) => {
                                                        const updated = cvData.education.map(item => item.id === edu.id ? { ...item, school: e.target.value } : item);
                                                        updateCvData('education', updated);
                                                    }} className="custom-input" placeholder="Ví dụ: Đại học Công nghệ thông tin" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Chuyên ngành</span>}>
                                                    <Input value={edu.major} onChange={(e) => {
                                                        const updated = cvData.education.map(item => item.id === edu.id ? { ...item, major: e.target.value } : item);
                                                        updateCvData('education', updated);
                                                    }} className="custom-input" placeholder="Ví dụ: Kỹ thuật phần mềm (Software Engineering)" />
                                                </Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => updateCvData('education', cvData.education.filter(item => item.id !== edu.id))}>Xóa</Button></div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateCvData('education', [...(cvData.education || []), { id: Date.now(), time: '', school: '', major: '', description: '' }])} style={{ color: '#00b14f', borderColor: '#00b14f', backgroundColor: 'rgba(0,177,79,0.1)' }}>Thêm học vấn</Button>
                                </Card>

                                {/* 👉 FORM DỰ ÁN */}
                                <Card title={<span style={{ color: '#fff' }}>Dự án</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    {(cvData.projects || []).map((proj) => (
                                        <div key={proj.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span className="custom-form-label">Tên dự án</span>}>
                                                    <Input value={proj.name} onChange={(e) => {
                                                        const updated = cvData.projects.map(item => item.id === proj.id ? { ...item, name: e.target.value } : item);
                                                        updateCvData('projects', updated);
                                                    }} className="custom-input" placeholder="Ví dụ: Hệ thống quản lý vé rạp chiếu phim (Thực tập chuyên ngành)" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Công nghệ sử dụng</span>}>
                                                    <Input value={proj.technologies} onChange={(e) => {
                                                        const updated = cvData.projects.map(item => item.id === proj.id ? { ...item, technologies: e.target.value } : item);
                                                        updateCvData('projects', updated);
                                                    }} className="custom-input" placeholder="Ví dụ: Java, .NET, GitHub, Backend" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Vị trí ứng tuyển / Khu vực</span>}>
                                                    <Input value={proj.role} onChange={(e) => {
                                                        const updated = cvData.projects.map(item => item.id === proj.id ? { ...item, role: e.target.value } : item);
                                                        updateCvData('projects', updated);
                                                    }} className="custom-input" placeholder="Ví dụ: .NET Intern - Khu vực TP.HCM / Cần Thơ" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Mô tả chi tiết</span>}>
                                                    <TextArea rows={3} value={proj.description} onChange={(e) => {
                                                        const updated = cvData.projects.map(item => item.id === proj.id ? { ...item, description: e.target.value } : item);
                                                        updateCvData('projects', updated);
                                                    }} className="custom-input" />
                                                </Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => updateCvData('projects', cvData.projects.filter(item => item.id !== proj.id))}>Xóa</Button></div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateCvData('projects', [...(cvData.projects || []), { id: Date.now(), name: '', technologies: '', role: '', description: '', link: '' }])} style={{ color: '#00b14f', borderColor: '#00b14f', backgroundColor: 'rgba(0,177,79,0.1)' }}>Thêm dự án</Button>
                                </Card>
                                {/* 👉 FORM HOẠT ĐỘNG */}
                                <Card title={<span style={{ color: '#fff' }}>Hoạt động</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    {(cvData.activities || []).map((act) => (
                                        <div key={act.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span className="custom-form-label">Thời gian</span>}>
                                                    <Input value={act.time} onChange={(e) => updateCvData('activities', cvData.activities.map(item => item.id === act.id ? { ...item, time: e.target.value } : item))} className="custom-input" placeholder="Ví dụ: 03/2024 - Hiện tại" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Tổ chức / Sự kiện</span>}>
                                                    <Input value={act.organization} onChange={(e) => updateCvData('activities', cvData.activities.map(item => item.id === act.id ? { ...item, organization: e.target.value } : item))} className="custom-input" placeholder="Ví dụ: CLB Tin học sinh viên TP.HCM hoặc Cần Thơ" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Vai trò</span>}>
                                                    <Input value={act.role} onChange={(e) => updateCvData('activities', cvData.activities.map(item => item.id === act.id ? { ...item, role: e.target.value } : item))} className="custom-input" placeholder="Ví dụ: Thành viên Ban Kỹ thuật" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Mô tả chi tiết</span>}>
                                                    <TextArea rows={3} value={act.description} onChange={(e) => updateCvData('activities', cvData.activities.map(item => item.id === act.id ? { ...item, description: e.target.value } : item))} className="custom-input" />
                                                </Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => updateCvData('activities', cvData.activities.filter(item => item.id !== act.id))}>Xóa</Button></div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateCvData('activities', [...(cvData.activities || []), { id: Date.now(), time: '', organization: '', role: '', description: '' }])} style={{ color: '#00b14f', borderColor: '#00b14f', backgroundColor: 'rgba(0,177,79,0.1)' }}>Thêm hoạt động</Button>
                                </Card>

                                {/* 👉 FORM GIẢI THƯỞNG */}
                                <Card title={<span style={{ color: '#fff' }}>Danh hiệu & Giải thưởng</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    {(cvData.awards || []).map((award) => (
                                        <div key={award.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span className="custom-form-label">Thời gian</span>}>
                                                    <Input value={award.time} onChange={(e) => updateCvData('awards', cvData.awards.map(item => item.id === award.id ? { ...item, time: e.target.value } : item))} className="custom-input" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Tên giải thưởng</span>}>
                                                    <Input value={award.name} onChange={(e) => updateCvData('awards', cvData.awards.map(item => item.id === award.id ? { ...item, name: e.target.value } : item))} className="custom-input" placeholder="Ví dụ: Giải Nhất Hackathon 2025" />
                                                </Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => updateCvData('awards', cvData.awards.filter(item => item.id !== award.id))}>Xóa</Button></div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateCvData('awards', [...(cvData.awards || []), { id: Date.now(), time: '', name: '' }])} style={{ color: '#00b14f', borderColor: '#00b14f', backgroundColor: 'rgba(0,177,79,0.1)' }}>Thêm giải thưởng</Button>
                                </Card>

                                {/* 👉 FORM CHỨNG CHỈ */}
                                <Card title={<span style={{ color: '#fff' }}>Chứng chỉ</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    {(cvData.certificates || []).map((cert) => (
                                        <div key={cert.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span className="custom-form-label">Thời gian</span>}>
                                                    <Input value={cert.time} onChange={(e) => updateCvData('certificates', cvData.certificates.map(item => item.id === cert.id ? { ...item, time: e.target.value } : item))} className="custom-input" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Tên chứng chỉ</span>}>
                                                    <Input value={cert.name} onChange={(e) => updateCvData('certificates', cvData.certificates.map(item => item.id === cert.id ? { ...item, name: e.target.value } : item))} className="custom-input" placeholder="Ví dụ: TOEIC 800, AWS Certified Developer" />
                                                </Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => updateCvData('certificates', cvData.certificates.filter(item => item.id !== cert.id))}>Xóa</Button></div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateCvData('certificates', [...(cvData.certificates || []), { id: Date.now(), time: '', name: '' }])} style={{ color: '#00b14f', borderColor: '#00b14f', backgroundColor: 'rgba(0,177,79,0.1)' }}>Thêm chứng chỉ</Button>
                                </Card>

                                {/* 👉 FORM NGƯỜI GIỚI THIỆU */}
                                <Card title={<span style={{ color: '#fff' }}>Người giới thiệu</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    {(cvData.references || []).map((ref) => (
                                        <div key={ref.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                                            <Form layout="vertical" size="small">
                                                <Form.Item label={<span className="custom-form-label">Họ tên người giới thiệu</span>}>
                                                    <Input value={ref.name} onChange={(e) => updateCvData('references', cvData.references.map(item => item.id === ref.id ? { ...item, name: e.target.value } : item))} className="custom-input" placeholder="Ví dụ: Anh Nguyễn Văn A" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Chức vụ / Công ty</span>}>
                                                    <Input value={ref.position} onChange={(e) => updateCvData('references', cvData.references.map(item => item.id === ref.id ? { ...item, position: e.target.value } : item))} className="custom-input" placeholder="Ví dụ: Quản lý dự án hệ thống vé rạp chiếu phim" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Số điện thoại</span>}>
                                                    <Input value={ref.phone} onChange={(e) => updateCvData('references', cvData.references.map(item => item.id === ref.id ? { ...item, phone: e.target.value } : item))} className="custom-input" />
                                                </Form.Item>
                                                <Form.Item label={<span className="custom-form-label">Email</span>}>
                                                    <Input value={ref.email} onChange={(e) => updateCvData('references', cvData.references.map(item => item.id === ref.id ? { ...item, email: e.target.value } : item))} className="custom-input" />
                                                </Form.Item>
                                            </Form>
                                            <div style={{ textAlign: 'right' }}><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => updateCvData('references', cvData.references.filter(item => item.id !== ref.id))}>Xóa</Button></div>
                                        </div>
                                    ))}
                                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateCvData('references', [...(cvData.references || []), { id: Date.now(), name: '', position: '', phone: '', email: '' }])} style={{ color: '#00b14f', borderColor: '#00b14f', backgroundColor: 'rgba(0,177,79,0.1)' }}>Thêm người giới thiệu</Button>
                                </Card>

                                {/* 👉 FORM SỞ THÍCH */}
                                <Card title={<span style={{ color: '#fff' }}>Sở thích</span>} size="small" bordered={false} style={{ backgroundColor: '#242424', borderRadius: '8px' }}>
                                    <Form layout="vertical">
                                        <TextArea rows={3} value={cvData.hobbies} onChange={(e) => updateCvData('hobbies', e.target.value)} className="custom-input" placeholder="Ví dụ: Đọc sách công nghệ, Thể thao..." />
                                    </Form>
                                </Card>
                            </Space>
                        )}

                        {/* TAB 3: BỐ CỤC (Kéo thả) */}
                        {activeMenu === 'layout' && (
                            <LayoutManager />
                        )}
                    </div>
                </div>

                {/* WORKSPACE - NƠI HIỂN THỊ CV */}
                <div className="workspace-area">
                    <div className="cv-preview-page">
                        <MasterTemplate />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CvBuilder;