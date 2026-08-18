import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, Typography, Row, Col, Divider, message, InputNumber, Cascader, Alert, TreeSelect, Radio, Tag, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, SendOutlined, RocketOutlined, BulbOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

export const KINH_NGHIEM_OPTIONS = [
    { value: 'Không yêu cầu kinh nghiệm', label: 'Không yêu cầu kinh nghiệm' },
    { value: 'Dưới 1 năm', label: 'Dưới 1 năm' },
    { value: '1 - 2 năm', label: '1 - 2 năm' },
    { value: '2 - 3 năm', label: '2 - 3 năm' },
    { value: '3 - 5 năm', label: '3 - 5 năm' },
    { value: 'Trên 5 năm', label: 'Trên 5 năm' },
];

const PostJob = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [standardSkills, setStandardSkills] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [locations, setLocations] = useState([]);
    const [recommendedSkillsMap, setRecommendedSkillsMap] = useState({});

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
                setIndustries(rawTree.map(parent => ({
                    title: parent.tenNganh || parent.tenNganhCha || 'Ngành nghề',
                    value: `cha_${parent.maNganh || parent.maNganhCha}`,
                    selectable: false,
                    children: (parent.danhSachCon || parent.nganhNgheCons || parent.children || []).map(child => ({
                        title: child.tenNganh || child.tenNganhCon,
                        value: child.maNganh || child.maNganhCon
                    }))
                })));
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
            setRecommendedSkillsMap(prev => ({
                ...prev,
                [posIndex]: payload?.recommended || []
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
                        const donVi = pos.donViTienTe === 'USD' ? 'USD' : 'Triệu';
                        if (pos.luongTu && pos.luongDen) {
                            luongText = `${pos.luongTu} - ${pos.luongDen} ${donVi}`;
                        } else if (pos.luongTu) {
                            luongText = `Từ ${pos.luongTu} ${donVi}`;
                        } else if (pos.luongDen) {
                            luongText = `Đến ${pos.luongDen} ${donVi}`;
                        }
                    }
                    return {
                        tenViTri: pos.tenViTri,
                        capBac: pos.capBac,
                        kinhNghiem: pos.kinhNghiem, // 🌟 Gửi kinh nghiệm
                        soLuongTuyen: pos.soLuongTuyen,
                        luong: luongText,
                        moTaCongViec: pos.moTaCongViec,
                        yeuCauUngVien: pos.yeuCauUngVien,
                        quyenLoi: pos.quyenLoi,
                        maNganh: pos.maNganh,
                        maPhuong: Array.isArray(pos.maPhuong) ? pos.maPhuong[pos.maPhuong.length - 1] : pos.maPhuong,
                        danhSachKyNang: pos.danhSachKyNang || [],
                        nganhNgheKhac: pos.nganhNgheKhac || null,
                        ngayHetHan: pos.ngayHetHan ? pos.ngayHetHan.format('YYYY-MM-DD') : null
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
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng tin!');
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
                description="Vui lòng mô tả thông tin vị trí việc làm, kinh nghiệm, yêu cầu ứng viên và quyền lợi đầy đủ để hệ thống AI đối chiếu và chấm điểm matching chính xác nhất."
                type="info"
                showIcon
                style={{ marginBottom: 24, borderRadius: 6 }}
            />
            <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
                initialValues={{ danhSachViTri: [{ loaiLuong: 'khoang', donViTienTe: 'VND'}] }}
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
                                            if (!value || value.isAfter(dayjs(), 'day')) return Promise.resolve();
                                            return Promise.reject(new Error('Ngày hết hạn phải lớn hơn ngày hiện tại!'));
                                        }
                                    }
                                ]}
                            >
                                <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(current) => current && current <= dayjs().endOf('day')} />
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
                                                label="Hạn chót vị trí này (Tùy chọn)"
                                                name={[name, 'ngayHetHan']}
                                                tooltip="Nếu để trống, vị trí sẽ tự động áp dụng ngày hết hạn của toàn chiến dịch"
                                            >
                                                <DatePicker 
                                                    placeholder="Hạn nhận CV vị trí này" 
                                                    format="DD/MM/YYYY" 
                                                    style={{ width: '100%' }} 
                                                    disabledDate={(current) => {
                                                        const campaignDeadline = form.getFieldValue('ngayHetHan');
                                                        if (!current) return false;
                                                        if (current <= dayjs().endOf('day')) return true;
                                                        if (campaignDeadline && current.isAfter(campaignDeadline, 'day')) return true;
                                                        return false;
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* HÀNG 3 CỘT CÂN ĐỐI: CẤP BẬC - KINH NGHIỆM - SỐ LƯỢNG */}
                                    <Row gutter={24}>
                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                label="Cấp bậc"
                                                name={[name, 'capBac']}
                                                rules={[{ required: true, message: 'Vui lòng chọn cấp bậc!' }]}
                                            >
                                                <Select placeholder="-- Chọn cấp bậc --" options={CAP_BAC_OPTIONS} allowClear />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                label="Yêu cầu kinh nghiệm"
                                                name={[name, 'kinhNghiem']}
                                                rules={[{ required: true, message: 'Vui lòng chọn kinh nghiệm!' }]}
                                            >
                                                <Select placeholder="-- Chọn kinh nghiệm --" options={KINH_NGHIEM_OPTIONS} allowClear />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                label="Số lượng tuyển"
                                                name={[name, 'soLuongTuyen']}
                                                rules={[{ required: true, message: 'Bắt buộc nhập số lượng!' }]}
                                            >
                                                <InputNumber min={1} style={{ width: '100%' }} placeholder="VD: 2" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* MỨC LƯƠNG */}
                                    <Row gutter={24}>
                                        <Col span={7}>
                                            <Form.Item {...restField} label="Hình thức lương" name={[name, 'loaiLuong']} initialValue="khoang">
                                                <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                                                    <Radio.Button value="khoang" style={{ width: '50%', textAlign: 'center' }}>Khoảng lương</Radio.Button>
                                                    <Radio.Button value="thoa-thuan" style={{ width: '50%', textAlign: 'center' }}>Thỏa thuận</Radio.Button>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                        <Col span={17}>
                                            <Form.Item
                                                noStyle
                                                shouldUpdate={(prevValues, currentValues) => {
                                                    const prev = prevValues.danhSachViTri?.[name];
                                                    const curr = currentValues.danhSachViTri?.[name];
                                                    return prev?.loaiLuong !== curr?.loaiLuong || prev?.donViTienTe !== curr?.donViTienTe;
                                                }}
                                            >
                                                {({ getFieldValue }) => {
                                                    const loaiLuong = getFieldValue(['danhSachViTri', name, 'loaiLuong']) || 'khoang';
                                                    const donViTienTe = getFieldValue(['danhSachViTri', name, 'donViTienTe']) || 'VND';
                                                    const isUSD = donViTienTe === 'USD';

                                                    if (loaiLuong === 'khoang') {
                                                        return (
                                                            <Row gutter={12}>
                                                                <Col span={6}>
                                                                    <Form.Item {...restField} label="Loại tiền" name={[name, 'donViTienTe']} initialValue="VND">
                                                                        <Select options={[{ label: 'VNĐ (Triệu)', value: 'VND' }, { label: 'USD ($)', value: 'USD' }]} />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={9}>
                                                                    <Form.Item {...restField} label="Lương từ" name={[name, 'luongTu']} rules={[{ required: true, message: 'Nhập lương từ!' }]}>
                                                                        <InputNumber min={0} style={{ width: '100%' }} placeholder={isUSD ? "VD: 500" : "VD: 15"} addonAfter={isUSD ? "$" : "Triệu"} />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={9}>
                                                                    <Form.Item {...restField} label="Lương đến" name={[name, 'luongDen']} rules={[{ required: true, message: 'Nhập lương đến!' }]}>
                                                                        <InputNumber min={0} style={{ width: '100%' }} placeholder={isUSD ? "VD: 1200" : "VD: 25"} addonAfter={isUSD ? "$" : "Triệu"} />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>
                                                        );
                                                    }
                                                    return (
                                                        <Form.Item label="Chi tiết mức lương">
                                                            <Input disabled value="Mức lương sẽ được thỏa thuận trực tiếp khi phỏng vấn" style={{ backgroundColor: '#fafafa', color: '#595959' }} />
                                                        </Form.Item>
                                                    );
                                                }}
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item {...restField} label="Ngành nghề" name={[name, 'maNganh']} rules={[{ required: true, message: 'Bắt buộc chọn!' }]}>
                                                <TreeSelect
                                                    treeData={industries}
                                                    placeholder="Chọn Ngành cha -> Ngành con"
                                                    showSearch
                                                    treeNodeFilterProp="title"
                                                    style={{ width: '100%' }}
                                                    dropdownStyle={{ maxHeight: 350, overflow: 'auto' }}
                                                    onChange={(val) => handleIndustryChange(val, name)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item {...restField} label="Khu vực làm việc" name={[name, 'maPhuong']} rules={[{ required: true, message: 'Bắt buộc chọn!' }]}>
                                                <Cascader options={locations} placeholder="Chọn Tỉnh/Thành phố -> Quận/Huyện" showSearch={{ filter: (inputValue, path) => path.some(option => option.label.toLowerCase().includes(inputValue.toLowerCase())) }} />
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

                                    <Form.Item {...restField} label="Kỹ năng yêu cầu" name={[name, 'danhSachKyNang']} rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 kỹ năng!' }]}>
                                        <Select mode="tags" style={{ width: '100%' }} placeholder="VD: C#, ReactJS, SQL Server..." options={standardSkills} tokenSeparators={[',']} />
                                    </Form.Item>

                                    <Form.Item {...restField} label="Mô tả công việc" name={[name, 'moTaCongViec']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                        <TextArea autoSize={{ minRows: 4, maxRows: 10 }} placeholder="- Phát triển tính năng mới...&#10;- Bảo trì hệ thống..." />
                                    </Form.Item>

                                    <Form.Item {...restField} label="Yêu cầu ứng viên" name={[name, 'yeuCauUngVien']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                        <TextArea autoSize={{ minRows: 4, maxRows: 10 }} placeholder="- Tốt nghiệp chuyên ngành CNTT...&#10;- Có tư duy logic tốt..." />
                                    </Form.Item>

                                    <Form.Item {...restField} label="Quyền lợi được hưởng" name={[name, 'quyenLoi']} rules={[{ required: true, message: 'Bắt buộc nhập!' }]}>
                                        <TextArea autoSize={{ minRows: 3, maxRows: 8 }} placeholder="BHXH đầy đủ, Lương tháng 13, Du lịch hằng năm..." />
                                    </Form.Item>
                                </Card>
                            ))}

                            <Form.Item>
                                <Button type="dashed" onClick={() => add({ loaiLuong: 'khoang', donViTienTe: 'VND' })} block icon={<PlusOutlined />} style={{ height: 50, borderColor: '#1890ff', color: '#1890ff', fontSize: 16 }}>
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