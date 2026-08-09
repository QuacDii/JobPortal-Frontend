import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './css/ManageCv.css';
import './css/CvBuilder.css';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import JobAlertManager from './JobAlertManager';
import { Row, Col, Card, Typography, Button, Space, Switch, Popconfirm, Spin, Empty, message, Avatar, Tooltip, Modal, Badge, Tag, Divider, ConfigProvider, theme } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    DownloadOutlined,
    PlusOutlined,
    StarFilled,
    CheckCircleFilled,
    CrownFilled,
    RadarChartOutlined,
    RocketOutlined,
    FireFilled,
    StarOutlined,
    FileTextOutlined,
    ExclamationCircleFilled
} from '@ant-design/icons';
import useCvStore from '../store/useCvStore';
import MasterTemplate from '../components/MasterTemplate';
import html2pdf from 'html2pdf.js';

const { Title, Text } = Typography;

const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);
        return {
            userId: decoded.nameid || decoded.maUser || decoded.id || decoded.sub,
            isVip: decoded.isVip === 'true' || decoded.isVip === true,
            isEmailVerified: decoded.isEmailVerified === 'true' || decoded.isEmailVerified === true
        };
    } catch (error) {
        return null;
    }
};

const ManageCv = () => {
    const navigate = useNavigate();
    const [cvList, setCvList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isJobAlertModalOpen, setIsJobAlertModalOpen] = useState(false);

    const [isSearchingJob, setIsSearchingJob] = useState(false);
    const [isSearchingJobLoading, setIsSearchingJobLoading] = useState(false);

    const [liveAvatar, setLiveAvatar] = useState(null);
    const [userName, setUserName] = useState('Ứng viên');

    const [exportingCv, setExportingCv] = useState(null);

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId;
    const isVipUser = userInfo?.isVip || false;
    const [isEmailVerified, setIsEmailVerified] = useState(userInfo?.isEmailVerified || false);

    const fetchMyCvs = () => {
        if (!token || !userId) {
            message.error('Vui lòng đăng nhập để xem danh sách CV!');
            navigate('/login');
            return;
        }
        setLoading(true);
        apiClient.get(`/Cv/user/${userId}`)
            .then(res => {
                const actualCvs = Array.isArray(res) ? res : (res?.data || []);
                setCvList(actualCvs);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi lấy danh sách CV:", err);
                setCvList([]);
                setLoading(false);
            });
    };

    const fetchUserProfile = () => {
        if (userId) {
            apiClient.get(`/User/profile/${userId}`)
                .then(res => {
                    const data = res.data || res;
                    if (data.trangThaiTimViec !== undefined) {
                        setIsSearchingJob(data.trangThaiTimViec);
                    }
                    if (data.isEmailVerified !== undefined) {
                        setIsEmailVerified(data.isEmailVerified);
                    }
                })
                .catch(err => console.error("Lỗi lấy thông tin profile:", err));
        }
    };

    useEffect(() => {
        fetchMyCvs();
        fetchUserProfile();

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const decoded = JSON.parse(decodeURIComponent(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
                if (decoded.HoTen || decoded.name) setUserName(decoded.HoTen || decoded.name);
            } catch (e) { }
        }

        if (userId) {
            apiClient.get(`/Cv/primary-avatar/${userId}`)
                .then(res => setLiveAvatar(res?.url || res?.data?.url))
                .catch(err => console.error("Lỗi đồng bộ ảnh:", err));
        }
    }, []);

    const handleToggleJobSearch = async (checked) => {
        setIsSearchingJobLoading(true);
        try {
            await apiClient.put(`/User/toggle-job-search/${userId}`, { isSearching: checked }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setIsSearchingJob(checked);
            message.success(checked ? 'Đã bật trạng thái tìm việc! Hồ sơ của bạn đã sẵn sàng.' : 'Đã ẩn hồ sơ khỏi Nhà tuyển dụng!');
        } catch (error) {
            console.error(error);
            message.error('Cập nhật trạng thái thất bại. Vui lòng thử lại!');
            setIsSearchingJob(!checked);
        } finally {
            setIsSearchingJobLoading(false);
        }
    };

    const handleCreateNew = () => {
        if (!isVipUser && cvList.length >= 5) {
            Modal.confirm({
                title: 'Đã đạt giới hạn tạo hồ sơ',
                content: 'Tài khoản miễn phí chỉ được tạo tối đa 5 CV. Hãy nâng cấp VIP để tạo không giới hạn!',
                okText: 'Nâng cấp VIP ngay',
                cancelText: 'Để sau',
                okButtonProps: { style: { backgroundColor: '#faad14', borderColor: '#faad14', color: '#000' } },
                onOk: () => navigate('/upgrade-vip')
            });
            return;
        }
        navigate('/thu-vien-cv');
    };

    const handleEdit = (maCV) => navigate(`/builder?cvId=${maCV}`);

    const handleDownloadPdf = async (maCV) => {
        const hideLoading = message.loading('Đang khởi tạo và xuất file PDF, vui lòng chờ trong giây lát...', 0);
        try {
            const res = await apiClient.get(`/Cv/${maCV}`);
            const actualCv = res.data ? res.data : res;

            if (!actualCv) throw new Error("Không tải được dữ liệu CV");

            const title = actualCv.tieuDe || actualCv.TieuDe || 'CV_JobsNow';
            const color = actualCv.maHex || actualCv.MaHex || '#1890ff';
            const font = actualCv.fontChu || actualCv.FontChu || '"Be Vietnam Pro", sans-serif';
            const bg = actualCv.hinhNen || actualCv.HinhNen || 'none';
            const maMau = actualCv.maMau || actualCv.MaMau;

            let rawLayout = actualCv.customLayoutJson || actualCv.CustomLayoutJson;
            let layoutJson = rawLayout ? (typeof rawLayout === 'string' ? JSON.parse(rawLayout) : rawLayout) : null;
            if (typeof layoutJson === 'string') layoutJson = JSON.parse(layoutJson);

            if (!layoutJson && maMau) {
                try {
                    const tplRes = await apiClient.get(`/MauCv/${maMau}`);
                    const tplData = tplRes.data ? tplRes.data : tplRes;
                    let rawTplLayout = tplData?.layoutJson || tplData?.LayoutJson;
                    if (rawTplLayout) {
                        if (typeof rawTplLayout === 'string') rawTplLayout = rawTplLayout.replace(/^\uFEFF/, '').trim();
                        layoutJson = typeof rawTplLayout === 'object' ? rawTplLayout : JSON.parse(rawTplLayout);
                        if (typeof layoutJson === 'string') layoutJson = JSON.parse(layoutJson);
                    }
                } catch (tplErr) {
                    console.error("Lỗi tải mẫu:", tplErr);
                }
            }

            let rawContent = actualCv.duLieuCv || actualCv.DuLieuCv;
            let contentData = rawContent ? (typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent) : null;
            if (typeof contentData === 'string') contentData = JSON.parse(contentData);

            const initialStore = useCvStore.getState();
            initialStore.setInitialData(layoutJson, contentData);
            if (initialStore.updateLayoutSetting) {
                initialStore.updateLayoutSetting('themeColor', color);
                initialStore.updateLayoutSetting('fontFamily', font);
                initialStore.updateLayoutSetting('backgroundStyle', bg);
            }

            setExportingCv({ title, color, font, bg });

            setTimeout(async () => {
                const element = document.getElementById('hidden-pdf-paper');
                if (element) {
                    try {
                        const opt = {
                            margin: 0,
                            filename: `${title.replace(/\s+/g, '_')}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true, logging: false },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };

                        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
                        const arrayBuffer = await pdfBlob.arrayBuffer();

                        const pdfDoc = await PDFDocument.load(arrayBuffer);

                        const freshStore = useCvStore.getState();

                        const exportBundle = {
                            cvData: freshStore.cvData,
                            layoutSchema: freshStore.layoutSchema || freshStore.schema,
                            settings: freshStore.layoutSettings
                        };
                        const cvDataJson = JSON.stringify(exportBundle);

                        const encodedJson = window.btoa(unescape(encodeURIComponent(cvDataJson)));
                        pdfDoc.getInfoDict().set(PDFName.of('JobsNowCvData'), PDFString.of(encodedJson));

                        const pdfBytes = await pdfDoc.save();
                        const finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });

                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(finalBlob);
                        link.download = opt.filename;
                        link.click();
                        URL.revokeObjectURL(link.href);

                        message.success('Tải file PDF thành công!');
                    } catch (pdfErr) {
                        console.error("Lỗi đóng gói PDF ngầm:", pdfErr);
                        message.error('Có lỗi xảy ra khi hoàn thiện file PDF!');
                    }
                }
                hideLoading();
                setExportingCv(null);
            }, 800);

        } catch (err) {
            hideLoading();
            setExportingCv(null);
            message.error('Có lỗi xảy ra khi tải file PDF!');
        }
    };

    const handleDelete = (maCV) => {
        apiClient.delete(`/Cv/${maCV}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(() => {
                message.success('Đã xóa CV thành công!');
                fetchMyCvs();
            })
            .catch(err => {
                const backendMessage = err.response?.data?.message || err.response?.data;
                if (typeof backendMessage === 'string' && backendMessage.trim() !== '') message.error(backendMessage);
                else if (err.response?.status === 400 || err.response?.status === 409) message.error('Không thể xóa! CV này đang được sử dụng.');
                else message.error('Xóa CV thất bại!');
            });
    };

    const handleSetPrimary = (maCV) => {
        apiClient.put(`/Cv/set-primary/${maCV}?maUser=${userId}`, {}, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(() => {
                message.success('Đã thiết lập CV chính thành công!');
                setCvList(cvList.map(cv => ({ ...cv, isPrimary: (cv.maCV || cv.maCv) === maCV })));
            })
            .catch(err => message.error('Thiết lập CV chính thất bại!'));
    };

    const handleTogglePublic = (maCV, checked) => {
        apiClient.put(`/Cv/toggle-public/${maCV}`, {}, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(() => {
                message.success(checked ? 'Đã bật cho phép NTD tìm kiếm!' : 'Đã tắt cho phép NTD tìm kiếm!');
                setCvList(cvList.map(cv => (cv.maCV || cv.maCv) === maCV ? { ...cv, isPublic: checked } : cv));
            })
            .catch(err => message.error('Cập nhật trạng thái thất bại!'));
    };

    const handleRename = (maCV, newTitle) => {
        if (!newTitle || newTitle.trim() === "") return message.warning('Tiêu đề CV không được để trống!');
        apiClient.put(`/Cv/rename/${maCV}`, { tieuDe: newTitle }, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(() => {
                message.success('Đổi tên CV thành công!');
                setCvList(cvList.map(cv => (cv.maCV || cv.maCv) === maCV ? { ...cv, tieuDe: newTitle } : cv));
            })
            .catch(err => message.error('Đổi tên CV thất bại!'));
    };

    return (
        <div style={{ backgroundColor: '#f4f5f5', minHeight: '100vh', padding: '40px 5%', transition: 'all 0.3s ease' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <Row gutter={[32, 32]}>
                    {/* CỘT TRÁI: QUẢN LÝ CV */}
                    <Col xs={24} lg={16}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <div>
                                <Title level={3} style={{ color: '#262626', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    Hồ sơ của bạn <Badge count={cvList.length} style={{ backgroundColor: '#1890ff' }} />
                                </Title>
                                <Text style={{ color: '#595959', fontSize: '14px' }}>Quản lý và cập nhật các phiên bản CV của bạn</Text>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={handleCreateNew}
                                className="btn-create-cv"
                                style={{
                                    background: 'linear-gradient(90deg, #1890ff, #096dd9)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                                }}
                            >
                                Tạo CV mới
                            </Button>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
                        ) : cvList.length === 0 ? (
                            <Card style={{ backgroundColor: '#ffffff', border: '1px dashed #d9d9d9', textAlign: 'center', padding: '60px 0', borderRadius: '16px' }}>
                                <Empty description={<span style={{ color: '#8c8c8c', fontSize: '16px' }}>Bạn chưa tạo CV nào trên hệ thống.</span>} />
                                <Button type="primary" size="large" onClick={handleCreateNew} className="btn-create-cv" style={{ marginTop: '20px', borderRadius: '8px', fontWeight: 'bold' }}>Tạo CV đầu tiên ngay</Button>
                            </Card>
                        ) : (
                            <Row gutter={[24, 24]}>
                                {cvList.map((cv) => {
                                    const currentId = cv.maCV || cv.maCv;
                                    return (
                                        <Col xs={24} sm={12} xl={12} key={currentId}>
                                            <Card
                                                bodyStyle={{ padding: 0 }}
                                                style={{
                                                    backgroundColor: '#ffffff',
                                                    borderColor: cv.isPrimary ? '#faad14' : '#e8e8e8',
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    boxShadow: cv.isPrimary ? '0 0 15px rgba(250, 173, 20, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                className="cv-premium-card"
                                            >
                                                {/* THUMBNAIL AREA */}
                                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1.414', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
                                                    {cv.isPrimary && (
                                                        <div style={{
                                                            position: 'absolute', top: '12px', left: '-28px', background: 'linear-gradient(90deg, #faad14, #ffc53d)',
                                                            color: '#000', fontWeight: 'bold', padding: '4px 30px', transform: 'rotate(-45deg)', zIndex: 10,
                                                            fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                        }}>
                                                            CV CHÍNH
                                                        </div>
                                                    )}

                                                    {cv.duongDan ? (
                                                        <img src={cv.duongDan} alt="CV Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                                                    ) : (
                                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#bfbfbf', flexDirection: 'column', gap: '10px' }}>
                                                            <FileTextOutlined style={{ fontSize: '40px', opacity: 0.5 }} />
                                                            <Text style={{ color: '#8c8c8c' }}>Đang tạo ảnh bìa...</Text>
                                                        </div>
                                                    )}

                                                    {/* OVERLAY ACTIONS */}
                                                    <div className="cv-premium-overlay" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
                                                        <Button type="primary" shape="round" icon={<EditOutlined />} onClick={() => handleEdit(currentId)} className="btn-overlay-edit" style={{ width: '140px', backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 'bold' }}>
                                                            Chỉnh sửa CV
                                                        </Button>
                                                        <Button shape="round" icon={<DownloadOutlined />} onClick={() => handleDownloadPdf(currentId)} className="btn-overlay-download" style={{ width: '140px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' }}>
                                                            Tải PDF
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* INFO AREA */}
                                                <div style={{ padding: '20px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                            <Title level={5} style={{ color: '#262626', margin: '0 0 6px 0', fontSize: '16px' }} ellipsis
                                                                editable={{
                                                                    icon: <EditOutlined style={{ color: '#8c8c8c', fontSize: '14px' }} />,
                                                                    tooltip: 'Đổi tên CV',
                                                                    onChange: (val) => handleRename(currentId, val)
                                                                }}>
                                                                {cv.tieuDe}
                                                            </Title>
                                                            <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>Cập nhật: {cv.ngayCapNhat}</Text>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <Tooltip title="Đặt làm CV chính (Dùng để NTD chủ động tìm kiếm)">
                                                                <Button
                                                                    type="text"
                                                                    icon={cv.isPrimary ? <StarFilled style={{ color: '#faad14', fontSize: '18px' }} /> : <StarOutlined style={{ color: '#bfbfbf', fontSize: '18px' }} />}
                                                                    onClick={() => !cv.isPrimary && handleSetPrimary(currentId)}
                                                                    style={{ padding: '4px', height: 'auto' }}
                                                                />
                                                            </Tooltip>
                                                            <Popconfirm title="Xóa hồ sơ này?" description="Dữ liệu sẽ bị xóa vĩnh viễn." onConfirm={() => handleDelete(currentId)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                                                                <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: '16px' }} />} style={{ padding: '4px', height: 'auto', color: '#ff4d4f' }} />
                                                            </Popconfirm>
                                                        </div>
                                                    </div>

                                                    <Divider style={{ borderColor: '#f0f0f0', margin: '16px 0' }} />

                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cv.isPublic ? 'rgba(0, 177, 79, 0.08)' : '#fafafa', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${cv.isPublic ? '#00b14f33' : '#f0f0f0'}` }}>
                                                        <Text style={{ color: cv.isPublic ? '#00b14f' : '#595959', fontSize: '13px', fontWeight: 600 }}>
                                                            {cv.isPublic ? 'Đang mở tìm kiếm' : 'Bật cho NTD tìm kiếm'}
                                                        </Text>
                                                        <Switch checked={cv.isPublic} onChange={(checked) => handleTogglePublic(currentId, checked)} style={{ background: cv.isPublic ? '#00b14f' : '#bfbfbf' }} />
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        )}
                    </Col>

                    {/* CỘT PHẢI: PROFILE VÀ TÍNH NĂNG TÌM VIỆC */}
                    <Col xs={24} lg={8}>
                        {/* CARD PROFILE */}
                        <Card
                            style={{
                                backgroundColor: '#ffffff',
                                borderColor: isVipUser ? '#faad14' : '#e8e8e8',
                                marginBottom: '24px',
                                borderRadius: '16px',
                                boxShadow: isVipUser ? '0 8px 24px rgba(250, 173, 20, 0.15)' : '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <Badge dot={isVipUser} offset={[-8, 60]} color="#faad14" style={{ width: 18, height: 18, boxShadow: '0 0 0 3px #ffffff' }}>
                                    <Avatar size={76} src={liveAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} style={{ border: isVipUser ? '3px solid #faad14' : '3px solid #e8e8e8' }} />
                                </Badge>
                                <div>
                                    <Title level={4} style={{ color: '#262626', margin: '0 0 8px 0', fontSize: '18px' }}>{userName}</Title>

                                    <Space wrap size={[6, 6]}>
                                        {isVipUser ? (
                                            <Tag color="gold" style={{ margin: 0, borderRadius: '4px', border: 'none', background: 'linear-gradient(90deg, #faad14, #ffc53d)', color: '#000', fontWeight: 'bold' }}>
                                                <CrownFilled /> PRO / VIP
                                            </Tag>
                                        ) : (
                                            <Tag color="default" style={{ margin: 0, borderRadius: '4px', background: '#f5f5f5', color: '#8c8c8c', border: '1px solid #d9d9d9' }}>
                                                Tài khoản Tiêu chuẩn
                                            </Tag>
                                        )}

                                        {/* HUY HIỆU XÁC THỰC EMAIL */}
                                        {isEmailVerified ? (
                                            <Tag color="success" icon={<CheckCircleFilled />} style={{ margin: 0, borderRadius: '4px', fontWeight: 500 }}>
                                                Đã xác thực Email
                                            </Tag>
                                        ) : (
                                            <Tag
                                                color="warning"
                                                icon={<ExclamationCircleFilled />}
                                                onClick={() => navigate('/verify-email')}
                                                style={{ margin: 0, borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                                            >
                                                Chưa xác thực Email
                                            </Tag>
                                        )}
                                    </Space>
                                </div>
                            </div>

                            {!isVipUser && (
                                <div style={{ marginTop: '24px' }}>
                                    <Button block type="primary" onClick={() => navigate('/upgrade-vip')} className="btn-upgrade-vip" style={{ background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', height: '44px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <RocketOutlined /> Nâng cấp VIP - Mở khóa đặc quyền
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* CARD BẬT TẮT TÌM VIỆC */}
                        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e8e8e8', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: '28px 24px' }}>
                            <div
                                style={{
                                    padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px',
                                    background: isSearchingJob ? 'linear-gradient(135deg, rgba(0, 177, 79, 0.08) 0%, rgba(0, 177, 79, 0.02) 100%)' : '#fafafa',
                                    border: `1px solid ${isSearchingJob ? 'rgba(0, 177, 79, 0.3)' : '#e8e8e8'}`
                                }}
                            >
                                <Switch
                                    checked={isSearchingJob}
                                    loading={isSearchingJobLoading}
                                    onChange={handleToggleJobSearch}
                                    style={{ background: isSearchingJob ? '#1890ff' : '#bfbfbf' }}
                                />
                                <div>
                                    <Title level={5} style={{ color: isSearchingJob ? '#1890ff' : '#262626', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                                        {isSearchingJob ? <><RadarChartOutlined spin style={{ fontSize: '18px' }} /> Đang bật tìm việc</> : 'Đang tắt tìm việc'}
                                    </Title>
                                    <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>
                                        {isSearchingJob ? 'Hồ sơ đang được ưu tiên hiển thị' : 'Nhà tuyển dụng không thể thấy bạn'}
                                    </Text>
                                </div>
                            </div>

                            <Text style={{ color: '#595959', fontSize: '14px', display: 'block', marginBottom: '16px', fontWeight: 500 }}>
                                Lợi ích khi bật trạng thái tìm việc:
                            </Text>

                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ background: 'rgba(0, 177, 79, 0.1)', borderRadius: '50%', padding: '4px' }}>
                                        <CheckCircleFilled style={{ color: '#00b14f', fontSize: '14px', display: 'block' }} />
                                    </div>
                                    <Text style={{ color: '#595959', fontSize: '13.5px', lineHeight: '1.6' }}>Được các Headhunter hàng đầu săn đón và mời ứng tuyển.</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ background: 'rgba(0, 177, 79, 0.1)', borderRadius: '50%', padding: '4px' }}>
                                        <CheckCircleFilled style={{ color: '#00b14f', fontSize: '14px', display: 'block' }} />
                                    </div>
                                    <Text style={{ color: '#595959', fontSize: '13.5px', lineHeight: '1.6' }}>Hồ sơ nổi bật hơn trên hệ thống tìm kiếm ứng viên.</Text>
                                </div>
                            </Space>

                            {isSearchingJob && (
                                <div className="fade-in-section" style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px dashed #e8e8e8' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <FireFilled style={{ color: '#ff4d4f', fontSize: '16px' }} />
                                        <Title level={5} style={{ color: '#262626', margin: 0, fontSize: '15px' }}>Job Alerts (Báo việc làm mới)</Title>
                                    </div>
                                    <Text style={{ color: '#8c8c8c', fontSize: '13.5px', display: 'block', marginBottom: '16px' }}>
                                        Hệ thống sẽ gửi email việc làm phù hợp nhất cho bạn hàng ngày.
                                    </Text>
                                    <Button
                                        type="dashed"
                                        block
                                        className="btn-job-alert-setting"
                                        style={{ borderColor: '#1890ff', color: '#1890ff', borderRadius: '8px', fontWeight: 500, height: '40px', background: 'rgba(24, 144, 255, 0.05)' }}
                                        onClick={() => setIsJobAlertModalOpen(true)}
                                    >
                                        + Cài đặt ngành nghề quan tâm
                                    </Button>
                                </div>
                            )}

                            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                                <Title level={5} style={{ color: '#262626', marginBottom: '8px', fontSize: '15px' }}>Mở khóa CV công khai</Title>
                                <Text style={{ color: '#8c8c8c', fontSize: '13.5px' }}>
                                    Bạn đang có <strong style={{ color: '#1890ff', fontSize: '16px', margin: '0 4px' }}>{(cvList || []).filter(cv => cv.isPublic).length} CV</strong> cho phép Nhà tuyển dụng xem chi tiết.
                                </Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>

            <Modal
                title={null}
                open={isJobAlertModalOpen}
                onCancel={() => setIsJobAlertModalOpen(false)}
                footer={null}
                width={700}
                bodyStyle={{ padding: 0, backgroundColor: 'transparent' }}
                modalRender={(node) => (
                    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.15)' }}>{node}</div>
                )}
            >
                <JobAlertManager />
            </Modal>

            {/* KHUNG TẠO FILE PDF ẨN */}
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none', zIndex: -999 }}>
                {exportingCv && (
                    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                        <div
                            id="hidden-pdf-paper"
                            className="cv-preview-page is-exporting"
                            style={{
                                '--theme-color': exportingCv.color,
                                '--font-family': exportingCv.font,
                                '--base-font-size': '13.5px',
                                '--line-height': 1.5,
                                background: exportingCv.bg !== 'none' ? exportingCv.bg : '#ffffff',
                                width: '210mm',
                                minHeight: '297mm'
                            }}
                        >
                            <MasterTemplate />
                        </div>
                    </ConfigProvider>
                )}
            </div>
        </div>
    );
};

export default ManageCv;