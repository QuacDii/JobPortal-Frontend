import React from 'react';
import useCvStore from '../store/useCvStore';
import { MenuOutlined, CheckOutlined } from '@ant-design/icons';

// Định nghĩa kho lưu trữ cấu trúc JSON chuẩn của các mục nâng cao
const ALL_SECTION_POOL = [
  {
    id: "section-additional",
    name: "Thông tin thêm",
    type: "Container",
    styles: { "marginBottom": "25px" },
    children: [
      {
        "type": "Container",
        "styles": { "display": "flex", "alignItems": "center", "marginBottom": "15px" },
        "children": [
          { "type": "Text", "content": "Thông tin thêm", "styles": { "backgroundColor": "var(--theme-color, #5b423b)", "color": "#ffffff", "padding": "6px 20px", "borderRadius": "20px", "fontWeight": "bold", "fontSize": "14px", "whiteSpace": "nowrap" } },
          { "type": "Container", "styles": { "flexGrow": "1", "height": "1px", "backgroundColor": "var(--theme-color, #5b423b)", "marginLeft": "15px", "opacity": "0.3" } }
        ]
      },
      { "type": "RichText", "dataPath": "additionalInfo", "placeholder": "Điền thông tin thêm nếu có...", "styles": { "fontSize": "13px" } }
    ]
  }
];

const SidebarAddSections = () => {
  const layoutSchema = useCvStore(state => state.layoutSchema);

  // Kiểm tra xem mục đã xuất hiện trên trang A4 chưa bằng cách quét ID
  const isSectionUsed = (id) => {
    const checkExist = (node) => {
      if (node.id === id) return true;
      if (node.children) return node.children.some(checkExist);
      return false;
    };
    return checkExist(layoutSchema);
  };

  const handleDragStart = (e, sectionTemplate) => {
    // Chuyển chuỗi cấu trúc JSON của mục vào luồng kéo thả của trình duyệt
    e.dataTransfer.setData("text/plain", JSON.stringify(sectionTemplate));
  };

  return (
    <div className="sidebar-add-sections-container" style={{ padding: '16px', color: '#fff' }}>
      
      {/* 1. KHỐI MỤC CHƯA SỬ DỤNG */}
      <div className="section-title" style={{ opacity: 0.6, fontSize: '12px', marginBottom: '12px' }}>MỤC CHƯA SỬ DỤNG</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {ALL_SECTION_POOL.filter(s => !isSectionUsed(s.id)).map(section => (
          <div
            key={section.id}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, section)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#262626', padding: '12px', borderRadius: '4px', cursor: 'grab', border: '1px dashed #434343' }}
          >
            <span><MenuOutlined style={{ marginRight: '8px', opacity: 0.5 }} /> {section.name}</span>
            <span style={{ fontSize: '16px', opacity: 0.4 }}>⋮⋮</span>
          </div>
        ))}
      </div>

      {/* 2. KHỐI MỤC ĐÃ SỬ DỤNG */}
      <div className="section-title" style={{ opacity: 0.6, fontSize: '12px', marginBottom: '12px' }}>MỤC ĐÃ SỬ DỤNG</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ALL_SECTION_POOL.filter(s => isSectionUsed(s.id)).map(section => (
          <div key={section.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#141414', padding: '12px', borderRadius: '4px', opacity: 0.5, cursor: 'not-allowed' }}>
            <span>{section.name}</span>
            <CheckOutlined style={{ color: '#52c41a' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarAddSections;