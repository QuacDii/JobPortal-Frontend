import React from 'react';
import useCvStore from '../../store/useCvStore';
import { UserOutlined } from '@ant-design/icons';

const AvatarBlock = ({ blockConfig }) => {
    const avatarUrl = useCvStore(state => state.cvData.personalInfo.avatar);
    const styles = blockConfig?.styles || {};
    
    // Nếu JSON gọi 'circle' thì tròn, không thì bo góc nhẹ
    const isCircle = styles.shape === 'circle';

    return (
        <div style={{ textAlign: styles.alignment || 'center', marginBottom: '24px' }}>
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt="Avatar"
                    style={{
                        width: '160px', 
                        height: '160px', 
                        objectFit: 'cover',
                        borderRadius: isCircle ? '50%' : '8px',
                        border: '3px solid rgba(255,255,255,0.2)', // Viền mờ cho sang trọng
                        margin: '0 auto',
                        display: 'block'
                    }}
                />
            ) : (
                <div style={{
                    width: '160px', 
                    height: '160px', 
                    borderRadius: isCircle ? '50%' : '8px',
                    backgroundColor: 'rgba(255,255,255,0.15)', // Đổi màu xám thành màu trắng mờ cho hợp mọi nền
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto', 
                    border: '3px solid rgba(255,255,255,0.2)'
                }}>
                    <UserOutlined style={{ fontSize: '64px', color: 'rgba(255,255,255,0.6)' }} />
                </div>
            )}
        </div>
    );
};

export default AvatarBlock;