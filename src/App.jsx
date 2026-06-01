import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Wallet from './pages/Wallet/Wallet';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentFailed from './pages/Payment/PaymentFailed';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        <Route path="/" element={<Navigate to="/wallet" replace />} />
        
        {/* Route để test Nạp tiền */}
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
      </Routes>
    </Router>
  );
}

export default App;