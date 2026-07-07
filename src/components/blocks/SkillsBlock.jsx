import React from 'react';
import useCvStore from '../../store/useCvStore';

const SkillsBlock = (props) => {
    const skills = useCvStore(state => state.cvData.skills);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    
    const styles = props.styles || props.blockConfig?.styles || props.block?.styles || {};
    const headingColor = styles.headingColor || themeColor;
    const headingStyle = styles.headingStyle || 'default';
    const textColor = styles.textColor || '#333333';

    if (!skills) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px' }}>
                        Kỹ năng
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
                    KỸ NĂNG
                </h3>
            )}
            
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: textColor, fontSize: '14px' }}>
                {skills}
            </div>
        </div>
    );
};

export default SkillsBlock;