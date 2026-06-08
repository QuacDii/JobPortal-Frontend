import React, { useState } from 'react';
import { Row, Col, Card, Form, Input, Typography, Divider, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CvBuilder = () => {
    // ==========================================
    // 1. STATE QUẢN LÝ DỮ LIỆU CV REALTIME
    // ==========================================
    const [cvData, setCvData] = useState({
        personalInfo: {
            fullName: 'Đặng Quốc Duy',
            jobTitle: 'Fresher Web/Backend Developer',
            email: 'dangquocduy2004@gmail.com',
            phone: '0901234567',
            address: 'TP. Hồ Chí Minh'
        },
        summary: 'Sinh viên đam mê lập trình, định hướng phát triển chuyên sâu mảng công nghệ phần mềm. Mong muốn tìm kiếm môi trường chuyên nghiệp để áp dụng kiến thức vào thực tế.',
        skills: 'ReactJS, .NET, SQL, TypeScript, Java\nTiếng Anh: TOEIC 785',
        experience: [
            { id: 1, time: '03/2026 - Hiện tại', title: 'Fresher .NET Developer tại FPT Software', description: 'Tham gia phát triển hệ thống nội bộ sử dụng .NET và SQL Server.\nTối ưu hóa query database giúp tăng tốc độ tải trang.' },
            { id: 2, time: '10/2025 - 12/2025', title: 'Thực tập sinh Đồ án', description: 'Thiết kế và xây dựng hệ thống đặt vé xem phim.\nSử dụng ReactJS cho Frontend và Java cho Backend.' }
        ]
    });

    // ==========================================
    // 2. CÁC HÀM XỬ LÝ SỰ KIỆN GÕ PHÍM
    // ==========================================
    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setCvData({
            ...cvData,
            personalInfo: { ...cvData.personalInfo, [name]: value }
        });
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setCvData({ ...cvData, [name]: value });
    };

    // Hàm Thêm/Sửa/Xóa mảng Kinh nghiệm
    const addExperience = () => {
        const newExp = { id: Date.now(), time: '', title: '', description: '' };
        setCvData({ ...cvData, experience: [...cvData.experience, newExp] });
    };

    const removeExperience = (id) => {
        setCvData({ ...cvData, experience: cvData.experience.filter(item => item.id !== id) });
    };

    const handleExperienceChange = (id, field, value) => {
        const updatedExp = cvData.experience.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        );
        setCvData({ ...cvData, experience: updatedExp });
    };

    // Hàm gọi in PDF
    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="cv-builder-wrapper" style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            
            {/* CSS XỬ LÝ ẨN FORM KHI XUẤT PDF VÀ TRANG TRÍ GIAO DIỆN */}
            <style>{`
                /* Định dạng chung */
                .cv-preview-page {
                    background: white;
                    border-radius: 8px;
                    min-height: 297mm; /* Chuẩn A4 */
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    padding: 40px;
                }
                
                /* Render ký tự xuống dòng (\n) thành <br/> trong HTML */
                .whitespace-pre {
                    white-space: pre-wrap;
                }

                /* ==========================================
                   MAGIC Ở ĐÂY: CSS DÀNH RIÊNG CHO LÚC IN PDF
                   ========================================== */
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white; margin: 0; padding: 0; }
                    
                    /* Ẩn toàn bộ form nhập, nút bấm, header, footer */
                    .no-print, .ant-layout-header, .ant-layout-footer {
                        display: none !important;
                    }
                    
                    /* Mở rộng bản Preview tràn viền A4 */
                    .cv-builder-wrapper { padding: 0 !important; background: white !important; }
                    .print-full-width { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; }
                    .cv-preview-page { box-shadow: none !important; border-radius: 0 !important; padding: 15mm 20mm !important; }
                }
            `}</style>

            <Row gutter={[24, 24]}>
                
                {/* ==========================================
                    CỘT BÊN TRÁI: FORM NHẬP LIỆU (ẨN KHI IN)
                ========================================== */}
                <Col xs={24} lg={10} className="no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Title level={4} style={{ margin: 0 }}>Nhập thông tin CV</Title>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF} style={{ backgroundColor: '#00b14f' }}>
                            Tải CV (PDF)
                        </Button>
                    </div>

                    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                        
                        {/* Khối Thông tin cá nhân */}
                        <Card title="Thông tin cá nhân" size="small" bordered={false} style={{ borderRadius: '8px' }}>
                            <Form layout="vertical">
                                <Form.Item label="Họ và Tên"><Input name="fullName" value={cvData.personalInfo.fullName} onChange={handlePersonalInfoChange} /></Form.Item>
                                <Form.Item label="Vị trí ứng tuyển"><Input name="jobTitle" value={cvData.personalInfo.jobTitle} onChange={handlePersonalInfoChange} /></Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}><Form.Item label="Email"><Input name="email" value={cvData.personalInfo.email} onChange={handlePersonalInfoChange} /></Form.Item></Col>
                                    <Col span={12}><Form.Item label="Số điện thoại"><Input name="phone" value={cvData.personalInfo.phone} onChange={handlePersonalInfoChange} /></Form.Item></Col>
                                </Row>
                                <Form.Item label="Địa chỉ"><Input name="address" value={cvData.personalInfo.address} onChange={handlePersonalInfoChange} /></Form.Item>
                            </Form>
                        </Card>

                        {/* Khối Tóm tắt & Kỹ năng */}
                        <Card title="Tóm tắt & Kỹ năng" size="small" bordered={false} style={{ borderRadius: '8px' }}>
                            <Form layout="vertical">
                                <Form.Item label="Mục tiêu nghề nghiệp">
                                    <TextArea rows={3} name="summary" value={cvData.summary} onChange={handleTextChange} />
                                </Form.Item>
                                <Form.Item label="Kỹ năng chuyên môn & Ngoại ngữ">
                                    <TextArea rows={3} name="skills" value={cvData.skills} onChange={handleTextChange} />
                                </Form.Item>
                            </Form>
                        </Card>

                        {/* Khối Kinh nghiệm (Form Động) */}
                        <Card title="Kinh nghiệm làm việc" size="small" bordered={false} style={{ borderRadius: '8px' }}>
                            {cvData.experience.map((exp) => (
                                <div key={exp.id} style={{ marginBottom: '16px', padding: '12px', border: '1px dashed #d9d9d9', borderRadius: '6px' }}>
                                    <Form layout="vertical" size="small">
                                        <Form.Item label="Thời gian">
                                            <Input value={exp.time} onChange={(e) => handleExperienceChange(exp.id, 'time', e.target.value)} />
                                        </Form.Item>
                                        <Form.Item label="Vị trí / Tên Dự án">
                                            <Input value={exp.title} onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)} />
                                        </Form.Item>
                                        <Form.Item label="Chi tiết công việc">
                                            <TextArea rows={3} value={exp.description} onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)} />
                                        </Form.Item>
                                    </Form>
                                    <div style={{ textAlign: 'right' }}>
                                        <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => removeExperience(exp.id)}>Xóa mục này</Button>
                                    </div>
                                </div>
                            ))}
                            <Button type="dashed" block icon={<PlusOutlined />} onClick={addExperience}>
                                Thêm kinh nghiệm
                            </Button>
                        </Card>
                    </Space>
                </Col>


                {/* ==========================================
                    CỘT BÊN PHẢI: BẢN XEM TRƯỚC (LIVE PREVIEW)
                ========================================== */}
                <Col xs={24} lg={14} className="print-full-width">
                    <div style={{ position: 'sticky', top: '24px' }}>
                        
                        {/* Khung Giấy A4 */}
                        <div className="cv-preview-page">
                            
                            {/* HEADER CV */}
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <Title level={2} style={{ margin: 0, color: '#1890ff', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                    {cvData.personalInfo.fullName || 'HỌ VÀ TÊN'}
                                </Title>
                                <Text style={{ fontSize: '18px', fontWeight: 500, color: '#595959' }}>
                                    {cvData.personalInfo.jobTitle || 'Vị trí ứng tuyển'}
                                </Text>
                                <div style={{ marginTop: '12px', fontSize: '14px', color: '#8c8c8c' }}>
                                    <span>{cvData.personalInfo.phone}</span>
                                    <Divider type="vertical" />
                                    <span>{cvData.personalInfo.email}</span>
                                    <Divider type="vertical" />
                                    <span>{cvData.personalInfo.address}</span>
                                </div>
                            </div>

                            {/* TÓM TẮT */}
                            <div style={{ marginBottom: '24px' }}>
                                <Title level={5} style={{ borderBottom: '2px solid #1890ff', paddingBottom: '4px', textTransform: 'uppercase' }}>Mục tiêu nghề nghiệp</Title>
                                <div className="whitespace-pre" style={{ marginTop: '8px', color: '#333', lineHeight: '1.6' }}>
                                    {cvData.summary}
                                </div>
                            </div>

                            {/* KỸ NĂNG */}
                            <div style={{ marginBottom: '24px' }}>
                                <Title level={5} style={{ borderBottom: '2px solid #1890ff', paddingBottom: '4px', textTransform: 'uppercase' }}>Kỹ năng & Ngoại ngữ</Title>
                                <div className="whitespace-pre" style={{ marginTop: '8px', color: '#333', lineHeight: '1.6' }}>
                                    {cvData.skills}
                                </div>
                            </div>

                            {/* KINH NGHIỆM LÀM VIỆC */}
                            <div>
                                <Title level={5} style={{ borderBottom: '2px solid #1890ff', paddingBottom: '4px', textTransform: 'uppercase' }}>Kinh nghiệm / Dự án</Title>
                                <div style={{ marginTop: '16px' }}>
                                    {cvData.experience.map((exp, index) => (
                                        <div key={exp.id || index} style={{ marginBottom: '16px', display: 'flex' }}>
                                            {/* Cột thời gian */}
                                            <div style={{ width: '150px', flexShrink: 0, fontWeight: 500, color: '#595959' }}>
                                                {exp.time}
                                            </div>
                                            {/* Cột nội dung */}
                                            <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid #e8e8e8' }}>
                                                <div style={{ fontWeight: 600, color: '#262626', fontSize: '15px' }}>{exp.title}</div>
                                                <div className="whitespace-pre" style={{ marginTop: '4px', color: '#595959', lineHeight: '1.6' }}>
                                                    {exp.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default CvBuilder;