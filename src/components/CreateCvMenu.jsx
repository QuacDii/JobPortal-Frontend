import React, { useState } from 'react';
import { Popover, Divider, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightOutlined,
    AppstoreOutlined,
    HighlightOutlined,
    StarOutlined,
    BankOutlined,
    SolutionOutlined,
    CodeOutlined,
    CalculatorOutlined,
    FundOutlined,   
    ProfileOutlined,
    CloudUploadOutlined,
    ReadOutlined,
    ContainerOutlined,
    FormOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const CreateCvMenu = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleMenuClick = (path) => {
        setOpen(false); // Đóng cái menu màu đen lại
        navigate(path); // Nhảy sang trang mới
    };

    // ==========================================
    // KHUNG GIAO DIỆN BÊN TRONG MEGA MENU
    // ==========================================
    const megaMenuContent = (
        <div style={{ display: 'flex', width: '560px', padding: '8px 0' }}>
            {/* CSS Tùy chỉnh cho Menu */}
            <style>{`
                .mega-menu-container {
                    background-color: #212121;
                }
                
                /* Hiệu ứng cho các mục thường */
                .mega-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    cursor: pointer;
                    border-radius: 4px;
                    color: #a6a6a6;
                    transition: all 0.2s ease;
                    font-size: 14px;
                }
                .mega-menu-item:hover {
                    background-color: rgba(255, 255, 255, 0.05);
                    color: #1890ff; 
                }
                .mega-menu-item:hover .anticon {
                    color: #1890ff;
                }

                /* Hiệu ứng cho các Tiêu đề có mũi tên */
                .mega-menu-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 16px;
                    cursor: pointer;
                    color: #1890ff;
                    font-weight: 600;
                    font-size: 14px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                .mega-menu-title:hover .anticon {
                    transform: translateX(4px); 
                    transition: transform 0.2s;
                }

                .mega-menu-title:hover {
                    text-decoration: underline;
                }
            `}</style>

            {/* CỘT TRÁI: CÁC MẪU CV (Trỏ về trang Thư viện CV) */}
            <div style={{ flex: 1, padding: '0 8px' }}>
                {/* Nhóm 1 */}
                <div className="mega-menu-title" onClick={() => handleMenuClick('/thu-vien-cv')}>
                    Mẫu CV theo style <ArrowRightOutlined style={{ fontSize: 12 }} />
                </div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><AppstoreOutlined style={{ fontSize: 16 }} /> Mẫu CV Đơn giản</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><HighlightOutlined style={{ fontSize: 16 }} /> Mẫu CV Ấn tượng</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><StarOutlined style={{ fontSize: 16 }} /> Mẫu CV Chuyên nghiệp</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><BankOutlined style={{ fontSize: 16 }} /> Mẫu CV Harvard</div>

                <div style={{ height: '12px' }}></div>

                {/* Nhóm 2 */}
                <div className="mega-menu-title" onClick={() => handleMenuClick('/thu-vien-cv')}>
                    Mẫu CV theo vị trí ứng tuyển <ArrowRightOutlined style={{ fontSize: 12 }} />
                </div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><SolutionOutlined style={{ fontSize: 16 }} /> Nhân viên kinh doanh</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><CodeOutlined style={{ fontSize: 16 }} /> Lập trình viên</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><CalculatorOutlined style={{ fontSize: 16 }} /> Nhân viên kế toán</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/thu-vien-cv')}><FundOutlined style={{ fontSize: 16 }} /> Chuyên viên marketing</div>
            </div>

            {/* ĐƯỜNG KẺ DỌC PHÂN CÁCH */}
            <Divider type="vertical" style={{ height: 'auto', borderColor: '#333', margin: '0' }} />

            {/* CỘT PHẢI: CÁC CÔNG CỤ QUẢN LÝ (Trỏ tạm về trang Tạo CV) */}
            <div style={{ flex: 1, padding: '0 8px' }}>
                <div style={{ height: '8px' }}></div> {/* Đẩy nhẹ xuống cho cân bằng với cột trái */}
                
                <div className="mega-menu-item" onClick={() => handleMenuClick('/tao-cv')}><ProfileOutlined style={{ fontSize: 16 }} /> Quản lý CV</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/tao-cv')}><CloudUploadOutlined style={{ fontSize: 16 }} /> Tải CV lên</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/tao-cv')}><ReadOutlined style={{ fontSize: 16 }} /> Hướng dẫn viết CV</div>
                
                <div style={{ height: '24px' }}></div>

                <div className="mega-menu-item" onClick={() => handleMenuClick('/tao-cv')}><ContainerOutlined style={{ fontSize: 16 }} /> Quản lý Cover Letter</div>
                <div className="mega-menu-item" onClick={() => handleMenuClick('/tao-cv')}><FormOutlined style={{ fontSize: 16 }} /> Mẫu Cover Letter</div>
            </div>
        </div>
    );

    return (
        <Popover
            content={megaMenuContent}
            trigger="hover"
            placement="bottomLeft"
            open={open}
            onOpenChange={setOpen}
            arrow={false} 
            overlayInnerStyle={{
                backgroundColor: '#212121',
                padding: 0,
                border: '1px solid #333',
                borderRadius: '8px',
                boxShadow: '0 6px 24px rgba(0,0,0,0.4)'
            }}
        >
            {/* Nút hiển thị trên thanh Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: open ? '#1890ff' : '#fff', 
                cursor: 'pointer',
                fontWeight: 500,
                padding: '8px 12px',
                transition: 'color 0.3s'
            }}>
                Tạo CV 
                <span style={{ 
                    fontSize: '10px', 
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s' 
                }}>▼</span> 
            </div>
        </Popover>
    );
};

export default CreateCvMenu;