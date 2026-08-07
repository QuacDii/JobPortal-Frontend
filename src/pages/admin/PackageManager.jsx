import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Typography, Row, Col, Radio, Switch, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingOutlined, UndoOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title } = Typography;
const { Option } = Select;

const PackageManager = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // 👉 THÊM STATE ĐỂ LƯU TỪ KHÓA TÌM KIẾM
    const [searchText, setSearchText] = useState('');
    
    const [isCandidate, setIsCandidate] = useState(false);
    const [hasDiscount, setHasDiscount] = useState(false);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/Service');
            setPackages(res.data || res);
        } catch (error) {
            message.error('Lỗi khi tải danh sách gói dịch vụ!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const openAddModal = () => {
        form.resetFields();
        form.setFieldsValue({
            doiTuong: 'employer',
            loaiGoi: 2,
            hasDiscount: false,
            soLuotXemCv: 1
        });
        setIsCandidate(false);
        setHasDiscount(false);
        setIsModalVisible(true);
    };

    const handleValuesChange = (changedValues, allValues) => {
        if (changedValues.doiTuong) {
            const isCand = changedValues.doiTuong === 'candidate';
            setIsCandidate(isCand);
            if (isCand) {
                form.setFieldsValue({ soLuotXemCv: 0 }); 
            } else {
                form.setFieldsValue({ soLuotXemCv: 1 }); 
            }
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
            message.success(res.data?.message || 'Đã xử lý thành công!');
            fetchPackages();
        } catch (error) {
            message.error('Không thể thao tác lúc này!');
        }
    };

    const handleRestore = async (id) => {
        try {
            const res = await apiClient.put(`/Service/${id}/restore`);
            message.success(res.data?.message || 'Đã mở bán lại thành công!');
            fetchPackages();
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
                donViThoiGian: values.donViThoiGian
            };

            await apiClient.post('/Service', payload);
            message.success('Thêm gói dịch vụ mới thành công!');
            setIsModalVisible(false);
            fetchPackages();
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu dữ liệu!');
        }
    };

    // 👉 LOGIC LỌC DANH SÁCH GÓI DỊCH VỤ THEO TỪ KHÓA TÌM KIẾM
    const filteredPackages = packages.filter((pkg) => {
        const matchName = pkg.tenGoi?.toLowerCase().includes(searchText.toLowerCase());
        const matchId = pkg.maGoi?.toString().includes(searchText);
        return matchName || matchId;
    });

    const columns = [
        { title: 'ID', dataIndex: 'maGoi', key: 'maGoi', width: 60, align: 'center' },
        { title: 'Tên Gói', dataIndex: 'tenGoi', key: 'tenGoi', fontWeight: 'bold' },
        {
            title: 'Dành cho',
            key: 'doiTuong',
            align: 'center',
            render: (_, record) => {
                if (record.soLuotXemCv === 0) {
                    return <Tag color="blue">Ứng viên</Tag>;
                }
                return <Tag color="orange">Nhà tuyển dụng</Tag>;
            }
        },
        { 
            title: 'Loại Gói', 
            dataIndex: 'loaiGoi', 
            key: 'loaiGoi',
            render: (val) => val === 1 ? 'Tuần' : val === 2 ? 'Tháng' : 'Năm'
        },
        { 
            title: 'Giá Tiền', 
            dataIndex: 'giaTien', 
            key: 'giaTien',
            render: (val) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{new Intl.NumberFormat('vi-VN').format(val)} đ</span>
        },
        { 
            title: 'Khuyến Mãi', 
            dataIndex: 'giaKhuyenMai', 
            key: 'giaKhuyenMai',
            render: (val) => val ? `${new Intl.NumberFormat('vi-VN').format(val)} đ` : '-'
        },
        { title: 'Lượt Xem CV', dataIndex: 'soLuotXemCv', key: 'soLuotXemCv', align: 'center' },
        { title: 'Thời Hạn', dataIndex: 'donViThoiGian', key: 'donViThoiGian', align: 'center' },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            align: 'center',
            render: (val) => val ? <span style={{ color: '#52c41a' }}>Đang bán</span> : <span style={{ color: '#ff4d4f' }}>Đã ngưng</span>
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                record.trangThai ? (
                    <Popconfirm title="Xóa hoặc Ngưng bán gói này?" onConfirm={() => handleDelete(record.maGoi)} okText="Đồng ý" cancelText="Hủy">
                        <Button danger icon={<DeleteOutlined />} title="Xóa hoặc Ngưng bán" />
                    </Popconfirm>
                ) : (
                    <Popconfirm title="Bạn muốn mở bán lại gói này?" onConfirm={() => handleRestore(record.maGoi)} okText="Mở bán" cancelText="Hủy">
                        <Button type="primary" ghost icon={<UndoOutlined />} title="Mở bán lại" />
                    </Popconfirm>
                )
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}><ShoppingOutlined /> Quản lý Gói Dịch Vụ</Title>
                
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
                <Table columns={columns} dataSource={filteredPackages} rowKey="maGoi" loading={loading} bordered />
            </Card>

            <Modal
                title="Thêm Gói Dịch Vụ Mới"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Thêm mới"
                cancelText="Hủy"
                width={650}
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={handleSubmit}
                    onValuesChange={handleValuesChange}
                >
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
                        <Col span={8}>
                            <Form.Item 
                                name="giaTien" 
                                label="Giá gốc (VNĐ)" 
                                rules={[
                                    { required: true, message: 'Nhập giá tiền!' },
                                    { type: 'number', min: 1, message: 'Giá tiền phải lớn hơn 0!' }
                                ]}
                            >
                                <InputNumber style={{ width: '100%' }} min={1} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                            </Form.Item>
                        </Col>
                        
                        <Col span={6} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Form.Item name="hasDiscount" label="Có khuyến mãi?" valuePropName="checked">
                                <Switch checkedChildren="Có" unCheckedChildren="Không" />
                            </Form.Item>
                        </Col>

                        <Col span={10}>
                            {hasDiscount ? (
                                <Form.Item 
                                    name="giaKhuyenMai" 
                                    label="Giá khuyến mãi (VNĐ)" 
                                    dependencies={['giaTien']}
                                    rules={[
                                        { required: true, message: 'Nhập giá khuyến mãi!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const giaGoc = getFieldValue('giaTien');
                                                if (value === null || value === undefined) return Promise.resolve();
                                                if (giaGoc === null || giaGoc === undefined) return Promise.resolve();
                                                
                                                if (value < giaGoc) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Khuyến mãi phải RẺ HƠN giá gốc!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                                </Form.Item>
                            ) : (
                                <div style={{ height: '75px', display: 'flex', alignItems: 'center', color: '#bfbfbf', fontStyle: 'italic' }}>
                                    (Không áp dụng khuyến mãi)
                                </div>
                            )}
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        {!isCandidate && (
                            <Col span={12}>
                                <Form.Item 
                                    name="soLuotXemCv" 
                                    label="Số lượt mở khóa CV" 
                                    rules={[
                                        { required: true, message: 'Nhập số lượt mở CV!' },
                                        { type: 'number', min: 1, message: 'Số lượt phải lớn hơn 0!' }
                                    ]}
                                >
                                    <InputNumber style={{ width: '100%' }} min={1} />
                                </Form.Item>
                            </Col>
                        )}
                        
                        <Col span={isCandidate ? 24 : 12}>
                            <Form.Item name="donViThoiGian" label="Độ dài chu kỳ (Số Tuần/Tháng/Năm)" rules={[{ required: true, message: 'Nhập độ dài chu kỳ!' }]}>
                                <InputNumber style={{ width: '100%' }} min={1} placeholder="VD: 1 hoặc 30" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default PackageManager;