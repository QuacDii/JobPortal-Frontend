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

// 🌟 DANH SÁCH ĐẶC QUYỀN MẶC ĐỊNH CHUẨN DỮ LIỆU TỪ BẢNG [dbo].[DacQuyen]
const DEFAULT_PRIVILEGES = [
    // 1: Nhà tuyển dụng (NTD)
    { maDacQuyen: 1, maCode: 'NTD_VIP_JOB', tenDacQuyen: 'Tự động đẩy tin / Nổi bật', doiTuongSuDung: 1 },
    { maDacQuyen: 2, maCode: 'NTD_UNLOCK_CV', tenDacQuyen: 'Mở khóa xem Email CV ứng viên', doiTuongSuDung: 1 },
    { maDacQuyen: 3, maCode: 'NTD_AI_MATCHING', tenDacQuyen: 'Sử dụng AI Phân tích & Gợi ý ứng viên', doiTuongSuDung: 1 },

    // 2: Ứng viên (UV)
    { maDacQuyen: 4, maCode: 'UV_PREMIUM_TEMPLATE', tenDacQuyen: 'Mở khóa mẫu CV Cao cấp / VIP', doiTuongSuDung: 2 },
    { maDacQuyen: 5, maCode: 'UV_AI_REVIEW', tenDacQuyen: 'AI Đánh giá & Gợi ý tối ưu CV', doiTuongSuDung: 2 },
    { maDacQuyen: 6, maCode: 'UV_UNLIMITED_CV', tenDacQuyen: 'Tạo & Quản lý CV không giới hạn', doiTuongSuDung: 2 },
    { maDacQuyen: 13, maCode: 'UV_REMOVE_WATERMARK', tenDacQuyen: 'Tải CV dạng PDF không dính Watermark', doiTuongSuDung: 2 },
    { maDacQuyen: 14, maCode: 'UV_AI_WRITE_GOAL', tenDacQuyen: 'Trợ lý AI Gemini viết mục tiêu / nội dung CV', doiTuongSuDung: 2 }
];

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

    // TẢI DỮ LIỆU GÓI DỊCH VỤ VÀ ĐẶC QUYỀN
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [pkgRes, dacQuyenRes] = await Promise.all([
                apiClient.get('/Service'),
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
            soLuotXemCv: 1,
            donViThoiGian: 1,
            dacQuyenIds: []
        });
        setIsCandidate(false);
        setHasDiscount(false);
        setIsModalVisible(true);
    };

    const openEditModal = (record) => {
        setEditingPackage(record);
        
        const target = record.doiTuongSuDung ?? record.DoiTuongSuDung;
        const isCand = target === 2 || record.soLuotXemCv === 0;
        const discountExist = record.giaKhuyenMai && record.giaKhuyenMai > 0;

        const selectedDacQuyens = (record.dacQuyens || record.DacQuyens || []).map(dq => dq.maDacQuyen || dq.MaDacQuyen);

        setIsCandidate(isCand);
        setHasDiscount(discountExist);

        form.setFieldsValue({
            tenGoi: record.tenGoi || record.TenGoi,
            doiTuong: isCand ? 'candidate' : 'employer',
            loaiGoi: record.loaiGoi || record.LoaiGoi || 2,
            giaTien: record.giaTien || record.GiaTien,
            hasDiscount: discountExist,
            giaKhuyenMai: discountExist ? (record.giaKhuyenMai || record.GiaKhuyenMai) : null,
            soLuotXemCv: record.soLuotXemCv ?? record.SoLuotXemCv ?? 0,
            donViThoiGian: record.donViThoiGian || record.DonViThoiGian || 1,
            dacQuyenIds: selectedDacQuyens
        });

        setIsModalVisible(true);
    };

    const handleValuesChange = (changedValues) => {
        if (changedValues.doiTuong) {
            const isCand = changedValues.doiTuong === 'candidate';
            setIsCandidate(isCand);
            form.setFieldsValue({ 
                soLuotXemCv: isCand ? 0 : 1,
                dacQuyenIds: []
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
            message.success(res?.data?.message || 'Đã ngưng bán thành công!');
            fetchInitialData();
        } catch (error) {
            message.error('Không thể thao tác lúc này!');
        }
    };

    const handleRestore = async (id) => {
        try {
            const res = await apiClient.put(`/Service/${id}/restore`);
            message.success(res?.data?.message || 'Đã mở bán lại thành công!');
            fetchInitialData();
        } catch (error) {
            message.error('Không thể mở bán lại lúc này!');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                tenGoi: values.tenGoi,
                loaiGoi: values.loaiGoi,
                giaTien: values.giaTien,
                giaKhuyenMai: values.hasDiscount ? values.giaKhuyenMai : null,
                soLuotXemCv: isCandidate ? 0 : (values.soLuotXemCv || 0),
                donViThoiGian: values.donViThoiGian,
                doiTuongSuDung: values.doiTuong === 'candidate' ? 2 : 1, // 1 = NTD, 2 = Ứng viên
                dacQuyenIds: values.dacQuyenIds || []
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
            message.error('Có lỗi xảy ra khi lưu dữ liệu!');
        }
    };

    const filteredPackages = packages.filter((pkg) => {
        const name = pkg.tenGoi || pkg.TenGoi || '';
        const id = pkg.maGoi || pkg.MaGoi || '';
        return name.toLowerCase().includes(searchText.toLowerCase()) || id.toString().includes(searchText);
    });

    // 🌟 ĐỐI CHIẾU CHÍNH XÁC VỚI DB: 1 = NTD, 2 = ỨNG VIÊN
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
            render: (text, r) => (
                <div>
                    <b style={{ fontSize: 14 }}>{text || r.TenGoi}</b>
                    <div style={{ marginTop: 4 }}>
                        {(r.dacQuyens || r.DacQuyens || []).map((dq, idx) => (
                            <Tag key={idx} color="cyan" style={{ fontSize: 11, marginBottom: 2 }}>
                                ✓ {dq.tenDacQuyen || dq.TenDacQuyen}
                            </Tag>
                        ))}
                    </div>
                </div>
            ) 
        },
        {
            title: 'Dành cho',
            key: 'doiTuong',
            align: 'center',
            width: 110,
            render: (_, record) => {
                const target = record.doiTuongSuDung ?? record.DoiTuongSuDung;
                const isCand = target === 2 || record.soLuotXemCv === 0;
                return isCand ? <Tag color="green">Ứng viên</Tag> : <Tag color="blue">Nhà tuyển dụng</Tag>;
            }
        },
        { 
            title: 'Chu kỳ', 
            dataIndex: 'loaiGoi', 
            key: 'loaiGoi',
            width: 90,
            render: (val, r) => {
                const type = val ?? r.LoaiGoi;
                return type === 1 ? 'Tuần' : type === 2 ? 'Tháng' : 'Năm';
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

            {/* MODAL CẤU HÌNH GÓI & ĐẶC QUYỀN */}
            <Modal
                title={editingPackage ? `Chỉnh sửa Gói #${editingPackage.maGoi || editingPackage.MaGoi}` : "Thêm Gói Dịch Vụ Mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu Gói Dịch Vụ"
                cancelText="Hủy"
                width={700}
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
                                <Input placeholder="Ví dụ: Gói VIP 1 Tháng" />
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
                        {/* 🌟 GIÁ GỐC: KHÔNG DÙNG MIN=1 ĐỂ BÁO LỖI KHI NHẬP SỐ ÂM HOẶC 0 */}
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

                        {/* 🌟 GIÁ KHUYẾN MÃI: KHÔNG DÙNG MIN=1 ĐỂ BÁO LỖI KHI NHẬP SỐ ÂM */}
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
                                        placeholder="Nhập giáKM..."
                                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                        parser={v => v.replace(/\$\s?|(,*)/g, '')} 
                                    />
                                </Form.Item>
                            )}
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        {!isCandidate && (
                            <Col span={12}>
                                <Form.Item 
                                    name="soLuotXemCv" 
                                    label="Số lượt mở khóa CV NTD" 
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số lượt xem CV!' },
                                        {
                                            validator(_, value) {
                                                if (value !== null && value !== undefined && value <= 0) {
                                                    return Promise.reject(new Error('Số lượt mở CV phải lớn hơn 0!'));
                                                }
                                                return Promise.resolve();
                                            }
                                        }
                                    ]}
                                >
                                    <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượt..." />
                                </Form.Item>
                            </Col>
                        )}
                        
                        <Col span={isCandidate ? 24 : 12}>
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

                    {/* 🌟 CÁC ĐẶC QUYỀN ĐI KÈM CHUẨN XÁC DỮ LIỆU BẢNG DACQUYEN */}
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
                        >
                            {filteredPrivileges.map(dq => (
                                <Option key={dq.maDacQuyen || dq.MaDacQuyen} value={dq.maDacQuyen || dq.MaDacQuyen}>
                                    {dq.tenDacQuyen || dq.TenDacQuyen} ({dq.maCode || dq.MaCode})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PackageManager;