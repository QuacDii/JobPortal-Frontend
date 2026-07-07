import apiClient from '../api/apiClient';

const servicePackage = {
    getPackages: () => {
        return apiClient.get('/Service/packages');
    },
    purchasePackage: (maGoi) => {
        return apiClient.post('/Service/purchase', { maGoi });
    },
    getHistory: () => {
        return apiClient.get('/Service/history');
    },
    getBalance: () => {
        return apiClient.get('/Service/balance');
    }
};

export default servicePackage;