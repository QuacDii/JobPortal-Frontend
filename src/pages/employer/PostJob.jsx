import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, Typography, Row, Col, Divider, message, InputNumber, Cascader, Alert, TreeSelect, Radio, Tag, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, SendOutlined, RocketOutlined, BulbOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PostJob = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [standardSkills, setStandardSkills] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [locations, setLocations] = useState([]);
    
    // State lưu danh sách Tag gợi ý theo từng vị trí [positionIndex]
    const [recommendedSkillsMap, setRecommendedSkillsMap] = useState({});

    const CAP_BAC_OPTIONS = [
        { value: 'Thực tập sinh', label: 'Thực tập sinh' },
        { value: 'Nhân viên', label: 'Nhân viên' },
        { value: 'Trưởng nhóm', label: 'Trưởng nhóm' },
        { value: 'Trưởng/Phó phòng', label: 'Trưởng/Phó phòng' },
        { value: 'Quản lý / Giám sát', label: 'Quản lý / Giám sát' },
        { value: 'Trưởng chi nhánh', label: 'Trưởng chi nhánh' },
        { value: 'Phó giám đốc', label: 'Phó giám đốc' },
        { value: 'Giám đốc', label: 'Giám đốc' },
    ];

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const resSkills = await apiClient.get('/recruitment/skills').catch(() => null);
                const skillPayload = resSkills?.data || resSkills;
                const rawSkills = skillPayload?.all || skillPayload || [];
                setStandardSkills(Array.isArray(rawSkills) ? rawSkills.map(item => ({ label: item.label || item.tenKyNang, value: item.value || item.tenKyNang })) : []);
            } catch (error) { console.error("Lỗi Kỹ năng:", error); }

            try {
                const resInd = await apiClient.get('/NganhNghe/tree').catch(() => []);
                const rawTree = Array.isArray(resInd) ? resInd : (resInd?.data?.data || resInd?.data || []);
                const formattedTree = rawTree.map(parent => {
                    const childrenList = parent.danhSachCon || parent.nganhNgheCons || parent.children || [];
                    return {
                        title: parent.tenNganh || parent.tenNganhCha || 'Ngành nghề',
                        value: `cha_${parent.maNganh || parent.maNganhCha}`,
                        selectable: false,
                        children: childrenList.map(child => ({
                            title: child.tenNganh || child.tenNganhCon,
                            value: child.maNganh || child.maNganhCon
                        }))
                    };
                });
                setIndustries(formattedTree);
            } catch (error) { console.error("Lỗi Ngành nghề:", error); }

            try {
                const resLoc = await apiClient.get('/recruitment/locations').catch(() => []);
                setLocations(Array.isArray(resLoc) ? resLoc.map(tp => ({
                    label: tp.tenTP || tp.tenTp || tp.label,
                    value: tp.maTP || tp.maTp || tp.value,
                    children: (tp.phuongXas || tp.phuongXasNavigation || tp.children || []).map(px => ({
                        label: px.tenPhuong || px.label,
                        value: px.maPhuong || px.value
                    }))
                })) : []);
            } catch (error) { console.error("Lỗi Khu vực:", error); }
        };
        fetchMasterData();
    }, []);

    const handleIndustryChange = async (maNganhConVal, posIndex) => {
        if (!maNganhConVal) return;
        try {
            const res = await apiClient.get(`/recruitment/skills?maNganhCon=${maNganhConVal}`);
            const payload = res?.data || res;
            const recList = payload?.recommended || [];
            setRecommendedSkillsMap(prev => ({
                ...prev,
                [posIndex]: recList
            }));
        } catch (error) {
            console.error("Lỗi tải gợi ý kỹ năng theo ngành:", error);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                tieuDeChienDich: values.tieuDeChienDich,
                ngayHetHan: values.ngayHetHan.format('YYYY-MM-DD'),
                danhSachViTri: values.danhSachViTri.map(pos => {
                    let luongText = 'Thỏa thuận';
                    if (pos.loaiLuong === 'khoang') {
                        if (pos.luongTu && pos.luongDen) {
                            luongText = `${pos.luongTu} - ${pos.luongDen} Triệu`;
                        } else if (pos.luongTu) {
                            luongText = `Từ ${pos.luongTu} Triệu`;
                        } else if (pos.luongDen) {
                            luongText = `Đến ${pos.luongDen} Triệu`;
                        }
                    }
                    return {
                        tenViTri: pos.tenViTri,
                        capBac: pos.capBac,
                        soLuongTuyen: pos.soLuongTuyen || 1,
                        luong: luongText,
                        moTaCongViec: pos.moTaCongViec,
                        yeuCauUngVien: pos.yeuCauUngVien,
                        quyenLoi: pos.quyenLoi,
                        maNganh: pos.maNganh,
                        maPhuong: Array.isArray(pos.maPhuong) ? pos.maPhuong[pos.maPhuong.length - 1] : pos.maPhuong,
                        danhSachKyNang: pos.danhSachKyNang || [],
                        nganhNgheKhac: pos.nganhNgheKhac || null
                    };
                })
            };
            const response = await apiClient.post('/recruitment/post-job', payload);
            if (response.success || response.data?.success) {
                message.success(response.message || 'Đăng tin thành công!');
                form.resetFields();
                setRecommendedSkillsMap({});
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đăng tin!';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <RocketOutlined style={{ fontSize: '28px', color: '#1890ff', marginRight: 15 }} />
                <Title level={3} style={{ margin: 0 }}>Tạo Chiến dịch Tuyển dụng mới</Title>
            </div>
            
            <Alert
                message="Lưu ý về tính năng Phân tích hồ sơ bằng AI (HR Tech):"
                description="Vui lòng mô tả thông tin vị trí việc làm, yêu cầu ứng viên và quyền lợi đầy đủ để hệ thống AI có thể đối chiếu chéo và chấm điểm matching chính xác nhất."
                type="info"
                showIcon
                style={{ marginBottom: 24, borderRadius: 6 }}
            />

            <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
                initialValues={{ danhSachViTri: [{ loaiLuong: 'khoang', soLuongTuyen: 1 }] }}
            >
                <Card title="Thông tin chung" style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Row gutter={24}>
                        <Col span={16}>
                            <Form.Item
                                label="Tiêu đề chiến dịch"
                                name="tieuDeChienDich"
                                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề chiến dịch!' }]}
                            >
                                <Input size="large" placeholder="VD: Tuyển dụng lập trình viên Quý 3/2026" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Ngày hết hạn nhận CV"
                                name="ngayHetHan"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn ngày hết hạn!' },
                                    {
                                        validator: (_, value) => {
                                            if (!value || value.isAfter(dayjs(), 'day')) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Ngày hết hạn phải lớn hơn ngày hiện tại!'));
                                        }
                                    }
                                ]}
                            >
                                <DatePicker
                                    size="large"
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    disabledDate={(current) => current && current <= dayjs().endOf('day')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Form.List name="danhSachViTri">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <Card
                                    key={key}
                                    title={<Text strong style={{ color: '#1890ff' }}>Vị trí #{index + 1}</Text>}
                                    extra={
                                        fields.length > 1 ? (
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)}>
                                                Xóa vị trí này
                                            </Button>
                                        ) : null
                                    }
                                    style={{ marginBottom: 24, border: '1px solid #91d5ff', borderRadius: 8 }}
                                >
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                label="Tên vị trí (Chức danh)"
                                                name={[name, 'tenViTri']}
                                                rules={[{ required: true, message: 'Bắt buộc nhập!' }]}
                                            >
                                                <Input placeholder="VD: Frontend Developer (ReactJS)" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                label="Cấp bậc"
                                                name={[name, 'capBac']}
                                                rules={[{ required: true, message: 'Vui lòng chọn cấp bậc vị trí!' }]}
                                            >
                                                <Select
                                                    placeholder="-- Chọn cấp bậc vị trí --"
                                                    options={CAP_BAC_OPTIONS}
                                                    allowClear
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={24}>
                                        <Col span={14}>
                                            <Form.Item
                                                {...restField}
                                                label="Mức lương"
                                                name={[name, 'loaiLuong']}
                                                initialValue="khoang"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <Radio.Group buttonStyle="solid">
                                                    <Radio.Button value="khoang">Khoảng lương (Triệu VNĐ)</Radio.Button>
                                                    <Radio.Button value="thoa-thuan">Thỏa thuận</Radio.Button>
                                                </Radio.Group>
                                            </Form.Item>
                                            <Form.Item
                                                noStyle
                                                shouldUpdate={(prevValues, currentValues) =>
                                                    prevValues.danhSachViTri?.[name]?.loaiLuong !== currentValues.danhSachViTri?.[name]?.loaiLuong
                                                }
                                            >
                                                {({ getFieldValue }) => {
                                                    const loaiLuong = getFieldValue(['danhSachViTri', name, 'loaiLuong']) || 'khoang';
                                                    if (loaiLuong === 'khoang') {
                                                        return (
                                                            <Row gutter={8} align="middle">
                                                                <Col span={11}>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, 'luongTu']}
                                                                        rules={[{ required: true, message: 'Nhập lương từ!' }]}
                                                                    >
                                                                        <InputNumber min={0} style={{ width: '100%' }} placeholder="Từ (VD: 15)" addonAfter="Triệu" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={2} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'bold' }}>-</Col>
                                                                <Col span={11}>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, 'luongDen']}
                                                                        rules={[
                                                                            { required: true, message: 'Nhập lương đến!' },
                                                                            ({ getFieldValue }) => ({
                                                                                validator(_, value) {
                                                                                    const tu = getFieldValue(['danhSachViTri', name, 'luongTu']);
                                                                                    if (!value || !tu || value >= tu) {
                                                                                        return Promise.resolve();
                                                                                    }
                                                                                    return Promise.reject(new Error('Lương đến phải >= Lương từ!'));
                                                                                },
                                                                            }),
                                                                        ]}
                                                                    >
                                                                        <InputNumber min={0} style={{ width: '100%' }} placeholder="Đến (VD: 20)" addonAfter="Triệu" />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            </Form.Item>
                                        </Col>
                                        <Col span={10}>
                                            <Form.Item
                                                {...restField}
                                                label="Số lượng tuyển"
                                                name={[name, 'soLuongTuyen']}
                                                rules={[{ required: true, message: 'Bắt buộc nhập!' }]}
                                                initialValue={1}
                                            >
                                                <InputNumber min={1} style={{ width: '100%' }} placeholder="VD: 2" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                label="Ngành nghề"
                                                name={[name, 'maNganh']}
                                                rules={[{ required: true, message: 'Bắt buộc chọn!' }]}
                                            >
                                                <TreeSelect
                                                    treeData={industries}
                                                    placeholder="Chọn Ngành cha -> Ngành con"
                                                    showSearch
                                                    treeNodeFilterProp="title"
                                                    style={{ width: '100%' }}
                                                    dropdownStyle={{ maxHeight: 350, overflow: 'auto' }}
                                                    treeDefaultExpandAll={false}
                                                    onChange={(val) => handleIndustryChange(val, name)}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={12}>
                                            <Form.Item {...restField} label="Khu vực làm việc" name={[name, 'maPhuong']} rules={[{ required: true, message: 'Bắt buộc chọn!' }]}>
                                                <Cascader
                                                    options={locations}
                                                    placeholder="Chọn Tỉnh/Thành phố -> Quận/Huyện"
                                                    showSearch={{
                                                        filter: (inputValue, path) =>
                                                            path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {recommendedSkillsMap[name] && recommendedSkillsMap[name].length > 0 && (
                                        <div style={{ marginBottom: 12, background: '#f6ffed', border: '1px solid #b7eb8f', padding: '10px 14px', borderRadius: 6 }}>
                                            <Text style={{ color: '#389e0d', display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '13px' }}>
                                                <BulbOutlined style={{ marginRight: 6 }} /> Gợi ý kỹ năng phổ biến cho ngành này (Click để chọn nhanh):
                                            </Text>
                                            <Space wrap size={[0, 8]}>
                                                {recommendedSkillsMap[name].map((skillName, idx) => (
                                                    <Tag 
                                                        key={idx} 
                                                        color="green" 
                                                        style={{ cursor: 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: '13px' }}
                                                        onClick={() => {
                                                            const currentSkills = form.getFieldValue(['danhSachViTri', name, 'danhSachKyNang']) || [];
                                                            if (!currentSkills.includes(skillName)) {
                                                                form.setFieldValue(['danhSachViTri', name, 'danhSachKyNang'], [...currentSkills, skillName]);
                                                            }
                                                        }}
                                                    >
                                                        + {skillName}
                                                    </Tag>
                                                ))}
                                            </Space>
                                        </div>
                                    )}

                                    <Form.Item
                                        {...restField}
                                        label="Kỹ năng yêu cầu (Chọn từ danh sách hoặc tự gõ)"
                                        name={[name, 'danhSachKyNang']}
                                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 kỹ năng!' }]}
                                    >
                                        <Select
                                            mode="tags"
                                            style={{ width: '100%' }}
                                            placeholder="VD: C#, ReactJS, SQL Server..."
                                            options={standardSkills}
                                            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                            tokenSeparators={[',']}
                                        />
                                    </Form.Item>

                                    {/* 🌟 CẬP NHẬT: CẢ 3 Ố NHẬP XẾP HÀNG DỌC FULL-WIDTH KÈM AUTOSIZE CO GIÃN TỰ ĐỘNG */}
                                    <Form.Item 
                                        {...restField} 
                                        label="Mô tả công việc" 
                                        name={[name, 'moTaCongViec']} 
                                        rules={[{ required: true, message: 'Bắt buộc nhập!' }]}
                                    >
                                        <TextArea 
                                            autoSize={{ minRows: 4, maxRows: 10 }} 
                                            placeholder="- Phát triển tính năng mới...&#10;- Bảo trì hệ thống..." 
                                        />
                                    </Form.Item>

                                    <Form.Item 
                                        {...restField} 
                                        label="Yêu cầu ứng viên" 
                                        name={[name, 'yeuCauUngVien']} 
                                        rules={[{ required: true, message: 'Bắt buộc nhập!' }]}
                                    >
                                        <TextArea 
                                            autoSize={{ minRows: 4, maxRows: 10 }} 
                                            placeholder="- Tối thiểu 1 năm kinh nghiệm...&#10;- Tốt nghiệp chuyên ngành CNTT..." 
                                        />
                                    </Form.Item>

                                    <Form.Item 
                                        {...restField} 
                                        label="Quyền lợi được hưởng" 
                                        name={[name, 'quyenLoi']} 
                                        rules={[{ required: true, message: 'Bắt buộc nhập!' }]}
                                    >
                                        <TextArea 
                                            autoSize={{ minRows: 3, maxRows: 8 }} 
                                            placeholder="BHXH đầy đủ, Lương tháng 13, Du lịch hằng năm..." 
                                        />
                                    </Form.Item>
                                </Card>
                            ))}

                            <Form.Item>
                                <Button type="dashed" onClick={() => add({ loaiLuong: 'khoang', soLuongTuyen: 1 })} block icon={<PlusOutlined />} style={{ height: 50, borderColor: '#1890ff', color: '#1890ff', fontSize: 16 }}>
                                    Thêm vị trí công việc
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Divider />

                <div style={{ textAlign: 'right', marginTop: 20 }}>
                    <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} loading={loading} style={{ height: 50, fontSize: 16, width: 250 }}>
                        Gửi duyệt chiến dịch
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default PostJob;