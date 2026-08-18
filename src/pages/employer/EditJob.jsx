import React, { useState, useEffect } from 'react';
import { 
    Form, Input, Button, Card, Select, DatePicker, Typography, Row, Col, 
    Divider, message, InputNumber, Cascader, Alert, TreeSelect, Radio, Tag, Space, Spin 
} from 'antd';
import { 
    SaveOutlined, EditOutlined, 
    BulbOutlined, ArrowLeftOutlined, ExclamationCircleOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

const KINH_NGHIEM_OPTIONS = [
    { value: 'Không yêu cầu kinh nghiệm', label: 'Không yêu cầu kinh nghiệm' },
    { value: 'Dưới 1 năm', label: 'Dưới 1 năm' },
    { value: '1 - 2 năm', label: '1 - 2 năm' },
    { value: '2 - 3 năm', label: '2 - 3 năm' },
    { value: '3 - 5 năm', label: '3 - 5 năm' },
    { value: 'Trên 5 năm', label: 'Trên 5 năm' },
];

const EditJob = () => {
    const params = useParams();
    const maTin = params.maTin || params.id;
    const [searchParams] = useSearchParams();
    const targetMaViTri = searchParams.get('maViTri');

    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [pageLoading, setPageLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [standardSkills, setStandardSkills] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [locations, setLocations] = useState([]);
    const [recommendedSkillsMap, setRecommendedSkillsMap] = useState({});

    const parseSalaryString = (luongStr) => {
        if (!luongStr || luongStr.toLowerCase().includes('thỏa thuận')) {
            return { loaiLuong: 'thoa-thuan', donViTienTe: 'VND', luongTu: null, luongDen: null };
        }
        const isUSD = luongStr.toUpperCase().includes('USD') || luongStr.includes('$');
        const donViTienTe = isUSD ? 'USD' : 'VND';

        const numbers = luongStr.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
            return { loaiLuong: 'khoang', donViTienTe, luongTu: parseFloat(numbers[0]), luongDen: parseFloat(numbers[1]) };
        } else if (numbers && numbers.length === 1) {
            return { loaiLuong: 'khoang', donViTienTe, luongTu: parseFloat(numbers[0]), luongDen: null };
        }
        return { loaiLuong: 'thoa-thuan', donViTienTe: 'VND', luongTu: null, luongDen: null };
    };

    useEffect(() => {
        if (!maTin) {
            message.error("Không tìm thấy mã chiến dịch cần chỉnh sửa!");
            navigate('/employer/jobs');
            return;
        }

        const loadInitialData = async () => {
            setPageLoading(true);
            try {
                const [resSkills, resInd, resLoc] = await Promise.all([
                    apiClient.get('/recruitment/skills').catch(() => null),
                    apiClient.get('/NganhNghe/tree').catch(() => []),
                    apiClient.get('/recruitment/locations').catch(() => [])
                ]);

                if (resSkills) {
                    const skillPayload = resSkills?.data || resSkills;
                    const rawSkills = skillPayload?.all || skillPayload || [];
                    setStandardSkills(Array.isArray(rawSkills) ? rawSkills.map(item => ({ label: item.label || item.tenKyNang, value: item.value || item.tenKyNang })) : []);
                }

                if (resInd) {
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
                }

                if (resLoc) {
                    setLocations(Array.isArray(resLoc) ? resLoc.map(tp => ({
                        label: tp.tenTP || tp.tenTp || tp.label,
                        value: tp.maTP || tp.maTp || tp.value,
                        children: (tp.phuongXas || tp.phuongXasNavigation || tp.children || []).map(px => ({
                            label: px.tenPhuong || px.label,
                            value: px.maPhuong || px.value
                        }))
                    })) : []);
                }

                const resJob = await apiClient.get(`/recruitment/job-campaign/${maTin}`);
                const jobData = resJob?.data?.data || resJob?.data || resJob;

                if (jobData) {
                    let allPositions = jobData.danhSachViTri || [];
                    let filteredPositions = [];
                    if (targetMaViTri) {
                        filteredPositions = allPositions.filter(v => String(v.maViTri) === String(targetMaViTri));
                    } else {
                        const rejectedOnly = allPositions.filter(v => v.trangThai === 3);
                        filteredPositions = rejectedOnly.length > 0 ? rejectedOnly : allPositions;
                    }

                    const formattedPositions = filteredPositions.map((pos, idx) => {
                        const salaryInfo = parseSalaryString(pos.luong);
                        if (pos.maNganh) handleIndustryChange(pos.maNganh, idx);

                        return {
                            maViTri: pos.maViTri,
                            tenViTri: pos.tenViTri,
                            capBac: pos.capBac,
                            kinhNghiem: pos.kinhNghiem || null, // 🌟 Nạp kinh nghiệm
                            soLuongTuyen: pos.soLuongTuyen,
                            loaiLuong: salaryInfo.loaiLuong,
                            donViTienTe: salaryInfo.donViTienTe,
                            luongTu: salaryInfo.luongTu,
                            luongDen: salaryInfo.luongDen,
                            maNganh: pos.maNganh,
                            maPhuong: pos.maPhuong,
                            ngayHetHan: pos.ngayHetHan ? dayjs(pos.ngayHetHan) : null,
                            danhSachKyNang: pos.danhSachKyNang || [],
                            moTaCongViec: pos.moTaCongViec,
                            yeuCauUngVien: pos.yeuCauUngVien,
                            quyenLoi: pos.quyenLoi,
                            trangThai: pos.trangThai,
                            lyDoTuChoi: pos.lyDoTuChoi
                        };
                    });

                    form.setFieldsValue({
                        tieuDeChienDich: jobData.tieuDeChienDich,
                        ngayHetHan: jobData.ngayHetHan ? dayjs(jobData.ngayHetHan) : null,
                        danhSachViTri: formattedPositions
                    });
                }
            } catch (error) {
                message.error(error?.response?.data?.message || 'Lỗi khi tải thông tin chiến dịch!');
                navigate('/employer/jobs');
            } finally {
                setPageLoading(false);
            }
        };

        loadInitialData();
    }, [maTin, targetMaViTri]);

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
            console.error("Lỗi gợi ý kỹ năng:", error);
        }
    };

    const onFinish = async (values) => {
        setSubmitting(true);
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
                        maViTri: pos.maViTri || null,
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
                        ngayHetHan: pos.ngayHetHan ? pos.ngayHetHan.format('YYYY-MM-DD') : null,
                        danhSachKyNang: pos.danhSachKyNang || [],
                        nganhNgheKhac: pos.nganhNgheKhac || null
                    };
                })
            };

            const response = await apiClient.put(`/recruitment/update-job/${maTin}`, payload);
            if (response?.data?.success || response?.success) {
                message.success(response?.data?.message || response?.message || 'Cập nhật và gửi duyệt lại thành công!');
                navigate('/employer/jobs');
            }
        } catch (error) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin!');
        } finally {
            setSubmitting(false);
        }
    };

    if (pageLoading) return <div style={{ textAlign: 'center', padding: '120px 0' }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>;

    return (
        <div style={{ padding: '24px', maxWidth: '1050px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Space size={12}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employer/jobs')}>
                        Quay lại danh sách
                    </Button>
                    <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
                        <EditOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                        {targetMaViTri ? `Chỉnh sửa Vị trí Tuyển dụng #${targetMaViTri}` : `Chỉnh sửa Chiến dịch #${maTin}`}
                    </Title>
                </Space>
            </div>

            <Form layout="vertical" form={form} onFinish={onFinish}>
                <Card title="Thông tin chiến dịch" style={{ marginBottom: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <Row gutter={24}>
                        <Col span={16}>
                            <Form.Item label="Tiêu đề chiến dịch" name="tieuDeChienDich" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề chiến dịch!' }]}>
                                <Input size="large" placeholder="VD: Tuyển dụng nhân sự Quý 3/2026" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Hạn chót toàn chiến dịch" name="ngayHetHan" rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn!' }]}>
                                <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(current) => current && current <= dayjs().endOf('day')} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Form.List name="danhSachViTri">
                    {(fields) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => {
                                const currentPosition = form.getFieldValue(['danhSachViTri', name]);
                                const isRejected = currentPosition?.trangThai === 3;

                                return (
                                    <Card
                                        key={key}
                                        style={{ 
                                            marginBottom: 24, 
                                            borderRadius: 10, 
                                            border: isRejected ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                        }}
                                        title={
                                            <Space size={8}>
                                                <Text strong style={{ color: '#1677ff', fontSize: 16 }}>Vị trí cần điều chỉnh #{index + 1}</Text>
                                                {isRejected && <Tag color="error">Bị từ chối (Cần sửa)</Tag>}
                                                {currentPosition?.trangThai === 0 && <Tag color="warning">Chờ duyệt</Tag>}
                                            </Space>
                                        }
                                    >
                                        <Form.Item {...restField} name={[name, 'maViTri']} hidden>
                                            <Input />
                                        </Form.Item>

                                        {isRejected && (
                                            <Alert
                                                type="error"
                                                showIcon
                                                icon={<ExclamationCircleOutlined />}
                                                message={<b>Lý do Ban Quản Trị từ chối vị trí này:</b>}
                                                description={currentPosition?.lyDoTuChoi || "Vui lòng điều chỉnh lại thông tin mô tả/mức lương cho phù hợp tiêu chuẩn."}
                                                style={{ marginBottom: 20, borderRadius: 6 }}
                                            />
                                        )}

                                        <Row gutter={24}>
                                            <Col span={12}>
                                                <Form.Item {...restField} label="Tên vị trí (Chức danh)" name={[name, 'tenViTri']} rules={[{ required: true, message: 'Bắt buộc nhập tên vị trí!' }]}>
                                                    <Input placeholder="VD: Frontend Developer (ReactJS)" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} label="Hạn chót vị trí này" name={[name, 'ngayHetHan']}>
                                                    <DatePicker placeholder="Hạn nhận CV vị trí này" format="DD/MM/YYYY" style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        {/* HÀNG 3 CỘT: CẤP BẬC - KINH NGHIỆM - SỐ LƯỢNG */}
                                        <Row gutter={24}>
                                            <Col span={8}>
                                                <Form.Item {...restField} label="Cấp bậc" name={[name, 'capBac']} rules={[{ required: true, message: 'Vui lòng chọn cấp bậc!' }]}>
                                                    <Select placeholder="-- Chọn cấp bậc --" options={CAP_BAC_OPTIONS} allowClear />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item {...restField} label="Yêu cầu kinh nghiệm" name={[name, 'kinhNghiem']} rules={[{ required: true, message: 'Vui lòng chọn kinh nghiệm!' }]}>
                                                    <Select placeholder="-- Chọn kinh nghiệm --" options={KINH_NGHIEM_OPTIONS} allowClear />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item {...restField} label="Số lượng tuyển" name={[name, 'soLuongTuyen']} rules={[{ required: true, message: 'Bắt buộc nhập số lượng!' }]}>
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
                                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.danhSachViTri?.[name]?.loaiLuong !== curr.danhSachViTri?.[name]?.loaiLuong || prev.danhSachViTri?.[name]?.donViTienTe !== curr.danhSachViTri?.[name]?.donViTienTe}>
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
                                                                <Input disabled value="Mức lương sẽ được thỏa thuận trực tiếp khi phỏng vấn" style={{ backgroundColor: '#fafafa' }} />
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={24}>
                                            <Col span={12}>
                                                <Form.Item {...restField} label="Ngành nghề" name={[name, 'maNganh']} rules={[{ required: true, message: 'Bắt buộc chọn ngành nghề!' }]}>
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
                                                <Form.Item {...restField} label="Khu vực làm việc" name={[name, 'maPhuong']} rules={[{ required: true, message: 'Bắt buộc chọn khu vực!' }]}>
                                                    <Cascader
                                                        options={locations}
                                                        placeholder="Chọn Tỉnh/Thành phố -> Quận/Huyện"
                                                        showSearch={{
                                                            filter: (inputValue, path) => path.some(option => option.label.toLowerCase().includes(inputValue.toLowerCase()))
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        {recommendedSkillsMap[name] && recommendedSkillsMap[name].length > 0 && (
                                            <div style={{ marginBottom: 12, background: '#f6ffed', border: '1px solid #b7eb8f', padding: '10px 14px', borderRadius: 6 }}>
                                                <Text style={{ color: '#389e0d', display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '13px' }}>
                                                    <BulbOutlined style={{ marginRight: 6 }} /> Gợi ý kỹ năng phổ biến:
                                                </Text>
                                                <Space wrap size={[0, 8]}>
                                                    {recommendedSkillsMap[name].map((skillName, idx) => (
                                                        <Tag 
                                                            key={idx} 
                                                            color="green" 
                                                            style={{ cursor: 'pointer', borderRadius: 12, padding: '2px 10px' }}
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
                                            <Select mode="tags" style={{ width: '100%' }} placeholder="VD: ReactJS, C#, SQL..." options={standardSkills} tokenSeparators={[',']} />
                                        </Form.Item>

                                        <Form.Item {...restField} label="Mô tả công việc" name={[name, 'moTaCongViec']} rules={[{ required: true, message: 'Bắt buộc nhập mô tả!' }]}>
                                            <TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
                                        </Form.Item>

                                        <Form.Item {...restField} label="Yêu cầu ứng viên" name={[name, 'yeuCauUngVien']} rules={[{ required: true, message: 'Bắt buộc nhập yêu cầu!' }]}>
                                            <TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
                                        </Form.Item>

                                        <Form.Item {...restField} label="Quyền lợi được hưởng" name={[name, 'quyenLoi']} rules={[{ required: true, message: 'Bắt buộc nhập quyền lợi!' }]}>
                                            <TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
                                        </Form.Item>
                                    </Card>
                                );
                            })}
                        </>
                    )}
                </Form.List>

                <Divider />

                <div style={{ textAlign: 'right' }}>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        size="large" 
                        icon={<SaveOutlined />} 
                        loading={submitting} 
                        style={{ height: 48, minWidth: 260, fontSize: 16, borderRadius: 8 }}
                    >
                        Lưu & Gửi duyệt lại
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EditJob;