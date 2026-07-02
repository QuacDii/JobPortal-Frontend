import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Radio, Button, Space, Typography, Breadcrumb, Spin, message, Select } from 'antd';
import { ArrowLeftOutlined, EditOutlined, LoadingOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';

const { Title, Text } = Typography;
const { Option } = Select;

const TemplatePreview = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Các state cấu hình theo hình mẫu
    const [sourceOption, setSourceOption] = useState('suggested'); 
    const [languageOption, setLanguageOption] = useState('vi');   
    const [positionOption, setPositionOption] = useState(null);    
    const [positionsList, setPositionsList] = useState([]);        

    useEffect(() => {
        const fetchTemplateDetail = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/MauCv/${id}`);
                if (response.data) {
                    setTemplate(response.data);
                    if (response.data.ngonNgu) {
                        setLanguageOption(response.data.ngonNgu);
                    }
                }
            } catch (error) {
                console.error("❌ Lỗi lấy chi tiết mẫu CV:", error);
                message.error("Mẫu CV này không tồn tại hoặc hệ thống đang bảo trì!");
                navigate('/thu-vien-cv');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTemplateDetail();
        }
    }, [id, navigate]);

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await apiClient.get('/NganhNghe/danh-sach');
                setPositionsList(response.data);
                
                if (response.data && response.data.length > 0) {
                    setPositionOption(response.data[0].maNganh);
                }
            } catch (error) {
                console.error("❌ Lỗi khi tải danh sách vị trí:", error);
            }
        };

        fetchPositions();
    }, []);

    // 🔥 ĐÃ SỬA TẠI ĐÂY: Chuyển đường dẫn từ /tao-cv sang /builder để trỏ đúng vào file CvBuilder.jsx
    const handleStartBuilding = () => {
        navigate(`/builder?templateId=${id}&source=${sourceOption}&lang=${languageOption}&position=${positionOption || ''}`);
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: '#141414', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} />
                <div style={{ marginTop: '20px', color: '#a6a6a6', fontSize: '15px' }}>Đang tải cấu trúc mẫu CV...</div>
            </div>
        );
    }

    const currentTitle = template?.title || "Đang tải tên mẫu CV...";
    const currentImage = template?.image || 'https://via.placeholder.com/400x550';

    return (
        <div style={{ backgroundColor: '#141414', minHeight: '100vh', padding: '24px 40px', color: '#fff' }}>

            <Breadcrumb
                style={{ marginBottom: '20px' }}
                items={[
                    { title: <span style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => navigate('/')}>Trang chủ</span> },
                    { title: <span style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => navigate('/thu-vien-cv')}>Mẫu CV theo style</span> },
                    { title: <span style={{ color: '#fff', fontWeight: 500 }}>{currentTitle}</span> }
                ]}
            />

            <Title level={3} style={{ color: '#fff', marginBottom: '30px' }}>{currentTitle}</Title>

            <style>{`
                .custom-radio-group .ant-radio-wrapper {
                    display: flex; align-items: flex-start; width: 100%;
                    background-color: #1f1f1f; border: 1px solid #303030;
                    border-radius: 8px; padding: 16px; margin-bottom: 12px;
                    color: #fff; transition: all 0.3s; margin-inline-end: 0px !important;
                }
                .custom-radio-group .ant-radio-wrapper-checked {
                    border-color: #1890ff !important; background-color: rgba(24, 144, 255, 0.03);
                }   
                .custom-radio-group .ant-radio-checked .ant-radio-inner {
                    border-color: #1890ff !important; background-color: #1890ff !important;
                }
                .custom-radio-group .ant-radio-inner:after {
                    background-color: #fff !important;
                }
                .custom-radio-inner-text { display: flex; flex-direction: column; margin-left: 8px; width: 100%; }

                .lang-pill-badge {
                    background-color: #1890ff; color: #fff; border: 1px solid #1890ff;
                    border-radius: 20px; padding: 4px 20px; font-size: 13px; font-weight: 500;
                    display: inline-block; text-align: center;
                }

                .dark-select-input .ant-select-selector {
                    background-color: #141414 !important; border: 1px solid #303030 !important; color: #fff !important; height: 40px !important; display: flex; align-items: center;
                }
                .dark-select-dropdown {
                    background-color: #1f1f1f !important; border: 1px solid #303030;
                }
                .dark-select-dropdown .ant-select-item { color: #fff !important; }
                .dark-select-dropdown .ant-select-item-option-selected { background-color: #1890ff !important; color: #fff !important; }
                .dark-select-dropdown .ant-select-item-option-active { background-color: rgba(24, 144, 255, 0.1) !important; color: #1890ff !important; }
            `}</style>

            <Row gutter={[40, 24]}>
                <Col xs={24} md={14}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                        <img src={currentImage} alt={currentTitle} style={{ width: '100%', height: 'auto', borderRadius: '4px', display: 'block' }} />
                    </div>
                </Col>

                <Col xs={24} md={10}>
                    <div style={{ background: '#1f1f1f', borderRadius: '12px', padding: '24px', border: '1px solid #303030' }}>
                        <Title level={4} style={{ color: '#1890ff', marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>Bạn muốn tạo CV từ?</Title>

                        <Radio.Group
                            className="custom-radio-group"
                            value={sourceOption}
                            onChange={(e) => setSourceOption(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <Radio value="suggested">
                                <div className="custom-radio-inner-text">
                                    <Text strong style={{ color: '#fff', fontSize: '15px' }}>Nội dung CV mẫu JobsNow gợi ý</Text>

                                    {sourceOption === 'suggested' && (
                                        <div style={{ marginTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                                            
                                            <div style={{ marginBottom: '8px' }}><Text style={{ color: '#a6a6a6', fontSize: '13px' }}>Ngôn ngữ thiết kế</Text></div>
                                            <Space style={{ marginBottom: '16px' }}>
                                                <div className="lang-pill-badge">
                                                    {languageOption === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh (English)'}
                                                </div>
                                            </Space>

                                            <div style={{ marginBottom: '8px' }}><Text style={{ color: '#a6a6a6', fontSize: '13px' }}>Chọn vị trí gợi ý nội dung</Text></div>
                                            <Select
                                                value={positionOption}
                                                onChange={(value) => setPositionOption(value)}
                                                className="dark-select-input"
                                                popupClassName="dark-select-dropdown"
                                                style={{ width: '100%' }}
                                                loading={positionsList.length === 0}
                                            >
                                                {positionsList.map((pos) => (
                                                    <Option key={pos.maNganh} value={pos.maNganh}>
                                                        {pos.tenNganh}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </Radio>

                            <Radio value="upload-linkedin">
                                <div className="custom-radio-inner-text">
                                    <Text strong style={{ color: '#fff', fontSize: '15px' }}>Nội dung CV từ máy tính của bạn</Text>
                                </div>
                            </Radio>

                            <Radio value="scratch">
                                <div className="custom-radio-inner-text">
                                    <Text strong style={{ color: '#fff', fontSize: '15px' }}>Tạo CV từ đầu</Text>
                                    <Text type="secondary" style={{ color: '#8c8c8c', fontSize: '13px', marginTop: '4px' }}>
                                        Bắt đầu từ một khung CV trắng không có nội dung gợi ý
                                    </Text>
                                </div>
                            </Radio>
                        </Radio.Group>

                        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '20px' }}>
                            <Button
                                type="primary" size="large" block icon={<EditOutlined />}
                                onClick={handleStartBuilding}
                                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', height: '48px', fontWeight: 'bold', borderRadius: '8px', fontSize: '16px' }}
                            >
                                Tạo CV
                            </Button>
                            <Button
                                type="text" size="large" block icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/thu-vien-cv')}
                                style={{ color: '#1890ff', border: '1px solid #303030', height: '48px', borderRadius: '8px', backgroundColor: 'transparent' }}
                            >
                                Quay lại danh sách mẫu CV
                            </Button>
                        </Space>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default TemplatePreview;