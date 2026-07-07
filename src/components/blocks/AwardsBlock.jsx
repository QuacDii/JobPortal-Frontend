import React from 'react';
import { Typography } from 'antd';
import useCvStore from '../../store/useCvStore';

const { Title } = Typography;

const AwardsBlock = ({ styles }) => {
    const awards = useCvStore(state => state.cvData.awards);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    const headingColor = styles?.headingColor || themeColor;

    if (!awards || awards.length === 0) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {styles?.headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', whiteSpace: 'nowrap' }}>Giải thưởng</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#d9d9d9' }}></div>
                </div>
            ) : styles?.headingStyle === 'gray-bar' ? (
                <div style={{ backgroundColor: '#f4f4f4', padding: '12px 0', textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4} style={{ color: headingColor, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'inherit' }}>Giải thưởng</Title>
                </div>
            ) : (
                <Title level={4} style={{ color: headingColor, borderBottom: `2px solid ${headingColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>Giải thưởng</Title>
            )}
            
            {awards.map((award) => (
                <div key={award.id} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '1.05em', color: '#333' }}>{award.name}</strong>
                        <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 500 }}>{award.time}</span>
                    </div>
                    {award.description && (
                         <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#555', fontSize: '0.95em' }}>
                            {award.description}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AwardsBlock;