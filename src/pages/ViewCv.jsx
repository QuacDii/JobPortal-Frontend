import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Typography, Spin, Button, message } from 'antd';
import { PrinterOutlined, PhoneFilled, MailFilled, EnvironmentFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const ViewCv = () => {
    const { id } = useParams();
    const [cvData, setCvData] = useState(null);
    const [templateId, setTemplateId] = useState(1); // State lưu mã mẫu CV
    const [settings, setSettings] = useState({ themeColor: '#1890ff', fontFamily: 'Roboto, sans-serif' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCv = async () => {
            try {
                const res = await axios.get(`http://localhost:5279/api/Cv/${id}`);
                if (res.data) {
                    setSettings({
                        themeColor: res.data.maHex || '#1890ff',
                        fontFamily: res.data.fontChu || 'Roboto, sans-serif',
                    });
                    setTemplateId(res.data.maMau || 1); // Lấy mã mẫu từ Database
                    if (res.data.duLieuCv) {
                        setCvData(JSON.parse(res.data.duLieuCv));
                    }
                }
            } catch (err) {
                message.error('Không thể tải dữ liệu CV!');
            } finally {
                setLoading(false);
            }
        };
        fetchCv();
    }, [id]);

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#525659' }}><Spin size="large" /></div>;
    if (!cvData) return <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '20px' }}>Không tìm thấy dữ liệu hồ sơ này.</div>;

    // =======================================================
    // 🎨 TEMPLATE 1: MẪU 1 CỘT (MẪU CŨ CỦA BẠN - ẢNH 1)
    // =======================================================
    const renderTemplate1 = () => (
        <div style={{ padding: '50px', color: '#333' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '30px' }}>
                {cvData?.personalInfo?.avatar && (
                    <img src={cvData.personalInfo.avatar} alt="Avatar" style={{ width: '105px', height: '140px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d9d9d9' }} />
                )}
                <div>
                    <Title level={2} style={{ margin: 0, color: settings.themeColor, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'inherit' }}>
                        {cvData.personalInfo.fullName}
                    </Title>
                    <Text style={{ fontSize: '18px', fontWeight: 500, color: '#595959', fontFamily: 'inherit' }}>{cvData.personalInfo.jobTitle}</Text>
                    <div style={{ marginTop: '12px', fontSize: '14px', color: '#8c8c8c' }}>
                        <span>{cvData.personalInfo.phone}</span> | <span>{cvData.personalInfo.email}</span> | <span>{cvData.personalInfo.address}</span>
                    </div>
                </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ borderBottom: `2px solid ${settings.themeColor}`, paddingBottom: '4px', color: settings.themeColor, fontFamily: 'inherit' }}>MỤC TIÊU NGHỀ NGHIỆP</Title>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>{cvData.summary}</div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ borderBottom: `2px solid ${settings.themeColor}`, paddingBottom: '4px', color: settings.themeColor, fontFamily: 'inherit' }}>KỸ NĂNG & NGOẠI NGỮ</Title>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>{cvData.skills}</div>
            </div>

            <div>
                <Title level={5} style={{ borderBottom: `2px solid ${settings.themeColor}`, paddingBottom: '4px', color: settings.themeColor, fontFamily: 'inherit' }}>KINH NGHIỆM LÀM VIỆC</Title>
                <div style={{ marginTop: '16px' }}>
                    {cvData.experience && cvData.experience.map((exp, index) => (
                        <div key={index} style={{ marginBottom: '16px', display: 'flex' }}>
                            <div style={{ width: '150px', fontWeight: 500, color: '#595959' }}>{exp.time}</div>
                            <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid #e8e8e8' }}>
                                <div style={{ fontWeight: 600, fontSize: '16px' }}>{exp.title}</div>
                                <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', color: '#595959' }}>{exp.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // =======================================================
    // 🎨 TEMPLATE 2: MẪU 2 CỘT CHUYÊN NGHIỆP (GIỐNG ẢNH 2)
    // =======================================================
    const renderTemplate2 = () => {
        // Màu nhấn (Vàng/Cam) giống template mẫu
        const accentColor = settings.themeColor === '#1890ff' ? '#f39c12' : settings.themeColor; 

        return (
            <div style={{ display: 'flex', minHeight: '297mm', color: '#333' }}>
                {/* CỘT TRÁI (Màu xám đậm) */}
                <div style={{ width: '38%', backgroundColor: '#434a54', padding: '40px 24px', color: '#fff' }}>
                    {/* Avatar */}
                    {cvData?.personalInfo?.avatar && (
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <img 
                                src={cvData.personalInfo.avatar} 
                                alt="Avatar" 
                                style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '3px solid #5a626c' }} 
                            />
                        </div>
                    )}
                    
                    {/* Tên & Vị trí */}
                    <div style={{ textAlign: 'left', marginBottom: '40px' }}>
                        <Title level={3} style={{ margin: 0, color: accentColor, textTransform: 'uppercase', fontFamily: 'inherit', fontWeight: 700 }}>
                            {cvData.personalInfo.fullName}
                        </Title>
                        <Text style={{ fontSize: '15px', color: '#fff', fontFamily: 'inherit', display: 'block', marginTop: '4px' }}>
                            {cvData.personalInfo.jobTitle}
                        </Text>
                    </div>

                    {/* Thông tin cá nhân */}
                    <div style={{ marginBottom: '40px' }}>
                        <Title level={5} style={{ color: accentColor, borderBottom: `1px solid ${accentColor}`, paddingBottom: '8px', marginBottom: '16px', fontFamily: 'inherit' }}>
                            Thông tin cá nhân
                        </Title>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><PhoneFilled style={{ color: accentColor }}/> {cvData.personalInfo.phone}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><MailFilled style={{ color: accentColor }}/> {cvData.personalInfo.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><EnvironmentFilled style={{ color: accentColor }}/> {cvData.personalInfo.address}</div>
                        </div>
                    </div>

                    {/* Kỹ năng */}
                    <div>
                        <Title level={5} style={{ color: accentColor, borderBottom: `1px solid ${accentColor}`, paddingBottom: '8px', marginBottom: '16px', fontFamily: 'inherit' }}>
                            Kỹ năng
                        </Title>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.8' }}>
                            {cvData.skills}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI (Màu trắng) */}
                <div style={{ width: '62%', backgroundColor: '#fff', padding: '40px 32px' }}>
                    
                    {/* Mục tiêu nghề nghiệp */}
                    <div style={{ marginBottom: '32px' }}>
                        <Title level={4} style={{ color: accentColor, borderBottom: `2px solid ${accentColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '16px', fontFamily: 'inherit' }}>
                            Mục tiêu nghề nghiệp
                        </Title>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6', textAlign: 'justify' }}>
                            {cvData.summary}
                        </div>
                    </div>

                    {/* Kinh nghiệm làm việc */}
                    <div>
                        <Title level={4} style={{ color: accentColor, borderBottom: `2px solid ${accentColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>
                            Kinh nghiệm làm việc
                        </Title>
                        
                        {cvData.experience && cvData.experience.map((exp, index) => (
                            <div key={index} style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                    <strong style={{ fontSize: '16px', color: '#333' }}>{exp.title}</strong>
                                    <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>{exp.time}</span>
                                </div>
                                {/* Phần này mô phỏng tên công ty (nếu bạn gộp chung vào title thì có thể bỏ qua) */}
                                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                                    {exp.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ background: '#525659', minHeight: '100vh', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <style>{`
                .cv-a4-paper {
                    background: white;
                    width: 210mm;
                    min-height: 297mm;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    border-radius: 4px;
                    overflow: hidden; /* Cắt góc tròn cho template 2 cột */
                }
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .cv-a4-paper { box-shadow: none; border-radius: 0; width: 100%; min-height: auto; }
                }
            `}</style>

            <div className="no-print" style={{ width: '210mm', display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ backgroundColor: '#00b14f', borderColor: '#00b14f' }}>
                    Tải xuống PDF
                </Button>
            </div>

            <div className="cv-a4-paper" style={{ fontFamily: settings.fontFamily }}>
                {templateId === 2 ? renderTemplate2() : renderTemplate1()}
            </div>
        </div>
    );
};

export default ViewCv;