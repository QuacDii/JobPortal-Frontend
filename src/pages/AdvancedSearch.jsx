import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input, Select, Button, Radio, Spin, Tag, Switch, Card, Empty, message } from 'antd';
import { 
    SearchOutlined, 
    EnvironmentOutlined, 
    FilterOutlined, 
    HeartOutlined, 
    HeartFilled,
    AppstoreOutlined,
    DollarOutlined,
    UserOutlined
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import './css/AdvancedSearch.css';

const { Option } = Select;

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const AdvancedSearch = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State giao diện & Dữ liệu
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [thanhPhos, setThanhPhos] = useState([]);
    const [phuongXas, setPhuongXas] = useState([]);
    const [nganhNghes, setNganhNghes] = useState([]);
    const [bookmarkedIds, setBookmarkedIds] = useState([]);

    // State Bộ lọc (Đọc dữ liệu từ URL Params ban đầu nếu có)
    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        maTP: searchParams.get('maTP') ? parseInt(searchParams.get('maTP')) : null,
        maPhuong: searchParams.get('maPhuong') ? parseInt(searchParams.get('maPhuong')) : null,
        maNganh: searchParams.get('maNganh') ? parseInt(searchParams.get('maNganh')) : null,
        capBac: 'Tất cả',
        mucLuong: 'Tất cả'
    });

    // 1. Tải danh sách Thành phố, Ngành nghề & Bài đã lưu khi mở trang
    useEffect(() => {
        // Tải Tỉnh / TP
        apiClient.get('/KhuVuc/ThanhPho')
            .then(res => setThanhPhos(res?.data?.data || res?.data || (Array.isArray(res) ? res : [])))
            .catch(err => console.error("Lỗi lấy danh sách TP", err));

        // Tải Ngành nghề
        apiClient.get('/NganhNghe/danh-sach')
            .then(res => setNganhNghes(res?.data?.data || res?.data || (Array.isArray(res) ? res : [])))
            .catch(err => console.error("Lỗi lấy danh sách ngành", err));

        // Nếu URL có sẵn maTP thì tải luôn Phường/Xã
        if (filters.maTP) {
            fetchPhuongXa(filters.maTP);
        }

        // Tải danh sách tin đã thả tim của User
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            const userId = decoded?.maUser || decoded?.nameid || 1;
            apiClient.get('/Jobs/bookmarked', {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId) }
            }).then(res => {
                setBookmarkedIds(res?.data?.data || res?.data || []);
            }).catch(err => console.error("Lỗi lấy bài đã lưu", err));
        }

        // Thực thi tìm kiếm ban đầu theo tham số URL
        executeSearch(filters);
    }, []);

    // 2. Hàm gọi API lấy danh sách Phường / Xã theo Tỉnh / TP
    const fetchPhuongXa = async (maTP) => {
        if (!maTP || maTP === 'all') {
            setPhuongXas([]);
            return;
        }
        try {
            const res = await apiClient.get('/KhuVuc/PhuongXa', { params: { maTP } });
            const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
            setPhuongXas(data);
        } catch (err) {
            console.error("Lỗi lấy danh sách Phường / Xã", err);
        }
    };

    // 3. Hàm gọi API Tìm kiếm đa chiều
    const executeSearch = async (currentFilters) => {
        setLoading(true);
        try {
            const params = {
                keyword: currentFilters.keyword || undefined,
                maTP: currentFilters.maTP && currentFilters.maTP !== 'all' ? currentFilters.maTP : undefined,
                maPhuong: currentFilters.maPhuong && currentFilters.maPhuong !== 'all' ? currentFilters.maPhuong : undefined,
                maNganh: currentFilters.maNganh && currentFilters.maNganh !== 'all' ? currentFilters.maNganh : undefined,
                capBac: currentFilters.capBac !== 'Tất cả' ? currentFilters.capBac : undefined,
                mucLuong: currentFilters.mucLuong !== 'Tất cả' ? currentFilters.mucLuong : undefined
            };

            const res = await apiClient.get('/Jobs/search', { params });
            const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
            setJobs(Array.isArray(data) ? data : []);

            // Cập nhật URL Params để người dùng có thể chia sẻ link tìm kiếm
            const urlParams = new URLSearchParams();
            if (params.keyword) urlParams.set('keyword', params.keyword);
            if (params.maTP) urlParams.set('maTP', params.maTP);
            if (params.maPhuong) urlParams.set('maPhuong', params.maPhuong);
            if (params.maNganh) urlParams.set('maNganh', params.maNganh);
            setSearchParams(urlParams);
        } catch (error) {
            console.error("Lỗi tìm kiếm", error);
            message.error("Lỗi khi tải danh sách việc làm!");
        } finally {
            setLoading(false);
        }
    };

    // Xử lý sự kiện bấm nút Tìm kiếm
    const handleApplyFilters = () => {
        executeSearch(filters);
    };

    // Xử lý Thả tim / Bỏ thả tim
    const toggleBookmark = async (maViTri) => {
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
                    setBookmarkedIds(prev => [...prev, maViTri]);
                    message.success("Đã lưu tin tuyển dụng!");
                } else {
                    setBookmarkedIds(prev => prev.filter(id => id !== maViTri));
                    message.info("Đã bỏ lưu tin tuyển dụng!");
                }
            }
        } catch (error) {
            message.error("Không thể lưu bài tuyển dụng lúc này!");
        }
    };

    return (
        <div className={`search-page-container ${isDarkMode ? 'dark' : 'light'}`}>
            
            {/* THANH TÌM KIẾM TRÊN CÙNG */}
            <div className="top-search-bar">
                <div className="top-search-inner">
                    {/* Từ khóa */}
                    <Input 
                        prefix={<SearchOutlined style={{ color: '#1677ff' }} />}
                        placeholder="Vị trí tuyển dụng, tên công ty..." 
                        className="search-input-field"
                        value={filters.keyword}
                        onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                        onPressEnter={handleApplyFilters}
                    />

                    {/* Tỉnh / Thành Phố */}
                    <Select 
                        placeholder="Tỉnh / Thành phố" 
                        className="search-select-field"
                        suffixIcon={<EnvironmentOutlined />}
                        value={filters.maTP || "all"}
                        onChange={(val) => {
                            const selectedTP = val === "all" ? null : val;
                            setFilters({ ...filters, maTP: selectedTP, maPhuong: null });
                            fetchPhuongXa(selectedTP);
                        }}
                        showSearch
                        optionFilterProp="children"
                    >
                        <Option value="all">Tất cả Tỉnh / TP</Option>
                        {thanhPhos.map(tp => <Option key={tp.maTp} value={tp.maTp}>{tp.tenTp}</Option>)}
                    </Select>

                    {/* Phường / Xã */}
                    <Select 
                        placeholder="Phường / Xã" 
                        className="search-select-field"
                        suffixIcon={<EnvironmentOutlined />}
                        value={filters.maPhuong || "all"}
                        disabled={!filters.maTP || filters.maTP === "all"}
                        onChange={(val) => setFilters({ ...filters, maPhuong: val === "all" ? null : val })}
                        showSearch
                        optionFilterProp="children"
                    >
                        <Option value="all">Tất cả Phường / Xã</Option>
                        {phuongXas.map(px => <Option key={px.maPhuong} value={px.maPhuong}>{px.tenPhuong}</Option>)}
                    </Select>

                    {/* Ngành Nghề */}
                    <Select 
                        placeholder="Danh mục ngành nghề" 
                        className="search-select-field"
                        suffixIcon={<AppstoreOutlined />}
                        value={filters.maNganh || "all"}
                        onChange={(val) => setFilters({...filters, maNganh: val === "all" ? null : val})}
                        showSearch
                        optionFilterProp="children"
                    >
                        <Option value="all">Tất cả ngành nghề</Option>
                        {nganhNghes.map(n => <Option key={n.maNganh} value={n.maNganh}>{n.tenNganh}</Option>)}
                    </Select>

                    {/* Nút Tìm kiếm */}
                    <Button 
                        type="primary" 
                        className="btn-search-submit" 
                        onClick={handleApplyFilters}
                    >
                        <SearchOutlined /> Tìm kiếm
                    </Button>
                </div>
            </div>

            {/* BỐ CỤC CHÍNH (SIDEBAR + MAIN LIST) */}
            <div className="main-layout">
                
                {/* 1. CỘT TRÁI: BỘ LỌC NÂNG CAO */}
                <div className="filter-sidebar">
                    <div className="filter-header">
                        <h3 className="filter-sidebar-title"><FilterOutlined /> Lọc nâng cao</h3>
                        <Switch 
                            checkedChildren="Tối" 
                            unCheckedChildren="Sáng" 
                            checked={isDarkMode} 
                            onChange={setIsDarkMode} 
                        />
                    </div>

                    {/* Cấp bậc */}
                    <div className="filter-section">
                        <div className="filter-section-title"><UserOutlined /> Cấp bậc</div>
                        <Radio.Group 
                            className="radio-group-vertical"
                            value={filters.capBac}
                            onChange={(e) => setFilters({...filters, capBac: e.target.value})}
                        >
                            <Radio value="Tất cả">Tất cả cấp bậc</Radio>
                            <Radio value="Thực tập sinh">Thực tập sinh / Intern</Radio>
                            <Radio value="Nhân viên">Nhân viên / Executive</Radio>
                            <Radio value="Trưởng nhóm">Trưởng nhóm / Team Leader</Radio>
                            <Radio value="Trưởng/Phó phòng">Trưởng/Phó phòng</Radio>
                            <Radio value="Quản lý / Giám sát">Quản lý / Giám sát</Radio>
                        </Radio.Group>
                    </div>

                    {/* Mức lương */}
                    <div className="filter-section">
                        <div className="filter-section-title"><DollarOutlined /> Mức lương</div>
                        <Radio.Group 
                            className="radio-group-vertical"
                            value={filters.mucLuong}
                            onChange={(e) => setFilters({...filters, mucLuong: e.target.value})}
                        >
                            <Radio value="Tất cả">Tất cả mức lương</Radio>
                            <Radio value="Dưới 10 triệu">Dưới 10 triệu</Radio>
                            <Radio value="10 - 15 triệu">10 - 15 triệu</Radio>
                            <Radio value="15 - 20 triệu">15 - 20 triệu</Radio>
                            <Radio value="Trên 20 triệu">Trên 20 triệu</Radio>
                            <Radio value="Thỏa thuận">Thỏa thuận</Radio>
                        </Radio.Group>
                    </div>

                    {/* Nút Áp dụng bộ lọc */}
                    <Button 
                        type="primary" 
                        block 
                        className="btn-apply-sidebar"
                        onClick={handleApplyFilters}
                    >
                        Áp dụng bộ lọc
                    </Button>
                </div>

                {/* 2. CỘT PHẢI: DANH SÁCH BÀI TUYỂN DỤNG */}
                <div className="job-list-container">
                    <div className="result-count-header">
                        <span>
                            Tìm thấy <strong style={{ color: '#1677ff', fontSize: 18 }}>{jobs.length}</strong> cơ hội việc làm phù hợp
                        </span>
                    </div>

                    <Spin spinning={loading} size="large">
                        <div className="job-cards-wrapper">
                            {jobs.map((job, idx) => {
                                const vitriDauTien = job.viTris && job.viTris.length > 0 ? job.viTris[0] : {};
                                const maViTriId = vitriDauTien.id || vitriDauTien.maViTri;
                                const isBookmarked = bookmarkedIds.includes(maViTriId);

                                return (
                                    <div 
                                        className={`job-item-card ${job.isPromoted ? 'promoted-item' : ''}`} 
                                        key={idx}
                                        onClick={() => navigate(`/job/${job.maTin}`)}
                                    >
                                        <div className="job-card-header">
                                            <img src={job.logo || 'https://via.placeholder.com/64'} alt={job.companyName} className="company-logo" />
                                            
                                            <div className="job-meta">
                                                <h3 className="job-campaign-title">
                                                    {job.tieuDeChienDich}
                                                    {job.isPromoted && <Tag color="volcano" className="vip-tag">HOT PRO</Tag>}
                                                </h3>
                                                <div className="company-name">{job.companyName}</div>
                                                
                                                <div className="job-location">
                                                    <EnvironmentOutlined /> {vitriDauTien.locationName || 'Toàn quốc'}
                                                </div>
                                            </div>

                                            <div className="job-action-box">
                                                <div className="salary-text">
                                                    {vitriDauTien.salaryRange || vitriDauTien.luong || 'Thỏa thuận'}
                                                </div>
                                                
                                                <div 
                                                    className="heart-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleBookmark(maViTriId);
                                                    }}
                                                >
                                                    {isBookmarked ? (
                                                        <HeartFilled style={{ color: '#ff4d4f', fontSize: 22 }} />
                                                    ) : (
                                                        <HeartOutlined style={{ color: '#94a3b8', fontSize: 22 }} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Các thẻ vị trí tuyển dụng đang mở */}
                                        <div className="job-tags-row">
                                            {job.viTris?.map(vt => (
                                                <Tag color="blue" key={vt.id || vt.maViTri} className="position-tag">
                                                    {vt.title || vt.tenViTri}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {jobs.length === 0 && !loading && (
                                <Card className="empty-card">
                                    <Empty description="Không tìm thấy việc làm nào phù hợp với yêu cầu của bạn." />
                                </Card>
                            )}
                        </div>
                    </Spin>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;