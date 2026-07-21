import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import TextNode from '../CvEngine/Elements/TextNode';
import RichTextNode from '../CvEngine/Elements/RichTextNode';
import ContainerNode from '../CvEngine/Elements/ContainerNode';
import LoopNode from '../CvEngine/Elements/LoopNode';
import ImageNode from '../CvEngine/Elements/ImageNode';
import { resolveContent } from './utils/stringInterpolator';
import useCvStore from '../../store/useCvStore';
import { Popover, Checkbox } from 'antd'; 
import {
  PhoneOutlined, CalendarOutlined, MailOutlined, EnvironmentOutlined, GlobalOutlined, UserOutlined, 
  ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, DragOutlined, EyeOutlined, InfoCircleOutlined 
} from '@ant-design/icons';

const hiddenSectionsListeners = new Set();
window.__hiddenCvSections = window.__hiddenCvSections || [];
window.__customCvSections = window.__customCvSections || []; 
window.__contactChildrenOrder = window.__contactChildrenOrder || []; 

const ThemeContext = createContext({ columnIndex: -1, isInsideColoredBg: false, isInsideLoopItem: false });

window.__cleanupCvDrag = () => {
  const placeholder = document.getElementById('cv-drag-placeholder');
  if (placeholder) placeholder.remove();
  const ghost = document.getElementById('cv-custom-drag-ghost');
  if (ghost) ghost.remove();
  if (window.__cvDragState && window.__cvDragState.el) {
    window.__cvDragState.el.style.display = ''; 
  }
  window.__cvDragState = null;
};

const toggleSectionVisibility = (id, isVisible) => {
  if (isVisible) {
    window.__hiddenCvSections = window.__hiddenCvSections.filter(x => x !== id);
  } else {
    if (!window.__hiddenCvSections.includes(id)) window.__hiddenCvSections.push(id);
  }
  hiddenSectionsListeners.forEach(listener => listener());
};

const moveContactSection = (id, direction) => {
  const arr = window.__contactChildrenOrder;
  const idx = arr.indexOf(id);
  if (idx === -1) return;

  const visibleIds = arr.filter(x => {
    if (window.__hiddenCvSections.includes(x)) return false;
    if (x.startsWith('section-contact-custom-') && !window.__customCvSections.some(z => z.id === x)) return false;
    return true;
  });

  const vIdx = visibleIds.indexOf(id);
  if (direction === 'up' && vIdx > 0) {
    const prevId = visibleIds[vIdx - 1];
    const realIdx1 = arr.indexOf(id);
    const realIdx2 = arr.indexOf(prevId);
    arr[realIdx1] = prevId;
    arr[realIdx2] = id;
  } else if (direction === 'down' && vIdx !== -1 && vIdx < visibleIds.length - 1) {
    const nextId = visibleIds[vIdx + 1];
    const realIdx1 = arr.indexOf(id);
    const realIdx2 = arr.indexOf(nextId);
    arr[realIdx1] = nextId;
    arr[realIdx2] = id;
  }
  hiddenSectionsListeners.forEach(listener => listener());
};

const getSectionLabel = (id) => {
  if (!id) return 'Mục con';
  const lower = id.toLowerCase();
  if (lower.includes('phone') || lower.includes('dienthoai')) return 'Số điện thoại';
  if (lower.includes('email')) return 'Email';
  if (lower.includes('address') || lower.includes('diachi')) return 'Địa chỉ';
  if (lower.includes('dob') || lower.includes('birth') || lower.includes('ngaysinh')) return 'Ngày sinh';
  if (lower.includes('website') || lower.includes('web')) return 'Website';
  if (lower.includes('gender') || lower.includes('gioitinh')) return 'Giới tính';
  return 'Mục tự nhập';
};

const getMacroSectionTitle = (id) => {
  if (!id) return 'Mục nội dung';
  const map = {
    'section-summary': 'Mục tiêu nghề nghiệp',
    'section-experience': 'Kinh nghiệm làm việc',
    'section-education': 'Học vấn',
    'section-skills': 'Kỹ năng',
    'section-hobbies': 'Sở thích',
    'section-awards': 'Danh hiệu và giải thưởng',
    'section-certificates': 'Chứng chỉ',
    'section-activities': 'Hoạt động',
    'section-projects': 'Dự án',
    'section-contact-info': 'Thông tin liên hệ',
    'section-avatar-profile': 'Ảnh đại diện'
  };
  if (map[id]) return map[id];
  if (id.startsWith('section-contact-')) return getSectionLabel(id);
  return 'Mục con';
};

const isSectionRequired = (id) => {
  if (!id) return false;
  return id === 'section-contact-phone' || id === 'section-contact-email';
};

const findSiblings = (root, targetId) => {
  if (!root || !root.children) return null;
  if (root.children.some(c => c && c.id === targetId)) return root.children;
  for (const child of root.children) {
    const res = findSiblings(child, targetId);
    if (res) return res;
  }
  return null;
};

const findDataPathInsideNode = (n) => {
  if (!n) return null;
  if (n.dataPath) return n.dataPath;
  if (n.children && n.children.length > 0) {
    for (const child of n.children) {
      const foundPath = findDataPathInsideNode(child);
      if (foundPath) return foundPath;
    }
  }
  return null;
};

const extractLoopIndexSafely = (n) => {
    if (!n) return -1;
    if (n.index !== undefined) return parseInt(n.index, 10);
    if (n.dataPath) {
        const m = n.dataPath.match(/\[(\d+)\]/); 
        if (m) return parseInt(m[1], 10);
    }
    if (n.children && Array.isArray(n.children)) {
        for (const child of n.children) {
            const idx = extractLoopIndexSafely(child);
            if (idx !== -1) return idx;
        }
    }
    return -1;
};

const MacroSectionWrapper = ({ node, children, isRoot, dataScope }) => {
  const [popoverOpen, setPopoverOpen] = useState(false); 
  const wrapperRef = useRef(null);
  const themeCtx = useContext(ThemeContext);
  const layoutSchema = useCvStore((state) => state.layoutSchema || state.schema);
  
  // 🚀 BẢN VÁ: Lắng nghe cấu hình Font chữ để ép xuống CSS của khối
  const layoutSettings = useCvStore((state) => state.layoutSettings);

  const isReq = isSectionRequired(node.id);
  const exactDataPath = isReq ? findDataPathInsideNode(node) : null;
  const storeValue = useCvStore(state => {
      if (!isReq || !exactDataPath) return null;
      const data = state.cvData || state.data || {};
      return exactDataPath.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), data);
  });

  let isEmptyRequired = false;
  if (isReq) {
      if (storeValue === undefined || storeValue === null || String(storeValue).trim() === "") {
          isEmptyRequired = true;
      }
  }

  const mainSections = [
    'section-contact-info', 'section-education', 'section-experience',
    'section-awards', 'section-certificates', 'section-activities',
    'section-projects', 'section-hobbies', 'section-skills',
    'section-summary', 'section-avatar-profile'
  ];

  const isLargeBlock = node.id && mainSections.includes(node.id);
  const isContactChild = node.id && node.id.startsWith('section-contact-') && !isLargeBlock;
  const isLoopRow = node._isLoopRowRoot === true; 
  
  const isAnyChildBlock = isContactChild || isLoopRow;
  const isValidNode = isLargeBlock || isAnyChildBlock;

  if (!isValidNode) return children;

  const undeletableSections = ['section-avatar-profile', 'section-contact-info'];
  const canDeleteMacro = !undeletableSections.includes(node.id);

  let canDeleteChild = true;
  if (isContactChild) {
    canDeleteChild = node.id !== 'section-contact-phone' && node.id !== 'section-contact-email';
  }

  const isAvatar = node.id === 'section-avatar-profile';
  const hasMacroToolbar = isLargeBlock && !isAvatar;
  const hasChildToolbar = isAnyChildBlock;    

  let isFirst = false; let isLast = false; 
  let loopBaseString = null; let isSingleItem = false;
  let computedIndex = -1;

  if (isLoopRow) {
    loopBaseString = node._loopBasePath || (node.dataPath ? node.dataPath.replace(/\[\d+\].*/, '').replace(/\.\d+\..*/, '') : null);
    
    computedIndex = (dataScope && dataScope.index !== undefined) 
      ? dataScope.index 
      : extractLoopIndexSafely(node);

    const storeState = useCvStore.getState();
    const currentData = storeState.cvData || storeState.data || {};
    let arr = currentData;
    if (loopBaseString && arr) {
        const parts = loopBaseString.split('.');
        for (const p of parts) {
            if (arr) arr = arr[p];
        }
    }
    const actualArrayLength = Array.isArray(arr) ? arr.length : 0;

    isSingleItem = actualArrayLength <= 1; 
    isFirst = computedIndex === 0;
    isLast = computedIndex === actualArrayLength - 1;
    
  } else if (isContactChild) {
    const visibleIds = window.__contactChildrenOrder.filter(x => x && !window.__hiddenCvSections.includes(x) && !(x.startsWith('section-contact-custom-') && !window.__customCvSections.some(z => z.id === x)));
    const vIdx = visibleIds.indexOf(node.id);
    isFirst = vIdx === 0;
    isLast = vIdx === visibleIds.length - 1;
    isSingleItem = visibleIds.length <= 1;
  } else if (isLargeBlock) {
    const siblings = findSiblings(layoutSchema, node.id);
    const currentIndex = siblings ? siblings.findIndex(c => c && c.id === node.id) : -1;
    isFirst = currentIndex === 0;
    isLast = siblings ? currentIndex === siblings.length - 1 : false;
  }

  const handleMoveChildClick = (direction) => {
    if (isContactChild) {
      moveContactSection(node.id, direction);
    } else if (isLoopRow && loopBaseString) {
      if (computedIndex === -1) return;

      const store = useCvStore.getState();
      
      if (typeof store.moveArrayItem === 'function') {
        store.moveArrayItem(loopBaseString, computedIndex, direction);
      } else if (typeof store.moveLoopItem === 'function') {
        const toIndex = direction === 'up' ? computedIndex - 1 : computedIndex + 1;
        store.moveLoopItem(loopBaseString, computedIndex, toIndex);
      } else {
        const currentData = store.cvData || store.data;
        if (!currentData) return;
        const newData = JSON.parse(JSON.stringify(currentData)); 
        
        let arr = newData;
        const parts = loopBaseString.split('.');
        for (let i = 0; i < parts.length; i++) {
          if (!arr[parts[i]]) arr[parts[i]] = [];
          arr = arr[parts[i]];
        }
        
        if (Array.isArray(arr)) {
          if (direction === 'up' && computedIndex > 0) {
            const temp = arr[computedIndex];
            arr[computedIndex] = arr[computedIndex - 1];
            arr[computedIndex - 1] = temp;
          } else if (direction === 'down' && computedIndex < arr.length - 1) {
            const temp = arr[computedIndex];
            arr[computedIndex] = arr[computedIndex + 1];
            arr[computedIndex + 1] = temp;
          }
          if (store.setCvData) store.setCvData(newData);
          else useCvStore.setState({ cvData: newData, data: newData }); 
        }
      }
      hiddenSectionsListeners.forEach(listener => listener());
    }
  };

  const handleAddClick = () => {
    if (isLoopRow && loopBaseString) {
        const store = useCvStore.getState();
        if (typeof store.addLoopItem === 'function') {
            store.addLoopItem(loopBaseString);
        } else {
            const currentData = store.cvData || store.data;
            if (!currentData) return;
            const newData = JSON.parse(JSON.stringify(currentData));
            let arr = newData;
            const parts = loopBaseString.split('.');
            for (let i = 0; i < parts.length; i++) {
                if (!arr[parts[i]]) arr[parts[i]] = [];
                arr = arr[parts[i]];
            }
            if (Array.isArray(arr)) {
                arr.push({}); 
                if (store.setCvData) store.setCvData(newData);
                else useCvStore.setState({ cvData: newData, data: newData });
            }
        }
    } else if (isContactChild) {
      const newId = 'section-contact-custom-' + Date.now();
      window.__customCvSections.push({ id: newId });
      const idx = window.__contactChildrenOrder.indexOf(node.id);
      if (idx !== -1) window.__contactChildrenOrder.splice(idx + 1, 0, newId);
      else window.__contactChildrenOrder.push(newId);
    }
    hiddenSectionsListeners.forEach(listener => listener());
  };

  const handleDeleteClick = () => {
    if (isLoopRow && loopBaseString) {
        const store = useCvStore.getState();
        if (computedIndex > -1) {
            if (typeof store.removeLoopItem === 'function') {
                store.removeLoopItem(`${loopBaseString}[${computedIndex}]`);
            } else {
                const currentData = store.cvData || store.data;
                if (!currentData) return;
                const newData = JSON.parse(JSON.stringify(currentData));
                let arr = newData;
                const parts = loopBaseString.split('.');
                for (let i = 0; i < parts.length; i++) {
                    if (!arr[parts[i]]) arr[parts[i]] = [];
                    arr = arr[parts[i]];
                }
                if (Array.isArray(arr)) {
                    arr.splice(computedIndex, 1);
                    if (store.setCvData) store.setCvData(newData);
                    else useCvStore.setState({ cvData: newData, data: newData });
                }
            }
        }
    } else if (node.id && node.id.startsWith('section-contact-custom-')) {
        window.__customCvSections = window.__customCvSections.filter(x => x.id !== node.id);
    } else if (isContactChild) {
        toggleSectionVisibility(node.id, false);
    }
    hiddenSectionsListeners.forEach(listener => listener());
  };

  const handleDragStart = (e) => {
    if (isAvatar) return; 
    e.stopPropagation();
    window.__cleanupCvDrag(); 

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData("text/plain", node.id);

    window.__cvDragState = { id: node.id, el: wrapperRef.current, isLargeBlock, isContactChild };

    const title = getMacroSectionTitle(node.id);
    let ghost = document.createElement('div');
    ghost.id = 'cv-custom-drag-ghost';
    ghost.style.position = 'absolute'; ghost.style.top = '-1000px'; ghost.style.left = '-1000px';
    ghost.style.backgroundColor = '#00b14f'; ghost.style.color = '#ffffff';
    ghost.style.padding = '8px 16px'; ghost.style.borderRadius = '4px';
    ghost.style.fontFamily = 'Arial, sans-serif'; ghost.style.fontSize = '14px';
    ghost.style.fontWeight = 'bold'; ghost.style.display = 'flex';
    ghost.style.alignItems = 'center'; ghost.style.gap = '8px';
    ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; ghost.style.zIndex = '99999';
    ghost.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg><span>${title}</span>`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);

    setTimeout(() => {
      if (wrapperRef.current) {
        const placeholder = wrapperRef.current.cloneNode(true);
        placeholder.id = 'cv-drag-placeholder';
        placeholder.classList.add('cv-drag-placeholder-style');
        placeholder.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        wrapperRef.current.parentNode.insertBefore(placeholder, wrapperRef.current.nextSibling);
        wrapperRef.current.style.display = 'none';
      }
    }, 0);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
    
    const currentEl = wrapperRef.current;
    if (currentEl) {
      let scrollContainer = currentEl.parentElement;
      while (scrollContainer && scrollContainer !== document.body) {
        const style = window.getComputedStyle(scrollContainer);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') {
          break;
        }
        scrollContainer = scrollContainer.parentElement;
      }

      if (scrollContainer && scrollContainer !== document.body) {
        const rect = scrollContainer.getBoundingClientRect();
        const edgeSize = 60; 
        const scrollSpeed = 15; 
        const mouseY = e.clientY;

        if (mouseY - rect.top < edgeSize && mouseY >= rect.top) {
          scrollContainer.scrollTop -= scrollSpeed;
        } else if (rect.bottom - mouseY < edgeSize && mouseY <= rect.bottom) {
          scrollContainer.scrollTop += scrollSpeed;
        }
      } else {
        if (e.clientY < 60) window.scrollBy(0, -15);
        if (window.innerHeight - e.clientY < 60) window.scrollBy(0, 15);
      }
    }

    const dragState = window.__cvDragState;
    if (!dragState || !dragState.el) return;
    
    if (currentEl === dragState.el) return;
    if (dragState.isLargeBlock !== isLargeBlock || dragState.isContactChild !== isContactChild) return;
    if (dragState.isContactChild && currentEl.parentNode !== dragState.el.parentNode) return;

    const placeholder = document.getElementById('cv-drag-placeholder');
    if (!placeholder) return;

    const rectInfo = currentEl.getBoundingClientRect();
    const midY = rectInfo.top + rectInfo.height / 2;

    if (e.clientY < midY) {
      if (currentEl.previousElementSibling !== placeholder) currentEl.parentNode.insertBefore(placeholder, currentEl);
    } else {
      if (currentEl.nextElementSibling !== placeholder) currentEl.parentNode.insertBefore(placeholder, currentEl.nextSibling);
    }
  };

  const handleDrop = (e) => e.preventDefault();

  const handleDragEnd = () => {
    const dragState = window.__cvDragState;
    const placeholder = document.getElementById('cv-drag-placeholder');
    
    if (!dragState || !dragState.el || !placeholder) {
      window.__cleanupCvDrag(); return;
    }

    const draggedId = dragState.id;
    const newParentNode = placeholder.parentNode;
    const newOrderIds = [];
    
    Array.from(newParentNode.children).forEach(child => {
      if (child.id === 'cv-drag-placeholder') newOrderIds.push(draggedId);
      else if (child.hasAttribute('data-cv-id') && child.style.display !== 'none') newOrderIds.push(child.getAttribute('data-cv-id'));
    });
    window.__cleanupCvDrag();

    if (dragState.isContactChild) {
      window.__contactChildrenOrder = window.__contactChildrenOrder.sort((a, b) => {
        const idxA = newOrderIds.indexOf(a);
        const idxB = newOrderIds.indexOf(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
      hiddenSectionsListeners.forEach(l => l());
    } 
    else if (dragState.isLargeBlock) {
      const store = useCvStore.getState();
      const currentSchema = store.layoutSchema || store.schema;
      if (!currentSchema) return;

      const newSchema = JSON.parse(JSON.stringify(currentSchema));
      let draggedItemObj = null; let sourceArray = null;

      const extractItem = (parent) => {
        if (!parent || !parent.children) return false;
        const idx = parent.children.findIndex(c => c && c.id === draggedId);
        if (idx > -1) {
          draggedItemObj = parent.children[idx];
          sourceArray = parent.children;
          parent.children.splice(idx, 1);
          return true;
        }
        for (const c of parent.children) { if (extractItem(c)) return true; }
        return false;
      };

      extractItem(newSchema);

      if (draggedItemObj) {
        let targetArray = null;
        const siblingId = newOrderIds.find(id => id !== draggedId);
        
        if (siblingId) {
          const findTargetArray = (parent) => {
            if (!parent || !parent.children) return false;
            if (parent.children.some(c => c && c.id === siblingId)) { targetArray = parent.children; return true; }
            for (const c of parent.children) { if (findTargetArray(c)) return true; }
            return false;
          };
          findTargetArray(newSchema);
        } else {
          const dropZone = newParentNode.querySelector('.cv-column-dropzone');
          if (dropZone) {
            const parentContainerId = dropZone.getAttribute('data-container-parent-id');
            const findContainerArray = (parent) => {
              if (!parent) return false;
              if (parent.id === parentContainerId) {
                if (!parent.children) parent.children = [];
                targetArray = parent.children; return true;
              }
              if (parent.children) {
                for (const c of parent.children) { if (findContainerArray(c)) return true; }
              }
              return false;
            };
            findContainerArray(newSchema);
          }
          if (!targetArray) targetArray = sourceArray; 
        }

        if (targetArray) {
          targetArray.push(draggedItemObj);
          targetArray.sort((a, b) => {
            const idxA = newOrderIds.indexOf(a.id);
            const idxB = newOrderIds.indexOf(b.id);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
          if (typeof store.setLayoutSchema === 'function') store.setLayoutSchema(newSchema);
          else useCvStore.setState({ layoutSchema: newSchema, schema: newSchema });
          hiddenSectionsListeners.forEach(l => l());
        }
      }
    }
  };

  const popoverContent = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', padding: '4px 2px', background: '#1f1f1f' }}>
      {window.__contactChildrenOrder.filter(id => id && !id.startsWith('section-contact-custom-')).map((id, idx) => {
        const label = getSectionLabel(id);
        const required = isSectionRequired(id);
        const isChecked = !window.__hiddenCvSections.includes(id);

        return (
          <Checkbox key={id || idx} checked={isChecked} disabled={required} onChange={(e) => toggleSectionVisibility(id, e.target.checked)} className="custom-cv-checkbox">
            <span style={{ color: required ? '#555555' : '#ffffff', fontSize: '13px', fontWeight: '500' }}>{label}</span>
          </Checkbox>
        );
      })}
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      data-cv-id={node.id}
      data-column-index={themeCtx.columnIndex}
      className={`cv-macro-section-block ${isEmptyRequired ? 'has-empty-required' : ''}`}
      style={{ 
        position: 'relative', 
        padding: '6px', 
        margin: '-6px',
        width: isAnyChildBlock ? '100%' : 'auto',
        display: isAnyChildBlock ? 'block' : 'initial'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {hasMacroToolbar && (
        <div 
          className={`cv-macro-toolbar no-print ${popoverOpen ? 'force-show' : ''}`}
          style={{ 
            position: 'absolute', alignItems: 'center', gap: '2px',
            top: '-32px', left: '10px', zIndex: 999
          }}
        >
          <div draggable={true} onDragStart={handleDragStart} onDragEnd={handleDragEnd} className="cv-btn-item" style={{ cursor: 'move' }}>
            <DragOutlined />
          </div>
          {node.id === 'section-contact-info' && (
            <Popover content={popoverContent} title={null} trigger="click" placement="topLeft" overlayClassName="custom-cv-popover-wrapper" onOpenChange={(open) => setPopoverOpen(open)}>
              <button className="cv-btn-item"><EyeOutlined /></button>
            </Popover>
          )}
          {!isFirst && <button className="cv-btn-item" onClick={() => useCvStore.getState().moveMacroSection(node.id, 'up')}><ArrowUpOutlined /></button>}
          {!isLast && <button className="cv-btn-item" onClick={() => useCvStore.getState().moveMacroSection(node.id, 'down')}><ArrowDownOutlined /></button>}
          {canDeleteMacro && <button className="cv-btn-delete" onClick={() => useCvStore.getState().removeMacroSection(node.id)}>Xóa</button>}
        </div>
      )}

      {hasChildToolbar && (
        <div 
          className="cv-macro-toolbar no-print"
          style={{ 
            position: 'absolute', alignItems: 'center', gap: '2px',
            top: '-32px', right: '10px', zIndex: 999
          }}
        >
          {isSingleItem ? (
            <button className="cv-btn-add" onClick={handleAddClick}>+ Thêm</button>
          ) : (
            <>
              {!isFirst && <button className="cv-btn-item" onClick={() => handleMoveChildClick('up')}><ArrowUpOutlined /></button>}
              {!isLast && <button className="cv-btn-item" onClick={() => handleMoveChildClick('down')}><ArrowDownOutlined /></button>}
              {canDeleteChild && <button className="cv-btn-delete" onClick={handleDeleteClick}>Xóa</button>}
              <button className="cv-btn-add" onClick={handleAddClick}>+ Thêm</button>
            </>
          )}
        </div>
      )}
      
      {children}
      
      <style>{`
        /* 🚀 BẢN VÁ: ÉP TOÀN BỘ FONT CHỮ BÊN TRONG KHỐI ĐỒNG BỘ (TRỪ ICON SVG) */
        div[data-cv-id="${node.id}"],
        div[data-cv-id="${node.id}"] *:not(.anticon) {
            font-family: ${layoutSettings?.fontFamily ? `${layoutSettings.fontFamily} !important` : 'inherit'};
        }

        .cv-macro-section-block > .cv-macro-toolbar { display: none !important; }
        .cv-macro-section-block:hover > .cv-macro-toolbar { display: flex !important; }
        .cv-macro-toolbar.force-show { display: flex !important; }

        .cv-macro-toolbar { 
          background: rgba(36, 36, 36, 0.85) !important; 
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 8px !important; 
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25) !important; 
          padding: 4px !important;
          color-scheme: dark !important; 
        }
        
        .cv-btn-item { 
          background: transparent !important; 
          border: none !important; 
          color: #a0a0a0 !important; 
          width: 28px; height: 28px; 
          display: flex; align-items: center; justify-content: center; 
          border-radius: 6px; cursor: pointer; 
          transition: all 0.2s ease; 
        }
        .cv-btn-item:hover { 
          background: rgba(255, 255, 255, 0.12) !important; 
          color: #ffffff !important; 
        }
        .cv-btn-item .anticon { font-size: 14px !important; }

        .cv-btn-delete { 
          background: transparent !important; 
          border: none !important; 
          color: #ff4d4f !important; 
          padding: 0 12px; height: 28px; 
          display: flex; align-items: center; justify-content: center; 
          border-radius: 6px; cursor: pointer; 
          font-size: 12px !important; font-weight: 600; 
          transition: all 0.2s ease; 
        }
        .cv-btn-delete:hover { 
          background: #ff4d4f !important; 
          color: #ffffff !important; 
        }

        .cv-btn-add { 
          background: #00b14f !important; 
          border: 1px solid #00b14f !important; 
          color: #ffffff !important; 
          padding: 0 14px; height: 28px; 
          display: flex; align-items: center; justify-content: center; 
          border-radius: 14px !important; 
          cursor: pointer; 
          font-size: 12px !important; font-weight: 600; 
          box-shadow: 0 2px 8px rgba(0, 177, 79, 0.25);
          transition: all 0.2s ease; 
        }
        .cv-btn-add:hover { 
          background: #009845 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 177, 79, 0.4);
        }

        .cv-drag-placeholder-style {
          background-color: rgba(0, 177, 79, 0.1) !important;
          border: 1px dashed #00b14f !important; border-radius: 4px !important;
          opacity: 1 !important; box-shadow: none !important; pointer-events: none !important; 
        }
        .cv-drag-placeholder-style * { opacity: 0.3 !important; pointer-events: none !important; }
        .cv-drag-placeholder-style .cv-macro-toolbar { display: none !important; }
        
        :root body #section-avatar-profile img, :root body [id="section-avatar-profile"] img {
          border: 10px solid rgba(35, 23, 23, 0.99) !important; outline: none !important;
        }
        :root body .cv-macro-section-block [contenteditable="true"], :root body .cv-macro-section-block input, :root body .cv-macro-section-block textarea {
          box-shadow: none !important; outline: none !important;
        }
        
        :root body .cv-macro-section-block:not(.has-empty-required) *[style*="red"],
        :root body .cv-macro-section-block:not(.has-empty-required) *[style*="rgb(255, 77, 79)"] {
            border-color: transparent !important; outline-color: transparent !important; background-color: transparent !important;
        }

        :root body .cv-macro-section-block [contenteditable="true"]:not(:hover):not(:focus),
        :root body .cv-macro-section-block input:not(:hover):not(:focus), 
        :root body .cv-macro-section-block textarea:not(:hover):not(:focus), 
        :root body .cv-macro-section-block .ProseMirror:not(:hover):not(:focus) {
            border-color: transparent !important; 
            outline-color: transparent !important; 
            outline: none !important;
            background-color: transparent !important;
            background-image: none !important;
        }

        :root body .cv-macro-section-block [contenteditable="true"]:hover, 
        :root body .cv-macro-section-block [contenteditable="true"]:focus,
        :root body .cv-macro-section-block input:hover, 
        :root body .cv-macro-section-block input:focus,
        :root body .cv-macro-section-block textarea:hover, 
        :root body .cv-macro-section-block textarea:focus,
        :root body .cv-macro-section-block .ProseMirror:hover, 
        :root body .cv-macro-section-block .ProseMirror:focus {
            outline: 1px dashed currentColor !important; 
            outline-offset: 2px !important; 
            border-radius: 4px !important;
            background-color: transparent !important; 
            background-image: none !important; 
            border-color: transparent !important;
            cursor: text !important;
        }

        :root body .cv-macro-section-block.has-empty-required [contenteditable="true"]:not(.ProseMirror), 
        :root body .cv-macro-section-block.has-empty-required input, 
        :root body .cv-macro-section-block.has-empty-required .ProseMirror {
          border-color: rgba(255, 77, 79, 0.99) !important; outline-color: rgba(255, 77, 79, 0.99) !important;
          outline: 1px dashed rgba(255, 77, 79, 0.99) !important; outline-offset: 3px !important; border-radius: 3px !important; 
          background-color: transparent !important;
          background-image: linear-gradient(rgba(255, 77, 79, 0.05), rgba(255, 77, 79, 0.05)) !important;
        }

        :root body .cv-macro-section-block .rich-text-force-dynamic, 
        :root body .cv-macro-section-block .rich-text-force-dynamic:hover, 
        :root body .cv-macro-section-block .rich-text-force-dynamic:focus {
          border: none !important; outline: none !important; background-color: transparent !important; background-image: none !important;
        }

        div.cv-macro-section-block:hover, div.cv-macro-section-block { outline: none !important; }
        
        .cv-macro-section-block [class*="toolbar"]:not(.cv-macro-toolbar), 
        .cv-macro-section-block [class*="action"]:not(.cv-macro-toolbar), 
        .cv-macro-section-block button:not(.cv-btn-item):not(.cv-btn-delete):not(.cv-btn-add):not(.ant-checkbox-wrapper):not(.ant-switch) {
            display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;
        }
        
        .custom-cv-popover-wrapper .ant-popover-inner { background-color: #1f1f1f !important; border: 1px solid #333333 !important; border-radius: 6px !important; padding: 12px !important; }
        .rich-text-force-dynamic * { font-size: inherit !important; }
        .cv-column-dropzone { opacity: 0; pointer-events: auto !important; background: transparent; }
      `}</style>
    </div>
  );
};

const AtomicRenderer = ({ node, dataScope, isRoot = false, isDirectColumn = false }) => {
  const [_, forceUpdate] = useState(0);
  const themeCtx = useContext(ThemeContext);
  
  // 🚀 BẢN VÁ: Lắng nghe cấu hình Font chữ để ép xuống Style nội tuyến (Inline Style)
  const layoutSettings = useCvStore((state) => state.layoutSettings);

  useEffect(() => {
    const handler = () => forceUpdate(c => c + 1);
    hiddenSectionsListeners.add(handler);
    return () => hiddenSectionsListeners.delete(handler);
  }, []);

  if (!node) return null;

  const isColumnNode = isRoot || isDirectColumn;
  const checkSolidBg = (styles) => {
    if (!styles || !styles.backgroundColor) return false;
    const bg = styles.backgroundColor.replace(/\s/g, '').toLowerCase();
    return bg !== 'transparent' && bg !== 'initial' && bg !== 'inherit' && !bg.startsWith('rgba(0,0,0,0)');
  };
  const hasSolidBg = !isColumnNode && checkSolidBg(node.styles);
  const nextIsInsideColoredBg = themeCtx.isInsideColoredBg || hasSolidBg;

  const processDynamicStyles = (styles, colIdx, insideColor) => {
    if (!styles) return styles;
    const processed = { ...styles };

    // 🚀 BẢN VÁ: Ghi đè cấu hình font mặc định của JSON bằng Font chữ bạn chọn
    if (layoutSettings?.fontFamily) {
      processed.fontFamily = layoutSettings.fontFamily;
    }

    if (processed.fontSize && typeof processed.fontSize === 'string' && processed.fontSize.includes('px')) {
      const px = parseFloat(processed.fontSize);
      if (!isNaN(px)) processed.fontSize = `calc(var(--base-font-size, 13px) * (${px} / 13))`;
    }

    if (!insideColor) {
      const swapColor = (colorStr) => {
        if (!colorStr) return colorStr;
        const c = colorStr.replace(/\s/g, '').toLowerCase();
        const whites = ['#ffffff', '#fff', 'white', 'rgb(255,255,255)', 'rgba(255,255,255,1)'];
        const lightGrays = ['#cccccc', '#ccc', '#e0e0e0', '#dddddd', '#ddd', '#bbbbbb', '#bbb', '#eeeeee', '#eee', '#f5f5f5', '#d9d9d9', 'rgb(204,204,204)', 'rgb(224,224,224)', 'rgb(221,221,221)'];
        const blacks = ['#000000', '#000', 'black', '#333333', '#333', '#222222', '#222', '#111111', '#111', '#242424', 'rgb(0,0,0)', 'rgb(51,51,51)', 'rgba(0,0,0,1)'];
        const darkGrays = ['#666666', '#666', '#777777', '#777', '#555555', '#555', '#888888', '#888', '#999999', '#999', 'rgb(102,102,102)', 'rgb(119,119,119)', 'rgb(85,85,85)'];
        
        if (colIdx > 0) {
          if (whites.includes(c) || c.startsWith('rgba(255,255,255,1')) return '#333333';
          if (lightGrays.includes(c) || c.startsWith('rgba(255,255,255,0.')) return '#777777';
        } else if (colIdx === 0) {
          if (blacks.includes(c) || c.startsWith('rgba(0,0,0,1')) return '#ffffff';
          if (darkGrays.includes(c) || c.startsWith('rgba(0,0,0,0.')) return '#cccccc';
        }
        return colorStr;
      };

      if (processed.color) processed.color = swapColor(processed.color);
      if (processed.borderColor) processed.borderColor = swapColor(processed.borderColor);
      if (processed.backgroundColor) processed.backgroundColor = swapColor(processed.backgroundColor); 
    }
    return processed;
  };

  const dynamicStyles = processDynamicStyles(node.styles, themeCtx.columnIndex, nextIsInsideColoredBg);

  const renderCoreNode = () => {
    switch (node.type) {
      case 'Container':
        if (node.id === 'section-contact-info') {
          const STANDARD_CONTACTS = [
            'section-contact-dob', 
            'section-contact-gender',
            'section-contact-phone', 
            'section-contact-email', 
            'section-contact-website', 
            'section-contact-address'
          ];

          if (!window.__contactChildrenOrder || window.__contactChildrenOrder.length === 0) {
            window.__contactChildrenOrder = node.children ? node.children.map(c => c && c.id).filter(Boolean) : [];
          }

          STANDARD_CONTACTS.forEach(stdId => {
            if (!window.__contactChildrenOrder.includes(stdId)) {
              window.__contactChildrenOrder.push(stdId);
              if (!window.__hiddenCvSections.includes(stdId)) {
                window.__hiddenCvSections.push(stdId);
              }
            }
          });

          if (node.children) {
            node.children.forEach(c => {
              if (c && c.id && !window.__contactChildrenOrder.includes(c.id)) {
                window.__contactChildrenOrder.push(c.id);
              }
            });
          }

          const visibleIds = window.__contactChildrenOrder.filter(id => {
            if (!id || window.__hiddenCvSections.includes(id)) return false;
            if (id.startsWith('section-contact-custom-') && !window.__customCvSections.some(z => z.id === id)) return false;
            return true;
          });

          const mixedChildren = visibleIds.map(id => {
            const standard = node.children ? node.children.find(c => c && c.id === id) : null;
            if (standard) return standard;

            if (STANDARD_CONTACTS.includes(id)) {
                const templateChild = node.children ? node.children.find(c => c && STANDARD_CONTACTS.includes(c.id)) : null;
                
                if (templateChild) {
                    const clonedChild = JSON.parse(JSON.stringify(templateChild));
                    clonedChild.id = id;
                    
                    const metaMap = {
                        'section-contact-dob': { icon: 'calendar', key: 'dob', placeholder: 'Ngày sinh', label: 'Ngày sinh:' },
                        'section-contact-gender': { icon: 'user', key: 'gender', placeholder: 'Giới tính', label: 'Giới tính:' },
                        'section-contact-phone': { icon: 'phone', key: 'phone', placeholder: 'Số điện thoại', label: 'Số điện thoại:' },
                        'section-contact-email': { icon: 'mail', key: 'email', placeholder: 'Email', label: 'Email:' },
                        'section-contact-website': { icon: 'website', key: 'website', placeholder: 'Website', label: 'Website:' },
                        'section-contact-address': { icon: 'address', key: 'address', placeholder: 'Địa chỉ', label: 'Địa chỉ:' }
                    };
                    
                    const replaceData = (n) => {
                        if (!n) return;
                        if (n.type === 'Icon') n.name = metaMap[id].icon;
                        if (n.type === 'Text' && n.dataPath) {
                            const parts = n.dataPath.split('.');
                            parts.pop(); 
                            const prefix = parts.length > 0 ? parts.join('.') + '.' : '';
                            n.dataPath = prefix + metaMap[id].key;
                            n.placeholder = metaMap[id].placeholder;
                        }
                        if (n.type === 'Text' && n.content && (n.content.includes(':') || /Website|Email|Phone|Ngày/i.test(n.content))) {
                             n.content = metaMap[id].label;
                        }
                        if (n.children) n.children.forEach(replaceData);
                    };
                    
                    replaceData(clonedChild);
                    return clonedChild;
                }
            }
            return { id: id, type: 'CustomInputRow' };
          });

          return (
            <ContainerNode node={{ ...node, styles: dynamicStyles }} isRoot={isRoot}>
              {mixedChildren.map((child, index) => (
                <ThemeContext.Provider key={child.id || `contact-${index}`} value={{ columnIndex: themeCtx.columnIndex, isInsideColoredBg: nextIsInsideColoredBg, isInsideLoopItem: themeCtx.isInsideLoopItem }}>
                  <AtomicRenderer node={child} dataScope={dataScope} isRoot={false} />
                </ThemeContext.Provider>
              ))}
            </ContainerNode>
          );
        }

        const visibleChildren = node.children 
          ? node.children.filter(child => !child || !child.id || !window.__hiddenCvSections.includes(child.id)) 
          : [];

        const responsiveStyles = { ...dynamicStyles };
        if (themeCtx.columnIndex === 0 && themeCtx.isInsideLoopItem) {
            if (responsiveStyles.display === 'flex' && responsiveStyles.justifyContent === 'space-between') {
                responsiveStyles.flexDirection = 'column';
                responsiveStyles.alignItems = 'flex-start';
                delete responsiveStyles.justifyContent;
                responsiveStyles.gap = '2px'; 
            }
        }

        return (
          <ContainerNode node={{ ...node, styles: responsiveStyles }} isRoot={isRoot}>
            {visibleChildren.map((child, index) => {
              const childColIdx = isRoot ? index : themeCtx.columnIndex;
              return (
                <ThemeContext.Provider key={child.id || `macro-${index}`} value={{ columnIndex: childColIdx, isInsideColoredBg: nextIsInsideColoredBg, isInsideLoopItem: themeCtx.isInsideLoopItem }}>
                  <AtomicRenderer node={child} dataScope={dataScope} isRoot={false} isDirectColumn={isRoot} />
                </ThemeContext.Provider>
              );
            })}
            
            {visibleChildren.length === 0 && !isRoot && (
              <div
                className="cv-column-dropzone no-print"
                data-container-parent-id={node.id || 'unknown'}
                style={{ flexGrow: 1, minHeight: '120px', width: '100%' }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const dragState = window.__cvDragState;
                  if (!dragState || !dragState.el || !dragState.isLargeBlock) return;
                  const placeholder = document.getElementById('cv-drag-placeholder');
                  if (!placeholder) return;
                  const currentEl = e.currentTarget;
                  if (currentEl.previousElementSibling !== placeholder) {
                    currentEl.parentNode.insertBefore(placeholder, currentEl);
                  }
                }}
              />
            )}
          </ContainerNode>
        );

      case 'CustomInputRow':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', width: '100%', minHeight: '28px' }}>
            <InfoCircleOutlined style={{ color: 'inherit', opacity: 0.8 }} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <TextNode 
                dataPath={`contact.custom.${node.id}`} 
                placeholder="Nhập nội dung" 
                styles={{ width: '100%', fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit', color: 'inherit', background: 'transparent', border: 'none', padding: 0, margin: 0 }} 
                dataScope={dataScope} 
              />
            </div>
          </div>
        );

      case 'Text':
        if (node.dataPath) {
          return <TextNode dataPath={node.dataPath} placeholder={node.placeholder} styles={dynamicStyles} dataScope={dataScope} />;
        }
        return <div style={dynamicStyles}>{resolveContent(node.content, dataScope)}</div>;

      case 'RichText':
        if (node.dataPath) {
          return (
            <div className="rich-text-force-dynamic" style={{ width: '100%' }}>
              <RichTextNode dataPath={node.dataPath} placeholder={node.placeholder} styles={dynamicStyles} dataScope={dataScope} />
            </div>
          );
        }
        return <div className="rich-text-force-dynamic" style={dynamicStyles} dangerouslySetInnerHTML={{ __html: resolveContent(node.content, dataScope) }} />;

      case 'Image':
        return <ImageNode dataPath={node.dataPath} styles={dynamicStyles} dataScope={dataScope} />;

      case 'Icon':
        const IconMap = { phone: PhoneOutlined, calendar: CalendarOutlined, mail: MailOutlined, address: EnvironmentOutlined, website: GlobalOutlined, user: UserOutlined };
        const TargetIcon = IconMap[node.name];
        if (!TargetIcon) return null;
        return <TargetIcon style={{ color: 'inherit', ...dynamicStyles }} />;

      case 'LoopContainer':
        if (node.itemTemplate) {
            node.itemTemplate._isLoopRowRoot = true;
            node.itemTemplate._loopBasePath = node.dataPath;
        }
        return (
          <div style={dynamicStyles}>
            <ThemeContext.Provider value={{ columnIndex: themeCtx.columnIndex, isInsideColoredBg: nextIsInsideColoredBg, isInsideLoopItem: true }}>
              <LoopNode dataPath={node.dataPath} styles={dynamicStyles} itemTemplate={node.itemTemplate} />
            </ThemeContext.Provider>
          </div>
        );

      case 'Divider':
        return <div style={{ width: '100%', height: '1px', backgroundColor: 'currentColor', opacity: 0.3, ...dynamicStyles }} />;

      default:
        return null;
    }
  };

  return (
    <MacroSectionWrapper node={node} isRoot={isRoot} dataScope={dataScope}>
      {renderCoreNode()}
    </MacroSectionWrapper>
  );
};

export default AtomicRenderer;