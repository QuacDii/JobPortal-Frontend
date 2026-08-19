import React, { useState, useEffect, useRef } from 'react';
import useCvStore from '../store/useCvStore';
import './css/CvBuilder.css';
import apiClient from '../api/apiClient';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal, ConfigProvider, theme, Input, Typography, Button, Space, message, Spin, Select, Slider, Tooltip, Tag, Badge } from 'antd';
import {
    DownloadOutlined,
    SaveOutlined,
    ArrowLeftOutlined,
    FileTextFilled,
    FormatPainterOutlined,
    LayoutOutlined,
    SwapOutlined,
    CloseOutlined,
    UndoOutlined,
    RedoOutlined,
    BulbOutlined,
    LockOutlined,
    RobotOutlined,
    CopyOutlined,
    CheckOutlined,
    ExclamationCircleOutlined,
    ThunderboltFilled
} from '@ant-design/icons';
import html2pdf from 'html2pdf.js';

import MasterTemplate from '../components/MasterTemplate';

const { Title } = Typography;
const { Option } = Select;

const paletteColors = ['#1890ff', '#005baa', '#574040', '#4e7b8b', '#6f4e8b', '#8b4e4e'];

const fontOptions = [
    { label: 'Be Vietnam Pro', value: '"Be Vietnam Pro", sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Nunito', value: 'Nunito, sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'Inter', value: '"Inter", sans-serif' },
    { label: 'Montserrat', value: '"Montserrat", sans-serif' },
    { label: 'Quicksand', value: '"Quicksand", sans-serif' },
    { label: 'Poppins', value: '"Poppins", sans-serif' },
    { label: 'Lora', value: '"Lora", serif' },
    { label: 'Merriweather', value: '"Merriweather", serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' }
];

const fontSizeMarks = {
    12: 'Nhỏ',
    14: { style: { color: '#1890ff' }, label: 'Trung bình' },
    17: 'Siêu lớn'
};

const lineHeightMarks = {
    1.0: '1.0', 1.15: '', 1.3: '', 1.45: '', 1.6: '', 1.75: '', 1.9: '', 2.0: '2.0'
};

const bgPatterns = [
    { id: 'none', name: 'Mặc định', value: 'none', css: '#1a1a1a' },
    { id: 'bg1', name: 'Dark Ocean', value: 'linear-gradient(to bottom right, #001528, #00456c)', css: 'linear-gradient(to bottom right, #001528, #00456c)' },
    { id: 'bg2', name: 'Deep Space', value: 'linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)', css: 'linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)' },
    { id: 'bg3', name: 'Midnight Blue', value: 'linear-gradient(135deg, #141e30, #243b55)', css: 'linear-gradient(135deg, #141e30, #243b55)' },
    { id: 'bg4', name: 'Purple Night', value: 'linear-gradient(to bottom, #2b5876, #4e4376)', css: 'linear-gradient(to bottom, #2b5876, #4e4376)' },
    { id: 'bg5', name: 'Navy', value: 'linear-gradient(to right, #112240, #0a192f)', css: 'linear-gradient(to right, #112240, #0a192f)' },
    { id: 'bg6', name: 'Blood Moon', value: 'linear-gradient(45deg, #240b36, #c31432)', css: 'linear-gradient(45deg, #240b36, #c31432)' },
    { id: 'bg7', name: 'Charcoal', value: 'linear-gradient(to bottom, #000000, #434343)', css: 'linear-gradient(to bottom, #000000, #434343)' },
    { id: 'bg8', name: 'Neon Pink', value: 'radial-gradient(circle at top left, #33001b, #ff0084)', css: 'radial-gradient(circle at top left, #33001b, #ff0084)' },
    { id: 'bg9', name: 'Soft Dark', value: 'linear-gradient(to right, #141E30, #243B55)', css: 'linear-gradient(to right, #141E30, #243B55)' },
    { id: 'bg10', name: 'Matrix', value: 'radial-gradient(circle, #000000, #0f9b0f)', css: 'radial-gradient(circle, #000000, #0f9b0f)' },
    { id: 'bg11', name: 'Deep Sea', value: 'linear-gradient(to right, #000428, #004e92)', css: 'linear-gradient(to right, #000428, #004e92)' },
    { id: 'bg12', name: 'Dark Red', value: 'linear-gradient(to bottom right, #000000, #1a0000)', css: 'linear-gradient(to bottom right, #000000, #1a0000)' },
    { id: 'bg13', name: 'Vignette', value: 'radial-gradient(circle, #1a1a1a, #000000)', css: 'radial-gradient(circle, #1a1a1a, #000000)' },
    { id: 'bg14', name: 'Steel', value: 'linear-gradient(to top, #232526, #414345)', css: 'linear-gradient(to top, #232526, #414345)' }
];

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
            email: decoded.email || decoded.emailaddress || '',
            isVip: decoded.isVip === 'true' || decoded.isVip === true
        };
    } catch (error) {
        return null;
    }
};

const cvDictionary = {
    "Học vấn": { vi: "Học vấn", en: "Education" },
    "Kỹ năng": { vi: "Kỹ năng", en: "Skills" },
    "Chuyên ngành:": { vi: "Chuyên ngành:", en: "Major:" },
    "Sở thích": { vi: "Sở thích", en: "Hobbies" },
    "Tiêu đề:": { vi: "Tiêu đề:", en: "Title:" },
    "Nhập nội dung": { vi: "Nhập nội dung", en: "Write here" },
    "Mục tiêu nghề nghiệp": { vi: "Mục tiêu nghề nghiệp", en: "Career Objective" },
    "Kinh nghiệm làm việc": { vi: "Kinh nghiệm làm việc", en: "Work Experience" },
    "Thông tin cá nhân": { vi: "Thông tin cá nhân", en: "Personal Information" },
    "Danh hiệu và giải thưởng": { vi: "Danh hiệu và giải thưởng", en: "Honors & Awards" },
    "Chứng chỉ": { vi: "Chứng chỉ", en: "Certificates" },
    "Hoạt động": { vi: "Hoạt động", en: "Activities" },
    "Dự án": { vi: "Dự án", en: "Projects" },
    "HỌ TÊN": { vi: "HỌ TÊN", en: "FULL NAME" },
    "Vị trí ứng tuyển": { vi: "Vị trí ứng tuyển", en: "Target Position" },
    "Ngày sinh": { vi: "Ngày sinh", en: "Date of Birth" },
    "Giới tính": { vi: "Giới tính", en: "Gender" },
    "Ngày sinh:": { vi: "Ngày sinh:", en: "Date of Birth:" },
    "Giới tính:": { vi: "Giới tính:", en: "Gender:" },
    "Số điện thoại:": { vi: "Số điện thoại:", en: "Phone:" },
    "Email:": { vi: "Email:", en: "Email:" },
    "Website:": { vi: "Website:", en: "Website:" },
    "Địa chỉ:": { vi: "Địa chỉ:", en: "Address:" },
    "Ngành học / Môn học": { vi: "Ngành học / Môn học", en: "Major / Field of Study" },
    "Bắt đầu": { vi: "Bắt đầu", en: "Start" },
    "Kết thúc": { vi: "Kết thúc", en: "End" },
    "Nay": { vi: "Nay", en: "Present" },
    "Tên trường học": { vi: "Tên trường học", en: "School / University Name" },
    "Mô tả quá trình học tập hoặc thành tích của bạn": { vi: "Mô tả quá trình học tập hoặc thành tích của bạn", en: "Describe your education process and achievements" },
    "Tên kỹ năng": { vi: "Tên kỹ năng", en: "Skill Name" },
    "Tên sở thích": { vi: "Tên sở thích", en: "Hobby Name" },
    "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn": { vi: "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn", en: "Your career objectives, including short-term and long-term goals" },
    "Vị trí công việc": { vi: "Vị trí công việc", en: "Job Title" },
    "Tên công ty": { vi: "Tên công ty", en: "Company Name" },
    "Mô tả kinh nghiệm làm việc của bạn": { vi: "Mô tả kinh nghiệm làm việc của bạn", en: "Describe your work experience" },
    "Thời gian": { vi: "Thời gian", en: "Time / Period" },
    "Tên giải thưởng": { vi: "Tên giải thưởng", en: "Award Name" },
    "Tên chứng chỉ": { vi: "Tên chứng chỉ", en: "Certificate Name" },
    "Vị trí của bạn": { vi: "Vị trí của bạn", en: "Your Role" },
    "Tên tổ chức": { vi: "Tên tổ chức", en: "Organization Name" },
    "Mô tả hoạt động": { vi: "Mô tả hoạt động", en: "Describe your activities" },
    "Vị trí của bạn trong dự án": { vi: "Vị trí của bạn trong dự án", en: "Your role in the project" },
    "Tên dự án": { vi: "Tên dự án", en: "Project Name" },
    "Mô tả ngắn gọn về dự án, mục tiêu, vai trò của bạn, các công nghệ sử dụng và những thành tựu bạn đã đạt được trong dự án": { vi: "Mô tả ngắn gọn về dự án, mục tiêu, vai trò của bạn, các công nghệ sử dụng và những thành tựu bạn đã đạt được trong dự án", en: "Briefly describe the project, goals, your role, technologies used and achievements" },
    "Người giới thiệu": { vi: "Người giới thiệu", en: "References" },
    "Thông tin thêm": { vi: "Thông tin thêm", en: "Additional Information" },
    "Tên người giới thiệu": { vi: "Tên người giới thiệu", en: "Reference Name" },
    "Vị trí / Tên công ty": { vi: "Vị trí / Tên công ty", en: "Position / Company" },
    "Số điện thoại / Email": { vi: "Số điện thoại / Email", en: "Phone / Email" },
    "Điền các thông tin thêm của bạn (nếu có)...": { vi: "Điền các thông tin thêm của bạn (nếu có)...", en: "Enter your additional information (if any)..." }
};

const translateText = (text, targetLang) => {
    if (!text) return text;
    const entry = Object.values(cvDictionary).find(
        item => item.vi.toLowerCase() === text.toLowerCase() || item.en.toLowerCase() === text.toLowerCase()
    );
    if (!entry) return text;
    const translated = entry[targetLang];
    return text === text.toUpperCase() ? translated.toUpperCase() : translated;
};

const translateLayoutTree = (node, targetLang) => {
    if (!node) return null;
    const newNode = { ...node, styles: { ...node.styles } };
    if (newNode.content) newNode.content = translateText(newNode.content, targetLang);
    if (newNode.placeholder) newNode.placeholder = translateText(newNode.placeholder, targetLang);
    if (newNode.children) newNode.children = newNode.children.map(child => translateLayoutTree(child, targetLang));
    if (newNode.itemTemplate) newNode.itemTemplate = translateLayoutTree(newNode.itemTemplate, targetLang);
    return newNode;
};

export const transformSectionForColumn = (section, targetColId, passedLang = null) => {
    if (!section || !section.id) return section;

    const store = useCvStore.getState();
    const currentSchema = store.layoutSchema || store.schema || {};

    // 1. Kiểm tra chính xác xem có phải cột trái không
    const isLeftCol = (colId) => {
        if (!colId) return false;
        const lower = colId.toLowerCase();
        return lower.includes('left') || lower.includes('col-1') || lower.includes('sidebar') || lower.includes('col-4-left');
    };
    const isLeft = isLeftCol(targetColId);

    const activeLang = (
        passedLang ||
        store.language ||
        store.currentLang ||
        store.layoutSettings?.language ||
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null) ||
        'vi'
    ).toLowerCase();

    const isEn = activeLang === 'en' || activeLang === 'english';
    const t = (vi, en) => (isEn ? en : vi);

    const newSection = JSON.parse(JSON.stringify(section));
    const id = newSection.id;

    // 🌟 2. XỬ LÝ AN TOÀN & LINH HOẠT CHO HEADER / AVATAR / DANH THIẾP
    if (id === 'section-avatar-profile' || id === 'section-business-card' || id === 'section-contact-info') {
        const hasNegativeMargin = newSection.styles?.marginLeft && String(newSection.styles.marginLeft).startsWith('-');

        if (hasNegativeMargin) {
            let targetPadding = 0;
            const findColPadding = (node) => {
                if (node?.id === targetColId && node.styles?.padding) {
                    const parts = node.styles.padding.trim().split(/\s+/);
                    // Lấy padding ngang (nếu là "0px 25px" thì lấy 25, nếu là "20px" thì lấy 20)
                    const horiz = parts.length >= 2 ? parts[1] : parts[0];
                    targetPadding = parseFloat(horiz) || 0;
                }
                if (node?.children) node.children.forEach(findColPadding);
            };
            findColPadding(currentSchema);

            if (targetPadding > 0) {
                newSection.styles.marginLeft = `-${targetPadding}px`;
                newSection.styles.marginRight = `-${targetPadding}px`;
            } else {
                delete newSection.styles.marginLeft;
                delete newSection.styles.marginRight;
            }
        }

        return newSection;
    }

    // 3. Trích xuất Text tiêu đề
    const titleDictionary = {
        'section-summary': { vi: 'Mục tiêu nghề nghiệp', en: 'Career Objective' },
        'section-education': { vi: 'Học vấn', en: 'Education' },
        'section-experience': { vi: 'Kinh nghiệm làm việc', en: 'Work Experience' },
        'section-skills': { vi: 'Kỹ năng', en: 'Skills' },
        'section-hobbies': { vi: 'Sở thích', en: 'Hobbies' },
        'section-projects': { vi: 'Dự án', en: 'Projects' },
        'section-activities': { vi: 'Hoạt động', en: 'Activities' },
        'section-awards': { vi: 'Danh hiệu và giải thưởng', en: 'Honors & Awards' },
        'section-certificates': { vi: 'Chứng chỉ', en: 'Certificates' },
        'section-references': { vi: 'Người giới thiệu', en: 'References' },
        'section-additional': { vi: 'Thông tin thêm', en: 'Additional Information' }
    };

    let titleText = titleDictionary[id] ? t(titleDictionary[id].vi, titleDictionary[id].en) : 'Section';

    // 4. Học kiểu dáng Tiêu đề và Card Wrapper từ cột đích
    let sampleHeading = null;
    let sampleCardStyles = null;
    const excludeIds = ['section-avatar-profile', 'section-business-card', 'section-contact-info', id];

    const findSample = (node) => {
        if (!node) return;
        if (node.id === targetColId && node.children && node.children.length > 0) {
            const validSec = node.children.find(c => c && c.id && !excludeIds.includes(c.id) && c.children && c.children.length > 0);
            if (validSec) {
                if (validSec.children[0] && validSec.children[0].type !== 'Image') {
                    sampleHeading = JSON.parse(JSON.stringify(validSec.children[0]));
                }
                // Kiểm tra xem các khối ở cột đích có bọc ô vuông/ô xanh không
                const secondChild = validSec.children[1];
                if (secondChild && secondChild.type === 'Container' && (secondChild.styles?.backgroundColor || secondChild.styles?.background)) {
                    sampleCardStyles = JSON.parse(JSON.stringify(secondChild.styles));
                }
            }
        }
        if (!sampleHeading && node.children) node.children.forEach(findSample);
    };
    findSample(currentSchema);

    // Tái tạo Tiêu đề chuẩn theo cột đích
    let formattedHeading;
    if (sampleHeading) {
        const replaceHeadingContent = (n) => {
            if (!n) return;
            if (n.type === 'Text' && n.content && n.content !== '•' && n.content !== '-' && n.content !== '|') {
                n.content = (sampleHeading.styles?.textTransform === 'uppercase' || n.styles?.textTransform === 'uppercase')
                    ? titleText.toUpperCase()
                    : titleText;
            }
            if (n.children) n.children.forEach(replaceHeadingContent);
        };
        replaceHeadingContent(sampleHeading);
        formattedHeading = sampleHeading;
    } else {
        formattedHeading = newSection.children[0];
    }

    // 🌟 5. BÓC TÁCH (UNWRAP) VỎ BỌC NỀN XANH
    let contentNode = (newSection.children && newSection.children[1]) ? newSection.children[1] : null;

    // Nếu nội dung đang bị bọc bởi Container nền xanh/card -> Bóc lấy nội dung con bên trong
    if (contentNode && contentNode.type === 'Container' && contentNode.children && contentNode.children.length === 1) {
        const hasCardBg = contentNode.styles?.backgroundColor || contentNode.styles?.background;
        if (hasCardBg && contentNode.styles?.backgroundColor !== 'transparent') {
            contentNode = contentNode.children[0];
        }
    }

    // 🌟 6. XỬ LÝ THEO CỘT ĐÍCH
    if (isLeft) {
        // KHI SANG CỘT TRÁI: Xóa triệt để màu nền, padding và bo góc thừa
        if (contentNode && contentNode.styles) {
            delete contentNode.styles.backgroundColor;
            delete contentNode.styles.background;
            delete contentNode.styles.padding;
            delete contentNode.styles.borderRadius;
        }
    } else {
        // KHI SANG CỘT PHẢI: Nếu cột phải có ô xanh, tự động bọc lại
        if (sampleCardStyles) {
            contentNode = {
                type: "Container",
                styles: { ...sampleCardStyles, width: "100%", boxSizing: "border-box" },
                children: [contentNode]
            };
        } else {
            // Dự phòng cho mẫu có timeline card xanh
            const schemaStr = JSON.stringify(currentSchema);
            if (schemaStr.includes('#e6f0fa') || schemaStr.includes('borderRadius": "20px"')) {
                contentNode = {
                    type: "Container",
                    styles: { backgroundColor: "#e6f0fa", borderRadius: "20px", padding: "18px 22px", width: "100%", boxSizing: "border-box" },
                    children: [contentNode]
                };
            }
        }
    }

    // 7. Đồng bộ màu chữ theo màu nền của cột
    const syncTextColor = (node, toLeft) => {
        if (!node) return;
        if (node.styles) {
            if (toLeft) {
                if (!node.styles.color || !node.styles.color.includes('var(')) {
                    node.styles.color = (node.styles.fontWeight === 'bold' || node.styles.fontWeight === '600') ? '#1e293b' : '#64748b';
                }
            } else {
                if (node.styles.color && (node.styles.color.includes('#fff') || node.styles.color.includes('255, 255, 255'))) {
                    node.styles.color = '#1e293b';
                }
            }
        }
        if (node.children) node.children.forEach(c => syncTextColor(c, toLeft));
        if (node.itemTemplate) syncTextColor(node.itemTemplate, toLeft);
    };
    syncTextColor(contentNode, isLeft);

    newSection.children = [formattedHeading, contentNode];
    return newSection;
};

const CvBuilder = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const themeColorsUI = {
        bgMain: '#f4f5f5',
        bgHeader: '#ffffff',
        bgSidebar: '#ffffff',
        bgPanel: '#ffffff',
        bgWorkspace: '#e4e7eb',
        textMain: '#262626',
        textSub: '#595959',
        borderColor: '#e8e8e8',
        inputBg: '#f5f7fa',
    };

    const templateId = searchParams.get('templateId') || '1';
    const cvId = searchParams.get('cvId');
    const source = searchParams.get('source');
    const colorParam = searchParams.get('color');

    const [lang, setLang] = useState(searchParams.get('lang') || 'vi');

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId || null;
    const isVipUser = userInfo?.isVip || false;

    const [isPremium, setIsPremium] = useState(isVipUser);
    const [aiBalance, setAiBalance] = useState(0);

    const [cvTitle, setCvTitle] = useState('CV chưa đặt tên');
    const [pageLoading, setPageLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState('design');
    const [isResizingCols, setIsResizingCols] = useState(false);
    const [tempColWidth, setTempColWidth] = useState(36);

    const [templateList, setTemplateList] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const sidebarLayoutRef = useRef(null);

    const [aiIndustry, setAiIndustry] = useState('');
    const [aiDescription, setAiDescription] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [pastHistory, setPastHistory] = useState([]);
    const [futureHistory, setFutureHistory] = useState([]);
    const [isTimeTraveling, setIsTimeTraveling] = useState(false);

    const cvData = useCvStore(state => state.cvData);
    const currentData = useCvStore(state => state.cvData);
    const layoutSchema = useCvStore(state => state.layoutSchema || state.schema);
    const currentSchema = useCvStore(state => state.layoutSchema || state.schema);

    const [isDirty, setIsDirty] = useState(false);
    const initialDataRef = useRef(null);

    const layoutSettings = useCvStore(state => state.layoutSettings);

    useEffect(() => {
        if (!pageLoading && currentData && !initialDataRef.current) {
            initialDataRef.current = JSON.stringify({ currentData, currentSchema, layoutSettings });
        }
    }, [pageLoading, currentData, currentSchema, layoutSettings]);

    useEffect(() => {
        if (initialDataRef.current) {
            const currentSnapshot = JSON.stringify({ currentData, currentSchema, layoutSettings });
            const isChanged = currentSnapshot !== initialDataRef.current || pastHistory.length > 1;
            setIsDirty(isChanged);
        }
    }, [currentData, currentSchema, layoutSettings, pastHistory]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (!isDirty) return;

            const target = e.target;

            if (
                target.closest('.cv-builder-wrapper') ||
                target.closest('.ant-modal-root') ||
                target.closest('.ant-message') ||
                target.closest('.ant-tooltip')
            ) {
                return;
            }

            const isLink = target.closest('a');
            const isNavItem = target.closest('header, .app-header, .navbar, .ant-dropdown, .ant-dropdown-menu-item, .ant-menu-item');
            const isButtonNav = target.closest('button, [role="button"], li');

            if (isLink || isNavItem || isButtonNav) {
                e.preventDefault();
                e.stopPropagation();

                const href = isLink?.getAttribute('href');

                Modal.confirm({
                    title: 'Cảnh báo chưa lưu thay đổi',
                    icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                    content: 'Bạn có các thay đổi chưa được lưu trên CV. Bạn có chắc chắn muốn rời đi mà không lưu?',
                    okText: 'Rời đi không lưu',
                    cancelText: 'Ở lại chỉnh sửa',
                    okButtonProps: { danger: true },
                    onOk: () => {
                        setIsDirty(false);
                        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                            navigate(href);
                        } else {
                            setTimeout(() => {
                                target.click();
                            }, 50);
                        }
                    }
                });
            }
        };

        if (isDirty) {
            window.addEventListener('click', handleGlobalClick, true);
        }

        return () => {
            window.removeEventListener('click', handleGlobalClick, true);
        };
    }, [isDirty, navigate]);

    useEffect(() => {
        const handlePopState = () => {
            if (isDirty) {
                const confirmLeave = window.confirm('Bạn có các thay đổi chưa được lưu trên CV. Bạn có chắc chắn muốn rời đi mà không lưu?');
                if (!confirmLeave) {
                    window.history.pushState(null, '', window.location.href);
                }
            }
        };

        if (isDirty) {
            window.history.pushState(null, '', window.location.href);
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isDirty]);

    const handleGoBack = () => {
        if (isDirty) {
            Modal.confirm({
                title: 'Cảnh báo chưa lưu thay đổi',
                icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                content: 'Bạn có các thay đổi chưa được lưu trên CV. Bạn có chắc chắn muốn rời đi mà không lưu?',
                okText: 'Rời đi không lưu',
                cancelText: 'Ở lại chỉnh sửa',
                okButtonProps: { danger: true },
                onOk: () => {
                    setIsDirty(false);
                    navigate('/manage-cv');
                }
            });
        } else {
            navigate('/manage-cv');
        }
    };

    const [hasRemoveWatermark, setHasRemoveWatermark] = useState(false);

    const fetchAiBalance = () => {
        if (token) {
            apiClient.get('/Service/balance')
                .then(res => {
                    const balData = res?.data !== undefined ? res.data : res;
                    const aiTurns = balData?.soLuotAiConLai ?? balData?.luotAiConLai ?? 0;
                    const isStillVip = balData?.ngayHetHanGoi && new Date(balData.ngayHetHanGoi) > new Date();
                    const privileges = balData?.cacDacQuyen || [];

                    setAiBalance(aiTurns);
                    setIsPremium(Boolean(isStillVip));

                    const canHideWatermark = Boolean(isStillVip) || privileges.includes('UV_REMOVE_WATERMARK');
                    setHasRemoveWatermark(canHideWatermark);
                })
                .catch(err => console.error("Lỗi lấy số lượt AI:", err));
        }
    };

    useEffect(() => {
        fetchAiBalance();
    }, [token]);

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const res = await apiClient.get('/MauCv');
                setTemplateList(res.data || res || []);
            } catch (error) { console.error("Lỗi khi tải danh sách mẫu CV:", error); }
            finally { setLoadingTemplates(false); }
        };
        fetchTemplates();
    }, []);

    const handleApplyTemplate = async (newTemplateId, newTemplateName) => {
        if (String(templateId) === String(newTemplateId)) return;
        const hideLoading = message.loading('Đang tải cấu trúc mẫu mới...', 0);
        try {
            const res = await apiClient.get(`/MauCv/${newTemplateId}`);
            const actualTemplate = res?.data ? res.data : res;

            let rawData = actualTemplate?.layoutJson || actualTemplate?.LayoutJson;
            if (rawData) {
                if (typeof rawData === 'string') rawData = rawData.replace(/^\uFEFF/, '').trim();
                let parsedData = typeof rawData === 'object' ? rawData : JSON.parse(rawData);
                if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);

                const translatedLayout = translateLayoutTree(parsedData, lang);
                setInitialData(translatedLayout, cvData);
                const defaultColor = actualTemplate?.colors?.[0] || '#1890ff';
                updateLayoutSetting('themeColor', defaultColor);
                setSearchParams(prev => { prev.set('templateId', newTemplateId); return prev; }, { replace: true });

                hideLoading();
                message.success('Đã đổi mẫu CV thành công!');
            }
        } catch (error) {
            hideLoading();
            message.error('Lỗi khi áp dụng cấu trúc mẫu mới!');
        }
    };

    useEffect(() => {
        if (isTimeTraveling) { setIsTimeTraveling(false); return; }
        if (!currentData || !currentSchema) return;

        const timer = setTimeout(() => {
            setPastHistory(prev => {
                const newRecord = { cvData: JSON.parse(JSON.stringify(currentData)), layoutSchema: JSON.parse(JSON.stringify(currentSchema)) };
                if (prev.length > 0) {
                    const last = prev[prev.length - 1];
                    if (JSON.stringify(last) === JSON.stringify(newRecord)) return prev;
                }
                return [...prev.slice(-15), newRecord];
            });
            setFutureHistory([]);
        }, 600);
        return () => clearTimeout(timer);
    }, [currentData, currentSchema]);

    const handleUndo = () => {
        if (pastHistory.length <= 1) return;
        setIsTimeTraveling(true);
        const currentState = pastHistory[pastHistory.length - 1];
        const previousState = pastHistory[pastHistory.length - 2];
        setPastHistory(prev => prev.slice(0, prev.length - 1));
        setFutureHistory(prev => [currentState, ...prev]);
        useCvStore.getState().setInitialData(previousState.layoutSchema, previousState.cvData);
    };

    const handleRedo = () => {
        if (futureHistory.length === 0) return;
        setIsTimeTraveling(true);
        const nextState = futureHistory[0];
        setFutureHistory(prev => prev.slice(1));
        setPastHistory(prev => [...prev, nextState]);
        useCvStore.getState().setInitialData(nextState.layoutSchema, nextState.cvData);
    };

    useEffect(() => {
        if (activeMenu === 'layout') {
            const currentSchema = useCvStore.getState().layoutSchema || useCvStore.getState().schema;
            let initialWidth = 36;
            const findWidth = (node) => {
                if (node?.id === 'left-col' && node.styles?.width) initialWidth = parseFloat(node.styles.width);
                if (node?.children) node.children.forEach(findWidth);
            };
            findWidth(currentSchema);
            setTempColWidth(initialWidth);
        }
    }, [activeMenu]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingCols || !sidebarLayoutRef.current) return;
            const rect = sidebarLayoutRef.current.getBoundingClientRect();
            let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
            if (newWidth < 20) newWidth = 20;
            if (newWidth > 80) newWidth = 80;

            setTempColWidth(newWidth);
            const store = useCvStore.getState();
            const currentSchema = store.layoutSchema || store.schema;
            if (currentSchema) {
                const newSchema = JSON.parse(JSON.stringify(currentSchema));
                let lCol, rCol;
                const findCols = (node) => {
                    if (node?.id === 'left-col') lCol = node;
                    if (node?.id === 'right-col') rCol = node;
                    if (node?.children) node.children.forEach(findCols);
                };
                findCols(newSchema);
                if (lCol && rCol) {
                    lCol.styles.width = `${newWidth}%`;
                    rCol.styles.width = `${100 - newWidth}%`;
                    if (typeof store.setLayoutSchema === 'function') store.setLayoutSchema(newSchema);
                    else useCvStore.setState({ layoutSchema: newSchema, schema: newSchema });
                }
            }
        };

        const handleMouseUp = () => { if (isResizingCols) setIsResizingCols(false); };
        if (isResizingCols) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isResizingCols]);

    const getNewSectionJson = (id) => {
        const store = useCvStore.getState();
        const schema = store.layoutSchema || store.schema;
        let headingTemplate = null;

        const findHeading = (node) => {
            if (node && (node.id === 'section-education' || node.id === 'section-experience') && node.children && node.children.length > 0) {
                headingTemplate = JSON.parse(JSON.stringify(node.children[0]));
            }
            if (!headingTemplate && node && node.children) node.children.forEach(findHeading);
        };
        findHeading(schema);

        if (!headingTemplate) {
            headingTemplate = {
                type: "Container",
                styles: { display: "flex", alignItems: "center", marginBottom: "24px" },
                children: [
                    {
                        type: "Text",
                        content: "TIÊU ĐỀ",
                        styles: { backgroundColor: "var(--heading-bg)", color: "#ffffff", padding: "8px 24px", borderRadius: "20px", fontWeight: "bold", fontSize: "15px", whiteSpace: "nowrap" }
                    },
                    {
                        type: "Container",
                        styles: { flexGrow: "1", height: "1px", backgroundColor: "var(--heading-line)", marginLeft: "15px", opacity: "0.3" }
                    }
                ]
            };
        }

        const applyHeadingTitle = (root, title) => {
            if (root.type === 'Text' && root.content !== undefined) root.content = title;
            if (root.children) root.children.forEach(c => applyHeadingTitle(c, title));
        };

        const b = { marginBottom: "25px" };
        let contentChildren = [];
        let title = "";

        if (id === 'section-summary') {
            title = translateText("Mục tiêu nghề nghiệp", lang);
            contentChildren = [
                {
                    type: "RichText",
                    dataPath: "summary",
                    placeholder: translateText("Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn", lang),
                    styles: { textAlign: "justify", fontSize: "13.5px", border: "none", outline: "none", width: "100%" }
                }
            ];
        } else if (id === 'section-education') {
            title = translateText("Học vấn", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "education",
                    styles: { display: "flex", flexDirection: "column", gap: "16px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", flexDirection: "row", gap: "20px" },
                        children: [
                            {
                                type: "Container",
                                styles: { width: "20%", flexShrink: "0" },
                                children: [
                                    {
                                        type: "Container",
                                        styles: { display: "flex", gap: "4px", fontSize: "14px", whiteSpace: "nowrap" },
                                        children: [
                                            { type: "Text", dataPath: "startDate", placeholder: translateText("Bắt đầu", lang) },
                                            { type: "Text", content: "-" },
                                            { type: "Text", dataPath: "endDate", placeholder: translateText("Kết thúc", lang) }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: "Container",
                                styles: { flex: "1", display: "flex", flexDirection: "column" },
                                children: [
                                    { type: "Text", dataPath: "school", placeholder: translateText("Tên trường học", lang), styles: { fontWeight: "bold", fontSize: "14px", marginBottom: "6px" } },
                                    {
                                        type: "Container",
                                        styles: { display: "flex", gap: "6px", marginBottom: "6px", alignItems: "baseline" },
                                        children: [
                                            { type: "Text", content: translateText("Chuyên ngành:", lang), styles: { fontWeight: "bold", whiteSpace: "nowrap", flexShrink: "0" } },
                                            { type: "Text", dataPath: "major", placeholder: translateText("Ngành học / Môn học", lang), styles: { fontWeight: "bold" } }
                                        ]
                                    },
                                    { type: "RichText", dataPath: "description", placeholder: translateText("Mô tả quá trình học tập hoặc thành tích của bạn", lang), styles: { fontSize: "13.5px", border: "none", outline: "none" } }
                                ]
                            }
                        ]
                    }
                }
            ];
        } else if (id === 'section-experience') {
            title = translateText("Kinh nghiệm làm việc", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "experience",
                    styles: { display: "flex", flexDirection: "column", gap: "20px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", flexDirection: "row", gap: "20px" },
                        children: [
                            {
                                type: "Container",
                                styles: { width: "20%", flexShrink: "0" },
                                children: [
                                    {
                                        type: "Container",
                                        styles: { display: "flex", gap: "4px", fontSize: "14px", whiteSpace: "nowrap" },
                                        children: [
                                            { type: "Text", dataPath: "startDate", placeholder: translateText("Bắt đầu", lang) },
                                            { type: "Text", content: "-" },
                                            { type: "Text", dataPath: "endDate", placeholder: translateText("Kết thúc", lang) }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: "Container",
                                styles: { flex: "1", display: "flex", flexDirection: "column" },
                                children: [
                                    { type: "Text", dataPath: "companyName", placeholder: translateText("Tên công ty", lang), styles: { fontWeight: "bold", fontSize: "14px", marginBottom: "6px" } },
                                    { type: "Text", dataPath: "title", placeholder: translateText("Vị trí công việc", lang), styles: { fontWeight: "bold", marginBottom: "8px" } },
                                    { type: "RichText", dataPath: "description", placeholder: translateText("Mô tả kinh nghiệm làm việc của bạn", lang), styles: { fontSize: "13.5px", border: "none", outline: "none" } }
                                ]
                            }
                        ]
                    }
                }
            ];
        } else if (id === 'section-projects') {
            title = translateText("Dự án", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "projects",
                    styles: { display: "flex", flexDirection: "column", gap: "20px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", flexDirection: "column" },
                        children: [
                            {
                                type: "Container",
                                styles: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" },
                                children: [
                                    { type: "Text", dataPath: "role", placeholder: translateText("Vị trí của bạn trong dự án", lang), styles: { fontWeight: "bold", fontSize: "15px" } },
                                    {
                                        type: "Container",
                                        styles: { display: "flex", gap: "4px", fontWeight: "bold", fontSize: "14px", opacity: "0.8", whiteSpace: "nowrap" },
                                        children: [
                                            { type: "Text", dataPath: "startDate", placeholder: translateText("Bắt đầu", lang) },
                                            { type: "Text", content: "-" },
                                            { type: "Text", dataPath: "endDate", placeholder: translateText("Kết thúc", lang) }
                                        ]
                                    }
                                ]
                            },
                            { type: "Text", dataPath: "projectName", placeholder: translateText("Tên dự án", lang), styles: { fontSize: "14.5px", marginBottom: "8px", opacity: "0.9", fontWeight: "bold" } },
                            { type: "RichText", dataPath: "description", placeholder: translateText("Mô tả ngắn gọn về dự án, mục tiêu, vai trò của bạn, các công nghệ sử dụng và những thành tựu bạn đã đạt được trong dự án", lang), styles: { fontSize: "13.5px", border: "none", outline: "none" } }
                        ]
                    }
                }
            ];
        } else if (id === 'section-awards') {
            title = translateText("Danh hiệu và giải thưởng", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "awards",
                    styles: { display: "flex", flexDirection: "column", gap: "16px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", flexDirection: "row", gap: "20px" },
                        children: [
                            {
                                type: "Container",
                                styles: { width: "20%", flexShrink: "0" },
                                children: [{ type: "Text", dataPath: "time", placeholder: translateText("Thời gian", lang), styles: { fontSize: "14px", fontWeight: "bold" } }]
                            },
                            {
                                type: "Container",
                                styles: { flex: "1" },
                                children: [{ type: "Text", dataPath: "name", placeholder: translateText("Tên giải thưởng", lang), styles: { fontSize: "14px" } }]
                            }
                        ]
                    }
                }
            ];
        } else if (id === 'section-certificates') {
            title = translateText("Chứng chỉ", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "certificates",
                    styles: { display: "flex", flexDirection: "column", gap: "16px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", flexDirection: "row", gap: "20px" },
                        children: [
                            {
                                type: "Container",
                                styles: { width: "20%", flexShrink: "0" },
                                children: [{ type: "Text", dataPath: "time", placeholder: translateText("Thời gian", lang), styles: { fontSize: "14px", fontWeight: "bold" } }]
                            },
                            {
                                type: "Container",
                                styles: { flex: "1" },
                                children: [{ type: "Text", dataPath: "name", placeholder: translateText("Tên chứng chỉ", lang), styles: { fontSize: "14px" } }]
                            }
                        ]
                    }
                }
            ];
        } else if (id === 'section-activities') {
            title = translateText("Hoạt động", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "activities",
                    styles: { display: "flex", flexDirection: "column", gap: "20px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", flexDirection: "column" },
                        children: [
                            {
                                type: "Container",
                                styles: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" },
                                children: [
                                    { type: "Text", dataPath: "role", placeholder: translateText("Vị trí của bạn", lang), styles: { fontWeight: "bold", fontSize: "15px" } },
                                    {
                                        type: "Container",
                                        styles: { display: "flex", gap: "4px", fontWeight: "bold", fontSize: "14px", opacity: "0.8", whiteSpace: "nowrap" },
                                        children: [
                                            { type: "Text", dataPath: "startDate", placeholder: translateText("Bắt đầu", lang) },
                                            { type: "Text", content: " - " },
                                            { type: "Text", dataPath: "endDate", placeholder: translateText("Kết thúc", lang) }
                                        ]
                                    }
                                ]
                            },
                            { type: "Text", dataPath: "organization", placeholder: translateText("Tên tổ chức", lang), styles: { fontSize: "14.5px", marginBottom: "8px", opacity: "0.9", fontWeight: "bold" } },
                            { type: "RichText", dataPath: "description", placeholder: translateText("Mô tả hoạt động", lang), styles: { fontSize: "13.5px", border: "none", outline: "none" } }
                        ]
                    }
                }
            ];
        } else if (id === 'section-hobbies') {
            title = translateText("Sở thích", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "hobbies",
                    styles: { display: "flex", flexDirection: "column", gap: "8px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", alignItems: "center", gap: "8px" },
                        children: [
                            { type: "Text", content: "•", styles: { fontWeight: "bold", fontSize: "14px" } },
                            { type: "Text", dataPath: "name", placeholder: translateText("Tên sở thích", lang), styles: { fontSize: "13.5px" } }
                        ]
                    }
                }
            ];
        } else if (id === 'section-skills') {
            title = translateText("Kỹ năng", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "skills",
                    styles: { display: "flex", flexDirection: "column", gap: "8px" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", alignItems: "center", gap: "8px" },
                        children: [
                            { type: "Text", content: "•", styles: { fontWeight: "bold", fontSize: "14px" } },
                            { type: "Text", dataPath: "name", placeholder: translateText("Tên kỹ năng", lang), styles: { fontSize: "13.5px" } }
                        ]
                    }
                }
            ];
        } else if (id === 'section-references') {
            title = translateText("Người giới thiệu", lang);
            contentChildren = [
                {
                    type: "LoopContainer",
                    dataPath: "references",
                    styles: { display: "flex", flexDirection: "column", gap: "16px", width: "100%" },
                    itemTemplate: {
                        type: "Container",
                        styles: { display: "flex", flexDirection: "column", gap: "4px" },
                        children: [
                            { type: "Text", dataPath: "name", placeholder: translateText("Tên người giới thiệu", lang), styles: { fontWeight: "bold", fontSize: "14px" } },
                            { type: "Text", dataPath: "position", placeholder: translateText("Vị trí / Tên công ty", lang), styles: { fontSize: "13.5px", opacity: "0.9" } },
                            { type: "Text", dataPath: "contact", placeholder: translateText("Số điện thoại / Email", lang), styles: { fontSize: "13.5px", opacity: "0.9" } }
                        ]
                    }
                }
            ];
        } else if (id === 'section-additional') {
            title = translateText("Thông tin thêm", lang);
            contentChildren = [
                {
                    type: "RichText",
                    dataPath: "additionalInfo",
                    placeholder: translateText("Điền các thông tin thêm của bạn (nếu có)...", lang),
                    styles: { fontSize: "13.5px", border: "none", outline: "none", width: "100%" }
                }
            ];
        } else return null;

        applyHeadingTitle(headingTemplate, title);
        return { type: "Container", id: id, styles: b, children: [headingTemplate, ...contentChildren] };
    };

    const canUseAi = aiBalance > 0 || aiBalance === -1;

    const handleGenerateSuggestion = async () => {
        if (!canUseAi) {
            return message.warning("Bạn đã hết lượt sử dụng AI. Vui lòng nâng cấp tài khoản hoặc mua thêm lượt!");
        }

        if (!aiIndustry || !aiDescription) {
            message.warning("Vui lòng nhập Ngành nghề và Mô tả kinh nghiệm!");
            return;
        }

        setIsGenerating(true);
        setAiResult('');
        try {
            const response = await apiClient.post('/AiHelper/generate-cv-tips', {
                industry: aiIndustry,
                description: aiDescription
            });

            const responseData = response?.data !== undefined ? response.data : response;
            const resultText = responseData?.data || (typeof responseData === 'string' ? responseData : '');

            if (resultText && resultText.trim() !== '') {
                setAiResult(resultText);

                // Chỉ giảm lượt trên giao diện nếu KHÔNG PHẢI là gói vô hạn (-1)
                if (aiBalance > 0) {
                    setAiBalance(prev => Math.max(0, prev - 1));
                }
            } else {
                message.error("Không nhận được phản hồi hợp lệ từ AI.");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi khi tạo gợi ý. Vui lòng thử lại!";
            message.error(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };
    const handleAutoFill = () => {
        if (!aiResult) return;
        let parsedSummary = ''; let parsedExperience = '';
        const expRegex = /2\.?\s*\*?\*?Kinh nghiệm/i;
        const parts = aiResult.split(expRegex);

        if (parts.length > 1) {
            parsedSummary = parts[0].replace(/1\.?\s*\*?\*?Mục tiêu.*?(\n|$)/i, '').trim();
            parsedExperience = parts[1].trim();
        } else { parsedSummary = aiResult.trim(); }

        if (parsedSummary) {
            parsedSummary = parsedSummary.replace(/###/g, '').trim().replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '').replace(/\*\*(.*?)\*\*/gs, '<strong>$1</strong>').replace(/\*\*/g, '');
        }

        let expHtml = '';
        if (parsedExperience) {
            let cleanExp = parsedExperience.replace(/\*\*(.*?)\*\*/gs, '<strong>$1</strong>').replace(/\*\*/g, '');
            const lines = cleanExp.split('\n').filter(l => l.trim() !== '');
            const bullets = lines.map(l => `<li>${l.replace(/^[\*\-\•]\s*/, '').trim()}</li>`).join('');
            expHtml = `<ul>${bullets}</ul>`;
        }

        const store = useCvStore.getState();
        const newCvData = JSON.parse(JSON.stringify(store.cvData));
        if (parsedSummary) newCvData.summary = parsedSummary;
        if (expHtml) {
            if (!newCvData.experience || newCvData.experience.length === 0) {
                newCvData.experience = [{ id: Date.now(), startDate: '', endDate: 'Nay', companyName: 'Tên Công Ty', title: aiIndustry, description: expHtml }];
            } else newCvData.experience[0].description = expHtml;
        }

        store.setInitialData(store.layoutSchema, newCvData);
        message.success('Đã điền tự động nội dung AI vào bản CV!');
    };

    const { fontFamily, fontSize, lineHeight, themeColor, backgroundStyle } = useCvStore(state => state.layoutSettings || {});
    const setInitialData = useCvStore(state => state.setInitialData);
    const updateLayoutSetting = useCvStore(state => state.updateLayoutSetting);

    useEffect(() => {
        const initializeCvData = async () => {
            setPageLoading(true);
            try {
                let importedContent = null;
                let importedLayout = null;
                let importedSettings = null;

                const importedDataStr = sessionStorage.getItem('imported_cv_data');
                if (importedDataStr) {
                    try {
                        const parsedData = JSON.parse(importedDataStr);
                        if (parsedData.cvData && parsedData.layoutSchema) {
                            importedContent = parsedData.cvData;
                            importedLayout = parsedData.layoutSchema;
                            importedSettings = parsedData.settings;

                            if (parsedData.settings) {
                                if (parsedData.settings.themeColor) updateLayoutSetting('themeColor', parsedData.settings.themeColor);
                                if (parsedData.settings.fontFamily) updateLayoutSetting('fontFamily', parsedData.settings.fontFamily);
                                if (parsedData.settings.backgroundStyle) updateLayoutSetting('backgroundStyle', parsedData.settings.backgroundStyle);
                                if (parsedData.settings.fontSize) updateLayoutSetting('fontSize', parsedData.settings.fontSize);
                            }
                        } else {
                            importedContent = parsedData;
                        }
                        sessionStorage.removeItem('imported_cv_data');
                    } catch (e) { console.error("Lỗi parse import data:", e); }
                }

                if (cvId && token) {
                    const res = await apiClient.get(`/Cv/${cvId}`);
                    const actualCv = res?.data ? res.data : res;

                    if (actualCv) {
                        if (actualCv.tieuDe || actualCv.TieuDe) {
                            setCvTitle(actualCv.tieuDe || actualCv.TieuDe);
                        }
                        if (actualCv.maHex || actualCv.MaHex) {
                            updateLayoutSetting('themeColor', actualCv.maHex || actualCv.MaHex);
                        }

                        const layoutJson = actualCv.customLayoutJson
                            ? (typeof actualCv.customLayoutJson === 'string' ? JSON.parse(actualCv.customLayoutJson) : actualCv.customLayoutJson)
                            : null;

                        const contentData = actualCv.duLieuCv
                            ? (typeof actualCv.duLieuCv === 'string' ? JSON.parse(actualCv.duLieuCv) : actualCv.duLieuCv)
                            : null;

                        // 🌟 1. QUÉT TRỰC TIẾP CÁC TIÊU ĐỀ TIẾNG ANH TRONG LAYOUT ĐANG CÓ
                        const layoutStr = JSON.stringify(layoutJson || {});
                        const isLayoutEnglish =
                            layoutStr.includes('Career Objective') ||
                            layoutStr.includes('Work Experience') ||
                            layoutStr.includes('Education') ||
                            layoutStr.includes('Target Position') ||
                            layoutStr.includes('Honors & Awards') ||
                            layoutStr.includes('Certificates') ||
                            layoutStr.includes('Activities');

                        // 🌟 2. ĐỌC GIÁ TRỊ TỪ CSDL VÀ CHUẨN HÓA
                        const rawDbLang = String(actualCv.ngonNgu || actualCv.NgonNgu || actualCv.language || '').toLowerCase().trim();
                        const isDbEnglish = rawDbLang === 'en' || rawDbLang.includes('anh') || rawDbLang.includes('english');

                        // 🌟 3. NẾU BẢN THÂN LAYOUT LÀ TIẾNG ANH HOẶC DB LƯU TIẾNG ANH -> SET 'en'
                        let finalLang = (isLayoutEnglish || isDbEnglish) ? 'en' : 'vi';

                        // Đồng bộ State, URL và Store
                        setLang(finalLang);
                        setSearchParams(prev => {
                            prev.set('lang', finalLang);
                            return prev;
                        }, { replace: true });
                        updateLayoutSetting('language', finalLang);

                        setInitialData(importedLayout || layoutJson, importedContent || contentData);
                    }
                } else {
                    let initialContent = importedContent || {
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

                            let safeColorParam = (colorParam && colorParam !== 'null' && colorParam !== 'undefined') ? colorParam : null;
                            let finalThemeColor = safeColorParam || actualTemplate?.colors?.[0] || (templateId === '3' ? '#574040' : '#1890ff');

                            if (importedSettings && importedSettings.themeColor) {
                                finalThemeColor = importedSettings.themeColor;
                            }

                            updateLayoutSetting('themeColor', finalThemeColor);

                            let rawData = actualTemplate?.layoutJson || actualTemplate?.LayoutJson;
                            if (rawData) {
                                if (typeof rawData === 'string') rawData = rawData.replace(/^\uFEFF/, '').trim();
                                templateLayout = typeof rawData === 'object' ? rawData : JSON.parse(rawData);
                                if (typeof templateLayout === 'string') templateLayout = JSON.parse(templateLayout);

                                const jsonString = JSON.stringify(templateLayout);
                                const isEn = jsonString.includes('Work Experience') || jsonString.includes('Target Position') || jsonString.includes('Education');

                                const rawTemplateLang = actualTemplate?.ngonNgu || actualTemplate?.NgonNgu || '';
                                const cleanTemplateLang = String(rawTemplateLang).toLowerCase().trim();

                                let targetLang = searchParams.get('lang');
                                if (!targetLang) {
                                    if (cleanTemplateLang === 'en' || cleanTemplateLang.includes('anh') || cleanTemplateLang.includes('english') || isEn) {
                                        targetLang = 'en';
                                    } else {
                                        targetLang = 'vi';
                                    }
                                }

                                setLang(targetLang);
                                setSearchParams(prev => { prev.set('lang', targetLang); return prev; }, { replace: true });

                                templateLayout = translateLayoutTree(templateLayout, targetLang);
                            }

                            if (source === 'suggested' && !importedContent) {
                                let dummyDataStr = actualTemplate?.duLieuMau || actualTemplate?.DuLieuMau;
                                if (dummyDataStr) {
                                    try {
                                        let parsedDummy = typeof dummyDataStr === 'string' ? JSON.parse(dummyDataStr.replace(/^\uFEFF/, '').trim()) : dummyDataStr;
                                        initialContent = (parsedDummy.vi && parsedDummy.en) ? (parsedDummy[targetLang] || parsedDummy.vi) : parsedDummy;
                                        initialContent.personalInfo = {
                                            ...initialContent.personalInfo,
                                            fullName: userInfo?.fullName || initialContent.personalInfo?.fullName || '',
                                            email: userInfo?.email || initialContent.personalInfo?.email || ''
                                        };

                                        const emptyKeys = ['projects', 'activities', 'awards', 'certificates', 'hobbies']
                                            .filter(key => !initialContent[key] || (Array.isArray(initialContent[key]) && initialContent[key].length === 0))
                                            .map(key => `section-${key}`);

                                        const cleanLayout = (node) => {
                                            if (Array.isArray(node)) return node.map(cleanLayout).filter(item => item !== null);
                                            else if (typeof node === 'object' && node !== null) {
                                                const blockId = node.id || node.type || node.blockId || node.key;
                                                if (emptyKeys.includes(blockId)) return null;
                                                const newNode = {};
                                                for (let k in node) newNode[k] = cleanLayout(node[k]);
                                                for (let k in newNode) if (Array.isArray(newNode[k])) newNode[k] = newNode[k].filter(item => item !== null);
                                                return newNode;
                                            }
                                            return node;
                                        };
                                        if (templateLayout) templateLayout = cleanLayout(templateLayout);
                                    } catch (e) { console.error("Lỗi parse DuLieuMau:", e); }
                                }
                            }
                        } catch (err) { console.error("Lỗi gọi API hoặc định dạng JSON:", err); }
                    }

                    setInitialData(importedLayout || templateLayout, initialContent);
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

        // BẢO TOÀN TẤT CẢ PARAM HIỆN CÓ TRÊN URL
        setSearchParams(prev => {
            prev.set('lang', selectedLang);
            return prev;
        }, { replace: true });

        const store = useCvStore.getState();
        const currentLayout = store.layoutSchema || store.schema;
        const currentContent = store.cvData;

        // Dịch tiêu đề trong layout nhưng GIỮ NGUYÊN 100% dữ liệu đã nhập (currentContent)
        if (currentLayout) {
            const translatedLayout = translateLayoutTree(currentLayout, selectedLang);
            setInitialData(translatedLayout, currentContent);
        }

        message.success(`Đã chuyển đổi cấu trúc ngôn ngữ: ${selectedLang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}`);
    };

    const handleDownloadPDF = async () => {
        const cvPageElement = document.querySelector('.workspace-area .cv-preview-page');
        if (!cvPageElement) {
            message.error('Không tìm thấy khung CV để xuất PDF!');
            return;
        }

        message.loading({ content: 'Đang xử lý và tải PDF...', key: 'pdf_loading', duration: 0 });
        cvPageElement.classList.add('is-exporting');

        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            const opt = {
                margin: 0,
                filename: `${(cvTitle || 'CV_JobsNow').replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const pdfBlob = await html2pdf().set(opt).from(cvPageElement).output('blob');
            const arrayBuffer = await pdfBlob.arrayBuffer();

            const pdfDoc = await PDFDocument.load(arrayBuffer);

            const store = useCvStore.getState();
            const exportBundle = {
                cvData: store.cvData,
                layoutSchema: store.layoutSchema || store.schema,
                settings: store.layoutSettings
            };
            const cvDataJson = JSON.stringify(exportBundle);

            const encodedJson = window.btoa(unescape(encodeURIComponent(cvDataJson)));

            pdfDoc.getInfoDict().set(PDFName.of('JobsNowCvData'), PDFString.of(encodedJson));

            const pdfBytes = await pdfDoc.save();
            const finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(finalBlob);
            link.download = opt.filename;
            link.click();
            URL.revokeObjectURL(link.href);

            message.success({ content: 'Tải PDF thành công!', key: 'pdf_loading', duration: 2 });
        } catch (error) {
            console.error('Lỗi khi xuất PDF:', error);
            message.error({ content: 'Có lỗi xảy ra khi tải PDF!', key: 'pdf_loading', duration: 2 });
        } finally {
            cvPageElement.classList.remove('is-exporting');
        }
    };

    const handleSaveCV = async () => {
        try {
            // 1. Kiểm tra đăng nhập
            if (!token || !userId) {
                message.warning('Vui lòng đăng nhập tài khoản để lưu CV!');
                navigate('/login');
                return;
            }

            const store = useCvStore.getState();
            const currentCvData = store.cvData || {};
            const currentLayout = store.layoutSchema || store.schema;

            const executeSave = async (isSaveAsCopy = false) => {
                const hideLoading = message.loading(isSaveAsCopy ? 'Đang tạo bản CV mới...' : 'Đang lưu hồ sơ CV...', 0);
                const cvPageElement = document.querySelector('.workspace-area .cv-preview-page');
                let uploadedImageUrl = currentCvData.personalInfo?.avatar || "";

                try {
                    // 2. Chụp ảnh preview (Tự động bỏ qua nếu lỗi CORS để không làm gián đoạn việc lưu)
                    if (cvPageElement) {
                        try {
                            cvPageElement.classList.add('is-exporting');
                            const canvas = await html2canvas(cvPageElement, {
                                useCORS: true,
                                allowTaint: true,
                                scale: 1.5,
                                logging: false
                            });
                            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                            if (blob) {
                                const formData = new FormData();
                                formData.append('file', blob, 'cv_screenshot.png');
                                const uploadRes = await apiClient.post('/Upload/image', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                uploadedImageUrl = uploadRes?.url || uploadRes?.data?.url || uploadRes || uploadedImageUrl;
                            }
                        } catch (imgErr) {
                            console.warn("Bỏ qua lỗi chụp ảnh preview CV:", imgErr);
                        } finally {
                            cvPageElement.classList.remove('is-exporting');
                        }
                    }

                    // 3. Chuẩn hóa ID an toàn (Tránh NaN)
                    const parsedCvId = (cvId && !isSaveAsCopy && !isNaN(parseInt(cvId))) ? parseInt(cvId) : null;
                    const parsedUserId = !isNaN(parseInt(userId)) ? parseInt(userId) : userId;
                    const parsedTemplateId = (!isNaN(parseInt(templateId))) ? parseInt(templateId) : 1;

                    const payload = {
                        maCv: parsedCvId,
                        maUser: parsedUserId,
                        maMau: parsedTemplateId,
                        maHex: themeColor || '#1890ff',
                        tieuDe: isSaveAsCopy ? `${cvTitle} (Bản sao)` : (cvTitle || 'CV_Moi'),
                        duLieuCv: JSON.stringify(currentCvData),
                        customLayoutJson: JSON.stringify(currentLayout),
                        isPublic: true,
                        duongDan: uploadedImageUrl,
                        fontChu: fontFamily || '"Be Vietnam Pro", sans-serif',
                        ngonNgu: lang || 'vi'
                    };

                    // 4. Gửi API lưu dữ liệu CV
                    await apiClient.post('/Cv', payload);

                    setIsDirty(false);
                    hideLoading();
                    message.success(isSaveAsCopy ? 'Đã tạo thành công một bản CV mới!' : 'Lưu hồ sơ CV thành công!');
                    navigate('/manage-cv');

                } catch (err) {
                    hideLoading();
                    console.error("Lỗi khi gọi API lưu CV:", err);
                    const errorMessage = err.response?.data?.message || err.data?.message || '';

                    if (errorMessage.toLowerCase().includes('đã được nộp') || errorMessage.toLowerCase().includes('không thể sửa')) {
                        Modal.confirm({
                            title: 'Tạo bản sao CV',
                            icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                            content: 'CV này đã nộp cho Nhà tuyển dụng nên không thể ghi đè. Bạn có muốn lưu thành một bản CV mới?',
                            okText: 'Lưu thành bản mới',
                            cancelText: 'Hủy bỏ',
                            okButtonProps: { style: { backgroundColor: '#1890ff', borderColor: '#1890ff' } },
                            onOk: () => {
                                executeSave(true);
                            }
                        });
                    } else {
                        message.error(errorMessage || 'Lỗi hệ thống khi lưu dữ liệu CV!');
                    }
                }
            };

            // 5. Kiểm tra thông tin bắt buộc
            const personal = currentCvData.personalInfo || {};
            const isPhoneEmpty = !personal.phone || !personal.phone.trim();
            const isEmailEmpty = !personal.email || !personal.email.trim();
            const hasEmptyRequired = isPhoneEmpty || isEmailEmpty;

            if (hasEmptyRequired) {
                Modal.confirm({
                    title: 'Cảnh báo: Thiếu thông tin bắt buộc',
                    icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                    content: 'Bạn đang để trống số điện thoại hoặc email liên hệ. Bạn có chắc chắn muốn tiếp tục lưu CV không?',
                    okText: 'Vẫn lưu CV',
                    cancelText: 'Quay lại sửa',
                    okButtonProps: { danger: true },
                    onOk: () => {
                        executeSave();
                    }
                });
            } else {
                executeSave();
            }

        } catch (globalErr) {
            console.error("Lỗi xử lý lưu CV:", globalErr);
            message.error("Có lỗi xảy ra trong quá trình chuẩn bị dữ liệu lưu CV!");
        }
    };

    if (pageLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: themeColorsUI.bgMain }}><Spin size="large" /></div>;

    return (
        <div className="cv-builder-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: themeColorsUI.bgMain, overflow: 'hidden' }}>

            {/* HEADER */}
            <div className="cv-builder-header no-print" style={{ backgroundColor: themeColorsUI.bgHeader, borderColor: themeColorsUI.borderColor }}>
                <Space size="middle" align="center">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="header-icon-btn"
                        style={{ color: themeColorsUI.textSub }}
                        onClick={handleGoBack}
                    />
                    <Space size="small">
                        <FileTextFilled style={{ color: '#1890ff', fontSize: '20px' }} />
                        <Input className="cv-title-input" value={cvTitle} onChange={(e) => setCvTitle(e.target.value)} placeholder="Tên CV..." style={{ color: themeColorsUI.textMain }} />
                    </Space>
                </Space>
                <Space size="middle">
                    <Tooltip title="Hoàn tác">
                        <Button
                            type="text"
                            icon={<UndoOutlined />}
                            className="header-icon-btn"
                            onClick={handleUndo}
                            disabled={pastHistory.length <= 1}
                            style={{ color: pastHistory.length <= 1 ? themeColorsUI.borderColor : themeColorsUI.textSub }}
                        />
                    </Tooltip>
                    <Tooltip title="Làm lại">
                        <Button
                            type="text"
                            icon={<RedoOutlined />}
                            className="header-icon-btn"
                            onClick={handleRedo}
                            disabled={futureHistory.length === 0}
                            style={{ color: futureHistory.length === 0 ? themeColorsUI.borderColor : themeColorsUI.textSub }}
                        />
                    </Tooltip>

                    <Button
                        type="default"
                        icon={<DownloadOutlined />}
                        className="header-btn-pdf"
                        onClick={handleDownloadPDF}
                        style={{ backgroundColor: themeColorsUI.inputBg, borderColor: '#1890ff', color: '#1890ff' }}
                    >
                        Tải PDF
                    </Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        className="header-btn-save"
                        onClick={handleSaveCV}
                        style={{ background: 'linear-gradient(90deg, #1890ff, #096dd9)', border: 'none', fontWeight: 500 }}
                    >
                        Lưu CV
                    </Button>
                </Space>
            </div>

            <div className="builder-body">
                {/* SIDEBAR */}
                <div className="sidebar-menu no-print" style={{ backgroundColor: themeColorsUI.bgSidebar, borderColor: themeColorsUI.borderColor }}>
                    <div className={`menu-btn ${activeMenu === 'design' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'design' ? null : 'design')}>
                        <FormatPainterOutlined /><span style={{ color: activeMenu === 'design' ? '#1890ff' : themeColorsUI.textSub }}>Thiết kế & Font</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'layout' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'layout' ? null : 'layout')}>
                        <LayoutOutlined /><span style={{ color: activeMenu === 'layout' ? '#1890ff' : themeColorsUI.textSub }}>Bố cục</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'change-template' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'change-template' ? null : 'change-template')}>
                        <SwapOutlined /><span style={{ color: activeMenu === 'change-template' ? '#1890ff' : themeColorsUI.textSub }}>Đổi mẫu CV</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'tips' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'tips' ? null : 'tips')}>
                        <BulbOutlined /><span style={{ color: activeMenu === 'tips' ? '#1890ff' : themeColorsUI.textSub }}>Gợi ý viết CV</span>
                    </div>
                </div>

                {/* SETTINGS PANEL */}
                <div className={`settings-panel no-print ${!activeMenu ? 'hidden' : ''}`} style={{ backgroundColor: themeColorsUI.bgPanel, borderColor: themeColorsUI.borderColor }}>
                    {activeMenu && (
                        <div className="panel-header" style={{ borderColor: themeColorsUI.borderColor }}>
                            <Title level={5} style={{ color: themeColorsUI.textMain, margin: 0 }}>
                                {activeMenu === 'design' && 'Thiết kế & Font'}
                                {activeMenu === 'change-template' && 'Mẫu CV'}
                                {activeMenu === 'layout' && 'Bố cục CV'}
                                {activeMenu === 'tips' && 'Gợi ý viết CV'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} style={{ color: themeColorsUI.textSub }} onClick={() => setActiveMenu(null)} />
                        </div>
                    )}

                    <div className="panel-content">
                        {/* TAB 1: THIẾT KẾ & FONT */}
                        {activeMenu === 'design' && (
                            <div>
                                <div style={{ marginBottom: '24px' }}>
                                    <span className="custom-form-label" style={{ color: themeColorsUI.textSub }}>NGÔN NGỮ CV</span>
                                    <Space size="small">
                                        <button className={`topcv-lang-button ${lang === 'vi' ? 'active' : ''}`} onClick={() => handleLanguageToggle('vi')} style={{ backgroundColor: lang === 'vi' ? 'rgba(24,144,255,0.1)' : themeColorsUI.inputBg, color: lang === 'vi' ? '#1890ff' : themeColorsUI.textSub, borderColor: lang === 'vi' ? '#1890ff' : themeColorsUI.borderColor }}>Tiếng Việt</button>
                                        <button className={`topcv-lang-button ${lang === 'en' ? 'active' : ''}`} onClick={() => handleLanguageToggle('en')} style={{ backgroundColor: lang === 'en' ? 'rgba(24,144,255,0.1)' : themeColorsUI.inputBg, color: lang === 'en' ? '#1890ff' : themeColorsUI.textSub, borderColor: lang === 'en' ? '#1890ff' : themeColorsUI.borderColor }}>Tiếng Anh</button>
                                    </Space>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <span className="custom-form-label" style={{ color: themeColorsUI.textSub }}>FONT CHỮ</span>
                                    <Select value={fontFamily} onChange={(val) => updateLayoutSetting && updateLayoutSetting('fontFamily', val)} style={{ width: '100%' }} dropdownStyle={{ backgroundColor: themeColorsUI.inputBg, color: themeColorsUI.textMain }} className="custom-input">
                                        {fontOptions.map(font => <Option key={font.value} value={font.value}><span style={{ fontFamily: font.value, color: themeColorsUI.textMain }}>{font.label}</span></Option>)}
                                    </Select>
                                </div>

                                <div style={{ marginBottom: '28px' }}>
                                    <span className="custom-form-label" style={{ color: themeColorsUI.textSub }}>CỠ CHỮ</span>
                                    <Slider min={12} max={17} step={1} value={fontSize || 14} marks={fontSizeMarks} onChange={(val) => updateLayoutSetting && updateLayoutSetting('fontSize', val)} tooltip={{ formatter: null }} trackStyle={{ backgroundColor: '#1890ff' }} handleStyle={{ borderColor: '#1890ff', backgroundColor: '#1890ff' }} />
                                </div>

                                <div style={{ marginBottom: '32px', paddingTop: '8px' }}>
                                    <span className="custom-form-label" style={{ color: themeColorsUI.textSub }}>KHOẢNG CÁCH DÒNG</span>
                                    <Slider min={1.0} max={2.0} step={0.14} value={lineHeight || 1.45} marks={lineHeightMarks} onChange={(val) => updateLayoutSetting && updateLayoutSetting('lineHeight', val)} tooltip={{ formatter: null }} trackStyle={{ backgroundColor: '#1890ff' }} handleStyle={{ borderColor: '#1890ff', backgroundColor: '#1890ff' }} />
                                </div>

                                <div style={{ marginBottom: '28px' }}>
                                    <span className="custom-form-label" style={{ marginBottom: '12px', color: themeColorsUI.textSub }}>MÀU CHỦ ĐỀ</span>
                                    <Space size="middle" wrap style={{ marginBottom: '14px' }}>
                                        {paletteColors.map(color => (
                                            <div key={color} className={`color-circle ${themeColor === color ? 'active' : ''}`} style={{ backgroundColor: color, borderColor: themeColor === color ? themeColorsUI.textMain : 'transparent' }} onClick={() => updateLayoutSetting && updateLayoutSetting('themeColor', color)} />
                                        ))}
                                    </Space>
                                    <div style={{ background: themeColorsUI.inputBg, padding: '12px', borderRadius: '6px', border: `1px solid ${themeColorsUI.borderColor}` }}>
                                        <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '4px', overflow: 'hidden', background: 'linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, rgba(255,0,0,0)), red', marginBottom: '10px' }}>
                                            <input type="color" value={themeColor || '#1890ff'} onChange={(e) => updateLayoutSetting && updateLayoutSetting('themeColor', e.target.value)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                            <div style={{ width: '100%', height: '100%', background: `linear-gradient(to top, #000000cc, transparent), linear-gradient(to right, #ffffffcc, ${themeColor || '#1890ff'})` }} />
                                        </div>
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <div style={{ width: '45px', height: '28px', borderRadius: '4px', backgroundColor: themeColor || '#1890ff', border: `1px solid ${themeColorsUI.borderColor}` }} />
                                            <Input size="small" value={(themeColor || '#1890ff').replace('#', '').toUpperCase()} onChange={(e) => { const val = e.target.value; if (val.length <= 6) updateLayoutSetting && updateLayoutSetting('themeColor', `#${val}`); }} style={{ width: '180px', textAlign: 'center', fontFamily: 'monospace' }} className="custom-input" prefix="#" />
                                        </Space>
                                    </div>
                                </div>

                                <div>
                                    <span className="custom-form-label" style={{ color: themeColorsUI.textSub }}>HÌNH NỀN CV</span>
                                    <div className="bg-pattern-grid">
                                        {bgPatterns.map(pattern => (
                                            <div
                                                key={pattern.id}
                                                className={`bg-pattern-item ${backgroundStyle === pattern.value ? 'active' : ''}`}
                                                style={{ background: pattern.css }}
                                                onClick={() => updateLayoutSetting && updateLayoutSetting('backgroundStyle', pattern.value)}
                                            >
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

                        {/* TAB ĐỔI MẪU CV */}
                        {activeMenu === 'change-template' && (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '20px' }}>
                                    {loadingTemplates ? (
                                        <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px 0' }}><Spin /></div>
                                    ) : templateList.length > 0 ? (
                                        templateList.map(tpl => {
                                            const id = tpl.id;
                                            const name = tpl.title || 'Mẫu chưa đặt tên';
                                            let image = tpl.image;

                                            if (!image) {
                                                image = 'https://via.placeholder.com/210x297/333333/8c8c8c?text=No+Image';
                                            }

                                            const isActive = String(templateId) === String(id);

                                            return (
                                                <div
                                                    key={id}
                                                    onClick={() => handleApplyTemplate(id, name)}
                                                    style={{
                                                        background: themeColorsUI.inputBg,
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        border: `2px solid ${isActive ? '#1890ff' : themeColorsUI.borderColor}`,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        transition: 'all 0.2s',
                                                        boxShadow: isActive ? '0 4px 12px rgba(24, 144, 255, 0.2)' : 'none'
                                                    }}
                                                >
                                                    <div style={{ width: '100%', aspectRatio: '1 / 1.414', background: '#fff', overflow: 'hidden', borderBottom: `1px solid ${themeColorsUI.borderColor}` }}>
                                                        <img
                                                            src={image}
                                                            alt={name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/210x297/333333/8c8c8c?text=Image+Error';
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ padding: '12px 8px', color: themeColorsUI.textMain, fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>
                                                        {name}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ gridColumn: 'span 2', textAlign: 'center', color: themeColorsUI.textSub, fontStyle: 'italic' }}>
                                            Chưa có dữ liệu mẫu CV.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB BỐ CỤC */}
                        {activeMenu === 'layout' && (() => {
                            const store = useCvStore.getState();
                            const currentSchema = layoutSchema;
                            let leftCol = null; let rightCol = null; let mainCol = null;

                            const schemaCopy = JSON.parse(JSON.stringify(currentSchema));
                            const findCols = (node) => {
                                if (!node) return;
                                if (node.id === 'left-col') leftCol = node;
                                if (node.id === 'right-col') rightCol = node;
                                if (node.id === 'main-col') mainCol = node;
                                if (node.children) node.children.forEach(findCols);
                            };
                            findCols(schemaCopy);

                            const getUsedIds = (node) => {
                                let ids = [];
                                if (node && node.id) ids.push(node.id);
                                if (node && node.children) node.children.forEach(c => { ids = ids.concat(getUsedIds(c)); });
                                return ids;
                            };
                            const usedIds = getUsedIds(schemaCopy);

                            const ALL_SECTIONS = [
                                { id: 'section-avatar-profile', label: 'Ảnh đại diện' },
                                { id: 'section-business-card', label: 'Danh thiếp' },
                                { id: 'section-contact-info', label: 'Thông tin cá nhân' },
                                { id: 'section-summary', label: 'Mục tiêu nghề nghiệp' },
                                { id: 'section-experience', label: 'Kinh nghiệm làm việc' },
                                { id: 'section-education', label: 'Học vấn' },
                                { id: 'section-skills', label: 'Kỹ năng' },
                                { id: 'section-projects', label: 'Dự án' },
                                { id: 'section-awards', label: 'Giải thưởng' },
                                { id: 'section-certificates', label: 'Chứng chỉ' },
                                { id: 'section-activities', label: 'Hoạt động' },
                                { id: 'section-hobbies', label: 'Sở thích' },
                                { id: 'section-references', label: 'Người giới thiệu' },
                                { id: 'section-additional', label: 'Thông tin thêm' }
                            ];

                            const leftSections = (leftCol?.children || []).map(c => ALL_SECTIONS.find(a => a.id === c.id)).filter(Boolean);
                            const rightSections = (rightCol?.children || []).map(c => ALL_SECTIONS.find(a => a.id === c.id)).filter(Boolean);
                            const mainSections = (mainCol?.children || []).map(c => ALL_SECTIONS.find(a => a.id === c.id)).filter(Boolean);
                            const unusedSections = ALL_SECTIONS.filter(s => !usedIds.includes(s.id));

                            const onDragStart = (e, id, isNew) => {
                                e.dataTransfer.setData("text/sidebar-id", id);
                                e.dataTransfer.setData("text/sidebar-is-new", isNew ? "true" : "false");
                                window.__sidebarDragId = id;

                                const target = e.currentTarget;
                                setTimeout(() => {
                                    if (target) target.style.display = 'none';
                                }, 0);
                            };

                            const onDragEnd = (e) => {
                                if (e.currentTarget) e.currentTarget.style.display = 'block';
                                const placeholder = document.getElementById('sidebar-drag-placeholder');
                                if (placeholder) placeholder.remove();
                                window.__sidebarDragId = null;
                            };

                            const onDragOver = (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const draggedId = window.__sidebarDragId;
                                if (!draggedId) return;

                                let placeholder = document.getElementById('sidebar-drag-placeholder');
                                if (!placeholder) {
                                    placeholder = document.createElement('div');
                                    placeholder.id = 'sidebar-drag-placeholder';
                                    placeholder.style.height = '38px';
                                    placeholder.style.backgroundColor = 'rgba(24, 144, 255, 0.15)';
                                    placeholder.style.border = '1px dashed #1890ff';
                                    placeholder.style.borderRadius = '6px';
                                    placeholder.style.marginBottom = '8px';
                                    placeholder.style.pointerEvents = 'none';
                                }

                                const container = e.currentTarget;
                                const targetEl = e.target.closest('[data-sidebar-id]');

                                if (targetEl && targetEl.getAttribute('data-sidebar-id') !== draggedId) {
                                    const rect = targetEl.getBoundingClientRect();
                                    const midY = rect.top + rect.height / 2;
                                    if (e.clientY < midY) {
                                        container.insertBefore(placeholder, targetEl);
                                    } else {
                                        container.insertBefore(placeholder, targetEl.nextSibling);
                                    }
                                } else if (!targetEl && e.target === container) {
                                    if (!container.contains(placeholder)) container.appendChild(placeholder);
                                }
                            };

                            const onDrop = (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const id = e.dataTransfer.getData("text/sidebar-id");
                                const isNew = e.dataTransfer.getData("text/sidebar-is-new") === "true";
                                const placeholder = document.getElementById('sidebar-drag-placeholder');

                                if (!id || !placeholder) {
                                    if (placeholder) placeholder.remove();
                                    window.__sidebarDragId = null;
                                    return;
                                }

                                const newParentNode = placeholder.parentNode;
                                const targetColId = newParentNode.getAttribute('data-col-id');

                                const newOrderIds = [];
                                Array.from(newParentNode.children).forEach(child => {
                                    if (child.id === 'sidebar-drag-placeholder') {
                                        newOrderIds.push(id);
                                    } else if (child.hasAttribute('data-sidebar-id')) {
                                        const childId = child.getAttribute('data-sidebar-id');
                                        if (childId !== id) {
                                            newOrderIds.push(childId);
                                        }
                                    }
                                });

                                placeholder.remove();
                                window.__sidebarDragId = null;

                                const newSchema = JSON.parse(JSON.stringify(currentSchema));
                                let draggedNode = null;

                                if (isNew) {
                                    draggedNode = getNewSectionJson(id);
                                    if (draggedNode && lang === 'en') draggedNode = translateLayoutTree(draggedNode, 'en');
                                } else {
                                    const extractItem = (parent) => {
                                        if (!parent || !parent.children) return false;
                                        const idx = parent.children.findIndex(c => c && c.id === id);
                                        if (idx > -1) { draggedNode = parent.children[idx]; parent.children.splice(idx, 1); return true; }
                                        for (const c of parent.children) { if (extractItem(c)) return true; }
                                        return false;
                                    };
                                    extractItem(newSchema);
                                }

                                if (draggedNode && targetColId) {
                                    //TỰ ĐỘNG CHUYỂN ĐỔI BỐ CỤC KHỐI THEO CỘT ĐÍCH (TRÁI HOẶC PHẢI)
                                    draggedNode = transformSectionForColumn(draggedNode, targetColId, lang);
                                    if (lang === 'en') {
                                        draggedNode = translateLayoutTree(draggedNode, 'en');
                                    }

                                    const findColAndInsert = (parent) => {
                                        if (parent?.id === targetColId) {
                                            if (!parent.children) parent.children = [];
                                            parent.children.push(draggedNode);
                                            parent.children.sort((a, b) => {
                                                const idxA = newOrderIds.indexOf(a.id);
                                                const idxB = newOrderIds.indexOf(b.id);
                                                if (idxA === -1) return 1;
                                                if (idxB === -1) return -1;
                                                return idxA - idxB;
                                            });
                                            return true;
                                        }
                                        if (parent?.children) { for (const c of parent.children) { if (findColAndInsert(c)) return true; } }
                                        return false;
                                    };
                                    findColAndInsert(newSchema);
                                    store.setInitialData(newSchema, store.cvData);
                                }
                            };

                            const onTrashDragOver = (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const placeholder = document.getElementById('sidebar-drag-placeholder');
                                if (placeholder) placeholder.remove();

                                const draggedId = window.__sidebarDragId;

                                if (draggedId === 'section-avatar-profile' || draggedId === 'section-contact-info' || draggedId === 'section-business-card') {
                                    e.dataTransfer.dropEffect = 'none'; return;
                                }
                                e.dataTransfer.dropEffect = 'move';
                                e.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.03)';
                            };

                            const onTrashDragLeave = (e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            };

                            const onTrashDrop = (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.style.backgroundColor = 'transparent';

                                const id = e.dataTransfer.getData("text/sidebar-id");
                                const isNew = e.dataTransfer.getData("text/sidebar-is-new") === "true";

                                if (!id || isNew) {
                                    window.__sidebarDragId = null;
                                    return;
                                }

                                if (id === 'section-avatar-profile' || id === 'section-contact-info') {
                                    message.warning('Không thể ẩn Ảnh đại diện và Thông tin cá nhân khỏi CV!');
                                    window.__sidebarDragId = null;
                                    return;
                                }

                                const newSchema = JSON.parse(JSON.stringify(currentSchema));
                                const extractItem = (parent) => {
                                    if (!parent || !parent.children) return false;
                                    const idx = parent.children.findIndex(c => c && c.id === id);
                                    if (idx > -1) { parent.children.splice(idx, 1); return true; }
                                    for (const c of parent.children) { if (extractItem(c)) return true; }
                                    return false;
                                };

                                extractItem(newSchema);
                                store.setInitialData(newSchema, store.cvData);
                                window.__sidebarDragId = null;
                            };

                            const itemStyle = {
                                backgroundColor: themeColorsUI.inputBg, padding: '10px', borderRadius: '6px', textAlign: 'center', cursor: 'grab',
                                fontSize: '12px', fontWeight: '500', transition: '0.2s', border: `1px solid ${themeColorsUI.borderColor}`, marginBottom: '8px', color: themeColorsUI.textMain
                            };

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <style>{`
                                        .cv-layout-scroll-area::-webkit-scrollbar { width: 6px; }
                                        .cv-layout-scroll-area::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
                                        .cv-layout-scroll-area::-webkit-scrollbar-thumb:hover { background: #1890ff; }
                                    `}</style>

                                    {/* KHU VỰC CUỘN CHO BỐ CỤC CHÍNH */}
                                    <div className="cv-layout-scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '420px', overflowY: 'auto', paddingRight: '4px' }}>

                                        {(leftCol || rightCol) && (
                                            <div ref={sidebarLayoutRef} style={{ display: 'flex', backgroundColor: themeColorsUI.bgHeader, borderRadius: '8px', border: `1px solid ${themeColorsUI.borderColor}`, overflow: 'hidden', minHeight: '140px', position: 'relative', flexShrink: 0 }}>
                                                {leftCol && (
                                                    <div className="cv-mini-col" data-col-id="left-col" onDragOver={onDragOver} onDrop={onDrop} style={{ width: `${tempColWidth}%`, padding: '10px', backgroundColor: themeColorsUI.bgPanel, borderRight: `1px solid ${themeColorsUI.borderColor}`, display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ textAlign: 'center', color: '#1890ff', fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', borderBottom: `1px dashed ${themeColorsUI.borderColor}`, paddingBottom: '6px' }}>{Math.round(tempColWidth)}%</div>
                                                        {leftSections.map(s => (
                                                            <div key={s.id} data-sidebar-id={s.id} draggable onDragStart={(e) => onDragStart(e, s.id, false)} onDragEnd={onDragEnd} style={itemStyle}>{s.label}</div>
                                                        ))}
                                                    </div>
                                                )}

                                                {(leftCol && rightCol) && (
                                                    <Tooltip title="Thay đổi chiều rộng cột" placement="top">
                                                        <div
                                                            onMouseDown={() => setIsResizingCols(true)}
                                                            style={{
                                                                width: '8px',
                                                                marginLeft: '-4px',
                                                                marginRight: '-4px',
                                                                backgroundColor: isResizingCols ? '#1890ff' : 'transparent',
                                                                cursor: 'col-resize',
                                                                position: 'relative',
                                                                zIndex: 10,
                                                                transition: 'background 0.2s',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '24px', backgroundColor: isResizingCols ? '#fff' : themeColorsUI.textSub, borderRadius: '2px' }} />
                                                        </div>
                                                    </Tooltip>
                                                )}

                                                {rightCol && (
                                                    <div className="cv-mini-col" data-col-id="right-col" onDragOver={onDragOver} onDrop={onDrop} style={{ width: leftCol ? `${100 - tempColWidth}%` : '100%', padding: '10px', backgroundColor: themeColorsUI.bgHeader, display: 'flex', flexDirection: 'column' }}>
                                                        {leftCol && <div style={{ textAlign: 'center', color: '#1890ff', fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', borderBottom: `1px dashed ${themeColorsUI.borderColor}`, paddingBottom: '6px' }}>{Math.round(100 - tempColWidth)}%</div>}
                                                        {rightSections.map(s => (
                                                            <div key={s.id} data-sidebar-id={s.id} draggable onDragStart={(e) => onDragStart(e, s.id, false)} onDragEnd={onDragEnd} style={itemStyle}>{s.label}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {mainCol && (
                                            <div className="cv-mini-col" data-col-id="main-col" onDragOver={onDragOver} onDrop={onDrop} style={{ backgroundColor: themeColorsUI.bgHeader, borderRadius: '8px', border: `1px solid ${themeColorsUI.borderColor}`, padding: '10px', display: 'flex', flexDirection: 'column', minHeight: '120px', flexShrink: 0 }}>
                                                {mainSections.map(s => (
                                                    <div key={s.id} data-sidebar-id={s.id} draggable onDragStart={(e) => onDragStart(e, s.id, false)} onDragEnd={onDragEnd} style={itemStyle}>
                                                        {s.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div onDragOver={onTrashDragOver} onDragLeave={onTrashDragLeave} onDrop={onTrashDrop} style={{ marginTop: '20px', borderTop: `1px dashed ${themeColorsUI.borderColor}`, paddingTop: '15px', minHeight: '130px', borderRadius: '8px', transition: 'background 0.2s', flexShrink: 0 }}>
                                        <span className="custom-form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '15px', pointerEvents: 'none', color: themeColorsUI.textSub }}>MỤC CHƯA SỬ DỤNG</span>
                                        {unusedSections.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', pointerEvents: 'none' }}>
                                                {unusedSections.map(s => (
                                                    <div key={s.id} draggable onDragStart={(e) => { e.currentTarget.style.pointerEvents = 'auto'; onDragStart(e, s.id, true); }} onDragEnd={(e) => { e.currentTarget.style.pointerEvents = 'none'; onDragEnd(e); }} style={{ ...itemStyle, marginBottom: 0, backgroundColor: themeColorsUI.inputBg, color: themeColorsUI.textMain, pointerEvents: 'auto' }}>{s.label}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: themeColorsUI.textSub, fontSize: '12px', fontStyle: 'italic', pointerEvents: 'none' }}>Kéo các mục xuống đây để ẩn khỏi CV</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* TAB GỢI Ý VIẾT CV BẰNG AI */}
                        {activeMenu === 'tips' && (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', boxSizing: 'border-box' }}>

                                {/* KHỐI HIỂN THỊ LƯỢT AI CÒN LẠI */}
                                <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(24, 144, 255, 0.08)', border: '1px solid rgba(24, 144, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ThunderboltFilled style={{ color: '#1890ff', fontSize: '18px' }} />
                                        <span style={{ fontWeight: 600, color: themeColorsUI.textMain, fontSize: '13px' }}>Lượt AI khả dụng:</span>
                                    </div>
                                    {aiBalance === -1 ? (
                                        <Tag color="gold" icon={<RobotOutlined />} style={{ fontWeight: 'bold', borderRadius: '12px', margin: 0 }}>
                                            Vô hạn (VIP)
                                        </Tag>
                                    ) : (
                                        <Tag color={aiBalance > 0 ? "blue" : "error"} style={{ fontWeight: 'bold', fontSize: '13px', borderRadius: '12px', margin: 0, padding: '2px 10px' }}>
                                            {aiBalance} lượt
                                        </Tag>
                                    )}
                                </div>

                                {/* TRẠNG THÁI 1: TÀI KHOẢN HẾT LƯỢT VÀ KHÔNG PHẢI VIP */}
                                {!canUseAi ? (
                                    <div style={{ textAlign: 'center', padding: '30px 16px', background: themeColorsUI.inputBg, borderRadius: '8px', border: `1px solid ${themeColorsUI.borderColor}`, width: '100%', boxSizing: 'border-box' }}>
                                        <LockOutlined style={{ fontSize: '36px', color: '#faad14', marginBottom: '16px' }} />
                                        <Title level={5} style={{ color: themeColorsUI.textMain, marginBottom: '8px', fontSize: '15px', whiteSpace: 'normal' }}>Bạn đã hết lượt dùng AI</Title>
                                        <p style={{ color: themeColorsUI.textSub, marginBottom: '20px', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'normal' }}>
                                            Nâng cấp tài khoản hoặc gia hạn gói dịch vụ để nhận thêm lượt trợ lý <strong>AI Gemini</strong> viết CV tự động.
                                        </p>
                                        <Button
                                            type="primary"
                                            onClick={() => navigate('/upgrade-vip')}
                                            style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#000', fontWeight: 'bold', width: '100%', borderRadius: '6px' }}
                                        >
                                            Nâng cấp / Mua thêm lượt
                                        </Button>
                                    </div>
                                ) : (

                                    /* TRẠNG THÁI 2: ĐỦ ĐIỀU KIỆN - HIỂN THỊ CÔNG CỤ AI */
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', boxSizing: 'border-box' }}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <span className="custom-form-label" style={{ display: 'block', marginBottom: '8px', color: themeColorsUI.textSub }}>NGÀNH NGHỀ / VỊ TRÍ</span>
                                            <Input
                                                placeholder="VD: Marketing, IT, Kế toán..."
                                                value={aiIndustry}
                                                onChange={e => setAiIndustry(e.target.value)}
                                                className="custom-input"
                                                style={{ background: themeColorsUI.inputBg, borderColor: themeColorsUI.borderColor, color: themeColorsUI.textMain }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <span className="custom-form-label" style={{ display: 'block', marginBottom: '8px', color: themeColorsUI.textSub }}>MÔ TẢ NGẮN GỌN VỀ BẠN</span>
                                            <Input.TextArea
                                                placeholder="VD: Có 2 năm làm content, từng chạy ads facebook, quản lý page 10k follow..."
                                                value={aiDescription}
                                                onChange={e => setAiDescription(e.target.value)}
                                                rows={4}
                                                className="custom-input"
                                                style={{ background: themeColorsUI.inputBg, borderColor: themeColorsUI.borderColor, color: themeColorsUI.textMain, resize: 'none' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <Button
                                                type="primary"
                                                icon={<RobotOutlined />}
                                                onClick={handleGenerateSuggestion}
                                                loading={isGenerating}
                                                style={{ width: '100%', backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 500 }}
                                            >
                                                {isGenerating ? 'AI đang xử lý...' : 'Tạo gợi ý với AI Gemini'}
                                            </Button>
                                        </div>

                                        {/* KHU VỰC HIỂN THỊ KẾT QUẢ TRẢ VỀ */}
                                        {aiResult && (
                                            <div style={{ background: themeColorsUI.inputBg, padding: '12px', borderRadius: '6px', border: '1px solid #1890ff', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px', borderBottom: `1px dashed ${themeColorsUI.borderColor}`, paddingBottom: '12px' }}>
                                                    <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                                                        <RobotOutlined style={{ marginRight: '6px', fontSize: '16px' }} /> KẾT QUẢ TỪ AI GEMINI
                                                    </span>

                                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            icon={<CheckOutlined />}
                                                            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontSize: '12px', flex: 1 }}
                                                            onClick={handleAutoFill}
                                                        >
                                                            Điền tự động vào CV
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            type="default"
                                                            icon={<CopyOutlined />}
                                                            style={{ backgroundColor: themeColorsUI.inputBg, borderColor: themeColorsUI.borderColor, color: themeColorsUI.textMain, fontSize: '12px' }}
                                                            onClick={() => { navigator.clipboard.writeText(aiResult); message.success('Đã sao chép vào bộ nhớ tạm!'); }}
                                                        >
                                                            Copy
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{ color: themeColorsUI.textMain, fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6, flex: 1 }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: aiResult.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1890ff; font-size: 14px;">$1</strong>')
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* WORKSPACE AREA */}
                <div className="workspace-area" style={{ background: themeColorsUI.bgWorkspace }}>
                    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                        <div
                            className="cv-preview-page"
                            style={{
                                '--theme-color': themeColor,
                                '--font-family': fontFamily || '"Be Vietnam Pro", sans-serif',
                                '--base-font-size': `${fontSize || 13.5}px`,
                                '--line-height': lineHeight || 1.5,
                                background: backgroundStyle && backgroundStyle !== 'none' ? backgroundStyle : '#ffffff'
                            }}
                        >
                            {!hasRemoveWatermark && !isPremium && (
                                <div className="no-print watermark-jobsnow">
                                    Tạo bởi <strong>JobsNow.vn</strong>
                                </div>
                            )}
                            <MasterTemplate />
                        </div>
                    </ConfigProvider>
                </div>
            </div>
        </div>
    );
};

export default CvBuilder;