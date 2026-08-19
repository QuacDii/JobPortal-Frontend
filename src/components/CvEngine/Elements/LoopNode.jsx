import React from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';
import AtomicRenderer from '../AtomicRenderer';

const LoopNode = ({ dataPath, styles, itemTemplate }) => {
  const cvData = useCvStore(state => state.cvData);
  const addArrayItem = useCvStore(state => state.addArrayItem);

  const loopArray = get(cvData, dataPath, []);
  const defaultEmptyItem = { time: '', companyName: '', title: '', description: '', school: '', major: '', name: '' };
  const isPlaceholder = loopArray.length === 0;
  const displayArray = isPlaceholder ? [defaultEmptyItem] : loopArray;

  const isRowFlex = styles?.display === 'flex' && (styles?.flexDirection === 'row' || styles?.flexWrap === 'wrap');

  return (
    <div style={{ ...styles, position: 'relative' }} className="cv-loop-container">
      {displayArray.map((itemData, index) => (
        <div
          key={itemData.id || index}
          className={`cv-loop-item-block ${isPlaceholder ? 'is-ghost' : ''}`}
          style={{
            position: 'relative',
            padding: '4px 0',
            margin: isRowFlex ? '0' : '0 0 10px 0',
            width: itemTemplate?.styles?.width || (isRowFlex ? 'auto' : '100%'),
            flex: itemTemplate?.styles?.flex || (itemTemplate?.styles?.width ? `0 0 ${itemTemplate.styles.width}` : (isRowFlex ? 'auto' : 'none')),
            boxSizing: 'border-box',
            borderRadius: '4px',
            opacity: isPlaceholder ? 0.35 : 1
          }}
        >
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
        .cv-loop-item-block:hover {
          outline: none !important;
          background-color: transparent !important;
        }

        .cv-loop-item-block.is-ghost {
          outline: none !important;
        }
      `}</style>
    </div>
  );
};

export default LoopNode;