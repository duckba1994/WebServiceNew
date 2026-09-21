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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
