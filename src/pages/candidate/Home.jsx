import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Row, Col, Card, Input, Select, Button, Spin, message, Avatar, Tag, Carousel } from 'antd';
import {
    SearchOutlined,
    EnvironmentOutlined,
    HeartOutlined,
    HeartFilled,
    PushpinOutlined,
    RightOutlined,
    FireOutlined,
    CrownOutlined
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';
import '../css/Home.css';

const { Title, Text, Paragraph } = Typography;

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const Home = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [thanhPhos, setThanhPhos] = useState([]);
    const [phuongXas, setPhuongXas] = useState([]);

    // 🌟 Khai báo state nganhNghesTree bên trong Component
    const [nganhNghesTree, setNganhNghesTree] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [suggestedKeywords, setSuggestedKeywords] = useState([]);
    const [bookmarkedViTris, setBookmarkedViTris] = useState([]);

    const [searchQuery, setSearchQuery] = useState({
        keyword: '',
        maTP: null,
        maPhuong: null,
        maNganh: null
    });

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/Jobs');
            let finalData = null;
            if (response) {
                if (response.data && response.data.data) finalData = response.data.data;
                else if (response.success && response.data) finalData = response.data;
                else if (Array.isArray(response)) finalData = response;
                else if (Array.isArray(response.data)) finalData = response.data;
            }
            setCampaigns(Array.isArray(finalData) ? finalData : []);
        } catch (error) {
            console.error("❌ Lỗi khi tải chiến dịch:", error);
            message.error("Không thể tải dữ liệu tuyển dụng!");
        } finally {
            setLoading(false);
        }
    };

    const fetchPhuongXa = async (maTP) => {
        if (!maTP || maTP === 'all') {
            setPhuongXas([]);
            return;
        }
        try {
            const res = await apiClient.get('/KhuVuc/PhuongXa', { params: { maTP } });
            const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
            const filteredWards = data.filter(px => px.maTP === maTP || px.maTp === maTP);
            setPhuongXas(filteredWards);
        } catch (err) {
            console.error("Lỗi lấy danh sách phường xã", err);
        }
    };

    useEffect(() => {
        fetchJobs();

        const token = localStorage.getItem('token');
        let userId = null;
        if (token) {
            const decoded = parseJwt(token);
            userId = decoded?.maUser ||
                decoded?.nameid ||
                decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

            apiClient.get('/Jobs/bookmarked', {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId || 1) }
            }).then(res => {
                const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                setBookmarkedViTris(data);
            }).catch(err => console.error("Lỗi lấy bài đã lưu", err));
        }

        // Tải từ khóa gợi ý
        apiClient.get('/Jobs/suggestions', {
            headers: userId ? { maUser: parseInt(userId) } : {}
        }).then(res => {
            const keywords = res?.data?.data || res?.data || [];
            if (Array.isArray(keywords) && keywords.length > 0) {
                setSuggestedKeywords(keywords);
            } else {
                setSuggestedKeywords(['Lập trình viên', 'Thực tập sinh', 'Marketing', 'Kinh doanh']);
            }
        }).catch(() => {
            setSuggestedKeywords(['Lập trình viên', 'Thực tập sinh', 'Marketing', 'Kinh doanh']);
        });

        // Tải danh sách Thành phố
        apiClient.get('/KhuVuc/ThanhPho')
            .then(res => setThanhPhos(res?.data?.data || res?.data || (Array.isArray(res) ? res : [])))
            .catch(err => console.error("Lỗi lấy danh sách thành phố", err));

        // Tải danh sách Ngành nghề dạng Cây
        apiClient.get('/NganhNghe/tree')
            .then(res => {
                const treeData = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
                if (Array.isArray(treeData)) {
                    setNganhNghesTree(treeData);
                    if (treeData.length > 0) setActiveCategory(treeData[0]);
                }
            })
            .catch(err => console.error("Lỗi lấy danh sách ngành nghề tree", err));
    }, []);

    const handleBookmark = async (maViTri) => {
        if (!maViTri) {
            message.warning("Chiến dịch này hiện chưa có vị trí cụ thể để lưu!");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            message.warning("Vui lòng đăng nhập để lưu bài tuyển dụng!");
            return;
        }

        const decoded = parseJwt(token);
        const userId = decoded?.maUser || decoded?.nameid || 1;

        try {
            const res = await apiClient.post(`/Jobs/${maViTri}/bookmark`, null, {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId) }
            });

            const success = res?.success !== undefined ? res.success : res?.data?.success;
            const isBookmarked = res?.isBookmarked !== undefined ? res.isBookmarked : res?.data?.isBookmarked;

            if (success) {
                if (isBookmarked) {
                    setBookmarkedViTris(prev => [...prev, maViTri]);
                    message.success("Đã lưu tin tuyển dụng!");
                } else {
                    setBookmarkedViTris(prev => prev.filter(id => id !== maViTri));
                    message.info("Đã bỏ lưu tin tuyển dụng!");
                }
            }
        } catch (error) {
            message.error("Đã xảy ra lỗi khi lưu tin!");
        }
    };

    const handleSearchNavigate = () => {
        const params = new URLSearchParams();
        if (searchQuery.keyword) params.append('keyword', searchQuery.keyword);
        if (searchQuery.maTP) params.append('maTP', searchQuery.maTP);
        if (searchQuery.maPhuong) params.append('maPhuong', searchQuery.maPhuong);
        if (searchQuery.maNganh) params.append('maNganh', searchQuery.maNganh);

        const queryString = params.toString();
        navigate(queryString ? `/jobs?${queryString}` : '/jobs');
    };

    const vipCampaigns = campaigns.filter(c => c.isPromoted === true);
    const regularCampaigns = campaigns.filter(c => c.isPromoted !== true);

    if (loading) return <div style={{ textAlign: 'center', padding: '120px 0', background: '#f8fafc', minHeight: '100vh' }}><Spin size="large" /></div>;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 60, color: '#1f2937' }}>

            {/* HERO SECTION */}
            <div className="hero-wrapper">
                <div className="hero-content-inner">
                    <Title level={1} style={{ color: '#ffffff', marginBottom: 8, fontSize: 36, fontWeight: '800' }}>
                        Tạo CV, Tìm Việc Làm, Tuyển Dụng Hiệu Quả
                    </Title>
                    <Paragraph style={{ color: '#e6f4ff', fontSize: 15, marginBottom: 24 }}>
                        Hãy chia sẻ nhu cầu công việc để nhận gợi ý việc làm tốt nhất
                    </Paragraph>

                    {/* KHUNG TÌM KIẾM HERO */}
                    <div className="hero-search-box" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#1677ff', fontSize: 18, marginRight: 6 }} />}
                            placeholder="Vị trí tuyển dụng, tên công ty..."
                            variant="borderless"
                            style={{ flex: 1.5, minWidth: 200, fontSize: 15 }}
                            value={searchQuery.keyword}
                            onChange={(e) => setSearchQuery({ ...searchQuery, keyword: e.target.value })}
                            onPressEnter={handleSearchNavigate}
                        />

                        <div style={{ width: 1, height: 28, background: '#cbd5e1' }}></div>

                        {/* LỌC TỈNH / THÀNH PHỐ */}
                        <Select
                            value={searchQuery.maTP || "all"}
                            onChange={(value) => {
                                const val = value === "all" ? null : value;
                                setSearchQuery({ ...searchQuery, maTP: val, maPhuong: null });
                                fetchPhuongXa(val);
                            }}
                            variant="borderless"
                            style={{ flex: 1, minWidth: 150 }}
                            suffixIcon={<EnvironmentOutlined style={{ color: '#64748b' }} />}
                            showSearch
                            optionFilterProp="children"
                        >
                            <Select.Option value="all">Tỉnh / Thành phố</Select.Option>
                            {thanhPhos.map((tp) => (
                                <Select.Option key={tp.maTp} value={tp.maTp}>{tp.tenTp}</Select.Option>
                            ))}
                        </Select>

                        <div style={{ width: 1, height: 28, background: '#cbd5e1' }}></div>

                        {/* LỌC PHƯỜNG / XÃ */}
                        <Select
                            value={searchQuery.maPhuong || "all"}
                            disabled={!searchQuery.maTP || searchQuery.maTP === "all"}
                            onChange={(value) => {
                                const val = value === "all" ? null : value;
                                setSearchQuery({ ...searchQuery, maPhuong: val });
                            }}
                            variant="borderless"
                            style={{ flex: 1, minWidth: 150 }}
                            suffixIcon={<EnvironmentOutlined style={{ color: '#64748b' }} />}
                            showSearch
                            optionFilterProp="children"
                        >
                            <Select.Option value="all">Phường / Xã</Select.Option>
                            {phuongXas.map((px) => (
                                <Select.Option key={px.maPhuong} value={px.maPhuong}>{px.tenPhuong}</Select.Option>
                            ))}
                        </Select>

                        <Button
                            type="primary"
                            className="btn-search-hero"
                            onClick={handleSearchNavigate}
                        >
                            <SearchOutlined style={{ fontSize: 16 }} /> Tìm kiếm
                        </Button>
                    </div>

                    {/* GỢI Ý TỪ KHÓA TÌM KIẾM ĐỘNG */}
                    <div className="search-tag-hint">
                        <span style={{ fontWeight: 'bold' }}>Gợi ý:</span>
                        {suggestedKeywords.map((kw, idx) => (
                            <span
                                key={idx}
                                className="hint-item"
                                onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(kw)}`)}
                            >
                                {kw}
                            </span>
                        ))}
                    </div>

                    {/* KHUNG BẢNG DANH MỤC LỚN */}
                    <div className="category-hero-grid">
                        <div className="category-sidebar">
                            {nganhNghesTree.slice(0, 6).map((cat) => (
                                <div
                                    key={cat.maNganh}
                                    className={`category-item ${activeCategory?.maNganh === cat.maNganh ? 'active' : ''}`}
                                    onMouseEnter={() => setActiveCategory(cat)}
                                >
                                    <span>{cat.tenNganh}</span>
                                    <RightOutlined style={{ fontSize: 12, opacity: 0.6 }} />
                                </div>
                            ))}
                        </div>

                        <div className="category-flyout">
                            {activeCategory && activeCategory.danhSachCon && activeCategory.danhSachCon.length > 0 ? (
                                <div>
                                    <Title level={5} style={{ color: '#2563eb', marginBottom: 18, fontWeight: '700' }}>
                                        {activeCategory.tenNganh} — Vị trí tuyển dụng hàng đầu
                                    </Title>
                                    <Row gutter={[16, 14]}>
                                        {activeCategory.danhSachCon.map((sub) => (
                                            <Col span={12} key={sub.maNganh}>
                                                <div
                                                    className="sub-category-card"
                                                    onClick={() => navigate(`/jobs?maNganh=${sub.maNganh}`)}
                                                >
                                                    <Text strong style={{ display: 'block', color: '#1e293b', fontSize: 14, paddingRight: 20 }}>
                                                        {sub.tenNganh}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {sub.viTriChuyenMon?.length || 0} chuyên môn mở rộng
                                                    </Text>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ) : (
                                <Carousel autoplay style={{ borderRadius: 12, overflow: 'hidden' }}>
                                    <div>
                                        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=60" alt="Banner 1" style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=60" alt="Banner 2" style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
                                    </div>
                                </Carousel>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* VIỆC LÀM VIP */}
            <div style={{ maxWidth: 1200, margin: '40px auto 0 auto', padding: '0 20px' }}>
                <div className="vip-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <Title level={3} style={{ color: '#d46b08', margin: 0, fontWeight: '700' }}>
                                <CrownOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                                THƯƠNG HIỆU TUYỂN DỤNG HÀNG ĐẦU (VIP)
                            </Title>
                            <Text style={{ color: '#475569', fontSize: 14 }}>
                                Các doanh nghiệp hàng đầu đang mở cơ hội việc làm hấp dẫn
                            </Text>
                        </div>
                        <Button type="link" onClick={() => navigate('/jobs')} style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                            Xem tất cả VIP <RightOutlined />
                        </Button>
                    </div>

                    <Row gutter={[20, 20]}>
                        {vipCampaigns.length === 0 ? (
                            <Col span={24}>
                                <Text type="secondary" style={{ fontStyle: 'italic' }}>Hiện chưa có tin tuyển dụng VIP nổi bật.</Text>
                            </Col>
                        ) : (
                            vipCampaigns.map((campaign, index) => {
                                const maViTriDauTien = campaign.viTris && campaign.viTris.length > 0 ? (campaign.viTris[0].id || campaign.viTris[0].maViTri) : null;
                                const isBookmarked = bookmarkedViTris.includes(maViTriDauTien);

                                return (
                                    <Col xs={24} md={12} lg={8} key={campaign.maTin || index}>
                                        <Card
                                            hoverable
                                            className="vip-card"
                                            styles={{ body: { padding: '20px' } }}
                                            onClick={() => navigate(`/job/${campaign.maTin || campaign.id}`)}
                                        >
                                            <div className="vip-badge">HOT PRO</div>

                                            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                                <Avatar shape="square" size={56} src={campaign.logo} style={{ border: '1px solid #e2e8f0', background: '#fff' }} />
                                                <div style={{ flex: 1, paddingRight: 20 }}>
                                                    <Title level={5} style={{ margin: 0, color: '#0f172a', fontSize: 16 }}>{campaign.tieuDeChienDich || campaign.title}</Title>
                                                    <Text style={{ color: '#0284c7', fontSize: 13, fontWeight: '600', display: 'block', marginTop: 2 }}>{campaign.companyName}</Text>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Tag color="orange" style={{ fontWeight: 'bold' }}>
                                                    Đang mở {campaign.viTris?.length || 0} vị trí
                                                </Tag>
                                                {isBookmarked ? (
                                                    <HeartFilled className="bookmark-icon bookmarked" onClick={(e) => { e.stopPropagation(); handleBookmark(maViTriDauTien); }} />
                                                ) : (
                                                    <HeartOutlined className="bookmark-icon" onClick={(e) => { e.stopPropagation(); handleBookmark(maViTriDauTien); }} />
                                                )}
                                            </div>
                                        </Card>
                                    </Col>
                                );
                            })
                        )}
                    </Row>
                </div>
            </div>

            {/* VIỆC LÀM MỚI CẬP NHẬT */}
            <div style={{ maxWidth: 1200, margin: '20px auto 50px auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={3} style={{ color: '#1f2937', margin: 0, fontWeight: '700' }}>
                            <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                            Việc Làm Mới Cập Nhật
                        </Title>
                        <Text style={{ color: '#6b7280', fontSize: 14 }}>
                            Hàng ngàn công việc chất lượng dành cho bạn
                        </Text>
                    </div>

                    <Button type="link" onClick={() => navigate('/jobs')} style={{ color: '#1677ff', fontWeight: '600' }}>
                        Xem tất cả <RightOutlined style={{ fontSize: 12 }} />
                    </Button>
                </div>

                <Row gutter={[24, 24]}>
                    {regularCampaigns.length === 0 ? (
                        <Col span={24}>
                            <Card style={{ textAlign: 'center', background: '#ffffff', borderRadius: 12, padding: '40px 0' }}>
                                <Text style={{ color: '#9ca3af' }}>Không tìm thấy chiến dịch tuyển dụng nào.</Text>
                            </Card>
                        </Col>
                    ) : (
                        regularCampaigns.map((campaign, index) => {
                            const maViTriDauTien = campaign.viTris && campaign.viTris.length > 0 ? (campaign.viTris[0].id || campaign.viTris[0].maViTri) : null;
                            const isBookmarked = bookmarkedViTris.includes(maViTriDauTien);

                            return (
                                <Col xs={24} md={12} lg={8} key={campaign.maTin || index}>
                                    <Card
                                        hoverable
                                        className="regular-card"
                                        styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' } }}
                                        onClick={() => navigate(`/job/${campaign.maTin || campaign.id}`)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                            <Avatar shape="square" size={52} src={campaign.logo} style={{ border: '1px solid #f0f0f0', background: '#fff' }} />
                                            <div style={{ flex: 1, paddingRight: 28 }}>
                                                <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 16, color: '#111827', fontWeight: '700' }}>
                                                    {campaign.tieuDeChienDich || campaign.title}
                                                </Title>
                                                <Text style={{ color: '#4b5563', fontSize: 13, display: 'block' }}>
                                                    {campaign.companyName}
                                                </Text>
                                            </div>
                                        </div>

                                        <div style={{ position: 'absolute', top: 18, right: 18 }}>
                                            {isBookmarked ? (
                                                <HeartFilled className="bookmark-icon bookmarked" onClick={(e) => { e.stopPropagation(); handleBookmark(maViTriDauTien); }} />
                                            ) : (
                                                <HeartOutlined className="bookmark-icon" onClick={(e) => { e.stopPropagation(); handleBookmark(maViTriDauTien); }} />
                                            )}
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px dashed #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Text style={{ color: '#1677ff', fontSize: 13, fontWeight: '600' }}>
                                                <PushpinOutlined style={{ marginRight: 4 }} /> Đang mở {campaign.viTris?.length || 0} vị trí tuyển dụng
                                            </Text>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {campaign.viTris?.slice(0, 2).map(vt => (
                                                    <Tag key={vt.id || vt.maViTri} style={{ background: '#e6f4ff', borderColor: '#91caff', color: '#0958d9', margin: 0 }}>
                                                        {vt.title || vt.tenViTri}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })
                    )}
                </Row>
            </div>
        </div>
    );
};

export default Home;