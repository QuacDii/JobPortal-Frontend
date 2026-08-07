import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Typography, Space, Select, Tag, Spin, Modal, Form, Input, Button, message, Divider } from 'antd';
import {
    AppstoreOutlined,
    StarOutlined,
    FireOutlined,
    RocketOutlined,
    BankOutlined,
    SafetyCertificateOutlined,
    LoadingOutlined,
    MailOutlined,
    LockOutlined,
    GoogleOutlined,
    FacebookFilled,
    CheckCircleFilled,
    GlobalOutlined,
    CrownFilled
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';
import './css/CvTemplateLibrary.css';

const FacebookLogin = FacebookLoginRaw.default || FacebookLoginRaw;
const { Title, Text } = Typography;
const { Option } = Select;

function CheckCircleIcon({ color }) {
    return (
        <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill={color} aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"></path>
        </svg>
    );
}

const filterOptions = [
    { key: 'Tất cả', icon: <AppstoreOutlined /> },
    { key: 'Đơn giản', icon: <CheckCircleIcon color="currentColor" /> },
    { key: 'Chuyên nghiệp', icon: <StarOutlined /> },
    { key: 'Hiện đại', icon: <FireOutlined /> },
    { key: 'Ấn tượng', icon: <RocketOutlined /> },
    { key: 'Harvard', icon: <BankOutlined /> },
    { key: 'ATS', icon: <SafetyCertificateOutlined /> }
];

const CvTemplateLibrary = () => {
    const navigate = useNavigate();
    const [loginForm] = Form.useForm();
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category');

    const [activeFilter, setActiveFilter] = useState(categoryFromUrl || 'Tất cả');
    const [cvTemplates, setCvTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVipPromptModalOpen, setIsVipPromptModalOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [isUserVip, setIsUserVip] = useState(false);

    // 🌟 STATE QUẢN LÝ CHI TIẾT TRẠNG THÁI GÓI VÀ ĐẶC QUYỀN
    const [userDacQuyenStatus, setUserDacQuyenStatus] = useState({
        hasActivePackage: false,
        hasCvVipPrivilege: false,
        tenGoiHienTai: 'Miễn phí'
    });

    const isDarkMode = false;

    const themeColors = {
        bgColor: '#f4f5f5',
        textColor: '#333333',
        subTextColor: '#595959',
        cardBg: '#ffffff',
        cardBorder: '#e8e8e8',
        tagBg: '#f0f0f0',
        modalBg: '#ffffff',
        inputBg: '#ffffff',
        inputBorder: '#d9d9d9',
        activeFilterBg: '#1890ff',
        filterBg: '#ffffff',
    };

    const handleRoleNavigation = (token) => {
        try {
            const decoded = jwtDecode(token);
            const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
                || decoded.role
                || decoded.VaiTro;

            if (String(role) === "0") {
                window.location.href = '/admin/dashboard';
            } else if (String(role) === "1") {
                window.location.href = '/employer/dashboard'; // Chuyển sang giao diện Nhà tuyển dụng
            } else {
                window.location.reload(); // Ứng viên thì ở lại trang hiện tại
            }
        } catch (e) {
            window.location.reload();
        }
    };
    // 🌟 HÀM KIỂM TRA TRẠNG THÁI VIP & ĐẶC QUYỀN REAL-TIME
    const checkVipStatus = () => {
        const token = localStorage.getItem('token');
        if (token) {
            apiClient.get('/Service/balance')
                .then(res => {
                    const balData = res.data !== undefined ? res.data : res;
                    const hasCvVip = balData?.cacDacQuyen?.includes('UV_PREMIUM_CV') || false;
                    const isPackageActive = balData?.ngayHetHanGoi && new Date(balData.ngayHetHanGoi) > new Date();

                    setUserDacQuyenStatus({
                        hasActivePackage: !!isPackageActive,
                        hasCvVipPrivilege: hasCvVip,
                        tenGoiHienTai: balData?.tenGoiHienTai || 'Miễn phí'
                    });

                    setIsUserVip(!!hasCvVip);
                })
                .catch(() => {
                    setIsUserVip(false);
                    setUserDacQuyenStatus({
                        hasActivePackage: false,
                        hasCvVipPrivilege: false,
                        tenGoiHienTai: 'Miễn phí'
                    });
                });
        }
    };

    useEffect(() => {
        checkVipStatus();
        window.addEventListener('update_vip_status', checkVipStatus);
        return () => window.removeEventListener('update_vip_status', checkVipStatus);
    }, []);

    useEffect(() => {
        if (categoryFromUrl) {
            setActiveFilter(categoryFromUrl);
        } else {
            setActiveFilter('Tất cả');
        }
    }, [categoryFromUrl]);

    useEffect(() => {
        apiClient.get('/MauCv')
            .then(response => {
                let data = response.data !== undefined ? response.data : response;
                if (Array.isArray(data)) {
                    data.sort((a, b) => {
                        const idA = a.maMau || a.MaMau || a.id || 0;
                        const idB = b.maMau || b.MaMau || b.id || 0;
                        return idA - idB;
                    });
                }
                setCvTemplates(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error("Lỗi khi tải mẫu CV:", error);
                setLoading(false);
            });
    }, []);

    const filteredCVs = cvTemplates.filter(cv => {
        const cvLangUpper = cv.ngonNgu ? cv.ngonNgu.toUpperCase() : '';
        const matchLang = language === 'ALL' || cvLangUpper === language.toUpperCase();

        let matchCategory = false;
        if (activeFilter === 'Tất cả') {
            matchCategory = true;
        } else {
            const hasCategory = cv.categories && cv.categories.includes(activeFilter);
            const hasTag = cv.tags && cv.tags.includes(activeFilter);
            matchCategory = hasCategory || hasTag;
        }

        return matchLang && matchCategory;
    });

    const handleTemplateClick = (cv, chosenColor) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsModalOpen(true);
            return;
        }

        const isTemplateVip = cv.isVip === true || cv.IsVip === true || cv.isVIP === true || cv.IsVIP === true;

        if (isTemplateVip && !isUserVip) {
            setIsVipPromptModalOpen(true);
            return;
        }

        const currentId = cv.id || cv.maMau || cv.MaMau;
        if (chosenColor) {
            navigate(`/xem-truoc-cv/${currentId}?color=${encodeURIComponent(chosenColor)}`);
        } else {
            navigate(`/xem-truoc-cv/${currentId}`);
        }
    };
    const handlePopupLogin = async (values) => {
        try {
            setLoginLoading(true);
            const response = await apiClient.post('/Auth/login', {
                email: values.email,
                password: values.matKhau || values.password,
                matKhau: values.matKhau || values.password
            });

            const result = response.data !== undefined ? response.data : response;
            const token = result?.token || result?.accessToken;

            if (token) {
                message.success('Đăng nhập thành công!');
                localStorage.setItem('token', token);
                setIsModalOpen(false);

                // 🚀 Điều hướng tự động theo Role
                handleRoleNavigation(token);
            } else {
                message.error(result?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Đăng nhập thất bại!');
        } finally {
            setLoginLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await apiClient.post('/auth/google-login', { accessToken: tokenResponse.access_token });
                const result = response.data !== undefined ? response.data : response;
                const token = result?.token || result?.accessToken;

                if (token) {
                    message.success('Đăng nhập Google thành công!');
                    localStorage.setItem('token', token);
                    setIsModalOpen(false);

                    // 🚀 Điều hướng tự động theo Role
                    handleRoleNavigation(token);
                }
            } catch (error) { message.error('Đăng nhập Google thất bại!'); }
        },
        onError: () => message.error('Kết nối Google thất bại!')
    });

    return (
        <div style={{ backgroundColor: themeColors.bgColor, minHeight: '100vh', padding: '40px 8%', transition: 'all 0.3s ease' }}>

            {/* TIÊU ĐỀ TRANG */}
            <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px auto' }}>
                <Title level={2} style={{ color: themeColors.textColor, fontWeight: '700', fontSize: '28px' }}>
                    Mẫu CV xin việc tiếng Việt <span style={{ color: '#1890ff' }}>{activeFilter}</span> chuẩn 2026
                </Title>
                <Text style={{ color: themeColors.subTextColor, fontSize: '15px', lineHeight: '1.6', display: 'block', marginTop: '16px' }}>
                    Tuyển chọn các mẫu CV tiếng Việt có thiết kế {activeFilter.toLowerCase()}, ưu tiên tính dễ đọc và dễ sử dụng. Dành cho ứng viên muốn tập trung vào khả năng truyền tải thông tin một cách đầy đủ và rõ ràng - hơn là những chi tiết trang trí cầu kỳ.
                </Text>
            </div>

            {/* THANH LỌC DANH MỤC & NGÔN NGỮ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="filter-scroll-container" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 4px 12px 4px', flex: 1 }}>
                    {filterOptions.map(filter => {
                        const isActive = activeFilter === filter.key;
                        return (
                            <div
                                key={filter.key}
                                className={`filter-pill ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    navigate('/thu-vien-cv');
                                    setActiveFilter(filter.key);
                                }}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: isActive ? '600' : '500',
                                    backgroundColor: isActive ? themeColors.activeFilterBg : themeColors.filterBg,
                                    color: isActive ? '#fff' : themeColors.subTextColor,
                                    border: `1px solid ${isActive ? themeColors.activeFilterBg : themeColors.cardBorder}`,
                                    boxShadow: isActive ? '0 4px 10px rgba(24, 144, 255, 0.3)' : 'none',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {filter.icon}
                                {filter.key}
                            </div>
                        );
                    })}
                </div>

                <Select
                    value={language}
                    onChange={setLanguage}
                    style={{ width: 150 }}
                    size="large"
                    className="custom-light-select"
                >
                    <Option value="ALL"><GlobalOutlined style={{ marginRight: '8px' }} /> Tất cả</Option>
                    <Option value="VI"><img src="https://flagcdn.com/w20/vn.png" alt="VN" style={{ width: '18px', marginRight: '8px', borderRadius: '2px' }} /> Tiếng Việt</Option>
                    <Option value="EN"><img src="https://flagcdn.com/w20/gb.png" alt="UK" style={{ width: '18px', marginRight: '8px', borderRadius: '2px' }} /> Tiếng Anh</Option>
                </Select>
            </div>

            {/* HIỂN THỊ DANH SÁCH CV */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#1890ff' }} spin />} />
                    <div style={{ marginTop: '16px', color: themeColors.subTextColor }}>Đang tải danh sách CV...</div>
                </div>
            ) : (
                <>
                    <Row gutter={[24, 32]}>
                        {filteredCVs.map(cv => {
                            const currentId = cv.id || cv.maMau || cv.MaMau;
                            const currentTitle = cv.title || cv.tenMau || cv.TenMau;
                            const currentImage = cv.image || cv.anhThumbnail || cv.anhMoPhong || 'https://via.placeholder.com/300x400?text=No+Image';
                            const isVipTemplate = cv.isVip === true || cv.IsVip === true || cv.isVIP === true || cv.IsVIP === true;

                            const rawColorsString = cv.danhSachMau || cv.DanhSachMau || '';
                            const colorArray = typeof rawColorsString === 'string' && rawColorsString.trim() !== ''
                                ? rawColorsString.split(',').map(c => c.trim())
                                : [];

                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={currentId}>
                                    <Card
                                        className="cv-card"
                                        hoverable
                                        style={{
                                            background: themeColors.cardBg,
                                            border: `1px solid ${themeColors.cardBorder}`,
                                        }}
                                        onClick={() => handleTemplateClick(cv)}
                                        bodyStyle={{ padding: '16px' }}
                                        cover={
                                            <div style={{ padding: '0', backgroundColor: '#e8e8e8', position: 'relative' }}>
                                                <img alt={currentTitle} src={currentImage} style={{ width: '100%', height: '360px', objectFit: 'cover', objectPosition: 'top' }} />

                                                {/* TAG CHUẨN ATS (Xanh lá) */}
                                                {cv.isATS && (
                                                    <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#00b14f', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                                                        <CheckCircleFilled style={{ marginRight: '4px' }} /> Chuẩn ATS
                                                    </div>
                                                )}

                                                {/* TAG PRO / VIP (Vàng) */}
                                                {isVipTemplate && (
                                                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(90deg, #faad14, #ffc53d)', color: '#000', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                                                        <CrownFilled style={{ marginRight: '4px' }} /> VIP
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    >
                                        {/* Bảng chọn màu CV */}
                                        {colorArray.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                {colorArray.map((color, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            backgroundColor: color, width: '22px', height: '22px',
                                                            borderRadius: '50%', cursor: 'pointer', border: '1px solid #d9d9d9',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTemplateClick(cv, color);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <Title level={4} style={{ color: themeColors.textColor, margin: '0 0 12px 0', fontSize: '15.5px', lineHeight: '1.4', fontWeight: '700' }}>{currentTitle}</Title>

                                        <Space size={[0, 8]} wrap>
                                            <Tag color="blue" style={{ border: 'none', borderRadius: '4px', background: '#e6f7ff', color: '#1890ff' }}>
                                                <GlobalOutlined style={{ marginRight: '4px' }} />
                                                {cv.ngonNgu && cv.ngonNgu.toUpperCase() === 'VI' ? 'Tiếng Việt' : 'Tiếng Anh'}
                                            </Tag>
                                            {cv.tags && cv.tags.split(',').map((tag, idx) => (
                                                <Tag key={idx} style={{ color: themeColors.subTextColor, background: themeColors.tagBg, border: 'none', borderRadius: '4px' }}>
                                                    {tag.trim()}
                                                </Tag>
                                            ))}
                                        </Space>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>

                    {filteredCVs.length === 0 && (
                        <div style={{ textAlign: 'center', color: themeColors.subTextColor, marginTop: '50px', fontSize: '16px' }}>
                            Chưa có mẫu CV nào cho danh mục này.
                        </div>
                    )}
                </>
            )}

            {/* POPUP 1: ĐĂNG NHẬP SÁNG/TỐI (Light Mode) */}
            <Modal
                title={<span style={{ color: themeColors.textColor, fontSize: '20px' }}>Đăng nhập để xem mẫu CV</span>}
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); loginForm.resetFields(); }}
                footer={null}
                width={420}
                className="custom-modal"
                styles={{ content: { backgroundColor: themeColors.modalBg, border: `1px solid ${themeColors.cardBorder}` } }}
                centered
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Text style={{ color: themeColors.subTextColor, fontSize: '14px' }}>Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng.</Text>
                </div>
                <Form form={loginForm} layout="vertical" onFinish={handlePopupLogin} requiredMark={false}>
                    <Form.Item label={<span style={{ color: themeColors.textColor, fontWeight: '500' }}>Email</span>} name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}>
                        <Input prefix={<MailOutlined style={{ color: '#8c8c8c' }} />} placeholder="Nhập email của bạn" size="large" style={{ backgroundColor: themeColors.inputBg, border: `1px solid ${themeColors.inputBorder}`, color: themeColors.textColor, borderRadius: '6px' }} />
                    </Form.Item>
                    <Form.Item label={<span style={{ color: themeColors.textColor, fontWeight: '500' }}>Mật khẩu</span>} name="matKhau" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder="Nhập mật khẩu" size="large" style={{ backgroundColor: themeColors.inputBg, border: `1px solid ${themeColors.inputBorder}`, color: themeColors.textColor, borderRadius: '6px' }} />
                    </Form.Item>
                    <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" block size="large" loading={loginLoading} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 'bold', height: '44px', borderRadius: '6px' }}>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                    <Divider plain style={{ borderColor: themeColors.inputBorder, margin: '20px 0' }}><span style={{ color: themeColors.subTextColor, fontSize: '13px', padding: '0 10px' }}>Hoặc đăng nhập bằng</span></Divider>
                    <Row gutter={16} style={{ marginBottom: 10 }}>
                        <Col span={12}>
                            <Button size="large" block icon={<GoogleOutlined />} onClick={() => loginWithGoogle()} style={{ backgroundColor: '#ea4335', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }}>Google</Button>
                        </Col>
                        <Col span={12}>
                            <FacebookLogin
                                appId="1594501296013131"
                                fields="name,email,picture"
                                scope="public_profile,email"
                                callback={async (response) => {
                                    if (response.accessToken) {
                                        try {
                                            const res = await apiClient.post('/auth/facebook-login', { accessToken: response.accessToken });
                                            const result = res.data !== undefined ? res.data : res;
                                            const token = result?.token || result?.accessToken;

                                            if (token) {
                                                message.success('Đăng nhập Facebook thành công!');
                                                localStorage.setItem('token', token);
                                                setIsModalOpen(false);

                                                // 🚀 Điều hướng tự động theo Role
                                                handleRoleNavigation(token);
                                            }
                                        } catch (error) { message.error('Đăng nhập Facebook thất bại!'); }
                                    }
                                }}
                                render={renderProps => (
                                    <Button size="large" block icon={<FacebookFilled />} style={{ backgroundColor: '#1877f2', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }} onClick={renderProps.onClick}>
                                        Facebook
                                    </Button>
                                )}
                            />
                        </Col>
                    </Row>
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <span style={{ color: themeColors.subTextColor }}>Chưa có tài khoản? </span><a href="/register" style={{ color: '#1890ff', fontWeight: '500' }}>Đăng ký ngay</a>
                    </div>
                </Form>
            </Modal>

            {/* 🌟 POPUP 2: THÔNG BÁO YÊU CẦU NÂNG CẤP ĐỘNG DỰA THEO TRẠNG THÁI TÀI KHOẢN */}
            <Modal
                open={isVipPromptModalOpen}
                onCancel={() => setIsVipPromptModalOpen(false)}
                footer={null}
                centered
                width={440}
                className="custom-modal"
                styles={{ content: { backgroundColor: themeColors.modalBg, border: `1px solid ${themeColors.cardBorder}` } }}
            >
                <div style={{ textAlign: 'center' }}>
                    <CrownFilled style={{ fontSize: '54px', color: '#faad14', marginBottom: '16px' }} />

                    {userDacQuyenStatus.hasActivePackage ? (
                        <>
                            <Title level={4} style={{ color: themeColors.textColor, margin: '0 0 10px 0', fontWeight: '700' }}>
                                Gói Dịch Vụ Chưa Hỗ Trợ
                            </Title>
                            <Text style={{ color: themeColors.subTextColor, fontSize: '14.5px', display: 'block', marginBottom: '24px', lineHeight: '1.6' }}>
                                Gói hiện tại của bạn là <b>{userDacQuyenStatus.tenGoiHienTai}</b> không bao gồm đặc quyền <b>Mẫu CV VIP</b>. Vui lòng nâng cấp lên <b>Gói Ứng Viên Pro</b> để mở khóa toàn bộ mẫu CV đẹp mắt.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Title level={4} style={{ color: themeColors.textColor, margin: '0 0 10px 0', fontWeight: '700' }}>
                                Đặc Quyền Mẫu CV VIP
                            </Title>
                            <Text style={{ color: themeColors.subTextColor, fontSize: '14.5px', display: 'block', marginBottom: '24px', lineHeight: '1.6' }}>
                                Mẫu CV này thuộc danh mục <b>Cao cấp (VIP)</b>. Vui lòng nâng cấp tài khoản VIP để mở khóa toàn bộ mẫu CV đẹp mắt và không giới hạn lượt tạo.
                            </Text>
                        </>
                    )}

                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={() => navigate('/upgrade-vip')}
                            style={{ background: 'linear-gradient(90deg, #faad14, #ffc53d)', color: '#000', fontWeight: 'bold', border: 'none', height: '46px', borderRadius: '8px' }}
                        >
                            {userDacQuyenStatus.hasActivePackage ? '🚀 Nâng Cấp Lên Gói Pro' : '🚀 Nâng Cấp VIP Ngay'}
                        </Button>
                        <Button type="text" onClick={() => setIsVipPromptModalOpen(false)} style={{ color: themeColors.subTextColor }}>
                            Để sau
                        </Button>
                    </Space>
                </div>
            </Modal>
        </div>
    );
};

export default CvTemplateLibrary;