import React from 'react';
import { Dropdown, Row, Col } from 'antd';
import { 
    DownOutlined, 
    AppstoreOutlined, 
    StarOutlined, 
    CrownOutlined, 
    BankOutlined, 
    SolutionOutlined, 
    CodeOutlined, 
    CalculatorOutlined, 
    LineChartOutlined, 
    ProfileOutlined, 
    UploadOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './css/CreateCvMenu.css';

const CreateCvMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoToTemplates = (category = '') => {
        if (category) {
            navigate(`/thu-vien-cv?category=${encodeURIComponent(category)}`);
        } else {
            navigate('/thu-vien-cv');
        }
    };

    const customDropdownMenu = (
        <div className="cv-mega-menu">
            <Row gutter={32}>
                {/* ================= CỘT TRÁI ================= */}
                <Col span={14} className="menu-left-col">
                    {/* Nhóm 1: Mẫu CV theo style */}
                    <div className="menu-group">
                        <div className="menu-group-title" onClick={() => handleGoToTemplates()}>
                            Mẫu CV theo style &rarr;
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Đơn giản')}>
                            <AppstoreOutlined className="menu-icon" /> Mẫu CV Đơn giản
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Ấn tượng')}>
                            <StarOutlined className="menu-icon" /> Mẫu CV Ấn tượng
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Chuyên nghiệp')}>
                            <CrownOutlined className="menu-icon" /> Mẫu CV Chuyên nghiệp
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Harvard')}>
                            <BankOutlined className="menu-icon" /> Mẫu CV Harvard
                        </div>
                    </div>

                    {/* Nhóm 2: Mẫu CV theo vị trí */}
                    <div className="menu-group" style={{ marginTop: '20px' }}>
                        <div className="menu-group-title" onClick={() => handleGoToTemplates()}>
                            Mẫu CV theo vị trí ứng tuyển &rarr;
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Nhân viên kinh doanh')}>
                            <SolutionOutlined className="menu-icon" /> Nhân viên kinh doanh
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Lập trình viên')}>
                            <CodeOutlined className="menu-icon" /> Lập trình viên
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Nhân viên kế toán')}>
                            <CalculatorOutlined className="menu-icon" /> Nhân viên kế toán
                        </div>
                        <div className="menu-item" onClick={() => handleGoToTemplates('Chuyên viên marketing')}>
                            <LineChartOutlined className="menu-icon" /> Chuyên viên marketing
                        </div>
                    </div>
                </Col>

                {/* ================= CỘT PHẢI ================= */}
                <Col span={10} className="menu-right-col">
                    <div className="menu-group">
                        <div className="menu-item right-item" onClick={() => navigate('/manage-cv')}>
                            <ProfileOutlined className="menu-icon" /> Quản lý CV
                        </div>
                        <div className="menu-item right-item" onClick={() => navigate('/manage-cv')}>
                            <UploadOutlined className="menu-icon" /> Tải CV lên
                        </div>
                        <div style={{ height: '1px', backgroundColor: '#333', margin: '16px 0' }}></div>
                    </div>
                </Col>
            </Row>
        </div>
    );

    const isActive = location.pathname.includes('/thu-vien-cv') || location.pathname.includes('/manage-cv');

    return (
        <Dropdown dropdownRender={() => customDropdownMenu} placement="bottomLeft" trigger={['hover']}>
            <div className={`topcv-nav-link ${isActive ? 'active' : ''}`}>
                Tạo CV <DownOutlined style={{ fontSize: '10px' }} />
            </div>
        </Dropdown>
    );
};

export default CreateCvMenu;