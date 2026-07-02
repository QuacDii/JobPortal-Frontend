import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    GlobalOutlined // <-- Đã thêm icon này để sửa lỗi sập ứng dụng
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';

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

    const [cvTemplates, setCvTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeFilter, setActiveFilter] = useState('Tất cả');
    const [language, setLanguage] = useState('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    useEffect(() => {
        apiClient.get('/MauCv')
            .then(response => {
                setCvTemplates(response.data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error("Lỗi khi tải mẫu CV:", error);
                setLoading(false);
            });
    }, []);

    const filteredCVs = cvTemplates.filter(cv => {
        const matchLang = language === 'ALL' || cv.ngonNgu === language;
        const matchCategory = activeFilter === 'Tất cả' || (cv.tags && cv.tags.includes(activeFilter));
        return matchLang && matchCategory;
    });

    const handleTemplateClick = (currentId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsModalOpen(true);
        } else {
            navigate(`/xem-truoc-cv/${currentId}`);
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
                if (response.data.success) {
                    message.success('Đăng nhập Google thành công!');
                    localStorage.setItem('token', response.data.token);
                    setIsModalOpen(false);
                    window.location.reload();
                }
            } catch (error) { message.error('Đăng nhập Google thất bại!'); }
        },
        onError: () => message.error('Kết nối Google thất bại!')
    });

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '40px' }}>

            <style>{`
                /* ================= CSS CÁC NÚT PHÂN LOẠI ================= */
                .filter-pill { 
                    display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; 
                    border-radius: 24px; background-color: #242424; color: #a6a6a6; 
                    cursor: pointer; font-weight: 500; white-space: nowrap; border: 1px solid #333; 
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
                }
                .filter-pill:hover { 
                    background-color: rgba(24, 144, 255, 0.1); color: #1890ff; border-color: #1890ff; 
                    transform: translateY(-4px); box-shadow: 0 6px 16px rgba(24, 144, 255, 0.15); 
                }
                .filter-pill.active { 
                    background-color: #1890ff; color: #fff; border-color: #1890ff;
                    transform: translateY(-4px); box-shadow: 0 6px 16px rgba(24, 144, 255, 0.3); 
                }

                /* ================= CSS SỬA LỖI MENU DROP NGÔN NGỮ ================= */
                .custom-dark-select .ant-select-selector {
                    background-color: #242424 !important;
                    border: 1px solid #333 !important;
                    color: #fff !important;
                    border-radius: 24px !important; 
                    height: 38px !important;
                    align-items: center;
                    transition: all 0.3s;
                }
                .custom-dark-select:hover .ant-select-selector {
                    border-color: #1890ff !important;
                    box-shadow: 0 0 8px rgba(24, 144, 255, 0.2) !important;
                }
                .custom-dark-select .ant-select-arrow { color: #a6a6a6 !important; }
                
                /* Menu xổ xuống (Fix lỗi nền xám trắng) */
                .custom-dark-dropdown {
                    background-color: #242424 !important;
                    border: 1px solid #333 !important;
                    border-radius: 12px !important;
                    padding: 4px !important;
                }
                .custom-dark-dropdown .ant-select-item {
                    color: #a6a6a6 !important;
                    border-radius: 8px !important;
                    margin-bottom: 2px;
                    transition: all 0.2s;
                }
                /* Khi rê chuột vào Option (Hover) */
                .custom-dark-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled),
                .custom-dark-dropdown .ant-select-item:hover {
                    background-color: rgba(24, 144, 255, 0.1) !important;
                    color: #1890ff !important;
                }
                /* Khi Option đang được chọn sẵn (Selected) */
                .custom-dark-dropdown .ant-select-item-option-selected {
                    background-color: #1890ff !important;
                    color: #fff !important;
                    font-weight: 600 !important;
                }

                /* ================= CSS GIAO DIỆN KHÁC ================= */
                .cv-card { background-color: #242424 !important; border: 1px solid #333 !important; border-radius: 8px !important; overflow: hidden; transition: transform 0.3s ease, border-color 0.3s ease; }
                .cv-card:hover { transform: translateY(-5px); border-color: #1890ff !important; }
                .cv-card .ant-card-body { padding: 16px !important; }
                .color-dot { width: 16px; height: 16px; border-radius: 50%; display: inline-block; cursor: pointer; border: 2px solid transparent; }
                .color-dot:hover { border-color: #fff; }
                .dark-login-modal .ant-modal-content { background-color: #1f1f1f !important; color: #fff !important; border-radius: 12px !important; border: 1px solid #303030; padding: 24px !important; }
                .dark-login-modal .ant-modal-header { background: transparent !important; border-bottom: none !important; margin-bottom: 8px !important; }
                .dark-login-modal .ant-modal-title { color: #fff !important; text-align: center; font-size: 22px; font-weight: bold; background: transparent !important; }
                .dark-login-modal .ant-modal-close { color: #a6a6a6; }
                .dark-login-modal .ant-modal-close:hover { color: #fff; }
                .dark-login-modal .ant-form-item-label > label { color: #fff !important; }
            `}</style>

            {/* THANH LỌC DANH MỤC & NGÔN NGỮ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 4px 12px 4px', flex: 1 }}>
                    {filterOptions.map(filter => (
                        <div
                            key={filter.key}
                            className={`filter-pill ${activeFilter === filter.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.key)}
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
                        <img 
                            src="https://flagcdn.com/w20/vn.png" 
                            alt="Vietnam Flag" 
                            style={{ width: '18px', marginRight: '8px', borderRadius: '2px', verticalAlign: 'middle' }} 
                        /> 
                        Tiếng Việt
                    </Option>
                    <Option value="EN">
                        <img 
                            src="https://flagcdn.com/w20/gb.png" 
                            alt="UK Flag" 
                            style={{ width: '18px', marginRight: '8px', borderRadius: '2px', verticalAlign: 'middle' }} 
                        /> 
                        Tiếng Anh
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
                                                    <span key={index} className="color-dot" style={{ backgroundColor: color }}></span>
                                                ))}
                                            </Space>
                                        )}

                                        <Title level={4} style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '16px' }}>{currentTitle}</Title>

                                        <Space size={[0, 8]} wrap>
                                            <Tag color="blue" style={{ border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <GlobalOutlined />
                                                {cv.ngonNgu === 'VI' ? 'Tiếng Việt' : 'Tiếng Anh'}
                                            </Tag>
                                            {cv.tags && cv.tags.split(',').map(tag => (
                                                <Tag key={tag.trim()} color="#333" style={{ color: '#a6a6a6', border: 'none' }}>
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