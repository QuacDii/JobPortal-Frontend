import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './css/TemplatePreview.css';
import { UploadOutlined, ArrowLeftOutlined, EditOutlined, LoadingOutlined, CheckOutlined } from '@ant-design/icons';
import { Row, Col, Radio, Button, Space, Typography, Breadcrumb, Spin, message, Select, Upload, Modal } from 'antd';

const { Title, Text } = Typography;
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
            isVip: decoded.isVip === 'true' || decoded.isVip === true
        };
    } catch (error) {
        return null;
    }
};

const TemplatePreview = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const isDarkMode = false;

    const themeColors = {
        bgColor: isDarkMode ? '#141414' : '#f4f5f5',
        cardBg: isDarkMode ? '#1f1f1f' : '#ffffff',
        textColor: isDarkMode ? '#ffffff' : '#262626',
        subTextColor: isDarkMode ? '#8c8c8c' : '#595959',
        borderColor: isDarkMode ? '#303030' : '#e8e8e8',
        boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.06)',
        radioHoverBg: isDarkMode ? 'rgba(24, 144, 255, 0.1)' : '#e6f7ff',
        radioBorder: isDarkMode ? '#333333' : '#d9d9d9',
        divider: isDarkMode ? '#444444' : '#e8e8e8',
        uploadBg: isDarkMode ? '#242424' : '#fafafa',
        modalBg: isDarkMode ? '#1f1f1f' : '#ffffff'
    };

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerifyingFile, setIsVerifyingFile] = useState(false);
    const [userCvCount, setUserCvCount] = useState(0);

    const [sourceOption, setSourceOption] = useState('suggested');
    const [languageOption, setLanguageOption] = useState('vi');
    const [positionOption, setPositionOption] = useState(null);
    const [positionsList, setPositionsList] = useState([]);
    const [selectedColor, setSelectedColor] = useState(searchParams.get('color') || null);
    const [uploadedFile, setUploadedFile] = useState(null);

    useEffect(() => {
        const fetchTemplateDetail = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/MauCv/${id}`);
                const result = response.data !== undefined ? response.data : response;

                if (result) {
                    if (result.ngonNgu) setLanguageOption(result.ngonNgu.toLowerCase());
                    
                    const rawColorsString = result.danhSachMau || result.DanhSachMau || '';
                    const colorArray = typeof rawColorsString === 'string' && rawColorsString.trim() !== '' 
                        ? rawColorsString.split(',').map(c => c.trim()) 
                        : [];
                    
                    result.parsedColors = colorArray;
                    setTemplate(result);

                    const colorFromUrl = searchParams.get('color');
                    if (colorFromUrl) setSelectedColor(colorFromUrl);
                    else if (colorArray.length > 0) setSelectedColor(colorArray[0]);
                }
            } catch (error) {
                console.error("Lỗi lấy chi tiết mẫu CV:", error);
                message.error("Mẫu CV này không tồn tại hoặc hệ thống đang bảo trì!");
                navigate('/thu-vien-cv');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTemplateDetail();
    }, [id, navigate, searchParams]);

    useEffect(() => {
        const fetchPositionsAndCvCount = async () => {
            try {
                const response = await apiClient.get('/NganhNghe/danh-sach');
                const result = response.data !== undefined ? response.data : response;
                setPositionsList(result || []);
                if (result && result.length > 0) setPositionOption(result[0].maNganh);

                const token = localStorage.getItem('token');
                const userInfo = getUserInfoFromToken(token);
                if (userInfo?.userId) {
                    const cvRes = await apiClient.get(`/Cv/user/${userInfo.userId}`);
                    const cvs = Array.isArray(cvRes) ? cvRes : (cvRes?.data || []);
                    setUserCvCount(cvs.length);
                }
            } catch (error) {}
        };
        fetchPositionsAndCvCount();
    }, []);

    const handleStartBuilding = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            message.warning("Vui lòng đăng nhập để tạo CV!");
            navigate('/login');
            return;
        }

        const userInfo = getUserInfoFromToken(token);
        const isVip = userInfo?.isVip || false;

        if (!isVip && userCvCount >= 5) {
            Modal.confirm({
                title: 'Đã đạt giới hạn tạo hồ sơ',
                content: 'Tài khoản miễn phí chỉ được tạo tối đa 5 CV. Hãy nâng cấp VIP để tạo CV từ mẫu này và sử dụng không giới hạn!',
                okText: 'Nâng cấp VIP ngay',
                cancelText: 'Để sau',
                okButtonProps: { style: { backgroundColor: '#faad14', borderColor: '#faad14', color: '#000' } },
                onOk: () => navigate('/upgrade-vip')
            });
            return;
        }

        if (sourceOption === 'upload-linkedin') {
            if (!uploadedFile) {
                message.warning("Vui lòng tải file CV của bạn lên!");
                return;
            }

            setIsVerifyingFile(true);
            try {
                const formData = new FormData();
                formData.append('file', uploadedFile);

                const response = await apiClient.post('/Cv/import', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const result = response.data !== undefined ? response.data : response;

                if (result.success && result.cvContent) {
                    sessionStorage.setItem('imported_cv_data', JSON.stringify(result.cvContent));
                    message.success('Bóc tách dữ liệu CV thành công!');
                } else {
                    throw new Error("Không thể bóc tách dữ liệu");
                }
            } catch (error) {
                console.error("Lỗi import CV:", error);
                Modal.error({
                    title: 'Định dạng CV không được hỗ trợ',
                    content: error.response?.data?.message || 'Hệ thống hiện chỉ hỗ trợ đọc, bóc tách và chỉnh sửa các file PDF được tạo và tải xuống từ hệ thống JOBSNOW.',
                    okText: 'Đã hiểu'
                });
                setIsVerifyingFile(false);
                return;
            }
            setIsVerifyingFile(false);
        }

        let buildUrl = `/builder?templateId=${id}&source=${sourceOption}&lang=${languageOption}&position=${positionOption || ''}`;
        if (selectedColor) buildUrl += `&color=${encodeURIComponent(selectedColor)}`;
        
        navigate(buildUrl);
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: themeColors.bgColor, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} />
                <div style={{ marginTop: '20px', color: themeColors.subTextColor, fontSize: '15px' }}>Đang tải cấu trúc mẫu CV...</div>
            </div>
        );
    }

    const currentTitle = template?.title || template?.tenMau || template?.TenMau || "Mẫu CV";
    const currentImage = template?.image || template?.anhThumbnail || template?.AnhThumbnail || 'https://via.placeholder.com/400x550';

    const radioCardStyle = (isChecked) => ({
        display: 'flex',
        alignItems: 'flex-start',
        padding: '16px 20px',
        border: `1px solid ${isChecked ? '#1890ff' : themeColors.radioBorder}`,
        borderRadius: '8px',
        marginBottom: '16px',
        backgroundColor: isChecked ? themeColors.radioHoverBg : 'transparent',
        width: '100%',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    });

    return (
        <div style={{ backgroundColor: themeColors.bgColor, minHeight: '100vh', padding: '24px 40px', color: themeColors.textColor, transition: 'all 0.3s ease' }}>

            <Breadcrumb
                style={{ marginBottom: '20px' }}
                items={[
                    { title: <span style={{ color: themeColors.subTextColor, cursor: 'pointer' }} onClick={() => navigate('/')}>Trang chủ</span> },
                    { title: <span style={{ color: themeColors.subTextColor, cursor: 'pointer' }} onClick={() => navigate('/thu-vien-cv')}>Mẫu CV theo style</span> },
                    { title: <span style={{ color: themeColors.textColor, fontWeight: 500 }}>{currentTitle}</span> }
                ]}
            />

            <Title level={3} style={{ color: themeColors.textColor, marginBottom: '30px' }}>{currentTitle}</Title>

            <Row gutter={[40, 24]}>
                {/* CỘT TRÁI: ẢNH PREVIEW */}
                <Col xs={24} md={12} lg={14}>
                    <div style={{ background: themeColors.cardBg, borderRadius: '8px', padding: '12px', boxShadow: themeColors.boxShadow, border: `1px solid ${themeColors.borderColor}` }}>
                        <img src={currentImage} alt={currentTitle} style={{ width: '100%', height: 'auto', borderRadius: '4px', display: 'block' }} />
                    </div>
                </Col>

                {/* CỘT PHẢI: BẢNG TÙY CHỈNH */}
                <Col xs={24} md={12} lg={10}>
                    <div style={{ background: themeColors.cardBg, borderRadius: '12px', padding: '28px', border: `1px solid ${themeColors.borderColor}`, boxShadow: themeColors.boxShadow }}>

                        {/* MÀU SẮC CHỦ ĐẠO */}
                        {template?.parsedColors && template.parsedColors.length > 0 && (
                            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: `1px dashed ${themeColors.divider}` }}>
                                <Title level={5} style={{ color: themeColors.textColor, marginTop: 0, marginBottom: '16px' }}>
                                    Màu sắc chủ đạo
                                </Title>
                                <Space size={16} wrap>
                                    {template.parsedColors.map((color, index) => {
                                        const isSelected = selectedColor === color;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    setSearchParams(prev => { prev.set('color', color); return prev; }, { replace: true });
                                                }}
                                                style={{
                                                    width: '36px', height: '36px', borderRadius: '50%', backgroundColor: color,
                                                    cursor: 'pointer', border: isSelected ? `3px solid ${themeColors.cardBg}` : '3px solid transparent',
                                                    outline: isSelected ? `2px solid ${color}` : '2px solid transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s ease-in-out', boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                                                }}
                                            >
                                                {isSelected && <CheckOutlined style={{ color: '#fff', fontSize: '16px', filter: 'drop-shadow(0px 0px 3px rgba(0,0,0,0.8))' }} />}
                                            </div>
                                        );
                                    })}
                                </Space>
                            </div>
                        )}

                        {/* CHỌN NGÀNH NGHỀ */}
                        <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: `1px dashed ${themeColors.divider}` }}>
                            <Title level={5} style={{ color: themeColors.textColor, marginTop: 0, marginBottom: '8px' }}>
                                Ngành nghề ứng tuyển <span style={{ color: '#ff4d4f' }}>*</span>
                            </Title>
                            <Text style={{ color: themeColors.subTextColor, fontSize: '13.5px', display: 'block', marginBottom: '12px' }}>
                                Chọn ngành nghề để hệ thống tối ưu bố cục và từ khóa cho CV của bạn.
                            </Text>
                            <Select
                                size="large"
                                value={positionOption}
                                onChange={(value) => setPositionOption(value)}
                                style={{ width: '100%' }}
                                className={isDarkMode ? 'custom-dark-select' : 'custom-light-select'}
                                popupClassName="custom-select-dropdown"
                                loading={positionsList.length === 0}
                                placeholder="-- Chọn ngành nghề --"
                            >
                                {positionsList.map((pos) => (
                                    <Option key={pos.maNganh} value={pos.maNganh}>
                                        {pos.tenNganh}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        {/* TÙY CHỌN NGUỒN TẠO CV */}
                        <Title level={5} style={{ color: themeColors.textColor, marginTop: 0, marginBottom: '20px' }}>Bạn muốn tạo CV từ?</Title>

                        <Radio.Group value={sourceOption} onChange={(e) => setSourceOption(e.target.value)} style={{ width: '100%' }}>
                            
                            {/* Option 1: Nội dung gợi ý */}
                            <div style={radioCardStyle(sourceOption === 'suggested')} onClick={() => setSourceOption('suggested')}>
                                <Radio value="suggested" style={{ marginTop: '2px', marginRight: '12px' }} />
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ color: themeColors.textColor, fontSize: '15px' }}>Nội dung CV mẫu JobsNow gợi ý</Text>
                                    <Text style={{ color: themeColors.subTextColor, fontSize: '13px', display: 'block', marginTop: '4px' }}>Cung cấp sẵn sườn cấu trúc và nội dung mẫu chuẩn.</Text>

                                    {sourceOption === 'suggested' && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${themeColors.divider}` }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text style={{ color: themeColors.subTextColor, fontSize: '13px' }}>Ngôn ngữ thiết kế</Text>
                                            </div>
                                            <Space wrap>
                                                <Button type={languageOption === 'vi' ? 'primary' : 'default'} onClick={() => setLanguageOption('vi')} style={{ borderRadius: '20px' }}>
                                                    Tiếng Việt
                                                </Button>
                                                <Button type={languageOption === 'en' ? 'primary' : 'default'} onClick={() => setLanguageOption('en')} style={{ borderRadius: '20px' }}>
                                                    Tiếng Anh (English)
                                                </Button>
                                            </Space>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Option 2: Upload File PDF */}
                            <div style={radioCardStyle(sourceOption === 'upload-linkedin')} onClick={() => setSourceOption('upload-linkedin')}>
                                <Radio value="upload-linkedin" style={{ marginTop: '2px', marginRight: '12px' }} />
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ color: themeColors.textColor, fontSize: '15px' }}>Nội dung CV từ máy tính của bạn</Text>
                                    <Text style={{ color: themeColors.subTextColor, fontSize: '13px', display: 'block', marginTop: '4px' }}>Tự động bóc tách dữ liệu từ file PDF có sẵn của bạn.</Text>
                                    
                                    {sourceOption === 'upload-linkedin' && (
                                        <div style={{ marginTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                                            <Upload 
                                                accept=".pdf" 
                                                maxCount={1} 
                                                beforeUpload={(file) => {
                                                    setUploadedFile(file);
                                                    return false;
                                                }}
                                                onRemove={() => setUploadedFile(null)}
                                            >
                                                <Button icon={<UploadOutlined />} style={{ backgroundColor: themeColors.uploadBg, color: '#1890ff', borderColor: '#1890ff', fontWeight: 500 }}>
                                                    Tải file lên (PDF)
                                                </Button>
                                            </Upload>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Option 3: Tạo CV từ đầu */}
                            <div style={radioCardStyle(sourceOption === 'scratch')} onClick={() => setSourceOption('scratch')}>
                                <Radio value="scratch" style={{ marginTop: '2px', marginRight: '12px' }} />
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ color: themeColors.textColor, fontSize: '15px' }}>Tạo CV từ đầu</Text>
                                    <Text style={{ color: themeColors.subTextColor, fontSize: '13px', display: 'block', marginTop: '4px' }}>Bắt đầu từ một khung CV trắng không có nội dung gợi ý.</Text>
                                </div>
                            </div>
                        </Radio.Group>

                        {/* THAO TÁC NÚT BẤM */}
                        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '28px' }}>
                            <Button
                                type="primary" size="large" block icon={<EditOutlined />}
                                onClick={() => {
                                    if (!positionOption) {
                                        message.warning("Vui lòng chọn Ngành nghề ứng tuyển trước khi tạo CV!");
                                        return;
                                    }
                                    handleStartBuilding(); 
                                }}
                                loading={isVerifyingFile}
                                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', height: '48px', fontWeight: 'bold', borderRadius: '8px', fontSize: '16px', boxShadow: '0 4px 12px rgba(24,144,255,0.3)' }}
                            >
                                {isVerifyingFile ? 'Đang đọc hệ thống file...' : 'Bắt đầu tạo CV'}
                            </Button>
                            <Button
                                type="text" size="large" block icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/thu-vien-cv')}
                                style={{ color: themeColors.subTextColor, height: '48px', borderRadius: '8px' }}
                            >
                                Quay lại thư viện CV
                            </Button>
                        </Space>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default TemplatePreview;