import React, { useRef, useEffect } from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';

const RichTextNode = ({ dataPath, placeholder, styles, dataScope }) => {
  const updateCvDataPath = useCvStore((state) => state.updateCvDataPath);
  const cvData = useCvStore((state) => state.cvData);
  const editorRef = useRef(null);

  // Tính toán đường dẫn chính xác (Xử lý trường hợp mảng lặp như experiences[0].description)
  let finalPath = dataPath;
  if (dataScope && dataScope.parentPath !== undefined) {
    finalPath = `${dataScope.parentPath}[${dataScope.index}].${dataPath}`;
  }

  // Lấy dữ liệu văn bản dạng HTML từ store
  const htmlContent = get(dataScope || cvData, dataPath, '');

  // Khi người dùng click ra ngoài (Blur), lưu lại chuỗi HTML vào Store
  const handleBlur = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      // Tránh lưu các thẻ rỗng do trình duyệt tự sinh ra
      if (newValue === '<br>' || newValue.trim() === '') {
        updateCvDataPath(finalPath, '');
      } else {
        updateCvDataPath(finalPath, newValue);
      }
    }
  };

  // Cấu hình nét đứt màu đỏ cảnh báo khi vùng nhập liệu bị trống giống hệt TopCV
  const emptyStyle = !htmlContent || htmlContent === '<br>' || htmlContent === ''
    ? { border: '1px dashed #ff4d4f', minHeight: '60px', display: 'block', opacity: 0.6, padding: '6px' }
    : {};

  return (
    <div
      ref={editorRef}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onBlur={handleBlur}
      style={{ ...styles, ...emptyStyle, outline: 'none' }}
      dangerouslySetInnerHTML={{ __html: htmlContent || placeholder || 'Nhập mô tả chi tiết tại đây...' }}
    />
  );
};

export default RichTextNode;