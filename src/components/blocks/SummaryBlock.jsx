import React from 'react';
import useCvStore from '../../store/useCvStore';

const SummaryBlock = (props) => {
    const summary = useCvStore(state => state.cvData.summary);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    const styles = props.styles || props.blockConfig?.styles || props.block?.styles || {};
    
    const headingColor = styles.headingColor || themeColor;
    const headingStyle = styles.headingStyle || 'default';
    const textColor = styles.textColor || '#333333';

    if (!summary) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ 
                        backgroundColor: headingColor, color: '#fff', padding: '6px 20px', 
                        borderRadius: '24px', fontWeight: 'bold', fontSize: '15px' 
                        // ĐÃ XÓA IN HOA TOÀN BỘ Ở ĐÂY
                    }}>
                        Mục tiêu nghề nghiệp
                    </div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: headingColor, opacity: 0.3 }}></div>
                </div>
            ) : (
                <h3 style={{
                    color: headingColor, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '16px', fontSize: '15px',
                    borderBottom: headingStyle === 'underline' ? `1px solid #d9d9d9` : 'none',
                    paddingBottom: headingStyle === 'underline' ? '8px' : '0'
                }}>
                    MỤC TIÊU NGHỀ NGHIỆP
                </h3>
            )}

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: textColor, textAlign: 'justify', fontSize: '14px' }}>
                {summary}
            </div>
        </div>
    );
};

export default SummaryBlock;