import React from 'react';
import useCvStore from '../../store/useCvStore';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';

const ContactBlock = (props) => {
    const personalInfo = useCvStore(state => state.cvData.personalInfo);
    const styles = props.styles || props.blockConfig?.styles || props.block?.styles || {};

    const iconColor = styles.iconColor || '#1890ff';
    const textColor = styles.textColor || '#333333';
    const showIcons = styles.showIcons !== false; 
    const showLabels = styles.showLabels === true; 

    if (!personalInfo) return null;

    // Định dạng để nhãn (Label) luôn rộng 110px, ép các giá trị thẳng hàng
    const rowStyle = { display: 'flex', marginBottom: '8px', alignItems: 'flex-start' };
    const labelStyle = { width: '110px', color: '#777', fontWeight: 'bold', fontSize: '13px' };
    const valueStyle = { flex: 1, color: textColor, fontSize: '14px', wordBreak: 'break-word' };

    return (
        <div style={{ width: '100%', marginBottom: '16px', textAlign: 'left' }}>
            {styles.showTitle && <h3 style={{ color: iconColor, marginBottom: '12px', fontSize: '1.2em' }}>THÔNG TIN LIÊN HỆ</h3>}
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {personalInfo.phone && (
                    <div style={rowStyle}>
                        {showIcons && <PhoneOutlined style={{ color: iconColor, marginRight: '8px' }} />}
                        {showLabels && <div style={labelStyle}>Số điện thoại:</div>}
                        <div style={valueStyle}>{personalInfo.phone}</div>
                    </div>
                )}
                {personalInfo.email && (
                    <div style={rowStyle}>
                        {showIcons && <MailOutlined style={{ color: iconColor, marginRight: '8px' }} />}
                        {showLabels && <div style={labelStyle}>Email:</div>}
                        <div style={valueStyle}>{personalInfo.email}</div>
                    </div>
                )}
                {personalInfo.address && (
                    <div style={rowStyle}>
                        {showIcons && <EnvironmentOutlined style={{ color: iconColor, marginRight: '8px' }} />}
                        {showLabels && <div style={labelStyle}>Địa chỉ:</div>}
                        <div style={valueStyle}>{personalInfo.address}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactBlock;