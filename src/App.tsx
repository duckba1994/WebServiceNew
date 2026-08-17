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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  // ไม่มี user หรือ token หมดอายุ → เด้ง login (จำ path เดิม + เหตุผลถ้าหมดอายุ)
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search, reason: user ? 'expired' : undefined }}
      />
    );
  }
  return <>{children}</>;
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
