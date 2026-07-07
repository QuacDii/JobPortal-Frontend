import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Slider } from 'antd';
import useCvStore from '../store/useCvStore';

const blockNames = {
    AvatarBlock: "Ảnh đại diện",
    HeaderBlock: "Họ tên & Vị trí",
    ContactBlock: "Thông tin liên hệ",
    SummaryBlock: "Mục tiêu nghề nghiệp",
    SkillsBlock: "Kỹ năng & Ngoại ngữ",
    ExperienceBlock: "Kinh nghiệm làm việc",
    EducationBlock: "Học vấn",
    ActivitiesBlock: "Hoạt động",
    ProjectsBlock: "Dự án cá nhân",
    CertificatesBlock: "Chứng chỉ",
    AwardsBlock: "Danh hiệu",
    HobbiesBlock: "Sở thích",
    ReferencesBlock: "Người giới thiệu"
};

const LayoutManager = () => {
    const layoutSchema = useCvStore(state => state.layoutSchema);
    const reorderBlocks = useCvStore(state => state.reorderBlocks);
    const moveBlockAcrossColumns = useCvStore(state => state.moveBlockAcrossColumns);
    const updateColumnWidths = useCvStore(state => state.updateColumnWidths);
    const leftColWidth = layoutSchema?.layout[0]?.columns[0]?.widthPercentage || 38;

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setIsMounted(true));
        return () => cancelAnimationFrame(animation);
    }, []);

    const onDragEnd = (result) => {
        if (!result.destination) return; 

        const { source, destination } = result;

        if (source.droppableId === destination.droppableId) {
            if (source.index !== destination.index) {
                reorderBlocks(source.droppableId, source.index, destination.index);
            }
        } else {
            if (moveBlockAcrossColumns) {
                moveBlockAcrossColumns(source.droppableId, destination.droppableId, source.index, destination.index);
            }
        }
    };

    if (!isMounted || !layoutSchema || !layoutSchema.layout) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DragDropContext onDragEnd={onDragEnd}>
                {layoutSchema.layout.map((row, rIndex) => {
                    const isMultiColumn = row.columns.length > 1;

                    return (
                        <div key={rIndex} style={{ marginBottom: '12px' }}>
                            {/* Hiển thị thanh trượt tỉ lệ nếu dòng có nhiều cột */}
                            {isMultiColumn && (
                                <div style={{ marginBottom: '8px', padding: '0 8px' }}>
                                    <Slider
                                        min={20}
                                        max={80}
                                        value={leftColWidth}
                                        onChange={(val) => updateColumnWidths(val)}
                                        trackStyle={{ backgroundColor: '#1890ff' }}
                                        handleStyle={{ borderColor: '#1890ff' }}
                                        tooltip={{ formatter: null }}
                                    />
                                </div>
                            )}

                            {/* HIỂN THỊ DẠNG BẢN ĐỒ THU NHỎ (MINI-WIREFRAME) */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                flexDirection: 'row', // Ép các cột nằm ngang
                                width: '100%' 
                            }}>
                                {row.columns.map((col) => (
                                    <div key={col.columnId} style={{ 
                                        width: `${col.widthPercentage}%`, // Rộng theo đúng tỉ lệ Slider
                                        transition: 'width 0.2s ease-in-out'
                                    }}>
                                        <Droppable droppableId={col.columnId}>
                                            {(provided, snapshot) => (
                                                <div 
                                                    {...provided.droppableProps} 
                                                    ref={provided.innerRef} 
                                                    style={{ 
                                                        minHeight: '80px', 
                                                        padding: '6px', 
                                                        borderRadius: '6px',
                                                        backgroundColor: snapshot.isDraggingOver ? 'rgba(24,144,255,0.05)' : 'transparent',
                                                        border: snapshot.isDraggingOver ? '1px dashed #1890ff' : '1px solid #333',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '8px',
                                                        height: '100%'
                                                    }}
                                                >
                                                    {col.blocks.map((block, index) => (
                                                        <Draggable key={block.id} draggableId={block.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{
                                                                        backgroundColor: snapshot.isDragging ? '#1890ff' : '#1f1f1f',
                                                                        color: snapshot.isDragging ? '#fff' : '#a6a6a6',
                                                                        padding: '12px 8px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '12px',
                                                                        textAlign: 'center',
                                                                        userSelect: 'none',
                                                                        transition: 'background-color 0.2s',
                                                                        boxShadow: snapshot.isDragging ? '0 8px 16px rgba(24,144,255,0.3)' : 'none',
                                                                        
                                                                        // Ép chữ dài biến thành dấu ... giống TopCV
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        
                                                                        ...provided.draggableProps.style
                                                                    }}
                                                                >
                                                                    {blockNames[block.type] || block.type}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </DragDropContext>
        </div>
    );
};

export default LayoutManager;