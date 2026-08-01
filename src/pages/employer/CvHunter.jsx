import React, { useState, useEffect } from 'react'; 
import { Table, Button, message, Input, Card, Alert, Tag, Space, Row, Col, Select } from 'antd'; 
import { UnlockOutlined, EyeOutlined, SearchOutlined, TrophyOutlined, ClearOutlined } from '@ant-design/icons'; 
import apiClient from '../../api/apiClient'; 

const { Option } = Select; 

const CvHunter = () => {
    const [cvs, setCvs] = useState([]); 
    const [loading, setLoading] = useState(false); 
    const [luotXemConLai, setLuotXemConLai] = useState(0); 
    const [danhMucNganh, setDanhMucNganh] = useState([]);

    const [searchParams, setSearchParams] = useState({
        keyword: '',
        nganhNghe: undefined,
        nganhNgheKhac: '',
        skills: ''
    });

    useEffect(() => {
        fetchCvCredits(); // Nạp lượt xem độc lập
        fetchCvs();       // Nạp danh sách ứng viên
        fetchIndustriesFromDb();
    }, []); 

    // 🌟 API LẤY LƯỢT XEM RIÊNG (Không lo bị ảnh hưởng bởi lỗi danh sách CV)
    const fetchCvCredits = async () => {
        try {
            const res = await apiClient.get('/employer/cv-credits');
            const data = res?.data !== undefined ? res.data : res;
            if (data && data.luotXemCvConLai !== undefined) {
                setLuotXemConLai(data.luotXemCvConLai);
            }
        } catch (err) {
            console.error("Lỗi khi tải số lượt xem CV:", err);
        }
    };

    // 🌟 API LẤY DANH SÁCH CV
    const fetchCvs = async (customParams = searchParams) => {
        setLoading(true); 
        try {
            const { keyword, nganhNghe, nganhNgheKhac, skills } = customParams;
            let url = `/employer/hunt-cv?keyword=${keyword || ''}&nganhNghe=${nganhNghe || ''}&nganhNgheKhac=${nganhNgheKhac || ''}&skills=${skills || ''}`;
            
            const response = await apiClient.get(url); 
            const data = response?.data !== undefined ? response.data : response;

            if (Array.isArray(data)) {
                setCvs(data);
            } else if (data && Array.isArray(data.data)) {
                setCvs(data.data);
            } else {
                setCvs([]);
            }
        } catch (err) {
            console.error("Chi tiết lỗi 500 từ Server:", err.response?.data);
            message.error(err.response?.data?.error || "Không thể tải danh sách hồ sơ CV công khai!"); 
            setCvs([]);
        } finally {
            setLoading(false); 
        }
    };

    const fetchIndustriesFromDb = async () => {
        try {
            const response = await apiClient.get('/employer/hunt-cv/industries');
            const payload = (response && response.data !== undefined) ? response.data : response;
            if (Array.isArray(payload)) setDanhMucNganh(payload);
        } catch (err) {
            console.error("Không thể tải danh mục ngành nghề:", err);
        }
    };

    const handleSearch = () => fetchCvs(searchParams);

    const handleClearFilters = () => {
        const cleared = { keyword: '', nganhNghe: undefined, nganhNgheKhac: '', skills: '' };
        setSearchParams(cleared);
        fetchCvs(cleared);
    };

    const handleUnlock = async (maCv) => { 
        try {
            await apiClient.post(`/employer/unlock-cv/${maCv}`); 
            message.success("Mở khóa hồ sơ thành công!"); 
            fetchCvCredits(); // Cập nhật lại số lượt xem ngay lập tức
            fetchCvs();       // Cập nhật lại trạng thái hiển thị email
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data || "Lỗi hệ thống khi mở khóa"; 
            message.error(errorMsg); 
        }
    }; 

    const columns = [ 
        { 
            title: 'Thông tin ứng viên', 
            dataIndex: 'hoTen', 
            key: 'hoTen', 
            render: (text, record) => (
                <div>
                    <strong style={{ color: '#1e293b', fontSize: '15px', display: 'block' }}>{text}</strong>
                    <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 500 }}>
                        {record.jobTitle}
                    </span>
                </div>
            ) 
        },
        { 
            title: 'Email liên hệ', 
            dataIndex: 'email', 
            key: 'email', 
            render: (email, record) => record.isUnlocked ? <Tag color="success">{email}</Tag> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{email}</span> 
        },
        {
            title: 'Hành động nghiệp vụ',
            key: 'action', 
            align: 'center', 
            render: (_, record) => (
                <Space>
                    {!record.isUnlocked ? ( 
                        <Button 
                            type="primary" 
                            icon={<UnlockOutlined />} 
                            onClick={() => handleUnlock(record.maCv)} 
                        >
                            Mở khóa liên hệ (1 lượt)
                        </Button> 
                    ) : ( 
                        <Button 
                            type="default" 
                            style={{ borderColor: '#52c41a', color: '#52c41a' }} 
                            icon={<EyeOutlined />} 
                            onClick={() => window.open(record.cvUrl, '_blank')} 
                        >
                            Xem CV gốc
                        </Button> 
                    )}
                </Space> 
            )
        }
    ]; 

    const isKhacSelected = searchParams.nganhNghe === "Khác";

    return ( 
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}> 
            <Alert 
                message={ 
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}> 
                        <span>
                            <TrophyOutlined style={{ marginRight: 8, color: '#eab308' }} /> 
                            Tài khoản doanh nghiệp của bạn đang sở hữu: <strong>{luotXemConLai} lượt</strong> mở khóa hồ sơ CV ứng viên tiềm năng. 
                        </span>
                        {luotXemConLai === 0 && ( 
                            <Tag color="red" style={{ fontSize: '13px', padding: '2px 10px', cursor: 'pointer' }}> 
                                Mua thêm lượt xem CV ngay 🚀
                            </Tag> 
                        )}
                    </div> 
                }
                type={luotXemConLai > 0 ? "info" : "error"} 
                showIcon={false} 
                style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }} 
            />

            <Card style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>Bộ lọc tìm kiếm ứng viên cao cấp</h3>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={isKhacSelected ? 5 : 6}>
                        <span style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#475569' }}>Từ khóa chính</span>
                        <Input 
                            placeholder="Tên ứng viên, tiêu đề CV..." 
                            value={searchParams.keyword}
                            onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                            onPressEnter={handleSearch}
                        />
                    </Col>
                    
                    <Col xs={24} md={isKhacSelected ? 5 : 6}>
                        <span style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#475569' }}>Định hướng ngành nghề</span>
                        <Select 
                            style={{ width: '100%' }} 
                            placeholder="Chọn ngành nghề" 
                            allowClear 
                            value={searchParams.nganhNghe} 
                            onChange={(val) => setSearchParams({ ...searchParams, nganhNghe: val, nganhNgheKhac: val === "Khác" ? searchParams.nganhNgheKhac : "" })}
                        >
                            {danhMucNganh.map((nganh) => (
                                <Option key={nganh} value={nganh}>{nganh}</Option>
                            ))}
                        </Select>
                    </Col>
                    
                    {isKhacSelected && (
                        <Col xs={24} md={5}>
                            <span style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#0284c7' }}>Ngành nghề khác</span>
                            <Input 
                                placeholder="Nhập tên ngành..." 
                                value={searchParams.nganhNgheKhac}
                                onChange={(e) => setSearchParams({ ...searchParams, nganhNgheKhac: e.target.value })}
                                onPressEnter={handleSearch}
                            />
                        </Col>
                    )}
                    
                    <Col xs={24} md={isKhacSelected ? 5 : 7}>
                        <span style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#475569' }}>Kỹ năng / Công nghệ</span>
                        <Input 
                            placeholder="Ví dụ: Java, C#, React, Git..." 
                            value={searchParams.skills}
                            onChange={(e) => setSearchParams({ ...searchParams, skills: e.target.value })}
                            onPressEnter={handleSearch}
                        />
                    </Col>
                    
                    <Col xs={24} md={isKhacSelected ? 4 : 5}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button icon={<ClearOutlined />} onClick={handleClearFilters}>Xóa lọc</Button>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>Tìm kiếm</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}> 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}> 
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Săn tìm Tài năng (Talent Pool công khai)</h3> 
                </div> 
                
                <Table  
                    columns={columns}  
                    dataSource={cvs}  
                    rowKey="maCv" 
                    loading={loading} 
                    pagination={{ pageSize: 10 }} 
                />
            </Card>
        </div>
    ); 
};

export default CvHunter;