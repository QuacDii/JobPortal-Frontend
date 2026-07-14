import { create } from 'zustand';
import set from 'lodash/set';
import get from 'lodash/get';
import DefaultLayoutJson from '../Components/CvEngine/LayoutTemplate1.json';

const useCvStore = create((setStore, getStore) => ({
  // Dữ liệu nội dung CV khởi tạo ban đầu
  cvData: {
    personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', address: '', dob: '', avatar: '', website: '' },
    experience: [],
    education: [],
    skills: [],
    certificates: [],
    awards: [],
    hobbies: '',
    summary: '',
    activities: [],
    projects: []
  },

  // Bản vẽ cấu trúc cây JSON Layout của CV
  layoutSchema: DefaultLayoutJson,

  // Các cấu hình phong cách, font chữ, kích thước toàn cục chuẩn TopCV
  layoutSettings: {
    fontFamily: '"Be Vietnam Pro", sans-serif',
    fontSize: 14,
    lineHeight: 1.5,
    themeColor: '#00b14f',
    backgroundStyle: 'none' // 👈 1. BỔ SUNG MẶC ĐỊNH ĐỂ KHÔNG BỊ LỖI HÌNH NỀN MATRIX
  },

  // 🚀 2. ĐẠI TU HÀM NÀY: Tiếp nhận trực tiếp dữ liệu chuẩn hóa đổ từ CvBuilder sang
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