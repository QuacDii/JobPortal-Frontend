import React, { useState, useEffect } from 'react';
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
    GlobalOutlined
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';
import './css/CvTemplateLibrary.css';

const FacebookLogin = FacebookLoginRaw.default || FacebookLoginRaw;
const { Title, Text } = Typography;
const { Option } = Select;

// Component Icon custom
function CheckCircleIcon({ color }) {
    return (
        <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill={color} aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"></path>
        </svg>
    );
}

// Danh sách các bộ lọc hiển thị trên thanh ngang
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
    
    // BỘ ĐỌC URL: Lấy từ khóa category từ Header truyền sang
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category');

    // HỢP NHẤT STATE: Chỉ dùng activeFilter cho tất cả các thao tác lọc
    const [activeFilter, setActiveFilter] = useState(categoryFromUrl || 'Tất cả');
    
    const [cvTemplates, setCvTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    // BẮT SỰ KIỆN URL THAY ĐỔI
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
                const data = response.data !== undefined ? response.data : response;
                setCvTemplates(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error("Lỗi khi tải mẫu CV:", error);
                setLoading(false);
            });
    }, []);

    // THUẬT TOÁN LỌC DỮ LIỆU ĐÃ ĐƯỢC NÂNG CẤP
    const filteredCVs = cvTemplates.filter(cv => {
        // 1. Lọc theo ngôn ngữ
        const cvLangUpper = cv.ngonNgu ? cv.ngonNgu.toUpperCase() : '';
        const matchLang = language === 'ALL' || cvLangUpper === language.toUpperCase();
        
        // 2. Lọc theo Danh mục / Tags
        let matchCategory = false;
        if (activeFilter === 'Tất cả') {
            matchCategory = true;
        } else {
            // Quét cả trong trường categories và tags để đảm bảo không bỏ sót
            const hasCategory = cv.categories && cv.categories.includes(activeFilter);
            const hasTag = cv.tags && cv.tags.includes(activeFilter);
            matchCategory = hasCategory || hasTag;
        }

        return matchLang && matchCategory;
    });

    const handleTemplateClick = (currentId, chosenColor) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsModalOpen(true);
        } else {
            if (chosenColor) {
                navigate(`/xem-truoc-cv/${currentId}?color=${encodeURIComponent(chosenColor)}`);
            } else {
                navigate(`/xem-truoc-cv/${currentId}`);
            }
        }
    };

    const handlePopupLogin = async (values) => {
        try {
            setLoginLoading(true);
            const response = await apiClient.post('/auth/login', {
                email: values.email,
                matKhau: values.matKhau
            });

            if (response.data && response.data.success) {
                message.success('Đăng nhập thành công!');
                localStorage.setItem('token', response.data.token);
                setIsModalOpen(false);
                loginForm.resetFields();
                window.location.reload();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!';
            message.error(errorMsg);
        } finally {
            setLoginLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await apiClient.post('/auth/google-login', { accessToken: tokenResponse.access_token });
                const result = response.data !== undefined ? response.data : response;
                if (result && result.success) {
                    message.success('Đăng nhập Google thành công!');
                    localStorage.setItem('token', result.token);
                    setIsModalOpen(false);
                    window.location.reload();
                }
            } catch (error) { message.error('Đăng nhập Google thất bại!'); }
        },
        onError: () => message.error('Kết nối Google thất bại!')
    });

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '40px' }}>
            {/* THANH LỌC DANH MỤC & NGÔN NGỮ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 4px 12px 4px', flex: 1 }}>
                    {filterOptions.map(filter => (
                        <div
                            key={filter.key}
                            className={`filter-pill ${activeFilter === filter.key ? 'active' : ''}`}
                            onClick={() => {
                                // Xóa param trên URL đi nếu user tự click vào các pill lọc này để tránh lỗi URL đè nhau
                                navigate('/thu-vien-cv');
                                setActiveFilter(filter.key);
                            }}
                        >
                            {filter.icon}
                            {filter.key}
                        </div>
                    ))}
                </div>

                <Select
                    value={language}
                    onChange={setLanguage}
                    style={{ width: 145 }}
                    className="custom-dark-select"
                    popupClassName="custom-dark-dropdown"
                    dropdownStyle={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                >
                    <Option value="ALL">
                        <GlobalOutlined style={{ marginRight: '8px', color: '#fff', verticalAlign: 'middle' }} /> Tất cả
                    </Option>
                    <Option value="VI">
                        <img src="https://flagcdn.com/w20/vn.png" alt="Vietnam Flag" style={{ width: '18px', marginRight: '8px', borderRadius: '2px', verticalAlign: 'middle' }} /> Tiếng Việt
                    </Option>
                    <Option value="EN">
                        <img src="https://flagcdn.com/w20/gb.png" alt="UK Flag" style={{ width: '18px', marginRight: '8px', borderRadius: '2px', verticalAlign: 'middle' }} /> Tiếng Anh
                    </Option>
                </Select>
            </div>

            {/* HIỂN THỊ DANH SÁCH CV */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#1890ff' }} spin />} />
                    <div style={{ marginTop: '16px', color: '#a6a6a6' }}>Đang tải danh sách CV...</div>
                </div>
            ) : (
                <>
                    <Row gutter={[24, 24]}>
                        {filteredCVs.map(cv => {
                            const currentId = cv.id;
                            const currentTitle = cv.title;
                            const currentImage = cv.image;

                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={currentId}>
                                    <Card
                                        className="cv-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleTemplateClick(currentId)}
                                        cover={
                                            <div style={{ padding: '0', backgroundColor: '#333', position: 'relative' }}>
                                                <img alt={currentTitle} src={currentImage} style={{ width: '100%', height: '360px', objectFit: 'cover', objectPosition: 'top' }} />
                                                {cv.isATS && (
                                                    <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#00b14f', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        <CheckCircleFilled style={{ marginRight: '4px' }} /> Chuẩn ATS
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    >
                                        {cv.colors && cv.colors.length > 0 && (
                                            <Space size={8} style={{ marginBottom: '12px' }}>
                                                {cv.colors.map((color, index) => (
                                                    <span
                                                        key={index}
                                                        className="color-dot"
                                                        style={{ backgroundColor: color }}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            handleTemplateClick(currentId, color); 
                                                        }}
                                                    ></span>
                                                ))}
                                            </Space>
                                        )}

                                        <Title level={4} style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '16px' }}>{currentTitle}</Title>

                                        <Space size={[0, 8]} wrap>
                                            <Tag color="blue" style={{ border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <GlobalOutlined />
                                                {cv.ngonNgu && cv.ngonNgu.toUpperCase() === 'VI' ? 'Tiếng Việt' : 'Tiếng Anh'}
                                            </Tag>
                                            {cv.tags && cv.tags.split(',').map((tag, idx) => (
                                                <Tag key={idx} color="#333" style={{ color: '#a6a6a6', border: 'none' }}>
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
                        <div style={{ textAlign: 'center', color: '#a6a6a6', marginTop: '50px', fontSize: '16px' }}>
                            Chưa có mẫu CV nào cho danh mục này.
                        </div>
                    )}
                </>
            )}

            {/* POPUP MODAL ĐĂNG NHẬP */}
            <Modal title="Đăng nhập để xem mẫu CV" open={isModalOpen} onCancel={() => { setIsModalOpen(false); loginForm.resetFields(); }} footer={null} width={400} className="dark-login-modal" centered>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Text style={{ color: '#a6a6a6', fontSize: '14px' }}>Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng.</Text>
                </div>
                <Form form={loginForm} layout="vertical" onFinish={handlePopupLogin} requiredMark={false}>
                    <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}>
                        <Input prefix={<MailOutlined style={{ color: '#666' }} />} placeholder="Nhập email của bạn" size="large" style={{ backgroundColor: '#141414', border: '1px solid #303030', color: '#fff', borderRadius: '6px' }} />
                    </Form.Item>
                    <Form.Item label="Mật khẩu" name="matKhau" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#666' }} />} placeholder="Nhập mật khẩu" size="large" style={{ backgroundColor: '#141414', border: '1px solid #303030', color: '#fff', borderRadius: '6px' }} />
                    </Form.Item>
                    <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" block size="large" loading={loginLoading} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 'bold', height: '44px', borderRadius: '6px' }}>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                    <Divider plain style={{ borderColor: '#303030', margin: '20px 0' }}><span style={{ color: '#666', fontSize: '13px', padding: '0 10px' }}>Hoặc đăng nhập bằng</span></Divider>
                    <Row gutter={16} style={{ marginBottom: 10 }}>
                        <Col span={12}>
                            <Button size="large" block icon={<GoogleOutlined />} onClick={() => loginWithGoogle()} style={{ backgroundColor: '#ea4335', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }}>Google</Button>
                        </Col>
                        <Col span={12}>
                            <FacebookLogin
                                appId="1594501296013131" fields="name,email,picture" scope="public_profile,email"
                                callback={async (response) => {
                                    if (response.accessToken) {
                                        try {
                                            const res = await apiClient.post('/auth/facebook-login', { accessToken: response.accessToken });
                                            if (res.data.success) {
                                                message.success('Đăng nhập Facebook thành công!');
                                                localStorage.setItem('token', res.data.token); setIsModalOpen(false); window.location.reload();
                                            }
                                        } catch (error) { message.error('Đăng nhập Facebook thất bại tại Server!'); }
                                    } else { message.error('Hủy kết nối Facebook!'); }
                                }}
                                render={renderProps => (<Button size="large" block icon={<FacebookFilled />} style={{ backgroundColor: '#1877f2', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }} onClick={renderProps.onClick}>Facebook</Button>)}
                            />
                        </Col>
                    </Row>
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <span style={{ color: '#a6a6a6' }}>Chưa có tài khoản? </span><a href="/register" style={{ color: '#1890ff', fontWeight: '500' }}>Đăng ký ngay</a>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CvTemplateLibrary;