import apiClient from '../api/apiClient';

const servicePackage = {
    getEmployerPackages: () => {
        return apiClient.get('/Service/employer-packages');
    },
    getCandidatePackages: () => apiClient.get('/Service/candidate-packages'),

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