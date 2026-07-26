import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './css/TemplatePreview.css';
import { UploadOutlined, ArrowLeftOutlined, EditOutlined, LoadingOutlined } from '@ant-design/icons';
import { Row, Col, Radio, Button, Space, Typography, Breadcrumb, Spin, message, Select, Upload } from 'antd';

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

                const result = response.data !== undefined ? response.data : response;

                if (result) {
                    setTemplate(result);
                    if (result.ngonNgu) {
                        setLanguageOption(result.ngonNgu);
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

                const result = response.data !== undefined ? response.data : response;

                setPositionsList(result || []);

                if (result && result.length > 0) {
                    setPositionOption(result[0].maNganh);
                }
            } catch (error) {
                console.error("❌ Lỗi khi tải danh sách vị trí:", error);
            }
        };

        fetchPositions();

        fetchPositions();
    }, []);

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
                            {/* TÙY CHỌN 1: MẪU GỢI Ý */}
                            <Radio value="suggested">
                                <div className="custom-radio-inner-text">
                                    <Text strong style={{ color: '#fff', fontSize: '15px' }}>Nội dung CV mẫu JobsNow gợi ý</Text>

                                    {sourceOption === 'suggested' && (
                                        <div style={{ marginTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ marginBottom: '8px' }}>
                                                <Text style={{ color: '#a6a6a6', fontSize: '13px' }}>Ngôn ngữ thiết kế</Text>
                                            </div>
                                            <Space style={{ marginBottom: '16px' }} wrap>
                                                {/* 👉 NÚT TIẾNG VIỆT */}
                                                <div
                                                    className="lang-pill-badge"
                                                    style={{
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease-in-out',
                                                        backgroundColor: languageOption === 'vi' ? '#1890ff' : 'transparent',
                                                        borderColor: languageOption === 'vi' ? '#1890ff' : '#333',
                                                        color: languageOption === 'vi' ? '#fff' : '#a6a6a6'
                                                    }}
                                                    onClick={() => setLanguageOption('vi')}
                                                >
                                                    Tiếng Việt
                                                </div>

                                                {/* 👉 NÚT TIẾNG ANH */}
                                                <div
                                                    className="lang-pill-badge"
                                                    style={{
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease-in-out',
                                                        backgroundColor: languageOption === 'en' ? '#1890ff' : 'transparent',
                                                        borderColor: languageOption === 'en' ? '#1890ff' : '#333',
                                                        color: languageOption === 'en' ? '#fff' : '#a6a6a6'
                                                    }}
                                                    onClick={() => setLanguageOption('en')}
                                                >
                                                    Tiếng Anh (English)
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

                            {/* TÙY CHỌN 2: TẢI FILE LÊN */}
                            <Radio value="upload-linkedin">
                                <div className="custom-radio-inner-text">
                                    <Text strong style={{ color: '#fff', fontSize: '15px' }}>Nội dung CV từ máy tính của bạn</Text>

                                    {/* 👉 Bổ sung nút Upload khi người dùng chọn mục này */}
                                    {sourceOption === 'upload-linkedin' && (
                                        <div style={{ marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
                                            <Upload accept=".pdf,.doc,.docx" maxCount={1} beforeUpload={() => false}>
                                                <Button icon={<UploadOutlined />} style={{ backgroundColor: '#242424', color: '#fff', borderColor: '#333' }}>
                                                    Tải file CV lên (PDF, DOCX)
                                                </Button>
                                            </Upload>
                                        </div>
                                    )}
                                </div>
                            </Radio>

                            {/* TÙY CHỌN 3: TẠO TỪ ĐẦU */}
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