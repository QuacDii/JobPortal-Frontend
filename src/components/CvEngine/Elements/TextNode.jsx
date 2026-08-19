import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';

const fontOptions = [
  { label: 'Be Vietnam Pro', value: '"Be Vietnam Pro", sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", sans-serif' },
  { label: 'Inter', value: '"Inter", sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", sans-serif' },
  { label: 'Quicksand', value: '"Quicksand", sans-serif' },
  { label: 'Poppins', value: '"Poppins", sans-serif' },
  { label: 'Lora', value: '"Lora", serif' },
  { label: 'Merriweather', value: '"Merriweather", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' }
];

const fontSizeOptions = [
  'Mặc định', '10px', '11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '20px', '22px', '24px', '28px', '32px'
];

const TextNode = ({ dataPath, placeholder, styles, dataScope, isRequired = false }) => {
  const updateCvDataPath = useCvStore((state) => state.updateCvDataPath);

  const layoutSettings = useCvStore((state) => state.layoutSettings);
  const globalFont = layoutSettings?.fontFamily || '"Be Vietnam Pro", sans-serif';
  const globalFontSize = layoutSettings?.fontSize ? `${layoutSettings.fontSize}px` : '14px';

  let finalPath = dataPath;
  if (dataScope && dataScope.parentPath !== undefined) {
    finalPath = `${dataScope.parentPath}[${dataScope.index}].${dataPath}`;
  }

  const rawContent = useCvStore((state) => get(state.cvData, finalPath, ''));
  const textContent = typeof rawContent === 'string' || typeof rawContent === 'number' ? String(rawContent) : '';

  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const isComposingRef = useRef(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarCoords, setToolbarCoords] = useState({ top: -9999, left: -9999 });

  const [currentFontSize, setCurrentFontSize] = useState(globalFontSize);
  const [currentFontFamily, setCurrentFontFamily] = useState(globalFont);
  const [currentColor, setCurrentColor] = useState('#000000');

  useEffect(() => {
    setCurrentFontFamily(globalFont);
    setCurrentFontSize(globalFontSize);
  }, [globalFont, globalFontSize]);

  const checkIsEmpty = (text) => !text || text.replace(/<[^>]*>?/gm, '').trim() === '';

  const isExportMode = typeof window !== 'undefined' && (
    document.querySelector('.is-exporting') !== null ||
    window.location.pathname.includes('/xem-cv')
  );

  const updateCoords = () => {
    if (editorRef.current && showToolbar) {
      const rect = editorRef.current.getBoundingClientRect();
      setToolbarCoords({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    }
  };

  useLayoutEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [showToolbar]);

  useEffect(() => {
    if (editorRef.current && !isExportMode) {
      if (document.activeElement !== editorRef.current && !isComposingRef.current) {
        if (editorRef.current.innerHTML !== textContent) {
          editorRef.current.innerHTML = textContent || '';
        }
      }
    }
  }, [textContent, isExportMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showToolbar && editorRef.current && !editorRef.current.contains(e.target) && !e.target.closest('.cv-floating-bubble-toolbar')) {
        setShowToolbar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showToolbar]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const detectActualStyles = () => {
    saveSelection();
    if (!editorRef.current) return;

    const sel = window.getSelection();
    let targetNode = editorRef.current;
    if (sel && sel.anchorNode) {
      targetNode = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
    }

    if (targetNode) {
      const computed = window.getComputedStyle(targetNode);
      const computedFont = (computed.fontFamily || '').replace(/['"]/g, '').toLowerCase();

      const foundFont = fontOptions.find(f => {
        const cleanLabel = f.label.toLowerCase();
        return computedFont.includes(cleanLabel);
      });

      if (foundFont) {
        setCurrentFontFamily(foundFont.value);
      } else {
        setCurrentFontFamily(globalFont);
      }

      if (computed.fontSize) {
        const px = Math.round(parseFloat(computed.fontSize));
        setCurrentFontSize(`${px}px`);
      } else {
        setCurrentFontSize(globalFontSize);
      }
    }
  };

  const handleFocus = () => {
    setShowToolbar(true);
    setTimeout(detectActualStyles, 20);
  };

const applyFormat = (cmd, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const sel = window.getSelection();
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    const isCollapsed = !sel || sel.isCollapsed || sel.rangeCount === 0;

    if (isCollapsed) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    if (cmd === 'fontName') {
      setCurrentFontFamily(value);
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontName', false, value);
      if (isCollapsed) {
        editorRef.current.style.fontFamily = value;
      }
    } else if (cmd === 'fontSize') {
      if (value === 'Mặc định') {
        setCurrentFontSize(globalFontSize);
        editorRef.current.style.fontSize = '';
        const fontTags = editorRef.current.querySelectorAll('font, span');
        fontTags.forEach(f => {
          f.style.fontSize = '';
          f.removeAttribute('size');
        });
      } else {
        setCurrentFontSize(value);
        document.execCommand('styleWithCSS', false, false);
        document.execCommand('fontSize', false, '7');
        const fontTags = editorRef.current.querySelectorAll(
          'font[size="7"], font[size="+7"], span[style*="xxx-large"], span[style*="48px"]'
        );
        fontTags.forEach(f => {
          f.removeAttribute('size');
          f.style.fontSize = value;
        });
        if (isCollapsed) {
          editorRef.current.style.fontSize = value;
        }
      }
    } else {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand(cmd, false, value);
    }

    if (isCollapsed) {
      sel.collapseToEnd();
    }

    const newValue = editorRef.current.innerHTML;
    updateCvDataPath(finalPath, checkIsEmpty(newValue) ? '' : newValue);
    saveSelection();
  };

  const handleInput = (e) => {
    isComposingRef.current = true;
    const text = e.currentTarget.innerHTML;
    updateCvDataPath(finalPath, checkIsEmpty(text) ? '' : text);
    setTimeout(() => { isComposingRef.current = false; }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const isBlock = styles?.display === 'block' || styles?.width === '100%';

  if (isExportMode) {
    return (
      <span
        style={{
          ...styles,
          display: styles?.display || (isBlock ? 'block' : 'inline-block'),
          width: styles?.width || (isBlock ? '100%' : 'auto'),
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          outline: 'none'
        }}
        dangerouslySetInnerHTML={{ __html: textContent }}
      />
    );
  }

  const isEmpty = checkIsEmpty(textContent);
  const reqClass = (isRequired && isEmpty) ? 'is-empty-required' : '';

  const toolbarHtml = showToolbar ? createPortal(
    <div
      className="cv-floating-bubble-toolbar no-print"
      style={{ top: toolbarCoords.top, left: toolbarCoords.left, position: 'absolute', zIndex: 2147483647 }}
      onMouseDown={(e) => {
        if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT') e.preventDefault();
        e.stopPropagation();
      }}
    >
      <select
        value={currentFontSize}
        onChange={(e) => applyFormat('fontSize', e.target.value)}
        className="toolbar-select font-size-select"
        title="Cỡ chữ"
      >
        {fontSizeOptions.map(sz => (
          <option key={sz} value={sz}>{sz}</option>
        ))}
        {!fontSizeOptions.includes(currentFontSize) && (
          <option value={currentFontSize}>{currentFontSize}</option>
        )}
      </select>

      <select
        value={currentFontFamily}
        onChange={(e) => applyFormat('fontName', e.target.value)}
        className="toolbar-select font-family-select"
        title="Phông chữ"
      >
        {fontOptions.map(font => (
          <option key={font.label} value={font.value} style={{ fontFamily: font.value }}>{font.label}</option>
        ))}
        {!fontOptions.some(f => f.value === currentFontFamily) && (
          <option value={currentFontFamily}>{currentFontFamily.replace(/['",]/g, '').split(' ')[0]}</option>
        )}
      </select>

      <div className="toolbar-divider" />

      <label className="toolbar-color-wrapper" title="Màu chữ">
        <input type="color" value={currentColor} onChange={(e) => { setCurrentColor(e.target.value); applyFormat('foreColor', e.target.value); }} />
        <span className="color-preview-circle" style={{ backgroundColor: currentColor }} />
      </label>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <span className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); applyFormat('bold'); }} title="In đậm (Ctrl+B)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </span>
        <span className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); applyFormat('italic'); }} title="In nghiêng (Ctrl+I)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </span>
        <span className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); applyFormat('underline'); }} title="Gạch chân (Ctrl+U)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v7a6 6 0 0 0 12 0V3"></path>
            <line x1="4" y1="21" x2="20" y2="21"></line>
          </svg>
        </span>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    // FIX: Thẻ bao ngoài tự động nhận width 100% và display block khi được yêu cầu
    <div
      style={{
        position: 'relative',
        display: styles?.display || (isBlock ? 'block' : 'inline-block'),
        width: styles?.width || (isBlock ? '100%' : 'auto'),
        minWidth: isBlock ? '100%' : '30px',
        marginBottom: styles?.marginBottom,
        marginTop: styles?.marginTop,
        flexGrow: styles?.flexGrow,
        boxSizing: 'border-box'
      }}
    >
      {toolbarHtml}

      <span
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onFocus={handleFocus}
        onClick={handleFocus}
        onKeyUp={detectActualStyles}
        onMouseUp={detectActualStyles}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`text-node-editor ${showToolbar ? 'is-focused' : ''} ${reqClass}`}
        style={{
          ...styles,
          display: isBlock ? 'block' : 'inline-block',
          width: isBlock ? '100%' : 'auto',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          outline: 'none',
          marginBottom: 0,
          boxSizing: 'border-box'
        }}
        data-placeholder={placeholder || 'Nhập thông tin...'}
      />

      <style>{`
        .text-node-editor {
          display: inline-block;
          min-width: 30px;
          border-radius: 4px;
          padding: 2px 4px;
          border: 1px dashed transparent;
          transition: all 0.15s ease-in-out;
          background: transparent;
        }
        .text-node-editor:hover { border-color: #cbd5e1; }
        .text-node-editor.is-focused, .text-node-editor:focus {
          border: 1.5px solid #22c55e !important;
          background: transparent !important;
        }
        .text-node-editor.is-empty-required {
          border: 1.5px dashed #ff4d4f !important;
          background: rgba(255, 77, 79, 0.04) !important;
        }
        .text-node-editor:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          opacity: 0.8;
          pointer-events: none;
          font-style: italic;
        }

        .cv-floating-bubble-toolbar {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 4px 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06);
          animation: popToolbar 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          user-select: none;
        }
        @keyframes popToolbar {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .toolbar-select {
          border: 1px solid transparent;
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          background: #f8fafc;
          cursor: pointer;
          outline: none;
          transition: all 0.15s ease;
        }
        .toolbar-select:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .font-size-select { width: 85px; }
        .font-family-select { max-width: 135px; }

        .toolbar-divider {
          width: 1px;
          height: 18px;
          background: #e2e8f0;
          margin: 0 3px;
        }

        .toolbar-btn {
          border: none;
          background: transparent;
          color: #475569;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .toolbar-btn:hover {
          background: #f1f5f9;
          color: #0284c7;
        }
        .toolbar-btn:active {
          background: #e2e8f0;
          transform: scale(0.95);
        }

        .toolbar-color-wrapper {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 3px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .toolbar-color-wrapper:hover { background: #f1f5f9; }
        .toolbar-color-wrapper input[type="color"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }
        .color-preview-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px #cbd5e1;
          display: block;
          transition: transform 0.15s ease;
        }
        .toolbar-color-wrapper:hover .color-preview-circle {
          transform: scale(1.12);
        }
      `}</style>
    </div>
  );
};

export default TextNode;