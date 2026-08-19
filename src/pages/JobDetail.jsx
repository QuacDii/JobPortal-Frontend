import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Row, Col, Button, Card, Typography, Spin, Tag, Space, message,
    Modal, Input, Radio, Upload, Form, Divider, Select, Progress
} from 'antd';
import './css/JobDetail.css';
import {
    DollarOutlined, EnvironmentOutlined, CalendarOutlined,
    TeamOutlined, ArrowLeftOutlined, SendOutlined,
    CloudUploadOutlined, FilePdfOutlined, MailOutlined, LockOutlined,
    GoogleOutlined, FacebookFilled, BuildOutlined, FilterOutlined,
    IdcardOutlined, CheckCircleOutlined, RobotOutlined
} from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginRaw from 'react-facebook-login/dist/facebook-login-render-props';
import { PDFDocument, PDFName } from 'pdf-lib';

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

// 🌟 HÀM FORMAT TEXT VÀ XỬ LÝ SẠCH CÁC THẺ <br>
const formatContentText = (content) => {
    if (!content) return "Chưa cập nhật";
    return content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/gi, ' ')
        .trim();
};

const JobDetail = ({ isEmployer = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    // STATES: LỊCH SỬ ĐÃ ỨNG TUYỂN
    const [myApplications, setMyApplications] = useState([]);

    // STATES: MODAL ỨNG TUYỂN
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedViTri, setSelectedViTri] = useState(null);
    const [userCvs, setUserCvs] = useState([]);
    const [aiMatchScore, setAiMatchScore] = useState(null);
    const [aiFeedback, setAiFeedback] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingCvs, setLoadingCvs] = useState(false);
    const [selectedCv, setSelectedCv] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [coverLetter, setCoverLetter] = useState(
        "Kính gửi Ban Tuyển dụng,\n\nTôi tự tin với kiến thức nền tảng về hệ thống. Dù chưa có nhiều kinh nghiệm thực tế, tôi cam kết làm việc với tinh thần trách nhiệm cao, sẵn sàng học hỏi để đóng góp vào sự phát triển của công ty.\n\nRất mong có cơ hội được trao đổi trực tiếp với Quý công ty."
    );

    // STATES: MODAL ĐĂNG NHẬP
    const [loginForm] = Form.useForm();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    useEffect(() => {
        const fetchJobDetailAndApplications = async () => {
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

                    if (!isEmployer) {
                        apiClient.post(`/Jobs/${id}/view`).catch(err => {
                            console.error("Lỗi đếm lượt xem tin:", err);
                        });
                    }
                } else {
                    message.error("Không tìm thấy thông tin công việc!");
                }

                const token = localStorage.getItem('token');
                if (token) {
                    const appRes = await apiClient.get('/JobApplication/my-applications', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = appRes?.data?.data || appRes?.data || (Array.isArray(appRes) ? appRes : []);
                    setMyApplications(data);
                }
            } catch (error) {
                console.error("Lỗi khi tải thông tin:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchJobDetailAndApplications();
    }, [id, isEmployer]);

    useEffect(() => {
        if (isApplyModalOpen && !isEmployer) {
            const token = localStorage.getItem('token');
            if (token) {
                const decoded = parseJwt(token);
                const userId = decoded?.maUser ||
                    decoded?.nameid ||
                    decoded?.id ||
                    decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                    1;

                const fetchCvs = async () => {
                    setLoadingCvs(true);
                    try {
                        const res = await apiClient.get(`/Cv/user/${userId}`);
                        const data = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                        setUserCvs(data);

                        if (data.length > 0) {
                            const primary = data.find(c => c.isPrimary);
                            setSelectedCv(primary ? primary.maCV : data[0].maCV);
                        }
                    } catch (error) {
                        console.error("Lỗi lấy danh sách CV:", error);
                        message.error("Lỗi khi tải danh sách CV từ tài khoản!");
                    } finally {
                        setLoadingCvs(false);
                    }
                };
                fetchCvs();
            }
        }
    }, [isApplyModalOpen, isEmployer]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "Chưa cập nhật";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "Chưa cập nhật" : d.toLocaleDateString('vi-VN');
    };

    const handleAnalyzeFit = async () => {
        if (selectedCv === 'upload' && !uploadedFile) return message.warning("Vui lòng chọn file CV để phân tích!");
        if (!selectedCv && selectedCv !== 'upload') return message.warning("Vui lòng chọn một CV để phân tích!");
        if (!selectedViTri) return message.warning("Vui lòng chọn vị trí làm việc!");

        try {
            setIsAnalyzing(true);
            const token = localStorage.getItem('token');
            let cvIdToAnalyze = selectedCv;

            if (selectedCv === 'upload') {
                message.loading({ content: 'Đang chuẩn bị dữ liệu CV...', key: 'analyze_loading' });
                const formData = new FormData();
                formData.append('file', uploadedFile);

                const uploadRes = await apiClient.post('/Upload/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const uploadedUrl = uploadRes?.url || uploadRes?.data?.url || uploadRes;

                const decoded = parseJwt(token);
                const userId = decoded?.maUser || decoded?.nameid || 1;

                const createCvRes = await apiClient.post('/Cv', {
                    maUser: parseInt(userId),
                    maMau: 1, maHex: "#1890ff",
                    tieuDe: uploadedFile.name.replace(/\.[^/.]+$/, ""),
                    duongDan: uploadedUrl,
                    isPublic: true, isUploaded: true, fontChu: "Arial", ngonNgu: "vi"
                });

                cvIdToAnalyze = createCvRes?.maCv || createCvRes?.data?.maCv || createCvRes?.data?.id;
                setSelectedCv(cvIdToAnalyze);
            }

            message.loading({ content: 'AI đang phân tích độ phù hợp...', key: 'analyze_loading' });
            const response = await apiClient.post('/AiHelper/analyze-fit', {
                maViTri: parseInt(selectedViTri),
                maCv: parseInt(cvIdToAnalyze)
            }, { headers: { Authorization: `Bearer ${token}` } });

            const resData = response.data || response;
            let result = resData;
            while (result && result.diemPhuHop === undefined && result.DiemPhuHop === undefined && result.data) {
                result = result.data;
            }

            const score = result?.diemPhuHop !== undefined ? result.diemPhuHop : result?.DiemPhuHop;
            const feedback = result?.danhGia || result?.DanhGia;

            if (score !== undefined && score !== null) {
                setAiMatchScore(score);
                setAiFeedback(feedback);
                message.success({ content: 'Phân tích hoàn tất!', key: 'analyze_loading' });
            } else {
                const errorMessage = resData.message || resData.error || 'Không thể đọc kết quả do AI trả về định dạng lạ.';
                message.error({ content: errorMessage, key: 'analyze_loading', duration: 6 });
            }
        } catch (error) {
            message.error({
                content: error?.response?.data?.message || 'Lỗi mạng khi gọi hệ thống phân tích!',
                key: 'analyze_loading',
                duration: 5
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getFullLocation = () => {
        if (!job) return 'Chưa cập nhật';
        if (job.phuongXa || job.locationName) {
            const parts = [];
            if (job.phuongXa) parts.push(job.phuongXa);
            if (job.locationName) parts.push(job.locationName);
            return parts.join(', ');
        }
        if (job.danhSachViTri && job.danhSachViTri.length > 0) {
            const viTriCoDiaDiem = job.danhSachViTri.find(vt => vt.phuongXa || vt.locationName || vt.tenPhuong || vt.tenTP);
            if (viTriCoDiaDiem) {
                const parts = [];
                if (viTriCoDiaDiem.phuongXa || viTriCoDiaDiem.tenPhuong) parts.push(viTriCoDiaDiem.phuongXa || viTriCoDiaDiem.tenPhuong);
                if (viTriCoDiaDiem.locationName || viTriCoDiaDiem.tenTP) parts.push(viTriCoDiaDiem.locationName || viTriCoDiaDiem.tenTP);
                let result = parts.join(', ');
                if (job.danhSachViTri.length > 1) result += ' và các khu vực khác';
                return result;
            }
        }
        return 'Chưa cập nhật';
    };

    const isPositionApplied = (maViTri) => {
        if (!maViTri || !myApplications || myApplications.length === 0) return false;
        return myApplications.some(app =>
            Number(app.maViTri) === Number(maViTri) ||
            Number(app.maViTriTuyenDung) === Number(maViTri)
        );
    };

    const handleApplySpecificPosition = (maViTri) => {
        if (isEmployer) {
            navigate(`/employer/candidate-funnel/${maViTri}`);
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoginModalOpen(true);
        } else {
            setSelectedViTri(maViTri);
            setIsApplyModalOpen(true);
        }
    };

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
            message.error(error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
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

   const handleSendApplication = async () => {
        if (selectedCv === 'upload' && !uploadedFile) return message.warning("Vui lòng chọn file CV!");
        if (!selectedCv && selectedCv !== 'upload') return message.warning("Vui lòng chọn một CV!");
        if (!selectedViTri) return message.warning("Vui lòng chọn vị trí làm việc!");

        try {
            const token = localStorage.getItem('token');
            let cvIdToSend = selectedCv;

            // BƯỚC 1: Nếu chọn upload từ máy, tạo bản ghi CV đầy đủ trong Quản lý CV
            if (selectedCv === 'upload') {
                message.loading({ content: 'Đang tải và lưu CV vào hệ thống...', key: 'apply_loading' });

                const formData = new FormData();
                formData.append('file', uploadedFile);

                const uploadRes = await apiClient.post('/Upload/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const uploadedUrl = uploadRes?.url || uploadRes?.data?.url || uploadRes || "";

                const decoded = parseJwt(token);
                const userId = decoded?.maUser || decoded?.nameid || 1;

                // 🌟 Gửi đầy đủ duLieuCv và customLayoutJson để CV xuất hiện trên trang Quản lý CV
                const cvPayload = {
                    maUser: parseInt(userId),
                    maMau: 1,
                    maHex: extractedCvBundle?.settings?.themeColor || "#1890ff",
                    tieuDe: uploadedFile.name.replace(/\.[^/.]+$/, ""),
                    duongDan: uploadedUrl,
                    duLieuCv: extractedCvBundle?.cvData ? JSON.stringify(extractedCvBundle.cvData) : "{}",
                    customLayoutJson: extractedCvBundle?.layoutSchema ? JSON.stringify(extractedCvBundle.layoutSchema) : "{}",
                    fontChu: extractedCvBundle?.settings?.fontFamily || '"Be Vietnam Pro", sans-serif',
                    ngonNgu: extractedCvBundle?.settings?.language || "vi",
                    isPublic: true,
                    isUploaded: true
                };

                const createCvRes = await apiClient.post('/Cv', cvPayload);
                cvIdToSend = createCvRes?.maCv || createCvRes?.data?.maCv || createCvRes?.data?.id || createCvRes?.id;
            }

            // BƯỚC 2: Gửi đơn ứng tuyển
            const payload = {
                maViTri: parseInt(selectedViTri),
                maCv: parseInt(cvIdToSend),
                thuGioiThieu: coverLetter
            };

            await apiClient.post(`/Jobs/${id}/apply`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success({ content: 'Ứng tuyển thành công!', key: 'apply_loading' });
            setIsApplyModalOpen(false);
            setMyApplications(prev => [...prev, { maViTri: Number(selectedViTri) }]);

            Modal.success({
                title: 'Ứng tuyển thành công!',
                content: 'Hồ sơ CV đã được gửi tới Nhà tuyển dụng và lưu vào danh sách Quản lý CV của bạn.',
                okText: 'Đã hiểu'
            });

        } catch (error) {
            message.error({
                content: error.response?.data?.message || "Ứng tuyển thất bại do lỗi hệ thống!",
                key: 'apply_loading'
            });
        }
    };

    const [extractedCvBundle, setExtractedCvBundle] = useState(null);

    // KIỂM TRA CHỈ CHẤP NHẬN FILE PDF ĐƯỢC XUẤT TỪ JOBSNOW
    const uploadProps = {
        accept: ".pdf",
        beforeUpload: async (file) => {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                message.error('Vui lòng chỉ tải lên file định dạng PDF!');
                return Upload.LIST_IGNORE;
            }

            try {
                const arrayBuffer = await file.arrayBuffer();
                let isValidJobsNow = false;
                let parsedBundle = null;

                try {
                    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                    const infoDict = pdfDoc.getInfoDict();
                    const jobsNowMeta = infoDict.get(PDFName.of('JobsNowCvData'));
                    if (jobsNowMeta) {
                        isValidJobsNow = true;
                        try {
                            const encodedStr = jobsNowMeta.asString();
                            const jsonStr = decodeURIComponent(escape(window.atob(encodedStr)));
                            parsedBundle = JSON.parse(jsonStr);
                        } catch (parseErr) {
                            console.warn("Lỗi decode metadata từ PDF:", parseErr);
                        }
                    }
                } catch (e) {
                    console.warn("Lỗi đọc metadata PDF-lib:", e);
                }

                if (!isValidJobsNow) {
                    const uint8 = new Uint8Array(arrayBuffer);
                    const latin1Str = new TextDecoder('latin1').decode(uint8);
                    if (latin1Str.includes('JobsNowCvData') || latin1Str.includes('JobsNow')) {
                        isValidJobsNow = true;
                        const match = latin1Str.match(/\/JobsNowCvData\s*\(([^)]+)\)/);
                        if (match && match[1]) {
                            try {
                                const jsonStr = decodeURIComponent(escape(window.atob(match[1])));
                                parsedBundle = JSON.parse(jsonStr);
                            } catch (e) {}
                        }
                    }
                }

                if (!isValidJobsNow) {
                    Modal.error({
                        title: 'CV không hợp lệ!',
                        content: 'Hệ thống chỉ chấp nhận CV định dạng PDF được tạo và tải về trực tiếp từ nền tảng JobsNow. Vui lòng tạo CV trên JobsNow hoặc sử dụng đúng file PDF đã tải về từ hệ thống.',
                        okText: 'Đã hiểu'
                    });
                    return Upload.LIST_IGNORE;
                }

                setUploadedFile(file);
                setExtractedCvBundle(parsedBundle); // Lưu trữ dữ liệu cấu trúc CV
                setSelectedCv('upload');
                message.success(`Đã xác thực thành công file CV JobsNow: ${file.name}`);
                return false;
            } catch (err) {
                message.error('Lỗi khi kiểm tra file CV! Vui lòng thử lại.');
                return Upload.LIST_IGNORE;
            }
        },
        maxCount: 1,
        onRemove: () => {
            setUploadedFile(null);
            setExtractedCvBundle(null);
        },
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', background: '#f4f5f5', minHeight: '100vh' }}><Spin size="large" /></div>;
    if (!job) return <div style={{ textAlign: 'center', padding: '50px', color: '#262626', background: '#f4f5f5', minHeight: '100vh' }}>Không tìm thấy công việc này.</div>;

    const isSelectedApplied = isPositionApplied(selectedViTri);

    return (
        <div style={{ background: '#f4f5f5', minHeight: '100vh', padding: '30px 20px', color: '#262626' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(isEmployer ? '/employer/jobs' : '/')}
                    style={{ color: '#1890ff', marginBottom: 20, fontWeight: 500 }}
                >
                    {isEmployer ? 'Quay lại danh sách tin đăng' : 'Quay lại danh sách việc làm'}
                </Button>

                {/* HEADER BANNER CHIẾN DỊCH */}
                <Card style={{ background: '#ffffff', borderColor: '#e8e8e8', borderRadius: 12, marginBottom: 24, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                        <div style={{ background: '#ffffff', padding: 8, borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <img src={job.logo || 'https://via.placeholder.com/100'} alt={job.companyName} style={{ width: 90, height: 90, objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Title level={3} style={{ color: '#262626', margin: '0 0 8px 0', fontWeight: '700' }}>{job.title}</Title>
                            <Text style={{ color: '#1890ff', fontSize: 16, display: 'block', marginBottom: 12, fontWeight: '500' }}>{job.companyName}</Text>
                            <Space size="large" wrap>
                                <Text style={{ color: '#d46b08', fontSize: 15, fontWeight: 'bold' }}><BuildOutlined /> Chiến dịch tuyển dụng</Text>
                                <Text style={{ color: '#595959' }}><EnvironmentOutlined /> {getFullLocation()}</Text>
                                <Text style={{ color: '#595959' }}><CalendarOutlined /> Hạn nộp: {formatDate(job.deadline)}</Text>
                            </Space>
                        </div>
                    </div>
                </Card>

                {/* BỐ CỤC CHI TIẾT */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <div style={{ marginBottom: 16 }}>
                            <Title level={4} style={{ color: '#262626', margin: 0, fontWeight: '700' }}>
                                Danh sách vị trí đang tuyển dụng ({job.danhSachViTri?.length || 0})
                            </Title>
                        </div>
                        {job.danhSachViTri && job.danhSachViTri.length > 0 ? (
                            job.danhSachViTri.map((viTri, index) => {
                                const applied = isPositionApplied(viTri.maViTri);
                                return (
                                    <Card
                                        key={viTri.maViTri}
                                        className="position-card"
                                        style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #e8e8e8' }}
                                        styles={{
                                            header: { padding: '16px 20px', height: 'auto', minHeight: '64px' }
                                        }}
                                        title={
                                            // 🌟 TỰ ĐỘNG XUỐNG DÒNG VÀ KHÔNG BỊ NÚT ỨNG TUYỂN ĐÈ LÊN
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingRight: '12px' }}>
                                                <Tag color="orange" style={{ fontSize: '13px', fontWeight: 'bold', border: 'none', margin: 0 }}>
                                                    Vị trí #{index + 1}
                                                </Tag>
                                                <span style={{
                                                    color: '#262626',
                                                    fontSize: '17px',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {viTri.tenViTri}
                                                </span>
                                            </div>
                                        }
                                        extra={
                                            <Button
                                                type="primary"
                                                className={(!isEmployer && applied) ? '' : 'btn-apply-now'}
                                                icon={isEmployer ? <FilterOutlined /> : (applied ? <CheckCircleOutlined /> : <SendOutlined />)}
                                                disabled={!isEmployer && applied}
                                                style={(!isEmployer && applied) ? {
                                                    backgroundColor: '#f5f5f5',
                                                    borderColor: '#d9d9d9',
                                                    color: '#8c8c8c',
                                                    fontWeight: 'bold',
                                                    flexShrink: 0
                                                } : { flexShrink: 0 }}
                                                onClick={() => handleApplySpecificPosition(viTri.maViTri)}
                                            >
                                                {isEmployer ? 'Xem Phễu Ứng Viên' : (applied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay')}
                                            </Button>
                                        }
                                    >
                                        <div style={{
                                            marginBottom: 20, background: '#fafafa', padding: '10px 16px',
                                            borderRadius: '8px', border: '1px solid #e8e8e8', display: 'flex', flexWrap: 'wrap',
                                            gap: '24px', alignItems: 'center', boxSizing: 'border-box', width: '100%'
                                        }}>
                                            <Text style={{ color: '#d46b08', fontWeight: 'bold', fontSize: '15px' }}>
                                                <DollarOutlined /> Mức lương: {viTri.luong || "Thỏa thuận"}
                                            </Text>
                                            <Text style={{ color: '#08979c', fontWeight: '600', fontSize: '15px' }}>
                                                <IdcardOutlined /> Cấp bậc: {viTri.capBac || "Không yêu cầu"}
                                            </Text>
                                            <Text style={{ color: '#006d75', fontWeight: '600', fontSize: '15px' }}>
                                                <TeamOutlined /> Số lượng: {viTri.soLuongTuyen} người
                                            </Text>
                                        </div>

                                        {/* 🌟 MÔ TẢ CÔNG VIỆC: LOẠI BỎ THẺ <br> */}
                                        <div style={{ marginBottom: 20 }}>
                                            <Title level={5} style={{ color: '#1890ff', borderLeft: '3px solid #1890ff', paddingLeft: 8, fontSize: '15px', fontWeight: '700' }}>Mô tả công việc</Title>
                                            <Paragraph style={{ color: '#595959', whiteSpace: 'pre-wrap', lineHeight: '1.7', textAlign: 'justify', paddingLeft: 12 }}>
                                                {formatContentText(viTri.moTaCongViec)}
                                            </Paragraph>
                                        </div>

                                        {/* 🌟 YÊU CẦU ỨNG VIÊN: LOẠI BỎ THẺ <br> */}
                                        <div style={{ marginBottom: 20 }}>
                                            <Title level={5} style={{ color: '#1890ff', borderLeft: '3px solid #1890ff', paddingLeft: 8, fontSize: '15px', fontWeight: '700' }}>Yêu cầu ứng viên</Title>
                                            <Paragraph style={{ color: '#595959', whiteSpace: 'pre-wrap', lineHeight: '1.7', textAlign: 'justify', paddingLeft: 12 }}>
                                                {formatContentText(viTri.yeuCauUngVien)}
                                            </Paragraph>
                                        </div>

                                        {/* 🌟 QUYỀN LỢI ĐƯỢC HƯỞNG: LOẠI BỎ THẺ <br> */}
                                        <div>
                                            <Title level={5} style={{ color: '#1890ff', borderLeft: '3px solid #1890ff', paddingLeft: 8, fontSize: '15px', fontWeight: '700' }}>Quyền lợi được hưởng</Title>
                                            <Paragraph style={{ color: '#595959', whiteSpace: 'pre-wrap', lineHeight: '1.7', textAlign: 'justify', paddingLeft: 12 }}>
                                                {formatContentText(viTri.quyenLoi)}
                                            </Paragraph>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card style={{ background: '#ffffff', borderColor: '#e8e8e8', borderRadius: 12 }}>
                                <div style={{ marginBottom: 24 }}>
                                    <Title level={4} style={{ color: '#262626', borderLeft: '4px solid #1890ff', paddingLeft: 10 }}>Mô tả công việc</Title>
                                    <Paragraph style={{ color: '#595959', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                                        {formatContentText(job.description)}
                                    </Paragraph>
                                </div>
                            </Card>
                        )}
                    </Col>

                    <Col xs={24} lg={8}>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <Card title={<span style={{ color: '#262626', fontWeight: '700' }}>Thông tin chung</span>} style={{ background: '#ffffff', borderColor: '#e8e8e8', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', color: '#8c8c8c' }}>Tổng số lượng cần tuyển</Text>
                                        <Text style={{ color: '#262626', fontWeight: 600 }}>
                                            <TeamOutlined /> {job.danhSachViTri?.reduce((sum, vt) => sum + vt.soLuongTuyen, 0) || job.soLuong || 0} người
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', color: '#8c8c8c' }}>Khu vực làm việc</Text>
                                        <Text style={{ color: '#262626', fontWeight: 600 }}>
                                            <EnvironmentOutlined /> {getFullLocation()}
                                        </Text>
                                    </div>
                                    <Divider style={{ borderColor: '#f0f0f0', margin: '8px 0' }} />
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', color: '#8c8c8c', marginBottom: 8 }}>Sơ lược các vị trí tuyển dụng:</Text>
                                        <ul style={{ paddingLeft: 16, color: '#595959', margin: 0 }}>
                                            {job.danhSachViTri?.map(vt => (
                                                <li key={vt.maViTri} style={{ marginBottom: 8 }}>
                                                    <Text style={{ color: '#262626', fontWeight: '600' }}>{vt.tenViTri}</Text> <br />
                                                    <Text type="secondary" style={{ fontSize: '13px', color: '#8c8c8c' }}>
                                                        ({vt.luong || 'Thỏa thuận'}{vt.capBac ? ` • ${vt.capBac}` : ''})
                                                    </Text>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </Space>
                    </Col>
                </Row>

                {/* MODAL ĐĂNG NHẬP */}
                <Modal
                    title="Đăng nhập để Ứng tuyển"
                    open={isLoginModalOpen}
                    onCancel={() => { setIsLoginModalOpen(false); loginForm.resetFields(); }}
                    footer={null} width={400} centered
                >
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <Text style={{ color: '#595959', fontSize: '14px' }}>Đăng nhập để gửi CV của bạn tới nhà tuyển dụng.</Text>
                    </div>
                    <Form form={loginForm} layout="vertical" onFinish={handlePopupLogin} requiredMark={false}>
                        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
                            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập email của bạn" size="large" style={{ borderRadius: '6px' }} />
                        </Form.Item>
                        <Form.Item label="Mật khẩu" name="matKhau" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập mật khẩu" size="large" style={{ borderRadius: '6px' }} />
                        </Form.Item>
                        <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                            <Button type="primary" htmlType="submit" block size="large" loading={loginLoading} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 'bold', height: '44px', borderRadius: '6px' }}>
                                Đăng nhập
                            </Button>
                        </Form.Item>
                        <Divider plain style={{ borderColor: '#f0f0f0', margin: '20px 0' }}><span style={{ color: '#8c8c8c', fontSize: '13px', padding: '0 10px' }}>Hoặc</span></Divider>
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

                {/* MODAL ỨNG TUYỂN */}
                <Modal
                    title={<div style={{ marginBottom: 16 }}><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626' }}>Ứng tuyển</div><div style={{ fontSize: '15px', color: '#595959', fontWeight: 'normal' }}>{job.title}</div></div>}
                    open={isApplyModalOpen} onCancel={() => setIsApplyModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setIsApplyModalOpen(false)} style={{ background: '#f5f5f5', borderColor: '#d9d9d9', color: '#262626' }}>Hủy</Button>,
                        <Button
                            key="submit"
                            type="primary"
                            disabled={isSelectedApplied}
                            onClick={handleSendApplication}
                            style={{ background: !isSelectedApplied ? '#1890ff' : '#d9d9d9', color: '#fff', fontWeight: 'bold' }}
                        >
                            {isSelectedApplied ? 'Vị trí này bạn đã ứng tuyển' : 'Nộp hồ sơ ứng tuyển'}
                        </Button>
                    ]}
                    width={700} styles={{ content: { backgroundColor: '#ffffff', border: '1px solid #e8e8e8' }, header: { backgroundColor: '#ffffff', borderBottom: '1px solid #f0f0f0', paddingBottom: 12 } }}
                >
                    <Spin spinning={loadingCvs}>
                        <Radio.Group onChange={(e) => setSelectedCv(e.target.value)} value={selectedCv} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {userCvs.length > 0 ? (
                                userCvs.map(cv => (
                                    <div key={cv.maCV} onClick={() => setSelectedCv(cv.maCV)} style={{ padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s', border: selectedCv === cv.maCV ? '1px solid #1890ff' : '1px solid #e8e8e8', backgroundColor: selectedCv === cv.maCV ? 'rgba(24, 144, 255, 0.05)' : '#ffffff' }}>
                                        <Radio value={cv.maCV} style={{ color: '#262626', fontWeight: 500, fontSize: '15px' }}><FilePdfOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />{cv.tieuDe || 'Hồ sơ chưa có tiêu đề'}</Radio>
                                        <div style={{ color: '#8c8c8c', fontSize: '13px', marginLeft: '32px', marginTop: '4px' }}>Cập nhật lần cuối: {cv.ngayCapNhat} {cv.isPrimary && <Text type="success" style={{ marginLeft: 8 }}>(CV Chính)</Text>}</div>
                                    </div>
                                ))
                            ) : (<Text style={{ color: '#8c8c8c', fontStyle: 'italic', marginBottom: 12 }}>Bạn chưa có hồ sơ CV nào lưu trên hệ thống.</Text>)}

                            {/* KHU VỰC TẢI LÊN CV - BẮT BUỘC TỪ JOBSNOW */}
                            <div onClick={() => setSelectedCv('upload')} style={{ padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s', border: selectedCv === 'upload' ? '1px solid #1890ff' : '1px solid #e8e8e8', backgroundColor: selectedCv === 'upload' ? 'rgba(24, 144, 255, 0.05)' : '#ffffff' }}>
                                <Radio value="upload" style={{ color: '#262626', fontWeight: 500, fontSize: '15px', marginBottom: 12 }}>Tải lên CV JobsNow từ máy tính</Radio>
                                <div style={{ marginLeft: 24, paddingRight: 24 }}>
                                    <Dragger {...uploadProps} style={{ background: '#fafafa', borderColor: '#d9d9d9' }}>
                                        <p className="ant-upload-drag-icon"><CloudUploadOutlined style={{ color: '#1890ff' }} /></p>
                                        <p className="ant-upload-text" style={{ color: '#262626', fontSize: '14px', fontWeight: '500' }}>
                                            Chỉ hỗ trợ file PDF được tạo và tải về từ hệ thống JobsNow (dung lượng dưới 5MB)
                                        </p>
                                    </Dragger>
                                </div>
                            </div>
                        </Radio.Group>
                    </Spin>

                    <div style={{ marginTop: 24 }}>
                        <Text strong style={{ display: 'block', color: '#262626', fontSize: '15px', marginBottom: 8 }}>Vị trí ứng tuyển cụ thể <span style={{ color: '#ff4d4f' }}>*</span></Text>
                        <Select style={{ width: '100%' }} placeholder="-- Chọn vị trí công việc --" value={selectedViTri} onChange={(val) => setSelectedViTri(val)}>
                            {job.danhSachViTri && job.danhSachViTri.length > 0 ? (
                                job.danhSachViTri.map(vt => (
                                    <Option key={vt.maViTri} value={vt.maViTri}>
                                        {vt.tenViTri} {vt.capBac ? `[${vt.capBac}]` : ''} {vt.luong ? `(${vt.luong})` : ''}
                                    </Option>
                                ))
                            ) : (<Option value={job.maViTri || job.id}>{job.title}</Option>)}
                        </Select>
                    </div>

                    {/* KHUNG GIAO DIỆN AI PHÂN TÍCH */}
                    <div style={{ marginTop: 24, padding: '16px', background: 'rgba(24, 144, 255, 0.05)', borderRadius: 8, border: '1px dashed #1890ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiMatchScore !== null ? 16 : 0 }}>
                            <div>
                                <Text strong style={{ fontSize: '15px', color: '#1890ff' }}>
                                    <RobotOutlined style={{ marginRight: '6px' }} /> AI Phân tích độ phù hợp
                                </Text>
                                <Text style={{ display: 'block', fontSize: '13px', color: '#595959' }}>Xem trước mức độ phù hợp của bạn với công việc này.</Text>
                            </div>
                            <Button
                                type="primary"
                                icon={<RobotOutlined />}
                                loading={isAnalyzing}
                                onClick={handleAnalyzeFit}
                                style={{ background: '#1890ff', borderColor: '#1890ff' }}
                            >
                                Phân tích ngay
                            </Button>
                        </div>

                        {aiMatchScore !== null && (
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#ffffff', padding: 12, borderRadius: 6, border: '1px solid #e8e8e8' }}>
                                <Progress
                                    type="dashboard"
                                    percent={aiMatchScore}
                                    size={60}
                                    strokeColor={aiMatchScore >= 80 ? '#52c41a' : (aiMatchScore >= 50 ? '#faad14' : '#ff4d4f')}
                                />
                                <div>
                                    <Text strong style={{ color: aiMatchScore >= 80 ? '#52c41a' : (aiMatchScore >= 50 ? '#faad14' : '#ff4d4f') }}>
                                        {aiMatchScore >= 80 ? 'Bạn rất phù hợp với vị trí này!' : (aiMatchScore >= 50 ? 'Bạn phù hợp một phần.' : 'Chưa thực sự đáp ứng yêu cầu.')}
                                    </Text>
                                    <Paragraph style={{ margin: 0, fontSize: '13px', color: '#595959' }}>{aiFeedback}</Paragraph>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}><span style={{ fontSize: '16px', fontWeight: 'bold', color: '#262626' }}>Thư giới thiệu:</span></div>
                        <Text style={{ display: 'block', color: '#8c8c8c', marginBottom: 12, fontSize: '13px' }}>Một thư giới thiệu ngắn gọn, chỉn chu sẽ giúp bạn trở nên chuyên nghiệp và gây ấn tượng hơn với nhà tuyển dụng.</Text>
                        <TextArea rows={6} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} style={{ backgroundColor: '#ffffff', borderColor: '#d9d9d9', color: '#262626', borderRadius: 8 }} />
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default JobDetail;