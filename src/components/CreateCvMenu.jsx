import React, { useState, useEffect } from 'react';
import { Dropdown, Row, Col, Spin } from 'antd';
import { 
    DownOutlined, 
    AppstoreOutlined, 
    SolutionOutlined, 
    ProfileOutlined,
    PlusCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './css/CreateCvMenu.css';

const CreateCvMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [styles, setStyles] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        apiClient.get('/MauCv/menu-data')
            .then(res => {
                const data = res?.data || res;
                if (data?.success) {
                    setStyles(data.styles || []);
                    setIndustries(data.popularIndustries || []);
                }
            })
            .catch(err => console.error("Lỗi lấy danh mục CV Menu:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleGoToTemplates = (type, val) => {
        if (type === 'category') {
            navigate(`/thu-vien-cv?categoryId=${val}`);
        } else if (type === 'industry') {
            navigate(`/thu-vien-cv?industryId=${val}`);
        } else {
            navigate('/thu-vien-cv');
        }
    };

    const customDropdownMenu = (
        <div className="cv-mega-menu">
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" tip="Đang tải..." />
                </div>
            ) : (
                /* 🌟 ĐẢM BẢO TỔNG SPAN CỦA 3 CỘT BẰNG ĐÚNG 24 (9 + 9 + 6 = 24) */
                <Row gutter={[16, 0]}>
                    {/* CỘT 1: THEO STYLE (SPAN 9) */}
                    <Col span={9}>
                        <div className="menu-group">
                            <div className="menu-group-title" onClick={() => handleGoToTemplates()}>
                                Theo Style &rarr;
                            </div>
                            {styles.map(item => (
                                <div 
                                    key={item.id} 
                                    className="menu-item" 
                                    onClick={() => handleGoToTemplates('category', item.id)}
                                >
                                    <AppstoreOutlined className="menu-icon" />
                                    <span className="menu-item-text">
                                        {item.name.replace(/^Mẫu CV\s*/i, '')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Col>

                    {/* CỘT 2: THEO NGÀNH NGHỀ (SPAN 9) */}
                    <Col span={9}>
                        <div className="menu-group">
                            <div className="menu-group-title" onClick={() => handleGoToTemplates()}>
                                Theo Ngành nghề &rarr;
                            </div>
                            {industries.map(item => (
                                <div 
                                    key={item.id} 
                                    className="menu-item" 
                                    onClick={() => handleGoToTemplates('industry', item.id)}
                                >
                                    <SolutionOutlined className="menu-icon" />
                                    <span className="menu-item-text">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </Col>

                    {/* CỘT 3: LỐI TẮT (SPAN 6) */}
                    <Col span={6} className="menu-right-col">
                        <div className="menu-group">
                            <div className="menu-group-title">Lối tắt</div>
                            <div className="menu-item right-item" onClick={() => navigate('/manage-cv')}>
                                <ProfileOutlined className="menu-icon" />
                                <span>Quản lý CV</span>
                            </div>
                            <div className="menu-item right-item" onClick={() => navigate('/thu-vien-cv')}>
                                <PlusCircleOutlined className="menu-icon" />
                                <span>Tạo CV mới</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            )}
        </div>
    );

    const isActive = location.pathname.includes('/thu-vien-cv') || location.pathname.includes('/manage-cv');

    return (
        <Dropdown dropdownRender={() => customDropdownMenu} placement="bottomLeft" trigger={['hover']}>
            <div className={`candidate-nav-item ${isActive ? 'active' : ''}`}>
                Tạo CV <DownOutlined style={{ fontSize: '10px', marginLeft: '2px' }} />
            </div>
        </Dropdown>
    );
};

export default CreateCvMenu;