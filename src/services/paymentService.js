import apiClient from '../api/apiClient';

const paymentService = {
    createPaymentUrl: (maUser, soTien, maGoi = null) => {
        return apiClient.post('/Payment/create', null, {
            params: { maUser, soTien, maGoi }
        });
    },

    checkStatus: (orderId, maUser, maGoi = null) => {
        return apiClient.get('/Payment/check-status', {
            params: { orderId, maUser, maGoi }
        });
    },

    // Bổ sung API confirmFallback
    confirmFallback: (data) => {
        return apiClient.post('/Payment/confirm-fallback', data);
    }
};

export default paymentService;