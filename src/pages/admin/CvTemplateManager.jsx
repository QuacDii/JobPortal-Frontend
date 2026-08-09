import React, { useState, useEffect } from 'react';
import {
    Card, Table, Button, Modal, Form, Input, Switch, Tag, message,
    Popconfirm, Typography, Space, Image, Row, Col, Select, List, Upload
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined,
    EyeOutlined, EyeInvisibleOutlined, AppstoreOutlined,
    BgColorsOutlined, SettingOutlined, UploadOutlined, GlobalOutlined, TagsOutlined
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CvTemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [industries, setIndustries] = useState([]); // State danh sách Ngành nghề
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchText, setSearchText] = useState('');

    // State quản lý Ảnh
    const [fileList, setFileList] = useState([]);
    const [previewImage, setPreviewImage] = useState('');

    // State quản lý Danh mục
    const [isCatModalVisible, setIsCatModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCatId, setEditingCatId] = useState(null);

    const [form] = Form.useForm();

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [tempRes, catRes, nganhRes] = await Promise.all([
                apiClient.get('/MauCv?activeOnly=false'),
                apiClient.get('/DanhMucMau'),
                apiClient.get('/NganhNghe/danh-sach').catch(() => []) // Tải danh sách Ngành nghề
            ]);

            const tempPayload = tempRes.data !== undefined ? tempRes.data : tempRes;
            const catPayload = catRes.data !== undefined ? catRes.data : catRes;
            const nganhPayload = nganhRes.data !== undefined ? nganhRes.data : nganhRes;

            setTemplates(Array.isArray(tempPayload) ? tempPayload : []);
            setCategories(Array.isArray(catPayload) ? catPayload : []);
            setIndustries(Array.isArray(nganhPayload) ? nganhPayload : []);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu từ máy chủ!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // ================= XỬ LÝ QUẢN LÝ DANH MỤC =================
    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) return message.warning('Vui lòng nhập tên danh mục!');
        try {
            const payload = { tenDanhMuc: newCategoryName.trim() };

            if (editingCatId) {
                await apiClient.put(`/DanhMucMau/${editingCatId}`, payload);
                message.success('Cập nhật danh mục thành công!');
            } else {
                await apiClient.post('/DanhMucMau', payload);
                message.success('Thêm danh mục thành công!');
            }

            setNewCategoryName('');
            setEditingCatId(null);
            fetchInitialData();
        } catch (error) {
            message.error('Lỗi khi lưu danh mục!');
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await apiClient.delete(`/DanhMucMau/${id}`);
            message.success('Xóa danh mục thành công!');
            fetchInitialData();
        } catch (error) {
            message.error('Không thể xóa danh mục này!');
        }
    };

    // ================= XỬ LÝ MẪU CV =================
    const openModal = (record = null) => {
        setEditingItem(record);
        setFileList([]);

        if (record) {
            const cleanJson = (val) => (val && val !== 'null' ? (typeof val === 'object' ? JSON.stringify(val, null, 2) : val) : '{}');

            const img = record.anhThumbnail || record.anhMoPhong || record.image || '';
            const colorsArray = record.danhSachMau ? record.danhSachMau.split(',').filter(c => c.trim() !== '') : [];
            const tagsArray = record.tags ? record.tags.split(',').filter(t => t.trim() !== '') : [];

            form.setFieldsValue({
                tenMau: record.tenMau || record.title || '',
                moTa: record.moTa || record.description || '',
                ngonNgu: record.ngonNgu || 'VI',
                isATS: record.isATS || false,
                trangThai: record.trangThai ?? true,
                cauTrucJson: cleanJson(record.layoutJson || record.cauTrucJson),
                duLieuMau: cleanJson(record.duLieuMau),
                categoryIds: record.categoryIds || [],
                danhSachMau: colorsArray,
                tags: tagsArray // Tag Ngành nghề
            });
            setPreviewImage(img);
        } else {
            form.resetFields();
            form.setFieldsValue({
                trangThai: true,
                isATS: false,
                ngonNgu: 'VI',
                cauTrucJson: '{\n  "layout": "modern",\n  "themeColor": "#1890ff"\n}',
                duLieuMau: '{\n  "personalInfo": { "name": "Nguyễn Văn A" }\n}',
                categoryIds: [],
                danhSachMau: [],
                tags: []
            });
            setPreviewImage('');
        }
        setIsModalVisible(true);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await apiClient.put(`/MauCv/${id}/toggle-status`, { trangThai: !currentStatus });

            setTemplates(prev => prev.map(item => {
                const itemId = item.maMau || item.maMauCv || item.id;
                return itemId === id ? { ...item, trangThai: !currentStatus } : item;
            }));

            message.success(!currentStatus ? 'Đã hiển thị mẫu CV!' : 'Đã ẩn mẫu CV!');
        } catch (error) {
            message.error('Lỗi khi thay đổi trạng thái!');
        }
    };

    const handleSave = async (values) => {
        try {
            const formData = new FormData();

            formData.append('TenMau', values.tenMau);
            formData.append('MoTa', values.moTa || '');
            formData.append('NgonNgu', values.ngonNgu || 'VI');
            formData.append('IsATS', values.isATS ? 'true' : 'false');
            formData.append('TrangThai', values.trangThai ? 'true' : 'false');

            const cleanLayoutJson = (values.cauTrucJson && values.cauTrucJson !== 'null') ? values.cauTrucJson : '{}';
            const cleanDataJson = (values.duLieuMau && values.duLieuMau !== 'null') ? values.duLieuMau : '{}';

            formData.append('LayoutJson', cleanLayoutJson);
            formData.append('DuLieuMau', cleanDataJson);

            const colorsString = values.danhSachMau?.length > 0 ? values.danhSachMau.join(',') : '';
            formData.append('DanhSachMau', colorsString);

            // Gắn Tag Ngành nghề dưới dạng chuỗi "CNTT,Kinh doanh,Marketing"
            const tagsString = values.tags?.length > 0 ? values.tags.join(',') : '';
            formData.append('Tags', tagsString);

            if (values.categoryIds) {
                values.categoryIds.forEach(id => formData.append('CategoryIds', id));
            }

            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append('FileThumbnail', fileList[0].originFileObj);
            } else if (previewImage) {
                formData.append('AnhThumbnail', previewImage);
            }

            const id = editingItem ? (editingItem.maMau || editingItem.maMauCv || editingItem.id) : null;
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (id) {
                await apiClient.put(`/MauCv/${id}`, formData, config);
                message.success('Cập nhật mẫu CV thành công!');
            } else {
                await apiClient.post('/MauCv', formData, config);
                message.success('Thêm mới mẫu CV thành công!');
            }

            setIsModalVisible(false);
            fetchInitialData();
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu mẫu CV!');
            console.error("CHI TIẾT LỖI TỪ BACKEND:", error.response?.data);
        }
    };

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/MauCv/${id}`);
            message.success('Xóa mẫu CV thành công!');
            fetchInitialData();
        } catch (error) {
            message.error('Không thể xóa mẫu CV này!');
        }
    };

    const filteredTemplates = templates.filter(item => {
        const name = item.tenMau || item.title || '';
        return name.toLowerCase().includes(searchText.toLowerCase());
    });

    const handleCategoryChange = (selectedIds) => {
        const hasATS = selectedIds.some(id => {
            const category = categories.find(c => c.maDanhMuc === id);
            return category && category.tenDanhMuc.trim().toUpperCase() === 'ATS';
        });
        form.setFieldsValue({ isATS: hasATS });
    };

    const handleAtsSwitchChange = (checked) => {
        const atsCategory = categories.find(c => c.tenDanhMuc?.trim().toUpperCase() === 'ATS');
        if (!atsCategory) return;

        const currentCategoryIds = form.getFieldValue('categoryIds') || [];

        if (checked) {
            if (!currentCategoryIds.includes(atsCategory.maDanhMuc)) {
                form.setFieldsValue({ categoryIds: [...currentCategoryIds, atsCategory.maDanhMuc] });
            }
        } else {
            const updatedCategoryIds = currentCategoryIds.filter(id => id !== atsCategory.maDanhMuc);
            form.setFieldsValue({ categoryIds: updatedCategoryIds });
        }
    };

    const columns = [
        { title: 'ID', key: 'maMau', width: 60, align: 'center', render: (_, r) => r.maMau || r.maMauCv || r.id },
        {
            title: 'Mô phỏng',
            key: 'anhThumbnail',
            width: 90,
            align: 'center',
            render: (_, r) => <Image src={r.anhThumbnail || r.image} width={50} height={70} style={{ objectFit: 'cover', borderRadius: 4 }} />
        },
        {
            title: 'Tên & Phân loại',
            key: 'tenMau',
            render: (_, r) => {
                const tagList = r.tags ? r.tags.split(',').filter(t => t.trim() !== '') : [];
                return (
                    <div>
                        <Text strong style={{ fontSize: 15, display: 'block' }}>{r.tenMau || r.title}</Text>
                        <Space size={[0, 4]} wrap style={{ marginTop: 4 }}>
                            <Tag color="blue"><GlobalOutlined /> {r.ngonNgu === 'EN' ? 'Tiếng Anh' : 'Tiếng Việt'}</Tag>
                            {r.categories
                                ?.filter(c => c?.trim().toUpperCase() !== 'ATS')
                                .map((c, i) => (
                                    <Tag key={`cat-${i}`} color="purple">{c}</Tag>
                                ))
                            }
                            {/* Hiển thị Tag Ngành nghề */}
                            {tagList.map((tag, i) => (
                                <Tag key={`tag-${i}`} color="orange">{tag}</Tag>
                            ))}
                        </Space>
                    </div>
                );
            }
        },
        {
            title: 'Trạng thái',
            key: 'trangThai',
            width: 100,
            align: 'center',
            render: (_, r) => (
                <Switch
                    checked={r.trangThai}
                    onChange={() => handleToggleStatus(r.maMau || r.id, r.trangThai)}
                    checkedChildren={<EyeOutlined />} unCheckedChildren={<EyeInvisibleOutlined />}
                    style={{ backgroundColor: r.trangThai ? '#52c41a' : '#ff4d4f' }}
                />
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, r) => (
                <Space size="small">
                    <Button type="primary" ghost icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Popconfirm title="Xóa mẫu CV?" onConfirm={() => handleDelete(r.maMau || r.id)} okText="Xóa" cancelText="Hủy">
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <Title level={3} style={{ margin: 0 }}><FileTextOutlined /> Quản lý Mẫu Hồ Sơ (CV)</Title>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Input.Search placeholder="Tìm kiếm mẫu CV..." allowClear size="large" onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} />
                    <Button icon={<SettingOutlined />} size="large" onClick={() => setIsCatModalVisible(true)}>Quản lý Danh Mục</Button>
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => openModal()}>Thêm Mẫu Mới</Button>
                </div>
            </div>

            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table columns={columns} dataSource={filteredTemplates} rowKey={(r) => r.maMau || r.id || Math.random()} loading={loading} pagination={{ pageSize: 8 }} />
            </Card>

            {/* MODAL QUẢN LÝ DANH MỤC */}
            <Modal title="Quản lý Danh mục phân loại CV" open={isCatModalVisible} onCancel={() => setIsCatModalVisible(false)} footer={null}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <Input placeholder="Tên danh mục mới..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    <Button type="primary" onClick={handleSaveCategory}>{editingCatId ? 'Cập nhật' : 'Thêm'}</Button>
                </div>
                <List
                    bordered
                    dataSource={categories}
                    renderItem={item => (
                        <List.Item actions={[
                            <Button type="link" onClick={() => { setEditingCatId(item.maDanhMuc); setNewCategoryName(item.tenDanhMuc); }}>Sửa</Button>,
                            <Popconfirm title="Xóa?" onConfirm={() => handleDeleteCategory(item.maDanhMuc)}><Button type="link" danger>Xóa</Button></Popconfirm>
                        ]}>
                            <Text>{item.tenDanhMuc}</Text>
                        </List.Item>
                    )}
                />
            </Modal>

            {/* MODAL THÊM / SỬA MẪU CV */}
            <Modal
                title={editingItem ? `Chỉnh sửa Mẫu CV #${editingItem.maMau || editingItem.id}` : "Thêm Mẫu CV Mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu Mẫu CV"
                cancelText="Hủy"
                width={800}
                style={{ top: 20 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="tenMau"
                                label="Tên Mẫu CV"
                                rules={[{ required: true, message: 'Vui lòng nhập tên mẫu CV!' }]}
                            >
                                <Input placeholder="Nhập tên mẫu..." />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="ngonNgu" label="Ngôn ngữ">
                                <Select>
                                    <Option value="VI">Tiếng Việt</Option>
                                    <Option value="EN">Tiếng Anh</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item name="isATS" label="Chuẩn ATS" valuePropName="checked">
                                <Switch checkedChildren="Có" unCheckedChildren="Không" onChange={handleAtsSwitchChange} />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item name="trangThai" label="Hiển thị" valuePropName="checked">
                                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="categoryIds" label={<><AppstoreOutlined /> Danh mục CV</>}>
                                <Select mode="multiple" allowClear placeholder="Chọn danh mục..." onChange={handleCategoryChange}>
                                    {categories.map(c => <Option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>

                        {/* Ô CHỌN NGÀNH NGHỀ PHÙ HỢP (TAGS) */}
                        <Col span={8}>
                            <Form.Item name="tags" label={<><TagsOutlined /> Ngành nghề phù hợp</>}>
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Chọn ngành nghề..."
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {industries.map(n => {
                                        const name = n.tenNganh || n.tenNganhCon || n.tenNganhCha;
                                        return <Option key={name} value={name}>{name}</Option>;
                                    })}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="danhSachMau" label={<><BgColorsOutlined /> Màu hỗ trợ (HEX)</>}>
                                <Select mode="tags" placeholder="Gõ mã HEX & Enter" tokenSeparators={[',']} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Ảnh Mô Phỏng (Upload)">
                                <Upload
                                    listType="picture-card"
                                    maxCount={1}
                                    beforeUpload={() => false}
                                    onChange={({ fileList }) => setFileList(fileList)}
                                    fileList={fileList}
                                    accept="image/*"
                                >
                                    {fileList.length < 1 && (
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                                        </div>
                                    )}
                                </Upload>
                                {previewImage && fileList.length === 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary">Ảnh hiện tại:</Text><br />
                                        <Image src={previewImage} width={80} style={{ borderRadius: 4, marginTop: 4 }} />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="moTa" label="Mô tả ngắn">
                                <TextArea rows={4} placeholder="Nhập mô tả giới thiệu về mẫu CV này..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="cauTrucJson" label="Cấu Trúc Giao Diện (Layout JSON)" rules={[{ required: true }]}>
                                <TextArea rows={6} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="duLieuMau" label="Dữ Liệu Nội Dung Mẫu (Data JSON)">
                                <TextArea rows={6} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default CvTemplateManager;