import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Button, Spin, Row, Col, Input, message } from 'antd';
import { 
    AuditOutlined, 
    UsergroupAddOutlined, 
    EnvironmentOutlined,
    SearchOutlined,
    HeartOutlined,
    HeartFilled
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import './css/CompanyDetail.css';

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const CompanyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobKeyword, setJobKeyword] = useState('');
    const [bookmarkedIds, setBookmarkedIds] = useState([]);

    useEffect(() => {
        setLoading(true);
        apiClient.get(`/Company/${id}`)
            .then(res => {
                const rawData = res?.data !== undefined ? res.data : res;
                const companyData = rawData?.company || rawData?.data?.company;
                const jobsData = rawData?.jobs || rawData?.data?.jobs || [];

                if (companyData) {
                    setCompany(companyData);
                    setJobs(jobsData);
                } else {
                    setCompany(null);
                }
            })
            .catch(err => {
                console.error("Lỗi lấy chi tiết công ty:", err);
                setCompany(null);
            })
            .finally(() => setLoading(false));

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
    }, [id]);

    const toggleBookmark = async (maViTri) => {
        if (!maViTri) {
            return message.error("Tin tuyển dụng này chưa có vị trí chi tiết!");
        }

        const token = localStorage.getItem('token');
        if (!token) return message.warning("Vui lòng đăng nhập để lưu bài!");

        const decoded = parseJwt(token);
        const userId = decoded?.maUser || decoded?.nameid || 1;

        try {
            const res = await apiClient.post(`/Jobs/${maViTri}/bookmark`, null, {
                headers: { Authorization: `Bearer ${token}`, maUser: parseInt(userId) }
            });
            const isBookmarked = res?.isBookmarked !== undefined ? res.isBookmarked : res?.data?.isBookmarked;

            if (isBookmarked) {
                setBookmarkedIds(prev => [...prev, maViTri]);
                message.success("Đã lưu tin tuyển dụng!");
            } else {
                setBookmarkedIds(prev => prev.filter(bId => bId !== maViTri));
                message.info("Đã bỏ lưu tin!");
            }
        } catch (err) {
            message.error("Lỗi khi lưu tin!");
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '120px 0', backgroundColor: '#0b1329', minHeight: '100vh' }}>
                <Spin size="large" tip="Đang tải thông tin công ty..." />
            </div>
        );
    }

    if (!company) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#fff', backgroundColor: '#0b1329', minHeight: '100vh' }}>
                <h2>Không tìm thấy thông tin công ty</h2>
                <Button type="primary" onClick={() => navigate('/cong-ty')}>Quay lại danh sách</Button>
            </div>
        );
    }

    // Lọc danh sách việc làm theo từ khóa
    const filteredJobs = jobs.filter(j => {
        const kw = jobKeyword.toLowerCase().trim();
        if (!kw) return true;

        const matchTieuDe = j.tieuDeChienDich?.toLowerCase().includes(kw);
        const matchViTri = j.viTris?.some(v => 
            v.title?.toLowerCase().includes(kw) || 
            v.tenViTri?.toLowerCase().includes(kw)
        );

        return matchTieuDe || matchViTri;
    });

    return (
        <div className="company-detail-container">
            <div className="company-header-card">
                <div className="header-profile-bar">
                    {company.logo && (
                        <img src={company.logo} alt="logo" className="header-logo" />
                    )}
                    <div className="header-info">
                        <h1 className="company-name">{company.tenCongTy}</h1>
                        <div className="company-meta">
                            <span><EnvironmentOutlined /> {company.diaChi || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                    </div>
                </div>

                <div className="company-tabs-bar">
                    <Tabs 
                        defaultActiveKey="2" 
                        items={[
                            { 
                                key: '1', 
                                label: 'Tổng quan', 
                                children: (
                                    <Row gutter={24}>
                                        <Col xs={24} lg={16}>
                                            <div className="detail-section-card">
                                                <h3 className="section-title">Giới thiệu công ty</h3>
                                                <div 
                                                    className="company-html-desc"
                                                    dangerouslySetInnerHTML={{ __html: company.moTa || 'Đang cập nhật bài giới thiệu công ty...' }}
                                                />
                                            </div>
                                        </Col>

                                        <Col xs={24} lg={8}>
                                            <div className="detail-sidebar-card">
                                                <h3 className="section-title">Thông tin chung</h3>
                                                <div className="info-item">
                                                    <AuditOutlined className="info-icon" />
                                                    <div>
                                                        <div className="info-label">Mã số thuế</div>
                                                        <div className="info-value">{company.maSoThue || 'Đang cập nhật'}</div>
                                                    </div>
                                                </div>

                                                <div className="info-item">
                                                    <UsergroupAddOutlined className="info-icon" />
                                                    <div>
                                                        <div className="info-label">Quy mô</div>
                                                        <div className="info-value">{company.quyMo || 'Đang cập nhật'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="detail-sidebar-card" style={{ marginTop: '16px' }}>
                                                <h3 className="section-title">Địa điểm công ty</h3>
                                                <div className="location-text">
                                                    <EnvironmentOutlined /> {company.diaChi || 'Chưa cập nhật địa chỉ'}
                                                </div>
                                                <div className="map-wrapper">
                                                    <iframe
                                                        title="Company Map"
                                                        width="100%"
                                                        height="180"
                                                        style={{ border: 0, borderRadius: '8px' }}
                                                        loading="lazy"
                                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(company.diaChi || company.tenCongTy)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                                    />
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                ) 
                            },
                            { 
                                key: '2', 
                                label: `Tin tuyển dụng (${jobs.length})`, 
                                children: (
                                    <div className="detail-section-card">
                                        <div className="jobs-tab-header">
                                            <h3 className="section-title">Tin tuyển dụng đang mở</h3>
                                            <Input
                                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                                placeholder="Tên công việc, vị trí..."
                                                value={jobKeyword}
                                                onChange={(e) => setJobKeyword(e.target.value)}
                                                style={{ width: 280, borderRadius: 8 }}
                                            />
                                        </div>

                                        <div className="jobs-list">
                                            {filteredJobs.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                                    Công ty hiện chưa có tin tuyển dụng nào phù hợp.
                                                </div>
                                            ) : (
                                                filteredJobs.map(job => {
                                                    const vitri = job.viTris?.[0] || {};
                                                    const maViTriId = job.maViTri || vitri.id || vitri.maViTri;
                                                    const isBookmarked = bookmarkedIds.includes(maViTriId);

                                                    return (
                                                        <div key={job.maTin} className="company-job-card" onClick={() => navigate(`/job/${job.maTin}`)}>
                                                            <div className="job-info">
                                                                <h4 className="job-title">{job.tieuDeChienDich}</h4>
                                                                <div className="job-company">{job.companyName}</div>
                                                                <div className="job-tags">
                                                                    {vitri.locationName && (
                                                                        <span className="tag-chip">
                                                                            <EnvironmentOutlined /> {vitri.locationName}
                                                                        </span>
                                                                    )}
                                                                    {vitri.kinhNghiem && <span className="tag-chip">{vitri.kinhNghiem}</span>}
                                                                    {vitri.capBac && <span className="tag-chip">{vitri.capBac}</span>}
                                                                </div>
                                                            </div>

                                                            <div className="job-right">
                                                                <div className="job-salary">{vitri.luong || 'Thỏa thuận'}</div>
                                                                <div
                                                                    className="heart-icon-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleBookmark(maViTriId);
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
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ) 
                            }
                        ]} 
                    />
                </div>
            </div>
        </div>
    );
};

export default CompanyDetail;