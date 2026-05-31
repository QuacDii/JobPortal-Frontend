import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Spin } from 'antd';
import Register from './pages/Register';
import RegisterChoose from './pages/RegisterChoose';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import CvTemplateLibrary from './pages/CvTemplateLibrary';
import CvBuilder from './pages/CvBuilder';

// Import trang đăng nhập
import Login from './pages/Login';

// Import các Layout bảo vệ
import CandidateLayout from './layouts/CandidateLayout';
import AdminLayout from './layouts/AdminLayout';

// Import các trang chức năng thực tế
import Home from './pages/candidate/Home';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // LUỒNG 1: AUTO LOGIN CHAY KHI F5 TRANG
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"] || decoded["VaiTro"];
          setUser({
            maUser: decoded.nameid,
            email: decoded.email,
            vaiTro: role,
            hoTen: decoded.HoTen
          });
        } else {
          localStorage.clear();
        }
      } catch (error) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // LUỒNG 2: SÚT USER KHI TREO MÁY 15 PHÚT
  useEffect(() => {
    if (!user) return;
    let timeoutId;
    const logoutUser = () => {
      localStorage.clear();
      window.location.href = '/login';
    };
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutUser, 15 * 60 * 1000); 
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <Spin size="large" description="Đang khởi tạo ứng dụng..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* TRANG LOGIN */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* CỤM ĐƯỜNG DẪN ĐĂNG KÝ PHÂN TÁCH LỐI VÀO CHUYÊN NGHIỆP */}
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterChoose />} />
        <Route path="/register/:roleType" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* ĐIỀU HƯỚNG GIAO DIỆN THEO ROLE VÀ BỌC TRONG LAYOUT TƯƠNG ỨNG */}
        <Route 
          path="/" 
          element={
            !user ? <Navigate to="/login" replace /> :
            user.vaiTro === "0" ? <Navigate to="/admin/dashboard" replace /> :
            user.vaiTro === "1" ? <Navigate to="/employer/dashboard" replace /> :
            <CandidateLayout user={user}><Home /></CandidateLayout>
          } 
        />

        {/* TRANG ADMIN */}
        <Route 
          path="/admin/dashboard" 
          element={user && user.vaiTro === "0" ? <AdminLayout user={user}><AdminDashboard /></AdminLayout> : <Navigate to="/login" replace />} 
        />

        {/* TRANG NHÀ TUYỂN DỤNG */}
        <Route 
          path="/employer/dashboard" 
          element={user && user.vaiTro === "1" ? <AdminLayout user={user}><EmployerDashboard /></AdminLayout> : <Navigate to="/login" replace />} 
        />

        <Route path="/thu-vien-cv" element={
          <CandidateLayout>
            <CvTemplateLibrary />
          </CandidateLayout>
        } />

        {/* Route cho trang Tạo CV (Builder) */}
        <Route path="/tao-cv" element={
          <CandidateLayout>
            <CvBuilder />
          </CandidateLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;