import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Button, Switch, Avatar, Spin, message, Typography, Empty } from 'antd';
import { 
    BellOutlined, 
    MessageOutlined, 
    CheckCircleOutlined, 
    FileTextOutlined, 
    CalendarOutlined, 
    DollarOutlined,
    InfoCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const AppliedJobs = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // State bộ lọc trạng thái

    // Mã màu chủ đạo xanh dương phối hợp hài hòa
    const BLUE_PRIMARY = '#1890ff';
    const BLUE_LIGHT_BG = '#e6f7ff';
    const BLUE_BORDER = '#91d5ff';

    useEffect(() => {
        const fetchAppliedJobs = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    message.error("Vui lòng đăng nhập để xem danh sách!");
                    setLoading(false);
                    return;
                }

                const response = await axios.get('http://localhost:5279/api/JobApplication/my-applications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setApplications(response.data);
            } catch (error) {
                console.error(error);
                message.error("Không thể tải danh sách việc làm.");
            } finally {
                setLoading(false);
            }
        };
        fetchAppliedJobs();
    }, []);

    // Định nghĩa các bộ lọc trạng thái tương ứng với DB trangThai (0: Tiếp nhận, 1: Đã xem, 2: Phù hợp, 3: Chưa phù hợp)
    const filterTabs = [
        { key: 'all', label: 'Tất cả' },
        { key: '0', label: 'Tiếp nhận' },
        { key: '1', label: 'Đã xem' },
        { key: '2', label: 'Phù hợp' },
        { key: '3', label: 'Chưa phù hợp' },
    ];

    // Lọc danh sách công việc dựa trên Tab đang chọn
    const filteredApplications = applications.filter(app => {
        if (activeTab === 'all') return true;
        return app.trangThai.toString() === activeTab;
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0', background: '#f5f7fa', minHeight: '100vh' }}>
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '30px 40px' }}>
            <Row gutter={[24, 24]} style={{ maxWidth: '1300px', margin: '0 auto' }}>
                
                {/* ======================= CỘT TRÁI: NỘI DUNG CHÍNH ======================= */}
                <Col xs={24} lg={17}>
                    <Title level={3} style={{ marginBottom: '20px', color: '#0f1e36', fontWeight: 700 }}>
                        Việc làm đã ứng tuyển
                    </Title>

                    {/* Hộp thông báo nhắc nhở NTD (Đã chuyển sang tone xanh dương) */}
                    <div style={{ 
                        backgroundColor: BLUE_LIGHT_BG, 
                        border: `1px solid ${BLUE_BORDER}`, 
                        borderRadius: '8px', 
                        padding: '16px', 
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <BellOutlined style={{ fontSize: '24px', color: BLUE_PRIMARY }} />
                        <div>
                            <Text strong style={{ color: '#003a8c' }}> Bạn có thể nhấn nút "Nhắc NTD" nếu đã quá 7 ngày từ lúc ứng tuyển mà vẫn chưa được phản hồi. </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '13px' }}>Hệ thống sẽ thay bạn gửi một lời nhắc lịch sự, chuyên nghiệp tới nhà tuyển dụng.</Text>
                        </div>
                    </div>

                    {/* Thanh bộ lọc trạng thái ứng tuyển kiểu TopCV */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {filterTabs.map(tab => (
                            <div 
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    transition: 'all 0.3s',
                                    backgroundColor: activeTab === tab.key ? BLUE_PRIMARY : '#fff',
                                    color: activeTab === tab.key ? '#fff' : '#595959',
                                    border: activeTab === tab.key ? `1px solid ${BLUE_PRIMARY}` : '1px solid #d9d9d9',
                                }}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>

                    {/* Khối Quy trình ứng tuyển tĩnh mô phỏng TopCV */}
                    <Card style={{ marginBottom: '24px', borderRadius: '8px', textAlign: 'center' }} title={<span style={{fontSize:'13px', color:'#8c8c8c', fontWeight:600}}>QUY TRÌNH ỨNG TUYỂN</span>} size="small">
                        <Row justify="space-between" align="middle" style={{ padding: '10px 0' }}>
                            <Col span={4}><Avatar size={32} style={{backgroundColor: BLUE_PRIMARY}}>1</Avatar><div style={{fontSize:'12px', marginTop:4}}>Gửi hồ sơ</div></Col>
                            <Col span={1}><div style={{height:'2px', backgroundColor:'#d9d9d9'}}></div></Col>
                            <Col span={4}><Avatar size={32} style={{backgroundColor: '#d9d9d9', color:'#595959'}}>2</Avatar><div style={{fontSize:'12px', marginTop:4}}>Tiếp nhận</div></Col>
                            <Col span={1}><div style={{height:'2px', backgroundColor:'#d9d9d9'}}></div></Col>
                            <Col span={4}><Avatar size={32} style={{backgroundColor: '#d9d9d9', color:'#595959'}}>3</Avatar><div style={{fontSize:'12px', marginTop:4}}>Xem hồ sơ</div></Col>
                            <Col span={1}><div style={{height:'2px', backgroundColor:'#d9d9d9'}}></div></Col>
                            <Col span={4}><Avatar size={32} style={{backgroundColor: '#d9d9d9', color:'#595959'}}>4</Avatar><div style={{fontSize:'12px', marginTop:4}}>Xử lý</div></Col>
                            <Col span={1}><div style={{height:'2px', backgroundColor:'#d9d9d9'}}></div></Col>
                            <Col span={4}><Avatar size={32} style={{backgroundColor: '#d9d9d9', color:'#595959'}}>5</Avatar><div style={{fontSize:'12px', marginTop:4}}>Phản hồi</div></Col>
                        </Row>
                    </Card>

                    {/* DANH SÁCH CÁC CÔNG VIỆC ĐÃ ỨNG TUYỂN */}
                    {filteredApplications.length === 0 ? (
                        <Card style={{ borderRadius: '8px' }}><Empty description="Không tìm thấy việc làm nào trong danh mục này." /></Card>
                    ) : (
                        filteredApplications.map(app => (
                            <Card 
                                key={app.maDon} 
                                style={{ marginBottom: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                                bodyStyle={{ padding: '20px' }}
                            >
                                <Row justify="space-between" align="top">
                                    <Col style={{ display: 'flex', gap: '16px' }}>
                                        {/* Mock Logo doanh nghiệp tròn vuông chuẩn TopCV */}
                                        <Avatar 
                                            shape="square" 
                                            size={64} 
                                            src={app.logo || null} 
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#f0f2f5', border: '1px solid #f0f0f0', color: '#bfbfbf' }}
                                        />
                                        <div>
                                            <Title level={5} style={{ margin: 0, color: '#262626', fontWeight: 600, cursor: 'pointer' }}>
                                                {app.tenViTri}
                                            </Title>
                                            <Text strong style={{ color: '#595959', display: 'block', margin: '4px 0' }}>{app.tenCongTy}</Text>
                                            
                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#8c8c8c', fontSize: '13px', marginTop: '6px' }}>
                                                <span><CalendarOutlined /> Ứng tuyển: {new Date(app.ngayNop).toLocaleDateString('vi-VN')}</span>
                                                <span><FileTextOutlined /> CV: <span style={{color: BLUE_PRIMARY, underline: true}}>{app.tieuDeCV}</span></span>
                                                <span><DollarOutlined /> Lương: {app.luong}</span>
                                            </div>

                                            <div style={{ marginTop: '10px' }}>
                                                <Tag color="blue" style={{ borderRadius: '4px', fontWeight: 500 }}>
                                                    Độ phù hợp Cao
                                                </Tag>
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Cụm nút tương tác góc phải */}
                                    <Col style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                        {app.trangThai === 0 && <Tag color="gold">Hồ sơ đã tiếp nhận</Tag>}
                                        {app.trangThai === 1 && <Tag color="blue">Nhà tuyển dụng đã xem</Tag>}
                                        {app.trangThai === 2 && <Tag color="green">Đạt yêu cầu</Tag>}
                                        {app.trangThai === 3 && <Tag color="red">Chưa phù hợp</Tag>}

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                            <Button size="small" icon={<BellOutlined />} style={{ borderColor: BLUE_PRIMARY, color: BLUE_PRIMARY }}>
                                                Nhắc NTD
                                            </Button>
                                            <Button size="small" icon={<MessageOutlined />} type="default">
                                                Nhắn tin
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Dòng lịch sử phản hồi ngắn bên dưới chân card */}
                                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #f0f0f0', fontSize: '13px', color: '#8c8c8c' }}>
                                    {app.trangThai === 3 ? (
                                        <span style={{ color: '#ff4d4f' }}>● Nhà tuyển dụng đánh giá hồ sơ của bạn chưa phù hợp vào lúc {new Date(app.ngayNop).toLocaleDateString('vi-VN')}. Đừng nản lòng, nhiều cơ hội khác đang chờ bạn!</span>
                                    ) : (
                                        <span>● Hệ thống đã cập nhật trạng thái kết nối tự động tới nhà tuyển dụng thành công.</span>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </Col>

                {/* ======================= CỘT PHẢI: SIDEBAR THÔNG TIN TÀI KHOẢN ======================= */}
                <Col xs={24} lg={7}>
                    
                    {/* Card 1: Thông tin Avatar + Name */}
                    <Card style={{ borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                        <Avatar size={64} icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: BLUE_PRIMARY, marginBottom: '12px' }} />
                        <Title level={5} style={{ margin: 0 }}>{user?.hoTen || 'Ứng viên JOBSNOW'}</Title>
                        <Text type="secondary" style={{ fontSize: '13px' }}>{user?.email}</Text>
                        
                        <div style={{ marginTop: '12px' }}>
                            <Tag color="cyan" icon={<CheckCircleOutlined />}>Tài khoản đã xác thực</Tag>
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '13px' }}>
                            <a href="#upgrade" style={{ color: BLUE_PRIMARY, fontWeight: 500 }}>⚡ Nâng cấp tài khoản Pro</a>
                        </div>
                    </Card>

                    {/* Card 2: Trạng thái tìm việc bật tắt */}
                    <Card style={{ borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontWeight: 600 }}>Gợi ý việc làm <InfoCircleOutlined style={{color:'#bfbfbf'}} /></span>
                            <Tag color="blue">Đang bật</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f0f0f0' }}>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>Đang bật tìm việc</div>
                                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Cho phép các NTD săn đón hồ sơ</div>
                            </div>
                            <Switch defaultChecked size="small" style={{ backgroundColor: BLUE_PRIMARY }} />
                        </div>
                    </Card>

                    {/* Card 3: Cài đặt tìm kiếm bảo mật */}
                    <Card style={{ borderRadius: '8px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Cho phép NTD tìm kiếm hồ sơ</span>
                        <Text type="secondary">Khi bật tính năng này, CV chính của bạn sẽ được hiển thị trên hệ thống tìm kiếm CV của nhà tuyển dụng. Giúp gia tăng 80% cơ hội nhận cuộc gọi phỏng vấn trực tiếp.</Text>
                        <Button type="primary" block style={{ marginTop: '16px', backgroundColor: BLUE_PRIMARY, borderColor: BLUE_PRIMARY, borderRadius: '4px', fontWeight: 500 }}>
                            Quản lý danh sách CV
                        </Button>
                    </Card>
                </Col>

            </Row>
        </div>
    );
};

export default AppliedJobs;