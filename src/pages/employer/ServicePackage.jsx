import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Modal, InputNumber, Row, Col, Statistic, Space, Tag, Badge } from 'antd';
import { WalletOutlined, ShoppingCartOutlined, ExclamationCircleOutlined, HistoryOutlined, ArrowLeftOutlined, FireOutlined } from '@ant-design/icons';
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

    // State cho Modal Nạp tiền MoMo Inline
    const [isTopupModalVisible, setIsTopupModalVisible] = useState(false);
    const [topupAmount, setTopupAmount] = useState(10000);
    const [missingAmount, setMissingAmount] = useState(0);

    useEffect(() => {
        // Đồng bộ cách lấy token giống hệt như bên Wallet.jsx
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

    const fetchData = async () => {
        try {
            const [pkgRes, histRes, balRes] = await Promise.all([
                servicePackage.getPackages(),
                servicePackage.getHistory(),
                servicePackage.getBalance()
            ]);
            
            // Xử lý linh hoạt: Nếu có .data thì lấy, không thì lấy trực tiếp
            const actualPkg = pkgRes?.data ? pkgRes.data : pkgRes;
            const actualHist = histRes?.data ? histRes.data : histRes;
            const actualBal = balRes?.data ? balRes.data : balRes;

            setPackages(Array.isArray(actualPkg) ? actualPkg : []); 
            setHistory(Array.isArray(actualHist) ? actualHist : []);
            
            // ÉP KIỂU VỀ NUMBER ĐỂ CHỐNG LỖI NaN
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

    const [selectedPkgId, setSelectedPkgId] = useState(null);

    const handlePurchaseClick = (pkg) => {
        // Ép kiểu chắc chắn là số
        const giaGoc = Number(pkg.giaTien) || 0;
        const giaKM = Number(pkg.giaKhuyenMai) || 0;
        const giaThucTe = (giaKM > 0) ? giaKM : giaGoc;
        const soDuHienTai = Number(balance) || 0;

        if (soDuHienTai >= giaThucTe) {
            const isVipActive = ngayHetHan && new Date(ngayHetHan) > new Date();
            const contentMsg = isVipActive 
                ? `LƯU Ý: Bạn đang sử dụng [${tenGoiHienTai}]. Nếu tiếp tục, hệ thống sẽ trừ ${giaThucTe.toLocaleString()}đ để kích hoạt [${pkg.tenGoi}]. Lượt xem CV sẽ được CỘNG DỒN và Hạn sử dụng sẽ được thay đổi theo quy định của gói mới. Bạn có chắc chắn?`
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
            // Tính số tiền thiếu an toàn
            const thieu = giaThucTe - soDuHienTai;
            setMissingAmount(thieu);
            setTopupAmount(thieu < 10000 ? 10000 : thieu); 
            setSelectedPkgId(pkg.maGoi);
            setIsTopupModalVisible(true);
        }
    };

    const handleTopupSubmit = async () => {
        if (!maUser) {
            toast.error("Không tìm thấy thông tin tài khoản, vui lòng đăng nhập lại!");
            return;
        }

        const soTienNap = Number(topupAmount) || 0;
        if (soTienNap < 10000) return toast.warning("Tối thiểu 10.000đ");

        try {
            setLoading(true);
            const response = await paymentService.createPaymentUrl(maUser, soTienNap);
            if (response && response.url) {
                // LƯU VẾT
                localStorage.setItem('payment_redirect', '/employer/service-package');

                if (selectedPkgId) {
                    localStorage.setItem('pending_purchase_package_id', selectedPkgId);
                }
                
                toast.info("Chuyển hướng an toàn sang MoMo...");
                window.location.href = response.url;
            } else {
                toast.error("Không nhận được URL thanh toán từ server!");
            }
        } catch (error) {
            console.error("Lỗi nạp tiền MoMo:", error);
            toast.error("Lỗi kết nối MoMo.");
        } finally {
            setLoading(false);
        }
    };

    // ... Cột lịch sử giao dịch (columns) giữ nguyên như cũ ...
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
                    
                    // Render UI cho từng gói
                    const CardContent = (
                        <Card 
                            hoverable 
                            style={{ 
                                textAlign: 'center', 
                                borderRadius: '10px', 
                                borderTop: isDiscount ? '5px solid #ff4d4f' : '5px solid #1890ff', 
                                height: '100%', // Ép thẻ Card cao bằng nhau
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
                            
                            {/* VÙNG GIÁ TIỀN: Cố định min-height để không bị lệch khi có/không có giá gạch ngang */}
                            <div style={{ margin: '15px 0', minHeight: '75px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {isDiscount ? (
                                    <Text delete style={{ color: '#999', fontSize: '16px', display: 'block' }}>
                                        {pkg.giaTien.toLocaleString()} đ
                                    </Text>
                                ) : (
                                    // Div rỗng giữ chỗ cho các gói không có giảm giá
                                    <div style={{ height: '24px' }}></div>
                                )}
                                <Title level={2} style={{ color: isDiscount ? '#ff4d4f' : '#D82D8B', margin: 0 }}>
                                    {(isDiscount ? pkg.giaKhuyenMai : pkg.giaTien).toLocaleString()} đ
                                </Title>
                            </div>

                            {/* VÙNG DANH SÁCH QUYỀN LỢI */}
                            <Space direction="vertical" style={{ width: '100%', textAlign: 'left', marginTop: 15, flex: 1 }}>
                                <Text>
                                    ⏳ Chu kỳ: <b>
                                        {pkg.donViThoiGian} {pkg.loaiGoi === 3 ? 'năm' : pkg.loaiGoi === 2 ? 'tháng' : 'ngày'}
                                    </b>
                                </Text>
                                <Text>👁️ Tặng thêm: <b>{pkg.soLuotXemCv} lượt xem CV</b></Text>
                                <Text>🚀 Nổi bật: <b>Đẩy bài đăng lên đầu danh sách</b></Text>
                                <Text>⭐ Cơ chế: <b>Cộng dồn quyền lợi</b></Text>
                            </Space>

                            {/* NÚT BẤM: Dùng marginTop: 'auto' để luôn bị đẩy xuống sát đáy */}
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
                            {/* Nếu có giảm giá thì gắn ruy-băng (Badge) */}
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

            {/* MODAL NẠP TIỀN NẰM NGAY TRONG TRANG */}
            <Modal
                title={<span><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} /> Cần nạp thêm tiền</span>}
                open={isTopupModalVisible}
                onCancel={() => setIsTopupModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsTopupModalVisible(false)}>Hủy bỏ</Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={handleTopupSubmit} style={{ background: '#A50064', borderColor: '#A50064' }}>
                        Nạp {topupAmount.toLocaleString()}đ qua MoMo
                    </Button>,
                ]}
            >
                <div style={{ textAlign: 'center', padding: '15px 0' }}>
                    <p style={{ fontSize: '16px', marginBottom: 20 }}>
                        Giao dịch thất bại do số dư ví thiếu <Text type="danger" strong>{missingAmount.toLocaleString()} đ</Text>.
                    </p>
                    <p>Nhập số tiền bạn muốn nạp (Tối thiểu 10.000đ):</p>
                    <InputNumber min={10000} step={10000} value={topupAmount} onChange={setTopupAmount} style={{ width: '70%', fontSize: '18px' }} addonAfter="VNĐ" />
                </div>
            </Modal>
        </div>
    );
};

export default ServicePackage;