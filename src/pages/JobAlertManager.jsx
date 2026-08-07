import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import './css/JobAlertManager.css';
import { Typography, Select, Input, Button, Switch, Popconfirm, Spin, message, Row, Col, Empty } from 'antd';
import { BellFilled, PlusOutlined, DeleteOutlined, CheckCircleFilled } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);
        return {
            userId: decoded.nameid || decoded.maUser || decoded.id || decoded.sub
        };
    } catch (error) {
        return null;
    }
};

const JobAlertManager = () => {
    const [alertsList, setAlertsList] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem('token');
    const userInfo = getUserInfoFromToken(token);
    const userId = userInfo?.userId;

    const fetchCategories = async () => {
        try {
            const res = await apiClient.get('/NganhNghe');
            const data = res.data !== undefined ? res.data : res;
            setCategoriesList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi lấy danh sách ngành nghề:", err);
        }
    };

    const fetchMyAlerts = async () => {
        if (!userId) return setLoading(false);
        setLoading(true);
        try {
            // Sửa Route lấy danh sách
            const res = await apiClient.get(`/JobAlerts/user/${userId}`);
            const data = res.data !== undefined ? res.data : res;
            setAlertsList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi lấy danh sách Job Alerts:", err);
            setAlertsList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchMyAlerts();
    }, []);

   const handleAddAlert = async () => {
    // 1. Kiểm tra xem Email của User có phải Email thật không
    const userEmail = currentUser?.email || '';
    if (userEmail.includes('@facebook.com') || !userEmail) {
        Modal.confirm({
            title: 'Cần có Email chính thức',
            content: 'Email hiện tại của bạn là email tạm thời từ Facebook nên không thể nhận thư. Vui lòng nhập Email chính thức để bật Job Alerts:',
            okText: 'Lưu Email & Tiếp tục',
            cancelText: 'Hủy',
            content: (
                <Input 
                    placeholder="Nhập email thực tế của bạn (VD: nguyenvana@gmail.com)" 
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    style={{ marginTop: 12 }}
                />
            ),
            onOk: async () => {
                // Gọi API cập nhật Email thật vào CSDL
                await apiClient.put('/User/update-email', { newEmail: newEmailInput });
                message.success('Cập nhật Email thành công!');
                // Tiếp tục thực hiện lưu Job Alert
                executeAddAlert();
            }
        });
        return;
    }

    executeAddAlert();
};
    const handleToggleAlert = async (id, currentStatus) => {
        try {
            await apiClient.put(`/JobAlerts/toggle/${id}`, { trangThai: !currentStatus });
            setAlertsList(alertsList.map(item => (item.maAlert || item.id) === id ? { ...item, trangThai: !currentStatus, isEnabled: !currentStatus } : item));
            message.success('Cập nhật trạng thái thành công!');
        } catch (err) {
            message.error('Cập nhật trạng thái thất bại!');
        }
    };

    const handleDeleteAlert = async (id) => {
        try {
            await apiClient.delete(`/JobAlerts/${id}`);
            message.success('Đã xóa thông báo việc làm!');
            setAlertsList(alertsList.filter(item => (item.maAlert || item.id) !== id));
        } catch (err) {
            message.error('Xóa thông báo thất bại!');
        }
    };

    return (
        <div className="job-alert-modal-container">
            <div className="job-alert-header">
                <div className="job-alert-icon-wrapper">
                    <BellFilled />
                </div>
                <div>
                    <Title level={4} style={{ margin: '0 0 4px 0', color: '#262626', fontWeight: 700 }}>
                        Cài đặt Job Alerts
                    </Title>
                    <Text style={{ color: '#8c8c8c', fontSize: '13.5px' }}>
                        Hệ thống sẽ gửi email tự động các việc làm phù hợp nhất cho bạn hàng ngày
                    </Text>
                </div>
            </div>

            <div className="job-alert-add-box">
                <Text style={{ color: '#595959', fontSize: '13.5px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                    Thêm ngành nghề quan tâm
                </Text>
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={11}>
                        <Select
                            placeholder="Chọn ngành nghề..."
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val)}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            {categoriesList.map(cat => (
                                <Option key={cat.maNganh} value={cat.maNganh}>{cat.tenNganh}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={9}>
                        <Input
                            placeholder="Từ khóa (VD: ReactJS, Java...)"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </Col>
                    <Col xs={24} sm={4}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            block
                            loading={submitting}
                            onClick={handleAddAlert}
                            className="btn-add-alert"
                            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                        >
                            Thêm
                        </Button>
                    </Col>
                </Row>
            </div>

            <Text style={{ color: '#262626', fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '16px' }}>
                Danh sách đang theo dõi ({alertsList.length})
            </Text>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}><Spin /></div>
            ) : alertsList.length === 0 ? (
                <Empty description={<span style={{ color: '#8c8c8c' }}>Bạn chưa cài đặt thông báo việc làm nào.</span>} />
            ) : (
                <div>
                    {alertsList.map((item) => {
                        const alertId = item.maAlert || item.id;
                        const isEnabled = item.trangThai !== undefined ? item.trangThai : item.isEnabled;
                        const categoryName = categoriesList.find(c => c.maNganh === item.maNganh)?.tenNganh || item.tenNganh || 'Ngành nghề';
                        const keywordText = item.tuKhoaKyNang || item.tuKhoa;

                        return (
                            <div key={alertId} className={`job-alert-item-card ${isEnabled ? 'active' : ''}`}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isEnabled && <CheckCircleFilled style={{ color: '#00b14f', fontSize: '16px' }} />}
                                    <div>
                                        <Text style={{ color: '#262626', fontWeight: 600, fontSize: '14.5px', display: 'block' }}>
                                            {categoryName}
                                        </Text>
                                        {keywordText && (
                                            <Text style={{ color: '#8c8c8c', fontSize: '12.5px' }}>
                                                Từ khóa: <strong style={{ color: '#1890ff' }}>{keywordText}</strong>
                                            </Text>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Switch
                                        checked={isEnabled}
                                        onChange={() => handleToggleAlert(alertId, isEnabled)}
                                        style={{ background: isEnabled ? '#00b14f' : '#bfbfbf' }}
                                    />
                                    <Popconfirm
                                        title="Xóa cài đặt thông báo này?"
                                        onConfirm={() => handleDeleteAlert(alertId)}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <DeleteOutlined className="btn-delete-alert" />
                                    </Popconfirm>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default JobAlertManager;