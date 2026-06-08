import React, { useState, useEffect } from 'react';
import { Statistic, Row, Col, Card, Button, Divider, Alert, Space, Typography } from 'antd';
import { FileTextOutlined, UserOutlined, EyeOutlined, WalletOutlined, ShoppingCartOutlined, CrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import servicePackage from '../../services/servicePackage';

const { Text } = Typography;

const EmployerDashboard = () => {
    const navigate = useNavigate();
    const [accountInfo, setAccountInfo] = useState({
        ngayHetHanGoi: null,
        luotXemCvConLai: 0
    });

    // Gọi API lấy thông tin tài khoản khi load trang
    useEffect(() => {
        const fetchAccountInfo = async () => {
            try {
                const res = await servicePackage.getBalance();
                setAccountInfo({
                    ngayHetHanGoi: res.ngayHetHanGoi,
                    luotXemCvConLai: res.luotXemCvConLai || 0
                });
            } catch (error) {
                console.error("Lỗi tải thông tin tài khoản:", error);
            }
        };
        fetchAccountInfo();
    }, []);

    // Tính toán số ngày còn lại
    const calculateRemainingDays = () => {
        if (!accountInfo.ngayHetHanGoi) return null;
        const expireDate = new Date(accountInfo.ngayHetHanGoi);
        const today = new Date();
        const diffTime = expireDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const remainingDays = calculateRemainingDays();

    return (
        <div style={{ padding: '24px' }}>
            <h2>📊 Báo cáo phân tích tuyển dụng</h2>

            {/* THÔNG BÁO TÌNH TRẠNG GÓI VIP */}
            {remainingDays !== null ? (
                remainingDays > 7 ? (
                    // CÒN NHIỀU HẠN: Hiện màu xanh an toàn
                    <Alert 
                        message={<span style={{ fontWeight: 'bold' }}><CrownOutlined style={{ color: '#faad14' }} /> Tài khoản VIP / Pro</span>} 
                        description={`Gói dịch vụ của bạn còn hiệu lực ${remainingDays} ngày (Hết hạn vào ${new Date(accountInfo.ngayHetHanGoi).toLocaleDateString('vi-VN')}).`} 
                        type="success" showIcon style={{ marginBottom: 20 }}
                    />
                ) : remainingDays > 0 ? (
                    // SẮP HẾT HẠN (Dưới 7 ngày): Báo động màu vàng thúc giục
                    <Alert 
                        message={<span style={{ fontWeight: 'bold', color: '#d46b08' }}>⏰ Gói dịch vụ sắp hết hạn!</span>} 
                        description={`Tài khoản của bạn chỉ còn ${remainingDays} ngày (Hết hạn vào ${new Date(accountInfo.ngayHetHanGoi).toLocaleDateString('vi-VN')}). Hãy gia hạn ngay để không bị gián đoạn quyền lợi xem hồ sơ ứng viên.`} 
                        type="warning" showIcon 
                        action={<Button size="small" type="primary" danger onClick={() => navigate('/employer/service-package')}>Gia hạn ngay</Button>}
                        style={{ marginBottom: 20, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
                    />
                ) : (
                    // ĐÃ HẾT HẠN: Báo động đỏ
                    <Alert 
                        message={<span style={{ fontWeight: 'bold' }}>Gói dịch vụ đã hết hạn!</span>} 
                        description="Vui lòng gia hạn gói dịch vụ để tiếp tục sử dụng các tính năng cao cấp." 
                        type="error" showIcon 
                        action={<Button size="small" type="primary" danger onClick={() => navigate('/employer/service-package')}>Gia hạn ngay</Button>}
                        style={{ marginBottom: 20 }}
                    />
                )
            ) : (
                // TÀI KHOẢN MIỄN PHÍ TỪ ĐẦU
                <Alert 
                    message="Bạn đang sử dụng tài khoản Miễn phí" 
                    description="Nâng cấp gói dịch vụ để đăng tin nổi bật và chủ động xem liên hệ của ứng viên." 
                    type="info" showIcon 
                    action={<Button size="small" type="primary" onClick={() => navigate('/employer/service-package')}>Xem bảng giá</Button>}
                    style={{ marginBottom: 20 }}
                />
            )}
            
            <Row gutter={16}>
                <Col span={8}>
                    <Card hoverable>
                        <Statistic title="Tin đang đăng" value={4} prefix={<FileTextOutlined />} styles={{ content: { color: '#3f8600' } }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card hoverable>
                        <Statistic title="Hồ sơ ứng tuyển mới" value={12} prefix={<UserOutlined />} styles={{ content: { color: '#1890ff' } }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card hoverable>
                        <Statistic 
                            title="Lượt xem CV còn lại" 
                            value={accountInfo.luotXemCvConLai} // Hiển thị số liệu thật từ DB
                            prefix={<EyeOutlined />} 
                            styles={{ content: { color: '#cf1322' } }} 
                        />
                    </Card>
                </Col>
            </Row>

            <Divider titlePlacement="left">Thao tác nhanh (Tài chính)</Divider>

            <Row gutter={16}>
                <Col>
                    <Button type="primary" size="large" icon={<WalletOutlined />} onClick={() => navigate('/employer/wallet')} style={{ backgroundColor: '#D82D8B', borderColor: '#D82D8B' }}>
                        Nạp tiền vào Ví MoMo
                    </Button>
                </Col>
                <Col>
                    <Button type="default" size="large" icon={<ShoppingCartOutlined />} onClick={() => navigate('/employer/service-package')} style={{ color: '#0056b3', borderColor: '#0056b3' }}>
                        Bảng giá & Mua gói dịch vụ
                    </Button>
                </Col>
            </Row>
        </div>
    );
};

export default EmployerDashboard;