import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import servicePackage from '../../services/servicePackage';
import { toast } from 'react-toastify';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    
    const [executingPurchase, setExecutingPurchase] = useState(false);
    const [returnUrl, setReturnUrl] = useState('/employer/wallet');
    const [btnText, setBtnText] = useState('Quay lại Ví');

    useEffect(() => {
        const handlePostPaymentFlow = async () => {
            // 1. Kiểm tra mảnh bánh mì đường dẫn quay lại
            const prevPath = localStorage.getItem('payment_redirect');
            let actualReturnUrl = '/employer/wallet';
            
            if (prevPath) {
                actualReturnUrl = prevPath;
                setReturnUrl(prevPath);
                if (prevPath.includes('service-package')) {
                    setBtnText('Quay lại Cửa hàng gói');
                }
                localStorage.removeItem('payment_redirect'); // Dọn dẹp
            }

            // 2. KIỂM TRA XEM CÓ GÓI NÀO ĐANG CHỜ MUA TỰ ĐỘNG KHÔNG
            const pendingPackageId = localStorage.getItem('pending_purchase_package_id');
            if (pendingPackageId) {
                localStorage.removeItem('pending_purchase_package_id'); // Xóa vết ngay lập tức để tránh loop vô hạn
                setExecutingPurchase(true);
                toast.info("Đang tự động kích hoạt gói dịch vụ bạn đã chọn...");
                
                try {
                    // Chờ 1.5 giây để Backend nhận được IPN từ MoMo và cập nhật tiền vào ví trước
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Gọi API mua gói
                    const res = await servicePackage.purchasePackage(parseInt(pendingPackageId, 10));
                    toast.success(res.message || "Đã tự động kích hoạt gói dịch vụ thành công!");
                    
                    // Đưa thẳng nhà tuyển dụng về trang quản lý dịch vụ để xem kết quả gói mới
                    navigate('/employer/service-package');
                } catch (error) {
                    console.error("Lỗi tự động mua gói:", error);
                    toast.error(error.response?.data?.message || "Tiền đã nạp nhưng kích hoạt gói tự động thất bại, vui lòng mua thủ công!");
                } finally {
                    setExecutingPurchase(false);
                }
            }
        };

        handlePostPaymentFlow();
    }, [navigate]);

    if (executingPurchase) {
        return (
            <div style={{ textAlign: 'center', marginTop: '150px' }}>
                <Spin size="large" tip="Đang xác thực giao dịch và kích hoạt gói dịch vụ tự động..." />
                <h3 style={{ marginTop: 20, color: '#1890ff' }}>Vui lòng không tắt hoặc reload trình duyệt...</h3>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Result
                status="success"
                title="🎉 Nạp Tiền Vào Ví Thành Công!"
                subTitle={`Mã đơn hàng MoMo: ${orderId}. Số dư của bạn đã được cập nhật hệ thống ngầm.`}
                extra={[
                    <Button type="primary" key="console" size="large">
                        <Link to={returnUrl}>{btnText}</Link>
                    </Button>
                ]}
            />
        </div>
    );
};

export default PaymentSuccess;