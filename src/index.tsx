import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { applyTheme, readThemeMode } from './hooks/useTheme';

// ตั้งธีมก่อน React render — ไม่งั้นผู้ใช้โหมดมืดจะเห็นจอขาวแวบหนึ่งทุกครั้งที่เปิดแอป
applyTheme(readThemeMode());

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
