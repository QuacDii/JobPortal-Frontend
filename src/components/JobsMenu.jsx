import React, { useState, useEffect } from 'react';
import { Dropdown, Row, Col, Spin } from 'antd';
import { 
    SearchOutlined, 
    BookOutlined, 
    SendOutlined, 
    DownOutlined,
    SolutionOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './css/CreateCvMenu.css'; 

const JobsMenu = ({ handleProtectedAction }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [industries, setIndustries] = useState([]);
    const [loading, setLoading] = useState(false);

    // Lấy danh sách Ngành nghề động từ Database
    useEffect(() => {
        setLoading(true);
        apiClient.get('/MauCv/menu-data')
            .then(res => {
                const data = res?.data || res;
                if (data?.success) {
                    setIndustries(data.popularIndustries || []);
                }
            })
            .catch(err => console.error("Lỗi lấy danh mục việc làm:", err))
            .finally(() => setLoading(false));
    }, []);

    const customDropdownMenu = (
        <div className="cv-mega-menu" style={{ width: '700px' }}> 
            <Row gutter={24}>
                
                {/* CỘT 1: CHỨC NĂNG CÁ NHÂN (SPAN 9) */}
                <Col span={9} className="menu-left-col">
                    <div className="menu-group">
                        <div className="menu-group-title" onClick={() => navigate('/jobs')}>
                            VIỆC LÀM &rarr;
                        </div>
                        <div className="menu-item" onClick={() => navigate('/jobs')}>
                            <SearchOutlined className="menu-icon" /> Tìm việc làm
                        </div>
                        <div className="menu-item" onClick={() => handleProtectedAction('/viec-lam-da-luu')}>
                            <BookOutlined className="menu-icon" /> Việc làm đã lưu
                        </div>
                        <div className="menu-item" onClick={() => handleProtectedAction('/viec-lam')}>
                            <SendOutlined className="menu-icon" /> Việc làm đã ứng tuyển
                        </div>
                    </div>
                </Col>

                {/* CỘT 2: VIỆC LÀM THEO NGÀNH NGHỀ (SPAN 15) */}
                <Col span={15}>
                    <div className="menu-group">
                        <div className="menu-group-title" onClick={() => navigate('/advancedSearch')}>
                            VIỆC LÀM THEO NGÀNH NGHỀ &rarr;
                        </div>
                        
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '16px' }}>
                                <Spin size="small" tip="Đang tải danh mục..." />
                            </div>
                        ) : (
                            <Row gutter={[12, 4]}>
                                {industries.length > 0 ? (
                                    industries.map(item => (
                                        <Col span={12} key={item.id}>
                                            <div 
                                                className="menu-item" 
                                                onClick={() => navigate(`/jobs?maNganh=${item.id}&loaiNganh=cha`)}
                                            >
                                                <SolutionOutlined className="menu-icon" />
                                                <span className="menu-item-text">{item.name}</span>
                                            </div>
                                        </Col>
                                    ))
                                ) : (
                                    <>
                                        <Col span={12}>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=Kinh doanh')}>Nhân viên kinh doanh</div>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=Kế toán')}>Kế toán</div>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=Marketing')}>Marketing</div>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=Hành chính')}>Hành chính nhân sự</div>
                                        </Col>
                                        <Col span={12}>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=IT')}>IT / Phần mềm</div>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=Ngân hàng')}>Ngân hàng</div>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=Xây dựng')}>Kỹ sư xây dựng</div>
                                            <div className="menu-item" onClick={() => navigate('/advancedSearch?keyword=Telesales')}>Telesales</div>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        )}
                    </div>
                </Col>
                
            </Row>
        </div>
    );

    const isActive = location.pathname.startsWith('/advancedSearch') || 
                     location.pathname.startsWith('/appliedjob') || 
                     location.pathname.startsWith('/viec-lam');

    return (
        <Dropdown dropdownRender={() => customDropdownMenu} placement="bottomLeft" trigger={['hover']}>
            <div className={`candidate-nav-item ${isActive ? 'active' : ''}`}>
                Việc làm <DownOutlined style={{ fontSize: '10px', marginLeft: '2px' }} />
            </div>
        </Dropdown>
    );
};

export default JobsMenu;