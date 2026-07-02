import apiClient from '../api/apiClient';

const paymentService = {
    // Gọi API lấy đường dẫn (URL) quét mã QR của MoMo
    createPaymentUrl: (maUser, soTien) => {
        // Vì Backend chúng ta nhận tham số trực tiếp (không qua DTO) nên sẽ gửi dưới dạng query parameters
        return apiClient.post('/Payment/create', null, {
            params: {
                maUser: maUser,
                soTien: soTien
            }
        });
    }
};

export default paymentService;