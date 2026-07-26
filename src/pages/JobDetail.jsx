import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Row, Col, Button, Card, Typography, Spin, Tag, Space, message,
    Modal, Input, Radio, Upload, Checkbox, Form, Divider, Select
} from 'antd';
import './css/JobDetail.css';
import {
    DollarOutlined, EnvironmentOutlined, CalendarOutlined,
    TeamOutlined, ArrowLeftOutlined, HeartOutlined, SendOutlined,
    CloudUploadOutlined, FilePdfOutlined, MailOutlined, LockOutlined,
    GoogleOutlined, FacebookFilled, BuildOutlined
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';

const FacebookLogin = FacebookLoginRaw.default || FacebookLoginRaw;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    // ================= STATES: MODAL ỨNG TUYỂN =================
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedViTri, setSelectedViTri] = useState(null);
    const [userCvs, setUserCvs] = useState([]);
    const [loadingCvs, setLoadingCvs] = useState(false);
    const [selectedCv, setSelectedCv] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [coverLetter, setCoverLetter] = useState(
        "Kính gửi Ban Tuyển dụng,\n\nTôi tự tin với kiến thức nền tảng về hệ thống. Dù chưa có nhiều kinh nghiệm thực tế, tôi cam kết làm việc với tinh thần trách nhiệm cao, sẵn sàng học hỏi để đóng góp vào sự phát triển của công ty.\n\nRất mong có cơ hội được trao đổi trực tiếp với Quý công ty."
    );
    const [agreed, setAgreed] = useState(false);

    // ================= STATES: MODAL ĐĂNG NHẬP =================
    const [loginForm] = Form.useForm();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    // ================= FETCH DATA CHI TIẾT JOB =================
    useEffect(() => {
        const fetchJobDetail = async () => {
            try {
                const response = await apiClient.get(`/Jobs/${id}`);
                let finalJobData = null;
                if (response) {
                    if (response.data && response.data.data) finalJobData = response.data.data;
                    else if (response.success && response.data) finalJobData = response.data;
                    else if (response.title || response.id) finalJobData = response;
                }

                if (finalJobData) {
                    setJob(finalJobData);
                    if (finalJobData.danhSachViTri && finalJobData.danhSachViTri.length > 0) {
                        setSelectedViTri(finalJobData.danhSachViTri[0].maViTri);
                    }
                } else {
                    message.error("Không tìm thấy thông tin công việc!");
                }
            } catch (error) {
                message.error("Lỗi hệ thống khi tải chi tiết việc làm!");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchJobDetail();
    }, [id]);

    // ================= FETCH DANH SÁCH CV =================
    useEffect(() => {
        if (isApplyModalOpen) {
            const token = localStorage.getItem('token');
            if (token) {
                const decoded = parseJwt(token);

                // 👉 SỬA LỖI 1: Bắt chuẩn xác ID của .NET Core JWT
                const userId = decoded?.maUser ||
                    decoded?.nameid ||
                    decoded?.id ||
                    decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                    1;

                const fetchCvs = async () => {
                    setLoadingCvs(true);
                    try {
                        // Gọi API kèm theo tiền tố /api/ để tránh lỗi 404
                        const res = await apiClient.get(`/Cv/user/${userId}`);

                        // 👉 SỬA LỖI 2: Dùng cú pháp bóc tách an toàn giống hệt trang Home
                        const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);

                        setUserCvs(data);

                        // Tự động tick chọn CV đang được đánh dấu mặc định (isPrimary)
                        if (data.length > 0) {
                            const primary = data.find(c => c.isPrimary);
                            if (primary) setSelectedCv(primary.maCV);
                            else setSelectedCv(data[0].maCV);
                        }
                    } catch (error) {
                        console.error("Lỗi lấy CV:", error);
                        message.error("Lỗi khi tải danh sách CV từ tài khoản!");
                    } finally {
                        setLoadingCvs(false);
                    }
                };
                fetchCvs();
            }
        }
    }, [isApplyModalOpen]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "Chưa cập nhật";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "Chưa cập nhật" : d.toLocaleDateString('vi-VN');
    };

    // ================= TỰ ĐỘNG QUÉT ĐỊA ĐIỂM TỪ CÁC VỊ TRÍ =================
    const getFullLocation = () => {
        if (!job) return 'Chưa cập nhật';

        // Ưu tiên 1: Lấy từ Campaign nếu có
        if (job.phuongXa || job.locationName) {
            const parts = [];
            if (job.phuongXa) parts.push(job.phuongXa);
            if (job.locationName) parts.push(job.locationName);
            return parts.join(', ');
        }

        // Ưu tiên 2: Tự động móc địa điểm từ vị trí đầu tiên trong danh sách
        if (job.danhSachViTri && job.danhSachViTri.length > 0) {
            const viTriCoDiaDiem = job.danhSachViTri.find(vt => vt.phuongXa || vt.locationName || vt.tenPhuong || vt.tenTP);
            if (viTriCoDiaDiem) {
                const parts = [];
                // Tuỳ thuộc vào Backend của bạn trả về tên biến là gì (phuongXa hay tenPhuong)
                if (viTriCoDiaDiem.phuongXa || viTriCoDiaDiem.tenPhuong) parts.push(viTriCoDiaDiem.phuongXa || viTriCoDiaDiem.tenPhuong);
                if (viTriCoDiaDiem.locationName || viTriCoDiaDiem.tenTP) parts.push(viTriCoDiaDiem.locationName || viTriCoDiaDiem.tenTP);

                let result = parts.join(', ');
                if (job.danhSachViTri.length > 1) result += ' và các khu vực khác';
                return result;
            }
        }
        return 'Chưa cập nhật';
    };

    // ================= XỬ LÝ KIỂM TRA ĐĂNG NHẬP =================
    const handleApplySpecificPosition = (maViTri) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoginModalOpen(true);
        } else {
            setSelectedViTri(maViTri);
            setIsApplyModalOpen(true);
        }
    };

    // ================= XỬ LÝ ĐĂNG NHẬP TRÊN POPUP =================
    const handlePopupLogin = async (values) => {
        try {
            setLoginLoading(true);
            const response = await apiClient.post('/auth/login', {
                email: values.email,
                matKhau: values.matKhau
            });

            if (response.data && response.data.success) {
                message.success('Đăng nhập thành công!');
                localStorage.setItem('token', response.data.token);
                setIsLoginModalOpen(false);
                loginForm.resetFields();
                window.location.reload();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!';
            message.error(errorMsg);
        } finally {
            setLoginLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await apiClient.post('/auth/google-login', { accessToken: tokenResponse.access_token });
                const result = response.data !== undefined ? response.data : response;
                if (result && result.success) {
                    message.success('Đăng nhập Google thành công!');
                    localStorage.setItem('token', result.token);
                    window.location.reload();
                }
            } catch (error) { message.error('Đăng nhập Google thất bại!'); }
        },
        onError: () => message.error('Kết nối Google thất bại!')
    });

    // ================= XỬ LÝ NỘP ĐƠN ỨNG TUYỂN =================
    const handleSendApplication = async () => {
        if (!agreed) {
            message.warning("Vui lòng đồng ý với Thỏa thuận sử dụng để tiếp tục!");
            return;
        }
        if (selectedCv === 'upload' && !uploadedFile) {
            message.warning("Vui lòng click vào biểu tượng đám mây để tải file CV lên!");
            return;
        }
        if (!selectedCv && selectedCv !== 'upload') {
            message.warning("Vui lòng chọn một CV để ứng tuyển!");
            return;
        }
        if (!selectedViTri) {
            message.warning("Vui lòng chọn vị trí làm việc mong muốn!");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const cvIdToSend = selectedCv === 'upload' ? 999 : selectedCv;
            const payload = { maViTri: selectedViTri, maCV: cvIdToSend, thuGioiThieu: coverLetter };

            // 👉 BỔ SUNG QUAN TRỌNG: Bóc tách Token để lấy ID của bạn truyền cho Backend C#
            const decoded = parseJwt(token);
            const userId = decoded?.maUser ||
                decoded?.nameid ||
                decoded?.id ||
                decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                1;

            const res = await apiClient.post(`/Jobs/${id}/apply`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    maUser: userId // <--- BẮT BUỘC PHẢI CÓ HEADER NÀY ĐỂ C# KHÔNG BÁO LỖI
                }
            });

            if (res.data && res.data.success) {
                message.success("Nộp đơn ứng tuyển thành công!");
                setIsApplyModalOpen(false);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Ứng tuyển thất bại do lỗi hệ thống!";
            message.error(errorMsg);
        }
    };

    const uploadProps = {
        beforeUpload: (file) => { setUploadedFile(file); setSelectedCv('upload'); return false; },
        maxCount: 1, onRemove: () => setUploadedFile(null),
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', background: '#141414', minHeight: '100vh' }}><Spin size="large" /></div>;
    if (!job) return <div style={{ textAlign: 'center', padding: '50px', color: '#fff', background: '#141414', minHeight: '100vh' }}>Không tìm thấy công việc này.</div>;

    return (
        <div style={{ background: '#141414', minHeight: '100vh', padding: '30px 20px', color: '#fff' }}>

            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ color: '#1890ff', marginBottom: 20 }}>
                    Quay lại danh sách việc làm
                </Button>

                {/* HEADER BANNER CHIẾN DỊCH */}
                <Card style={{ background: '#1f1f1f', borderColor: '#303030', borderRadius: 12, marginBottom: 24, padding: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                        <div style={{ background: '#141414', padding: 8, borderRadius: 8, border: '1px solid #303030' }}>
                            <img src={job.logo || 'https://via.placeholder.com/100'} alt={job.companyName} style={{ width: 90, height: 90, objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Title level={3} style={{ color: '#e6f4ff', margin: '0 0 8px 0' }}>{job.title}</Title>
                            <Text style={{ color: '#1890ff', fontSize: 16, display: 'block', marginBottom: 12 }}>{job.companyName}</Text>
                            <Space size="large" wrap>
                                <Text style={{ color: '#fa8c16', fontSize: 15, fontWeight: 'bold' }}><BuildOutlined /> Chiến dịch tuyển dụng</Text>
                                <Text style={{ color: '#a6a6a6' }}><EnvironmentOutlined /> {getFullLocation()}</Text>
                                <Text style={{ color: '#a6a6a6' }}><CalendarOutlined /> Hạn nộp: {formatDate(job.deadline)}</Text>
                            </Space>
                        </div>
                    </div>
                </Card>

                {/* BỐ CỤC CHI TIẾT (70/30) */}
                <Row gutter={[24, 24]}>
                    {/* CỘT TRÁI: HIỂN THỊ TOÀN BỘ VỊ TRÍ ĐANG TUYỂN DỤNG */}
                    <Col xs={24} lg={16}>
                        <div style={{ marginBottom: 16 }}>
                            <Title level={4} style={{ color: '#e6f4ff', margin: 0 }}>
                                Danh sách vị trí đang tuyển dụng ({job.danhSachViTri?.length || 0})
                            </Title>
                        </div>

                        {job.danhSachViTri && job.danhSachViTri.length > 0 ? (
                            job.danhSachViTri.map((viTri, index) => (
                                <Card
                                    key={viTri.maViTri}
                                    className="position-card"
                                    title={
                                        <Space size="small" style={{ padding: '4px 0' }}>
                                            <Tag color="orange" style={{ fontSize: '13px', fontWeight: 'bold', border: 'none' }}>Vị trí #{index + 1}</Tag>
                                            <span style={{ color: '#e6f4ff', fontSize: '18px', fontWeight: 'bold' }}>{viTri.tenViTri}</span>
                                        </Space>
                                    }
                                    extra={
                                        /* 🎨 NÚT ỨNG TUYỂN MỚI ĐƯỢC THIẾT KẾ LẠI RẤT BẮT MẮT TẠI ĐÂY */
                                        <Button
                                            className="btn-apply-now"
                                            icon={<SendOutlined />}
                                            onClick={() => handleApplySpecificPosition(viTri.maViTri)}
                                        >
                                            Ứng tuyển ngay
                                        </Button>
                                    }
                                >
                                    <div
                                        style={{
                                            marginBottom: 20, background: '#141414', padding: '10px 16px',
                                            borderRadius: '8px', border: '1px solid #262626', display: 'flex',
                                            gap: '24px', alignItems: 'center', boxSizing: 'border-box', width: '100%'
                                        }}
                                    >
                                        <Text style={{ color: '#fa8c16', fontWeight: 'bold', fontSize: '15px' }}>
                                            <DollarOutlined /> Mức lương: {viTri.luong || "Thỏa thuận"}
                                        </Text>
                                        <Text style={{ color: '#00b7c3', fontWeight: '500' }}>
                                            <TeamOutlined /> Số lượng: {viTri.soLuongTuyen} người
                                        </Text>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <Title level={5} style={{ color: '#1890ff', borderLeft: '3px solid #1890ff', paddingLeft: 8, fontSize: '15px' }}>Mô tả công việc</Title>
                                        <Paragraph style={{ color: '#bfbfbf', whiteSpace: 'pre-wrap', lineHeight: '1.7', textAlign: 'justify', paddingLeft: 12 }}>
                                            {viTri.moTaCongViec}
                                        </Paragraph>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <Title level={5} style={{ color: '#1890ff', borderLeft: '3px solid #1890ff', paddingLeft: 8, fontSize: '15px' }}>Yêu cầu ứng viên</Title>
                                        <Paragraph style={{ color: '#bfbfbf', whiteSpace: 'pre-wrap', lineHeight: '1.7', textAlign: 'justify', paddingLeft: 12 }}>
                                            {viTri.yeuCauUngVien}
                                        </Paragraph>
                                    </div>

                                    <div>
                                        <Title level={5} style={{ color: '#1890ff', borderLeft: '3px solid #1890ff', paddingLeft: 8, fontSize: '15px' }}>Quyền lợi được hưởng</Title>
                                        <Paragraph style={{ color: '#bfbfbf', whiteSpace: 'pre-wrap', lineHeight: '1.7', textAlign: 'justify', paddingLeft: 12 }}>
                                            {viTri.quyenLoi}
                                        </Paragraph>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card style={{ background: '#1f1f1f', borderColor: '#303030', borderRadius: 12 }}>
                                <div style={{ marginBottom: 24 }}>
                                    <Title level={4} style={{ color: '#e6f4ff', borderLeft: '4px solid #1890ff', paddingLeft: 10 }}>Mô tả công việc</Title>
                                    <Paragraph style={{ color: '#bfbfbf', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{job.description || 'Chưa cập nhật'}</Paragraph>
                                </div>
                            </Card>
                        )}
                    </Col>

                    {/* CỘT PHẢI: TỔNG QUAN CHIẾN DỊCH */}
                    <Col xs={24} lg={8}>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <Card title={<span style={{ color: '#e6f4ff' }}>Thông tin chung</span>} style={{ background: '#1f1f1f', borderColor: '#303030', borderRadius: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', color: '#777' }}>Tổng số lượng cần tuyển</Text>
                                        <Text style={{ color: '#fff', fontWeight: 500 }}>
                                            <TeamOutlined /> {job.danhSachViTri?.reduce((sum, vt) => sum + vt.soLuongTuyen, 0) || job.soLuong || 0} người
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', color: '#777' }}>Khu vực làm việc</Text>
                                        <Text style={{ color: '#fff', fontWeight: 500 }}>
                                            <EnvironmentOutlined /> {getFullLocation()}
                                        </Text>
                                    </div>
                                    <Divider style={{ borderColor: '#303030', margin: '8px 0' }} />
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', color: '#777', marginBottom: 8 }}>Sơ lược các vị trí tuyển dụng:</Text>
                                        <ul style={{ paddingLeft: 16, color: '#bfbfbf', margin: 0 }}>
                                            {job.danhSachViTri?.map(vt => (
                                                <li key={vt.maViTri} style={{ marginBottom: 6 }}>
                                                    <Text style={{ color: '#fff', fontWeight: '500' }}>{vt.tenViTri}</Text> <br />
                                                    <Text type="secondary" style={{ fontSize: '13px' }}>({vt.luong || 'Thỏa thuận'})</Text>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </Space>
                    </Col>
                </Row>

                {/* ================= MODAL ĐĂNG NHẬP ================= */}
                <Modal
                    title="Đăng nhập để Ứng tuyển"
                    open={isLoginModalOpen}
                    onCancel={() => { setIsLoginModalOpen(false); loginForm.resetFields(); }}
                    footer={null} width={400} className="dark-login-modal" centered
                >
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <Text style={{ color: '#a6a6a6', fontSize: '14px' }}>Đăng nhập để gửi CV của bạn tới nhà tuyển dụng.</Text>
                    </div>
                    <Form form={loginForm} layout="vertical" onFinish={handlePopupLogin} requiredMark={false}>
                        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
                            <Input prefix={<MailOutlined style={{ color: '#666' }} />} placeholder="Nhập email của bạn" size="large" style={{ backgroundColor: '#141414', border: '1px solid #303030', color: '#fff', borderRadius: '6px' }} />
                        </Form.Item>
                        <Form.Item label="Mật khẩu" name="matKhau" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                            <Input.Password prefix={<LockOutlined style={{ color: '#666' }} />} placeholder="Nhập mật khẩu" size="large" style={{ backgroundColor: '#141414', border: '1px solid #303030', color: '#fff', borderRadius: '6px' }} />
                        </Form.Item>
                        <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                            <Button type="primary" htmlType="submit" block size="large" loading={loginLoading} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 'bold', height: '44px', borderRadius: '6px' }}>
                                Đăng nhập
                            </Button>
                        </Form.Item>
                        <Divider plain style={{ borderColor: '#303030', margin: '20px 0' }}><span style={{ color: '#666', fontSize: '13px', padding: '0 10px' }}>Hoặc</span></Divider>
                        <Row gutter={16} style={{ marginBottom: 10 }}>
                            <Col span={12}><Button size="large" block icon={<GoogleOutlined />} onClick={() => loginWithGoogle()} style={{ backgroundColor: '#ea4335', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }}>Google</Button></Col>
                            <Col span={12}>
                                <FacebookLogin
                                    appId="1594501296013131" fields="name,email,picture" scope="public_profile,email"
                                    callback={async (response) => {
                                        if (response.accessToken) {
                                            try {
                                                const res = await apiClient.post('/auth/facebook-login', { accessToken: response.accessToken });
                                                if (res.data.success) { localStorage.setItem('token', res.data.token); window.location.reload(); }
                                            } catch (error) { message.error('Lỗi kết nối Server!'); }
                                        }
                                    }}
                                    render={renderProps => (<Button size="large" block icon={<FacebookFilled />} style={{ backgroundColor: '#1877f2', color: '#fff', border: 'none', fontWeight: '600', borderRadius: 6 }} onClick={renderProps.onClick}>Facebook</Button>)}
                                />
                            </Col>
                        </Row>
                    </Form>
                </Modal>

                {/* ================= MODAL ỨNG TUYỂN ================= */}
                <Modal
                    title={<div style={{ marginBottom: 16 }}><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>Ứng tuyển</div><div style={{ fontSize: '15px', color: '#8c8c8c', fontWeight: 'normal' }}>{job.title}</div></div>}
                    open={isApplyModalOpen} onCancel={() => setIsApplyModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setIsApplyModalOpen(false)} style={{ background: '#303030', borderColor: '#303030', color: '#fff' }}>Hủy</Button>,
                        <Button key="submit" type="primary" disabled={!agreed} onClick={handleSendApplication} style={{ background: agreed ? '#1890ff' : '#434343', color: '#fff', fontWeight: 'bold' }}>Nộp hồ sơ ứng tuyển</Button>
                    ]}
                    width={700} styles={{ content: { backgroundColor: '#1f1f1f', border: '1px solid #303030' }, header: { backgroundColor: '#1f1f1f', borderBottom: '1px solid #303030', paddingBottom: 12 } }}
                >
                    <Spin spinning={loadingCvs}>
                        <Radio.Group onChange={(e) => setSelectedCv(e.target.value)} value={selectedCv} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {userCvs.length > 0 ? (
                                userCvs.map(cv => (
                                    <div key={cv.maCV} onClick={() => setSelectedCv(cv.maCV)} style={{ padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s', border: selectedCv === cv.maCV ? '1px solid #1890ff' : '1px solid #303030', backgroundColor: selectedCv === cv.maCV ? 'rgba(24, 144, 255, 0.05)' : '#141414' }}>
                                        <Radio value={cv.maCV} style={{ color: '#fff', fontWeight: 500, fontSize: '15px' }}><FilePdfOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />{cv.tieuDe || 'Hồ sơ chưa có tiêu đề'}</Radio>
                                        <div style={{ color: '#8c8c8c', fontSize: '13px', marginLeft: '32px', marginTop: '4px' }}>Cập nhật lần cuối: {cv.ngayCapNhat} {cv.isPrimary && <Text type="success" style={{ marginLeft: 8 }}>(CV Chính)</Text>}</div>
                                    </div>
                                ))
                            ) : (<Text style={{ color: '#8c8c8c', fontStyle: 'italic', marginBottom: 12 }}>Bạn chưa có hồ sơ CV nào lưu trên hệ thống.</Text>)}

                            <div onClick={() => setSelectedCv('upload')} style={{ padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s', border: selectedCv === 'upload' ? '1px solid #1890ff' : '1px solid #303030', backgroundColor: selectedCv === 'upload' ? 'rgba(24, 144, 255, 0.05)' : '#141414' }}>
                                <Radio value="upload" style={{ color: '#fff', fontWeight: 500, fontSize: '15px', marginBottom: 12 }}>Tải lên CV từ máy tính, chọn hoặc kéo thả</Radio>
                                <div style={{ marginLeft: 24, paddingRight: 24 }}><Dragger {...uploadProps} style={{ background: '#1f1f1f', borderColor: '#434343' }}><p className="ant-upload-drag-icon"><CloudUploadOutlined style={{ color: '#1890ff' }} /></p><p className="ant-upload-text" style={{ color: '#e6f4ff', fontSize: '14px' }}>Hỗ trợ định dạng .doc, .docx, pdf có kích thước dưới 5MB</p></Dragger></div>
                            </div>
                        </Radio.Group>
                    </Spin>

                    <div style={{ marginTop: 24 }}>
                        <Text strong style={{ display: 'block', color: '#fff', fontSize: '15px', marginBottom: 8 }}>Vị trí ứng tuyển cụ thể <span style={{ color: '#ff4d4f' }}>*</span></Text>
                        <Select className="custom-dark-select" popupClassName="custom-dark-dropdown" style={{ width: '100%' }} placeholder="-- Chọn vị trí công việc --" value={selectedViTri} onChange={(val) => setSelectedViTri(val)}>
                            {job.danhSachViTri && job.danhSachViTri.length > 0 ? (
                                job.danhSachViTri.map(vt => (<Option key={vt.maViTri} value={vt.maViTri}>{vt.tenViTri} {vt.luong ? `(${vt.luong})` : ''}</Option>))
                            ) : (<Option value={job.maViTri || job.id}>{job.title}</Option>)}
                        </Select>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}><span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Thư giới thiệu:</span></div>
                        <Text style={{ display: 'block', color: '#8c8c8c', marginBottom: 12, fontSize: '13px' }}>Một thư giới thiệu ngắn gọn, chỉn chu sẽ giúp bạn trở nên chuyên nghiệp và gây ấn tượng hơn với nhà tuyển dụng.</Text>
                        <TextArea rows={6} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} style={{ backgroundColor: '#141414', borderColor: '#303030', color: '#e6f4ff', borderRadius: 8 }} />
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Checkbox style={{ color: '#a6a6a6' }}>Cho phép hệ thống sử dụng <Text style={{ color: '#1890ff', textDecoration: 'underline' }}>công nghệ AI</Text> để phân tích độ phù hợp CV của bạn</Checkbox>
                        <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ color: '#a6a6a6' }}>Tôi đã đọc và đồng ý với <Text style={{ color: '#1890ff', textDecoration: 'underline' }}>Thỏa thuận sử dụng dữ liệu cá nhân</Text> của Nhà tuyển dụng</Checkbox>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default JobDetail;