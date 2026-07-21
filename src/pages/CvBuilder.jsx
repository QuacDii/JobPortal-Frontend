// src/Pages/candidate/CvBuilder.jsx
import React, { useState, useEffect } from 'react';
import useCvStore from '../store/useCvStore';
import apiClient from '../api/apiClient';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfigProvider, theme, Input, Typography, Button, Space, message, Spin, Select, Slider, Tooltip } from 'antd';
import {
    DownloadOutlined,
    SaveOutlined,
    ArrowLeftOutlined,
    FileTextFilled,
    FormatPainterOutlined,
    PlusSquareOutlined,
    LayoutOutlined,
    SwapOutlined,
    CloseOutlined,
    UndoOutlined,
    RedoOutlined,
    EyeOutlined,
    BulbOutlined,
    BookOutlined,
    CheckOutlined
} from '@ant-design/icons';

import MasterTemplate from '../components/MasterTemplate';

const { Title } = Typography;
const { Option } = Select;

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

const cvDictionary = {
    "Học vấn": { vi: "Học vấn", en: "Education" },
    "Kỹ năng": { vi: "Kỹ năng", en: "Skills" },
    "Sở thích": { vi: "Sở thích", en: "Hobbies" },
    "Mục tiêu nghề nghiệp": { vi: "Mục tiêu nghề nghiệp", en: "Career Objective" },
    "Kinh nghiệm làm việc": { vi: "Kinh nghiệm làm việc", en: "Work Experience" },
    "Danh hiệu và giải thưởng": { vi: "Danh hiệu và giải thưởng", en: "Honors & Awards" },
    "Chứng chỉ": { vi: "Chứng chỉ", en: "Certificates" },
    "Hoạt động": { vi: "Hoạt động", en: "Activities" },
    "Giới tính": { vi: "Giới tính", en: "Sex" },
    "Dự án": { vi: "Dự án", en: "Projects" },
    "Vị trí ứng tuyển": { vi: "Vị trí ứng tuyển", en: "Target Position" },
    "Ngày sinh": { vi: "Ngày sinh", en: "Date of Birth" },
    "Ngành học / Môn học": { vi: "Ngành học / Môn học", en: "Major / Field of Study" },
    "Bắt đầu": { vi: "Bắt đầu", en: "Start Date" },
    "Kết thúc": { vi: "Kết thúc", en: "End Date" },
    "Tên trường học": { vi: "Tên trường học", en: "School / University Name" },
    "Mô tả quá trình học tập...": { vi: "Mô tả quá trình học tập...", en: "Describe your education process..." },
    "Tên kỹ năng": { vi: "Tên kỹ năng", en: "Skill Name" },
    "Sở thích của bạn...": { vi: "Sở thích của bạn...", en: "Your hobbies..." },
    "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn...": { vi: "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn...", en: "Your career objectives, including short-term and long-term goals..." },
    "Vị trí công việc": { vi: "Vị trí công việc", en: "Job Title / Position" },
    "Tên công ty": { vi: "Tên công ty", en: "Company Name" },
    "Mô tả công việc...": { vi: "Mô tả công việc...", en: "Job description..." },
    "Thời gian": { vi: "Thời gian", en: "Timeline / Period" },
    "Tên giải thưởng": { vi: "Tên giải thưởng", en: "Award Name" },
    "Tên chứng chỉ": { vi: "Tên chứng chỉ", en: "Certificate Name" },
    "Vị trí của bạn": { vi: "Vị trí của bạn", en: "Your Role" },
    "Tên tổ chức": { vi: "Tên tổ chức", en: "Organization Name" },
    "Mô tả hoạt động...": { vi: "Mô tả hoạt động...", en: "Describe your activities..." },
    "Vị trí của bạn trong dự án": { vi: "Vị trí của bạn trong dự án", en: "Your role in the project" },
    "Tên dự án": { vi: "Tên dự án", en: "Project Name" },
    "Mô tả ngắn gọn về dự án...": { vi: "Mô tả ngắn gọn về dự án...", en: "Brief description of the project..." }
};

const translateText = (text, targetLang) => {
    if (!text) return text;
    const entry = Object.values(cvDictionary).find(item => item.vi === text || item.en === text);
    return entry ? entry[targetLang] : text;
};

const translateLayoutTree = (node, targetLang) => {
    if (!node) return null;
    const newNode = { ...node, styles: { ...node.styles } };
    if (newNode.content) newNode.content = translateText(newNode.content, targetLang);
    if (newNode.placeholder) newNode.placeholder = translateText(newNode.placeholder, targetLang);
    if (newNode.children) {
        newNode.children = newNode.children.map(child => translateLayoutTree(child, targetLang));
    }
    if (newNode.itemTemplate) {
        newNode.itemTemplate = translateLayoutTree(newNode.itemTemplate, targetLang);
    }
    return newNode;
};

const CvBuilder = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const templateId = searchParams.get('templateId') || '1';
    const cvId = searchParams.get('cvId');
    const source = searchParams.get('source');
    
    // 🌟 MỚI: Bắt tín hiệu mã màu được truyền sang từ URL tĩnh (?color=#...)
    const colorParam = searchParams.get('color');

    const [lang, setLang] = useState(searchParams.get('lang') || 'vi');

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId || null;

    const [cvTitle, setCvTitle] = useState('CV chưa đặt tên');
    const [pageLoading, setPageLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState('design');

    const cvData = useCvStore(state => state.cvData);
    const { fontFamily, fontSize, lineHeight, themeColor, backgroundStyle } = useCvStore(state => state.layoutSettings || {});

    const setInitialData = useCvStore(state => state.setInitialData);
    const updateLayoutSetting = useCvStore(state => state.updateLayoutSetting);

    const themeColors = ['#574040', '#4e7b8b', '#4e8b7d', '#518b4e', '#6f4e8b', '#8b4e4e'];

    const fontOptions = [
        { label: 'Be Vietnam Pro', value: '"Be Vietnam Pro", sans-serif' },
        { label: 'Roboto', value: 'Roboto, sans-serif' },
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Nunito', value: 'Nunito, sans-serif' }
    ];

    const fontSizeMarks = {
        12: 'Nhỏ',
        14: { style: { color: '#00b14f' }, label: 'Trung bình' },
        17: 'Siêu lớn'
    };

    const lineHeightMarks = {
        1.0: '1.0', 1.15: '', 1.3: '', 1.45: '', 1.6: '', 1.75: '', 1.9: '', 2.0: '2.0'
    };

    const bgPatterns = [
        { id: 'none', name: 'Mặc định', value: 'none', css: '#141414' },
        { id: 'pt1', name: 'Gradient Classic', value: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', css: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
        { id: 'pt2', name: 'Dark Abstract', value: 'linear-gradient(to right, #243b55, #141e30)', css: 'linear-gradient(to right, #243b55, #141e30)' },
        { id: 'pt3', name: 'Deep Purple', value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', css: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
        { id: 'pt4', name: 'Premium Mesh', value: 'linear-gradient(45deg, #859398 0%, #283048 100%)', css: 'linear-gradient(45deg, #859398 0%, #283048 100%)' },
        { id: 'pt5', name: 'Cyberpunk Dark', value: 'linear-gradient(60deg, #29323c 0%, #485563 100%)', css: 'linear-gradient(60deg, #29323c 0%, #485563 100%)' },
        { id: 'pt6', name: 'Luxury Wine', value: 'linear-gradient(135deg, #e65245 0%, #240b36 100%)', css: 'linear-gradient(135deg, #e65245 0%, #240b36 100%)' },
        { id: 'pt7', name: 'Soft Dark', value: 'linear-gradient(to top, #1e3c72 0%, #1e3c72 1%, #111111 100%)', css: 'linear-gradient(to top, #1e3c72 0%, #1e3c72 1%, #111111 100%)' }
    ];

    useEffect(() => {
        const initializeCvData = async () => {
            setPageLoading(true);
            try {
                if (cvId && token) {
                    // 1. LUỒNG TẢI LẠI CV ĐÃ LƯU CŨ
                    const res = await apiClient.get(`/Cv/${cvId}`);
                    const actualCv = res?.data ? res.data : res;

                    if (actualCv) {
                        if (actualCv.tieuDe) setCvTitle(actualCv.tieuDe);
                        if (actualCv.maHex || actualCv.MaHex) {
                            updateLayoutSetting('themeColor', actualCv.maHex || actualCv.MaHex);
                        }
                        const layoutJson = actualCv.customLayoutJson
                            ? (typeof actualCv.customLayoutJson === 'string' ? JSON.parse(actualCv.customLayoutJson) : actualCv.customLayoutJson)
                            : null;
                        const contentData = actualCv.duLieuCv
                            ? (typeof actualCv.duLieuCv === 'string' ? JSON.parse(actualCv.duLieuCv) : actualCv.duLieuCv)
                            : null;

                        setInitialData(layoutJson, contentData);
                    }
                } else {
                    // 2. LUỒNG KHỞI TẠO MỘT MẪU CV MỚI TINH
                    let initialContent = {
                        personalInfo: {
                            fullName: userInfo?.fullName || '', jobTitle: '', email: userInfo?.email || '',
                            phone: '', address: '', avatar: '', dob: '', website: ''
                        },
                        summary: '', skills: [{ name: '' }, { name: '' }, { name: '' }], experience: [],
                        education: [{ id: 1, startDate: '', endDate: '', school: '', major: '', description: '' }],
                        projects: [], activities: [], awards: [], certificates: [], hobbies: ''
                    };
                    setCvTitle(`CV_${(userInfo?.fullName || 'UngVien').replace(/\s+/g, '')}_Moi`);

                    let templateLayout = null;
                    if (templateId) {
                        try {
                            const templateRes = await apiClient.get(`/MauCv/${templateId}`);
                            const actualTemplate = templateRes?.data ? templateRes.data : templateRes;

                            // 🌟 ĐÃ SỬA: Ưu tiên mã màu người dùng chọn từ URL trước, nếu không có mới lấy màu DB mặc định
                            const defaultColor = colorParam || actualTemplate?.colors?.[0] || (templateId === '3' ? '#574040' : '#00b14f');
                            updateLayoutSetting('themeColor', defaultColor);

                            let rawData = actualTemplate?.layoutJson || actualTemplate?.LayoutJson;
                            if (rawData) {
                                if (typeof rawData === 'string') rawData = rawData.replace(/^\uFEFF/, '').trim();
                                let parsedData = typeof rawData === 'object' ? rawData : JSON.parse(rawData);
                                if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);
                                templateLayout = parsedData;
                            }
                        } catch (err) {
                            console.error("Lỗi gọi API hoặc định dạng JSON:", err);
                        }
                    }
                    setInitialData(templateLayout, initialContent);
                }
            } catch (err) {
                console.error("Lỗi tải CV:", err);
            } finally {
                setPageLoading(false);
            }
        };
        initializeCvData();
    }, [cvId, templateId, token, source, userInfo?.fullName, userInfo?.email, setInitialData, colorParam]);

    const handleLanguageToggle = (selectedLang) => {
        setLang(selectedLang);
        setSearchParams({ templateId, source, lang: selectedLang, ...(colorParam && { color: colorParam }) });
        const currentLayout = useCvStore.getState().layoutSchema;
        if (currentLayout) {
            const translatedLayout = translateLayoutTree(currentLayout, selectedLang);
            setInitialData(translatedLayout, cvData);
        }
        message.success(`Đã chuyển đổi cấu trúc ngôn ngữ: ${selectedLang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}`);
    };

    const handleDownloadPDF = () => {
        const element = document.querySelector('.cv-preview-page');
        const opt = {
            margin: 0, filename: `${cvTitle || 'CV_Cua_Toi'}.pdf`, image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        message.loading({ content: 'Đang tạo PDF...', key: 'pdf_loading' });
        html2pdf().set(opt).from(element).save().then(() => {
            message.success({ content: 'Tải PDF thành công!', key: 'pdf_loading', duration: 2 });
        }).catch(err => {
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
                fontChu: fontFamily, ngonNgu: lang
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
                .cv-builder-header { background-color: #1a1a1a; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; z-index: 10; }
                .cv-title-input { color: #fff !important; font-weight: 500; font-size: 15px; background-color: transparent !important; border: 1px solid transparent !important; padding: 4px 8px; width: 300px; transition: 0.3s; }
                .cv-title-input:hover, .cv-title-input:focus { border-color: #333 !important; background-color: #242424 !important; border-radius: 4px; }
                .builder-body { display: flex; flex: 1; height: calc(100vh - 65px); overflow: hidden; }
                .sidebar-menu { width: 90px; min-width: 90px; flex-shrink: 0; background-color: #1a1a1a; border-right: 1px solid #333; display: flex; flex-direction: column; align-items: center; padding-top: 16px; overflow-y: auto; }
                .sidebar-menu::-webkit-scrollbar { display: none; }
                .menu-btn { width: 100%; height: 75px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a6a6a6; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; }
                .menu-btn:hover { background-color: #242424; color: #fff; }
                .menu-btn.active { background-color: rgba(0, 177, 79, 0.1); color: #00b14f; border-left: 3px solid #00b14f; }
                .menu-btn .anticon { font-size: 20px; margin-bottom: 6px; }
                .menu-btn span { font-size: 11px; text-align: center; font-weight: 500; }
                .settings-panel { width: 340px; min-width: 340px; background-color: #1f1f1f; border-right: 1px solid #333; display: flex; flex-direction: column; transition: all 0.3s ease; }
                .settings-panel.hidden { width: 0; min-width: 0; border: none; overflow: hidden; }
                .panel-header { padding: 16px 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
                .panel-content { flex: 1; overflow-y: auto; padding: 20px; }
                .panel-content::-webkit-scrollbar { width: 6px; }
                .panel-content::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
                .workspace-area { flex: 1; background-color: #0f0f0f; overflow-y: auto; display: flex; justify-content: center; align-items: flex-start; padding: 40px; }
                .cv-preview-page { background-color: #ffffff !important; color: #333333 !important; color-scheme: light !important; width: 210mm; min-height: 297mm; border-radius: 4px; box-shadow: 0 12px 48px rgba(0,0,0,0.6); overflow: hidden; flex-shrink: 0; position: relative; }
                .cv-preview-page * { color-scheme: light !important; }
                .custom-form-label { color: #a6a6a6 !important; font-size: 12px; margin-bottom: 10px; display: block; font-weight: bold; text-transform: uppercase;}
                .custom-input { background-color: #141414 !important; color: #fff !important; border: 1px solid #333 !important; border-radius: 6px; }
                .custom-input:focus { border-color: #00b14f !important; box-shadow: none !important; }
                .color-circle { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; display: inline-block; }
                .color-circle:hover { transform: scale(1.1); }
                .color-circle.active { border-color: #fff; box-shadow: 0 0 0 2px #00b14f; }
                .topcv-lang-button { background: #262626; border: 1px solid #434343; color: #a6a6a6; font-weight: 500; padding: 6px 16px; border-radius: 4px; cursor: pointer; transition: all 0.15s; }
                .topcv-lang-button:hover { color: #fff; border-color: #595959; }
                .topcv-lang-button.active { background: rgba(0, 177, 79, 0.08); border-color: #00b14f; color: #00b14f; }
                .bg-pattern-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
                .bg-pattern-item { height: 75px; border-radius: 4px; cursor: pointer; position: relative; border: 2px solid transparent; overflow: hidden; transition: 0.15s; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
                .bg-pattern-item:hover { transform: translateY(-2px); }
                .bg-pattern-item.active { border-color: #00b14f; }
                .bg-pattern-check-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; color: #00b14f; font-size: 18px; font-weight: bold; }
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
                    <div className={`menu-btn ${activeMenu === 'add-section' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'add-section' ? null : 'add-section')}>
                        <PlusSquareOutlined /><span>Thêm mục</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'layout' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'layout' ? null : 'layout')}>
                        <LayoutOutlined /><span>Bố cục</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'change-template' ? 'active' : ''}`} onClick={() => navigate('/thu-vien-cv')}>
                        <SwapOutlined /><span>Đổi mẫu CV</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'tips' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'tips' ? null : 'tips')}>
                        <BulbOutlined /><span>Gợi ý viết CV</span>
                    </div>
                    <div className="menu-btn" onClick={() => navigate('/thu-vien-cv')}>
                        <BookOutlined /><span>Thư viện CV</span>
                    </div>
                </div>

                {/* SETTINGS PANEL */}
                <div className={`settings-panel no-print ${!activeMenu ? 'hidden' : ''}`}>
                    {activeMenu && (
                        <div className="panel-header">
                            <Title level={5} style={{ color: '#fff', margin: 0 }}>
                                {activeMenu === 'design' && 'Thiết kế & Font'}
                                {activeMenu === 'add-section' && 'Thêm mục CV'}
                                {activeMenu === 'layout' && 'Quản lý Bố cục'}
                                {activeMenu === 'tips' && 'Gợi ý viết CV'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} style={{ color: '#8c8c8c' }} onClick={() => setActiveMenu(null)} />
                        </div>
                    )}

                    <div className="panel-content">
                        {/* TAB 1: THIẾT KẾ & FONT */}
                        {activeMenu === 'design' && (
                            <div>
                                <div style={{ marginBottom: '24px' }}>
                                    <span className="custom-form-label">NGÔN NGỮ CV</span>
                                    <Space size="small">
                                        <button className={`topcv-lang-button ${lang === 'vi' ? 'active' : ''}`} onClick={() => handleLanguageToggle('vi')}>Tiếng Việt</button>
                                        <button className={`topcv-lang-button ${lang === 'en' ? 'active' : ''}`} onClick={() => handleLanguageToggle('en')}>Tiếng Anh</button>
                                    </Space>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <span className="custom-form-label">FONT CHỮ</span>
                                    <Select value={fontFamily} onChange={(val) => updateLayoutSetting && updateLayoutSetting('fontFamily', val)} style={{ width: '100%' }} dropdownStyle={{ backgroundColor: '#242424', color: '#fff' }} className="custom-input">
                                        {fontOptions.map(font => <Option key={font.value} value={font.value}><span style={{ fontFamily: font.value }}>{font.label}</span></Option>)}
                                    </Select>
                                </div>

                                <div style={{ marginBottom: '28px' }}>
                                    <span className="custom-form-label">CỠ CHỮ</span>
                                    <Slider min={12} max={17} step={1} value={fontSize || 14} marks={fontSizeMarks} onChange={(val) => updateLayoutSetting && updateLayoutSetting('fontSize', val)} tooltip={{ formatter: null }} trackStyle={{ backgroundColor: '#00b14f' }} handleStyle={{ borderColor: '#00b14f', backgroundColor: '#00b14f' }} />
                                </div>

                                <div style={{ marginBottom: '32px', paddingTop: '8px' }}>
                                    <span className="custom-form-label">KHOẢNG CÁCH DÒNG</span>
                                    <Slider min={1.0} max={2.0} step={0.14} value={lineHeight || 1.45} marks={lineHeightMarks} onChange={(val) => updateLayoutSetting && updateLayoutSetting('lineHeight', val)} tooltip={{ formatter: null }} trackStyle={{ backgroundColor: '#00b14f' }} handleStyle={{ borderColor: '#00b14f', backgroundColor: '#00b14f' }} />
                                </div>

                                <div style={{ marginBottom: '28px' }}>
                                    <span className="custom-form-label" style={{ marginBottom: '12px' }}>MÀU CHỦ ĐỀ</span>
                                    <Space size="middle" wrap style={{ marginBottom: '14px' }}>
                                        {themeColors.map(color => (
                                            <div key={color} className={`color-circle ${themeColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => updateLayoutSetting && updateLayoutSetting('themeColor', color)} />
                                        ))}
                                    </Space>

                                    <div style={{ background: '#262626', padding: '12px', borderRadius: '6px', border: '1px solid #333' }}>
                                        <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '4px', overflow: 'hidden', background: 'linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, rgba(255,0,0,0)), red', marginBottom: '10px' }}>
                                            <input type="color" value={themeColor || '#574040'} onChange={(e) => updateLayoutSetting && updateLayoutSetting('themeColor', e.target.value)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                            <div style={{ width: '100%', height: '100%', background: `linear-gradient(to top, #000000cc, transparent), linear-gradient(to right, #ffffffcc, ${themeColor || '#574040'})` }} />
                                        </div>
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <div style={{ width: '45px', height: '28px', borderRadius: '4px', backgroundColor: themeColor || '#574040', border: '1px solid #434343' }} />
                                            <Input size="small" value={(themeColor || '#574040').replace('#', '').toUpperCase()} onChange={(e) => {
                                                const val = e.target.value;
                                                if (val.length <= 6) updateLayoutSetting && updateLayoutSetting('themeColor', `#${val}`);
                                            }} style={{ width: '180px', textAlign: 'center', fontFamily: 'monospace' }} className="custom-input" prefix="#" />
                                        </Space>
                                    </div>
                                </div>

                                <div>
                                    <span className="custom-form-label">HÌNH NỀN CV</span>
                                    <div className="bg-pattern-grid">
                                        {bgPatterns.map(pattern => (
                                            <div key={pattern.id} className={`bg-pattern-item ${backgroundStyle === pattern.value ? 'active' : ''}`} style={{ background: pattern.css }} onClick={() => updateLayoutSetting && updateLayoutSetting('backgroundStyle', pattern.value)}>
                                                {backgroundStyle === pattern.value && (
                                                    <div className="bg-pattern-check-overlay">
                                                        <CheckOutlined />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB THÊM MỤC */}
                        {activeMenu === 'add-section' && (
                            <div style={{ color: '#a6a6a6', textAlign: 'center', marginTop: '20px' }}>
                                <p>Bật/tắt các mục phụ trong CV (Giải thưởng, Sở thích, Chứng chỉ...)</p>
                                <Button type="dashed" style={{ borderColor: '#333', color: '#fff', background: 'transparent' }} block>+ Hoạt động</Button>
                                <Button type="dashed" style={{ borderColor: '#333', color: '#fff', background: 'transparent', marginTop: 10 }} block>+ Chứng chỉ</Button>
                            </div>
                        )}

                        {/* TAB BỐ CỤC */}
                        {activeMenu === 'layout' && (
                            <div style={{ color: '#fff' }}>Tính năng quản lý cột bố cục</div>
                        )}
                    </div>
                </div>

                {/* WORKSPACE AREA */}
                <div className="workspace-area" style={{ background: backgroundStyle !== 'none' ? backgroundStyle : '#0f0f0f' }}>
                    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                        <div className="cv-preview-page" style={{ '--theme-color': themeColor }}>
                            <MasterTemplate />
                        </div>
                    </ConfigProvider>
                </div>
            </div>
        </div>
    );
};

export default CvBuilder;