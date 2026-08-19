import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input, Select, Radio, Checkbox, Button, Spin, message, Empty } from 'antd';
import {
    SearchOutlined,
    EnvironmentOutlined,
    FilterOutlined,
    HeartOutlined,
    HeartFilled,
    DownOutlined,
    UpOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import './css/AdvancedSearch.css';

const { Option } = Select;

// 🌟 1. HÀM GIẢI MÃ TOKEN AN TOÀN VỚI KÝ TỰ TIẾNG VIỆT (UNICODE)
const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        return {
            userId: decoded.nameid || 
                    decoded.maUser || 
                    decoded.id || 
                    decoded.sub || 
                    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
        };
    } catch (error) {
        return null;
    }
};

const AdvancedSearch = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State Dữ liệu
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nganhTree, setNganhTree] = useState([]);
    const [thanhPhos, setThanhPhos] = useState([]);
    const [phuongXas, setPhuongXas] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState([]);
    
    // 🌟 2. QUẢN LÝ CẢ ID VỊ TRÍ VÀ ID CHIẾN DỊCH ĐÃ LƯU
    const [bookmarkedViTriIds, setBookmarkedViTriIds] = useState([]);
    const [bookmarkedMaTinIds, setBookmarkedMaTinIds] = useState([]);
    
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Quản lý danh sách ID ngành cha & con độc lập
    const [selectedChaIds, setSelectedChaIds] = useState([]);
    const [selectedConIds, setSelectedConIds] = useState([]);

    // State Bộ lọc chung
    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        maTP: searchParams.get('maTP') ? parseInt(searchParams.get('maTP'), 10) : null,
        maPhuong: searchParams.get('maPhuong') ? parseInt(searchParams.get('maPhuong'), 10) : null,
        loaiCongTy: searchParams.get('loaiCongTy') || 'all',
        mucLuongRadio: 'all',
        tuLuong: '',
        denLuong: '',
        kinhNghiem: [],
        capBac: []
    });

    const getParentId = (cat) => cat.maNganh || cat.maNganhCha;
    const getChildrenList = (cat) => cat.danhSachCon || cat.nganhNgheCons || cat.children || [];
    const getChildId = (sub) => sub.maNganh || sub.maNganhCon;

    useEffect(() => {
        apiClient.get('/KhuVuc/ThanhPho')
            .then(res => setThanhPhos(res?.data?.data || res?.data || (Array.isArray(res) ? res : [])))
            .catch(err => console.error("Lỗi lấy danh sách Tỉnh/TP", err));

        apiClient.get('/NganhNghe/tree')
            .then(res => {
                const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                const treeData = Array.isArray(data) ? data : [];
                setNganhTree(treeData);

                const paramMaNganh = searchParams.get('maNganh');
                const paramLoaiNganh = searchParams.get('loaiNganh');

                let initCha = [];
                let initCon = [];

                if (paramMaNganh) {
                    const parsedIds = paramMaNganh.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
                    if (paramLoaiNganh === 'cha') {
                        initCha = parsedIds;
                        treeData.forEach(cat => {
                            if (parsedIds.includes(getParentId(cat))) {
                                const childIds = getChildrenList(cat).map(c => getChildId(c));
                                initCon = [...initCon, ...childIds];
                            }
                        });
                    } else {
                        initCon = parsedIds;
                    }
                }

                setSelectedChaIds(initCha);
                setSelectedConIds([...new Set(initCon)]);
                executeSearch(filters, initCha, [...new Set(initCon)]);
            })
            .catch(err => console.error("Lỗi lấy danh mục ngành", err));

        if (filters.maTP) {
            fetchPhuongXa(filters.maTP);
        }

        // 🌟 LẤY CHÍNH XÁC USER ID TỪ TOKEN
        const token = localStorage.getItem('token');
        if (token) {
            const userInfo = getUserInfoFromToken(token);
            const userId = userInfo?.userId || 1;

            apiClient.get('/Jobs/bookmarked', {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId, 10) }
            }).then(res => {
                const raw = res?.data !== undefined ? res.data : res;
                const vIds = raw?.viTriIds || raw?.data || (Array.isArray(raw) ? raw : []);
                const tIds = raw?.maTinIds || [];
                setBookmarkedViTriIds(vIds.map(Number));
                setBookmarkedMaTinIds(tIds.map(Number));
            }).catch(err => console.error("Lỗi lấy bài đã lưu", err));
        }
    }, []);

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

    const toggleExpandCategory = (pId) => {
        setExpandedCategories(prev =>
            prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
        );
    };

    const executeSearch = async (currentFilters, chaIds = selectedChaIds, conIds = selectedConIds) => {
        setLoading(true);
        try {
            const allSelectedNganh = [...new Set([...chaIds, ...conIds])];

            const parsedTuLuong = currentFilters.tuLuong ? parseFloat(currentFilters.tuLuong) : undefined;
            const parsedDenLuong = currentFilters.denLuong ? parseFloat(currentFilters.denLuong) : undefined;

            const params = {
                keyword: currentFilters.keyword?.trim() || undefined,
                maTP: currentFilters.maTP && currentFilters.maTP !== 'all' ? currentFilters.maTP : undefined,
                maPhuong: currentFilters.maPhuong && currentFilters.maPhuong !== 'all' ? currentFilters.maPhuong : undefined,
                maNganh: allSelectedNganh.length > 0 ? allSelectedNganh.join(',') : undefined,
                isPromoted: currentFilters.loaiCongTy === 'pro' ? true : undefined,
                mucLuongRadio: currentFilters.mucLuongRadio !== 'all' ? currentFilters.mucLuongRadio : undefined,
                tuLuong: !isNaN(parsedTuLuong) ? parsedTuLuong : undefined,
                denLuong: !isNaN(parsedDenLuong) ? parsedDenLuong : undefined,
                kinhNghiem: currentFilters.kinhNghiem.length > 0 ? currentFilters.kinhNghiem.join(',') : undefined,
                capBac: currentFilters.capBac.length > 0 ? currentFilters.capBac.join(',') : undefined
            };

            const res = await apiClient.get('/Jobs/search', { params });
            const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
            setJobs(Array.isArray(data) ? data : []);

            const urlParams = new URLSearchParams();
            if (params.keyword) urlParams.set('keyword', params.keyword);
            if (params.maTP) urlParams.set('maTP', params.maTP);
            if (params.maPhuong) urlParams.set('maPhuong', params.maPhuong);
            if (params.maNganh) urlParams.set('maNganh', params.maNganh);
            if (currentFilters.loaiCongTy && currentFilters.loaiCongTy !== 'all') {
                urlParams.set('loaiCongTy', currentFilters.loaiCongTy);
            }
            setSearchParams(urlParams);
        } catch (error) {
            console.error("Lỗi tìm kiếm", error);
            message.error("Không thể tải danh sách việc làm!");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleParent = (cat) => {
        const pId = getParentId(cat);
        const children = getChildrenList(cat);
        const childIds = children.map(c => getChildId(c));

        const isParentSelected = selectedChaIds.includes(pId);

        let newChaIds = [];
        let newConIds = [];

        if (isParentSelected) {
            newChaIds = selectedChaIds.filter(id => id !== pId);
            newConIds = selectedConIds.filter(id => !childIds.includes(id));
        } else {
            newChaIds = [...new Set([...selectedChaIds, pId])];
            newConIds = [...new Set([...selectedConIds, ...childIds])];
        }

        setSelectedChaIds(newChaIds);
        setSelectedConIds(newConIds);
        executeSearch(filters, newChaIds, newConIds);
    };

    const handleToggleChild = (cat, sub) => {
        const pId = getParentId(cat);
        const cId = getChildId(sub);
        const children = getChildrenList(cat);
        const childIds = children.map(c => getChildId(c));

        const isChildSelected = selectedConIds.includes(cId);

        let newConIds = [];
        if (isChildSelected) {
            newConIds = selectedConIds.filter(id => id !== cId);
        } else {
            newConIds = [...new Set([...selectedConIds, cId])];
        }

        const allChildrenSelected = childIds.length > 0 && childIds.every(id => newConIds.includes(id));

        let newChaIds = [...selectedChaIds];
        if (allChildrenSelected) {
            if (!newChaIds.includes(pId)) newChaIds.push(pId);
        } else {
            newChaIds = newChaIds.filter(id => id !== pId);
        }

        setSelectedChaIds(newChaIds);
        setSelectedConIds(newConIds);
        executeSearch(filters, newChaIds, newConIds);
    };

    const handleResetFilters = () => {
        const resetState = {
            keyword: '',
            maTP: null,
            maPhuong: null,
            loaiCongTy: 'all',
            mucLuongRadio: 'all',
            tuLuong: '',
            denLuong: '',
            kinhNghiem: [],
            capBac: []
        };
        setPhuongXas([]);
        setSelectedChaIds([]);
        setSelectedConIds([]);
        setFilters(resetState);
        setSearchParams({});
        executeSearch(resetState, [], []);
    };

    // 🌟 3. TOGGLE BOOKMARK ĐỒNG BỘ CẢ VỊ TRÍ LẪN CHIẾN DỊCH
    const toggleBookmark = async (maViTri, maTin) => {
        const token = localStorage.getItem('token');
        if (!token) return message.warning("Vui lòng đăng nhập để lưu bài!");

        const userInfo = getUserInfoFromToken(token);
        const userId = userInfo?.userId || 1;

        try {
            const res = await apiClient.post(`/Jobs/${maViTri}/bookmark`, null, {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId, 10) }
            });
            const result = res?.data !== undefined ? res.data : res;
            const isBookmarked = result?.isBookmarked;

            const targetViTriId = Number(maViTri);
            const targetTinId = Number(maTin);

            if (isBookmarked) {
                setBookmarkedViTriIds(prev => [...new Set([...prev, targetViTriId])]);
                if (targetTinId) setBookmarkedMaTinIds(prev => [...new Set([...prev, targetTinId])]);
                message.success("Đã lưu tin tuyển dụng!");
            } else {
                setBookmarkedViTriIds(prev => prev.filter(id => id !== targetViTriId));
                if (targetTinId) setBookmarkedMaTinIds(prev => prev.filter(id => id !== targetTinId));
                message.info("Đã bỏ lưu tin!");
            }
        } catch (err) {
            message.error("Lỗi khi lưu tin!");
        }
    };

    const displayedCategories = showAllCategories ? nganhTree : nganhTree.slice(0, 5);

    return (
        <div className="topcv-search-container">
            {/* THANH TÌM KIẾM TRÊN CÙNG */}
            <div className="topcv-header-search">
                <div className="topcv-search-inner">
                    <Input
                        prefix={<SearchOutlined style={{ color: '#1677ff', fontSize: 16 }} />}
                        placeholder="Vị trí tuyển dụng, tên công ty..."
                        className="topcv-input-search"
                        value={filters.keyword}
                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                        onPressEnter={() => executeSearch(filters)}
                    />

                    <Select
                        placeholder="Tỉnh / Thành phố"
                        className="topcv-select-search"
                        value={filters.maTP || "all"}
                        onChange={(val) => {
                            const selectedTP = val === "all" ? null : val;
                            const updated = { ...filters, maTP: selectedTP, maPhuong: null };
                            setFilters(updated);
                            fetchPhuongXa(selectedTP);
                            executeSearch(updated);
                        }}
                        showSearch
                        optionFilterProp="children"
                        suffixIcon={<EnvironmentOutlined style={{ color: '#64748b' }} />}
                    >
                        <Option value="all">Tất cả Tỉnh / TP</Option>
                        {thanhPhos.map(tp => (
                            <Option key={tp.maTp} value={tp.maTp}>{tp.tenTp}</Option>
                        ))}
                    </Select>

                    <Select
                        placeholder="Phường / Xã"
                        className="topcv-select-search"
                        value={filters.maPhuong || "all"}
                        disabled={!filters.maTP || filters.maTP === "all"}
                        onChange={(val) => {
                            const updated = { ...filters, maPhuong: val === "all" ? null : val };
                            setFilters(updated);
                            executeSearch(updated);
                        }}
                        showSearch
                        optionFilterProp="children"
                        suffixIcon={<EnvironmentOutlined style={{ color: '#64748b' }} />}
                    >
                        <Option value="all">Tất cả Phường / Xã</Option>
                        {phuongXas.map(px => (
                            <Option key={px.maPhuong} value={px.maPhuong}>{px.tenPhuong}</Option>
                        ))}
                    </Select>

                    <Button
                        type="primary"
                        className="topcv-btn-search"
                        onClick={() => executeSearch(filters)}
                    >
                        Tìm kiếm
                    </Button>
                </div>
            </div>

            {/* BỐ CỤC NỘI DUNG CHÍNH */}
            <div className="topcv-main-layout">
                {/* SIDEBAR BỘ LỌC BÊN TRÁI */}
                <div className="topcv-sidebar-filter">
                    <div className="filter-title-main">
                        <FilterOutlined style={{ color: '#1677ff' }} /> Lọc nâng cao
                    </div>

                    <div className="filter-group">
                        <div className="filter-group-title">Theo danh mục nghề</div>
                        <div className="category-tree-list">
                            {displayedCategories.map((cat) => {
                                const pId = getParentId(cat);
                                const children = getChildrenList(cat);
                                const isParentChecked = selectedChaIds.includes(pId);
                                const hasChildSelected = children.some(c => selectedConIds.includes(getChildId(c)));

                                const isExpanded = expandedCategories.includes(pId) || isParentChecked || hasChildSelected;

                                return (
                                    <div key={pId} className="category-tree-item">
                                        <div className="category-parent-header">
                                            <Checkbox
                                                checked={isParentChecked}
                                                onChange={() => handleToggleParent(cat)}
                                            >
                                                <span className={`cat-name ${isParentChecked ? 'active' : ''}`}>
                                                    {cat.tenNganh || cat.tenNganhCha}
                                                </span>
                                            </Checkbox>

                                            {children.length > 0 && (
                                                <span className="expand-icon" onClick={() => toggleExpandCategory(pId)}>
                                                    {isExpanded ? <UpOutlined /> : <DownOutlined />}
                                                </span>
                                            )}
                                        </div>

                                        {isExpanded && children.length > 0 && (
                                            <div className="category-chips-container">
                                                {children.map((sub) => {
                                                    const cId = getChildId(sub);
                                                    const isChildSelected = selectedConIds.includes(cId);

                                                    return (
                                                        <div
                                                            key={cId}
                                                            className={`sub-cat-chip ${isChildSelected ? 'selected' : ''}`}
                                                            onClick={() => handleToggleChild(cat, sub)}
                                                        >
                                                            {sub.tenNganh || sub.tenNganhCon}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {nganhTree.length > 5 && (
                            <div
                                className="toggle-see-more-btn"
                                onClick={() => setShowAllCategories(!showAllCategories)}
                            >
                                {showAllCategories ? (
                                    <>Thu gọn <UpOutlined style={{ fontSize: 11 }} /></>
                                ) : (
                                    <>Xem thêm ({nganhTree.length - 5} ngành khác) <DownOutlined style={{ fontSize: 11 }} /></>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="filter-divider"></div>

                    <div className="filter-group">
                        <div className="filter-group-title">Loại công ty</div>
                        <Radio.Group
                            value={filters.loaiCongTy}
                            onChange={(e) => {
                                const updated = { ...filters, loaiCongTy: e.target.value };
                                setFilters(updated);
                                executeSearch(updated);
                            }}
                        >
                            <div className="radio-grid-2col">
                                <Radio value="all">Tất cả</Radio>
                                <Radio value="pro">Pro Company</Radio>
                            </div>
                        </Radio.Group>
                    </div>

                    <div className="filter-divider"></div>

                    <div className="filter-group">
                        <div className="filter-group-title">Mức lương</div>
                        <Radio.Group
                            value={filters.mucLuongRadio}
                            onChange={(e) => {
                                const updated = { ...filters, mucLuongRadio: e.target.value };
                                setFilters(updated);
                                executeSearch(updated);
                            }}
                        >
                            <div className="radio-grid-2col">
                                <Radio value="all">Tất cả</Radio>
                                <Radio value="duoi-10">Dưới 10 triệu</Radio>
                                <Radio value="10-15">10 - 15 triệu</Radio>
                                <Radio value="15-20">15 - 20 triệu</Radio>
                                <Radio value="20-25">20 - 25 triệu</Radio>
                                <Radio value="25-30">25 - 30 triệu</Radio>
                                <Radio value="30-50">30 - 50 triệu</Radio>
                                <Radio value="tren-50">Trên 50 triệu</Radio>
                                <Radio value="thoa-thuan">Thoả thuận</Radio>
                            </div>
                        </Radio.Group>

                        <div className="custom-salary-range">
                            <Input
                                placeholder="Từ"
                                value={filters.tuLuong}
                                onChange={(e) => setFilters({ ...filters, tuLuong: e.target.value })}
                                onBlur={() => executeSearch(filters)}
                                onPressEnter={() => executeSearch(filters)}
                                suffix="triệu"
                            />
                            <span className="range-dash">-</span>
                            <Input
                                placeholder="Đến"
                                value={filters.denLuong}
                                onChange={(e) => setFilters({ ...filters, denLuong: e.target.value })}
                                onBlur={() => executeSearch(filters)}
                                onPressEnter={() => executeSearch(filters)}
                                suffix="triệu"
                            />
                        </div>
                    </div>

                    <div className="filter-divider"></div>

                    <div className="filter-group">
                        <div className="filter-group-title">Kinh nghiệm</div>
                        <Checkbox.Group
                            value={filters.kinhNghiem}
                            onChange={(vals) => {
                                const updated = { ...filters, kinhNghiem: vals };
                                setFilters(updated);
                                executeSearch(updated);
                            }}
                        >
                            <div className="checkbox-grid-2col">
                                <Checkbox value="Không yêu cầu">Không yêu cầu</Checkbox>
                                <Checkbox value="Dưới 1 năm">Dưới 1 năm</Checkbox>
                                <Checkbox value="1 năm">1 năm</Checkbox>
                                <Checkbox value="2 năm">2 năm</Checkbox>
                                <Checkbox value="3 năm">3 năm</Checkbox>
                                <Checkbox value="4 năm">4 năm</Checkbox>
                                <Checkbox value="5 năm">5 năm</Checkbox>
                                <Checkbox value="Trên 5 năm">Trên 5 năm</Checkbox>
                            </div>
                        </Checkbox.Group>
                    </div>

                    <div className="filter-divider"></div>

                    <div className="filter-group">
                        <div className="filter-group-title">Cấp bậc</div>
                        <Checkbox.Group
                            value={filters.capBac}
                            onChange={(vals) => {
                                const updated = { ...filters, capBac: vals };
                                setFilters(updated);
                                executeSearch(updated);
                            }}
                        >
                            <div className="checkbox-grid-2col">
                                <Checkbox value="Thực tập sinh">Thực tập sinh</Checkbox>
                                <Checkbox value="Nhân viên">Nhân viên</Checkbox>
                                <Checkbox value="Trưởng nhóm">Trưởng nhóm</Checkbox>
                                <Checkbox value="Trưởng/Phó phòng">Trưởng/Phó phòng</Checkbox>
                                <Checkbox value="Quản lý / Giám sát">Quản lý / Giám sát</Checkbox>
                                <Checkbox value="Trưởng chi nhánh">Trưởng chi nhánh</Checkbox>
                                <Checkbox value="Phó giám đốc">Phó giám đốc</Checkbox>
                                <Checkbox value="Giám đốc">Giám đốc</Checkbox>
                            </div>
                        </Checkbox.Group>
                    </div>

                    <div className="filter-actions-footer">
                        <Button type="text" className="btn-reset-filter" onClick={handleResetFilters}>
                            <ReloadOutlined /> Xóa lọc
                        </Button>
                    </div>
                </div>

                {/* DANH SÁCH BÀI VIẾT BÊN PHẢI */}
                <div className="topcv-job-results">
                    <div className="results-count-text">
                        Tìm thấy <strong style={{ color: '#1677ff', fontSize: 18 }}>{jobs.length}</strong> việc làm phù hợp
                    </div>

                    <Spin spinning={loading} size="large">
                        <div className="job-list-vertical">
                            {jobs.map((job) => {
                                const vitris = job.viTris || [];
                                const vitriDau = vitris.length > 0 ? vitris[0] : {};
                                
                                const allViTriIds = vitris.map(v => Number(v.id || v.maViTri)).filter(Boolean);
                                if (job.maViTri) allViTriIds.push(Number(job.maViTri));

                                // 🌟 4. NHẬN DIỆN ĐÃ LƯU THEO CẢ ID CHIẾN DỊCH LẪN ID VỊ TRÍ CON
                                const isTinBookmarked = bookmarkedMaTinIds.includes(Number(job.maTin));
                                const bookmarkedViTriId = allViTriIds.find(id => bookmarkedViTriIds.includes(id));
                                const isBookmarked = isTinBookmarked || Boolean(bookmarkedViTriId);

                                const targetBookmarkId = bookmarkedViTriId || allViTriIds[0] || job.maViTri;

                                const allCapBacs = [...new Set(vitris.map(v => v.capBac).filter(Boolean))];
                                const allKinhNghiems = [...new Set(vitris.map(v => v.kinhNghiem).filter(Boolean))];
                                const allLocations = [...new Set(vitris.map(v => v.locationName).filter(Boolean))];

                                return (
                                    <div
                                        key={job.maTin}
                                        className={`topcv-job-card ${job.isPromoted ? 'promoted' : ''}`}
                                        onClick={() => navigate(`/job/${job.maTin}`)}
                                    >
                                        <div className="card-main-content">
                                            <img src={job.logo || 'https://via.placeholder.com/64'} alt="Company Logo" className="company-logo-img" />

                                            <div className="job-details-col">
                                                <h3 className="job-title-text">{job.tieuDeChienDich}</h3>
                                                <div className="company-name-text">{job.companyName}</div>

                                                <div className="job-badges-row">
                                                    <span className="badge-item">
                                                        <EnvironmentOutlined /> {allLocations.join(', ') || 'Toàn quốc'}
                                                    </span>
                                                    {allKinhNghiems.map((kn, i) => (
                                                        <span className="badge-item" key={`kn-${i}`}>{kn}</span>
                                                    ))}
                                                    {allCapBacs.map((cb, i) => (
                                                        <span className="badge-item" key={`cb-${i}`}>{cb}</span>
                                                    ))}
                                                </div>

                                                <div className="job-description-snippet">
                                                    {vitris.map(v => v.title || v.tenViTri).filter(Boolean).join(' • ') || 'Đang mở tuyển dụng...'}
                                                </div>
                                            </div>

                                            <div className="card-right-col">
                                                <div className="job-salary-highlight">
                                                    {vitriDau.salaryRange || vitriDau.luong || 'Thỏa thuận'}
                                                </div>
                                                <div
                                                    className="heart-icon-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleBookmark(targetBookmarkId, job.maTin);
                                                    }}
                                                >
                                                    {isBookmarked ? (
                                                        <HeartFilled style={{ color: '#1677ff', fontSize: 20 }} />
                                                    ) : (
                                                        <HeartOutlined style={{ color: '#94a3b8', fontSize: 20 }} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {jobs.length === 0 && !loading && (
                                <div className="empty-results-box">
                                    <Empty description="Không tìm thấy việc làm phù hợp với bộ lọc hiện tại." />
                                </div>
                            )}
                        </div>
                    </Spin>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;