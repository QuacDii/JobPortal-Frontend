import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Spin } from 'antd';
import apiClient from './api/apiClient';

import Register from './pages/Register';
import RegisterChoose from './pages/RegisterChoose';
import ResetPassword from './pages/ResetPassword';
import JobDetail from './pages/JobDetail';
import ForgotPassword from './pages/ForgotPassword';
import CvTemplateLibrary from './pages/CvTemplateLibrary';
import CvBuilder from './pages/CvBuilder';
import UpgradeVip from './pages/UpgradeVip';
import ManageCv from './pages/ManageCv';
import TemplatePreview from './pages/TemplatePreview';
import Login from './pages/Login';
import ViewCv from './pages/ViewCv';
import AppliedJobs from './pages/AppliedJobs';
import ApproveCompanies from './pages/Admin/ApproveCompanies';
import ApproveCampaigns from './pages/Admin/ApproveCampaigns';
import EmployerOnboarding from './pages/Employer/EmployerOnboarding';

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

import CompanyProfile from './pages/Employer/CompanyProfile';
import PostJob from './pages/Employer/PostJob';
import CandidateFunnel from './pages/Employer/CandidateFunnel';
import EmployerJobs from './components/EmployerJobs';
import CandidateAiDetail from './pages/Employer/CandidateAiDetail';

import CvHunter from './pages/Employer/CvHunter';
import ServicePackage from './pages/Employer/ServicePackage';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Trạng thái hồ sơ của Nhà tuyển dụng (Mặc định APPROVED để không chặn nhầm Admin / Ứng viên)
  const [employerStatus, setEmployerStatus] = useState("APPROVED");

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

          // ✨ TỰ ĐỘNG CHECK TRẠNG THÁI DOANH NGHIỆP QUA APICLIENT NẾU LÀ NTD (ROLE = 1)
          if (role === "1" || role === 1) {
            apiClient.get('/auth/employer-status')
              .then(res => {
                // Đọc trạng thái (NO_COMPANY, PENDING, APPROVED) trả về từ Server
                const status = res.status || res.data?.status || "NO_COMPANY";
                setEmployerStatus(status);
                setLoading(false); // Chờ có kết quả trạng thái mới tắt Spin Loading
              })
              .catch(() => {
                setEmployerStatus("NO_COMPANY");
                setLoading(false);
              });
            return; // Dừng luồng đồng bộ tại đây để đợi API phản hồi
          }
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

  // HÀM TIỆN ÍCH BỌC BẢO VỆ ROUTE NHÀ TUYỂN DỤNG (CHẶN BẤT HỢP PHÁP NẾU CHƯA DUYỆT)
  const renderEmployerRoute = (element) => {
    if (!user || user.vaiTro !== "1") return <Navigate to="/login" replace />;
    
    // Nếu chưa tạo hồ sơ doanh nghiệp hoặc hồ sơ đang trong trạng thái chờ duyệt
    if (employerStatus === "NO_COMPANY" || employerStatus === "PENDING") {
      return (
        <AdminLayout user={user}>
          <EmployerOnboarding 
            currentStatus={employerStatus} 
            onStatusChange={(newStatus) => setEmployerStatus(newStatus)} 
          />
        </AdminLayout>
      );
    }
    
    // Đã phê duyệt thành công -> Trả về giao diện trang chức năng mong muốn
    return <AdminLayout user={user}>{element}</AdminLayout>;
  };

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
        <Route
          path="/admin/approve-companies"
          element={user && user.vaiTro === "0" ? <AdminLayout user={user}><ApproveCompanies /></AdminLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/approve-campaigns"
          element={user && user.vaiTro === "0" ? <AdminLayout user={user}><ApproveCampaigns /></AdminLayout> : <Navigate to="/login" replace />}
        />

        {/* ================= TRANG NHÀ TUYỂN DỤNG (ĐÃ ĐƯỢC BỌC BẢO VỆ QUA HÀM HỢP NHẤT) ================= */}
        <Route
          path="/employer/dashboard"
          element={renderEmployerRoute(<EmployerDashboard />)}
        />

        {/* Đuôi Ví và Gói dịch vụ của Nhà tuyển dụng */}
        <Route
          path="/employer/wallet"
          element={renderEmployerRoute(<Wallet />)}
        />
        <Route
          path="/employer/jobs"
          element={renderEmployerRoute(<EmployerJobs />)}
        />

        {/* Quản lý phễu ứng viên của 1 tin cụ thể */}
        <Route
          path="/employer/candidate-funnel/:maViTri"
          element={renderEmployerRoute(<CandidateFunnel />)}
        />
        <Route
          path="/employer/applications/:maDon/ai-details"
          element={user?.vaiTro === "1" ? <AdminLayout user={user}><CandidateAiDetail /></AdminLayout> : <Navigate to="/login" replace />}
        />
        {/* Đưa Ví và Gói dịch vụ vào Layout của Nhà tuyển dụng */}
        <Route
          path="/employer/wallet"
          element={user && user.vaiTro === "1" ? <AdminLayout user={user}><Wallet /></AdminLayout> : <Navigate to="/login" replace />}
        />

        <Route
          path="/employer/service-package"
          element={renderEmployerRoute(<ServicePackage />)}
        />

        {/* Quản lý hồ sơ công ty */}
        <Route
          path="/employer/company-profile"
          element={renderEmployerRoute(<CompanyProfile />)}
        />

        {/* Quản lý tuyển dụng */}
        <Route
          path="/employer/post-job"
          element={renderEmployerRoute(<PostJob />)}
        />

        <Route
          path="/employer/cv-hunter"
          element={renderEmployerRoute(<CvHunter />)}
        />

        {/* ================= TRANG ỨNG VIÊN ================= */}
        <Route
          path="/manage-cv"
          element={user ? <CandidateLayout user={user}><ManageCv /></CandidateLayout> : <Navigate to="/login" replace />}
        />

        {/* Cấu hình đường dẫn động nhận maViTri làm tham số */}
        <Route
          path="/job/:id"
          element={
            <CandidateLayout user={user}>
              <JobDetail />
            </CandidateLayout>
          }
        />
        <Route path="/viec-lam" element={
          <CandidateLayout user={user}>
            <AppliedJobs user={user} />
          </CandidateLayout>
        } />

        <Route path="/xem-cv/:id" element={<ViewCv />} />

        <Route path="/thu-vien-cv" element={<CandidateLayout user={user}><CvTemplateLibrary /></CandidateLayout>} />

        <Route path="/builder" element={<CandidateLayout user={user}><CvBuilder /></CandidateLayout>} />
        <Route path="/upgrade-vip" element={<CandidateLayout user={user}><UpgradeVip /></CandidateLayout>} />
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