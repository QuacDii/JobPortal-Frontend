import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Spin } from 'antd';
import apiClient from './api/apiClient';

import Register from './pages/Register';
import RegisterChoose from './pages/RegisterChoose';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import CvTemplateLibrary from './pages/CvTemplateLibrary';
import CvBuilder from './pages/CvBuilder';
import UpgradeVip from './pages/UpgradeVip';
import ManageCv from './pages/ManageCv';
import CompanyList from './pages/CompanyList';
import CompanyDetail from './pages/CompanyDetail';
import TemplatePreview from './pages/TemplatePreview';
import Login from './pages/Login';
import AppliedJobs from './pages/AppliedJobs';
import SavedJobs from './Pages/SavedJobs';
import UserProfile from './pages/UserProfile';
import AdvancedSearch from './Pages/AdvancedSearch';
import JobDetail from './pages/JobDetail';

// TRANG ADMIN 
import ApproveCompanies from './pages/Admin/ApproveCompanies';
import CompanyDetailAdmin from './pages/Admin/CompanyDetailAdmin';
import ApproveJobPosts from './pages/Admin/ApproveJobPosts';
import HierarchicalCategoryCrud from './pages/Admin/HierarchicalCategoryCrud';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CategoryCrudTemplate from './pages/admin/CategoryCrudTemplate';
import UserManager from './pages/admin/UserManager';
import AdminReport from './pages/admin/AdminReport';
import LocationManager from './pages/admin/LocationManager';
import PackageManager from './pages/admin/PackageManager';
import CvTemplateManager from './pages/admin/CvTemplateManager';

import CandidateLayout from './Layouts/CandidateLayout';
import AdminLayout from './Layouts/AdminLayout';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Candidate/Home';
import EmployerDashboard from './pages/Employer/EmployerDashboard';

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

import VnPayReturn from './pages/Payment/VnPayReturn';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [employerStatus, setEmployerStatus] = useState("APPROVED");

  const isEmployerRole = (role) => {
    if (!role && role !== 0) return false;
    const r = String(role).toUpperCase();
    return r === "1" || r === "EMPLOYER";
  };

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

          if (isEmployerRole(role)) {
            apiClient.get('/auth/employer-status')
              .then(res => {
                const resPayload = res?.data || res;
                const status = (typeof resPayload?.status === 'string') ? resPayload.status : "NO_COMPANY";
                setEmployerStatus(status);
                setLoading(false);
              })
              .catch(() => {
                setEmployerStatus("NO_COMPANY");
                setLoading(false);
              });
            return;
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

  const renderEmployerRoute = (element) => {
    if (!user || (user.vaiTro !== "1" && user.vaiTro !== 1)) return <Navigate to="/login" replace />;

    if (employerStatus === "NO_COMPANY" || employerStatus === "PENDING") {
      return (
        <AdminLayout user={user}>
          <CompanyProfile onStatusChange={(newStatus) => setEmployerStatus(newStatus)} />
        </AdminLayout>
      );
    }

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
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterChoose />} />
        <Route path="/register/:roleType" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/"
          element={
            user && (user.vaiTro === "0" || user.vaiTro === 0) ? <Navigate to="/admin/dashboard" replace /> :
              user && (user.vaiTro === "1" || user.vaiTro === 1) ? <Navigate to="/employer/dashboard" replace /> :
                <CandidateLayout user={user}><Home /></CandidateLayout>
          }
        />

        {/* ================= TRANG ADMIN ================= */}
        <Route path="/admin/dashboard" element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? <AdminLayout user={user}><AdminDashboard /></AdminLayout> : <Navigate to="/login" replace />} />
        <Route path="/admin/approve-companies" element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? <AdminLayout user={user}><ApproveCompanies /></AdminLayout> : <Navigate to="/login" replace />} />
        <Route path="/admin/company-detail/:id" element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? <AdminLayout user={user}><CompanyDetailAdmin /></AdminLayout> : <Navigate to="/login" replace />} />
        <Route path="/admin/approve-job-posts" element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? <AdminLayout user={user}><ApproveJobPosts /></AdminLayout> : <Navigate to="/login" replace />} />

        {/* 1. Route Quản lý Kỹ năng*/}
        <Route
          path="/admin/categories/skills"
          element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? (
            <AdminLayout user={user}>
              <CategoryCrudTemplate
                title="Kỹ năng"
                apiUrl="/KyNang"
                idKey="maKyNang"
                nameKey="tenKyNang"
              />
            </AdminLayout>
          ) : <Navigate to="/login" replace />}
        />

        {/* 2. Route Quản lý Ngành nghề */}
        <Route
          path="/admin/categories/industries"
          element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? (
            <AdminLayout user={user}>
              <HierarchicalCategoryCrud
                title="Ngành nghề"
                apiUrl="/NganhNghe"
              />
            </AdminLayout>
          ) : <Navigate to="/login" replace />}
        />

        {/* 3. Route Quản lý Khu vực (Thành phố / Phường xã) */}
        <Route
          path="/admin/categories/locations"
          element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? (
            <AdminLayout user={user}>
              <LocationManager />
            </AdminLayout>
          ) : <Navigate to="/login" replace />}
        />

        <Route
          path="/admin/users"
          element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? (
            <AdminLayout user={user}>
              <UserManager />
            </AdminLayout>
          ) : <Navigate to="/login" replace />}
        />

        <Route
          path="/admin/reports"
          element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? (
            <AdminLayout user={user}>
              <AdminReport />
            </AdminLayout>
          ) : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/packages"
          element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? (
            <AdminLayout user={user}>
              <PackageManager />
            </AdminLayout>
          ) : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/cv-templates"
          element={user && (user.vaiTro === "0" || user.vaiTro === 0) ? (
            <AdminLayout user={user}>
              <CvTemplateManager />
            </AdminLayout>
          ) : <Navigate to="/login" replace />}
        />

        <Route path="/admin/approve-campaigns" element={<Navigate to="/admin/approve-job-posts" replace />} />

        {/* ================= TRANG NHÀ TUYỂN DỤNG ================= */}
        <Route path="/employer/dashboard" element={renderEmployerRoute(<EmployerDashboard />)} />
        <Route path="/employer/company-profile" element={renderEmployerRoute(<CompanyProfile />)} />
        <Route path="/employer/wallet" element={renderEmployerRoute(<Wallet />)} />
        <Route path="/employer/jobs" element={renderEmployerRoute(<EmployerJobs />)} />

        <Route path="/employer/jobs/:id" element={renderEmployerRoute(<JobDetail isEmployer={true} />)} />
        <Route path="/employer/candidate-funnel/:maViTri" element={renderEmployerRoute(<CandidateFunnel />)} />
        <Route path="/employer/applications/:maDon/ai-details" element={renderEmployerRoute(<CandidateAiDetail />)} />
        <Route path="/employer/service-package" element={renderEmployerRoute(<ServicePackage />)} />
        <Route path="/employer/post-job" element={renderEmployerRoute(<PostJob />)} />
        <Route path="/employer/cv-hunter" element={renderEmployerRoute(<CvHunter />)} />

        {/* ================= TRANG ỨNG VIÊN & KHÁCH ================= */}
        <Route path="/manage-cv" element={user ? <CandidateLayout user={user}><ManageCv /></CandidateLayout> : <Navigate to="/login" replace />} />
        <Route path="/job/:id" element={<CandidateLayout user={user}><JobDetail isEmployer={false} /></CandidateLayout>} />
        <Route path="/viec-lam" element={<CandidateLayout user={user}><AppliedJobs user={user} /></CandidateLayout>} />
        <Route path="/thu-vien-cv" element={<CandidateLayout user={user}><CvTemplateLibrary /></CandidateLayout>} />
        <Route path="/builder" element={<CandidateLayout user={user}><CvBuilder /></CandidateLayout>} />
        <Route path="/profile" element={user ? <CandidateLayout user={user}><UserProfile user={user} /></CandidateLayout> : <Navigate to="/login" replace />} />
        <Route path="/tao-cv" element={<CandidateLayout user={user}><CvBuilder /></CandidateLayout>} />
        <Route path="/upgrade-vip" element={<CandidateLayout user={user}><UpgradeVip /></CandidateLayout>} />
        <Route path="/viec-lam-da-luu" element={<CandidateLayout user={user}><SavedJobs /></CandidateLayout>} />
        <Route path="/jobs" element={<CandidateLayout user={user}><AdvancedSearch /></CandidateLayout>} />
        <Route path="/xem-truoc-cv/:id" element={<CandidateLayout user={user}><TemplatePreview /></CandidateLayout>} />
        <Route path="/cong-ty" element={<CandidateLayout user={user}><CompanyList /></CandidateLayout>} />
        <Route path="/cong-ty/:id" element={<CandidateLayout user={user}><CompanyDetail /></CandidateLayout>} />

        {/* CALLBACK THANH TOÁN */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path="/vnpay-return" element={<VnPayReturn />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;