import React, { useState, useRef } from 'react';
import useCvStore from '../../../store/useCvStore';
import get from 'lodash/get';
import axios from 'axios';
import { CameraOutlined, LoadingOutlined } from '@ant-design/icons';
import { message } from 'antd';

const ImageNode = ({ dataPath, styles, dataScope }) => {
  const updateCvDataPath = useCvStore((state) => state.updateCvDataPath);
  const cvData = useCvStore((state) => state.cvData);
  const [uploading, setUploading] = useState(false);
  const hiddenInputRef = useRef(null);

  // Mặc định nạp biến avatar của thông tin cá nhân nếu cấu hình JSON không chỉ định path
  let finalPath = dataPath || 'personalInfo.avatar';
  const imgUrl = get(dataScope || cvData, finalPath, '');

  const handleContainerClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file ảnh
    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn tệp tin hình ảnh hợp lệ (png, jpg)!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      // Gọi trực tiếp đến API Upload ảnh trên cổng cục bộ của bạn
      const res = await axios.post('http://localhost:5279/api/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data && res.data.url) {
        updateCvDataPath(finalPath, res.data.url);
        message.success('Cập nhật ảnh đại diện thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi tải ảnh lên server:', err);
      message.error('Không thể upload ảnh, vui lòng kiểm tra kết nối API Backend.');
    } finally {
      setUploading(false);
    }
  };

  const placeholderAvatar = '/person.png';

  return (
    <div
      className="cv-avatar-wrapper no-print-overlay"
      style={{ ...styles, position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
      onClick={handleContainerClick}
    >
      <img
        src={imgUrl || placeholderAvatar}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        alt="Avatar ứng viên"
      />

      {/* Lớp phủ Hover hiệu ứng chuyển động mượt mà */}
      <div className="avatar-hover-mask">
        {uploading ? (
          <LoadingOutlined style={{ fontSize: 22, color: '#fff' }} />
        ) : (
          <>
            <CameraOutlined style={{ fontSize: 18, color: '#fff', marginBottom: '4px' }} />
            <span style={{ color: '#fff', fontSize: '11px' }}>Thay ảnh</span>
          </>
        )}
      </div>

      {/* Input ẩn để kích hoạt trình chọn file hệ thống */}
      <input
        type="file"
        ref={hiddenInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Nhúng đoạn CSS cục bộ cho hiệu ứng Hover giống TopCV */}
      <style>{`
        .cv-avatar-wrapper .avatar-hover-mask {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          opacity: 0; transition: opacity 0.2s ease-in-out;
        }
        .cv-avatar-wrapper:hover .avatar-hover-mask {
          opacity: 1;
        }
        @media print {
          .avatar-hover-mask { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ImageNode;