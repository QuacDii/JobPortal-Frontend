import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Button, Space, Divider, message, Spin, Modal, Tag, Badge } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleFilled,
    CheckCircleOutlined,
    CrownFilled,
    RobotOutlined,
    FilePdfOutlined,
    UnlockOutlined,
    RocketOutlined,
    SafetyCertificateOutlined,
    FireOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/apiClient';

const { Title, Text } = Typography;

const UpgradeVip = () => {
    const navigate = useNavigate();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [vipPackages, setVipPackages] = useState([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);

    // STATE QUẢN LÝ POPUP MOMO FALLBACK
    const [isMomoModalVisible, setIsMomoModalVisible] = useState(false);
    const [momoPayUrl, setMomoPayUrl] = useState('');
    const [isConfirmingFallback, setIsConfirmingFallback] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    const [currentOrderData, setCurrentOrderData] = useState({
        maUser: null,
        soTien: 0,
        maGoi: null,
        orderId: ''
    });

    const [userBalanceInfo, setUserBalanceInfo] = useState({
        tenGoiHienTai: 'Miễn phí',
        ngayHetHanGoi: null,
        ngayMua: null,
        soDuVi: 0,
        danhSachGoiDaMua: []
    });

    // HÀM LẤY BẢNG GIÁ VÀ THÔNG TIN HẠN SỬ DỤNG
    const fetchData = async () => {
        try {
            setIsLoadingPackages(true);

            const [pkgRes, balRes] = await Promise.all([
                apiClient.get('/Service/candidate-packages'),
                apiClient.get('/Service/balance').catch(() => null)
            ]);

            const pkgData = pkgRes?.data !== undefined ? pkgRes.data : pkgRes;
            const applicantPackages = Array.isArray(pkgData) ? pkgData : [];
            setVipPackages(applicantPackages);

            if (applicantPackages.length > 0) {
                const defaultIndex = applicantPackages.length >= 2 ? 1 : 0;
                setSelectedPackage(applicantPackages[defaultIndex].maGoi);
            }

            if (balRes) {
                const balData = balRes.data !== undefined ? balRes.data : balRes;
                setUserBalanceInfo({
                    tenGoiHienTai: balData?.tenGoiHienTai || 'Miễn phí',
                    ngayHetHanGoi: balData?.ngayHetHanGoi || null,
                    ngayMua: balData?.ngayMua || null,
                    soDuVi: Number(balData?.soDuVi) || 0,
                    danhSachGoiDaMua: balData?.danhSachGoiDaMua || []
                });
            }
        } catch (error) {
            console.error("LỖI TẢI DỮ LIỆU:", error);
        } finally {
            setIsLoadingPackages(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // HÀM XỬ LÝ THANH TOÁN
    const handlePayment = async (paymentMethod, pkgIdOverride = null) => {
        const targetPackageId = pkgIdOverride || selectedPackage;
        const pkg = vipPackages.find(p => p.maGoi === targetPackageId);

        if (!pkg) {
            message.warning("Vui lòng chọn một gói dịch vụ!");
            return;
        }

        setIsProcessing(true);
        message.loading({ content: `Đang kết nối cổng thanh toán ${paymentMethod}...`, key: 'payment' });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                message.error("Vui lòng đăng nhập lại để thực hiện giao dịch!");
                navigate('/login');
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

            const giaThucTe = (pkg.giaKhuyenMai && pkg.giaKhuyenMai > 0) ? pkg.giaKhuyenMai : pkg.giaTien;

            if (paymentMethod === 'VNPAY') {
                const response = await apiClient.post('/Payment/create-vnpay-url', {
                    maUser: parseInt(maUser),
                    soTien: giaThucTe,
                    maGoi: pkg.maGoi
                });
                const responseData = response.data || response;

                if (responseData && responseData.paymentUrl) {
                    message.success({ content: 'Đang chuyển hướng đến VNPay...', key: 'payment', duration: 2 });
                    window.location.href = responseData.paymentUrl;
                } else {
                    throw new Error("Không nhận được URL thanh toán VNPay từ server");
                }
            } else if (paymentMethod === 'MOMO') {
                const response = await apiClient.post(`/Payment/create?maUser=${maUser}&soTien=${giaThucTe}&maGoi=${pkg.maGoi}`);
                const responseData = response.data || response;

                if (responseData && responseData.url) {
                    let orderId = new Date().getTime().toString();
                    try {
                        const urlObj = new URL(responseData.url);
                        if (urlObj.searchParams.get('orderId')) {
                            orderId = urlObj.searchParams.get('orderId');
                        }
                    } catch (e) { }

                    setCurrentOrderData({ maUser, soTien: giaThucTe, maGoi: pkg.maGoi, orderId });
                    setMomoPayUrl(responseData.url);

                    message.success({ content: 'Khởi tạo MoMo thành công!', key: 'payment', duration: 2 });
                    setIsMomoModalVisible(true);
                    setIsPolling(true);
                } else {
                    throw new Error("Không nhận được URL thanh toán MoMo từ server");
                }
            }
        } catch (error) {
            console.error(error);
            message.error({ content: 'Lỗi khởi tạo thanh toán. Vui lòng thử lại!', key: 'payment', duration: 2 });
        } finally {
            setIsProcessing(false);
        }
    };

    // HÀM XÁC NHẬN FALLBACK THỦ CÔNG & KÍCH HOẠT VIP TỨC THÌ
    const handleConfirmFallback = async () => {
        setIsConfirmingFallback(true);
        try {
            const fallbackRequestData = {
                MaUser: currentOrderData.maUser,
                Amount: currentOrderData.soTien,
                OrderId: String(currentOrderData.orderId),
                ResultCode: "0",
                MaGoi: currentOrderData.maGoi
            };

            await apiClient.post('/Payment/confirm-fallback', fallbackRequestData);

            window.dispatchEvent(new Event('update_vip_status'));
            message.success("Xác nhận giao dịch thành công!");
            setIsMomoModalVisible(false);
            window.location.href = `/payment-success?orderId=${currentOrderData.orderId}`;
        } catch (error) {
            console.error("Fallback Error:", error);
            message.error("Lỗi khi xác nhận giao dịch dự phòng!");
        } finally {
            setIsConfirmingFallback(false);
        }
    };

    const handleConfirmFailed = () => {
        setIsMomoModalVisible(false);
        setIsPolling(false);
        navigate(`/payment-failed?orderId=${currentOrderData.orderId}`);
    };

    const isVipActive = userBalanceInfo.ngayHetHanGoi && new Date(userBalanceInfo.ngayHetHanGoi) > new Date();

    const themeColors = {
        bgColor: '#f4f5f5',
        textColor: '#333333',
        subTextColor: '#595959',
        cardBg: '#ffffff',
        cardBorder: '#e8e8e8',
        iconBg: '#e6f7ff',
        dividerColor: '#f0f0f0',
        vipCardBg: 'linear-gradient(135deg, #ffffff 0%, #fffbe6 100%)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
    };

    return (
        <div style={{ backgroundColor: themeColors.bgColor, minHeight: '100vh', padding: '40px 8%', color: themeColors.textColor, transition: 'all 0.3s ease' }}>
            {/* Header Nút quay lại */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '16px' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ color: themeColors.subTextColor, padding: 0, fontWeight: '500' }}
                >
                    Quay lại
                </Button>
            </div>

            {/* TIÊU ĐỀ TRANG */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <CrownFilled style={{ fontSize: '48px', color: '#faad14', marginBottom: '12px' }} />
                <Title level={2} style={{ color: themeColors.textColor, margin: 0, fontWeight: '700', fontSize: '32px' }}>Nâng Cấp Tài Khoản VIP</Title>
                <Text style={{ color: themeColors.subTextColor, fontSize: '15px', display: 'block', marginTop: '8px' }}>Đầu tư cho sự nghiệp - Mở khóa toàn bộ giới hạn</Text>
            </div>

            {/* KHỐI TRẠNG THÁI GÓI HIỆN TẠI & HẠN SỬ DỤNG */}
            <Row justify="center" style={{ marginBottom: '40px' }}>
                <Col xs={24} md={18} lg={16}>
                    <Card
                        style={{
                            background: themeColors.vipCardBg,
                            borderColor: isVipActive ? '#faad14' : themeColors.cardBorder,
                            borderRadius: '16px',
                            boxShadow: themeColors.boxShadow
                        }}
                        styles={{ body: { padding: '20px 28px' } }}
                    >
                        <Row align="middle" justify="space-between" gutter={[16, 16]}>
                            <Col xs={24} sm={14}>
                                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                    <Text style={{ color: themeColors.subTextColor, fontSize: '13px', fontWeight: 600 }}>TRẠNG THÁI HIỆN TẠI</Text>
                                    {userBalanceInfo.danhSachGoiDaMua.length > 0 ? (
                                        <Space wrap size={[6, 6]}>
                                            {userBalanceInfo.danhSachGoiDaMua.map((item, index) => (
                                                <Tag key={index} color="gold" style={{ fontWeight: 'bold', fontSize: '13px', padding: '4px 10px', borderRadius: '6px' }}>
                                                    ✓ {item.tenGoi}
                                                </Tag>
                                            ))}
                                        </Space>
                                    ) : (
                                        <Title level={4} style={{ color: themeColors.textColor, margin: 0, fontWeight: '700' }}>
                                            {userBalanceInfo.tenGoiHienTai}
                                        </Title>
                                    )}
                                </Space>
                            </Col>

                            <Col xs={24} sm={10}>
                                {isVipActive ? (
                                    <Space direction="vertical" size={2} style={{ textAlign: 'right', width: '100%' }}>
                                        <Text style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                            <ClockCircleOutlined /> Tổng hạn VIP: {new Date(userBalanceInfo.ngayHetHanGoi).toLocaleDateString('vi-VN')}
                                        </Text>
                                        <Text style={{ color: '#52c41a', fontSize: '12.5px', fontWeight: '500' }}>
                                            (Đã cộng dồn thời gian của các gói)
                                        </Text>
                                    </Space>
                                ) : (
                                    <Tag color="default" style={{ background: '#f0f0f0', color: themeColors.subTextColor, padding: '6px 12px', borderRadius: '8px', fontWeight: '500' }}>
                                        Chưa đăng ký VIP
                                    </Tag>
                                )}
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[40, 32]}>
                {/* CỘT TRÁI: GIỚI THIỆU ĐẶC QUYỀN TĨNH */}
                <Col xs={24} lg={10}>
                    <div style={{ paddingRight: '20px' }}>
                        <Title level={4} style={{ color: '#1890ff', marginBottom: '24px', fontWeight: '700' }}>Đặc quyền khi trở thành VIP</Title>

                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: themeColors.iconBg, borderRadius: '12px', border: `1px solid ${themeColors.cardBorder}` }}>
                                    <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: themeColors.textColor, margin: '0 0 4px 0', fontWeight: '700' }}>Trợ lý AI Gemini Thông Minh</Title>
                                    <Text style={{ color: themeColors.subTextColor, lineHeight: '1.5' }}>Tự động phân tích và viết mục tiêu nghề nghiệp, kinh nghiệm làm việc theo đúng ngành nghề ứng tuyển chỉ trong 3 giây.</Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: themeColors.iconBg, borderRadius: '12px', border: `1px solid ${themeColors.cardBorder}` }}>
                                    <UnlockOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: themeColors.textColor, margin: '0 0 4px 0', fontWeight: '700' }}>Tạo CV Không Giới Hạn</Title>
                                    <Text style={{ color: themeColors.subTextColor, lineHeight: '1.5' }}>Phá bỏ giới hạn 5 CV của tài khoản thường. Thoải mái tạo hàng chục phiên bản CV để rải CV cho từng vị trí khác nhau.</Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: themeColors.iconBg, borderRadius: '12px', border: `1px solid ${themeColors.cardBorder}` }}>
                                    <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: themeColors.textColor, margin: '0 0 4px 0', fontWeight: '700' }}>Xóa Logo (Watermark) Tải PDF</Title>
                                    <Text style={{ color: themeColors.subTextColor, lineHeight: '1.5' }}>Hồ sơ PDF tải xuống sẽ sạch sẽ, chuyên nghiệp và không còn đính kèm bất kỳ ký hiệu hay logo nào của hệ thống.</Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ padding: '12px', background: themeColors.iconBg, borderRadius: '12px', border: `1px solid ${themeColors.cardBorder}` }}>
                                    <RocketOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: themeColors.textColor, margin: '0 0 4px 0', fontWeight: '700' }}>Mở khóa các CV VIP</Title>
                                    <Text style={{ color: themeColors.subTextColor, lineHeight: '1.5' }}>Các mẫu CV Vip sẽ được mở khóa giúp sự lựa chọn của ứng viên đa dạng hơn.</Text>
                                </div>
                            </div>
                        </Space>
                    </div>
                </Col>

                {/* CỘT PHẢI: BẢNG GIÁ VÀ DANH SÁCH GÓI */}
                <Col xs={24} lg={14}>
                    <Title level={3} style={{ textAlign: 'center', marginBottom: '24px', color: '#1890ff', fontWeight: '700' }}>
                        Chọn Gói VIP Phù Hợp Với Bạn
                    </Title>

                    {isLoadingPackages ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#1890ff' }} spin />} />
                            <p style={{ marginTop: '16px', color: themeColors.subTextColor }}>Đang tải bảng giá gói dịch vụ...</p>
                        </div>
                    ) : vipPackages.length === 0 ? (
                        <Card style={{ backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder, textAlign: 'center', padding: '40px', borderRadius: '12px' }}>
                            <Text style={{ color: themeColors.subTextColor }}>Hiện chưa có gói dịch vụ nào dành cho Ứng viên.</Text>
                        </Card>
                    ) : (
                        <Row gutter={[24, 24]} justify="center">
                            {vipPackages.map((pkg, index) => {
                                const isSelected = selectedPackage === pkg.maGoi;
                                const isDiscount = pkg.giaKhuyenMai && pkg.giaKhuyenMai > 0 && pkg.giaKhuyenMai < pkg.giaTien;
                                const priceToDisplay = isDiscount ? pkg.giaKhuyenMai : pkg.giaTien;
                                const isPopular = index === 1;

                                const timeLabel = `${pkg.donViThoiGian} ${pkg.loaiGoi === 3 ? 'năm' : pkg.loaiGoi === 2 ? 'tháng' : 'ngày'}`;
                                const privileges = pkg.dacQuyens || pkg.DacQuyens || [];

                                const CardInnerContent = (
                                    <Card
                                        hoverable
                                        onClick={() => setSelectedPackage(pkg.maGoi)}
                                        style={{
                                            backgroundColor: themeColors.cardBg,
                                            borderColor: isSelected ? '#1890ff' : themeColors.cardBorder,
                                            borderRadius: '16px',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: isSelected ? '0 6px 20px rgba(24, 144, 255, 0.2)' : themeColors.boxShadow,
                                            transition: 'all 0.3s ease'
                                        }}
                                        styles={{ body: { padding: '28px 24px', flex: 1, display: 'flex', flexDirection: 'column' } }}
                                    >
                                        <Title level={4} style={{ color: isSelected ? '#1890ff' : themeColors.textColor, textAlign: 'center', margin: '0 0 12px 0', fontWeight: '700' }}>
                                            {pkg.tenGoi}
                                        </Title>

                                        <div style={{ margin: '12px 0 24px 0', textAlign: 'center', minHeight: '60px' }}>
                                            {isDiscount ? (
                                                <Text delete style={{ color: '#8c8c8c', fontSize: '14px', display: 'block' }}>
                                                    {pkg.giaTien.toLocaleString('vi-VN')} đ
                                                </Text>
                                            ) : (
                                                <div style={{ height: '21px' }}></div>
                                            )}
                                            <Title level={2} style={{ color: '#1890ff', margin: 0, fontWeight: 'bold' }}>
                                                {priceToDisplay.toLocaleString('vi-VN')} <span style={{ fontSize: '16px' }}>đ</span>
                                            </Title>
                                        </div>

                                        <Divider style={{ borderColor: themeColors.dividerColor, margin: '0 0 20px 0' }} />

                                        {/* HIỂN THỊ CÁC ĐẶC QUYỀN TỪ DATABASE */}
                                        <Space direction="vertical" size="middle" style={{ width: '100%', flex: 1, marginBottom: '28px' }}>
                                            <Text style={{ color: themeColors.textColor, fontSize: '13.5px' }}>
                                                ⏳ Thời hạn sử dụng: <b style={{ color: '#1890ff' }}>{timeLabel}</b>
                                            </Text>

                                            {privileges.length > 0 ? (
                                                privileges.map((dq, idx) => {
                                                    const tenDq = dq.tenDacQuyen || dq.TenDacQuyen;
                                                    const sl = dq.soLuong !== undefined ? dq.soLuong : dq.SoLuong;

                                                    return (
                                                        <div key={dq.maDacQuyen || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: '15px', marginTop: '3px' }} />
                                                            <Text style={{ color: themeColors.textColor, fontSize: '13.5px', lineHeight: '1.5' }}>
                                                                {tenDq}
                                                                {sl > 0 ? <b style={{ color: '#1890ff' }}>: {sl} lượt</b> : (sl === -1 ? <b style={{ color: '#1890ff' }}> (Vô hạn)</b> : '')}
                                                            </Text>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <Text style={{ color: themeColors.subTextColor }} italic>Đầy đủ đặc quyền VIP ứng viên</Text>
                                            )}
                                        </Space>

                                        {/* NÚT BẤM THANH TOÁN */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                                            <Button
                                                type="primary"
                                                size="large"
                                                block
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPackage(pkg.maGoi);
                                                    handlePayment('MOMO', pkg.maGoi);
                                                }}
                                                disabled={isProcessing}
                                                style={{ backgroundColor: '#a50064', borderColor: '#a50064', color: '#fff', fontWeight: 'bold', borderRadius: '8px', height: '42px' }}
                                            >
                                                Thanh toán MoMo
                                            </Button>
                                            <Button
                                                type="primary"
                                                size="large"
                                                block
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPackage(pkg.maGoi);
                                                    handlePayment('VNPAY', pkg.maGoi);
                                                }}
                                                disabled={isProcessing}
                                                style={{ backgroundColor: '#005baa', borderColor: '#005baa', color: '#fff', fontWeight: 'bold', borderRadius: '8px', height: '42px' }}
                                            >
                                                Thanh toán VNPay
                                            </Button>
                                        </div>
                                    </Card>
                                );

                                return (
                                    <Col xs={24} md={12} key={pkg.maGoi}>
                                        {isPopular ? (
                                            <Badge.Ribbon text={<><FireOutlined /> PHỔ BIẾN NHẤT</>} color="red">
                                                {CardInnerContent}
                                            </Badge.Ribbon>
                                        ) : CardInnerContent}
                                    </Col>
                                );
                            })}
                        </Row>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Text style={{ color: themeColors.subTextColor, fontSize: '13.5px' }}>
                            <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: '6px' }} />
                            Mọi giao dịch thanh toán đều được mã hóa bảo mật 100% qua cổng thanh toán chính thức.
                        </Text>
                    </div>
                </Col>
            </Row>

            {/* POPUP MOMO FALLBACK */}
            <Modal
                title={
                    <span style={{ color: '#a50064', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ border: '2px solid #a50064', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold' }}>¥</span>
                        Kích hoạt thanh toán MoMo (Sandbox)
                    </span>
                }
                open={isMomoModalVisible}
                onCancel={() => !isConfirmingFallback && setIsMomoModalVisible(false)}
                footer={null}
                centered
                styles={{ content: { borderRadius: '16px', padding: '24px 20px' } }}
            >
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '15px', color: '#333', marginBottom: '24px' }}>
                        Đơn nạp tiền <b>#{currentOrderData.orderId}</b> đã sẵn sàng. Vui lòng nhấn mở cổng MoMo hoặc chọn kết quả giả lập bên dưới:
                    </p>

                    <a
                        href={momoPayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block', width: '100%', padding: '12px 0',
                            backgroundColor: '#a50064', color: '#fff', fontWeight: 'bold',
                            fontSize: '15px', borderRadius: '8px', textAlign: 'center',
                            textDecoration: 'none', marginBottom: '16px'
                        }}
                    >
                        🚀 MỞ TRANG THANH TOÁN MOMO
                    </a>

                    <div style={{
                        background: '#fffbe6',
                        border: '1px solid #ffe58f',
                        padding: '10px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <Spin size="small" spinning={isPolling} />
                        <span style={{ color: '#d48806', fontWeight: '500', fontSize: '13px' }}>
                            Đang tự động lắng nghe kết quả từ MoMo...
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <Button
                            danger
                            type="default"
                            icon={<CloseCircleOutlined />}
                            onClick={handleConfirmFailed}
                            style={{ flex: 1, height: '42px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px' }}
                        >
                            ❌ Giả lập Thất bại
                        </Button>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={isConfirmingFallback}
                            onClick={handleConfirmFallback}
                            style={{
                                flex: 1, height: '42px', backgroundColor: '#52c41a',
                                borderColor: '#52c41a', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px'
                            }}
                        >
                            ✔️ Giả lập Thành công
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UpgradeVip;