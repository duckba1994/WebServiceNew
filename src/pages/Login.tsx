import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // path เดิมที่ถูกเด้งมา + เหตุผล (เซสชันหมดอายุ) จาก ProtectedRoute / sessionExpired
  const state = (location.state ?? {}) as { from?: string; reason?: string };
  const expired = state.reason === 'expired';
  const backTo = state.from && state.from !== '/login' ? state.from : '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(backTo, { replace: true }); // กลับไปหน้าเดิมที่ค้างไว้
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-lg"
      >
        <h1 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-slate-100">ระบบใบรับเรื่อง</h1>
        <p className="mb-6 text-sm text-gray-400 dark:text-slate-500">เข้าสู่ระบบเพื่อใช้งาน</p>

        {expired && !error && (
          <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-200">ชื่อผู้ใช้</label>
        <input
          type="text"
          name="username"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          autoFocus
          className="mb-4 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-200">รหัสผ่าน</label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="mb-6 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
