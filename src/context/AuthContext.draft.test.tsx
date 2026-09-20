import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from '../App';
import { Login } from '../pages/Login';
import { login as loginApi } from '../api/auth';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/client';
import { useSessionDraft } from '../hooks/useSessionDraft';
import { clearDraftSession } from '../utils/sessionDrafts';

jest.mock('../api/auth', () => ({ login: jest.fn() }));
function Work() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useSessionDraft('work.detail', '');
  return <><input aria-label="รายละเอียด" value={text} onChange={e => setText(e.target.value)} />
    <button onClick={() => { logout(); navigate('/login', { replace: true }); }}>Logout</button></>;
}
function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/create" element={<ProtectedRoute><Work /></ProtectedRoute>} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<ProtectedRoute><div>หน้าหลัก</div></ProtectedRoute>} />
  </Routes></AuthProvider></BrowserRouter>;
}
beforeEach(() => {
  clearDraftSession();
  window.history.replaceState({}, '', '/create');
  localStorage.setItem('app_user', JSON.stringify({ schemaVersion: 4, id: 'alice', username: 'alice', name: 'Alice', token: 'old-token' }));
  (loginApi as jest.Mock).mockResolvedValue({ token: 'new-token', raw: { usid: 'alice', username: 'alice' } });
});
afterEach(() => { clearDraftSession(); localStorage.clear(); });
const expire = () => act(() => { window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail: { token: 'old-token' } })); });
async function signIn() {
  fireEvent.change(document.querySelector('input[name="username"]')!, { target: { value: 'alice' } });
  fireEvent.change(document.querySelector('input[name="password"]')!, { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
  await waitFor(() => expect(window.location.pathname).not.toBe('/login'));
}
test('401 restores the same account form; a late old-token 401 is ignored', async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'ข้อความก่อนหมดอายุ' } });
  expire();
  expect(window.location.pathname).toBe('/login');
  await signIn();
  expect(window.location.pathname).toBe('/create');
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('ข้อความก่อนหมดอายุ');
  expire();
  expect(window.location.pathname).toBe('/create');
});
test('explicit logout returns to dashboard and clears drafts', async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'ไม่คืนหลัง logout' } });
  fireEvent.click(screen.getByText('Logout'));
  await signIn();
  expect(screen.getByText('หน้าหลัก')).toBeInTheDocument();
  expect(sessionStorage.getItem('app_session_draft_v1')).not.toContain('ไม่คืนหลัง logout');
});
test('logging in as another account returns to dashboard without the previous draft', async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'ข้อมูล Alice' } });
  expire();
  (loginApi as jest.Mock).mockResolvedValue({ token: 'bob-token', raw: { usid: 'bob', username: 'bob' } });
  await signIn();
  expect(screen.getByText('หน้าหลัก')).toBeInTheDocument();
  expect(sessionStorage.getItem('app_session_draft_v1')).not.toContain('ข้อมูล Alice');
});

test('JWT expiry detected by ProtectedRoute preserves the mounted form before redirect', async () => {
  const now = Date.now();
  const jwt = `header.${btoa(JSON.stringify({ exp: Math.floor(now / 1000) + 100 }))}.signature`;
  const user = JSON.parse(localStorage.getItem('app_user')!);
  localStorage.setItem('app_user', JSON.stringify({ ...user, token: jwt }));
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'ร่างตอน JWT หมด' } });
  const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 200000);
  view.rerender(<App />);
  clock.mockRestore();
  expect(window.location.pathname).toBe('/login');
  await signIn();
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('ร่างตอน JWT หมด');
});

test('refreshing the login page can recover from sessionStorage', async () => {
  const first = render(<App />);
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'ร่างก่อน refresh' } });
  expire();
  const snapshot = sessionStorage.getItem('app_session_draft_v1')!;
  first.unmount();
  clearDraftSession(); // Simulate losing the module's in-memory copy on reload.
  sessionStorage.setItem('app_session_draft_v1', snapshot);
  render(<App />);
  await signIn();
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('ร่างก่อน refresh');
});
