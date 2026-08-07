import React, { useState, useEffect, useRef } from 'react';
import { Card, Radio, Button, Table, Typography, Modal, InputNumber, Row, Col, Statistic, Space, Tag, Badge, Spin } from 'antd';
import { 
    WalletOutlined, 
    ShoppingCartOutlined, 
    ExclamationCircleOutlined, 
    HistoryOutlined, 
    ArrowLeftOutlined, 
    FireOutlined,
    PayCircleOutlined,
    CheckCircleOutlined,
    LoadingOutlined,
    CloseCircleOutlined,
    CreditCardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import servicePackage from '../../services/servicePackage';
import paymentService from '../../services/paymentService';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const { Title, Text } = Typography;
const { confirm } = Modal;

const ServicePackage = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [history, setHistory] = useState([]);
    const [balance, setBalance] = useState(0);
    const [ngayHetHan, setNgayHetHan] = useState(null);
    const [luotXemCv, setLuotXemCv] = useState(0);
    const [tenGoiHienTai, setTenGoiHienTai] = useState('Miễn phí');
    const [ngayMua, setNgayMua] = useState(null);
    const [loading, setLoading] = useState(false);
    const [maUser, setMaUser] = useState(null);
    const isProcessingRef = useRef(false);

    // State cho Modal Nạp tiền thiếu
    const [isTopupModalVisible, setIsTopupModalVisible] = useState(false);
    const [topupAmount, setTopupAmount] = useState(10000);
    const [missingAmount, setMissingAmount] = useState(0);
    const [selectedPkgId, setSelectedPkgId] = useState(null);

    // State cho Modal Thanh toán MoMo & Polling
    const [payUrl, setPayUrl] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [checkingOrderId, setCheckingOrderId] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isConfirmingManual, setIsConfirmingManual] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('vnpay');

    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || decoded.sub;
                setMaUser(parseInt(userId, 10));
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
            }
        }
        fetchData();
    }, []);

    // 3. Polling kiểm tra tự động
    useEffect(() => {
        let interval = null;
        if (isChecking && checkingOrderId && maUser) {
            interval = setInterval(async () => {
                if (isProcessingRef.current) return; // Nếu đã bị khóa thì dừng ngay

                try {
                    const res = await paymentService.checkStatus(checkingOrderId, maUser, selectedPkgId);
                    const isPaid = res?.data?.isPaid || res?.isPaid;

                    if (isPaid && !isProcessingRef.current) {
                        isProcessingRef.current = true; // 🌟 Khóa tiến trình
                        clearInterval(interval);
                        setIsChecking(false);
                        setIsPaymentModalOpen(false);

                        localStorage.setItem('payment_redirect', window.location.pathname);
                        navigate(`/payment-success?orderId=${checkingOrderId}`);
                    }
                } catch (err) {
                    console.error("Lỗi kiểm tra trạng thái giao dịch:", err);
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isChecking, checkingOrderId, maUser, selectedPkgId, navigate]);

    const fetchData = async () => {
        try {
            const pkgCall = servicePackage.getEmployerPackages 
                ? servicePackage.getEmployerPackages() 
                : servicePackage.getPackages();
            const [pkgRes, histRes, balRes] = await Promise.all([
                pkgCall,
                servicePackage.getHistory(),
                servicePackage.getBalance()
            ]);
            
            const actualPkg = pkgRes?.data ? pkgRes.data : pkgRes;
            const actualHist = histRes?.data ? histRes.data : histRes;
            const actualBal = balRes?.data ? balRes.data : balRes;
            setPackages(Array.isArray(actualPkg) ? actualPkg : []); 
            setHistory(Array.isArray(actualHist) ? actualHist : []);
            
            setBalance(Number(actualBal?.soDuVi) || 0);
            setNgayHetHan(actualBal?.ngayHetHanGoi);
            setLuotXemCv(Number(actualBal?.luotXemCvConLai) || 0);
            setTenGoiHienTai(actualBal?.tenGoiHienTai || 'Miễn phí');
            setNgayMua(actualBal?.ngayMua || null);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            setPackages([]);
        }
    };

    const extractOrderId = (url) => {
        try {
            const urlObj = new URL(url);
            const tParam = urlObj.searchParams.get('t');
            if (tParam) {
                const decoded = atob(tParam);
                const parts = decoded.split('|');
                if (parts.length >= 2) return parts[1];
            }
        } catch (e) {
            console.error("Lỗi bóc tách orderId:", e);
        }
        return Date.now().toString();
    };

    const handlePurchaseClick = (pkg) => {
        const giaGoc = Number(pkg.giaTien) || 0;
        const giaKM = Number(pkg.giaKhuyenMai) || 0;
        const giaThucTe = (giaKM > 0) ? giaKM : giaGoc;
        const soDuHienTai = Number(balance) || 0;
        if (soDuHienTai >= giaThucTe) {
            const isVipActive = ngayHetHan && new Date(ngayHetHan) > new Date();
            const contentMsg = isVipActive 
                ? `LƯU Ý: Bạn đang sử dụng [${tenGoiHienTai}]. Nếu tiếp tục, hệ thống sẽ trừ ${giaThucTe.toLocaleString()}đ để kích hoạt [${pkg.tenGoi}]. Quyền lợi sẽ được CỘNG DỒN và Hạn sử dụng sẽ được gia hạn. Bạn có chắc chắn?`
                : `Hệ thống sẽ trừ ${giaThucTe.toLocaleString()} đ từ số dư ví để kích hoạt ${pkg.tenGoi}.`;
            confirm({
                title: isVipActive ? 'Xác nhận Chuyển đổi / Gia hạn gói' : 'Xác nhận kích hoạt gói',
                icon: <ShoppingCartOutlined style={{ color: isVipActive ? '#faad14' : '#1890ff' }} />,
                content: contentMsg,
                okText: isVipActive ? 'Đồng ý chuyển đổi' : 'Mua ngay',
                cancelText: 'Hủy',
                okButtonProps: { danger: isVipActive },
                onOk: async () => {
                    try {
                        setLoading(true);
                        const res = await servicePackage.purchasePackage(pkg.maGoi);
                        toast.success(res.message);
                        fetchData(); 
                    } catch (error) {
                        toast.error(error.response?.data?.message || "Lỗi giao dịch!");
                    } finally {
                        setLoading(false);
                    }
                }
            });
        } else {
            const thieu = giaThucTe - soDuHienTai;
            setMissingAmount(thieu);
            setTopupAmount(thieu < 10000 ? 10000 : thieu); 
            setSelectedPkgId(pkg.maGoi);
            setIsTopupModalVisible(true);
        }
    };

    // 1. Reset cờ khóa khi người dùng bắt đầu nạp tiền mới
    const handleTopupSubmit = async () => {
        if (!maUser) return toast.error("Không tìm thấy thông tin tài khoản!");
        const soTienNap = Number(topupAmount) || 0;
        if (soTienNap < 10000) return toast.warning("Tối thiểu 10.000đ");

        try {
            setLoading(true);
            isProcessingRef.current = false; // 🌟 Reset cờ khóa tại đây

            if (paymentMethod === 'vnpay') {
                const response = await paymentService.createVnPayUrl(maUser, soTienNap, selectedPkgId);
                const url = response?.paymentUrl || response?.url || response?.data?.paymentUrl || response?.data?.url || response?.data;
                if (url && typeof url === 'string' && url.startsWith('http')) {
                    localStorage.setItem('payment_redirect', window.location.pathname);
                    window.location.href = url;
                }
            } else {
                const response = await paymentService.createPaymentUrl(maUser, soTienNap, selectedPkgId);
                const url = response?.paymentUrl || response?.url || response?.data?.paymentUrl || response?.data?.url || response?.data;
                if (url && typeof url === 'string' && url.startsWith('http')) {
                    const orderId = extractOrderId(url);
                    localStorage.setItem('payment_redirect', window.location.pathname);
                    setPayUrl(url);
                    setCheckingOrderId(orderId);
                    
                    setIsTopupModalVisible(false);
                    setIsPaymentModalOpen(true);
                    setIsChecking(true);
                }
            }
        } catch (error) {
            toast.error("Lỗi kết nối cổng thanh toán.");
        } finally {
            setLoading(false);
        }
    };

    // 2. Khóa Polling ngay lập tức khi người dùng bấm nút Giả lập
    const handleManualConfirm = async (resultCode = '0') => {
        if (isProcessingRef.current) return;
        
        // 🌟 KHÓA NGAY LẬP TỨC TRƯỚC KHI GỌI API (Chống Polling can thiệp)
        isProcessingRef.current = true; 
        setIsChecking(false);

        setIsConfirmingManual(true);
        localStorage.setItem('payment_redirect', window.location.pathname);

        try {
            if (resultCode === '0') {
                await paymentService.confirmFallback({
                    maUser: maUser,
                    amount: Number(topupAmount),
                    orderId: checkingOrderId,
                    resultCode: '0',
                    maGoi: selectedPkgId
                });
                setIsPaymentModalOpen(false);
                setCheckingOrderId(null);
                navigate(`/payment-success?orderId=${checkingOrderId}`);
            } else {
                setIsPaymentModalOpen(false);
                setCheckingOrderId(null);
                navigate(`/payment-failed?orderId=${checkingOrderId}`);
            }
        } catch (err) {
            console.error("Lỗi xác nhận giả lập:", err);
            toast.error("Thao tác thất bại, vui lòng thử lại!");
            isProcessingRef.current = false; // Mở lại cờ nếu API lỗi
        } finally {
            setIsConfirmingManual(false);
        }
    };

    const columns = [
        { title: 'Ngày GD', dataIndex: 'ngayGd', render: (t) => new Date(t).toLocaleString('vi-VN') },
        { title: 'Loại', dataIndex: 'loaiGiaoDich', render: (t) => <Tag color={t===1?'green':'red'}>{t===1?'+ Nạp':'- Mua gói'}</Tag> },
        { title: 'Nội dung', dataIndex: 'tenGoi', render: (t) => <b>{t}</b> },
        { title: 'Số tiền', dataIndex: 'soTien', render: (a) => <Text strong>{a.toLocaleString()} đ</Text> },
        { title: 'Trạng thái', dataIndex: 'trangThai', render: (s) => <Tag color={s?'success':'error'}>{s?'Thành công':'Thất bại'}</Tag> }
    ];

    return (
        <div style={{ padding: '0 24px' }}>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employer/dashboard')} style={{ marginBottom: 20, padding: 0 }}>
                Quay lại Bảng điều khiển
            </Button>
            
            {/* THỐNG KÊ SỐ DƯ & GÓI HIỆN TẠI */}
            <Row gutter={24} style={{ marginBottom: 30 }}>
                <Col span={12}>
                    <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f', height: '100%' }}>
                        <Statistic 
                            title={<span style={{ color: '#389e0d', fontWeight: 'bold' }}>SỐ DƯ VÍ TKVL</span>} 
                            value={balance} 
                            suffix="VNĐ" 
                            prefix={<WalletOutlined />} 
                            styles={{ content: { color: '#389e0d', fontSize: '32px', fontWeight: 'bold' } }} 
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card style={{ background: '#e6f7ff', borderColor: '#91d5ff', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, color: '#0050b3', fontWeight: 'bold' }}>GÓI HIỆN TẠI</p>
                                <Title level={3} style={{ color: '#096dd9', margin: '5px 0' }}>
                                    {tenGoiHienTai}
                                </Title>
                                {ngayHetHan && new Date(ngayHetHan) > new Date() && (
                                    <Space direction="vertical" size={0} style={{ marginTop: '5px' }}>
                                        {ngayMua && (
                                            <Text type="secondary">
                                                📅 Ngày mua: {new Date(ngayMua).toLocaleDateString('vi-VN')}
                                            </Text>
                                        )}
                                        <Text type="danger" strong>
                                            ⏳ Hết hạn: {new Date(ngayHetHan).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </Space>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, color: '#0050b3' }}>Lượt xem CV</p>
                                <Title level={2} style={{ color: '#cf1322', margin: 0 }}>{luotXemCv}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Title level={3} style={{ textAlign: 'center', marginBottom: 30, color: '#0056b3' }}>CỬA HÀNG DỊCH VỤ</Title>
            
            <Row gutter={[24, 24]} justify="center">
                {packages.map(pkg => {
                    const isDiscount = pkg.giaKhuyenMai && pkg.giaKhuyenMai > 0 && pkg.giaKhuyenMai < pkg.giaTien;
                    
                    const CardContent = (
                        <Card 
                            hoverable 
                            style={{ 
                                textAlign: 'center', 
                                borderRadius: '10px', 
                                borderTop: isDiscount ? '5px solid #ff4d4f' : '5px solid #1890ff', 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            bodyStyle={{ 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column' 
                            }}
                        >
                            <Title level={4}>{pkg.tenGoi}</Title>
                            
                            <div style={{ margin: '15px 0', minHeight: '75px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {isDiscount ? (
                                    <Text delete style={{ color: '#999', fontSize: '16px', display: 'block' }}>
                                        {pkg.giaTien.toLocaleString()} đ
                                    </Text>
                                ) : (
                                    <div style={{ height: '24px' }}></div>
                                )}
                                <Title level={2} style={{ color: isDiscount ? '#ff4d4f' : '#D82D8B', margin: 0 }}>
                                    {(isDiscount ? pkg.giaKhuyenMai : pkg.giaTien).toLocaleString()} đ
                                </Title>
                            </div>

                            <Space direction="vertical" style={{ width: '100%', textAlign: 'left', marginTop: 15, flex: 1 }}>
                                <Text>
                                    ⏳ Chu kỳ: <b>
                                        {pkg.donViThoiGian} {pkg.loaiGoi === 3 ? 'năm' : pkg.loaiGoi === 2 ? 'tháng' : 'ngày'}
                                    </b>
                                </Text>
                                {pkg.soLuotXemCv > 0 && (
                                    <Text>
                                        👁️ Lượt xem CV bổ sung: <b>{pkg.soLuotXemCv} lượt</b>
                                    </Text>
                                )}
                                {pkg.dacQuyens && pkg.dacQuyens.length > 0 ? (
                                    pkg.dacQuyens.map((dq, idx) => (
                                        <Text key={dq.maDacQuyen || idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                            <span>
                                                {dq.tenDacQuyen}
                                                {dq.soLuong ? <b>: {dq.soLuong} lượt</b> : ''}
                                            </span>
                                        </Text>
                                    ))
                                ) : (
                                    <Text type="secondary" italic>Gói cơ bản</Text>
                                )}
                                <Text type="secondary" style={{ fontSize: '12px', marginTop: 8 }}>
                                    ⭐ Cơ chế: <b>Cộng dồn quyền lợi & tự động kích hoạt</b>
                                </Text>
                            </Space>

                            <Button 
                                type={isDiscount ? "primary" : "default"} 
                                danger={isDiscount} 
                                size="large" 
                                style={{ width: '100%', marginTop: '30px', fontWeight: 'bold' }} 
                                onClick={() => handlePurchaseClick(pkg)}
                            >
                                {isDiscount ? "Chớp Deal Ngay" : "Mua gói này"}
                            </Button>
                        </Card>
                    );

                    return (
                        <Col xs={24} sm={12} md={8} key={pkg.maGoi}>
                            {isDiscount ? (
                                <Badge.Ribbon text={<><FireOutlined /> SIÊU TIẾT KIỆM</>} color="red">
                                    {CardContent}
                                </Badge.Ribbon>
                            ) : CardContent}
                        </Col>
                    );
                })}
            </Row>

            <Title level={4} style={{ marginTop: 50, borderBottom: '2px solid #1890ff', paddingBottom: 10 }}>
                <HistoryOutlined /> Lịch sử biến động
            </Title>
            <Table dataSource={history} columns={columns} rowKey="maGd" pagination={{ pageSize: 5 }} style={{ marginTop: 20 }} />

            {/* MODAL 1: BÁO SỐ DƯ THIẾU & CHỌN CỔNG THANH TOÁN */}
            <Modal
                title={<span><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} /> Cần nạp thêm tiền</span>}
                open={isTopupModalVisible}
                onCancel={() => setIsTopupModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsTopupModalVisible(false)}>Hủy bỏ</Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={loading} 
                        onClick={handleTopupSubmit} 
                        style={{ 
                            background: paymentMethod === 'vnpay' ? '#005baa' : '#A50064', 
                            borderColor: paymentMethod === 'vnpay' ? '#005baa' : '#A50064' 
                        }}
                    >
                        Nạp {topupAmount.toLocaleString()}đ qua {paymentMethod === 'vnpay' ? 'VNPay' : 'MoMo'}
                    </Button>,
                ]}
            >
                <div style={{ textAlign: 'center', padding: '15px 0' }}>
                    <p style={{ fontSize: '16px', marginBottom: 15 }}>
                        Giao dịch thất bại do số dư ví thiếu <Text type="danger" strong>{missingAmount.toLocaleString()} đ</Text>.
                    </p>

                    <div style={{ marginBottom: 15, textAlign: 'left' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Phương thức nạp tiền:</label>
                        <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Radio.Button value="vnpay" style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                                    <CreditCardOutlined style={{ color: '#005baa', marginRight: 6 }} /> VNPay (ATM / QR Code)
                                </Radio.Button>
                                <Radio.Button value="momo" style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                                    <PayCircleOutlined style={{ color: '#A50064', marginRight: 6 }} /> Ví MoMo
                                </Radio.Button>
                            </Space>
                        </Radio.Group>
                    </div>

                    <p style={{ margin: '10px 0 5px 0' }}>Nhập số tiền bạn muốn nạp (Tối thiểu 10.000đ):</p>
                    <InputNumber min={10000} step={10000} value={topupAmount} onChange={setTopupAmount} style={{ width: '100%', fontSize: '18px' }} addonAfter="VNĐ" />
                </div>
            </Modal>

            {/* MODAL 2: MỞ TRANG THANH TOÁN MOMO & GIẢ LẬP */}
            <Modal
                title={<span style={{ color: '#A50064', fontSize: '18px' }}><PayCircleOutlined /> Kích hoạt thanh toán MoMo (Sandbox)</span>}
                open={isPaymentModalOpen}
                onCancel={() => { setIsPaymentModalOpen(false); setIsChecking(false); }}
                footer={null}
                centered
            >
                <div style={{ textAlign: 'center', padding: '15px 0' }}>
                    <p style={{ fontSize: '15px', color: '#333' }}>
                        Đơn nạp tiền <b>#{checkingOrderId}</b> đã sẵn sàng. Vui lòng nhấn mở cổng MoMo hoặc chọn kết quả giả lập bên dưới:
                    </p>
                    
                    <a 
                        href={payUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block', width: '100%', padding: '12px 0',
                            backgroundColor: '#A50064', color: '#fff', fontWeight: 'bold',
                            fontSize: '15px', borderRadius: '6px', textAlign: 'center',
                            textDecoration: 'none', margin: '5px 0 15px 0'
                        }}
                    >
                        MỞ TRANG THANH TOÁN MOMO
                    </a>

                    <div style={{ padding: '10px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '6px', marginBottom: '15px' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: '#d48806', marginRight: '8px' }} spin />} />
                        <span style={{ color: '#d48806', fontWeight: '500', fontSize: '13px' }}>
                            Đang tự động lắng nghe kết quả từ MoMo...
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <Button 
                            danger
                            type="default"
                            icon={<CloseCircleOutlined />}
                            loading={isConfirmingManual}
                            onClick={() => handleManualConfirm('1006')}
                            style={{ flex: 1, height: '42px', fontWeight: 'bold', fontSize: '14px' }}
                        >
                            ❌ Giả lập Thất bại
                        </Button>
                        <Button 
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={isConfirmingManual}
                            onClick={() => handleManualConfirm('0')}
                            style={{ 
                                flex: 1, height: '42px', backgroundColor: '#52c41a', 
                                borderColor: '#52c41a', fontWeight: 'bold', fontSize: '14px' 
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

export default ServicePackage;