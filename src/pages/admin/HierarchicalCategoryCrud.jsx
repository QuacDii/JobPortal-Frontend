import React, { useState, useEffect } from 'react';
import { 
    Table, Button, Modal, Form, Input, Space, Popconfirm, message, 
    Card, Typography, Select, Tag, Radio 
} from 'antd';
import { 
    PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, FilterOutlined 
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';
import '../css/CategoryCrudTemplate.css';

const { Title } = Typography;
const { Option } = Select;

const HierarchicalCategoryCrud = ({ title = 'Ngành nghề', apiUrl = '/NganhNghe' }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // STATES BỘ LỌC
    const [searchText, setSearchText] = useState(''); 
    const [filterLevel, setFilterLevel] = useState('all'); // 'all', 'cha', 'con'
    const [selectedParentFilter, setSelectedParentFilter] = useState(null); // null hoặc maNganhCha

    // STATES MODAL
    const [categoryType, setCategoryType] = useState('cha');
    const [parentOptions, setParentOptions] = useState([]);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(apiUrl);
            const items = response?.data !== undefined ? response.data : response;
            const list = Array.isArray(items) ? items : [];
            setData(list);

            const parents = list.map(item => ({
                label: item.tenNganhCha,
                value: item.maNganhCha
            }));
            setParentOptions(parents);
        } catch (error) {
            message.error(`Lỗi khi tải danh sách ${title.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [apiUrl]);

    const showModal = (record = null, isCon = false) => {
        setEditingItem(record ? { ...record, isCon } : null);
        if (record) {
            if (isCon) {
                setCategoryType('con');
                form.setFieldsValue({ tenNganh: record.tenNganhCon, maNganhCha: record.maNganhCha });
            } else {
                setCategoryType('cha');
                form.setFieldsValue({ tenNganh: record.tenNganhCha, maNganhCha: null });
            }
        } else {
            setCategoryType('cha');
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleSave = async (values) => {
        try {
            const payload = {
                tenNganh: values.tenNganh,
                maNganhCha: categoryType === 'con' ? values.maNganhCha : null
            };

            if (editingItem) {
                if (editingItem.isCon) {
                    await apiClient.put(`${apiUrl}/con/${editingItem.maNganhCon}`, payload);
                } else {
                    await apiClient.put(`${apiUrl}/cha/${editingItem.maNganhCha}`, payload);
                }
                message.success('Cập nhật thành công!');
            } else {
                await apiClient.post(apiUrl, payload);
                message.success('Thêm mới thành công!');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu!');
        }
    };

    const handleDelete = async (id, isCon = false) => {
        try {
            const endpoint = isCon ? `${apiUrl}/con/${id}` : `${apiUrl}/cha/${id}`;
            await apiClient.delete(endpoint);
            message.success('Xóa thành công!');
            fetchData();
        } catch (error) {
            message.error('Không thể xóa mục này (do đang được sử dụng ở bài tuyển dụng/CV)!');
        }
    };

    // 🌟 LOGIC BÓC TÁCH & LỌC DỮ LIỆU CẤP CHA / CẤP CON
    const getFilteredData = () => {
        const kw = searchText.toLowerCase().trim();

        // 1. Chỉ lọc NGÀNH CHA
        if (filterLevel === 'cha') {
            return data
                .filter(cha => !selectedParentFilter || cha.maNganhCha === selectedParentFilter)
                .filter(cha => !kw || cha.tenNganhCha.toLowerCase().includes(kw))
                .map(cha => ({
                    key: `cha-${cha.maNganhCha}`,
                    id: cha.maNganhCha,
                    tenNganh: cha.tenNganhCha,
                    isCon: false,
                    rawRecord: cha,
                    soNganhCon: cha.nganhNgheCons?.length || 0
                }));
        }

        // 2. Chỉ lọc NGÀNH CON (Làm phẳng danh sách để xem dễ dàng)
        if (filterLevel === 'con') {
            const flatCons = [];
            data.forEach(cha => {
                if (!selectedParentFilter || cha.maNganhCha === selectedParentFilter) {
                    (cha.nganhNgheCons || []).forEach(con => {
                        if (!kw || con.tenNganhCon.toLowerCase().includes(kw) || cha.tenNganhCha.toLowerCase().includes(kw)) {
                            flatCons.push({
                                key: `con-${con.maNganhCon}`,
                                id: con.maNganhCon,
                                tenNganh: con.tenNganhCon,
                                tenNganhCha: cha.tenNganhCha,
                                maNganhCha: cha.maNganhCha,
                                isCon: true,
                                rawRecord: { ...con, maNganhCha: cha.maNganhCha }
                            });
                        }
                    });
                }
            });
            return flatCons;
        }

        // 3. Tất cả (Dạng cây Cấp 1 -> Cấp 2)
        return data
            .filter(cha => !selectedParentFilter || cha.maNganhCha === selectedParentFilter)
            .map(cha => {
                const filteredCons = (cha.nganhNgheCons || []).filter(con => 
                    !kw || con.tenNganhCon.toLowerCase().includes(kw) || cha.tenNganhCha.toLowerCase().includes(kw)
                );

                const matchCha = !kw || cha.tenNganhCha.toLowerCase().includes(kw);

                if (!matchCha && filteredCons.length === 0) return null;

                return {
                    key: `cha-${cha.maNganhCha}`,
                    id: cha.maNganhCha,
                    tenNganh: cha.tenNganhCha,
                    isCon: false,
                    rawRecord: cha,
                    soNganhCon: cha.nganhNgheCons?.length || 0,
                    children: filteredCons.map(con => ({
                        key: `con-${con.maNganhCon}`,
                        id: con.maNganhCon,
                        tenNganh: con.tenNganhCon,
                        tenNganhCha: cha.tenNganhCha,
                        maNganhCha: cha.maNganhCha,
                        isCon: true,
                        rawRecord: { ...con, maNganhCha: cha.maNganhCha }
                    }))
                };
            })
            .filter(Boolean);
    };

    const columns = [
        {
            title: 'Mã ID',
            dataIndex: 'id',
            key: 'id',
            width: 120,
            align: 'center',
            render: (text, record) => (
                <Tag color={record.isCon ? 'green' : 'blue'} style={{ fontWeight: 600 }}>
                    {record.isCon ? `Con #${text}` : `Cha #${text}`}
                </Tag>
            )
        },
        {
            title: `Tên ${title}`,
            dataIndex: 'tenNganh',
            key: 'tenNganh',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                        fontWeight: record.isCon ? '500' : '700', 
                        color: record.isCon ? '#334155' : '#1677ff',
                        fontSize: record.isCon ? '13.5px' : '15px'
                    }}>
                        {text}
                    </span>
                    {!record.isCon && record.soNganhCon > 0 && (
                        <Tag color="cyan" style={{ fontSize: '11px', borderRadius: '10px' }}>
                            {record.soNganhCon} ngành con
                        </Tag>
                    )}
                    {record.isCon && filterLevel === 'con' && (
                        <Tag color="geekblue" style={{ fontSize: '11px' }}>
                            Thuộc: {record.tenNganhCha}
                        </Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="primary" 
                        ghost 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record.rawRecord, record.isCon)} 
                    />
                    <Popconfirm 
                        title={`Bạn chắc chắn muốn xóa ${record.isCon ? 'ngành con' : 'ngành cha'} này?`} 
                        onConfirm={() => handleDelete(record.id, record.isCon)} 
                        okText="Xóa" 
                        cancelText="Hủy"
                    >
                        <Button danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="crud-template-container">
            {/* HEADER TIÊU ĐỀ */}
            <div className="crud-header-bar">
                <Title level={3} style={{ margin: 0 }}>
                    <AppstoreOutlined style={{ color: '#1677ff' }} /> Quản lý {title}
                </Title>

                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => showModal()}>
                    Thêm mới
                </Button>
            </div>

            {/* 🌟 THANH BỘ LỌC TÌM KIẾM & CẤP CHA/CON */}
            <Card bordered={false} className="crud-filter-card" style={{ marginBottom: 16 }}>
                <Space wrap size="middle">
                    <Input.Search 
                        placeholder={`Tìm kiếm ${title.toLowerCase()}...`} 
                        allowClear 
                        onChange={(e) => setSearchText(e.target.value)} 
                        style={{ width: 260 }} 
                    />

                    <Select 
                        value={filterLevel} 
                        onChange={setFilterLevel} 
                        style={{ width: 160 }}
                    >
                        <Option value="all">Tất cả cấp ngành</Option>
                        <Option value="cha">Chỉ Ngành Cha</Option>
                        <Option value="con">Chỉ Ngành Con</Option>
                    </Select>

                    <Select 
                        placeholder="Lọc theo Ngành cha..." 
                        allowClear 
                        value={selectedParentFilter} 
                        onChange={setSelectedParentFilter} 
                        style={{ width: 220 }}
                        options={parentOptions}
                        showSearch
                        optionFilterProp="label"
                    />
                </Space>
            </Card>

            {/* BẢNG DỮ LIỆU */}
            <Card bordered={false} className="crud-card-wrapper">
                <Table 
                    columns={columns} 
                    dataSource={getFilteredData()} 
                    loading={loading} 
                    pagination={{ pageSize: 10 }} 
                    bordered 
                    rowClassName="hoverable-row" 
                />
            </Card>

            {/* MODAL TẠO / SỬA */}
            <Modal 
                title={editingItem ? `Sửa ${title}` : `Thêm mới ${title}`} 
                open={isModalVisible} 
                onCancel={() => setIsModalVisible(false)} 
                onOk={() => form.submit()} 
                okText="Lưu lại" 
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    {!editingItem && (
                        <Form.Item label="Loại danh mục">
                            <Radio.Group value={categoryType} onChange={(e) => setCategoryType(e.target.value)}>
                                <Radio value="cha">Ngành cha (Cấp 1)</Radio>
                                <Radio value="con">Ngành con (Cấp 2)</Radio>
                            </Radio.Group>
                        </Form.Item>
                    )}

                    {categoryType === 'con' && (
                        <Form.Item name="maNganhCha" label="Thuộc Ngành Cha" rules={[{ required: true, message: 'Vui lòng chọn ngành cha!' }]}>
                            <Select placeholder="Chọn ngành cha..." options={parentOptions} showSearch optionFilterProp="label" />
                        </Form.Item>
                    )}

                    <Form.Item name="tenNganh" label={`Tên ${title}`} rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder={`Nhập tên ${title.toLowerCase()}...`} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default HierarchicalCategoryCrud;