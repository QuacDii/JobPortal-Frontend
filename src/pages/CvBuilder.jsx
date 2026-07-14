
import React, { useState, useEffect } from 'react';
import useCvStore from '../store/useCvStore';
<<<<<<< Updated upstream
import apiClient from '../api/apiClient';
import LayoutManager from '../components/LayoutManager';
=======
import axios from 'axios';
>>>>>>> Stashed changes
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

const CvBuilder = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const templateId = searchParams.get('templateId') || '1';
    const cvId = searchParams.get('cvId');
    const source = searchParams.get('source');

    // Quản lý ngôn ngữ chọn lựa trực tiếp
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

    // 🎨 Hệ thống tài nguyên cấu hình chuẩn giao diện TopCV
    const themeColors = ['#574040', '#4e7b8b', '#4e8b7d', '#518b4e', '#6f4e8b', '#8b4e4e'];

    const fontOptions = [
        { label: 'Be Vietnam Pro', value: '"Be Vietnam Pro", sans-serif' },
        { label: 'Roboto', value: 'Roboto, sans-serif' },
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Nunito', value: 'Nunito, sans-serif' }
    ];

    // Khấc chia định vị kích thước chữ cố định chuẩn cấu trúc mẫu đồ họa
    const fontSizeMarks = {
        12: 'Nhỏ',
        14: { style: { color: '#00b14f' }, label: 'Trung bình' },
        17: 'Siêu lớn'
    };

    // Khấc chia tỷ lệ giãn dòng cố định
    const lineHeightMarks = {
        1.0: '1.0',
        1.15: '',
        1.3: '',
        1.45: '',
        1.6: '',
        1.75: '',
        1.9: '',
        2.0: '2.0'
    };

    // Kho mẫu hình nền họa tiết trừu tượng cao cấp
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
<<<<<<< Updated upstream
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
                            
=======
                    // 1. LUỒNG TẢI LẠI CV ĐÃ LƯU
                    const res = await axios.get(`http://localhost:5279/api/Cv/${cvId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (res.data) {
                        if (res.data.tieuDe) setCvTitle(res.data.tieuDe);

                        if (res.data.maHex) {
                            updateLayoutSetting('themeColor', res.data.maHex);
                        }

                        const layoutJson = res.data.customLayoutJson ? (typeof res.data.customLayoutJson === 'string' ? JSON.parse(res.data.customLayoutJson) : res.data.customLayoutJson) : null;
                        const contentData = res.data.duLieuCv ? (typeof res.data.duLieuCv === 'string' ? JSON.parse(res.data.duLieuCv) : res.data.duLieuCv) : null;
>>>>>>> Stashed changes
                        setInitialData(layoutJson, contentData);
                    }
                } else {
                    let initialContent = {
                        personalInfo: {
                            fullName: userInfo?.fullName || '',
                            jobTitle: '',
                            email: userInfo?.email || '',
                            phone: '',
                            address: '',
                            avatar: '',
                            dob: '',
                            website: ''
                        },
                        summary: '',
                        skills: [
                            { name: '' },
                            { name: '' },
                            { name: '' }
                        ],
                        experience: [],
                        education: [
                            { id: 1, startDate: '', endDate: '', school: '', major: '', description: '' }
                        ],
                        projects: [], activities: [], awards: [], certificates: [], hobbies: ''
                    };
                    setCvTitle(`CV_${(userInfo?.fullName || 'UngVien').replace(/\s+/g, '')}_Moi`);

                    let templateLayout = null;
                    if (templateId) {
                        try {
<<<<<<< Updated upstream
                            const templateRes = await apiClient.get(`/MauCv/${templateId}`);
                            let rawData = templateRes?.layoutJson || templateRes?.LayoutJson || templateRes?.data?.layoutJson;
=======
                            const templateRes = await axios.get(`http://localhost:5279/api/MauCV/${templateId}`);

                            const dbColor = templateRes.data.maHex || templateRes.data.MaHex;
                            const finalTemplateColor = dbColor || (templateId === '3' ? '#5b423b' : '#00b14f');

                            // Cập nhật mã màu gốc vào State thiết kế của thanh Sidebar trái
                            updateLayoutSetting('themeColor', finalTemplateColor);

                            let rawData = templateRes.data.layoutJson || templateRes.data.LayoutJson;
>>>>>>> Stashed changes
                            if (rawData) {
                                if (typeof rawData === 'string') rawData = rawData.replace(/^\uFEFF/, '').trim();
                                let parsedData = typeof rawData === 'object' ? rawData : JSON.parse(rawData);
                                if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);
                                templateLayout = parsedData;
                            }
                        } catch (err) {
                            console.error("Lỗi gọi API hoặc lỗi vỡ định dạng JSON:", err);
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
    }, [cvId, templateId, token, source, userInfo?.fullName, userInfo?.email, setInitialData]);

    const handleLanguageToggle = (selectedLang) => {
        setLang(selectedLang);
        setSearchParams({ templateId, source, lang: selectedLang });
        message.success(`Đã chuyển đổi cấu trúc ngôn ngữ hiển thị: ${selectedLang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}`);
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
                .cv-preview-page { 
    background-color: #ffffff !important; 
    color: #333333 !important;
    
    color-scheme: light !important; 
    
    width: 210mm; 
    min-height: 297mm; 
    border-radius: 4px; 
    box-shadow: 0 12px 48px rgba(0,0,0,0.6); 
    overflow: hidden; 
    flex-shrink: 0; 
    position: relative; 
}

.cv-preview-page * {
    color-scheme: light !important;
}
                
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

<<<<<<< Updated upstream
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
=======
                        {/* TAB THÊM MỤC */}
                        {activeMenu === 'add-section' && (
                            <div style={{ color: '#a6a6a6', textAlign: 'center', marginTop: '20px' }}>
                                <p>Bật/tắt các mục phụ trong CV (Giải thưởng, Sở thích, Chứng chỉ...)</p>
                                <Button type="dashed" style={{ borderColor: '#333', color: '#fff', background: 'transparent' }} block>+ Hoạt động</Button>
                                <Button type="dashed" style={{ borderColor: '#333', color: '#fff', background: 'transparent', marginTop: 10 }} block>+ Chứng chỉ</Button>
                            </div>
>>>>>>> Stashed changes
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
                        <div className="cv-preview-page">
                            <MasterTemplate />
                        </div>
                    </ConfigProvider>
                </div>
            </div>
        </div>
    );
};

export default CvBuilder;