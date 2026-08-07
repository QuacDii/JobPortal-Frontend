import apiClient from '../api/apiClient';

const paymentService = {
    // Tạo URL MoMo
    createPaymentUrl: (maUser, soTien, maGoi = null) => {
        return apiClient.post('/Payment/create', null, {
            params: { maUser, soTien, maGoi }
        });
    },

    // Bổ sung: Tạo URL VNPay
    createVnPayUrl: (maUser, soTien, maGoi = null) => {
        return apiClient.post('/Payment/create-vnpay-url', {
            maUser: Number(maUser),
            maGoi: maGoi ? Number(maGoi) : 0,
            soTien: Number(soTien)
        });
    },

    // Kiểm tra trạng thái giao dịch (dùng chung cho cả MoMo & VNPay)
    checkStatus: (orderId, maUser, maGoi = null) => {
        return apiClient.get('/Payment/check-status', {
            params: { orderId, maUser, maGoi }
        });
    },

    // Giả lập kết quả thanh toán (dùng chung)
    confirmFallback: (data) => {
        return apiClient.post('/Payment/confirm-fallback', data);
    }
};

export default paymentService;