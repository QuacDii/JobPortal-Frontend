import React, { useRef, useEffect } from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';

const RichTextNode = ({ dataPath, placeholder, styles, dataScope }) => {
  const updateCvDataPath = useCvStore((state) => state.updateCvDataPath);

  // 1. Tính toán chính xác tuyệt đối đường dẫn mảng lặp
  let finalPath = dataPath;
  if (dataScope && dataScope.parentPath !== undefined) {
    finalPath = `${dataScope.parentPath}[${dataScope.index}].${dataPath}`;
  }

  // 🚀 SỬA LỖI 1: Tối ưu hiệu suất & chặn re-render bừa bãi.
  // Thay vì tải toàn bộ state.cvData, chỉ lắng nghe ĐÚNG giá trị của ô này.
  const rawContent = useCvStore((state) => get(state.cvData, finalPath, ''));
  const htmlContent = typeof rawContent === 'string' ? rawContent : '';

  const editorRef = useRef(null);

  // Hàm kiểm tra rỗng dùng chung
  const checkIsEmpty = (html) => !html || html === '<br>' || html.trim() === '';

  // 🚀 SỬA LỖI 2: Bảo vệ DOM không bị ghi đè khi đang gõ
  useEffect(() => {
    if (editorRef.current) {
      // Chỉ kiểm tra và ghi đè nội dung từ Store -> DOM nếu user KHÔNG ĐANG focus vào ô này
      const isCurrentlyFocused = document.activeElement === editorRef.current;
      
      if (!isCurrentlyFocused && editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
        
        // Cập nhật lại UI dựa trên dữ liệu thật
        if (checkIsEmpty(htmlContent)) {
           editorRef.current.classList.add('is-rich-empty');
        } else {
           editorRef.current.classList.remove('is-rich-empty');
        }
      }
    }
  }, [htmlContent]);

  const handleInput = (e) => {
    const text = e.target.innerHTML;
    if (checkIsEmpty(text)) {
      e.target.classList.add('is-rich-empty');
    } else {
      e.target.classList.remove('is-rich-empty');
    }
  };

  const handleBlur = (e) => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      if (checkIsEmpty(newValue)) {
        updateCvDataPath(finalPath, '');
        e.target.classList.add('is-rich-empty');
      } else {
        updateCvDataPath(finalPath, newValue);
        e.target.classList.remove('is-rich-empty');
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onBlur={handleBlur}
        className={`rich-text-editor ${checkIsEmpty(htmlContent) ? 'is-rich-empty' : ''}`}
        // 🚀 SỬA LỖI 3: Loại bỏ hoàn toàn emptyStyle inline của React 
        // để tránh xung đột, đẩy việc xử lý viền đỏ xuống CSS
        style={{ ...styles, outline: 'none' }}
        data-placeholder={placeholder || 'Nhập mô tả chi tiết tại đây...'}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      <style>{`
        .rich-text-editor {
          position: relative;
          width: 100%;
          word-break: break-word;
          min-height: 20px;
          border-radius: 4px;
          padding: 6px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        /* Xử lý viền đỏ báo rỗng hoàn toàn bằng CSS thay vì React Style */
        .rich-text-editor.is-rich-empty {
          border: 1px dashed #ff4d4f !important;
          min-height: 60px;
          display: block;
        }

        .rich-text-editor.is-rich-empty::before {
          content: attr(data-placeholder);
          color: #8c8c8c;
          opacity: 0.6;
          pointer-events: none;
          position: absolute;
          left: 6px;
          top: 6px;
          font-style: italic;
          display: block;
          width: 90%;
        }
      `}</style>
    </div>
  );
};

export default RichTextNode;