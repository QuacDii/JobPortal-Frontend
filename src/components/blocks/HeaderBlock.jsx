import React from 'react';
import useCvStore from '../../store/useCvStore';

const HeaderBlock = (props) => {
    const personalInfo = useCvStore(state => state.cvData.personalInfo);
    const styles = props.styles || props.blockConfig?.styles || props.block?.styles || {};

    const alignment = styles.alignment || 'left';
    const titleColor = styles.titleColor || '#000000';
    const subtitleColor = styles.subtitleColor || '#333333';

    if (!personalInfo) return null;

    return (
        <div style={{ textAlign: alignment, marginBottom: '24px' }}>
            <h1 style={{ 
                margin: 0, 
                fontSize: '24px', // Thu nhỏ font lại để không bị rớt dòng
                color: titleColor, 
                fontWeight: 'bold',
                // Bỏ textTransform: uppercase ở đây
            }}>
                {personalInfo.fullName || 'Họ và tên'}
            </h1>
            <h2 style={{ 
                margin: '6px 0 0 0', 
                fontSize: '16px', 
                color: subtitleColor, 
                fontWeight: 'normal',
                fontStyle: 'italic', // Ép in nghiêng cho giống TopCV
                opacity: 0.9
            }}>
                {personalInfo.jobTitle || 'Vị trí ứng tuyển'}
            </h2>
        </div>
    );
};

export default HeaderBlock;