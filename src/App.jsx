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
import ManageCv from './pages/ManageCv';
import TemplatePreview from './pages/TemplatePreview';
import Login from './pages/Login';
import ViewCv from './pages/ViewCv';

// Import các Layout bảo vệ
import CandidateLayout from './Layouts/CandidateLayout';
import AdminLayout from './Layouts/AdminLayout';

// Import các trang chức năng thực tế
import Home from './pages/Candidate/Home';
import EmployerDashboard from './pages/Employer/EmployerDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';

// Import trang thanh toán và ví
import Wallet from './pages/Wallet/Wallet';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentFailed from './pages/Payment/PaymentFailed';
import ServicePackage from './pages/Employer/ServicePackage';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // LUỒNG 1: AUTO LOGIN CHẠY KHI F5 TRANG
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

  // LUỒNG 2: SÚT USER KHI TREO MÁY 15 PHÚT INACTIVITY
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
        <Spin size="large" tip="Đang khởi tạo ứng dụng..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* TRANG LOGIN */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* CỤM ĐƯỜNG DẪN ĐĂNG KÝ */}
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterChoose />} />
        <Route path="/register/:roleType" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ĐIỀU HƯỚNG GIAO DIỆN THEO ROLE */}
        <Route
          path="/"
          element={
            user && user.vaiTro === "0" ? <Navigate to="/admin/dashboard" replace /> :
              user && user.vaiTro === "1" ? <Navigate to="/employer/dashboard" replace /> :
                <CandidateLayout user={user}><Home /></CandidateLayout>
          }
        />

        {/* ================= TRANG ADMIN ================= */}
        <Route
          path="/admin/dashboard"
          element={user && user.vaiTro === "0" ? <AdminLayout user={user}><AdminDashboard /></AdminLayout> : <Navigate to="/login" replace />}
        />

        {/* ================= TRANG NHÀ TUYỂN DỤNG ================= */}
        <Route
          path="/employer/dashboard"
          element={user && user.vaiTro === "1" ? <AdminLayout user={user}><EmployerDashboard /></AdminLayout> : <Navigate to="/login" replace />}
        />

        {/* Đuôi Ví và Gói dịch vụ của Nhà tuyển dụng */}
        <Route
          path="/employer/wallet"
          element={user && user.vaiTro === "1" ? <AdminLayout user={user}><Wallet /></AdminLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/employer/service-package"
          element={user && user.vaiTro === "1" ? <AdminLayout user={user}><ServicePackage /></AdminLayout> : <Navigate to="/login" replace />}
        />

        {/* ================= TRANG ỨNG VIÊN ================= */}
        <Route
          path="/manage-cv"
          element={user ? <CandidateLayout user={user}><ManageCv /></CandidateLayout> : <Navigate to="/login" replace />}
        />
        <Route path="/xem-cv/:id" element={<ViewCv />} />

        <Route path="/thu-vien-cv" element={<CandidateLayout user={user}><CvTemplateLibrary /></CandidateLayout>} />

        {/* 2. Đổi tên Route thành /builder (hoặc khai báo cả 2) để khớp với lệnh chuyển trang */}
        <Route path="/builder" element={<CandidateLayout user={user}><CvBuilder /></CandidateLayout>} />
        <Route path="/tao-cv" element={<CandidateLayout user={user}><CvBuilder /></CandidateLayout>} />

        {/* 👉 ĐÃ BỔ SUNG: Khai báo Route cho TemplatePreview để dùng được tính năng xem trước CV */}
        <Route path="/xem-truoc-cv/:id" element={<CandidateLayout user={user}><TemplatePreview /></CandidateLayout>} />

        {/* ================= CÁC TRANG CALLBACK THANH TOÁN ================= */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* ĐIỀU HƯỚNG ĐƯỜNG DẪN SAI */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;