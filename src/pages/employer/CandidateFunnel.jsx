import React, { useState, useEffect } from 'react';
import { Table, Tag, Select, Button, Modal, Input, message, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';

import apiClient from '../../api/apiClient';

const { Option } = Select;
const { TextArea } = Input;

const CandidateFunnel = () => {
    // 1. Lấy maViTri từ thanh địa chỉ URL
    const { maViTri } = useParams(); 
    
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentDon, setCurrentDon] = useState(null);
    const [noteText, setNoteText] = useState("");

    useEffect(() => {
        if (maViTri) {
            fetchCandidates();
        }
    }, [maViTri]);

const fetchCandidates = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get(`/employer/jobs/${maViTri}/candidates`);
            
            if (Array.isArray(data)) {
                setCandidates(data);
            } else if (data && Array.isArray(data)) {
                setCandidates(data);
            } else {
                setCandidates([]); // Nếu không tìm thấy mảng, set rỗng để tránh crash
                message.warning("Dữ liệu trả về không đúng định dạng danh sách");
            }

        } catch (error) {
            console.error("Lỗi:", error);
            message.error("Lỗi khi tải danh sách ứng viên");
            setCandidates([]); // Cực kỳ quan trọng: Phải set mảng rỗng để Table không crash
        }
        setLoading(false);
    };

    const handleStatusChange = async (maDon, newStatus) => {
        try {
            await apiClient.put(`/employer/applications/${maDon}/status`, {
                status: newStatus,
                ghiChu: null // Giữ nguyên ghi chú cũ
            });
            message.success("Cập nhật trạng thái thành công");
            fetchCandidates(); // Tải lại bảng để cập nhật màu sắc
        } catch (error) {
            message.error("Lỗi khi cập nhật trạng thái");
        }
    };

    const handleSaveNote = async () => {
        try {
            await apiClient.put(`/employer/applications/${currentDon.maDon}/status`, {
                status: currentDon.trangThai, // Giữ nguyên trạng thái cũ
                ghiChu: noteText
            });
            message.success("Lưu ghi chú thành công");
            setIsModalVisible(false);
            fetchCandidates();
        } catch (error) {
            message.error("Lỗi khi lưu ghi chú");
        }
    };

    const openNoteModal = (record) => {
        setCurrentDon(record);
        setNoteText(record.ghiChu || "");
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Ứng viên',
            key: 'ungVien',
            render: (text, record) => (
                <div>
                    <strong>{record.hoTen}</strong>
                    <div style={{ fontSize: '12px', color: 'gray' }}>{record.email}</div>
                </div>
            )
        },
        {
            title: 'Ngày nộp',
            dataIndex: 'ngayNop',
            key: 'ngayNop',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hồ sơ CV',
            key: 'cv',
            render: (text, record) => (
                <Button 
                    type="link" 
                    icon={<EyeOutlined />} 
                    href={record.cvUrl} 
                    target="_blank"
                    onClick={() => {
                        // Tự động đổi trạng thái "Mới nộp" -> "Đã xem"
                        if (record.trangThai === 0) handleStatusChange(record.maDon, 1);
                    }}
                >
                    Xem CV
                </Button>
            )
        },
        {
            title: 'Trạng thái',
            key: 'trangThai',
            render: (text, record) => (
                <Select 
                    value={record.trangThai} 
                    style={{ width: 140 }} 
                    onChange={(val) => handleStatusChange(record.maDon, val)}
                >
                    <Option value={0}>Mới nộp</Option>
                    <Option value={1}>Đã xem</Option>
                    <Option value={2}>Hẹn phỏng vấn</Option>
                    <Option value={3}>Từ chối</Option>
                </Select>
            )
        },
        {
            title: 'Ghi chú',
            key: 'ghiChu',
            render: (text, record) => (
                <Tooltip title={record.ghiChu || "Chưa có ghi chú"}>
                    <Button 
                        type="dashed" 
                        icon={<EditOutlined />} 
                        onClick={() => openNoteModal(record)}
                    >
                        {record.ghiChu ? "Sửa ghi chú" : "Thêm ghi chú"}
                    </Button>
                </Tooltip>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
            <Table 
                columns={columns} 
                dataSource={candidates} 
                rowKey="maDon" 
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={`Ghi chú cho ứng viên: ${currentDon?.hoTen}`}
                visible={isModalVisible}
                onOk={handleSaveNote}
                onCancel={() => setIsModalVisible(false)}
                okText="Lưu ghi chú"
                cancelText="Hủy"
            >
                <TextArea 
                    rows={4} 
                    value={noteText} 
                    onChange={(e) => setNoteText(e.target.value)} 
                    placeholder="Nhập nhận xét nội bộ về ứng viên này..."
                />
            </Modal>
        </div>
    );
};

export default CandidateFunnel;