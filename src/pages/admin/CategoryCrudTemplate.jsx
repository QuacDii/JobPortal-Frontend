import React, { useState, useEffect } from 'react';
import { 
    Table, Button, Modal, Form, Input, Space, Popconfirm, 
    message, Card, Typography, Tag, Switch, Select, Radio, Tooltip 
} from 'antd';
import { 
    PlusOutlined, EditOutlined, DeleteOutlined, 
    AppstoreOutlined, MergeOutlined, CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { Option } = Select;

const KyNangAdmin = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);

    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [targetSkillId, setTargetSkillId] = useState(null);

    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/KyNang';
            if (statusFilter !== null) {
                url += `?status=${statusFilter}`;
            }
            const response = await apiClient.get(url);
            const items = response.data !== undefined ? response.data : response;
            setData(items || []);
        } catch (error) {
            message.error('Lỗi khi tải danh sách kỹ năng!');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (record) => {
        try {
            const res = await apiClient.patch(`/KyNang/${record.maKyNang}/toggle-status`);
            if (res?.data?.success || res?.success) {
                message.success('Cập nhật trạng thái thành công!');
                fetchData();
            }
        } catch (error) {
            message.error('Lỗi khi thay đổi trạng thái!');
        }
    };

    const showModal = (record = null) => {
        setEditingItem(record);
        if (record) {
            form.setFieldsValue({ tenKyNang: record.tenKyNang, trangThai: record.trangThai ?? true });
        } else {
            form.resetFields();
            form.setFieldsValue({ trangThai: true });
        }
        setIsModalVisible(true);
    };

    const handleSave = async (values) => {
        try {
            if (editingItem) {
                await apiClient.put(`/KyNang/${editingItem.maKyNang}`, values);
                message.success('Cập nhật thành công!');
            } else {
                await apiClient.post('/KyNang', values);
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
            await apiClient.delete(`/KyNang/${id}`);
            message.success('Xóa thành công!');
            fetchData();
        } catch (error) {
            message.error('Không thể xóa mục này!');
        }
    };

    const handleBulkApprove = async () => {
        try {
            const res = await apiClient.post('/KyNang/bulk-approve', selectedRowKeys);
            const payload = res?.data || res;
            if (payload?.success || res?.success) {
                message.success(payload?.message || 'Đã duyệt các kỹ năng được chọn!');
                setSelectedRowKeys([]);
                setSelectedRows([]);
                fetchData();
            }
        } catch (error) {
            message.error(error?.response?.data?.message || 'Duyệt hàng loạt thất bại!');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await apiClient.post('/KyNang/bulk-delete', selectedRowKeys);
            const payload = res?.data || res;
            if (payload?.success || res?.success) {
                message.success(payload?.message || 'Đã dọn dẹp kỹ năng rác thành công!');
                setSelectedRowKeys([]);
                setSelectedRows([]);
                fetchData();
            }
        } catch (error) {
            message.error(error?.response?.data?.message || 'Xóa hàng loạt thất bại!');
        }
    };

    const handleConfirmMerge = async () => {
        if (!targetSkillId) {
            return message.warning('Vui lòng chọn kỹ năng chuẩn làm gốc!');
        }
        try {
            const res = await apiClient.post('/KyNang/merge', {
                targetId: targetSkillId,
                sourceIds: selectedRowKeys
            });
            const payload = res?.data || res;
            if (payload?.success || res?.success) {
                message.success(payload?.message || 'Gộp kỹ năng thành công!');
                setIsMergeModalOpen(false);
                setSelectedRowKeys([]);
                setSelectedRows([]);
                setTargetSkillId(null);
                fetchData();
            }
        } catch (error) {
            message.error(error?.response?.data?.message || 'Gộp kỹ năng thất bại!');
        }
    };

    const filteredData = data.filter(item => {
        if (!item.tenKyNang) return false;
        return item.tenKyNang.toLowerCase().includes(searchText.toLowerCase());
    });

    const columns = [
        {
            title: 'ID',
            dataIndex: 'maKyNang',
            key: 'maKyNang',
            width: 80,
            align: 'center',
        },
        {
            title: 'Tên Kỹ năng',
            dataIndex: 'tenKyNang',
            key: 'tenKyNang',
            width: 200,
            render: (text) => <Text strong style={{ fontSize: '15px' }}>{text}</Text>
        },
        {
            title: 'Thuộc Ngành nghề',
            dataIndex: 'danhSachNganh',
            key: 'danhSachNganh',
            render: (nganhList) => {
                if (!nganhList || nganhList.length === 0) {
                    return <Text type="secondary" italic style={{ fontSize: '12px' }}>Chưa có bài đăng</Text>;
                }

                const maxVisible = 2;
                const isOverflow = nganhList.length > maxVisible;
                const visibleList = isOverflow ? nganhList.slice(0, maxVisible) : nganhList;
                const remainingList = isOverflow ? nganhList.slice(maxVisible) : [];

                const tooltipContent = (
                    <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
                        <Text strong style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: 4 }}>
                            Các ngành nghề khác:
                        </Text>
                        {remainingList.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '11px', padding: '2px 0' }}>• {item}</div>
                        ))}
                    </div>
                );

                return (
                    <Space wrap size={[0, 4]}>
                        {visibleList.map((item, idx) => (
                            <Tag key={idx} color="blue" style={{ fontSize: '11px', borderRadius: '4px' }}>
                                {item}
                            </Tag>
                        ))}
                        {isOverflow && (
                            <Tooltip title={tooltipContent} placement="top">
                                <Tag color="purple" style={{ fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}>
                                    +{remainingList.length} ngành khác
                                </Tag>
                            </Tooltip>
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'Trạng thái gợi ý',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 170,
            align: 'center',
            render: (status, record) => (
                <Space>
                    {status ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>Đã duyệt</Tag>
                    ) : (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>
                    )}
                    <Tooltip title={status ? "Tắt gợi ý kỹ năng này" : "Duyệt kỹ năng để gợi ý"}>
                        <Switch 
                            checked={status} 
                            onChange={() => handleToggleStatus(record)} 
                            size="small" 
                        />
                    </Tooltip>
                </Space>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 130,
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
                        onConfirm={() => handleDelete(record.maKyNang)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <Title level={3} style={{ margin: 0 }}><AppstoreOutlined /> Quản lý Kỹ năng</Title>
                
                <Space wrap>
                    <Input.Search
                        placeholder="Tìm kiếm kỹ năng..."
                        allowClear
                        size="large"
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 220 }}
                    />
                    
                    <Select 
                        value={statusFilter} 
                        onChange={setStatusFilter} 
                        size="large" 
                        style={{ width: 160 }}
                    >
                        <Option value={null}>Tất cả trạng thái</Option>
                        <Option value={true}>🟢 Đã duyệt</Option>
                        <Option value={false}>🟠 Chờ duyệt</Option>
                    </Select>

                    {selectedRowKeys.length > 0 && (
                        <Button 
                            type="primary" 
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} 
                            icon={<CheckCircleOutlined />} 
                            size="large"
                            onClick={handleBulkApprove}
                        >
                            Duyệt chọn ({selectedRowKeys.length})
                        </Button>
                    )}

                    {selectedRowKeys.length > 0 && (
                        <Popconfirm
                            title={`Xóa ${selectedRowKeys.length} kỹ năng đã chọn?`}
                            description="Thao tác này sẽ dọn dẹp các kỹ năng rác khỏi hệ thống."
                            onConfirm={handleBulkDelete}
                            okText="Xóa luôn"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button 
                                danger 
                                type="primary" 
                                icon={<DeleteOutlined />} 
                                size="large"
                            >
                                Xóa chọn ({selectedRowKeys.length})
                            </Button>
                        </Popconfirm>
                    )}

                    {selectedRowKeys.length >= 2 && (
                        <Button 
                            type="primary" 
                            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }} 
                            icon={<MergeOutlined />} 
                            size="large"
                            onClick={() => {
                                setTargetSkillId(selectedRowKeys[0]);
                                setIsMergeModalOpen(true);
                            }}
                        >
                            Gộp ({selectedRowKeys.length}) kỹ năng
                        </Button>
                    )}

                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => showModal()}>
                        Thêm mới
                    </Button>
                </Space>
            </div>

            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table 
                    rowSelection={rowSelection}
                    columns={columns} 
                    dataSource={filteredData} 
                    rowKey="maKyNang" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    bordered
                />
            </Card>

            <Modal
                title={editingItem ? "Sửa kỹ năng" : "Thêm kỹ năng mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu lại"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="tenKyNang"
                        label="Tên kỹ năng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên kỹ năng!' }]}
                    >
                        <Input placeholder="VD: ReactJS, ASP.NET Core..." />
                    </Form.Item>
                    <Form.Item name="trangThai" label="Trạng thái duyệt" valuePropName="checked">
                        <Switch checkedChildren="Đã duyệt (Gợi ý)" unCheckedChildren="Chờ duyệt" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<span><MergeOutlined style={{ color: '#722ed1' }} /> Gộp các kỹ năng bị trùng</span>}
                open={isMergeModalOpen}
                onCancel={() => setIsMergeModalOpen(false)}
                onOk={handleConfirmMerge}
                okText="Xác nhận Gộp"
                cancelText="Hủy"
            >
                <p>Chọn 1 kỹ năng chuẩn duy nhất làm tên hiển thị chính. Tất cả bài đăng dùng các kỹ năng còn lại sẽ được chuyển về kỹ năng này:</p>
                <Radio.Group 
                    value={targetSkillId} 
                    onChange={(e) => setTargetSkillId(e.target.value)} 
                    style={{ width: '100%' }}
                >
                    <Space direction="vertical" style={{ width: '100%', marginTop: 10 }}>
                        {selectedRows.map(item => (
                            <Radio key={item.maKyNang} value={item.maKyNang}>
                                <Text strong>{item.tenKyNang}</Text> <Text type="secondary">(ID: #{item.maKyNang})</Text>
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>
            </Modal>
        </div>
    );
};

export default KyNangAdmin;