import React, { useState, useEffect } from 'react'; 
import { 
    Table, Button, message, Input, Card, Alert, Tag, Space, 
    Row, Col, Select, Switch, Popover, Tooltip, Modal
} from 'antd'; 
import { 
    UnlockOutlined, EyeOutlined, SearchOutlined, TrophyOutlined, 
    ClearOutlined, StarOutlined, StarFilled, EditOutlined, ShoppingCartOutlined
} from '@ant-design/icons'; 
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient'; 

const { Option } = Select; 
const { TextArea } = Input;

// 🌟 Component con giúp quản lý state ô nhập Ghi chú mượt mà
const NotePopoverContent = ({ record, onSave }) => {
    const [noteText, setNoteText] = useState(record.ghiChuCaNhan || '');

    useEffect(() => {
        setNoteText(record.ghiChuCaNhan || '');
    }, [record.ghiChuCaNhan]);

    return (
        <div style={{ width: 260 }}>
            <span style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                Ghi chú nội bộ HR:
            </span>
            <TextArea 
                rows={3} 
                value={noteText} 
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="VD: Phù hợp với vị trí full stack develop cty đang cần..." 
                style={{ marginBottom: 8 }}
            />
            <div style={{ textAlign: 'right' }}>
                <Button type="primary" size="small" onClick={() => onSave(record.maCv, noteText)}>
                    Lưu ghi chú
                </Button>
            </div>
        </div>
    );
};

const CvHunter = () => {
    const navigate = useNavigate();
    const [cvs, setCvs] = useState([]); 
    const [loading, setLoading] = useState(false); 
    const [unlockingId, setUnlockingId] = useState(null);
    const [luotXemConLai, setLuotXemConLai] = useState(0); 
    const [isExpired, setIsExpired] = useState(false);
    const [danhMucNganh, setDanhMucNganh] = useState([]);
    
    // 🌟 State quản lý Popover nào đang mở (null = đóng tất cả)
    const [openPopoverId, setOpenPopoverId] = useState(null);

    const [searchParams, setSearchParams] = useState({
        keyword: '',
        nganhNghe: undefined,
        nganhNgheKhac: '',
        skills: '',
        onlySaved: false
    });

    useEffect(() => {
        fetchCvCredits(); 
        fetchCvs();       
        fetchIndustriesFromDb();
    }, []); 

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
            console.error("Lỗi tải danh sách CV:", err);
            message.error(err.response?.data?.error || "Không thể tải danh sách hồ sơ CV!"); 
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
        const cleared = { keyword: '', nganhNghe: undefined, nganhNgheKhac: '', skills: '', onlySaved: false };
        setSearchParams(cleared);
        fetchCvs(cleared);
    };

    const handleUnlock = (record) => { 
        // 1. Nếu hết lượt hoặc hết hạn gói -> Hiện Modal gợi ý mua gói ngay lập tức
        if (luotXemConLai <= 0 || isExpired) {
            Modal.confirm({
                title: 'Hết lượt mở khóa / Gói hết hạn',
                icon: <ShoppingCartOutlined style={{ color: '#ff4d4f' }} />,
                content: 'Tài khoản của bạn đã hết lượt mở khóa hoặc gói dịch vụ đã quá hạn. Bạn có muốn chuyển đến cửa hàng để nâng cấp gói không?',
                okText: 'Mua thêm lượt ngay',
                cancelText: 'Hủy',
                okButtonProps: { danger: true },
                onOk: () => navigate('/employer/service-package')
            });
            return;
        }

        // 2. Nếu còn lượt -> Hỏi xác nhận trước khi trừ lượt
        Modal.confirm({
            title: 'Xác nhận mở khóa CV',
            content: `Hệ thống sẽ trừ 1 lượt để mở khóa thông tin liên hệ của ứng viên "${record.hoTen}". Bạn có chắc chắn?`,
            okText: 'Mở khóa',
            cancelText: 'Đóng',
            onOk: async () => {
                setUnlockingId(record.maCv);
                try {
                    const res = await apiClient.post(`/employer/unlock-cv/${record.maCv}`); 
                    const payload = res?.data || res;
                    message.success(payload.message || "Mở khóa hồ sơ thành công!"); 
                    fetchCvCredits(); 
                    fetchCvs();       
                } catch (err) {
                    const errorMsg = err.response?.data?.message || "Không thể mở khóa hồ sơ!"; 
                    message.error(errorMsg); 
                } finally {
                    setUnlockingId(null);
                }
            }
        });
    };

    const handleToggleSave = async (record) => {
        if (!record.isUnlocked) {
            message.warning("Bạn cần mở khóa liên hệ của ứng viên này trước khi đánh dấu!");
            return;
        }

        try {
            const res = await apiClient.post('/employer/toggle-save-candidate', { maCv: record.maCv });
            const payload = res?.data || res;
            message.success(payload.message || "Cập nhật trạng thái thành công!");
            
            setCvs(prev => prev.map(item => item.maCv === record.maCv ? { ...item, isSaved: payload.isSaved } : item));
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Lỗi khi cập nhật trạng thái lưu!";
            message.error(errorMsg);
        }
    };

    // 🌟 HÀM CẬP NHẬT GHI CHÚ VÀ TỰ ĐỘNG ĐÓNG POPOVER
    const handleSaveNote = async (maCv, noteText) => {
        try {
            await apiClient.put('/employer/update-candidate-note', { maCv, ghiChuCaNhan: noteText });
            message.success("Đã lưu ghi chú cá nhân!");
            
            // 1. Cập nhật dữ liệu vào bảng
            setCvs(prev => prev.map(item => item.maCv === maCv ? { ...item, ghiChuCaNhan: noteText } : item));
            
            // 2. ⚡ TỰ ĐỘNG ĐÓNG POPOVER CỦA CV NÀY
            setOpenPopoverId(null);
        } catch (err) {
            message.error("Lỗi khi cập nhật ghi chú!");
        }
    };

    const columns = [ 
        {
            title: 'Lưu',
            key: 'isSaved',
            width: 60,
            align: 'center',
            render: (_, record) => {
                const tooltipText = !record.isUnlocked 
                    ? "Cần mở khóa liên hệ CV trước khi lưu" 
                    : (record.isSaved ? "Bỏ lưu ứng viên" : "Lưu ứng viên vào danh sách ưng ý");

                return (
                    <Tooltip title={tooltipText}>
                        <Button 
                            type="text" 
                            disabled={!record.isUnlocked} 
                            icon={
                                record.isSaved ? (
                                    <StarFilled style={{ color: '#f59e0b', fontSize: 18 }} />
                                ) : (
                                    <StarOutlined style={{ color: record.isUnlocked ? '#cbd5e1' : '#f1f5f9', fontSize: 18 }} />
                                )
                            } 
                            onClick={() => handleToggleSave(record)}
                        />
                    </Tooltip>
                );
            }
        },
        { 
            title: 'Thông tin ứng viên', 
            dataIndex: 'hoTen', 
            key: 'hoTen', 
            render: (text, record) => (
                <div>
                    <strong style={{ color: '#1e293b', fontSize: '15px', display: 'block' }}>{text}</strong>
                    {/* Chữ xanh vị trí công việc size 13px */}
                    <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 500 }}>
                        {record.jobTitle}
                    </span>
                    {/* 🌟 TAG ĐÃ TĂNG SIZE CHỮ LÊN 13px BẰNG CHỮ XANH */}
                    {record.ghiChuCaNhan && (
                        <div style={{ marginTop: 6 }}>
                            <Tag 
                                color="orange" 
                                style={{ 
                                    fontSize: '13px', 
                                    fontStyle: 'italic', 
                                    padding: '2px 8px', 
                                    lineHeight: '20px', 
                                    borderRadius: '4px' 
                                }}
                            >
                                📑 {record.ghiChuCaNhan}
                            </Tag>
                        </div>
                    )}
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
            title: 'Ghi chú cá nhân',
            key: 'noteAction',
            align: 'center',
            width: 140,
            render: (_, record) => (
                record.isSaved ? (
                    /* 🌟 KẾT NỐI OPEN VÀ ONOPENCHANGE ĐỂ ĐIỀU KHIỂN ĐÓNG / MỞ POPOVER */
                    <Popover 
                        content={<NotePopoverContent record={record} onSave={handleSaveNote} />} 
                        title={null} 
                        trigger="click"
                        open={openPopoverId === record.maCv}
                        onOpenChange={(visible) => {
                            setOpenPopoverId(visible ? record.maCv : null);
                        }}
                    >
                        <Button type="text" icon={<EditOutlined style={{ color: '#4f46e5' }} />}>
                            {record.ghiChuCaNhan ? "Sửa ghi chú" : "Thêm ghi chú"}
                        </Button>
                    </Popover>
                ) : <span style={{ color: '#cbd5e1', fontSize: 12 }}>{record.isUnlocked ? "Cần lưu CV" : "Cần mở khóa"}</span>
            )
        },
        {
            title: 'Hành động nghiệp vụ',
            key: 'action', 
            align: 'center', 
            render: (_, record) => (
                <Space>
                    {!record.isUnlocked ? ( 
                        <Button 
                            type={luotXemConLai > 0 && !isExpired ? "primary" : "default"} 
                            danger={luotXemConLai <= 0 || isExpired} // Đổi sang màu đỏ cảnh báo nếu hết lượt
                            icon={luotXemConLai > 0 && !isExpired ? <UnlockOutlined /> : <ShoppingCartOutlined />} 
                            loading={unlockingId === record.maCv}
                            onClick={() => handleUnlock(record)} 
                        >
                            {luotXemConLai > 0 && !isExpired ? "Mở khóa liên hệ (1 lượt)" : "Mua thêm lượt xem"}
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
    const displayedCvs = searchParams.onlySaved ? cvs.filter(item => item.isSaved) : cvs;

    return ( 
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}> 
            <Alert 
                message={ 
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}> 
                        <span>
                            <TrophyOutlined style={{ marginRight: 8, color: '#eab308' }} /> 
                            Tài khoản doanh nghiệp của bạn đang sở hữu: <strong>{luotXemConLai} lượt</strong> mở khóa hồ sơ CV ứng viên tiềm năng. 
                        </span>
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

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch 
                        checked={searchParams.onlySaved} 
                        onChange={(checked) => setSearchParams({ ...searchParams, onlySaved: checked })} 
                    />
                    <span style={{ fontWeight: 500, color: '#334155', fontSize: 14 }}>
                        Chỉ hiển thị ứng viên đã lưu trong Danh sách được chọn (🌟)
                    </span>
                </div>
            </Card>

            <Card style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}> 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}> 
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                        Săn tìm Tài năng (Talent Pool công khai)
                    </h3> 
                </div> 
                
                <Table  
                    columns={columns}  
                    dataSource={displayedCvs}  
                    rowKey="maCv" 
                    loading={loading} 
                    pagination={{ pageSize: 10 }} 
                />
            </Card>
        </div>
    ); 
};

export default CvHunter;