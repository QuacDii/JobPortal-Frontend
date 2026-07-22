import React from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';
import AtomicRenderer from '../AtomicRenderer';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const LoopNode = ({ dataPath, styles, itemTemplate }) => {
  const cvData = useCvStore(state => state.cvData);
  const addArrayItem = useCvStore(state => state.addArrayItem);
  const removeArrayItem = useCvStore(state => state.removeArrayItem);
  const moveArrayItem = useCvStore(state => state.moveArrayItem); 

  const loopArray = get(cvData, dataPath, []);
  const defaultEmptyItem = { time: '', companyName: '', title: '', description: '', school: '', major: '', name: '' };
  const isPlaceholder = loopArray.length === 0;
  const displayArray = isPlaceholder ? [defaultEmptyItem] : loopArray;

  return (
    <div style={{ ...styles, position: 'relative' }} className="cv-loop-container">
      {displayArray.map((itemData, index) => (
        <div
          key={itemData.id || index}
          className={`cv-loop-item-block ${isPlaceholder ? 'is-ghost' : ''}`}
          style={{
            position: 'relative',
            padding: '12px 8px 8px 8px',
            margin: '-12px -8px 14px -8px',
            borderRadius: '4px',
            transition: 'all 0.15s ease',
            opacity: isPlaceholder ? 0.35 : 1
          }}
        >
          {/* THANH CÔNG CỤ: Được CSS ẩn đi và tự hiện lên khi hover */}
          <div className="cv-action-toolbar no-print">
            {!isPlaceholder && (
              <>
                {index > 0 && (
                  <button className="toolbar-btn" onClick={() => moveArrayItem(dataPath, index, 'up')}>
                    <ArrowUpOutlined />
                  </button>
                )}
                {index < loopArray.length - 1 && (
                  <button className="toolbar-btn" onClick={() => moveArrayItem(dataPath, index, 'down')}>
                    <ArrowDownOutlined />
                  </button>
                )}
              </>
            )}
            {!isPlaceholder && loopArray.length > 1 && (
              <button className="toolbar-btn delete-btn" onClick={() => removeArrayItem(dataPath, itemData.id)}>
                Xóa
              </button>
            )}
          </div>

          <button className="cv-inline-add-button no-print" onClick={() => addArrayItem(dataPath, defaultEmptyItem)}>
            <PlusOutlined /> Thêm
          </button>

          {isPlaceholder && (
            <div
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, cursor: 'pointer' }}
              onClick={() => addArrayItem(dataPath, defaultEmptyItem)}
            />
          )}

          <AtomicRenderer node={itemTemplate} dataScope={{ parentPath: dataPath, index: index, ...itemData }} />
        </div>
      ))}

      <style>{`
        /* Ẩn công cụ mặc định */
        .cv-action-toolbar, .cv-inline-add-button {
          display: none !important;
        }

        /* Hiện công cụ khi hover */
        .cv-loop-item-block:hover .cv-action-toolbar,
        .cv-loop-item-block:hover .cv-inline-add-button {
          display: flex !important;
        }

        /* 🚀 Tắt hoàn toàn viền và nền của Khối Cha khi Hover để tránh rối mắt */
        .cv-loop-item-block:hover {
          outline: none !important;
          background-color: transparent !important;
        }

        /* 🚀 Tắt viền đứt của Khối Cha khi nó đang rỗng (Ghost) */
        .cv-loop-item-block.is-ghost {
          outline: none !important;
        }

        /* 🛠️ THANH DOCK ĐIỀU KHIỂN TRÁI TINH GỌN MỚI */
        .cv-action-toolbar {
          position: absolute;
          top: -20px;
          left: 8px;
          align-items: center;
          background: rgba(36, 36, 36, 0.85) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 6px !important;
          padding: 3px !important;
          z-index: 100;
          gap: 2px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        
        .cv-action-toolbar::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          height: 14px;
          background: transparent;
          pointer-events: auto;
        }

        .toolbar-btn {
          background: transparent;
          border: none;
          color: #a0a0a0;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .toolbar-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .toolbar-btn.delete-btn {
          background: transparent !important;
          color: #ff4d4f !important;
          width: auto !important;
          padding: 0 10px !important;
          font-weight: 500;
          font-size: 12px;
        }
        .toolbar-btn.delete-btn:hover {
          background: #ff4d4f !important;
          color: #ffffff !important;
        }

        /* 🚀 NÚT + THÊM BÊN PHẢI MỚI */
        .cv-inline-add-button {
          position: absolute;
          top: -14px;
          right: 14px;
          background: #00b14f !important;
          color: #ffffff !important;
          border: none !important;
          padding: 4px 14px !important;
          border-radius: 14px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 101;
          box-shadow: 0 2px 8px rgba(0, 177, 79, 0.25);
          transition: all 0.2s ease;
        }
        .cv-inline-add-button:hover {
          background: #009845 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 177, 79, 0.4);
        }

        @media print {
          .cv-action-toolbar, .cv-inline-add-button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoopNode;