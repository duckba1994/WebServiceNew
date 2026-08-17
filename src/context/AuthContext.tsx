import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';
import { login as loginApi } from '../api/auth';
import { isTokenExpired } from '../utils/token';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/client';

const STORAGE_KEY = 'app_user';
// เวอร์ชันโครงสร้าง user ที่เก็บใน localStorage — เพิ่มขึ้นเมื่อเก็บฟิลด์ใหม่
// (v2 = departid/departmentName/computerName, v3 = สิทธิ์อนุมัติ `approve`, v4 = departmentShort)
// เจอ record เวอร์ชันเก่า = ข้อมูลไม่ครบ → ให้ login ใหม่ 1 ครั้ง แทนที่จะโชว์ช่องว่าง
const USER_SCHEMA_VERSION = 4;

interface AuthContextType {
  user: User | null;
  // มี user และ token ยังไม่หมดอายุ (opaque token ที่เช็คไม่ได้ = ถือว่ายังใช้ได้ รอ 401)
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  // เซสชันหมดอายุ: เคลียร์ user + เด้งไปหน้า login พร้อมจำ path เดิมไว้กลับ
  sessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ตำแหน่งที่ถือว่าเป็น "หัวหน้าแผนก" (คนอนุมัติใบแจ้งเรื่อง)
const HEAD_ROLES = ['mgr', 'manager', 'head', 'supervisor', 'chief'];

// ค่าที่ backend อาจส่งมาแทน true — รับได้ทั้ง boolean, ตัวเลข และข้อความ
const truthy = (v: unknown): boolean | undefined => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '') return undefined;
    if (['true', 'y', 'yes', '1'].includes(s)) return true;
    if (['false', 'n', 'no', '0'].includes(s)) return false;
  }
  return undefined;
};

// สิทธิ์อนุมัติเอกสาร = เป็น mgr ของแผนก
// backend ส่งมาในคีย์ `approve` (17 ส.ค. 2026) — รองรับชื่ออื่นและ role แบบข้อความไว้ด้วย
function readIsHead(raw: Record<string, unknown>, role?: string): boolean | undefined {
  for (const key of ['approve', 'isApprove', 'canApprove', 'isHead', 'isMgr']) {
    const v = truthy(raw[key]);
    if (v !== undefined) return v;
  }
  if (role) return HEAD_ROLES.includes(role.toLowerCase());
  return undefined; // backend ยังไม่ส่งข้อมูลบทบาทมา
}

// AuthProvider ต้องอยู่ภายใน <BrowserRouter> (ดู App.tsx) เพื่อใช้ useNavigate ได้
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      const u = JSON.parse(saved) as User;
      if (u.schemaVersion !== USER_SCHEMA_VERSION) {
        localStorage.removeItem(STORAGE_KEY); // record เก่า ข้อมูลไม่ครบ
        return null;
      }
      return u;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });
  // กันเด้งไป login ซ้ำ ๆ เมื่อมี 401 หลายก้อนพร้อมกัน
  const redirectingRef = useRef(false);

  const isAuthenticated = !!user && !isTokenExpired(user.token);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // เซสชันหมดอายุ → logout + ไป /login (จำ path เดิม + เหตุผล ไว้ให้หน้า Login ใช้)
  const sessionExpired = useCallback(() => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    const from = window.location.pathname + window.location.search;
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/login', { replace: true, state: { from, reason: 'expired' } });
  }, [navigate]);

  // ฟัง event จาก api layer (เจอ 401 ที่ไหนก็ตาม) → เด้งออก
  useEffect(() => {
    const handler = () => sessionExpired();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
  }, [sessionExpired]);

  // เรียก API จริง — โยน error ออกไปให้หน้า Login จัดการแสดงข้อความ
  const login = async (username: string, password: string): Promise<void> => {
    const result = await loginApi({ username, password });
    // ดึงข้อมูลผู้ใช้จาก payload ดิบ (login response) เท่าที่มี
    // ชื่อฟิลด์ฝั่ง backend ยังไม่นิ่ง — รับได้หลายแบบ แล้วเก็บเท่าที่มี
    const raw = (result.raw ?? {}) as Record<string, unknown>;
    const pick = (...keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = raw[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return undefined;
    };
    const next: User = {
      schemaVersion: USER_SCHEMA_VERSION,
      id: pick('usid', 'userId', 'id') || username,
      username: pick('username') || username,
      name: pick('fullName', 'name', 'employeeName', 'userFullName') || username,
      token: result.token,
      salemanId: (raw.salemanId as string | null | undefined) ?? null,
      departid: pick('departid', 'departId', 'departmentId', 'deptId'),
      departmentShort: pick('departmentShort', 'departShort', 'deptShort'),
      departmentName: pick('departmentName', 'departmentname', 'departName', 'department', 'deptName'),
      // AD: เบราว์เซอร์อ่านชื่อเครื่องไม่ได้ ต้องมาจาก login response เท่านั้น
      computerName: pick('computerName', 'machineName', 'hostName', 'pcName', 'workstation'),
      // หัวหน้าแผนก (คนอนุมัติ) — รับได้ทั้ง boolean และ role แบบข้อความ
      // undefined = backend ยังไม่ส่งมา (ต่างจาก false = ส่งมาแล้วว่าไม่ใช่หัวหน้า)
      isHead: readIsHead(raw, pick('role', 'position')),
    };
    redirectingRef.current = false; // login สำเร็จ → พร้อมเด้งอีกครั้งถ้าหมดอายุในอนาคต
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
