import React, { useEffect, useRef } from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';

const TextNode = ({ dataPath, placeholder, styles, dataScope }) => {
  const cvData = useCvStore((state) => state.cvData);
  const updateCvDataPath = useCvStore((state) => state.updateCvDataPath);

  const finalPath = dataPath;
  // Lấy dữ liệu thực tế, nếu trống thì trả về chuỗi rỗng tuyệt đối '', KHÔNG lấy placeholder gán vào đây
  const value = get(dataScope || cvData, finalPath, ''); 
  const elementRef = useRef(null);

  // Đồng bộ dữ liệu mượt mà từ Store xuống màn hình
  useEffect(() => {
    if (elementRef.current && elementRef.current.innerText !== value) {
      elementRef.current.innerText = value;
    }
  }, [value]);

  const handleInput = (e) => {
    const text = e.target.innerText;
    updateCvDataPath(finalPath, text);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={elementRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        // Bắn placeholder vào thuộc tính data của HTML chứ không nhét vào ruột
        data-placeholder={placeholder || 'Nhập dữ liệu...'} 
        onInput={handleInput}
        className="editable-text-node"
        style={{
          outline: 'none',
          minWidth: '30px',
          minHeight: '1.2em',
          display: 'inline-block',
          ...styles
        }}
      />

      {/* Nhúng đoạn CSS Ma Thuật để hiển thị chữ bóng ma chuẩn TopCV */}
      <style>{`
        /* Khi thẻ div trống rỗng tuyệt đối, CSS này sẽ tự kích hoạt */
        .editable-text-node:empty::before {
          content: attr(data-placeholder);
          opacity: 0.55; /* Làm mờ chữ đi để tạo hiệu ứng ghost text */
          font-style: italic;
          pointer-events: none; /* Tránh việc người dùng click trúng chữ placeholder */
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default TextNode;