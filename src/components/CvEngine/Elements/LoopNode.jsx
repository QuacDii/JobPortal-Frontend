import React, { useState } from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';
import AtomicRenderer from '../AtomicRenderer';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, DragOutlined } from '@ant-design/icons';

const LoopNode = ({ dataPath, styles, itemTemplate }) => {
  const cvData = useCvStore(state => state.cvData);
  const addArrayItem = useCvStore(state => state.addArrayItem);
  const removeArrayItem = useCvStore(state => state.removeArrayItem);
  const moveArrayItem = useCvStore(state => state.moveArrayItem); // <--- Lấy hàm di chuyển vừa tạo

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const loopArray = get(cvData, dataPath, []);

  // Khung dữ liệu trống mặc định để làm placeholder ảo
  const defaultEmptyItem = { time: '', companyName: '', title: '', description: '', school: '', major: '', name: '' };
  const isPlaceholder = loopArray.length === 0;
  const displayArray = isPlaceholder ? [defaultEmptyItem] : loopArray;

  return (
    <div style={{ ...styles, position: 'relative' }} className="cv-loop-container">
      {displayArray.map((itemData, index) => (
        <div
          key={itemData.id || index}
          className={`cv-loop-item-block ${hoveredIndex === index ? 'is-hovered' : ''}`}
          style={{
            position: 'relative',
            padding: '8px',
            margin: '-8px -8px 10px -8px',
            borderRadius: '4px',
            transition: 'all 0.15s ease',
            opacity: isPlaceholder ? 0.45 : 1
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* 🛠️ THANH CÔNG CỤ ĐIỀU KHIỂN NỔI (FLOATING TOOLBAR) CHUẨN TOPCV */}
          {hoveredIndex === index && !isPlaceholder && (
            <div className="cv-action-toolbar no-print">
              <div className="toolbar-btn drag-handle"><DragOutlined /></div>
              <button className="toolbar-btn" disabled={index === 0} onClick={() => moveArrayItem(dataPath, index, 'up')}><ArrowUpOutlined /></button>
              <button className="toolbar-btn" disabled={index === loopArray.length - 1} onClick={() => moveArrayItem(dataPath, index, 'down')}><ArrowDownOutlined /></button>

              {/* 1. CHỈ HIỆN NÚT XÓA NẾU DANH SÁCH CÓ TỪ 2 PHẦN TỬ TRỞ LÊN */}
              {displayArray.length > 1 && (
                <button className="toolbar-btn delete-btn" onClick={() => removeArrayItem(dataPath, itemData.id)}>
                  <DeleteOutlined /> Xóa
                </button>
              )}
            </div>
          )}

          {/* Lớp phủ click kích hoạt tạo phần tử thật nếu đang ở trạng thái hiển thị ghost text */}
          {isPlaceholder && (
            <div
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, cursor: 'pointer' }}
              onClick={() => addArrayItem(dataPath, defaultEmptyItem)}
            />
          )}

          {/* Render lõi nội dung chữ */}
          <AtomicRenderer node={itemTemplate} dataScope={{ parentPath: dataPath, index: index, ...itemData }} />
        </div>
      ))}

      {/* Nút thêm mục mới bọc viền nét đứt màu xanh chuẩn chỉ */}
      <div className="no-print" style={{ marginTop: '5px' }}>
        <button
          onClick={() => addArrayItem(dataPath, defaultEmptyItem)}
          className="cv-add-item-button"
        >
          <PlusOutlined /> Thêm mục mới
        </button>
      </div>

      <style>{`
        /* Viền đỏ lờ mờ bao quanh khối khi di chuột vào */
        .cv-loop-item-block.is-hovered {
          outline: 1px dashed rgba(255, 255, 255, 0.6);
          background-color: rgba(255, 255, 255, 0.05);
        }

        /* Thanh dock màu xám chứa nút điều khiển */
        .cv-action-toolbar {
          position: absolute;
          top: -22px;
          left: 10px;
          display: flex;
          align-items: center;
          background: #4d4d4d;
          border-radius: 4px 4px 0 0;
          padding: 2px 4px;
          zIndex: 100;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.15);
        }
          .cv-action-toolbar::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 10px;        /* Tạo một tấm thảm tàng hình 10px tràn xuống dưới */
  background: transparent; /* Giữ trong suốt để không ảnh hưởng giao diện */
  pointer-events: auto;   /* Ép trình duyệt vẫn ghi nhận chuột đang nằm trong cây DOM của Toolbar */
}

        .toolbar-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 2px 6px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.2s;
        }
        .toolbar-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.15);
        }
        .toolbar-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .toolbar-btn.delete-btn {
          background: #ff4d4f;
          border-radius: 2px;
          margin-left: 4px;
          padding: 2px 8px;
          font-weight: 500;
        }
        .toolbar-btn.delete-btn:hover {
          background: #ff7875;
        }
        .drag-handle {
          cursor: move;
          opacity: 0.6;
        }

        /* Định dạng nút + Thêm mục mới viền xanh lá đứt đoạn */
        .cv-add-item-button {
          background: rgba(0, 177, 79, 0.04);
          color: #00b14f;
          border: 1px dashed #00b14f;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .cv-add-item-button:hover {
          background: rgba(0, 177, 79, 0.1);
          box-shadow: 0 2px 6px rgba(0, 177, 79, 0.15);
        }

        @media print {
          .cv-action-toolbar, .cv-add-item-button { display: none !important; }
          .cv-loop-item-block.is-hovered { outline: none !important; background: transparent !important; }
        }
      `}</style>
    </div>
  );
};

export default LoopNode;