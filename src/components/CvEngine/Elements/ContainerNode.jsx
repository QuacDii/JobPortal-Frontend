import React, { useState } from 'react';
import useCvStore from '../../../store/useCvStore';

const ContainerNode = ({ node, children, isRoot = false }) => {
  const layoutSettings = useCvStore((state) => state.layoutSettings) || {};
  const addMacroSection = useCvStore((state) => state.addMacroSection);
  
  const [isDragOver, setIsDragOver] = useState(false);

  const { fontFamily, fontSize, lineHeight, themeColor } = layoutSettings;
  const inlineStyles = node?.styles || {};
  
  const isColumn = node.id === 'left-col' || node.id === 'right-col';

  const handleDragOver = (e) => {
    if (!isColumn) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDrop = (e) => {
    if (!isColumn) return;
    e.preventDefault();
    setIsDragOver(false);
    try {
      const rawData = e.dataTransfer.getData("text/plain");
      const parsedData = JSON.parse(rawData);

      if (parsedData.type === 'MOVE_EXISTING_SECTION') {
        useCvStore.getState().moveSectionToColumn(parsedData.sectionId, node.id);
      } else {
        addMacroSection(node.id, parsedData);
      }
    } catch (err) {
      console.error("Lỗi phân tích dữ liệu thả:", err);
    }
  };

  const computedStyles = {
    ...inlineStyles,
    position: 'relative',
    ...(isRoot && {
      '--theme-color': themeColor || '#00b14f',
      '--font-family': fontFamily || 'Roboto, sans-serif',
      '--base-font-size': `${fontSize || 14}px`,
      '--line-height': lineHeight || 1.5,
      fontFamily: 'var(--font-family)',
      fontSize: 'var(--base-font-size)',
      lineHeight: 'var(--line-height)',
    }),
    ...(isDragOver && {
      outline: '2px dashed #00b14f',
      backgroundColor: 'rgba(0, 177, 79, 0.02)',
      transition: 'all 0.2s'
    })
  };

  return (
    <div
      style={computedStyles}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};

export default ContainerNode;