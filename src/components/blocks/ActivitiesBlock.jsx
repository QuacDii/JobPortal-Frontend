import React from 'react';
import { Typography } from 'antd';
import useCvStore from '../../store/useCvStore';

const { Title } = Typography;

const ActivitiesBlock = ({ styles }) => {
    const activities = useCvStore(state => state.cvData.activities);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    const headingColor = styles?.headingColor || themeColor;

    if (!activities || activities.length === 0) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {/* RENDER TIÊU ĐỀ */}
            {styles?.headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', whiteSpace: 'nowrap' }}>Hoạt động</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#d9d9d9' }}></div>
                </div>
            ) : styles?.headingStyle === 'gray-bar' ? (
                <div style={{ backgroundColor: '#f4f4f4', padding: '12px 0', textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4} style={{ color: headingColor, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'inherit' }}>Hoạt động</Title>
                </div>
            ) : (
                <Title level={4} style={{ color: headingColor, borderBottom: `2px solid ${headingColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>Hoạt động</Title>
            )}
            
            {/* RENDER NỘI DUNG */}
            {activities.map((act) => (
                <div key={act.id} style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '1.1em', color: '#333' }}>{act.organization}</strong>
                        <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 500 }}>{act.time}</span>
                    </div>
                    <div style={{ fontStyle: 'italic', color: '#555', marginBottom: '4px' }}>
                        Vai trò: {act.role}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#444', textAlign: 'justify' }}>
                        {act.description}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivitiesBlock;