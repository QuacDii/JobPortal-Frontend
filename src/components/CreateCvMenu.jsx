import React from 'react';
import { Dropdown, Row, Col, Space } from 'antd';
import { DownOutlined, AppstoreOutlined, StarOutlined, CrownOutlined, BankOutlined, SolutionOutlined, CodeOutlined, CalculatorOutlined, LineChartOutlined, ProfileOutlined, UploadOutlined, ReadOutlined, FileDoneOutlined, FormOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const CreateCvMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Điều hướng chung cho các nút chọn mẫu CV
    const handleGoToTemplates = () => {
        navigate('/thu-vien-cv');
    };

    // Giao diện tùy chỉnh của Menu thả xuống (Mô phỏng 100% cấu trúc TopCV)
    const customDropdownMenu = (
        <div className="cv-mega-menu">
            <Row gutter={32}>
                {/* ================= CỘT TRÁI ================= */}
                <Col span={14} className="menu-left-col">
                    {/* Nhóm 1: Mẫu CV theo style */}
                    <div className="menu-group">
                        <div className="menu-group-title" onClick={handleGoToTemplates}>
                            Mẫu CV theo style &rarr;
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
                            <AppstoreOutlined className="menu-icon" /> Mẫu CV Đơn giản
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
                            <StarOutlined className="menu-icon" /> Mẫu CV Ấn tượng
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
                            <CrownOutlined className="menu-icon" /> Mẫu CV Chuyên nghiệp
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
                            <BankOutlined className="menu-icon" /> Mẫu CV Harvard
                        </div>
                    </div>

                    {/* Nhóm 2: Mẫu CV theo vị trí */}
                    <div className="menu-group" style={{ marginTop: '20px' }}>
                        <div className="menu-group-title" onClick={handleGoToTemplates}>
                            Mẫu CV theo vị trí ứng tuyển &rarr;
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
                            <SolutionOutlined className="menu-icon" /> Nhân viên kinh doanh
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
                            <CodeOutlined className="menu-icon" /> Lập trình viên
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
                            <CalculatorOutlined className="menu-icon" /> Nhân viên kế toán
                        </div>
                        <div className="menu-item" onClick={handleGoToTemplates}>
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
                        <div className="menu-item right-item" onClick={() => navigate('/thu-vien-cv')}>
                            <ReadOutlined className="menu-icon" /> Hướng dẫn viết CV
                        </div>
                        
                        <div style={{ height: '1px', backgroundColor: '#333', margin: '16px 0' }}></div>
                        
                        <div className="menu-item right-item">
                            <FileDoneOutlined className="menu-icon" /> Quản lý Cover Letter
                        </div>
                        <div className="menu-item right-item">
                            <FormOutlined className="menu-icon" /> Mẫu Cover Letter
                        </div>
                    </div>
                </Col>
            </Row>

            {/* CSS Tùy chỉnh trực tiếp cho Menu */}
            <style>{`
                .cv-mega-menu {
                    background-color: #1f1f1f;
                    border-radius: 8px;
                    padding: 24px;
                    width: 500px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    border: 1px solid #333;
                }
                .menu-group-title {
                    color: #1890ff; /* Màu xanh dương chủ đạo thay vì xanh lá của TopCV */
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .menu-group-title:hover {
                    color: #40a9ff;
                    text-decoration: underline;
                }
                .menu-item {
                    color: #d9d9d9;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                    transition: all 0.2s;
                    margin-bottom: 4px;
                }
                .menu-item:hover {
                    background-color: rgba(24, 144, 255, 0.1);
                    color: #1890ff;
                }
                .menu-icon {
                    margin-right: 12px;
                    font-size: 16px;
                    opacity: 0.8;
                }
                .menu-left-col {
                    border-right: 1px solid #333;
                }
                .right-item {
                    padding: 10px 12px;
                }
            `}</style>
        </div>
    );

    // Xác định trạng thái active nếu đang ở các trang liên quan đến CV
    const isActive = location.pathname.includes('/thu-vien-cv') || location.pathname.includes('/manage-cv');

    return (
        <Dropdown dropdownRender={() => customDropdownMenu} placement="bottomLeft" trigger={['hover']}>
            <div className={`nav-item ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FormOutlined /> Tạo CV <DownOutlined style={{ fontSize: '10px', marginTop: '2px' }} />
            </div>
        </Dropdown>
    );
};

export default CreateCvMenu;