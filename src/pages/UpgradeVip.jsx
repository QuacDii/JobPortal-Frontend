import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Button, Space, Divider, message, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleFilled,
    CrownFilled,
    RobotOutlined,
    FilePdfOutlined,
    UnlockOutlined,
    RocketOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';

// 1. THÊM jwtDecode để lấy ID từ Token
import { jwtDecode } from 'jwt-decode'; 
import apiClient from '../api/apiClient'; 

const { Title, Text } = Typography;

const UpgradeVip = () => {
    const navigate = useNavigate();
    const [selectedPackage, setSelectedPackage] = useState(null); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [vipPackages, setVipPackages] = useState([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);

    // Lấy danh sách gói dịch vụ từ Database
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setIsLoadingPackages(true);
                const response = await apiClient.get('/Service/packages');
                const responseData = response.data || response;
                // 2. LỌC GÓI CHO ỨNG VIÊN (Ví dụ: Các gói có soLuotXemCv == 0)
                const applicantPackages = responseData.filter(pkg => pkg.soLuotXemCv === 0);
                
                setVipPackages(applicantPackages);
                
                // Mặc định chọn gói số 2 (nếu có), không thì chọn gói đầu tiên
                if (applicantPackages && applicantPackages.length > 0) {
                    const defaultIndex = applicantPackages.length >= 2 ? 1 : 0;
                    setSelectedPackage(applicantPackages[defaultIndex].maGoi); 
                }
            } catch (error) {
                console.error("LỖI TẢI GÓI:", error);
                message.error('Không thể tải danh sách gói dịch vụ từ hệ thống');
            } finally {
                setIsLoadingPackages(false);
            }
        };
        fetchPackages();
    }, []);

    // Hàm xử lý thanh toán
    const handlePayment = async (paymentMethod) => {
        const pkg = vipPackages.find(p => p.maGoi === selectedPackage);
        if (!pkg) {
            message.warning("Vui lòng chọn một gói dịch vụ!");
            return;
        }

        setIsProcessing(true);
        message.loading({ content: `Đang kết nối cổng thanh toán ${paymentMethod}...`, key: 'payment' });

        try {
            // 3. LẤY MÃ USER THẬT TỪ TOKEN TRONG LOCALSTORAGE
            const token = localStorage.getItem('token');
            if (!token) {
                message.error("Vui lòng đăng nhập lại để thực hiện giao dịch!");
                navigate('/login'); // Đá về trang đăng nhập
                return;
            }

            const decodedToken = jwtDecode(token);
            const maUser = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
                        || decodedToken.nameid 
                        || decodedToken.sub;

            if (!maUser) {
                message.error("Không thể xác định danh tính. Vui lòng đăng nhập lại!");
                setIsProcessing(false);
                return;
            }

            // Tính toán giá thực tế: Ưu tiên giá khuyến mãi nếu có
            const giaThucTe = (pkg.giaKhuyenMai && pkg.giaKhuyenMai > 0) ? pkg.giaKhuyenMai : pkg.giaTien;

            // ĐÃ SỬA LỖI TẠI ĐÂY: Xóa bỏ /api/ ở đầu đường dẫn
            const response = await apiClient.post(`/Payment/create?maUser=${maUser}&soTien=${giaThucTe}&maGoi=${pkg.maGoi}`);
            const responseData = response.data || response;
            // Chuyển hướng người dùng sang trang thanh toán của MoMo/VNPay
            if (responseData && responseData.url) {
                window.location.href = responseData.url; 
            } else {
                throw new Error("Không nhận được URL thanh toán từ server");
            }
            
        } catch (error) {
            console.error(error);
            message.error({ content: 'Lỗi khởi tạo thanh toán. Vui lòng thử lại!', key: 'payment', duration: 2 });
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#141414', minHeight: '100vh', padding: '40px 10%', color: '#fff' }}>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <Button 
                    type="text" 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate(-1)} 
                    style={{ color: '#8c8c8c', marginBottom: '16px', padding: 0 }}
                >
                    Quay lại
                </Button>
                <div style={{ textAlign: 'center' }}>
                    <CrownFilled style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
                    <Title level={2} style={{ color: '#fff', margin: 0 }}>Nâng Cấp Tài Khoản VIP</Title>
                    <Text style={{ color: '#a6a6a6', fontSize: '16px' }}>Đầu tư cho sự nghiệp - Mở khóa toàn bộ giới hạn</Text>
                </div>
            </div>

            <Row gutter={[40, 32]} align="middle">
                {/* CỘT TRÁI: DANH SÁCH ĐẶC QUYỀN */}
                <Col xs={24} lg={11}>
                    <div style={{ paddingRight: '20px' }}>
                        <Title level={4} style={{ color: '#faad14', marginBottom: '24px' }}>Đặc quyền khi trở thành VIP</Title>
                        
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: '#242424', borderRadius: '12px', border: '1px solid #333' }}>
                                    <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: '#fff', margin: '0 0 4px 0' }}>Trợ lý AI Gemini Thông Minh</Title>
                                    <Text style={{ color: '#8c8c8c' }}>Tự động phân tích và viết mục tiêu nghề nghiệp, kinh nghiệm làm việc theo đúng ngành nghề ứng tuyển chỉ trong 3 giây.</Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: '#242424', borderRadius: '12px', border: '1px solid #333' }}>
                                    <UnlockOutlined style={{ fontSize: '24px', color: '#00b14f' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: '#fff', margin: '0 0 4px 0' }}>Tạo CV Không Giới Hạn</Title>
                                    <Text style={{ color: '#8c8c8c' }}>Phá bỏ giới hạn 5 CV của tài khoản thường. Thoải mái tạo hàng chục phiên bản CV để rải CV cho từng vị trí khác nhau.</Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: '#242424', borderRadius: '12px', border: '1px solid #333' }}>
                                    <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: '#fff', margin: '0 0 4px 0' }}>Xóa Logo (Watermark) Tải PDF</Title>
                                    <Text style={{ color: '#8c8c8c' }}>Hồ sơ PDF tải xuống sẽ sạch sẽ, chuyên nghiệp và không còn đính kèm bất kỳ ký hiệu hay logo nào của hệ thống.</Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: '#242424', borderRadius: '12px', border: '1px solid #333' }}>
                                    <RocketOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: '#fff', margin: '0 0 4px 0' }}>Ưu tiên hiển thị với NTD</Title>
                                    <Text style={{ color: '#8c8c8c' }}>Hồ sơ của bạn sẽ được đánh dấu VIP và ưu tiên đề xuất lên Top đầu khi Nhà tuyển dụng tìm kiếm ứng viên.</Text>
                                </div>
                            </div>
                        </Space>
                    </div>
                </Col>

                {/* CỘT PHẢI: BẢNG GIÁ VÀ THANH TOÁN */}
                <Col xs={24} lg={13}>
                    <Card style={{ background: '#1a1a1a', borderColor: '#333', borderRadius: '16px' }} bodyStyle={{ padding: '32px' }}>
                        <Title level={4} style={{ color: '#fff', textAlign: 'center', marginBottom: '24px' }}>Chọn gói phù hợp với bạn</Title>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            {isLoadingPackages ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <Spin size="large" />
                                    <p style={{ marginTop: '10px', color: '#8c8c8c' }}>Đang tải bảng giá...</p>
                                </div>
                            ) : vipPackages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
                                    Hiện chưa có gói dịch vụ nào cho ứng viên.
                                </div>
                            ) : (
                                vipPackages.map((pkg, index) => {
                                    const isSelected = selectedPackage === pkg.maGoi;
                                    const hasDiscount = pkg.giaKhuyenMai && pkg.giaKhuyenMai > 0;
                                    const priceToDisplay = hasDiscount ? pkg.giaKhuyenMai : pkg.giaTien;
                                    
                                    const timeLabel = `${pkg.donViThoiGian} ${pkg.loaiGoi === 1 ? 'Ngày' : pkg.loaiGoi === 2 ? 'Tháng' : 'Năm'}`;
                                    const isPopular = index === 1; 

                                    return (
                                        <div 
                                            key={pkg.maGoi}
                                            onClick={() => setSelectedPackage(pkg.maGoi)}
                                            style={{
                                                position: 'relative',
                                                padding: '16px 24px',
                                                background: isSelected ? 'rgba(250, 173, 20, 0.1)' : '#242424',
                                                border: `2px solid ${isSelected ? '#faad14' : '#333'}`,
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {isPopular && (
                                                <div style={{ position: 'absolute', top: '-12px', left: '20px', background: '#faad14', color: '#000', fontSize: '12px', fontWeight: 'bold', padding: '2px 10px', borderRadius: '10px' }}>
                                                    PHỔ BIẾN NHẤT
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isSelected ? <CheckCircleFilled style={{ color: '#faad14', fontSize: '18px' }}/> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #555' }}/>}
                                                    <Text style={{ color: isSelected ? '#faad14' : '#fff', fontSize: '16px', fontWeight: 'bold' }}>{pkg.tenGoi}</Text>
                                                </div>
                                                <Text style={{ color: '#8c8c8c', marginLeft: '26px' }}>Hạn sử dụng: {timeLabel}</Text>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {hasDiscount && (
                                                    <Text delete style={{ color: '#666', fontSize: '13px', display: 'block' }}>{pkg.giaTien.toLocaleString('vi-VN')} đ</Text>
                                                )}
                                                <Text style={{ color: isSelected ? '#faad14' : '#fff', fontSize: '20px', fontWeight: 'bold' }}>{priceToDisplay.toLocaleString('vi-VN')} đ</Text>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <Divider style={{ borderColor: '#333' }} />

                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ color: '#8c8c8c', display: 'block', marginBottom: '16px' }}><SafetyCertificateOutlined /> Giao dịch được mã hóa và bảo mật an toàn 100%</Text>
                            
                            <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                                <Button 
                                    size="large" 
                                    onClick={() => handlePayment('MOMO')}
                                    disabled={isProcessing || isLoadingPackages || vipPackages.length === 0}
                                    style={{ 
                                        backgroundColor: '#a50064', 
                                        borderColor: '#a50064', 
                                        color: '#fff', 
                                        fontWeight: 'bold', 
                                        height: '50px',
                                        minWidth: '180px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Thanh toán MoMo
                                </Button>
                                <Button 
                                    size="large" 
                                    onClick={() => handlePayment('VNPAY')}
                                    disabled={isProcessing || isLoadingPackages || vipPackages.length === 0}
                                    style={{ 
                                        backgroundColor: '#005baa', 
                                        borderColor: '#005baa', 
                                        color: '#fff', 
                                        fontWeight: 'bold', 
                                        height: '50px',
                                        minWidth: '180px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Thanh toán VNPay
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UpgradeVip;