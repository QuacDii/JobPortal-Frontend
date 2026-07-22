import get from 'lodash/get';

export const resolveContent = (text, dataScope) => {
  if (typeof text !== 'string') return text;
  
  return text.replace(/\{\{(.*?)\}\}/g, (match, path) => {
    const value = get(dataScope, path.trim());
    return value !== undefined && value !== null ? value : '';
  });
};  