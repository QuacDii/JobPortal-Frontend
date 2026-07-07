import React from 'react';
import useCvStore from '../../store/useCvStore';

const EducationBlock = (props) => {
    const educationData = useCvStore(state => state.cvData.education);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    
    const styles = props.styles || props.blockConfig?.styles || props.block?.styles || {};
    const headingColor = styles.headingColor || themeColor;
    const headingStyle = styles.headingStyle || 'default';
    const textColor = styles.textColor || '#333333';

    if (!educationData || educationData.length === 0) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '15px' }}>
                        Học vấn
                    </div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: headingColor, opacity: 0.3 }}></div>
                </div>
            ) : (
                <h3 style={{
                    color: headingColor, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '16px', fontSize: '15px',
                    borderBottom: headingStyle === 'underline' ? `1px solid #d9d9d9` : 'none',
                    paddingBottom: headingStyle === 'underline' ? '8px' : '0'
                }}>
                    HỌC VẤN
                </h3>
            )}
            
            {educationData.map((edu) => (
                <div key={edu.id} style={{ marginBottom: '20px' }}>
                    {/* Bố cục linh hoạt: Dàn đều 2 bên, tự động rớt xuống nếu cột quá chật */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: headingColor, flex: '1 1 auto', marginRight: '8px' }}>
                            {edu.school}
                        </div>
                        <div style={{ fontSize: '13px', color: textColor, opacity: 0.8, whiteSpace: 'nowrap', paddingTop: '2px' }}>
                            {edu.time}
                        </div>
                    </div>
                    
                    <div style={{ fontWeight: '500', color: textColor, marginTop: '4px', fontSize: '14px', opacity: 0.9 }}>
                        {edu.major && `Chuyên ngành: ${edu.major}`}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: textColor, marginTop: '8px', fontSize: '14px' }}>
                        {edu.description}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EducationBlock;