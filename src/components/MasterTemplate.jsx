import React from 'react';
import useCvStore from '../store/useCvStore';
import AtomicRenderer from './CvEngine/AtomicRenderer';

const MasterTemplate = () => {
  // Lấy bản vẽ hiện tại từ Zustand Store
  const layoutSchema = useCvStore((state) => state.layoutSchema);
  // Lấy dữ liệu ứng viên làm ngữ cảnh gốc (Global Context Scope)
  const cvData = useCvStore((state) => state.cvData);

  if (!layoutSchema) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải mẫu thiết kế...</div>;
  }

  return (
    <div className="master-template-container" style={{ width: '100%', height: '100%' }}>
      <AtomicRenderer node={layoutSchema} dataScope={cvData} isRoot={true} />
    </div>
  );
};

export default MasterTemplate;