import React from 'react';
import useCvStore from '../../store/useCvStore';

const ExperienceBlock = (props) => {
    const experienceData = useCvStore(state => state.cvData.experience);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    
    const styles = props.styles || props.blockConfig?.styles || props.block?.styles || {};
    const headingColor = styles.headingColor || themeColor;
    const headingStyle = styles.headingStyle || 'default';
    const textColor = styles.textColor || '#333333';

    if (!experienceData || experienceData.length === 0) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px' }}>
                        Kinh nghiệm làm việc
                    </div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: headingColor, opacity: 0.3 }}></div>
                </div>
            ) : (
                <h3 style={{
                    color: headingColor, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '16px', fontSize: '15px',
                    borderBottom: headingStyle === 'underline' ? `1px solid #d9d9d9` : 'none',
                    paddingBottom: headingStyle === 'underline' ? '8px' : '0',
                    backgroundColor: headingStyle === 'gray-bar' ? '#f0f0f0' : 'transparent',
                    padding: headingStyle === 'gray-bar' ? '8px 12px' : '0',
                    letterSpacing: '1px'
                }}>
                    KINH NGHIỆM LÀM VIỆC
                </h3>
            )}
            
            {experienceData.map((exp) => (
                <div key={exp.id} style={{ marginBottom: '20px' }}>
                    {/* Tiêu đề & Thời gian cùng 1 dòng */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: headingColor }}>
                            {exp.title || exp.role || exp.company}
                        </div>
                        <div style={{ fontSize: '13.5px', color: textColor, opacity: 0.8, fontWeight: 500 }}>
                            {exp.time}
                        </div>
                    </div>
                    
                    {/* Tên công ty hoặc mô tả phụ */}
                    <div style={{ fontWeight: '500', color: textColor, marginTop: '4px', fontSize: '14px', opacity: 0.9 }}>
                        {exp.title && exp.company ? exp.company : ''}
                    </div>
                    
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: textColor, marginTop: '8px', fontSize: '14px' }}>
                        {exp.description}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ExperienceBlock;