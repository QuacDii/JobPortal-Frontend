import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Space, Popconfirm, Modal, Form, Input, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';

const { Title } = Typography;

const LocationManager = () => {
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [isCityModalVisible, setIsCityModalVisible] = useState(false);
    const [editingCity, setEditingCity] = useState(null);
    const [citySearchText, setCitySearchText] = useState(''); 
    const [cityForm] = Form.useForm();

    const [allWards, setAllWards] = useState([]); 
    const [loadingWards, setLoadingWards] = useState(false);
    const [isWardModalVisible, setIsWardModalVisible] = useState(false);
    const [editingWard, setEditingWard] = useState(null);
    const [wardSearchText, setWardSearchText] = useState(''); 
    const [wardForm] = Form.useForm();

    const fetchCitiesAndWards = async () => {
        setLoadingCities(true);
        setLoadingWards(true);
        try {
            const [resCities, resWards] = await Promise.all([
                apiClient.get('/KhuVuc/ThanhPho'),
                apiClient.get('/KhuVuc/PhuongXa')
            ]);
            
            const cityData = resCities.data !== undefined ? resCities.data : resCities;
            const wardData = resWards.data !== undefined ? resWards.data : resWards;
            
            setCities(cityData || []);
            setAllWards(wardData || []);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu khu vực!');
        } finally {
            setLoadingCities(false);
            setLoadingWards(false);
        }
    };

    useEffect(() => {
        fetchCitiesAndWards();
    }, []);

    const handleSaveCity = async (values) => {
        try {
            const payload = { tenTp: values.tenTP || values.tenTp };
            if (editingCity) {
                const cityId = editingCity.maTP || editingCity.maTp;
                payload.maTp = cityId;
                await apiClient.put(`/KhuVuc/ThanhPho/${cityId}`, payload);
                message.success('Cập nhật Thành phố thành công!');
            } else {
                await apiClient.post('/KhuVuc/ThanhPho', payload);
                message.success('Thêm Thành phố thành công!');
            }
            setIsCityModalVisible(false);
            fetchCitiesAndWards();
        } catch (error) {
            message.error('Lỗi khi lưu Thành phố!');
        }
    };

    const handleDeleteCity = async (id) => {
        try {
            await apiClient.delete(`/KhuVuc/ThanhPho/${id}`);
            message.success('Xóa Thành phố thành công!');
            const currentSelectedId = selectedCity?.maTP || selectedCity?.maTp;
            if (currentSelectedId === id) setSelectedCity(null);
            fetchCitiesAndWards();
        } catch (error) {
            message.error('Không thể xóa Thành phố này vì đang chứa Phường/Xã!');
        }
    };

    const handleSaveWard = async (values) => {
        try {
            const cityId = selectedCity.maTP || selectedCity.maTp;
            const payload = { 
                tenPhuong: values.tenPhuong,
                maTp: cityId 
            };
            
            if (editingWard) {
                const wardId = editingWard.maPhuong;
                payload.maPhuong = wardId;
                await apiClient.put(`/KhuVuc/PhuongXa/${wardId}`, payload);
                message.success('Cập nhật Phường/Xã thành công!');
            } else {
                await apiClient.post('/KhuVuc/PhuongXa', payload);
                message.success('Thêm Phường/Xã thành công!');
            }
            setIsWardModalVisible(false);
            fetchCitiesAndWards();
        } catch (error) {
            message.error('Lỗi khi lưu Phường/Xã!');
        }
    };

    const handleDeleteWard = async (id) => {
        try {
            await apiClient.delete(`/KhuVuc/PhuongXa/${id}`);
            message.success('Xóa Phường/Xã thành công!');
            fetchCitiesAndWards();
        } catch (error) {
            message.error('Lỗi khi xóa Phường/Xã!');
        }
    };

    const getCityName = (city) => city.tenTp || city.tenTP;
    const getCityId = (city) => city.maTp || city.maTP;

    const filteredCities = cities.filter((city) => {
        const cityName = getCityName(city);
        if (!cityName) return false;
        return cityName.toLowerCase().includes(citySearchText.toLowerCase());
    });

    const selectedCityId = selectedCity ? getCityId(selectedCity) : null;
    const displayedWards = selectedCityId 
        ? allWards.filter(w => (w.maTp === selectedCityId || w.maTP === selectedCityId)) 
        : [];
        
    const filteredWards = displayedWards.filter((ward) => {
        if (!ward.tenPhuong) return false;
        return ward.tenPhuong.toLowerCase().includes(wardSearchText.toLowerCase());
    });

    return (
        <div style={{ padding: '24px' }}>
            {/* 👉 ĐỒNG BỘ HEADER TRANG KHU VỰC */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}><EnvironmentOutlined /> Quản lý Khu vực (Tỉnh/Thành - Phường/Xã)</Title>
            </div>

            <Row gutter={24}>
                {/* CỘT TRÁI: QUẢN LÝ THÀNH PHỐ */}
                <Col xs={24} md={10}>
                    <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
                            <Input.Search
                                placeholder="Tìm Tỉnh/Thành phố..."
                                allowClear
                                onChange={(e) => setCitySearchText(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCity(null); cityForm.resetFields(); setIsCityModalVisible(true); }}>
                                Thêm TP
                            </Button>
                        </div>

                        <Table 
                            dataSource={filteredCities} 
                            rowKey={(record) => getCityId(record)} 
                            loading={loadingCities}
                            pagination={{ pageSize: 8, showSizeChanger: false }}
                            bordered
                            rowClassName={(record) => getCityId(record) === selectedCityId ? 'selected-row-highlight' : ''}
                            onRow={(record) => ({
                                onClick: () => {
                                    setSelectedCity(record);
                                    setWardSearchText(''); 
                                },
                                style: { cursor: 'pointer' }
                            })}
                            columns={[
                                { title: 'ID', dataIndex: 'maTP', render: (_, record) => getCityId(record), width: 60, align: 'center' },
                                { title: 'Tên Thành phố', dataIndex: 'tenTP', render: (_, record) => getCityName(record), fontWeight: 'bold' },
                                {
                                    title: 'Thao tác', width: 100, align: 'center',
                                    render: (_, record) => (
                                        <Space onClick={(e) => e.stopPropagation()}>
                                            <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => { setEditingCity(record); cityForm.setFieldsValue({ tenTP: getCityName(record) }); setIsCityModalVisible(true); }} />
                                            <Popconfirm title="Xóa TP này?" onConfirm={() => handleDeleteCity(getCityId(record))}>
                                                <Button size="small" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        </Space>
                                    )
                                }
                            ]}
                        />
                    </Card>
                </Col>

                {/* CỘT PHẢI: QUẢN LÝ PHƯỜNG / XÃ */}
                <Col xs={24} md={14}>
                    <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minHeight: '100%' }}>
                        {!selectedCity ? (
                            <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
                                <EnvironmentOutlined style={{ fontSize: 48, color: '#e0e0e0', marginBottom: 16 }} /><br/>
                                Click vào một Thành phố ở bảng bên trái để xem và thêm danh sách Phường/Xã.
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
                                    <Input.Search
                                        placeholder={`Tìm Phường/Xã trong ${getCityName(selectedCity)}...`}
                                        allowClear
                                        value={wardSearchText}
                                        onChange={(e) => setWardSearchText(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingWard(null); wardForm.resetFields(); setIsWardModalVisible(true); }}>
                                        Thêm Phường/Xã
                                    </Button>
                                </div>
                                <Table 
                                    dataSource={filteredWards} 
                                    rowKey="maPhuong" 
                                    loading={loadingWards}
                                    bordered
                                    pagination={{ pageSize: 8, showSizeChanger: false }}
                                    columns={[
                                        { title: 'ID', dataIndex: 'maPhuong', width: 60, align: 'center' },
                                        { title: 'Tên Phường/Xã', dataIndex: 'tenPhuong', fontWeight: 'bold' },
                                        {
                                            title: 'Thao tác', width: 100, align: 'center',
                                            render: (_, record) => (
                                                <Space>
                                                    <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => { setEditingWard(record); wardForm.setFieldsValue(record); setIsWardModalVisible(true); }} />
                                                    <Popconfirm title="Xóa Phường/Xã này?" onConfirm={() => handleDeleteWard(record.maPhuong)}>
                                                        <Button size="small" danger icon={<DeleteOutlined />} />
                                                    </Popconfirm>
                                                </Space>
                                            )
                                        }
                                    ]}
                                />
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal title={editingCity ? "Sửa Thành phố" : "Thêm Thành phố"} open={isCityModalVisible} onCancel={() => setIsCityModalVisible(false)} onOk={() => cityForm.submit()} okText="Lưu lại" cancelText="Hủy">
                <Form form={cityForm} layout="vertical" onFinish={handleSaveCity}>
                    <Form.Item name="tenTP" label="Tên Thành phố" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="VD: Hà Nội, TP.HCM..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={editingWard ? "Sửa Phường/Xã" : "Thêm Phường/Xã"} open={isWardModalVisible} onCancel={() => setIsWardModalVisible(false)} onOk={() => wardForm.submit()} okText="Lưu lại" cancelText="Hủy">
                <Form form={wardForm} layout="vertical" onFinish={handleSaveWard}>
                    <Form.Item label="Thuộc Thành phố">
                        <Input value={selectedCity ? getCityName(selectedCity) : ''} disabled style={{ backgroundColor: '#f5f5f5', color: '#333' }} />
                    </Form.Item>
                    <Form.Item name="tenPhuong" label="Tên Phường/Xã" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="VD: Phường Bến Nghé, Xã Phước Kiển..." />
                    </Form.Item>
                </Form>
            </Modal>
            
            <style>{`
                .selected-row-highlight > td {
                    background-color: #e6f7ff !important;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

export default LocationManager;