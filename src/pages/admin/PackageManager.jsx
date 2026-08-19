import React, { useState, useEffect } from 'react';
import {
    Card, Table, Button, Modal, Form, Input, InputNumber, Select, message,
    Popconfirm, Typography, Row, Col, Radio, Switch, Tag, Space
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, ShoppingOutlined, UndoOutlined,
    EditOutlined, CrownOutlined
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title } = Typography;
const { Option } = Select;

// 🌟 DANH MỤC ĐẶC QUYỀN CHUẨN ĐỒNG BỘ VỚI HỆ THỐNG VÀ CSDL
const DEFAULT_PRIVILEGES = [
    // 1: Nhà tuyển dụng (NTD)
    { maDacQuyen: 1, maCode: 'NTD_VIP_JOB', tenDacQuyen: 'Tự động đẩy tin / Nổi bật', doiTuongSuDung: 1 },
    { maDacQuyen: 2, maCode: 'NTD_UNLOCK_CV', tenDacQuyen: 'Mở khóa xem Email CV ứng viên', doiTuongSuDung: 1 },
    { maDacQuyen: 3, maCode: 'NTD_AI_MATCHING', tenDacQuyen: 'Sử dụng AI Phân tích & Gợi ý ứng viên', doiTuongSuDung: 1 },

    // 2: Ứng viên (UV)
    { maDacQuyen: 4, maCode: 'UV_PREMIUM_CV', tenDacQuyen: 'Mở khóa mẫu CV Cao cấp / VIP', doiTuongSuDung: 2 },
    { maDacQuyen: 6, maCode: 'UV_UNLIMITED_CV', tenDacQuyen: 'Tạo & Quản lý CV không giới hạn', doiTuongSuDung: 2 },
    { maDacQuyen: 13, maCode: 'UV_REMOVE_WATERMARK', tenDacQuyen: 'Tải CV dạng PDF không dính Watermark', doiTuongSuDung: 2 },
    { maDacQuyen: 14, maCode: 'UV_AI_WRITE', tenDacQuyen: 'Trợ lý AI Gemini viết mục tiêu / nội dung CV', doiTuongSuDung: 2 }
];

// Danh sách các đặc quyền có thể cấu hình số lượt hoặc vô hạn
const COUNTABLE_CODES = ['NTD_UNLOCK_CV', 'UV_AI_WRITE'];

const PackageManager = () => {
    const [packages, setPackages] = useState([]);
    const [allPrivileges, setAllPrivileges] = useState(DEFAULT_PRIVILEGES);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [form] = Form.useForm();

    const [searchText, setSearchText] = useState('');
    const [isCandidate, setIsCandidate] = useState(false);
    const [hasDiscount, setHasDiscount] = useState(false);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [pkgRes, dacQuyenRes] = await Promise.all([
                apiClient.get('/Service/admin/packages').catch(() => apiClient.get('/Service')),
                apiClient.get('/Service/privileges').catch(() => null)
            ]);

            const pkgData = pkgRes?.data !== undefined ? pkgRes.data : pkgRes;
            setPackages(Array.isArray(pkgData) ? pkgData : []);

            if (dacQuyenRes) {
                const dqData = dacQuyenRes?.data !== undefined ? dacQuyenRes.data : dacQuyenRes;
                if (Array.isArray(dqData) && dqData.length > 0) {
                    setAllPrivileges(dqData);
                }
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách gói dịch vụ!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const openAddModal = () => {
        setEditingPackage(null);
        form.resetFields();
        form.setFieldsValue({
            doiTuong: 'employer',
            loaiGoi: 2,
            hasDiscount: false,
            donViThoiGian: 1,
            dacQuyenIds: [],
            dacQuyenQuantities: {},
            dacQuyenTypes: {}
        });
        setIsCandidate(false);
        setHasDiscount(false);
        setIsModalVisible(true);
    };

    const openEditModal = (record) => {
        setEditingPackage(record);

        const target = record.doiTuongSuDung ?? record.DoiTuongSuDung;
        const isCand = target === 2;
        const discountExist = record.giaKhuyenMai && record.giaKhuyenMai > 0;

        const rawDacQuyens = record.dacQuyens || record.DacQuyens || [];
        const selectedDacQuyens = rawDacQuyens.map(dq => dq.maDacQuyen || dq.MaDacQuyen);

        const initialQuantities = {};
        const initialTypes = {};

        rawDacQuyens.forEach(dq => {
            const dqId = dq.maDacQuyen || dq.MaDacQuyen;
            const qty = dq.soLuong !== undefined ? dq.soLuong : dq.SoLuong;

            if (qty === -1 || qty === null || qty === undefined) {
                initialTypes[dqId] = 'unlimited';
                initialQuantities[dqId] = 10;
            } else {
                initialTypes[dqId] = 'limited';
                initialQuantities[dqId] = qty;
            }
        });

        setIsCandidate(isCand);
        setHasDiscount(discountExist);

        form.setFieldsValue({
            tenGoi: record.tenGoi || record.TenGoi,
            doiTuong: isCand ? 'candidate' : 'employer',
            loaiGoi: record.loaiGoi || record.LoaiGoi || 2,
            giaTien: record.giaTien || record.GiaTien,
            hasDiscount: discountExist,
            giaKhuyenMai: discountExist ? (record.giaKhuyenMai || record.GiaKhuyenMai) : null,
            donViThoiGian: record.donViThoiGian || record.DonViThoiGian || 1,
            dacQuyenIds: selectedDacQuyens,
            dacQuyenQuantities: initialQuantities,
            dacQuyenTypes: initialTypes
        });

        setIsModalVisible(true);
    };

    const handleValuesChange = (changedValues) => {
        if (changedValues.doiTuong) {
            const isCand = changedValues.doiTuong === 'candidate';
            setIsCandidate(isCand);
            form.setFieldsValue({
                dacQuyenIds: [],
                dacQuyenQuantities: {},
                dacQuyenTypes: {}
            });
        }

        if (changedValues.hasDiscount !== undefined) {
            setHasDiscount(changedValues.hasDiscount);
            if (!changedValues.hasDiscount) {
                form.setFieldsValue({ giaKhuyenMai: null });
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await apiClient.delete(`/Service/${id}`);
            const resData = res?.data !== undefined ? res.data : res;
            message.success(resData?.message || 'Đã ngưng bán thành công!');
            fetchInitialData();
        } catch (error) {
            message.error('Không thể thao tác lúc này!');
        }
    };

    const handleRestore = async (id) => {
        try {
            const res = await apiClient.put(`/Service/${id}/restore`);
            const resData = res?.data !== undefined ? res.data : res;
            message.success(resData?.message || 'Đã mở bán lại thành công!');
            fetchInitialData();
        } catch (error) {
            message.error('Không thể mở bán lại lúc này!');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const types = values.dacQuyenTypes || {};
            const quantities = values.dacQuyenQuantities || {};

            const dacQuyenConfig = (values.dacQuyenIds || []).map(id => {
                const dq = filteredPrivileges.find(p => (p.maDacQuyen || p.MaDacQuyen) === id);
                const code = dq?.maCode || dq?.MaCode || '';

                // 1. Đặc quyền thuần tính năng theo thời hạn gói -> soLuong = null
                if (!COUNTABLE_CODES.includes(code)) {
                    return {
                        maDacQuyen: id,
                        soLuong: null
                    };
                }

                // 2. Đặc quyền mở khóa CV của NTD -> Bắt buộc nhập số lượt cụ thể
                if (code === 'NTD_UNLOCK_CV') {
                    return {
                        maDacQuyen: id,
                        soLuong: quantities[id] && quantities[id] > 0 ? quantities[id] : 50
                    };
                }

                // 3. Các đặc quyền AI (NTD_AI_MATCHING, UV_AI_WRITE)
                const isUnlimited = types[id] === 'unlimited' || types[id] === undefined;
                return {
                    maDacQuyen: id,
                    soLuong: isUnlimited ? -1 : (quantities[id] && quantities[id] > 0 ? quantities[id] : 10)
                };
            });

            const payload = {
                tenGoi: values.tenGoi,
                loaiGoi: values.loaiGoi,
                giaTien: values.giaTien,
                giaKhuyenMai: values.hasDiscount ? values.giaKhuyenMai : null,
                donViThoiGian: values.donViThoiGian,
                doiTuongSuDung: values.doiTuong === 'candidate' ? 2 : 1,
                trangThai: true,
                dacQuyenIds: values.dacQuyenIds || [],
                dacQuyens: dacQuyenConfig
            };

            if (editingPackage) {
                const id = editingPackage.maGoi || editingPackage.MaGoi;
                await apiClient.put(`/Service/${id}`, payload);
                message.success('Cập nhật gói dịch vụ thành công!');
            } else {
                await apiClient.post('/Service', payload);
                message.success('Thêm gói dịch vụ mới thành công!');
            }

            setIsModalVisible(false);
            fetchInitialData();
        } catch (error) {
            const serverMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
            message.error(serverMessage);
        }
    };

    const filteredPackages = packages.filter((pkg) => {
        const name = pkg.tenGoi || pkg.TenGoi || '';
        const id = pkg.maGoi || pkg.MaGoi || '';
        return name.toLowerCase().includes(searchText.toLowerCase()) || id.toString().includes(searchText);
    });

    const currentTargetType = isCandidate ? 2 : 1;
    const filteredPrivileges = allPrivileges.filter(dq => {
        const target = dq.doiTuongSuDung ?? dq.DoiTuongSuDung;
        return target === currentTargetType;
    });

    const columns = [
        { title: 'ID', dataIndex: 'maGoi', key: 'maGoi', width: 60, align: 'center', render: (val, r) => val || r.MaGoi },
        {
            title: 'Tên Gói',
            dataIndex: 'tenGoi',
            key: 'tenGoi',
            render: (text, r) => {
                const rawList = r.dacQuyens || r.DacQuyens || [];
                return (
                    <div>
                        <b style={{ fontSize: 14 }}>{text || r.TenGoi}</b>
                        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {rawList.map((dq, idx) => (
                                <Tag key={idx} color="cyan" style={{ fontSize: 11, margin: 0 }}>
                                    ✓ {dq.tenDacQuyen || dq.TenDacQuyen}
                                    {dq.soLuong && dq.soLuong > 0 ? ` (${dq.soLuong} lượt)` : (dq.soLuong === -1 ? ' (Vô hạn)' : '')}
                                </Tag>
                            ))}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Dành cho',
            key: 'doiTuong',
            align: 'center',
            width: 130,
            render: (_, record) => {
                const target = record.doiTuongSuDung ?? record.DoiTuongSuDung;
                return target === 2 ? <Tag color="green">Ứng viên</Tag> : <Tag color="blue">Nhà tuyển dụng</Tag>;
            }
        },
        {
            title: 'Chu kỳ',
            dataIndex: 'loaiGoi',
            key: 'loaiGoi',
            width: 100,
            render: (val, r) => {
                const type = val ?? r.LoaiGoi;
                const unit = r.donViThoiGian ?? r.DonViThoiGian ?? 1;
                const unitName = type === 1 ? 'Tuần' : type === 2 ? 'Tháng' : 'Năm';
                return `${unit} ${unitName}`;
            }
        },
        {
            title: 'Giá Tiền',
            dataIndex: 'giaTien',
            key: 'giaTien',
            width: 120,
            render: (val, r) => {
                const price = val ?? r.GiaTien ?? 0;
                return <span style={{ color: '#1677ff', fontWeight: 'bold' }}>{new Intl.NumberFormat('vi-VN').format(price)} đ</span>;
            }
        },
        {
            title: 'Khuyến Mãi',
            dataIndex: 'giaKhuyenMai',
            key: 'giaKhuyenMai',
            width: 120,
            render: (val, r) => {
                const discount = val ?? r.GiaKhuyenMai;
                return discount ? <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{new Intl.NumberFormat('vi-VN').format(discount)} đ</span> : '-';
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 100,
            align: 'center',
            render: (val, r) => (val ?? r.TrangThai) ? <Tag color="success">Đang bán</Tag> : <Tag color="error">Đã ngưng</Tag>
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => {
                const active = record.trangThai ?? record.TrangThai;
                const id = record.maGoi || record.MaGoi;

                return (
                    <Space size="small">
                        <Button type="primary" ghost icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                        {active ? (
                            <Popconfirm title="Ngưng bán gói dịch vụ này?" onConfirm={() => handleDelete(id)} okText="Đồng ý" cancelText="Hủy">
                                <Button danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        ) : (
                            <Popconfirm title="Mở bán lại gói này?" onConfirm={() => handleRestore(id)} okText="Mở bán" cancelText="Hủy">
                                <Button type="primary" icon={<UndoOutlined />} />
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}><ShoppingOutlined /> Quản lý Gói Dịch Vụ & Đặc Quyền</Title>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Input.Search
                        placeholder="Tìm theo ID hoặc Tên gói..."
                        allowClear
                        size="large"
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openAddModal}>
                        Thêm Gói Mới
                    </Button>
                </div>
            </div>

            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table columns={columns} dataSource={filteredPackages} rowKey={(r) => r.maGoi || r.MaGoi} loading={loading} bordered />
            </Card>

            <Modal
                title={editingPackage ? `Chỉnh sửa Gói #${editingPackage.maGoi || editingPackage.MaGoi}` : "Thêm Gói Dịch Vụ Mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu Gói Dịch Vụ"
                cancelText="Hủy"
                width={720}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleValuesChange}>
                    <Form.Item name="doiTuong" label="Gói dịch vụ này dành cho:">
                        <Radio.Group optionType="button" buttonStyle="solid">
                            <Radio value="employer">Nhà tuyển dụng</Radio>
                            <Radio value="candidate">Ứng viên</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name="tenGoi" label="Tên gói dịch vụ" rules={[{ required: true, message: 'Vui lòng nhập tên gói!' }]}>
                                <Input placeholder="Ví dụ: Gói Doanh Nghiệp Pro AI" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="loaiGoi" label="Chu kỳ gói (Loại gói)" rules={[{ required: true }]}>
                                <Select>
                                    <Option value={1}>Gói Tuần</Option>
                                    <Option value={2}>Gói Tháng</Option>
                                    <Option value={3}>Gói Năm</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="giaTien"
                                label="Giá gốc (VNĐ)"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập giá gốc!' },
                                    {
                                        validator(_, value) {
                                            if (value !== null && value !== undefined && value <= 0) {
                                                return Promise.reject(new Error('Giá gốc phải lớn hơn 0 VNĐ!'));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Nhập giá gốc..."
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={v => v.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={6} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Form.Item name="hasDiscount" label="Khuyến mãi?" valuePropName="checked">
                                <Switch checkedChildren="Có" unCheckedChildren="Không" />
                            </Form.Item>
                        </Col>

                        <Col span={10}>
                            {hasDiscount && (
                                <Form.Item
                                    name="giaKhuyenMai"
                                    label="Giá khuyến mãi (VNĐ)"
                                    dependencies={['giaTien']}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập giá khuyến mãi!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const giaGoc = getFieldValue('giaTien');
                                                if (value === null || value === undefined) {
                                                    return Promise.resolve();
                                                }
                                                if (value <= 0) {
                                                    return Promise.reject(new Error('Giá khuyến mãi phải lớn hơn 0 VNĐ!'));
                                                }
                                                if (giaGoc !== undefined && giaGoc !== null && value >= giaGoc) {
                                                    return Promise.reject(new Error('Giá khuyến mãi phải RẺ HƠN giá gốc!'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder="Nhập giá KM..."
                                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={v => v.replace(/\$\s?|(,*)/g, '')}
                                    />
                                </Form.Item>
                            )}
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                name="donViThoiGian"
                                label="Số lượng chu kỳ (Số Tuần/Tháng/Năm)"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập độ dài chu kỳ!' },
                                    {
                                        validator(_, value) {
                                            if (value !== null && value !== undefined && value <= 0) {
                                                return Promise.reject(new Error('Chu kỳ phải lớn hơn 0!'));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="Nhập số chu kỳ..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* CHỌN ĐẶC QUYỀN */}
                    <Form.Item
                        name="dacQuyenIds"
                        label={<><CrownOutlined style={{ color: '#faad14' }} /> Danh sách Đặc quyền đính kèm gói</>}
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder={`Chọn đặc quyền cho ${isCandidate ? 'Ứng viên' : 'Nhà tuyển dụng'}...`}
                            style={{ width: '100%' }}
                            optionFilterProp="children"
                            onChange={(selectedIds) => {
                                const currentQuantities = form.getFieldValue('dacQuyenQuantities') || {};
                                const currentTypes = form.getFieldValue('dacQuyenTypes') || {};

                                selectedIds.forEach(id => {
                                    const dq = filteredPrivileges.find(p => (p.maDacQuyen || p.MaDacQuyen) === id);
                                    const code = dq?.maCode || dq?.MaCode || '';

                                    // Mặc định các đặc quyền AI luôn là Vô hạn
                                    if (currentTypes[id] === undefined) {
                                        currentTypes[id] = code === 'NTD_UNLOCK_CV' ? 'limited' : 'unlimited';
                                    }
                                    if (currentQuantities[id] === undefined) {
                                        currentQuantities[id] = code === 'NTD_UNLOCK_CV' ? 50 : 10;
                                    }
                                });
                                form.setFieldsValue({
                                    dacQuyenQuantities: currentQuantities,
                                    dacQuyenTypes: currentTypes
                                });
                            }}
                        >
                            {filteredPrivileges.map(dq => (
                                <Option key={dq.maDacQuyen || dq.MaDacQuyen} value={dq.maDacQuyen || dq.MaDacQuyen}>
                                    {dq.tenDacQuyen || dq.TenDacQuyen} ({dq.maCode || dq.MaCode})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* 🌟 CẤU HÌNH HẠN MỨC: BỔ SUNG ĐẦY ĐỦ CÁC QUYỀN AI */}
                    <Form.Item shouldUpdate={(prev, curr) =>
                        prev.dacQuyenIds !== curr.dacQuyenIds ||
                        prev.dacQuyenTypes !== curr.dacQuyenTypes
                    }>
                        {() => {
                            const selectedIds = form.getFieldValue('dacQuyenIds') || [];
                            const quantityPrivileges = filteredPrivileges.filter(dq =>
                                selectedIds.includes(dq.maDacQuyen || dq.MaDacQuyen) &&
                                COUNTABLE_CODES.includes(dq.maCode || dq.MaCode)
                            );

                            if (quantityPrivileges.length === 0) return null;

                            const currentTypes = form.getFieldValue('dacQuyenTypes') || {};

                            return (
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                                        Cấu hình hạn mức sử dụng:
                                    </div>
                                    {quantityPrivileges.map(dq => {
                                        const dqId = dq.maDacQuyen || dq.MaDacQuyen;
                                        const code = dq.maCode || dq.MaCode;
                                        const isEmployerCvUnlock = code === 'NTD_UNLOCK_CV';
                                        const isUnlimited = !isEmployerCvUnlock && (currentTypes[dqId] === 'unlimited' || currentTypes[dqId] === undefined);

                                        return (
                                            <div key={dqId} style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' }}>
                                                <div style={{ fontWeight: 500, color: '#334155', marginBottom: '8px' }}>
                                                    {dq.tenDacQuyen || dq.TenDacQuyen} ({code})
                                                    {isEmployerCvUnlock && <span style={{ color: '#ff4d4f', fontSize: '12px', marginLeft: '6px' }}>*(Bắt buộc nhập số lượt)*</span>}
                                                </div>

                                                {isEmployerCvUnlock ? (
                                                    <Form.Item
                                                        name={['dacQuyenQuantities', dqId]}
                                                        initialValue={50}
                                                        rules={[
                                                            { required: true, message: 'Vui lòng nhập số lượt mở CV!' },
                                                            {
                                                                validator(_, value) {
                                                                    if (value === null || value === undefined || value <= 0) {
                                                                        return Promise.reject(new Error('Số lượt mở khóa CV phải lớn hơn 0!'));
                                                                    }
                                                                    return Promise.resolve();
                                                                }
                                                            }
                                                        ]}
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <InputNumber
                                                            min={1}
                                                            style={{ width: '100%' }}
                                                            placeholder="Nhập số lượt mở CV..."
                                                            addonAfter="lượt mở CV"
                                                        />
                                                    </Form.Item>
                                                ) : (
                                                    <Row gutter={16} align="middle">
                                                        <Col span={11}>
                                                            <Form.Item
                                                                name={['dacQuyenTypes', dqId]}
                                                                initialValue="unlimited"
                                                                style={{ marginBottom: 0 }}
                                                            >
                                                                <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                                                                    <Radio.Button value="unlimited" style={{ width: '50%', textAlign: 'center' }}>
                                                                        Vô hạn
                                                                    </Radio.Button>
                                                                    <Radio.Button value="limited" style={{ width: '50%', textAlign: 'center' }}>
                                                                        Số lượt
                                                                    </Radio.Button>
                                                                </Radio.Group>
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={13}>
                                                            {!isUnlimited ? (
                                                                <Form.Item
                                                                    name={['dacQuyenQuantities', dqId]}
                                                                    initialValue={10}
                                                                    rules={[
                                                                        { required: true, message: 'Vui lòng nhập số lượt!' },
                                                                        {
                                                                            validator(_, value) {
                                                                                if (value !== null && value !== undefined && value <= 0) {
                                                                                    return Promise.reject(new Error('Số lượt phải > 0!'));
                                                                                }
                                                                                return Promise.resolve();
                                                                            }
                                                                        }
                                                                    ]}
                                                                    style={{ marginBottom: 0 }}
                                                                >
                                                                    <InputNumber
                                                                        min={1}
                                                                        style={{ width: '100%' }}
                                                                        placeholder="Nhập số lượt..."
                                                                        addonAfter="lượt"
                                                                    />
                                                                </Form.Item>
                                                            ) : (
                                                                <Tag color="gold" style={{ padding: '4px 12px', fontSize: '13px', borderRadius: '6px' }}>
                                                                    ✓ Không giới hạn lượt sử dụng
                                                                </Tag>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PackageManager;