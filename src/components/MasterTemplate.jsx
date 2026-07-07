import React from 'react';
import useCvStore from '../store/useCvStore';
import BlockRenderer from './BlockRenderer';

const MasterTemplate = () => {
    const layoutSchema = useCvStore(state => state.layoutSchema);
    const layoutSettings = useCvStore(state => state.layoutSettings);

    if (!layoutSchema || !layoutSchema.layout) return null;

    return (
        <div style={{
            fontFamily: layoutSettings.fontFamily || 'Arial, sans-serif',
            fontSize: `${(layoutSettings.fontSize / 100) * 10 + 10}px`, 
            lineHeight: layoutSettings.lineHeight || 1.5,
            width: '100%',
            minHeight: '297mm', // Chuẩn A4
            backgroundColor: '#ffffff', // 👉 Ép cứng nền trắng cho toàn bộ tờ giấy
            boxSizing: 'border-box'
        }}>
            {layoutSchema.layout.map((row, rIndex) => (
                <div key={`row-${rIndex}`} style={{ ...row.rowStyles, boxSizing: 'border-box' }}>
                    
                    {row.columns.map((col) => (
                        <div 
                            key={col.columnId} 
                            style={{ 
                                ...col.styles, // 👉 Đọc màu sắc cột từ Database (JSON)
                                width: `${col.widthPercentage}%`, 
                                boxSizing: 'border-box' 
                            }}
                        >
                            {col.blocks.map((block) => (
                                <BlockRenderer key={block.id} blockConfig={block} />
                            ))}
                        </div>
                    ))}

                </div>
            ))}
        </div>
    );
};

export default MasterTemplate;