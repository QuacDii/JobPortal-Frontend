import React, { useState, useEffect, useRef } from 'react';
import useCvStore from '../store/useCvStore';
import './css/CvBuilder.css';
import apiClient from '../api/apiClient';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal, ConfigProvider, theme, Input, Typography, Button, Space, message, Spin, Select, Slider, Tooltip } from 'antd';
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
    LockOutlined,
    RobotOutlined,
    CopyOutlined,
    BookOutlined,
    CheckOutlined,
    ExclamationCircleOutlined
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
    "Mục tiêu nghề nghiệp": { vi: "Mục tiêu nghề nghiệp", en: "Career Objective" },
    "Kinh nghiệm làm việc": { vi: "Kinh nghiệm làm việc", en: "Work Experience" },
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
    "Mô tả quá trình học tập...": { vi: "Mô tả quá trình học tập...", en: "Describe your education process..." },

    "Tên kỹ năng": { vi: "Tên kỹ năng", en: "Skill Name" },
    "Tên sở thích": { vi: "Tên sở thích", en: "Hobby Name" },
    "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn": { vi: "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn", en: "Your career objectives, including short-term and long-term goals" },
    "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn...": { vi: "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn...", en: "Your career objectives, including short-term and long-term goals..." },

    "Vị trí công việc": { vi: "Vị trí công việc", en: "Job Title" },
    "Tên công ty": { vi: "Tên công ty", en: "Company Name" },
    "Mô tả kinh nghiệm làm việc của bạn": { vi: "Mô tả kinh nghiệm làm việc của bạn", en: "Describe your work experience" },
    "Mô tả công việc...": { vi: "Mô tả công việc...", en: "Job description..." },

    "Thời gian": { vi: "Thời gian", en: "Time / Period" },
    "Tên giải thưởng": { vi: "Tên giải thưởng", en: "Award Name" },
    "Tên chứng chỉ": { vi: "Tên chứng chỉ", en: "Certificate Name" },

    "Vị trí của bạn": { vi: "Vị trí của bạn", en: "Your Role" },
    "Tên tổ chức": { vi: "Tên tổ chức", en: "Organization Name" },
    "Mô tả hoạt động": { vi: "Mô tả hoạt động", en: "Describe your activities" },
    "Mô tả hoạt động...": { vi: "Mô tả hoạt động...", en: "Describe your activities..." },

    "Vị trí của bạn trong dự án": { vi: "Vị trí của bạn trong dự án", en: "Your role in the project" },
    "Tên dự án": { vi: "Tên dự án", en: "Project Name" },
    "Mô tả ngắn gọn về dự án, mục tiêu, vai trò của bạn, các công nghệ sử dung và những thành tựu bạn đã đạt được trong dự án": { vi: "Mô tả ngắn gọn về dự án, mục tiêu, vai trò của bạn, các công nghệ sử dung và những thành tựu bạn đã đạt được trong dự án", en: "Briefly describe the project, goals, your role, technologies used and achievements" },
    "Mô tả ngắn gọn về dự án...": { vi: "Mô tả ngắn gọn về dự án...", en: "Brief description of the project..." },
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
    if (text === text.toUpperCase()) {
        return translated.toUpperCase();
    }
    return translated;
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
    const colorParam = searchParams.get('color');

    const [lang, setLang] = useState(searchParams.get('lang') || 'vi');

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId || null;
    const isVipUser = userInfo?.isVip || false;
    const [isPremium, setIsPremium] = useState(isVipUser);
    const [cvTitle, setCvTitle] = useState('CV chưa đặt tên');
    const [pageLoading, setPageLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState('design');
    const [isResizingCols, setIsResizingCols] = useState(false);
    const [tempColWidth, setTempColWidth] = useState(36);
    const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
    const [templateList, setTemplateList] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const sidebarLayoutRef = useRef(null);

    // STATE CHO TÍNH NĂNG AI GEMINI
    const [aiIndustry, setAiIndustry] = useState('');
    const [aiDescription, setAiDescription] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // STATE QUẢN LÝ LỊCH SỬ HOÀN TÁC (UNDO/REDO)
    const [pastHistory, setPastHistory] = useState([]);
    const [futureHistory, setFutureHistory] = useState([]);
    const [isTimeTraveling, setIsTimeTraveling] = useState(false);

    const cvData = useCvStore(state => state.cvData);
    const currentData = useCvStore(state => state.cvData);
    const layoutSchema = useCvStore(state => state.layoutSchema || state.schema);
    const currentSchema = useCvStore(state => state.layoutSchema || state.schema);

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const res = await apiClient.get('/MauCv');
                setTemplateList(res.data || res || []);
            } catch (error) {
                console.error("Lỗi khi tải danh sách mẫu CV:", error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

    // 🚀 HÀM XỬ LÝ ĐỔI MẪU CV (ĐÃ BỎ CẢNH BÁO POPUP)
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

                // ÁP DỤNG ĐỔI MẪU TRỰC TIẾP NGAY LẬP TỨC
                const translatedLayout = translateLayoutTree(parsedData, lang);
                setInitialData(translatedLayout, cvData);
                const defaultColor = actualTemplate?.colors?.[0] || '#00b14f';
                updateLayoutSetting('themeColor', defaultColor);
                setSearchParams(prev => { prev.set('templateId', newTemplateId); return prev; }, { replace: true });

                hideLoading();
                message.success('Đã đổi mẫu CV thành công!');
            }
        } catch (error) {
            hideLoading();
            message.error('Lỗi khi áp dụng cấu trúc mẫu mới!');
            console.error(error);
        }
    };

    // Camera tự động chụp lại dữ liệu sau mỗi 600ms
    useEffect(() => {
        if (isTimeTraveling) {
            setIsTimeTraveling(false);
            return;
        }
        if (!currentData || !currentSchema) return;

        const timer = setTimeout(() => {
            setPastHistory(prev => {
                const newRecord = {
                    cvData: JSON.parse(JSON.stringify(currentData)),
                    layoutSchema: JSON.parse(JSON.stringify(currentSchema))
                };

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

    // 🚀 HÀM CẬP NHẬT REAL-TIME CHIỀU RỘNG CỘT KHI ĐANG KÉO RÊ
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
                    if (typeof store.setLayoutSchema === 'function') {
                        store.setLayoutSchema(newSchema);
                    } else {
                        useCvStore.setState({ layoutSchema: newSchema, schema: newSchema });
                    }
                }
            }
        };

        const handleMouseUp = () => {
            if (isResizingCols) {
                setIsResizingCols(false);
            }
        };

        if (isResizingCols) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingCols]);

    // HÀM NẶN KHỐI MỚI THÔNG MINH
    const getNewSectionJson = (id) => {
        const store = useCvStore.getState();
        const schema = store.layoutSchema || store.schema;
        let headingTemplate = null;

        const findHeading = (node) => {
            if (node && (node.id === 'section-education' || node.id === 'section-experience') && node.children && node.children.length > 0) {
                headingTemplate = JSON.parse(JSON.stringify(node.children[0]));
            }
            if (!headingTemplate && node && node.children) {
                node.children.forEach(findHeading);
            }
        };
        findHeading(schema);

        if (!headingTemplate) {
            headingTemplate = { "type": "Container", "styles": { "display": "flex", "alignItems": "center", "marginBottom": "24px" }, "children": [{ "type": "Text", "content": "TIÊU ĐỀ", "styles": { "backgroundColor": "var(--heading-bg)", "color": "#ffffff", "padding": "8px 24px", "borderRadius": "20px", "fontWeight": "bold", "fontSize": "15px", "whiteSpace": "nowrap" } }, { "type": "Container", "styles": { "flexGrow": "1", "height": "1px", "backgroundColor": "var(--heading-line)", "marginLeft": "15px", "opacity": "0.3" } }] };
        }

        const applyHeadingTitle = (root, title) => {
            if (root.type === 'Text' && root.content !== undefined) root.content = title;
            if (root.children) root.children.forEach(c => applyHeadingTitle(c, title));
        };

        const b = { marginBottom: "25px" };
        let contentChildren = [];
        let title = "";

        if (id === 'section-summary') {
            title = "Mục tiêu nghề nghiệp";
            contentChildren = [{
                "type": "RichText",
                "dataPath": "summary",
                "placeholder": "Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn",
                "styles": { "textAlign": "justify", "fontSize": "13.5px", "border": "none", "outline": "none", "width": "100%" }
            }];
        } else if (id === 'section-education') {
            title = "Học vấn";
            contentChildren = [{
                "type": "LoopContainer", "dataPath": "education", "styles": { "display": "flex", "flexDirection": "column", "gap": "16px" },
                "itemTemplate": {
                    "type": "Container", "styles": { "display": "flex", "flexDirection": "row", "gap": "20px" }, "children": [
                        { "type": "Container", "styles": { "width": "20%", "flexShrink": "0" }, "children": [{ "type": "Container", "styles": { "display": "flex", "gap": "4px", "fontSize": "14px", "whiteSpace": "nowrap" }, "children": [{ "type": "Text", "dataPath": "startDate", "placeholder": "Bắt đầu" }, { "type": "Text", "content": "-" }, { "type": "Text", "dataPath": "endDate", "placeholder": "Kết thúc" }] }] },
                        { "type": "Container", "styles": { "flex": "1", "display": "flex", "flexDirection": "column" }, "children": [{ "type": "Text", "dataPath": "school", "placeholder": "Tên trường học", "styles": { "fontWeight": "bold", "fontSize": "14px", "marginBottom": "6px" } }, { "type": "Container", "styles": { "display": "flex", "gap": "6px", "marginBottom": "6px", "alignItems": "baseline" }, "children": [{ "type": "Text", "content": "Chuyên ngành:", "styles": { "fontWeight": "bold", "whiteSpace": "nowrap", "flexShrink": "0" } }, { "type": "Text", "dataPath": "major", "placeholder": "Ngành học / Môn học", "styles": { "fontWeight": "bold" } }] }, { "type": "RichText", "dataPath": "description", "placeholder": "Mô tả quá trình học tập hoặc thành tích của bạn", "styles": { "fontSize": "13.5px", "border": "none", "outline": "none" } }] }
                    ]
                }
            }];
        } else if (id === 'section-experience') {
            title = "Kinh nghiệm làm việc";
            contentChildren = [{
                "type": "LoopContainer", "dataPath": "experience", "styles": { "display": "flex", "flexDirection": "column", "gap": "20px" },
                "itemTemplate": {
                    "type": "Container", "styles": { "display": "flex", "flexDirection": "row", "gap": "20px" }, "children": [
                        { "type": "Container", "styles": { "width": "20%", "flexShrink": "0" }, "children": [{ "type": "Container", "styles": { "display": "flex", "gap": "4px", "fontSize": "14px", "whiteSpace": "nowrap" }, "children": [{ "type": "Text", "dataPath": "startDate", "placeholder": "Bắt đầu" }, { "type": "Text", "content": "-" }, { "type": "Text", "dataPath": "endDate", "placeholder": "Kết thúc" }] }] },
                        { "type": "Container", "styles": { "flex": "1", "display": "flex", "flexDirection": "column" }, "children": [{ "type": "Text", "dataPath": "companyName", "placeholder": "Tên công ty", "styles": { "fontWeight": "bold", "fontSize": "14px", "marginBottom": "6px" } }, { "type": "Text", "dataPath": "title", "placeholder": "Vị trí công việc", "styles": { "fontWeight": "bold", "marginBottom": "8px" } }, { "type": "RichText", "dataPath": "description", "placeholder": "Mô tả kinh nghiệm làm việc của bạn", "styles": { "fontSize": "13.5px", "border": "none", "outline": "none" } }] }
                    ]
                }
            }];
        } else if (id === 'section-projects') {
            title = "Dự án";
            contentChildren = [{ "type": "LoopContainer", "dataPath": "projects", "styles": { "display": "flex", "flexDirection": "column", "gap": "20px" }, "itemTemplate": { "type": "Container", "styles": { "display": "flex", "flexDirection": "column" }, "children": [{ "type": "Container", "styles": { "display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "marginBottom": "4px" }, "children": [{ "type": "Text", "dataPath": "role", "placeholder": "Vai trò trong dự án", "styles": { "fontWeight": "bold", "fontSize": "15px" } }, { "type": "Container", "styles": { "display": "flex", "gap": "4px", "fontWeight": "bold", "fontSize": "14px", "opacity": "0.8", "whiteSpace": "nowrap" }, "children": [{ "type": "Text", "dataPath": "startDate", "placeholder": "Bắt đầu" }, { "type": "Text", "content": "-" }, { "type": "Text", "dataPath": "endDate", "placeholder": "Kết thúc" }] }] }, { "type": "Text", "dataPath": "projectName", "placeholder": "Tên dự án", "styles": { "fontSize": "14.5px", "marginBottom": "8px", "opacity": "0.9", "fontWeight": "bold" } }, { "type": "RichText", "dataPath": "description", "placeholder": "Mô tả dự án...", "styles": { "fontSize": "13.5px", "border": "none", "outline": "none" } }] } }];
        } else if (id === 'section-awards') {
            title = "Danh hiệu và giải thưởng";
            contentChildren = [{ "type": "LoopContainer", "dataPath": "awards", "styles": { "display": "flex", "flexDirection": "column", "gap": "16px" }, "itemTemplate": { "type": "Container", "styles": { "display": "flex", "flexDirection": "row", "gap": "20px" }, "children": [{ "type": "Container", "styles": { "width": "20%", "flexShrink": "0" }, "children": [{ "type": "Text", "dataPath": "time", "placeholder": "Năm", "styles": { "fontSize": "14px", "fontWeight": "bold" } }] }, { "type": "Container", "styles": { "flex": "1" }, "children": [{ "type": "Text", "dataPath": "name", "placeholder": "Tên giải thưởng", "styles": { "fontSize": "14px" } }] }] } }];
        } else if (id === 'section-certificates') {
            title = "Chứng chỉ";
            contentChildren = [{ "type": "LoopContainer", "dataPath": "certificates", "styles": { "display": "flex", "flexDirection": "column", "gap": "16px" }, "itemTemplate": { "type": "Container", "styles": { "display": "flex", "flexDirection": "row", "gap": "20px" }, "children": [{ "type": "Container", "styles": { "width": "20%", "flexShrink": "0" }, "children": [{ "type": "Text", "dataPath": "time", "placeholder": "Năm", "styles": { "fontSize": "14px", "fontWeight": "bold" } }] }, { "type": "Container", "styles": { "flex": "1" }, "children": [{ "type": "Text", "dataPath": "name", "placeholder": "Tên chứng chỉ", "styles": { "fontSize": "14px" } }] }] } }];
        } else if (id === 'section-activities') {
            title = "Hoạt động";
            contentChildren = [{ "type": "LoopContainer", "dataPath": "activities", "styles": { "display": "flex", "flexDirection": "column", "gap": "20px" }, "itemTemplate": { "type": "Container", "styles": { "display": "flex", "flexDirection": "column" }, "children": [{ "type": "Container", "styles": { "display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "marginBottom": "4px" }, "children": [{ "type": "Text", "dataPath": "role", "placeholder": "Vị trí của bạn", "styles": { "fontWeight": "bold", "fontSize": "15px" } }, { "type": "Container", "styles": { "display": "flex", "gap": "4px", "fontWeight": "bold", "fontSize": "14px", "opacity": "0.8", "whiteSpace": "nowrap" }, "children": [{ "type": "Text", "dataPath": "startDate", "placeholder": "Bắt đầu" }, { "type": "Text", "content": " - " }, { "type": "Text", "dataPath": "endDate", "placeholder": "Kết thúc" }] }] }, { "type": "Text", "dataPath": "organization", "placeholder": "Tên tổ chức", "styles": { "fontSize": "14.5px", "marginBottom": "8px", "opacity": "0.9", "fontWeight": "bold" } }, { "type": "RichText", "dataPath": "description", "placeholder": "Mô tả hoạt động...", "styles": { "fontSize": "13.5px", "border": "none", "outline": "none" } }] } }];
        } else if (id === 'section-hobbies') {
            title = "Sở thích";
            contentChildren = [{ "type": "LoopContainer", "dataPath": "hobbies", "styles": { "display": "flex", "flexDirection": "column", "gap": "8px" }, "itemTemplate": { "type": "Container", "styles": { "display": "flex", "alignItems": "center", "gap": "8px" }, "children": [{ "type": "Text", "content": "•", "styles": { "fontWeight": "bold", "fontSize": "14px" } }, { "type": "Text", "dataPath": "name", "placeholder": "Tên sở thích", "styles": { "fontSize": "13.5px" } }] } }];
        } else if (id === 'section-skills') {
            title = "Kỹ năng";
            contentChildren = [{ "type": "LoopContainer", "dataPath": "skills", "styles": { "display": "flex", "flexDirection": "column", "gap": "8px" }, "itemTemplate": { "type": "Container", "styles": { "display": "flex", "alignItems": "center", "gap": "8px" }, "children": [{ "type": "Text", "content": "•", "styles": { "fontWeight": "bold", "fontSize": "14px" } }, { "type": "Text", "dataPath": "name", "placeholder": "Tên kỹ năng", "styles": { "fontSize": "13.5px" } }] } }];
        } else if (id === 'section-references') {
            title = "Người tham chiếu";
            contentChildren = [{ "type": "LoopContainer", "dataPath": "references", "styles": { "display": "flex", "flexDirection": "column", "gap": "16px", "width": "100%" }, "itemTemplate": { "type": "Container", "styles": { "display": "flex", "flexDirection": "column", "gap": "4px" }, "children": [{ "type": "Text", "dataPath": "name", "placeholder": "Tên người tham chiếu", "styles": { "fontWeight": "bold", "fontSize": "14px" } }, { "type": "Text", "dataPath": "position", "placeholder": "Vị trí / Tên công ty", "styles": { "fontSize": "13.5px", "opacity": "0.9" } }, { "type": "Text", "dataPath": "contact", "placeholder": "Số điện thoại / Email", "styles": { "fontSize": "13.5px", "opacity": "0.9" } }] } }];
        } else if (id === 'section-additional') {
            title = "Thông tin thêm";
            contentChildren = [{ "type": "RichText", "dataPath": "additionalInfo", "placeholder": "Điền các thông tin thêm của bạn (nếu có)...", "styles": { "fontSize": "13.5px", "border": "none", "outline": "none", "width": "100%" } }];
        } else {
            return null;
        }

        applyHeadingTitle(headingTemplate, title);

        return {
            "type": "Container",
            "id": id,
            "styles": b,
            "children": [headingTemplate, ...contentChildren]
        };
    };

    // HÀM GỌI API AI GEMINI
    const handleGenerateSuggestion = async () => {
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

            // Hứng data an toàn
            const responseData = response.data || response;

            if (responseData && responseData.data) {
                setAiResult(responseData.data);
            } else if (typeof responseData === 'string' && responseData.trim() !== '') {
                setAiResult(responseData);
            } else {
                message.error("Không nhận được phản hồi hợp lệ từ AI.");
            }
        } catch (error) {
            console.error("Lỗi AI Backend:", error);
            message.error("Lỗi khi tạo gợi ý. Vui lòng thử lại!");
        } finally {
            setIsGenerating(false);
        }
    };
    const handleAutoFill = () => {
        if (!aiResult) return;

        let parsedSummary = '';
        let parsedExperience = '';

        // 1. Tách chuỗi dựa trên tiêu đề "2. Kinh nghiệm..." mà ta đã prompt cho AI
        const expRegex = /2\.?\s*\*?\*?Kinh nghiệm/i;
        const parts = aiResult.split(expRegex);

        if (parts.length > 1) {
            // Xóa tiêu đề "1. Mục tiêu..." ở phần đầu
            parsedSummary = parts[0].replace(/1\.?\s*\*?\*?Mục tiêu.*?(\n|$)/i, '').trim();
            parsedExperience = parts[1].trim();
        } else {
            // Dự phòng nếu AI không trả đúng format số 1, 2
            parsedSummary = aiResult.trim();
        }

        // 2. Chuyển đổi đoạn text Kinh nghiệm thành mã HTML dạng danh sách (Bullet points)
        let expHtml = '';
        if (parsedExperience) {
            const lines = parsedExperience.split('\n').filter(l => l.trim() !== '');
            // Lọc bỏ các dấu gạch ngang, dấu sao ở đầu dòng và bọc thẻ <li>
            const bullets = lines.map(l => `<li>${l.replace(/^[\*\-\•]\s*/, '').trim()}</li>`).join('');
            expHtml = `<ul>${bullets}</ul>`;
        }

        // 3. Lấy dữ liệu CV hiện tại từ Store (Zustand)
        const store = useCvStore.getState();
        const newCvData = JSON.parse(JSON.stringify(store.cvData)); // Copy sâu để không lỗi tham chiếu

        // Ghi đè Mục tiêu nghề nghiệp
        if (parsedSummary) {
            newCvData.summary = parsedSummary;
        }

        // Điền Kinh nghiệm làm việc (Ghi đè vào kinh nghiệm đầu tiên hoặc tạo mới nếu chưa có)
        if (expHtml) {
            if (!newCvData.experience || newCvData.experience.length === 0) {
                newCvData.experience = [{
                    id: Date.now(),
                    startDate: '',
                    endDate: 'Nay',
                    companyName: 'Tên Công Ty',
                    title: aiIndustry, // Lấy ngành nghề làm Title luôn
                    description: expHtml
                }];
            } else {
                // Nếu đã có block kinh nghiệm, ta nối thêm hoặc ghi đè phần mô tả
                newCvData.experience[0].description = expHtml;
            }
        }

        // 4. Lưu lại dữ liệu mới để UI tự động cập nhật
        store.setInitialData(store.layoutSchema, newCvData);
        message.success('Đã điền tự động nội dung AI vào bản CV!');
    };

    const { fontFamily, fontSize, lineHeight, themeColor, backgroundStyle } = useCvStore(state => state.layoutSettings || {});

    const setInitialData = useCvStore(state => state.setInitialData);
    const updateLayoutSetting = useCvStore(state => state.updateLayoutSetting);

    const themeColors = ['#574040', '#4e7b8b', '#4e8b7d', '#518b4e', '#6f4e8b', '#8b4e4e'];

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
        14: { style: { color: '#00b14f' }, label: 'Trung bình' },
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

    useEffect(() => {
        const initializeCvData = async () => {
            setPageLoading(true);
            try {
                if (cvId && token) {
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

                        const jsonString = JSON.stringify(layoutJson || {});
                        const isEn = jsonString.includes('Work Experience') || jsonString.includes('Target Position') || jsonString.includes('Education');

                        const dbLang = actualCv.ngonNgu || actualCv.NgonNgu;
                        const finalLang = (dbLang || (isEn ? 'en' : 'vi')).toLowerCase();

                        setLang(finalLang);
                        setSearchParams(prev => { prev.set('lang', finalLang); return prev; }, { replace: true });

                        const contentData = actualCv.duLieuCv
                            ? (typeof actualCv.duLieuCv === 'string' ? JSON.parse(actualCv.duLieuCv) : actualCv.duLieuCv)
                            : null;

                        setInitialData(layoutJson, contentData);
                    }
                } else {
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

                            const defaultColor = colorParam || actualTemplate?.colors?.[0] || (templateId === '3' ? '#574040' : '#00b14f');
                            updateLayoutSetting('themeColor', defaultColor);

                            // Lấy cấu trúc khung (Layout)
                            let rawData = actualTemplate?.layoutJson || actualTemplate?.LayoutJson;
                            if (rawData) {
                                if (typeof rawData === 'string') rawData = rawData.replace(/^\uFEFF/, '').trim();
                                templateLayout = typeof rawData === 'object' ? rawData : JSON.parse(rawData);
                                if (typeof templateLayout === 'string') templateLayout = JSON.parse(templateLayout);

                                const jsonString = JSON.stringify(templateLayout);
                                const isEn = jsonString.includes('Work Experience') || jsonString.includes('Target Position') || jsonString.includes('Education');

                                const dbLangTemplate = actualTemplate?.ngonNgu || actualTemplate?.NgonNgu;
                                const targetLang = (searchParams.get('lang') || dbLangTemplate || (isEn ? 'en' : 'vi')).toLowerCase();

                                setLang(targetLang);
                                setSearchParams(prev => { prev.set('lang', targetLang); return prev; }, { replace: true });

                                // Dịch ngôn ngữ các tiêu đề của Layout
                                templateLayout = translateLayoutTree(templateLayout, targetLang);
                            }

                            // 2. NẾU NGƯỜI DÙNG CHỌN "NỘI DUNG GỢI Ý" -> LẤY DỮ LIỆU MẪU TỪ DATABASE ĐẮP VÀO
                            if (source === 'suggested') {
                                let dummyDataStr = actualTemplate?.duLieuMau || actualTemplate?.DuLieuMau;
                                if (dummyDataStr) {
                                    try {
                                        let parsedDummy = null;
                                        if (typeof dummyDataStr === 'string') {
                                            dummyDataStr = dummyDataStr.replace(/^\uFEFF/, '').trim();
                                            parsedDummy = JSON.parse(dummyDataStr);
                                        } else {
                                            parsedDummy = dummyDataStr;
                                        }

                                        // LÔ-GÍC ĐA NGÔN NGỮ: Kiểm tra JSON có cấu trúc "vi" và "en" không
                                        if (parsedDummy.vi && parsedDummy.en) {
                                            // targetLang đã được khai báo ở trên (chứa giá trị 'vi' hoặc 'en' từ URL)
                                            initialContent = parsedDummy[targetLang] || parsedDummy.vi;
                                        } else {
                                            initialContent = parsedDummy;
                                        }

                                        // Ghi đè Tên và Email thật của người dùng
                                        initialContent.personalInfo = {
                                            ...initialContent.personalInfo,
                                            fullName: userInfo?.fullName || initialContent.personalInfo?.fullName || '',
                                            email: userInfo?.email || initialContent.personalInfo?.email || ''
                                        };
                                        const emptyKeys = ['projects', 'activities', 'awards', 'certificates', 'hobbies'].filter(
                                            key => !initialContent[key] || (Array.isArray(initialContent[key]) && initialContent[key].length === 0)
                                        ).map(key => `section-${key}`);

                                        // 2. Hàm đệ quy thông minh: Xóa các block có ID nằm trong danh sách rỗng khỏi Cấu trúc Layout
                                        const cleanLayout = (node) => {
                                            if (Array.isArray(node)) {
                                                return node.map(cleanLayout).filter(item => item !== null);
                                            } else if (typeof node === 'object' && node !== null) {

                                                // Tìm định danh của Block 
                                                const blockId = node.id || node.type || node.blockId || node.key;

                                                // Nếu block này thuộc nhóm dữ liệu rỗng -> Hủy (return null)
                                                if (emptyKeys.includes(blockId)) return null;

                                                const newNode = {};
                                                for (let k in node) {
                                                    newNode[k] = cleanLayout(node[k]);
                                                }

                                                // Dọn dẹp các khe trống (null) dính lại trong mảng sau khi xóa block
                                                for (let k in newNode) {
                                                    if (Array.isArray(newNode[k])) {
                                                        newNode[k] = newNode[k].filter(item => item !== null);
                                                    }
                                                }
                                                return newNode;
                                            }
                                            return node;
                                        };

                                        // 3. Áp dụng bộ lọc dọn dẹp vào templateLayout trước khi vẽ ra màn hình
                                        if (templateLayout) {
                                            templateLayout = cleanLayout(templateLayout);
                                        }
                                    } catch (e) {
                                        console.error("Lỗi parse DuLieuMau từ Database:", e);
                                    }
                                }
                            }

                        } catch (err) {
                            console.error("Lỗi gọi API hoặc định dạng JSON:", err);
                        }
                    }

                    // Nạp dữ liệu vào Zustand Store để vẽ ra giao diện
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
        if (element) element.classList.add('is-exporting');

        const opt = {
            margin: 0, filename: `${cvTitle || 'CV_Cua_Toi'}.pdf`, image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        message.loading({ content: 'Đang tạo PDF...', key: 'pdf_loading' });

        html2pdf().set(opt).from(element).save().then(() => {
            if (element) element.classList.remove('is-exporting');
            message.success({ content: 'Tải PDF thành công!', key: 'pdf_loading', duration: 2 });
        }).catch(err => {
            if (element) element.classList.remove('is-exporting');
            message.error({ content: 'Có lỗi xảy ra khi tải PDF!', key: 'pdf_loading', duration: 2 });
        });
    };

    const handleSaveCV = () => {
        if (!token || !userId) { message.warning('Vui lòng đăng nhập tài khoản!'); navigate('/login'); return; }

        const executeSave = async () => {
            const hideLoading = message.loading('Đang xử lý lưu hồ sơ...', 0);
            try {
                const cvPageElement = document.querySelector('.cv-preview-page');
                let uploadedImageUrl = cvData.personalInfo.avatar || "";

                if (cvPageElement) {
                    cvPageElement.classList.add('is-exporting');
                    const canvas = await html2canvas(cvPageElement, { useCORS: true, scale: 2, logging: false });
                    cvPageElement.classList.remove('is-exporting');

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
                const cvPageElement = document.querySelector('.cv-preview-page');
                if (cvPageElement) cvPageElement.classList.remove('is-exporting');

                const errorMessage = err.response?.data?.message || err.data?.message || 'Lỗi hệ thống khi lưu dữ liệu CV!';
                message.error(errorMessage);
            }
        };

        const emptyRequiredFields = document.querySelectorAll('.has-empty-required');

        if (emptyRequiredFields.length > 0) {
            Modal.confirm({
                title: 'Cảnh báo: Thiếu thông tin bắt buộc',
                icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                content: 'Bạn đang để trống một số thông tin liên hệ bắt buộc (các ô bị viền đỏ nét đứt). Bạn có chắc chắn muốn tiếp tục lưu CV không?',
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
    }

    if (pageLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}><Spin size="large" /></div>;

    return (
        <div className="cv-builder-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#141414', overflow: 'hidden' }}>

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
                    <Tooltip title="Hoàn tác">
                        <Button type="text" icon={<UndoOutlined />} onClick={handleUndo} disabled={pastHistory.length <= 1} style={{ color: pastHistory.length <= 1 ? '#444' : '#8c8c8c' }} />
                    </Tooltip>
                    <Tooltip title="Làm lại">
                        <Button type="text" icon={<RedoOutlined />} onClick={handleRedo} disabled={futureHistory.length === 0} style={{ color: futureHistory.length === 0 ? '#444' : '#8c8c8c' }} />
                    </Tooltip>

                    <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => setIsPreviewModalVisible(true)}
                        style={{ backgroundColor: '#242424', borderColor: '#333', color: '#fff' }}
                    >
                        Xem trước
                    </Button>
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
                    <div className={`menu-btn ${activeMenu === 'layout' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'layout' ? null : 'layout')}>
                        <LayoutOutlined /><span>Bố cục</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'change-template' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'change-template' ? null : 'change-template')}>
                        <SwapOutlined /><span>Đổi mẫu CV</span>
                    </div>
                    <div className={`menu-btn ${activeMenu === 'tips' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'tips' ? null : 'tips')}>
                        <BulbOutlined /><span>Gợi ý viết CV</span>
                    </div>
                </div>

                {/* SETTINGS PANEL */}
                <div className={`settings-panel no-print ${!activeMenu ? 'hidden' : ''}`}>
                    {activeMenu && (
                        <div className="panel-header">
                            <Title level={5} style={{ color: '#fff', margin: 0 }}>
                                {activeMenu === 'design' && 'Thiết kế & Font'}
                                {activeMenu === 'change-template' && 'Mẫu CV'}
                                {activeMenu === 'layout' && 'Bố cục CV'}
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
                                                        background: '#242424',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        border: `2px solid ${isActive ? '#00b14f' : 'transparent'}`,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        transition: 'all 0.2s',
                                                        boxShadow: isActive ? '0 4px 12px rgba(0, 177, 79, 0.2)' : 'none'
                                                    }}
                                                >
                                                    <div style={{ width: '100%', aspectRatio: '1 / 1.414', background: '#fff', overflow: 'hidden', borderBottom: '1px solid #333' }}>
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
                                                    <div style={{ padding: '12px 8px', color: '#fff', fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>
                                                        {name}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ gridColumn: 'span 2', textAlign: 'center', color: '#8c8c8c', fontStyle: 'italic' }}>
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
                                { id: 'section-references', label: 'Người tham chiếu' },
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
                                    placeholder.style.backgroundColor = 'rgba(0, 177, 79, 0.15)';
                                    placeholder.style.border = '1px dashed #00b14f';
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
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
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
                                backgroundColor: '#242424', padding: '10px', borderRadius: '6px', textAlign: 'center', cursor: 'grab',
                                fontSize: '12px', fontWeight: '500', transition: '0.2s', border: '1px solid #333', marginBottom: '8px', color: '#a6a6a6'
                            };

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <style>{`
                                        .cv-layout-scroll-area::-webkit-scrollbar { width: 6px; }
                                        .cv-layout-scroll-area::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
                                        .cv-layout-scroll-area::-webkit-scrollbar-thumb:hover { background: #00b14f; }
                                    `}</style>

                                    {/* KHU VỰC CUỘN CHO BỐ CỤC CHÍNH */}
                                    <div className="cv-layout-scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '420px', overflowY: 'auto', paddingRight: '4px' }}>

                                        {/* 1. KHU VỰC CHIA 2 CỘT Ở TRÊN */}
                                        {(leftCol || rightCol) && (
                                            <div ref={sidebarLayoutRef} style={{ display: 'flex', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden', minHeight: '140px', position: 'relative', flexShrink: 0 }}>
                                                {/* CỘT TRÁI */}
                                                {leftCol && (
                                                    <div className="cv-mini-col" data-col-id="left-col" onDragOver={onDragOver} onDrop={onDrop} style={{ width: `${tempColWidth}%`, padding: '10px', backgroundColor: '#1f1f1f', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ textAlign: 'center', color: '#00b14f', fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px dashed #333', paddingBottom: '6px' }}>{Math.round(tempColWidth)}%</div>
                                                        {leftSections.map(s => (
                                                            <div key={s.id} data-sidebar-id={s.id} draggable onDragStart={(e) => onDragStart(e, s.id, false)} onDragEnd={onDragEnd} style={itemStyle}>{s.label}</div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* THANH KÉO VÀ TOOLTIP ĐỔI CHIỀU RỘNG CỘT */}
                                                {(leftCol && rightCol) && (
                                                    <Tooltip title="Thay đổi chiều rộng cột" placement="top">
                                                        <div
                                                            onMouseDown={() => setIsResizingCols(true)}
                                                            style={{
                                                                width: '8px',
                                                                marginLeft: '-4px',
                                                                marginRight: '-4px',
                                                                backgroundColor: isResizingCols ? '#00b14f' : 'transparent',
                                                                cursor: 'col-resize',
                                                                position: 'relative',
                                                                zIndex: 10,
                                                                transition: 'background 0.2s',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '24px', backgroundColor: isResizingCols ? '#fff' : '#666', borderRadius: '2px' }} />
                                                        </div>
                                                    </Tooltip>
                                                )}

                                                {/* CỘT PHẢI */}
                                                {rightCol && (
                                                    <div className="cv-mini-col" data-col-id="right-col" onDragOver={onDragOver} onDrop={onDrop} style={{ width: leftCol ? `${100 - tempColWidth}%` : '100%', padding: '10px', backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
                                                        {leftCol && <div style={{ textAlign: 'center', color: '#00b14f', fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px dashed #333', paddingBottom: '6px' }}>{Math.round(100 - tempColWidth)}%</div>}
                                                        {rightSections.map(s => (
                                                            <div key={s.id} data-sidebar-id={s.id} draggable onDragStart={(e) => onDragStart(e, s.id, false)} onDragEnd={onDragEnd} style={itemStyle}>{s.label}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 2. KHU VỰC 1 CỘT (FULL WIDTH) Ở DƯỚI */}
                                        {mainCol && (
                                            <div className="cv-mini-col" data-col-id="main-col" onDragOver={onDragOver} onDrop={onDrop} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', padding: '10px', display: 'flex', flexDirection: 'column', minHeight: '120px', flexShrink: 0 }}>
                                                {mainSections.map(s => (
                                                    <div key={s.id} data-sidebar-id={s.id} draggable onDragStart={(e) => onDragStart(e, s.id, false)} onDragEnd={onDragEnd} style={itemStyle}>
                                                        {s.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. MỤC CHƯA SỬ DỤNG */}
                                    <div onDragOver={onTrashDragOver} onDragLeave={onTrashDragLeave} onDrop={onTrashDrop} style={{ marginTop: '20px', borderTop: '1px dashed #333', paddingTop: '15px', minHeight: '130px', borderRadius: '8px', transition: 'background 0.2s', flexShrink: 0 }}>
                                        <span className="custom-form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '15px', pointerEvents: 'none' }}>MỤC CHƯA SỬ DỤNG</span>
                                        {unusedSections.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', pointerEvents: 'none' }}>
                                                {unusedSections.map(s => (
                                                    <div key={s.id} draggable onDragStart={(e) => { e.currentTarget.style.pointerEvents = 'auto'; onDragStart(e, s.id, true); }} onDragEnd={(e) => { e.currentTarget.style.pointerEvents = 'none'; onDragEnd(e); }} style={{ ...itemStyle, marginBottom: 0, backgroundColor: '#1f1f1f', color: '#fff', borderColor: '#444', pointerEvents: 'auto' }}>{s.label}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px', fontStyle: 'italic', pointerEvents: 'none' }}>Kéo các mục xuống đây để ẩn khỏi CV</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {activeMenu === 'tips' && (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', boxSizing: 'border-box' }}>

                                {/* TRẠNG THÁI 1: TÀI KHOẢN CHƯA NÂNG CẤP */}
                                {!isPremium ? (
                                    <div style={{ textAlign: 'center', padding: '30px 16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', width: '100%', boxSizing: 'border-box' }}>
                                        <LockOutlined style={{ fontSize: '36px', color: '#faad14', marginBottom: '16px' }} />
                                        <Title level={5} style={{ color: '#fff', marginBottom: '8px', fontSize: '15px', whiteSpace: 'normal' }}>Tính năng tài khoản VIP</Title>
                                        <p style={{ color: '#8c8c8c', marginBottom: '20px', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'normal' }}>
                                            Nâng cấp tài khoản để mở khóa trợ lý <strong>AI Gemini</strong>. Hệ thống sẽ tự động viết Mục tiêu nghề nghiệp và Kinh nghiệm làm việc chuyên nghiệp chỉ trong 3 giây.
                                        </p>
                                        <Button
                                            type="primary"
                                            onClick={() => navigate('/upgrade-vip')}
                                            style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#000', fontWeight: 'bold', width: '100%', borderRadius: '6px' }}
                                        >
                                            Nâng cấp ngay
                                        </Button>
                                    </div>
                                ) : (

                                    /* TRẠNG THÁI 2: ĐÃ NÂNG CẤP - HIỂN THỊ CÔNG CỤ AI */
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', boxSizing: 'border-box' }}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <span className="custom-form-label" style={{ display: 'block', marginBottom: '8px' }}>NGÀNH NGHỀ / VỊ TRÍ</span>
                                            <Input
                                                placeholder="VD: Marketing, IT, Kế toán..."
                                                value={aiIndustry}
                                                onChange={e => setAiIndustry(e.target.value)}
                                                className="custom-input"
                                                style={{ background: '#242424', borderColor: '#434343', color: '#fff' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <span className="custom-form-label" style={{ display: 'block', marginBottom: '8px' }}>MÔ TẢ NGẮN GỌN VỀ BẠN</span>
                                            <Input.TextArea
                                                placeholder="VD: Có 2 năm làm content, từng chạy ads facebook, quản lý page 10k follow..."
                                                value={aiDescription}
                                                onChange={e => setAiDescription(e.target.value)}
                                                rows={4}
                                                className="custom-input"
                                                style={{ background: '#242424', borderColor: '#434343', color: '#fff', resize: 'none' }}
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
                                            <div style={{ background: '#1f1f1f', padding: '12px', borderRadius: '6px', border: '1px solid #00b14f', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px', borderBottom: '1px dashed #333', paddingBottom: '12px' }}>

                                                    {/* Dòng 1: Tiêu đề */}
                                                    <span style={{ color: '#00b14f', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                                                        <RobotOutlined style={{ marginRight: '6px', fontSize: '16px' }} /> KẾT QUẢ TỪ AI GEMINI
                                                    </span>

                                                    {/* Dòng 2: Cụm nút bấm trải đều */}
                                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            icon={<CheckOutlined />}
                                                            style={{ backgroundColor: '#00b14f', borderColor: '#00b14f', fontSize: '12px', flex: 1 }}
                                                            onClick={handleAutoFill}
                                                        >
                                                            Điền tự động vào CV
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            type="default"
                                                            icon={<CopyOutlined />}
                                                            style={{ backgroundColor: '#242424', borderColor: '#434343', color: '#fff', fontSize: '12px' }}
                                                            onClick={() => { navigator.clipboard.writeText(aiResult); message.success('Đã sao chép vào bộ nhớ tạm!'); }}
                                                        >
                                                            Copy
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{ color: '#d9d9d9', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6, flex: 1 }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: aiResult.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-size: 14px;">$1</strong>')
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
                <div className="workspace-area" style={{ background: '#0f0f0f' }}>
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
                            {!isVipUser && (
                                <div className="no-print" style={{
                                    position: 'absolute',
                                    bottom: '15px',
                                    right: '25px',
                                    opacity: 0.4,
                                    fontSize: '12px',
                                    fontFamily: 'Arial, sans-serif',
                                    color: '#000',
                                    zIndex: 9999,
                                    pointerEvents: 'none',
                                    userSelect: 'none'
                                }}>
                                    Tạo bởi <strong>JobsNow.vn</strong>
                                </div>
                            )}
                            <MasterTemplate />
                        </div>
                    </ConfigProvider>
                </div>
            </div>

            {/* MODAL XEM TRƯỚC CV */}
            <Modal
                title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Xem trước CV</span>}
                open={isPreviewModalVisible}
                onCancel={() => setIsPreviewModalVisible(false)}
                width={880}
                centered
                footer={[
                    <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
                        Đóng
                    </Button>,
                    <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF} style={{ backgroundColor: '#00b14f', borderColor: '#00b14f' }}>
                        Tải PDF
                    </Button>
                ]}
                styles={{
                    body: {
                        padding: '30px 0',
                        backgroundColor: '#525659',
                        display: 'flex',
                        justifyContent: 'center',
                        maxHeight: '75vh',
                        overflowY: 'auto'
                    }
                }}
            >
                <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                    <div
                        className="cv-preview-page no-print is-exporting"
                        style={{
                            '--theme-color': themeColor,
                            '--font-family': fontFamily || '"Be Vietnam Pro", sans-serif',
                            '--base-font-size': `${fontSize || 13.5}px`,
                            '--line-height': lineHeight || 1.5,
                            background: backgroundStyle && backgroundStyle !== 'none' ? backgroundStyle : '#ffffff',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            transform: 'scale(0.95)',
                            transformOrigin: 'top center',
                            pointerEvents: 'none'
                        }}
                    >
                        <MasterTemplate />
                    </div>
                </ConfigProvider>
            </Modal>
        </div>
    );
};

export default CvBuilder;