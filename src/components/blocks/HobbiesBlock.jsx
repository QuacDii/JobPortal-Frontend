import React from 'react';
import { Typography } from 'antd';
import useCvStore from '../../store/useCvStore';

const { Title } = Typography;

const HobbiesBlock = ({ styles }) => {
    const hobbies = useCvStore(state => state.cvData.hobbies);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    const headingColor = styles?.headingColor || themeColor;

    if (!hobbies) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {/* RENDER TIÊU ĐỀ */}
            {styles?.headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', whiteSpace: 'nowrap' }}>Sở thích</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#d9d9d9' }}></div>
                </div>
            ) : styles?.headingStyle === 'gray-bar' ? (
                <div style={{ backgroundColor: '#f4f4f4', padding: '12px 0', textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4} style={{ color: headingColor, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'inherit' }}>Sở thích</Title>
                </div>
            ) : (
                <Title level={4} style={{ color: headingColor, borderBottom: `2px solid ${headingColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>Sở thích</Title>
            )}
            
            {/* RENDER NỘI DUNG */}
            <div className="whitespace-pre" style={{ lineHeight: '1.8', color: styles?.textColor || 'inherit' }}>
                {hobbies}
            </div>
        </div>
    );
};

export default HobbiesBlock;