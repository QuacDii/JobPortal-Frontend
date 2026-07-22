import React, { useEffect, useRef } from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';

const TextNode = ({ dataPath, placeholder, styles, dataScope }) => {
  const updateCvDataPath = useCvStore((state) => state.updateCvDataPath);

  // 🚀 SỬA LỖI 1: Tính toán chính xác tuyệt đối đường dẫn mảng lặp
  let finalPath = dataPath;
  if (dataScope && dataScope.parentPath !== undefined) {
    finalPath = `${dataScope.parentPath}[${dataScope.index}].${dataPath}`;
  }

  // 🚀 SỬA LỖI 2: Chỉ lấy đúng dữ liệu của ô này từ store để tránh re-render vô ích
  const value = useCvStore((state) => get(state.cvData, finalPath, '')); 
  const elementRef = useRef(null);

  // 🚀 SỬA LỖI 3: Bảo vệ DOM không bị ghi đè khi đang nhấp nháy chuột gõ chữ
  useEffect(() => {
    if (elementRef.current) {
      const isCurrentlyFocused = document.activeElement === elementRef.current;
      if (!isCurrentlyFocused && elementRef.current.innerText !== value) {
        elementRef.current.innerText = value;
      }
    }
  }, [value]);

  // Đổi sang onBlur (khi click/di chuyển chuột ra ngoài mới lưu) để tăng hiệu năng
  const handleBlur = (e) => {
    const text = e.target.innerText;
    updateCvDataPath(finalPath, text);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={elementRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder || 'Nhập dữ liệu...'} 
        onBlur={handleBlur}
        className="editable-text-node"
        style={{
          outline: 'none',
          minWidth: '30px',
          minHeight: '1.2em',
          display: 'inline-block',
          ...styles
        }}
      />

      <style>{`
        .editable-text-node:empty::before {
          content: attr(data-placeholder);
          opacity: 0.55; 
          font-style: italic;
          pointer-events: none; 
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default TextNode;