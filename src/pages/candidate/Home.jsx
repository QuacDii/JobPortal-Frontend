import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [thanhPhos, setThanhPhos] = useState([]);
    const [nganhNghes, setNganhNghes] = useState([]);

    // 👉 1. STATE LƯU TRỮ BỘ LỌC TÌM KIẾM
    const [searchQuery, setSearchQuery] = useState({
        keyword: '',
        maTP: null,    // Đổi 'all_location' thành null để API dễ xử lý hơn
        maNganh: null  // Đổi 'all_category' thành null
    });

    // 👉 2. HÀM GỌI API (Xử lý thông minh: có tham số thì gọi search, không có thì lấy tất cả)
    const fetchJobs = async (queryOverrides = null) => {
        setLoading(true);
        try {
            // Lấy state hiện tại hoặc data truyền vào tức thời (khi vừa đổi Select)
            const currentQuery = queryOverrides || searchQuery;

            const params = {};
            if (currentQuery.keyword) params.keyword = currentQuery.keyword;
            if (currentQuery.maTP) params.maTP = currentQuery.maTP;
            if (currentQuery.maNganh) params.maNganh = currentQuery.maNganh;

            // Nếu có bất kỳ điều kiện lọc nào thì gọi API search, ngược lại gọi API thường
            const isSearching = Object.keys(params).length > 0;
            const endpoint = isSearching ? '/Jobs/search' : '/Jobs';

            const response = await apiClient.get(endpoint, { params });

            // Bóc tách dữ liệu JSON an toàn
            let finalData = null;
            if (response) {
                if (response.data && response.data.data) finalData = response.data.data;
                else if (response.success && response.data) finalData = response.data;
                else if (Array.isArray(response)) finalData = response;
                else if (Array.isArray(response.data)) finalData = response.data;
            }

            if (finalData && Array.isArray(finalData)) {
                setCampaigns(finalData);
            } else {
                setCampaigns([]);
            }

        } catch (error) {
            console.error("❌ Lỗi chi tiết tại Frontend:", error);
            message.error("Không thể tải dữ liệu tuyển dụng!");
        } finally {
            setLoading(false);
        }
    };

    // Tự động load danh sách khi mới vào trang
    useEffect(() => {
        fetchJobs();
        apiClient.get('/ThanhPho')
            .then(res => {
                // Tùy cấu trúc API trả về, thường là res.data
                const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                setThanhPhos(data);
            })
            .catch(err => console.error("Lỗi lấy danh sách thành phố", err));

        // 3. Gọi API lấy danh sách Ngành Nghề từ Backend
        apiClient.get('/NganhNghe')
            .then(res => {
                const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                setNganhNghes(data);
            })
            .catch(err => console.error("Lỗi lấy danh sách ngành nghề", err));
    }, []);

    // 👉 3. HÀM XỬ LÝ NÚT LƯU TIN
    const handleBookmark = async (maViTri) => {
        if (!maViTri) {
            message.warning("Chiến dịch này hiện chưa có vị trí cụ thể để lưu!");
            return;
        }
        try {
            const res = await apiClient.post(`/Jobs/${maViTri}/bookmark`, null, {
                headers: { maUser: 1 } // Backup: sau này thay bằng token
            });
            if (res.data && res.data.success) {
                message.success(res.data.isBookmarked ? "Đã lưu tin thành công!" : "Đã bỏ lưu tin!");
            }
        } catch (error) {
            message.error("Đã xảy ra lỗi khi lưu tin!");
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', background: '#141414', minHeight: '100vh' }}><Spin size="large" /></div>;

    return (
        <div style={{ background: '#141414', minHeight: '100vh', paddingBottom: 50 }}>

            {/* ================= HERO SECTION (TÌM KIẾM) ================= */}
            <div style={{
                backgroundImage: `linear-gradient(rgba(0, 33, 64, 0.85), rgba(22, 119, 255, 0.7)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80')`,
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                padding: '80px 20px 100px 20px', textAlign: 'center'
            }}>
                <Title level={1} style={{ color: 'white', marginBottom: 12, fontSize: 42, fontWeight: 'bold' }}>
                    Tìm kiếm công việc mơ ước của bạn
                </Title>
                <Paragraph style={{ color: '#e6f7ff', fontSize: 16, marginBottom: 45 }}>
                    Hàng ngàn cơ hội việc làm đang chờ đón bạn
                </Paragraph>

                {/* KHUNG TÌM KIẾM */}
                <div style={{
                    maxWidth: 900, margin: '0 auto', background: '#1f1f1f', padding: 8,
                    borderRadius: 8, display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '1px solid #303030'
                }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                        placeholder="Tên công ty, chiến dịch..."
                        variant="borderless"
                        style={{ flex: 2, fontSize: 15, color: '#fff' }}
                        value={searchQuery.keyword}
                        onChange={(e) => setSearchQuery({ ...searchQuery, keyword: e.target.value })}
                        onPressEnter={() => fetchJobs()} // Nhấn Enter tự tìm
                    />
                    <div style={{ width: 1, background: '#303030', margin: '5px 10px' }}></div>

                    {/* BỘ LỌC ĐỊA ĐIỂM */}
                    <Select
                        value={searchQuery.maTP || "all"}
                        onChange={(value) => {
                            const val = value === "all" ? null : value;
                            const newQuery = { ...searchQuery, maTP: val };
                            setSearchQuery(newQuery);
                            fetchJobs(newQuery);
                        }}
                        variant="borderless"
                        style={{ flex: 1, color: '#fff' }}
                        suffixIcon={<EnvironmentOutlined style={{ color: '#8c8c8c' }} />}
                        showSearch // Thêm showSearch để gõ tìm kiếm thành phố cho nhanh
                        optionFilterProp="children" // Cho phép lọc theo tên hiển thị
                    >
                        <Select.Option value="all">Tất cả địa điểm</Select.Option>
                        {/* 👉 Render danh sách thành phố từ Database */}
                        {thanhPhos.map((tp) => (
                            <Select.Option key={tp.maTP} value={tp.maTP}>
                                {tp.tenTP}
                            </Select.Option>
                        ))}
                    </Select>

                    <div style={{ width: 1, background: '#303030', margin: '5px 10px' }}></div>

                    {/* BỘ LỌC NGÀNH NGHỀ */}
                    <Select
                        value={searchQuery.maNganh || "all"}
                        onChange={(value) => {
                            const val = value === "all" ? null : value;
                            const newQuery = { ...searchQuery, maNganh: val };
                            setSearchQuery(newQuery);
                            fetchJobs(newQuery);
                        }}
                        variant="borderless"
                        style={{ flex: 1, color: '#fff' }}
                        showSearch
                        optionFilterProp="children"
                    >
                        <Select.Option value="all">Tất cả ngành nghề</Select.Option>
                        {/* 👉 Render danh sách ngành nghề từ Database */}
                        {nganhNghes.map((nganh) => (
                            <Select.Option key={nganh.maNganh} value={nganh.maNganh}>
                                {nganh.tenNganh}
                            </Select.Option>
                        ))}
                    </Select>

                    <Button
                        type="primary"
                        onClick={() => fetchJobs()}
                        style={{ background: '#fa8c16', borderColor: '#fa8c16', width: 100, height: 40, borderRadius: 6 }}
                    >
                        <SearchOutlined style={{ fontSize: 18 }} />
                    </Button>
                </div>
            </div>

            {/* ================= DANH SÁCH CHIẾN DỊCH DẠNG LƯỚI ================= */}
            <div style={{ maxWidth: 1200, margin: '30px auto 40px auto', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                    <Title level={3} style={{ color: '#e6f4ff', margin: 0 }}>Chiến dịch nổi bật</Title>
                    <a href="#" style={{ color: '#1890ff', fontSize: 15 }}>Xem tất cả →</a>
                </div>

                <Row gutter={[24, 24]}>
                    {campaigns.length === 0 ? (
                        <Col span={24} style={{ textAlign: 'center', color: '#8c8c8c', padding: 40 }}>
                            Không tìm thấy chiến dịch nào phù hợp với điều kiện lọc.
                        </Col>
                    ) : (
                        campaigns.map((campaign, index) => (
                            <Col span={8} key={campaign.maTin || campaign.id || index}>
                                <Card
                                    hoverable
                                    styles={{ body: { padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' } }}
                                    style={{ borderRadius: 12, background: '#1f1f1f', border: '1px solid #303030', height: '100%', cursor: 'pointer' }}
                                    onClick={() => {
                                        const campaignId = campaign.maTin || campaign.id;
                                        if (campaignId) navigate(`/job/${campaignId}`);
                                    }}
                                >
                                    {/* THÔNG TIN CHIẾN DỊCH VÀ CÔNG TY */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <div style={{ border: '1px solid #303030', borderRadius: 8, padding: 4, marginRight: 16, background: '#141414' }}>
                                            <Avatar shape="square" size={50} src={campaign.logo} alt={campaign.companyName} />
                                        </div>

                                        <div style={{ flex: 1, paddingRight: 25 }}>
                                            <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 15, color: '#e6f4ff', lineHeight: 1.4 }}>
                                                {campaign.tieuDeChienDich || campaign.title}
                                            </Title>
                                            <Text style={{ color: '#8c8c8c', fontSize: 13, display: 'block' }}>
                                                {campaign.companyName}
                                            </Text>
                                        </div>
                                    </div>

                                    {/* CỜ VIP & NÚT LƯU TIN (BOOKMARK) */}
                                    <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center' }}>
                                        {campaign.isPromoted && (
                                            <Tag color="#f50" style={{ marginRight: 12, fontWeight: 'bold', border: 'none' }}>HOT</Tag>
                                        )}
                                        <HeartOutlined
                                            style={{ fontSize: 18, color: '#8c8c8c', cursor: 'pointer', transition: 'color 0.3s' }}
                                            onMouseEnter={(e) => e.target.style.color = '#ff4d4f'}
                                            onMouseLeave={(e) => e.target.style.color = '#8c8c8c'}
                                            onClick={(e) => {
                                                // 👉 CHẶN EVENT: Ngăn không cho sự kiện click lan ra thẻ Card (tránh chuyển trang khi bấm lưu)
                                                e.stopPropagation();
                                                const maViTriDauTien = campaign.viTris && campaign.viTris.length > 0 ? campaign.viTris[0].maViTri || campaign.viTris[0].id : null;
                                                handleBookmark(maViTriDauTien);
                                            }}
                                        />
                                    </div>

                                    {/* HIỂN THỊ SƠ LƯỢC CÁC VỊ TRÍ BÊN TRONG */}
                                    <div style={{
                                        marginTop: 'auto', paddingTop: 16, borderTop: '1px dashed #303030', display: 'flex', flexDirection: 'column', gap: 8
                                    }}>
                                        <Text style={{ color: '#1890ff', fontSize: 13 }}>
                                            <PushpinOutlined /> Đang mở {campaign.viTris?.length || 0} vị trí:
                                        </Text>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {campaign.viTris?.slice(0, 2).map(vt => (
                                                <Tag
                                                    key={vt.maViTri || vt.id}
                                                    style={{ background: '#11284d', borderColor: '#164c7e', color: '#1677ff', margin: 0, borderRadius: 4, cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        // Bấm vào Tag vị trí cũng dẫn về trang chi tiết Chiến dịch
                                                        e.stopPropagation();
                                                        const campaignId = campaign.maTin || campaign.id;
                                                        if (campaignId) navigate(`/job/${campaignId}`);
                                                    }}
                                                >
                                                    {vt.tenViTri || vt.title}
                                                </Tag>
                                            ))}
                                            {campaign.viTris?.length > 2 && (
                                                <Tag style={{ background: '#141414', borderColor: '#303030', color: '#8c8c8c' }}>
                                                    +{campaign.viTris.length - 2}
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