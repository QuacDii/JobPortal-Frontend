import React from 'react';
import { Typography } from 'antd';
import useCvStore from '../../store/useCvStore';

const { Title } = Typography;

const CertificatesBlock = ({ styles }) => {
    const certificates = useCvStore(state => state.cvData.certificates);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    const headingColor = styles?.headingColor || themeColor;

    if (!certificates || certificates.length === 0) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {/* RENDER TIÊU ĐỀ */}
            {styles?.headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', whiteSpace: 'nowrap' }}>Chứng chỉ</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#d9d9d9' }}></div>
                </div>
            ) : styles?.headingStyle === 'gray-bar' ? (
                <div style={{ backgroundColor: '#f4f4f4', padding: '12px 0', textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4} style={{ color: headingColor, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'inherit' }}>Chứng chỉ</Title>
                </div>
            ) : (
                <Title level={4} style={{ color: headingColor, borderBottom: `2px solid ${headingColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>Chứng chỉ</Title>
            )}
            
            {/* RENDER NỘI DUNG */}
            {certificates.map((cert) => (
                <div key={cert.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '1.05em', color: '#333' }}>{cert.name}</strong>
                    <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 500 }}>{cert.time}</span>
                </div>
            ))}
        </div>
    );
};

export default CertificatesBlock;