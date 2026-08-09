import React, { useState, useEffect } from 'react';
import { Input, Button, Row, Col, Card, Spin, Empty } from 'antd';
import { SearchOutlined, EnvironmentOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './css/CompanyList.css';

const CompanyList = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');

    const fetchCompanies = (searchKeyword = '') => {
        setLoading(true);
        apiClient.get('/Company', { params: { keyword: searchKeyword } })
            .then(res => {
                const rawData = res?.data !== undefined ? res.data : res;
                const list = Array.isArray(rawData) ? rawData : (rawData?.data || []);
                setCompanies(list);
            })
            .catch(err => console.error("Lỗi lấy danh sách công ty:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    return (
        <div className="company-list-container">
            <div className="company-hero-banner">
                <div className="hero-content">
                    <h1 className="hero-title">Khám phá các công ty nổi bật</h1>
                    <p className="hero-subtitle">Tra cứu thông tin công ty và tìm kiếm môi trường làm việc phù hợp với bạn</p>
                    
                    <div className="company-search-box">
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 18 }} />}
                            placeholder="Nhập tên công ty..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onPressEnter={() => fetchCompanies(keyword)}
                            className="company-search-input"
                        />
                        <Button 
                            type="primary" 
                            className="btn-company-search"
                            onClick={() => fetchCompanies(keyword)}
                        >
                            Tìm kiếm
                        </Button>
                    </div>
                </div>
            </div>

            <div className="company-main-body">
                <h2 className="section-header-title">DANH SÁCH CÁC CÔNG TY NỔI BẬT</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <Spin size="large" tip="Đang tải danh sách công ty..." />
                    </div>
                ) : companies.length === 0 ? (
                    <Empty description="Không tìm thấy công ty nào phù hợp." />
                ) : (
                    <Row gutter={[24, 24]}>
                        {companies.map((company) => (
                            <Col xs={24} sm={12} lg={8} key={company.id} style={{ display: 'flex' }}>
                                <Card
                                    hoverable
                                    className="company-card-clean"
                                    onClick={() => navigate(`/cong-ty/${company.id}`)}
                                >
                                    <div className="company-card-header">
                                        {company.logo ? (
                                            <img 
                                                alt={company.tenCongTy} 
                                                src={company.logo} 
                                                className="company-clean-logo"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="company-clean-logo-fallback" 
                                            style={{ display: company.logo ? 'none' : 'flex' }}
                                        >
                                            <BankOutlined style={{ fontSize: 24, color: '#38bdf8' }} />
                                        </div>

                                        <div className="company-header-text">
                                            <h3 className="company-clean-name" title={company.tenCongTy}>
                                                {company.tenCongTy}
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="company-clean-desc">
                                        {company.moTa 
                                            ? company.moTa.replace(/<[^>]+>/g, '').trim() 
                                            : 'Công ty chưa cập nhật thông tin giới thiệu chi tiết...'}
                                    </p>

                                    <div className="company-clean-footer">
                                        <div className="company-address-text" title={company.diaChi || 'Chưa cập nhật'}>
                                            <EnvironmentOutlined /> {company.diaChi || 'Chưa cập nhật'}
                                        </div>
                                        <span className="jobs-count-badge">
                                            {company.soTinTuyenDung || 0} việc làm
                                        </span>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
};

export default CompanyList;