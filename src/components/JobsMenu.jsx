import React from 'react';
import { Dropdown, Row, Col } from 'antd';
import { 
    SearchOutlined, 
    BookOutlined, 
    SendOutlined, 
    DownOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

import './css/CreateCvMenu.css'; 

const JobsMenu = ({ handleProtectedAction }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const customDropdownMenu = (
        <div className="cv-mega-menu" style={{ width: '1000px' }}> 
            <Row gutter={32}>
                
                {/* ================= CỘT 1: CHỨC NĂNG CÁ NHÂN ================= */}
                <Col span={7} className="menu-left-col">
                    <div className="menu-group">
                        <div className="menu-group-title" onClick={() => navigate('/viec-lam')}>
                            VIỆC LÀM &rarr;
                        </div>
                        <div className="menu-item" onClick={() => navigate('/viec-lam')}>
                            <SearchOutlined className="menu-icon" /> Tìm việc làm
                        </div>
                        <div className="menu-item" onClick={() => handleProtectedAction('/viec-lam-da-luu')}>
                            <BookOutlined className="menu-icon" /> Việc làm đã lưu
                        </div>
                        <div className="menu-item" onClick={() => handleProtectedAction('/viec-lam-da-ung-tuyen')}>
                            <SendOutlined className="menu-icon" /> Việc làm đã ứng tuyển
                        </div>
                    </div>
                </Col>

                {/* ================= CỘT 2: VIỆC LÀM THEO VỊ TRÍ ================= */}
                <Col span={10} className="menu-left-col">
                    <div className="menu-group">
                        <div className="menu-group-title" onClick={() => navigate('/viec-lam')}>
                            VIỆC LÀM THEO VỊ TRÍ &rarr;
                        </div>
                        
                        {/* Chia làm 2 cột nhỏ bên trong cho gọn danh sách */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Kinh doanh')}>Nhân viên kinh doanh</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Kế toán')}>Kế toán</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Marketing')}>Marketing</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Hành chính')}>Hành chính nhân sự</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=CSKH')}>Chăm sóc khách hàng</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Ngân hàng')}>Ngân hàng</div>
                            </Col>
                            <Col span={12}>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=IT')}>IT</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Lao động phổ thông')}>Lao động phổ thông</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Senior')}>Senior</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Xây dựng')}>Kỹ sư xây dựng</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Thiết kế')}>Thiết kế đồ họa</div>
                                <div className="menu-item" onClick={() => navigate('/viec-lam?keyword=Telesales')}>Telesales</div>
                            </Col>
                        </Row>
                    </div>
                </Col>

                {/* ================= CỘT 3: VIỆC LÀM THEO LĨNH VỰC ================= */}
                <Col span={7}>
                    <div className="menu-group">
                        <div className="menu-group-title" onClick={() => navigate('/viec-lam')}>
                            VIỆC LÀM THEO LĨNH VỰC &rarr;
                        </div>
                        <div className="menu-item" onClick={() => navigate('/viec-lam?nganh=Sản xuất')}>Sản xuất</div>
                        <div className="menu-item" onClick={() => navigate('/viec-lam?nganh=Bán lẻ')}>Bán lẻ - FMCG</div>
                        <div className="menu-item" onClick={() => navigate('/viec-lam?nganh=IT')}>IT - Phần mềm</div>
                        <div className="menu-item" onClick={() => navigate('/viec-lam?nganh=Xây dựng')}>Xây dựng</div>
                        <div className="menu-item" onClick={() => navigate('/viec-lam?nganh=Giáo dục')}>Giáo dục / Đào tạo</div>
                    </div>
                </Col>
                
            </Row>
        </div>
    );

    return (
        <Dropdown dropdownRender={() => customDropdownMenu} placement="bottomLeft" trigger={['hover']}>
            <div className={`topcv-nav-link ${location.pathname.startsWith('/viec-lam') ? 'active' : ''}`}>
                Việc làm <DownOutlined style={{ fontSize: '10px' }} />
            </div>
        </Dropdown>
    );
};

export default JobsMenu;