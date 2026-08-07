import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title } = Typography;

const CategoryCrudTemplate = ({ title, apiUrl, idKey, nameKey }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchText, setSearchText] = useState(''); 
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(apiUrl);
            const items = response.data !== undefined ? response.data : response;
            setData(items || []);
        } catch (error) {
            message.error(`Lỗi khi tải danh sách ${title.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [apiUrl]);

    const showModal = (record = null) => {
        setEditingItem(record);
        if (record) {
            form.setFieldsValue({ name: record[nameKey] });
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleSave = async (values) => {
        try {
            const payload = { [nameKey]: values.name };

            if (editingItem) {
                payload[idKey] = editingItem[idKey];
                await apiClient.put(`${apiUrl}/${editingItem[idKey]}`, payload);
                message.success('Cập nhật thành công!');
            } else {
                await apiClient.post(apiUrl, payload);
                message.success('Thêm mới thành công!');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu dữ liệu!');
        }
    };

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`${apiUrl}/${id}`);
            message.success('Xóa thành công!');
            fetchData();
        } catch (error) {
            message.error('Không thể xóa mục này (có thể do đang được sử dụng ở bảng khác)!');
        }
    };

    const filteredData = data.filter((item) => {
        if (!item[nameKey]) return false;
        return item[nameKey].toString().toLowerCase().includes(searchText.toLowerCase());
    });

    const columns = [
        {
            title: 'ID',
            dataIndex: idKey,
            key: 'id',
            width: 80,
            align: 'center',
        },
        {
            title: `Tên ${title}`,
            dataIndex: nameKey,
            key: 'name',
            fontWeight: 'bold'
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="primary" 
                        ghost
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record)} 
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa?"
                        onConfirm={() => handleDelete(record[idKey])}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* 👉 ĐỒNG BỘ HEADER (TIÊU ĐỀ + TÌM KIẾM + NÚT THÊM) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <Title level={3} style={{ margin: 0 }}><AppstoreOutlined /> Quản lý {title}</Title>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Input.Search
                        placeholder={`Tìm kiếm ${title.toLowerCase()}...`}
                        allowClear
                        size="large"
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => showModal()}>
                        Thêm mới
                    </Button>
                </div>
            </div>

            {/* 👉 ĐỒNG BỘ GIAO DIỆN CARD BỌC BẢNG */}
            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table 
                    columns={columns} 
                    dataSource={filteredData} 
                    rowKey={idKey} 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    bordered
                />
            </Card>

            <Modal
                title={editingItem ? `Sửa ${title}` : `Thêm mới ${title}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu lại"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="name"
                        label={`Tên ${title}`}
                        rules={[{ required: true, message: 'Vui lòng nhập thông tin này!' }]}
                    >
                        <Input placeholder={`Nhập tên ${title.toLowerCase()}...`} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryCrudTemplate;