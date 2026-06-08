import axiosClient from './axiosClient';

const servicePackage = {
    getPackages: () => {
        return axiosClient.get('/Service/packages');
    },
    purchasePackage: (maGoi) => {
        return axiosClient.post('/Service/purchase', { maGoi });
    },
    getHistory: () => {
        return axiosClient.get('/Service/history');
    },
    getBalance: () => {
        return axiosClient.get('/Service/balance');
    }
};

export default servicePackage;