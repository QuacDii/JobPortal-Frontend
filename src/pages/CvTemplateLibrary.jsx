import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Typography, Space, Select, Tag, Spin } from 'antd';
import {
    AppstoreOutlined,
    StarOutlined,
    FireOutlined,
    RocketOutlined,
    BankOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    LoadingOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// Danh sách các bộ lọc hiển thị trên thanh ngang (Menu tĩnh)
const filterOptions = [
    { key: 'Tất cả', icon: <AppstoreOutlined /> },
    { key: 'Đơn giản', icon: <CheckCircleIcon color="#00b14f" /> }, 
    { key: 'Chuyên nghiệp', icon: <StarOutlined /> },
    { key: 'Hiện đại', icon: <FireOutlined /> },
    { key: 'Ấn tượng', icon: <RocketOutlined /> },
    { key: 'Harvard', icon: <BankOutlined /> },
    { key: 'ATS', icon: <SafetyCertificateOutlined /> }
];


function CheckCircleIcon({ color }) {
    return (
        <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill={color} aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"></path>
        </svg>
    );
}

const CvTemplateLibrary = () => {
    // STATE QUẢN LÝ DỮ LIỆU
    const [cvTemplates, setCvTemplates] = useState([]);
    const [activeFilter, setActiveFilter] = useState('Đơn giản');
    const [loading, setLoading] = useState(true);

    // GỌI API KHI COMPONENT VỪA RENDER
    useEffect(() => {
        const apiUrl = 'https://localhost:5279/api/MauCv'; 

        axios.get(apiUrl)
            .then(response => {
                setCvTemplates(response);
                setLoading(false);
            })
            .catch(error => {
                console.error("Lỗi khi tải mẫu CV từ Backend:", error);
                setLoading(false);
            });
    }, []);

    // HÀM LỌC: Nếu là "Tất cả" thì lấy mảng gốc, không thì dùng .filter() kiểm tra categories
    const filteredCVs = activeFilter === 'Tất cả' 
        ? cvTemplates 
        : cvTemplates.filter(cv => cv.categories && cv.categories.includes(activeFilter));

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '40px' }}>
            
            {/* CSS Tùy chỉnh cho Giao diện Dark Mode */}
            <style>{`
                .filter-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background-color: transparent;
                    color: #a6a6a6;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 500;
                }
                .filter-pill:hover {
                    background-color: rgba(255,255,255,0.1);
                    color: #fff;
                }
                .filter-pill.active {
                    background-color: #BBBBBB; /* Màu Xanh lá Active */
                    color: #fff;
                }

                .cv-card {
                    background-color: #242424 !important;
                    border: none !important;
                    border-radius: 8px !important;
                    overflow: hidden;
                    transition: transform 0.3s ease;
                }
                .cv-card:hover {
                    transform: translateY(-5px);
                }
                .cv-card .ant-card-body {
                    padding: 16px !important;
                }
                
                .color-dot {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    display: inline-block;
                    cursor: pointer;
                    border: 2px solid transparent;
                }
                .color-dot:hover {
                    border-color: #fff;
                }
            `}</style>

            {/* ==========================================
                THANH BỘ LỌC (FILTER BAR)
            ========================================== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                
                {/* Các nút lọc danh mục */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {filterOptions.map(filter => (
                        <div 
                            key={filter.key} 
                            className={`filter-pill ${activeFilter === filter.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.key)}
                        >
                            {/* Ẩn cái icon đi nếu nó đang được active (giống chuẩn TopCV) */}
                            {filter.key === 'Đơn giản' && activeFilter === 'Đơn giản' ? null : filter.icon}
                            {filter.key}
                        </div>
                    ))}
                </div>

                {/* Dropdown chọn ngôn ngữ */}
                <Select defaultValue="vi" style={{ width: 130 }} dropdownStyle={{ backgroundColor: '#242424', color: '#fff' }}>
                    <Option value="vi"><GlobalOutlined style={{ color: '#faad14' }}/> Tiếng Việt</Option>
                    <Option value="en"><GlobalOutlined style={{ color: '#1890ff' }}/> Tiếng Anh</Option>
                </Select>
            </div>

            {/* ==========================================
                HIỂN THỊ DỮ LIỆU
            ========================================== */}
            {loading ? (
                // Màn hình Loading khi API chưa trả về
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#00b14f' }} spin />} />
                    <div style={{ marginTop: '16px', color: '#a6a6a6' }}>Đang tải danh sách CV...</div>
                </div>
            ) : (
                <>
                    <Row gutter={[24, 24]}>
                        {filteredCVs.map(cv => (
                            <Col xs={24} sm={12} md={8} lg={6} key={cv.id}>
                                <Card 
                                    className="cv-card"
                                    cover={
                                        <div style={{ padding: '16px', backgroundColor: '#333' }}>
                                            <img alt={cv.title} src={cv.image} style={{ width: '100%', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
                                        </div>
                                    }
                                >
                                    {/* Hiển thị danh sách màu */}
                                    <Space size={8} style={{ marginBottom: '12px' }}>
                                        {cv.colors && cv.colors.map((color, index) => (
                                            <span key={index} className="color-dot" style={{ backgroundColor: color }}></span>
                                        ))}
                                    </Space>
                                    
                                    <Title level={4} style={{ color: '#fff', margin: '0 0 8px 0' }}>{cv.title}</Title>
                                    
                                    {/* Hiển thị các tag ATS & Categories */}
                                    <Space size={[0, 8]} wrap>
                                        {cv.isATS && <Tag color="#333" style={{ color: '#a6a6a6', border: 'none' }}>ATS</Tag>}
                                        {cv.categories && cv.categories.map(cat => (
                                            <Tag key={cat} color="#333" style={{ color: '#a6a6a6', border: 'none' }}>{cat}</Tag>
                                        ))}
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Hiển thị thông báo nếu lọc không ra kết quả */}
                    {filteredCVs.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#a6a6a6', marginTop: '50px', fontSize: '16px' }}>
                            Chưa có mẫu CV nào cho danh mục này.
                        </div>
                    )}
                </>
            )}

        </div>
    );
};

export default CvTemplateLibrary;