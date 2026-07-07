import React from 'react';
import { Typography } from 'antd';
import useCvStore from '../../store/useCvStore';

const { Title } = Typography;

const ReferencesBlock = ({ styles }) => {
    const references = useCvStore(state => state.cvData.references);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    const headingColor = styles?.headingColor || themeColor;

    if (!references || references.length === 0) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {styles?.headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', whiteSpace: 'nowrap' }}>Người giới thiệu</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#d9d9d9' }}></div>
                </div>
            ) : styles?.headingStyle === 'gray-bar' ? (
                <div style={{ backgroundColor: '#f4f4f4', padding: '12px 0', textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4} style={{ color: headingColor, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'inherit' }}>Người giới thiệu</Title>
                </div>
            ) : (
                <Title level={4} style={{ color: headingColor, borderBottom: `2px solid ${headingColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>Người giới thiệu</Title>
            )}
            
            {references.map((ref) => (
                <div key={ref.id} style={{ marginBottom: '16px' }}>
                    <strong style={{ fontSize: '1.05em', color: '#333', display: 'block', marginBottom: '4px' }}>{ref.name}</strong>
                    <div style={{ color: '#555', fontSize: '0.95em', lineHeight: '1.6' }}>
                        <div>{ref.position}</div>
                        <div>{ref.phone && `SĐT: ${ref.phone}`}</div>
                        <div>{ref.email && `Email: ${ref.email}`}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReferencesBlock;