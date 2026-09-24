import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateItem } from './pages/CreateItem';
import { MyItems } from './pages/MyItems';
import { Inbox } from './pages/Inbox';
import { SalesPlan } from './pages/SalesPlan';
import { Booking } from './pages/Booking';
import { Delivery } from './pages/Delivery';
import { PhoneBook } from './pages/PhoneBook';
import { Reports } from './pages/Reports';
import { ReportWorkspace } from './pages/ITReportWorkspace';
import { PLReportWorkspace } from './pages/PLReportWorkspace';
import { SVReportWorkspace } from './pages/SVReportWorkspace';
import { HRReportWorkspace } from './pages/HRReportWorkspace';
import { PSReportWorkspace } from './pages/PSReportWorkspace';
import { DraftScope } from './hooks/useSessionDraft';
import { suspendDraftSession } from './utils/sessionDrafts';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  // ไม่มี user หรือ token หมดอายุ → เด้ง login (จำ path เดิม + เหตุผลถ้าหมดอายุ)
  if (!isAuthenticated) {
    // Freeze the snapshot before React unmounts protected forms, including the
    // JWT-expiry path that does not go through an API 401.
    if (user) suspendDraftSession(location.pathname + location.search);
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search, reason: user ? 'expired' : undefined }}
      />
    );
  }
  return <DraftScope name={location.pathname}>{children}</DraftScope>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateItem /></ProtectedRoute>} />
          <Route path="/my" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/sales-plan" element={<ProtectedRoute><SalesPlan /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/delivery" element={<ProtectedRoute><Delivery /></ProtectedRoute>} />
          <Route path="/phone-book" element={<ProtectedRoute><PhoneBook /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/reports/it/satisfaction-summary" element={<ProtectedRoute><ReportWorkspace reportKey="it-satisfaction-summary" /></ProtectedRoute>} />
          <Route path="/reports/it/request-register" element={<ProtectedRoute><ReportWorkspace reportKey="it-request-register" /></ProtectedRoute>} />
          <Route path="/reports/pl/request-report" element={<ProtectedRoute><PLReportWorkspace /></ProtectedRoute>} />
          <Route path="/reports/sv/request-summary" element={<ProtectedRoute><SVReportWorkspace /></ProtectedRoute>} />
          <Route path="/reports/hr/request-summary" element={<ProtectedRoute><HRReportWorkspace reportKey="hr-request-summary" /></ProtectedRoute>} />
          <Route path="/reports/hr/request-summary-year" element={<ProtectedRoute><HRReportWorkspace reportKey="hr-request-summary-year" /></ProtectedRoute>} />
          <Route path="/reports/ps/summary" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-summary" /></ProtectedRoute>} />
          <Route path="/reports/ps/balance-form" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-balance-form" /></ProtectedRoute>} />
          <Route path="/reports/ps/bit60-057" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-bit60-057" /></ProtectedRoute>} />
          <Route path="/reports/ps/bit61-091" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-bit61-091" /></ProtectedRoute>} />
          <Route path="/reports/ps/bit61-118/quantity" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-bit61-118-quantity" /></ProtectedRoute>} />
          <Route path="/reports/ps/bit61-118/department" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-bit61-118-department" /></ProtectedRoute>} />
          <Route path="/reports/ps/bit61-118/month" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-bit61-118-month" /></ProtectedRoute>} />
          <Route path="/reports/ps/bit63-022" element={<ProtectedRoute><PSReportWorkspace reportKey="ps-bit63-022" /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
