import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import TextNode from '../CvEngine/Elements/TextNode';
import RichTextNode from '../CvEngine/Elements/RichTextNode';
import ContainerNode from '../CvEngine/Elements/ContainerNode';
import LoopNode from '../CvEngine/Elements/LoopNode';
import ImageNode from '../CvEngine/Elements/ImageNode';
import { resolveContent } from './utils/stringInterpolator';
import '../css/AtomicRenderer.css';
import useCvStore from '../../store/useCvStore';
import { Popover, Checkbox } from 'antd';
import {
  PhoneOutlined, CalendarOutlined, MailOutlined, EnvironmentOutlined, GlobalOutlined, UserOutlined,
  ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, DragOutlined, EyeOutlined, InfoCircleOutlined,
  BulbOutlined, TeamOutlined, ProjectOutlined, AppstoreOutlined, TrophyOutlined, FileTextOutlined, CheckCircleOutlined
} from '@ant-design/icons';

const hiddenSectionsListeners = new Set();
window.__hiddenCvSections = window.__hiddenCvSections || [];
window.__customCvSections = window.__customCvSections || [];
window.__contactChildrenOrder = window.__contactChildrenOrder || [];

const hoverListeners = new Set();
let globalHoveredBlockId = null;

const setGlobalHovered = (id) => {
  if (globalHoveredBlockId !== id) {
    globalHoveredBlockId = id;
    const listeners = Array.from(hoverListeners);
    listeners.forEach(fn => fn());
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    if (!globalHoveredBlockId) return;
    if (!e.target || !e.target.closest || !e.target.closest('.cv-macro-section-block')) {
      setGlobalHovered(null);
    }
  });
}

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

export const transformSectionForColumn = (section, targetColId, passedLang = null) => {
  if (!section || !section.id) return section;

  const store = useCvStore.getState();
  const currentSchema = store.layoutSchema || store.schema || {};

  // 1. Kiểm tra chính xác xem có phải cột trái không
  const isLeftCol = (colId) => {
    if (!colId) return false;
    const lower = colId.toLowerCase();
    return lower.includes('left') || lower.includes('col-1') || lower.includes('sidebar') || lower.includes('col-4-left');
  };
  const isLeft = isLeftCol(targetColId);

  const activeLang = (
    passedLang ||
    store.language ||
    store.currentLang ||
    store.layoutSettings?.language ||
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null) ||
    'vi'
  ).toLowerCase();

  const isEn = activeLang === 'en' || activeLang === 'english';
  const t = (vi, en) => (isEn ? en : vi);

  const newSection = JSON.parse(JSON.stringify(section));
  const id = newSection.id;

  // 🌟 2. XỬ LÝ AN TOÀN & LINH HOẠT CHO HEADER / AVATAR / DANH THIẾP
  if (id === 'section-avatar-profile' || id === 'section-business-card' || id === 'section-contact-info') {
    const hasNegativeMargin = newSection.styles?.marginLeft && String(newSection.styles.marginLeft).startsWith('-');

    if (hasNegativeMargin) {
      let targetPadding = 0;
      const findColPadding = (node) => {
        if (node?.id === targetColId && node.styles?.padding) {
          const parts = node.styles.padding.trim().split(/\s+/);
          // Lấy padding ngang (nếu là "0px 25px" thì lấy 25, nếu là "20px" thì lấy 20)
          const horiz = parts.length >= 2 ? parts[1] : parts[0];
          targetPadding = parseFloat(horiz) || 0;
        }
        if (node?.children) node.children.forEach(findColPadding);
      };
      findColPadding(currentSchema);

      if (targetPadding > 0) {
        newSection.styles.marginLeft = `-${targetPadding}px`;
        newSection.styles.marginRight = `-${targetPadding}px`;
      } else {
        delete newSection.styles.marginLeft;
        delete newSection.styles.marginRight;
      }
    }

    return newSection;
  }

  // 3. Trích xuất Text tiêu đề
  const titleDictionary = {
    'section-summary': { vi: 'Mục tiêu nghề nghiệp', en: 'Career Objective' },
    'section-education': { vi: 'Học vấn', en: 'Education' },
    'section-experience': { vi: 'Kinh nghiệm làm việc', en: 'Work Experience' },
    'section-skills': { vi: 'Kỹ năng', en: 'Skills' },
    'section-hobbies': { vi: 'Sở thích', en: 'Hobbies' },
    'section-projects': { vi: 'Dự án', en: 'Projects' },
    'section-activities': { vi: 'Hoạt động', en: 'Activities' },
    'section-awards': { vi: 'Danh hiệu và giải thưởng', en: 'Honors & Awards' },
    'section-certificates': { vi: 'Chứng chỉ', en: 'Certificates' },
    'section-references': { vi: 'Người giới thiệu', en: 'References' },
    'section-additional': { vi: 'Thông tin thêm', en: 'Additional Information' }
  };

  let titleText = titleDictionary[id] ? t(titleDictionary[id].vi, titleDictionary[id].en) : 'Section';

  // 4. Học kiểu dáng Tiêu đề và Card Wrapper từ cột đích
  let sampleHeading = null;
  let sampleCardStyles = null;
  const excludeIds = ['section-avatar-profile', 'section-business-card', 'section-contact-info', id];

  const findSample = (node) => {
    if (!node) return;
    if (node.id === targetColId && node.children && node.children.length > 0) {
      const validSec = node.children.find(c => c && c.id && !excludeIds.includes(c.id) && c.children && c.children.length > 0);
      if (validSec) {
        if (validSec.children[0] && validSec.children[0].type !== 'Image') {
          sampleHeading = JSON.parse(JSON.stringify(validSec.children[0]));
        }
        // Kiểm tra xem các khối ở cột đích có bọc ô vuông/ô xanh không
        const secondChild = validSec.children[1];
        if (secondChild && secondChild.type === 'Container' && (secondChild.styles?.backgroundColor || secondChild.styles?.background)) {
          sampleCardStyles = JSON.parse(JSON.stringify(secondChild.styles));
        }
      }
    }
    if (!sampleHeading && node.children) node.children.forEach(findSample);
  };
  findSample(currentSchema);

  // Tái tạo Tiêu đề chuẩn theo cột đích
  let formattedHeading;
  if (sampleHeading) {
    const replaceHeadingContent = (n) => {
      if (!n) return;
      if (n.type === 'Text' && n.content && n.content !== '•' && n.content !== '-' && n.content !== '|') {
        n.content = (sampleHeading.styles?.textTransform === 'uppercase' || n.styles?.textTransform === 'uppercase')
          ? titleText.toUpperCase()
          : titleText;
      }
      if (n.children) n.children.forEach(replaceHeadingContent);
    };
    replaceHeadingContent(sampleHeading);
    formattedHeading = sampleHeading;
  } else {
    formattedHeading = newSection.children[0];
  }

  // 🌟 5. BÓC TÁCH (UNWRAP) VỎ BỌC NỀN XANH
  let contentNode = (newSection.children && newSection.children[1]) ? newSection.children[1] : null;

  // Nếu nội dung đang bị bọc bởi Container nền xanh/card -> Bóc lấy nội dung con bên trong
  if (contentNode && contentNode.type === 'Container' && contentNode.children && contentNode.children.length === 1) {
    const hasCardBg = contentNode.styles?.backgroundColor || contentNode.styles?.background;
    if (hasCardBg && contentNode.styles?.backgroundColor !== 'transparent') {
      contentNode = contentNode.children[0];
    }
  }

  // 🌟 6. XỬ LÝ THEO CỘT ĐÍCH
  if (isLeft) {
    // KHI SANG CỘT TRÁI: Xóa triệt để màu nền, padding và bo góc thừa
    if (contentNode && contentNode.styles) {
      delete contentNode.styles.backgroundColor;
      delete contentNode.styles.background;
      delete contentNode.styles.padding;
      delete contentNode.styles.borderRadius;
    }
  } else {
    // KHI SANG CỘT PHẢI: Nếu cột phải có ô xanh, tự động bọc lại
    if (sampleCardStyles) {
      contentNode = {
        type: "Container",
        styles: { ...sampleCardStyles, width: "100%", boxSizing: "border-box" },
        children: [contentNode]
      };
    } else {
      // Dự phòng cho mẫu có timeline card xanh
      const schemaStr = JSON.stringify(currentSchema);
      if (schemaStr.includes('#e6f0fa') || schemaStr.includes('borderRadius": "20px"')) {
        contentNode = {
          type: "Container",
          styles: { backgroundColor: "#e6f0fa", borderRadius: "20px", padding: "18px 22px", width: "100%", boxSizing: "border-box" },
          children: [contentNode]
        };
      }
    }
  }

  // 7. Đồng bộ màu chữ theo màu nền của cột
  const syncTextColor = (node, toLeft) => {
    if (!node) return;
    if (node.styles) {
      if (toLeft) {
        if (!node.styles.color || !node.styles.color.includes('var(')) {
          node.styles.color = (node.styles.fontWeight === 'bold' || node.styles.fontWeight === '600') ? '#1e293b' : '#64748b';
        }
      } else {
        if (node.styles.color && (node.styles.color.includes('#fff') || node.styles.color.includes('255, 255, 255'))) {
          node.styles.color = '#1e293b';
        }
      }
    }
    if (node.children) node.children.forEach(c => syncTextColor(c, toLeft));
    if (node.itemTemplate) syncTextColor(node.itemTemplate, toLeft);
  };
  syncTextColor(contentNode, isLeft);

  newSection.children = [formattedHeading, contentNode];
  return newSection;
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
  const currentLang = (new URLSearchParams(window.location.search).get('lang') || 'vi').toLowerCase();
  const isEn = currentLang === 'en';
  const lower = id.toLowerCase();
  if (lower.includes('phone') || lower.includes('dienthoai')) return isEn ? 'Phone' : 'Số điện thoại';
  if (lower.includes('email')) return 'Email';
  if (lower.includes('address') || lower.includes('diachi')) return isEn ? 'Address' : 'Địa chỉ';
  if (lower.includes('dob') || lower.includes('birth') || lower.includes('ngaysinh')) return isEn ? 'Date of Birth' : 'Ngày sinh';
  if (lower.includes('website') || lower.includes('web')) return 'Website';
  if (lower.includes('gender') || lower.includes('gioitinh')) return isEn ? 'Gender' : 'Giới tính';
  return isEn ? 'Custom Field' : 'Mục tự nhập';
};

const getMacroSectionTitle = (id) => {
  if (!id) return 'Section';
  const currentLang = (
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null) || 'vi'
  ).toLowerCase();
  const isEn = currentLang === 'en' || currentLang === 'english';
  const t = (vi, en) => (isEn ? en : vi);

  const map = {
    'section-summary': t('Mục tiêu nghề nghiệp', 'Career Objective'),
    'section-experience': t('Kinh nghiệm làm việc', 'Work Experience'),
    'section-education': t('Học vấn', 'Education'),
    'section-skills': t('Kỹ năng', 'Skills'),
    'section-hobbies': t('Sở thích', 'Hobbies'),
    'section-awards': t('Danh hiệu và giải thưởng', 'Honors & Awards'),
    'section-certificates': t('Chứng chỉ', 'Certificates'),
    'section-activities': t('Hoạt động', 'Activities'),
    'section-projects': t('Dự án', 'Projects'),
    'section-contact-info': t('Thông tin liên hệ', 'Contact Information'),
    'section-avatar-profile': t('Ảnh đại diện', 'Avatar'),
    'section-references': t('Người giới thiệu', 'References'),
    'section-additional': t('Thông tin thêm', 'Additional Information'),
    'section-business-card': t('Danh thiếp', 'Business Card')
  };
  if (map[id]) return map[id];
  if (id.startsWith('section-contact-')) return getSectionLabel(id);
  return 'Section';
};

const isSectionRequired = (id) => {
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
  const layoutSchema = useCvStore(state => state.layoutSchema || state.schema);

  const mainSections = [
    'section-contact-info', 'section-education', 'section-experience',
    'section-awards', 'section-certificates', 'section-activities',
    'section-projects', 'section-hobbies', 'section-skills',
    'section-summary', 'section-avatar-profile',
    'section-references', 'section-additional', 'section-business-card'
  ];

  const isLargeBlock = node.id && mainSections.includes(node.id);
  const isContactChild = node.id && node.id.startsWith('section-contact-') && !isLargeBlock;
  const isLoopRow = node._isLoopRowRoot === true;

  const isAnyChildBlock = isContactChild || isLoopRow;
  const isValidNode = isLargeBlock || isAnyChildBlock;

  if (!isValidNode) return children;

  let loopBaseString = null;
  let computedIndex = -1;

  if (isLoopRow) {
    loopBaseString = node._loopBasePath || (node.dataPath ? node.dataPath.replace(/\[\d+\].*/, '').replace(/\.\d+\..*/, '') : null);
    computedIndex = (dataScope && dataScope.index !== undefined)
      ? dataScope.index
      : extractLoopIndexSafely(node);
  }

  const fallbackIdRef = useRef(`block-${Math.random().toString(36).substr(2, 9)}`);
  const uniqueBlockId = isLoopRow
    ? `${loopBaseString || 'loop'}-${computedIndex}`
    : (node.id || fallbackIdRef.current);

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleHoverUpdate = () => {
      const isCurrentlyHovered = globalHoveredBlockId === uniqueBlockId;
      setIsHovered(prev => (prev !== isCurrentlyHovered ? isCurrentlyHovered : prev));
    };
    hoverListeners.add(handleHoverUpdate);
    handleHoverUpdate();

    return () => {
      hoverListeners.delete(handleHoverUpdate);
      if (globalHoveredBlockId === uniqueBlockId) {
        setGlobalHovered(null);
      }
    };
  }, [uniqueBlockId]);

  const handleMouseEnter = (e) => {
    e.stopPropagation();
    setGlobalHovered(uniqueBlockId);
  };

  const handleMouseLeave = (e) => {
    e.stopPropagation();
    if (globalHoveredBlockId === uniqueBlockId) {
      const targetBlock = e.relatedTarget?.closest?.('.cv-macro-section-block');
      if (targetBlock) {
        const targetId = targetBlock.getAttribute('data-block-id');
        if (targetId) {
          setGlobalHovered(targetId);
          return;
        }
      }
      setGlobalHovered(null);
    }
  };

  const undeletableSections = ['section-avatar-profile', 'section-contact-info', 'section-business-card'];
  const canDeleteMacro = !undeletableSections.includes(node.id);

  let canDeleteChild = true;
  if (isContactChild) {
    canDeleteChild = node.id !== 'section-contact-phone' && node.id !== 'section-contact-email';
  }

  const isTopBlock = node.id === 'section-avatar-profile' || node.id === 'section-business-card';

  const showMacroToolbar = isLargeBlock && (isHovered || popoverOpen);
  const showChildToolbar = isAnyChildBlock && isHovered;

  let isFirst = false;
  let isLast = false;
  let isSingleItem = false;

  if (isLoopRow) {
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
      let draggedItemObj = null;
      let sourceArray = null;

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
        let targetColId = null;
        const siblingId = newOrderIds.find(id => id !== draggedId);

        if (siblingId) {
          const findTargetArray = (parent) => {
            if (!parent || !parent.children) return false;
            if (parent.children.some(c => c && c.id === siblingId)) {
              targetArray = parent.children;
              targetColId = parent.id;
              return true;
            }
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
                targetArray = parent.children;
                targetColId = parent.id;
                return true;
              }
              if (parent.children) {
                for (const c of parent.children) { if (findContainerArray(c)) return true; }
              }
              return false;
            };
            findContainerArray(newSchema);
          }
          if (!targetArray) {
            targetArray = sourceArray;
          }
        }

        if (targetArray) {
          if (!targetColId && targetArray) {
            if (newSchema.children && newSchema.children[0] && newSchema.children[0].children === targetArray) {
              targetColId = newSchema.children[0].id || 'left-col';
            } else if (newSchema.children && newSchema.children[1] && newSchema.children[1].children === targetArray) {
              targetColId = newSchema.children[1].id || 'right-col';
            }
          }

          if (targetColId) {
            const currentLang = (
              store.language ||
              store.currentLang ||
              store.layoutSettings?.language ||
              (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null) ||
              'vi'
            );
            draggedItemObj = transformSectionForColumn(draggedItemObj, targetColId, currentLang);
          }

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
      data-block-id={uniqueBlockId}
      data-column-index={themeCtx.columnIndex}
      className={`cv-macro-section-block ${isAnyChildBlock ? 'is-loop-child' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        minWidth: '0',
        display: 'block',
        boxSizing: 'border-box'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {showMacroToolbar && (
        <div
          className={`cv-macro-toolbar no-print ${popoverOpen ? 'force-show' : ''}`}
          style={{
            position: 'absolute',
            alignItems: 'center',
            gap: '2px',
            top: isTopBlock ? '10px' : '-32px',
            left: '10px',
            zIndex: 1000
          }}
        >
          <div draggable={true} onDragStart={handleDragStart} onDragEnd={handleDragEnd} className="cv-btn-item" style={{ cursor: 'move' }} title="Kéo thả di chuyển mục">
            <DragOutlined />
          </div>
          {node.id === 'section-contact-info' && (
            <Popover content={popoverContent} title={null} trigger="click" placement="topLeft" overlayClassName="custom-cv-popover-wrapper" onOpenChange={(open) => setPopoverOpen(open)}>
              <button className="cv-btn-item" title="Ẩn/Hiện thông tin"><EyeOutlined /></button>
            </Popover>
          )}
          {!isFirst && <button className="cv-btn-item" onClick={() => useCvStore.getState().moveMacroSection(node.id, 'up')} title="Di chuyển lên"><ArrowUpOutlined /></button>}
          {!isLast && <button className="cv-btn-item" onClick={() => useCvStore.getState().moveMacroSection(node.id, 'down')} title="Di chuyển xuống"><ArrowDownOutlined /></button>}
          {canDeleteMacro && <button className="cv-btn-delete" onClick={() => useCvStore.getState().removeMacroSection(node.id)}>Xóa</button>}
        </div>
      )}
      {showChildToolbar && (
        <div
          className="cv-macro-toolbar cv-new-child-toolbar no-print"
          style={{
            position: 'absolute', alignItems: 'center', gap: '2px',
            top: '-32px', right: '10px', zIndex: 1000
          }}
        >
          {isSingleItem ? (
            <button className="cv-btn-add" onClick={handleAddClick}>+ Thêm</button>
          ) : (
            <>
              {!isFirst && <button className="cv-btn-item" onClick={() => handleMoveChildClick('up')} title="Di chuyển lên"><ArrowUpOutlined /></button>}
              {!isLast && <button className="cv-btn-item" onClick={() => handleMoveChildClick('down')} title="Di chuyển xuống"><ArrowDownOutlined /></button>}
              {canDeleteChild && <button className="cv-btn-delete" onClick={handleDeleteClick}>Xóa</button>}
              <button className="cv-btn-add" onClick={handleAddClick}>+ Thêm</button>
            </>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

const AtomicRenderer = ({ node, dataScope, isRoot = false, isDirectColumn = false }) => {
  const [_, forceUpdate] = useState(0);
  const themeCtx = useContext(ThemeContext);

  const layoutSettings = useCvStore((state) => state.layoutSettings);

  useEffect(() => {
    const handler = () => forceUpdate(c => c + 1);
    hiddenSectionsListeners.add(handler);
    return () => hiddenSectionsListeners.delete(handler);
  }, []);

  if (!node || typeof node !== 'object') return null;

  const checkSolidBg = (styles) => {
    if (!styles || !styles.backgroundColor) return false;
    const bg = styles.backgroundColor.replace(/\s/g, '').toLowerCase();
    return bg !== 'transparent' && bg !== 'initial' && bg !== 'inherit' && !bg.startsWith('rgba(0,0,0,0)');
  };
  const isColumnNode = isRoot || isDirectColumn;
  const hasSolidBg = !isColumnNode && checkSolidBg(node.styles);
  const nextIsInsideColoredBg = themeCtx.isInsideColoredBg || hasSolidBg;

  const processDynamicStyles = (styles, colIdx, insideColor) => {
    if (!styles) return styles;
    const processed = { ...styles };

    if (layoutSettings?.fontFamily) {
      processed.fontFamily = layoutSettings.fontFamily;
    }

    if (processed.fontSize && typeof processed.fontSize === 'string' && processed.fontSize.includes('px')) {
      const px = parseFloat(processed.fontSize);
      if (!isNaN(px)) processed.fontSize = `calc(var(--base-font-size, 13px) * (${px} / 13))`;
    }

    if (layoutSettings?.backgroundStyle && layoutSettings.backgroundStyle !== 'none') {
      if (isRoot) {
        processed.background = layoutSettings.backgroundStyle;
        delete processed.backgroundColor;
      }

      if (node.id === 'right-col') {
        processed.background = 'transparent';
        processed.backgroundColor = 'transparent';
      }
    }
    return processed;
  };

  const dynamicStyles = processDynamicStyles(node.styles, themeCtx.columnIndex, nextIsInsideColoredBg);
  const renderCoreNode = () => {
    switch (node.type) {
      case 'Container':
        if (node.id === 'section-contact-info') {
          const STANDARD_CONTACTS = [
            'section-contact-phone',
            'section-contact-email',
            'section-contact-website',
            'section-contact-address',
            'section-contact-dob',
            'section-contact-gender'
          ];

          const headerNode = node.children
            ? node.children.find(c => c && (c.id === 'contact-section-header' || c.id === 'section-contact-header'))
            : null;
          const itemNodes = node.children
            ? node.children.filter(c => c && c !== headerNode)
            : [];

          if (!window.__contactChildrenOrder || window.__contactChildrenOrder.length === 0 || !window.__contactChildrenOrder.some(id => STANDARD_CONTACTS.includes(id))) {
            window.__contactChildrenOrder = itemNodes.map(c => c && c.id).filter(Boolean);
          }
          window.__contactChildrenOrder = window.__contactChildrenOrder.filter(
            id => id !== 'contact-section-header' && id !== 'section-contact-header'
          );

          STANDARD_CONTACTS.forEach(stdId => {
            if (!window.__contactChildrenOrder.includes(stdId)) {
              window.__contactChildrenOrder.push(stdId);
              if (!window.__hiddenCvSections.includes(stdId)) {
                window.__hiddenCvSections.push(stdId);
              }
            }
          });

          if (itemNodes) {
            itemNodes.forEach(c => {
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

          const isIconTemplate = itemNodes.some(c => c && c.children && c.children.some(sub => sub.type === 'Icon'));
          const sampleItem = itemNodes.find(c => c && c.children && c.children.length > 0) || itemNodes[0];

          const mixedChildren = visibleIds.map(id => {
            const standard = itemNodes.find(c => c && c.id === id);
            if (standard) return standard;

            if (sampleItem) {
              const clonedChild = JSON.parse(JSON.stringify(sampleItem));
              clonedChild.id = id;

              const currentLang = new URLSearchParams(window.location.search).get('lang') || 'vi';
              const t = (viText, enText) => currentLang === 'en' ? enText : viText;

              const metaMap = {
                'section-contact-dob': { icon: 'calendar', key: 'dob', placeholder: t('Ngày sinh', 'Date of Birth'), label: t('Ngày sinh:', 'Date of Birth:') },
                'section-contact-gender': { icon: 'user', key: 'gender', placeholder: t('Giới tính', 'Gender'), label: t('Giới tính:', 'Gender:') },
                'section-contact-phone': { icon: 'phone', key: 'phone', placeholder: t('Số điện thoại', 'Phone'), label: t('Số điện thoại:', 'Phone:') },
                'section-contact-email': { icon: 'mail', key: 'email', placeholder: 'Email', label: 'Email:' },
                'section-contact-website': { icon: 'website', key: 'website', placeholder: 'Website', label: 'Website:' },
                'section-contact-address': { icon: 'address', key: 'address', placeholder: t('Địa chỉ', 'Address'), label: t('Địa chỉ:', 'Address:') }
              };

              const isCustom = id.startsWith('section-contact-custom-');

              const transformChild = (n) => {
                if (!n) return;
                if (n.type === 'Icon') {
                  n.name = isCustom ? 'info-circle' : (metaMap[id]?.icon || 'info-circle');
                }
                if (n.type === 'Text') {
                  if (n.dataPath) {
                    if (isCustom) {
                      n.dataPath = `contact.custom.${id}`;
                      n.placeholder = t('Nhập nội dung...', 'Enter information...');
                    } else {
                      const parts = n.dataPath.split('.');
                      parts.pop();
                      const prefix = parts.length > 0 ? parts.join('.') + '.' : '';
                      n.dataPath = prefix + metaMap[id].key;
                      n.placeholder = metaMap[id].placeholder;
                    }
                  } else if (n.content !== undefined) {
                    if (isCustom) {
                      n.dataPath = `contact.custom_label.${id}`;
                      n.placeholder = t('Tiêu đề:', 'Title:');
                      delete n.content;
                    } else {
                      n.content = metaMap[id].label;
                    }
                  }
                }
                if (n.children) n.children.forEach(transformChild);
              };

              transformChild(clonedChild);
              return clonedChild;
            }

            return { id: id, type: 'CustomInputRow', _useIcon: isIconTemplate };
          });

          return (
            <ContainerNode node={{ ...node, styles: dynamicStyles }} isRoot={isRoot}>
              {headerNode && (
                <AtomicRenderer node={headerNode} dataScope={dataScope} isRoot={false} />
              )}
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

        return (
          <ContainerNode node={{ ...node, styles: dynamicStyles }} isRoot={isRoot}>
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
        const hasIconMode = node._useIcon === true;
        const isReqField = node.id === 'section-contact-phone' || node.id === 'section-contact-email';

        if (hasIconMode) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '28px' }}>
              <InfoCircleOutlined style={{ color: 'inherit', opacity: 0.9, fontSize: '14px', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <TextNode
                  dataPath={`contact.custom.${node.id}`}
                  placeholder="Nhập nội dung..."
                  styles={{ width: '100%', fontSize: '13.5px', fontFamily: 'inherit', color: 'inherit', background: 'transparent', border: 'none', padding: 0, margin: 0 }}
                  dataScope={dataScope}
                  isRequired={isReqField}
                />
              </div>
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', width: '100%', minHeight: '28px' }}>
            <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <TextNode
                dataPath={`contact.custom_label.${node.id}`}
                placeholder="Tiêu đề:"
                styles={{ fontWeight: 'bold', color: 'inherit', background: 'transparent', border: 'none', padding: 0, margin: 0 }}
                dataScope={dataScope}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'baseline' }}>
              <TextNode
                dataPath={`contact.custom.${node.id}`}
                placeholder="Nhập nội dung..."
                styles={{ width: '100%', color: 'inherit', background: 'transparent', border: 'none', padding: 0, margin: 0 }}
                dataScope={dataScope}
                isRequired={isReqField}
              />
            </div>
          </div>
        );

      case 'Text':
        if (node.dataPath) {
          const isReqField = node.dataPath.includes('phone') || node.dataPath.includes('email');
          return <TextNode dataPath={node.dataPath} placeholder={node.placeholder} styles={dynamicStyles} dataScope={dataScope} isRequired={isReqField} />;
        }
        return <div style={dynamicStyles}>{resolveContent(node.content, dataScope)}</div>;

      case 'RichText':
        if (node.dataPath) {
          return <RichTextNode dataPath={node.dataPath} placeholder={node.placeholder} styles={dynamicStyles} dataScope={dataScope} />;
        }
        return <div style={dynamicStyles} dangerouslySetInnerHTML={{ __html: resolveContent(node.content, dataScope) }} />;

      case 'Image':
        return <ImageNode dataPath={node.dataPath} styles={dynamicStyles} dataScope={dataScope} />;

      case 'Icon': {
        const IconMap = {
          phone: PhoneOutlined,
          calendar: CalendarOutlined,
          dob: CalendarOutlined,
          mail: MailOutlined,
          email: MailOutlined,
          address: EnvironmentOutlined,
          location: EnvironmentOutlined,
          website: GlobalOutlined,
          user: UserOutlined,
          gender: UserOutlined,
          bulb: BulbOutlined,
          team: TeamOutlined,
          project: ProjectOutlined,
          activity: AppstoreOutlined,
          trophy: TrophyOutlined,
          award: TrophyOutlined,
          file: FileTextOutlined,
          certificate: FileTextOutlined,
          default: CheckCircleOutlined
        };
        const TargetIcon = IconMap[node.name?.toLowerCase()] || IconMap.default;
        return <TargetIcon style={{ color: 'inherit', ...dynamicStyles }} />;
      }

      case 'ProgressBar': {
        const rawLevel = dataScope && dataScope.level !== undefined ? dataScope.level : 75;
        const currentPercent = typeof rawLevel === 'number' ? rawLevel : parseInt(rawLevel) || 75;

        const handleBarClick = (e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          let newPercent = Math.round((clickX / rect.width) * 10) * 10;
          if (newPercent < 10) newPercent = 10;
          if (newPercent > 100) newPercent = 100;

          const store = useCvStore.getState();
          const newCvData = JSON.parse(JSON.stringify(store.cvData || {}));

          if (dataScope?.parentPath !== undefined && dataScope?.index !== undefined) {
            if (newCvData[dataScope.parentPath] && newCvData[dataScope.parentPath][dataScope.index]) {
              newCvData[dataScope.parentPath][dataScope.index][node.dataPath || 'level'] = newPercent;
              store.setInitialData(store.layoutSchema || store.schema, newCvData);
            }
          }
        };

        return (
          <div
            onClick={handleBarClick}
            title={`Mức độ: ${currentPercent}% (Nhấp chuột để chọn mức)`}
            style={{
              width: '100%',
              height: dynamicStyles.height || '7px',
              backgroundColor: dynamicStyles.backgroundColor || 'rgba(255, 255, 255, 0.25)',
              borderRadius: dynamicStyles.borderRadius || '2px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              ...dynamicStyles
            }}
          >
            <div
              style={{
                width: `${currentPercent}%`,
                height: '100%',
                backgroundColor: dynamicStyles.fill || '#ffffff',
                borderRadius: 'inherit',
                transition: 'width 0.25s ease'
              }}
            />
          </div>
        );
      }

      case 'LoopContainer':
        if (node.itemTemplate) {
          node.itemTemplate._isLoopRowRoot = true;
          node.itemTemplate._loopBasePath = node.dataPath;
        }

        const loopStyles = { ...dynamicStyles };

        return (
          <div style={{ width: '100%' }}>
            <ThemeContext.Provider value={{ columnIndex: themeCtx.columnIndex, isInsideColoredBg: nextIsInsideColoredBg, isInsideLoopItem: true }}>
              <LoopNode dataPath={node.dataPath} styles={loopStyles} itemTemplate={node.itemTemplate} />
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