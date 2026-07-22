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
    
    // Quản lý trạng thái các ô lọc dữ liệu nâng cao
    const [searchParams, setSearchParams] = useState({
        keyword: '',
        nganhNghe: undefined,
        nganhNgheKhac: '',
        skills: ''
    });

    useEffect(() => {
        fetchCvs(); 
        fetchIndustriesFromDb();
    }, []); 

    const fetchCvs = async (customParams = searchParams) => {
        setLoading(true); 
        try {
            // Chuyển đổi các bộ lọc thành chuỗi query string truyền lên Backend
            const { keyword, nganhNghe, nganhNgheKhac, skills } = customParams;
            let url = `/employer/hunt-cv?keyword=${keyword || ''}&nganhNghe=${nganhNghe || ''}&nganhNgheKhac=${nganhNgheKhac || ''}&skills=${skills || ''}`;
            
            const response = await apiClient.get(url); 
            const payload = (response && response.luotXemCvConLai !== undefined) ? response : response?.data; 
            
            if (payload && payload.success) {
                setCvs(payload.data || []); 
                setLuotXemConLai(payload.luotXemCvConLai || 0); 
            } else if (payload && payload.success === false) {
                message.warning(payload.message); 
                setCvs([]); 
                setLuotXemConLai(0); 
            }
        } catch (err) {
            message.error("Không thể tải danh sách hồ sơ CV công khai!"); 
        } finally {
            setLoading(false); 
        }
    };

    const fetchIndustriesFromDb = async () => {
        try {
            const response = await apiClient.get('/employer/hunt-cv/industries');
            const payload = (response && response.luotXemCvConLai !== undefined) ? response : (response?.data || response);
            
            if (Array.isArray(payload)) {
                setDanhMucNganh(payload);
            } else if (payload && Array.isArray(payload.data)) {
                setDanhMucNganh(payload.data);
            }
        } catch (err) {
            console.error("Không thể tải danh mục ngành nghề từ hệ thống:", err);
        }
    }

    const handleSearch = () => {
        fetchCvs(searchParams);
    };

    const handleClearFilters = () => {
        const cleared = { keyword: '', nganhNghe: undefined, nganhNgheKhac: '', skills: '' };
        setSearchParams(cleared);
        fetchCvs(cleared);
    };

    const handleUnlock = async (maCv) => { 
        try {
            await apiClient.post(`/employer/unlock-cv/${maCv}`); 
            message.success("Khấu trừ tài khoản và mở khóa hồ sơ thành công!"); 
            fetchCvs(); 
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data || "Lỗi hệ thống khi mở khóa"; 
            message.error(errorMsg); 
        }
    }; 

    const columns = [ 
        { 
            title: 'Tên ứng viên', 
            dataIndex: 'hoTen', 
            key: 'hoTen', 
            render: (text) => <strong style={{ color: '#1e293b' }}>{text}</strong> 
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', wrap: 'wrap' }}> 
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
                
                {/* Tính toán tỷ lệ co giãn linh hoạt để vừa khít 24 cột hệ thống */}
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
                                <Option key={nganh} value={nganh}>
                                    {nganh}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    
                    {/* SỬA LỖI: Bọc điều kiện hiển thị động và tinh chỉnh lại tỷ lệ md = 5 */}
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
                            <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                                Xóa lọc
                            </Button>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                                Tìm kiếm
                            </Button>
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