import { create } from 'zustand';
import set from 'lodash/set';
import get from 'lodash/get';

const useCvStore = create((setStore, getStore) => ({
  // Dữ liệu nội dung CV khởi tạo ban đầu
  cvData: {
    personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', address: '', dob: '', avatar: '', website: '' },
    experience: [],
    education: [],
    skills: [],
    certificates: [],
    awards: [],
    hobbies: [],
    summary: '',
    activities: [],
    projects: []
  },
  layoutSettings: {
    fontFamily: '"Be Vietnam Pro", sans-serif',
    fontSize: 14,
    lineHeight: 1.5,
    themeColor: '#00b14f',
    backgroundStyle: 'none' 
  },

  //Tiếp nhận trực tiếp dữ liệu chuẩn hóa đổ từ CvBuilder sang
  setInitialData: (layoutJson, contentData) => setStore((state) => ({
    layoutSchema: layoutJson ? layoutJson : state.layoutSchema,
    cvData: contentData ? contentData : state.cvData
  })),

  updateLayoutSetting: (key, value) => setStore((state) => ({
    layoutSettings: {
      ...state.layoutSettings,
      [key]: value
    }
  })),

  updateCvDataPath: (path, value) => setStore((state) => {
    const newCvData = JSON.parse(JSON.stringify(state.cvData));
    set(newCvData, path, value);
    return { cvData: newCvData };
  }),

  getValueFromPath: (path, defaultValue = '') => {
    return get(getStore().cvData, path, defaultValue);
  },

  /* ========================================================
    HÀM DÀNH RIÊNG CHO ATOMIC RENDERER ĐIỀU KHIỂN
  ======================================================== */
  addLoopItem: (arrayPath) => setStore((state) => {
    const newCvData = JSON.parse(JSON.stringify(state.cvData));
    const currentArray = get(newCvData, arrayPath, []);
    // Thêm một item với id ngẫu nhiên để UI nhận dạng và render khối mới
    set(newCvData, arrayPath, [...currentArray, { id: Date.now() }]);
    return { cvData: newCvData };
  }),

  removeLoopItem: (itemPath) => setStore((state) => {
    // itemPath truyền từ Atomic sẽ có dạng "education[0]" hoặc "experience[1]"
    const match = itemPath.match(/(.*)\[(\d+)\]$/);
    if (!match) return state;
    
    const arrayPath = match[1];
    const indexToRemove = parseInt(match[2], 10);
    
    const newCvData = JSON.parse(JSON.stringify(state.cvData));
    const currentArray = get(newCvData, arrayPath, []);
    
    // Xóa item dựa theo chính xác số thứ tự (index)
    if (indexToRemove >= 0 && indexToRemove < currentArray.length) {
      currentArray.splice(indexToRemove, 1);
      set(newCvData, arrayPath, currentArray);
    }
    return { cvData: newCvData };
  }),

  moveLoopItem: (arrayPath, fromIndex, toIndex) => setStore((state) => {
    const newCvData = JSON.parse(JSON.stringify(state.cvData));
    const currentArray = get(newCvData, arrayPath, []);

    // Hoán đổi vị trí 2 phần tử trong mảng
    if (fromIndex >= 0 && fromIndex < currentArray.length && toIndex >= 0 && toIndex < currentArray.length) {
      const temp = currentArray[fromIndex];
      currentArray[fromIndex] = currentArray[toIndex];
      currentArray[toIndex] = temp;
      set(newCvData, arrayPath, currentArray);
    }
    return { cvData: newCvData };
  }),
  /* ======================================================== */

  addArrayItem: (arrayPath, newItemTemplate) => setStore((state) => {
    const newCvData = JSON.parse(JSON.stringify(state.cvData));
    const currentArray = get(newCvData, arrayPath, []);
    const itemToAdd = { id: Date.now(), ...newItemTemplate };
    set(newCvData, arrayPath, [...currentArray, itemToAdd]);
    return { cvData: newCvData };
  }),

  removeArrayItem: (arrayPath, itemId) => setStore((state) => {
    const newCvData = JSON.parse(JSON.stringify(state.cvData));
    const currentArray = get(newCvData, arrayPath, []);
    const filteredArray = currentArray.filter(item => item.id !== itemId);
    set(newCvData, arrayPath, filteredArray);
    return { cvData: newCvData };
  }),

  moveArrayItem: (arrayPath, index, direction) => setStore((state) => {
    const newCvData = JSON.parse(JSON.stringify(state.cvData));
    const currentArray = get(newCvData, arrayPath, []);

    if (direction === 'up' && index > 0) {
      const temp = currentArray[index];
      currentArray[index] = currentArray[index - 1];
      currentArray[index - 1] = temp;
    } else if (direction === 'down' && index < currentArray.length - 1) {
      const temp = currentArray[index];
      currentArray[index] = currentArray[index + 1];
      currentArray[index + 1] = temp;
    }

    set(newCvData, arrayPath, currentArray);
    return { cvData: newCvData };
  }),

  removeMacroSection: (sectionId) => setStore((state) => {
    const newLayout = JSON.parse(JSON.stringify(state.layoutSchema));
    const cleanNode = (parent) => {
      if (!parent.children) return;
      parent.children = parent.children.filter(child => child.id !== sectionId);
      parent.children.forEach(cleanNode);
    };
    cleanNode(newLayout);
    return { layoutSchema: newLayout };
  }),

  addMacroSection: (columnId, sectionTemplate) => setStore((state) => {
    const newLayout = JSON.parse(JSON.stringify(state.layoutSchema));
    const injectNode = (node) => {
      if (node.id === columnId) {
        if (!node.children) node.children = [];
        if (!node.children.some(c => c.id === sectionTemplate.id)) {
          node.children.push(JSON.parse(JSON.stringify(sectionTemplate)));
        }
        return;
      }
      if (node.children) node.children.forEach(injectNode);
    };
    injectNode(newLayout);
    return { layoutSchema: newLayout };
  }),

  moveMacroSection: (sectionId, direction) => setStore((state) => {
    const newLayout = JSON.parse(JSON.stringify(state.layoutSchema));
    const reorder = (parent) => {
      if (!parent.children) return;
      const index = parent.children.findIndex(child => child.id === sectionId);
      if (index !== -1) {
        if (direction === 'up' && index > 0) {
          const temp = parent.children[index];
          parent.children[index] = parent.children[index - 1];
          parent.children[index - 1] = temp;
        } else if (direction === 'down' && index < parent.children.length - 1) {
          const temp = parent.children[index];
          parent.children[index] = parent.children[index + 1];
          parent.children[index + 1] = temp;
        }
        return;
      }
      parent.children.forEach(reorder);
    };
    reorder(newLayout);
    return { layoutSchema: newLayout };
  }),

  moveSectionToColumn: (sectionId, targetColumnId) => setStore((state) => {
    const newLayout = JSON.parse(JSON.stringify(state.layoutSchema));
    let extractedNode = null;

    const extractAndRemove = (parent) => {
      if (!parent.children) return;
      const index = parent.children.findIndex(c => c.id === sectionId);
      if (index !== -1) {
        extractedNode = parent.children.splice(index, 1)[0];
        return;
      }
      parent.children.forEach(extractAndRemove);
    };
    extractAndRemove(newLayout);

    if (extractedNode) {
      const injectNode = (node) => {
        if (node.id === targetColumnId) {
          if (!node.children) node.children = [];
          node.children.push(extractedNode);
          return;
        }
        if (node.children) node.children.forEach(injectNode);
      };
      injectNode(newLayout);
    }
    return { layoutSchema: newLayout };
  })
}));

export default useCvStore;