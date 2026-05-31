import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Input, Select, Button, Spin, message, Avatar, Tag } from 'antd';
import { 
    SearchOutlined, 
    EnvironmentOutlined, 
    HeartOutlined, 
    CheckCircleOutlined, 
    ThunderboltOutlined,
    PushpinOutlined
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text, Paragraph } = Typography;

const Home = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await apiClient.get('/jobs');
                if (response.data.success) {
                    // Trả lại cấu trúc Master - Detail gốc: Giữ nguyên mảng Chiến Dịch
                    setCampaigns(response.data.data);
                }
            } catch (error) {
                message.error('Không thể tải dữ liệu tuyển dụng!');
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
    }

    return (
        <div style={{ background: '#141414', minHeight: '100vh', paddingBottom: 50 }}>
            
            {/* ================= HERO SECTION ================= */}
            <div style={{ 
                backgroundImage: `linear-gradient(rgba(0, 33, 64, 0.85), rgba(22, 119, 255, 0.7)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                padding: '80px 20px 100px 20px', 
                textAlign: 'center'
            }}>
                <Title level={1} style={{ color: 'white', marginBottom: 12, fontSize: 42, fontWeight: 'bold' }}>
                    Tìm kiếm công việc mơ ước của bạn
                </Title>
                <Paragraph style={{ color: '#e6f7ff', fontSize: 16, marginBottom: 45 }}>
                    Hàng ngàn cơ hội việc làm đang chờ đón bạn
                </Paragraph>
                <div style={{ 
                    maxWidth: 900, margin: '0 auto', background: '#1f1f1f', padding: 8, 
                    borderRadius: 8, display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '1px solid #303030'
                }}>
                    <Input 
                        prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />} 
                        placeholder="Tên công việc, vị trí..." 
                        bordered={false} 
                        style={{ flex: 2, fontSize: 15, color: '#fff' }} 
                        placeholderTextColor="#8c8c8c"
                    />
                    <div style={{ width: 1, background: '#303030', margin: '5px 10px' }}></div>
                    <Select defaultValue="all_location" bordered={false} style={{ flex: 1, color: '#fff' }} suffixIcon={<EnvironmentOutlined style={{color: '#8c8c8c'}}/>}>
                        <Select.Option value="all_location">Tất cả địa điểm</Select.Option>
                        <Select.Option value="hcm">Hồ Chí Minh</Select.Option>
                        <Select.Option value="hn">Hà Nội</Select.Option>
                    </Select>
                    <div style={{ width: 1, background: '#303030', margin: '5px 10px' }}></div>
                    <Select defaultValue="all_category" bordered={false} style={{ flex: 1, color: '#fff' }}>
                        <Select.Option value="all_category">Tất cả ngành nghề</Select.Option>
                        <Select.Option value="it">IT Phần mềm</Select.Option>
                    </Select>
                    <Button type="primary" style={{ background: '#fa8c16', borderColor: '#fa8c16', width: 100, height: 40, borderRadius: 6 }}>
                        <SearchOutlined style={{ fontSize: 18 }} />
                    </Button>
                </div>
            </div>

            {/* ================= DANH SÁCH CHIẾN DỊCH DẠNG LƯỚI 3 CỘT ================= */}
            <div style={{ maxWidth: 1200, margin: '30px auto 40px auto', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                    <Title level={3} style={{ color: '#e6f4ff', margin: 0 }}>Chiến dịch nổi bật</Title>
                    <a href="#" style={{ color: '#1890ff', fontSize: 15 }}>Xem tất cả →</a>
                </div>

                <Row gutter={[24, 24]}>
                    {campaigns.length === 0 ? (
                        <Col span={24} style={{ textAlign: 'center', color: '#8c8c8c', padding: 40 }}>Hiện chưa có chiến dịch nào.</Col>
                    ) : (
                        campaigns.map((campaign, index) => (
                            <Col span={8} key={campaign.maTin || index}>
                                <Card 
                                    hoverable
                                    bodyStyle={{ padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}
                                    style={{ 
                                        borderRadius: 12, 
                                        background: '#1f1f1f', // Nền Card tối
                                        border: '1px solid #303030', 
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        height: '100%'
                                    }}
                                >
                                    {/* PHẦN 1: THÔNG TIN CHIẾN DỊCH VÀ CÔNG TY */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <div style={{ border: '1px solid #303030', borderRadius: 8, padding: 4, marginRight: 16, background: '#141414' }}>
                                            <Avatar shape="square" size={50} src={campaign.logo} alt={campaign.companyName} />
                                        </div>
                                        
                                        <div style={{ flex: 1, paddingRight: 25 }}> 
                                            <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 15, color: '#e6f4ff', lineHeight: 1.4 }}>
                                                {campaign.tieuDeChienDich}
                                            </Title>
                                            <Text style={{ color: '#8c8c8c', fontSize: 13, display: 'block' }}>
                                                {campaign.companyName}
                                            </Text>
                                        </div>
                                    </div>

                                    {/* Icon Tim ở góc trên bên phải */}
                                    <div style={{ position: 'absolute', top: 20, right: 20 }}>
                                        <HeartOutlined style={{ fontSize: 18, color: '#595959', cursor: 'pointer' }} />
                                    </div>

                                    {/* PHẦN 2: HIỂN THỊ SƠ LƯỢC CÁC VỊ TRÍ BÊN TRONG */}
                                    <div style={{ 
                                        marginTop: 'auto', 
                                        paddingTop: 16, 
                                        borderTop: '1px dashed #303030',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8
                                    }}>
                                        <Text style={{ color: '#1890ff', fontSize: 13 }}>
                                            <PushpinOutlined /> Đang mở {campaign.viTris?.length || 0} vị trí:
                                        </Text>
                                        
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {/* Hiển thị tối đa 2 vị trí đầu tiên, nếu dư thì để Tag "+X nữa" */}
                                            {campaign.viTris?.slice(0, 2).map(vt => (
                                                <Tag key={vt.id} style={{ 
                                                    background: '#11284d', 
                                                    borderColor: '#164c7e', 
                                                    color: '#1677ff', 
                                                    margin: 0,
                                                    borderRadius: 4
                                                }}>
                                                    {vt.title}
                                                </Tag>
                                            ))}
                                            {campaign.viTris?.length > 2 && (
                                                <Tag style={{ background: '#262626', borderColor: '#434343', color: '#8c8c8c', margin: 0, borderRadius: 4 }}>
                                                    +{campaign.viTris.length - 2} vị trí khác
                                                </Tag>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))
                    )}
                </Row>
            </div>

            {/* ================= SECTION TẠI SAO CHỌN JOBSNOW ================= */}
            <div style={{ maxWidth: 1000, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
                <Title level={3} style={{ marginBottom: 40, color: '#e6f4ff' }}>Tại sao chọn JobsNow?</Title>

                <Row gutter={48}>
                    <Col span={8}>
                        <div style={{ background: '#11284d', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <SearchOutlined style={{ fontSize: 30, color: '#1890ff' }} />
                        </div>
                        <Title level={5} style={{ color: '#e6f4ff' }}>Tìm kiếm dễ dàng</Title>
                        <Paragraph style={{ color: '#8c8c8c' }}>Hàng ngàn việc làm được cập nhật mỗi ngày</Paragraph>
                    </Col>
                    <Col span={8}>
                        <div style={{ background: '#0f3315', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <CheckCircleOutlined style={{ fontSize: 30, color: '#52c41a' }} />
                        </div>
                        <Title level={5} style={{ color: '#e6f4ff' }}>Ứng tuyển nhanh</Title>
                        <Paragraph style={{ color: '#8c8c8c' }}>Chỉ với vài cú click chuột</Paragraph>
                    </Col>
                    <Col span={8}>
                        <div style={{ background: '#2b164d', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <ThunderboltOutlined style={{ fontSize: 30, color: '#b37feb' }} />
                        </div>
                        <Title level={5} style={{ color: '#e6f4ff' }}>Cơ hội tốt</Title>
                        <Paragraph style={{ color: '#8c8c8c' }}>Kết nối với các công ty hàng đầu</Paragraph>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Home;