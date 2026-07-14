import React, { useState } from 'react';
import TextNode from '../CvEngine/Elements/TextNode';
import RichTextNode from '../CvEngine/Elements/RichTextNode';
import ContainerNode from '../CvEngine/Elements/ContainerNode';
import LoopNode from '../CvEngine/Elements/LoopNode';
import ImageNode from '../CvEngine/Elements/ImageNode';
import { resolveContent } from './utils/stringInterpolator';
import { DragOutlined } from '@ant-design/icons';
import useCvStore from '../../store/useCvStore';
// Import các vector icon chuẩn đường nét cho thanh toolbar điều hướng mục lớn[cite: 2]
import {
  PhoneOutlined,
  CalendarOutlined,
  MailOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined
} from '@ant-design/icons';

// 🛠️ COMPONENT BỌC QUẢN LÝ HOVER/ĐIỀU HƯỚNG MỤC LỚN (TOPCV STYLE)[cite: 2]
const MacroSectionWrapper = ({ node, children }) => {
  const [hovered, setHovered] = useState(false);
  const moveMacroSection = useCvStore((state) => state.moveMacroSection);
  const removeMacroSection = useCvStore((state) => state.removeMacroSection);

  const isMacroSection = node.id && node.id.startsWith('section-');

  if (!isMacroSection) return children;

  // 1. DANH SÁCH KHÓA CỨNG BẢO VỆ: Cấm xóa khối Avatar và các khối thông tin liên hệ đơn lẻ
  const undeletableSections = [
    'section-avatar-profile', 
    'section-contact-info',
    'section-contact-phone', 
    'section-contact-email', 
    'section-contact-address'
  ];

  // 2. Biến kiểm tra xem mục hiện tại có nằm trong danh sách cấm xóa không[cite: 2]
  const canDelete = !undeletableSections.includes(node.id);

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: 'MOVE_EXISTING_SECTION', sectionId: node.id }));
  };

  return (
    <div
      className={`cv-macro-section-block ${hovered ? 'macro-hover' : ''}`}
      style={{ position: 'relative', padding: '6px', margin: '-6px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div
          className="cv-macro-toolbar no-print"
          style={{ position: 'absolute', top: '-22px', left: '10px', display: 'flex', background: '#4d4d4d', padding: '2px 4px', borderRadius: '4px 4px 0 0', zIndex: 999 }}
        >
          <div draggable={true} onDragStart={handleDragStart} style={{ cursor: 'move', color: '#fff', padding: '2px 6px', opacity: 0.8 }}>
            <DragOutlined style={{ fontSize: '12px' }} />
          </div>

          <button onClick={() => moveMacroSection(node.id, 'up')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>
            <ArrowUpOutlined style={{ fontSize: '12px' }} />
          </button>

          <button onClick={() => moveMacroSection(node.id, 'down')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>
            <ArrowDownOutlined style={{ fontSize: '12px' }} />
          </button>

          {/* 3. CHỈ RENDER NÚT XÓA NẾU MỤC ĐÓ ĐƯỢC PHÉP XÓA[cite: 2] */}
          {canDelete && (
            <button onClick={() => removeMacroSection(node.id)} style={{ background: '#ff4d4f', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 8px', borderRadius: '2px', marginLeft: '4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DeleteOutlined style={{ fontSize: '11px' }} /> Xóa
            </button>
          )}
        </div>
      )}
      {children}
      <style>{`
        .cv-macro-section-block.macro-hover { 
          outline: 1px dashed rgba(255, 255, 255, 0.6); 
          background-color: rgba(255, 255, 255, 0.02); 
          border-radius: 4px;
        }
        .cv-macro-toolbar::after { content: ''; position: absolute; top: 100%; left: 0; width: 100%; height: 6px; background: transparent; }
      `}</style>
    </div>
  );
};

const AtomicRenderer = ({ node, dataScope, isRoot = false }) => {
  if (!node) return null;

  // Render lõi thành phần dựa theo cấu trúc cây thư mục JSON[cite: 2]
  const renderCoreNode = () => {
    switch (node.type) {
      case 'Container':
        return (
          <ContainerNode node={node} isRoot={isRoot}>
            {node.children && node.children.map((child, index) => (
              <AtomicRenderer key={index} node={child} dataScope={dataScope} isRoot={false} />
            ))}
          </ContainerNode>
        );

      case 'Text':
        if (node.dataPath) {
          return (
            <TextNode
              dataPath={node.dataPath}
              placeholder={node.placeholder}
              styles={node.styles}
              dataScope={dataScope}
            />
          );
        }
        return (
          <div style={node.styles}>
            {resolveContent(node.content, dataScope)}
          </div>
        );

      case 'RichText':
        if (node.dataPath) {
          return (
            <RichTextNode
              dataPath={node.dataPath}
              placeholder={node.placeholder}
              styles={node.styles}
              dataScope={dataScope}
            />
          );
        }
        return (
          <div
            style={node.styles}
            dangerouslySetInnerHTML={{ __html: resolveContent(node.content, dataScope) }}
          />
        );

      case 'Image':
        return (
          <ImageNode
            dataPath={node.dataPath}
            styles={node.styles}
            dataScope={dataScope}
          />
        );

      case 'Icon':
        const IconMap = {
          phone: PhoneOutlined,
          calendar: CalendarOutlined,
          mail: MailOutlined,
          address: EnvironmentOutlined,
          website: GlobalOutlined
        };

        const TargetIcon = IconMap[node.name];
        if (!TargetIcon) return null;

        return (
          <TargetIcon
            style={{
              fontSize: '14px',
              color: 'inherit',
              ...node.styles
            }}
          />
        );

      case 'Divider':
        return <div style={{ width: '100%', height: '1px', backgroundColor: '#000', ...node.styles }} />;

      case 'LoopContainer':
        return (
          <div style={node.styles}>
            <LoopNode dataPath={node.dataPath} styles={node.styles} itemTemplate={node.itemTemplate} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MacroSectionWrapper node={node}>
      {renderCoreNode()}
    </MacroSectionWrapper>
  );
};

export default AtomicRenderer;