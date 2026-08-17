# ระบบใบรับเรื่อง — โครงสร้างโปรเจกต์ (Project Structure)

เอกสารนี้สรุป **ภาพรวมของระบบ** และ **โครงสร้าง/แพตเทิร์นทางเทคนิค** ของโปรเจกต์ **ระบบใบรับเรื่อง** (Request Intake System)

> หมายเหตุ: ไฟล์ `CLAUDE.md` คือแหล่งข้อมูลหลัก (source of truth) ของโครงสร้างโค้ดปัจจุบัน หากขัดแย้งกัน ให้ยึดตาม `CLAUDE.md`

---

## 1. ภาพรวมระบบ (System Overview)

**ระบบใบรับเรื่อง** เป็นระบบ **ภายในองค์กร** (internal use) สำหรับให้พนักงานเปิด "ใบรับเรื่อง" เพื่อแจ้งเรื่อง / ส่งคำร้อง ไปยัง **หน่วยงานปลายทาง** ที่รับผิดชอบ แล้วติดตามสถานะจนเรื่องดำเนินการเสร็จ

แนวคิดหลัก:
- พนักงานเปิดใบรับเรื่อง 1 ใบต่อ 1 เรื่อง → เลือกหน่วยงานปลายทาง → กรอกรายละเอียดตามประเภทเรื่อง
- ระบบส่งเรื่องเข้าคิวของหน่วยงานนั้น ๆ เพื่อรับเรื่อง / ดำเนินการ / ปิดงาน
- ผู้แจ้งติดตามสถานะได้ตลอด (เปิดใหม่ → รับเรื่อง → กำลังดำเนินการ → เสร็จสิ้น)

### หน่วยงานปลายทาง (Departments) และตัวอย่างเรื่อง

| หน่วยงาน | สี (accent) | ตัวอย่างเรื่องที่รับ |
|----------|-------------|----------------------|
| **HR** (ทรัพยากรบุคคล) | `#2d7d46` (green) | ขอใบรับรองเงินเดือน, ออกหนังสือแจ้งเตือนพนักงานขับรถ |
| **PL** (ฝ่ายวางแผน/คนขับ) | `#5b3fa6` (purple) | แจ้งปัญหาพฤติกรรมคนขับ, สำรวจหน้างาน, ขอเปลี่ยนคนขับ |
| **SV** (ฝ่ายบริการ/ซ่อมบำรุง) | `#b45309` (amber) | แจ้งปัญหาเกี่ยวกับเครื่องยนต์ / ตัวเครื่องจักร |
| **IT** (เทคโนโลยีสารสนเทศ) | `#1a5fb4` (blue) | ปัญหาคอมพิวเตอร์, hardware, software |

> รายการหน่วยงาน/ประเภทเรื่องข้างต้นเป็นตัวอย่างเริ่มต้น — เพิ่ม/ปรับได้ตามการใช้งานจริง ฟอร์มของแต่ละหน่วยงานมีฟิลด์เฉพาะต่างกัน (ดู "Conditional / dynamic form" ในหัวข้อแพตเทิร์น)

### บทบาทผู้ใช้ (คร่าว ๆ)
- **ผู้แจ้ง (ผู้เปิดใบรับเรื่อง)** — เปิดเรื่อง, ติดตามสถานะเรื่องของตนเอง
- **ผู้รับเรื่อง (เจ้าหน้าที่หน่วยงานปลายทาง)** — ดูคิวเรื่องเข้าของหน่วยงาน, รับเรื่อง, อัปเดตสถานะ, ปิดงาน

---

## 2. Tech Stack

| ส่วน | เทคโนโลยี | หมายเหตุ |
|------|-----------|----------|
| Framework | React 18 + TypeScript | สร้างด้วย Create React App (`--template typescript`) |
| Styling | **Tailwind CSS v3.4** | ⚠️ ต้องใช้ v3 ไม่ใช่ v4 — v4 ไม่ทำงานกับ CRA |
| Icons | `@tabler/icons-react` | ไอคอนชุดเดียวทั้งระบบ |
| Routing | `react-router-dom` v6 | |
| State | `useState` / `useContext` | ไม่ใช้ Redux |
| Font | IBM Plex Sans Thai (Google Fonts) | มี fallback Tahoma / Leelawadee UI |

---

## 3. คำสั่งติดตั้ง (Setup Commands)

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. รัน dev server
npm start

# 3. production build
npm run build
```

การติดตั้งจากศูนย์ (สร้างโปรเจกต์แม่แบบใหม่):

```bash
# ชื่อโปรเจกต์ห้ามมีตัวพิมพ์ใหญ่ (npm naming)
npx create-react-app my-app --template typescript
cd my-app
npm install react-router-dom @tabler/icons-react
# Tailwind v3 เท่านั้น (สำคัญ: ระบุ @3)
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

---

## 4. ไฟล์ Config ที่จำเป็น

### `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'Tahoma', '"Leelawadee UI"', 'sans-serif'],
      },
      colors: {
        accent: '#1a5fb4',
        // สีประจำหน่วยงานปลายทาง
        dept: {
          it: '#1a5fb4', hr: '#2d7d46', sv: '#b45309', pl: '#5b3fa6',
        },
      },
    },
  },
  plugins: [],
};
```

### `postcss.config.js`
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### `src/index.css`
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  margin: 0;
  font-family: 'IBM Plex Sans Thai', 'Tahoma', 'Leelawadee UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: #f8fafc;
}
* { font-family: 'IBM Plex Sans Thai', 'Tahoma', 'Leelawadee UI', sans-serif; }
```

---

## 5. โครงสร้างโฟลเดอร์ (Folder Structure)

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx        # เมนูซ้าย (แยกตามหน่วยงาน/หมวดงาน)
│   │   ├── Topbar.tsx         # ชื่อหน้า + user info + logout
│   │   └── Layout.tsx         # ครอบ Sidebar + Topbar + <main>
│   ├── ui/                    # คอมโพเนนต์ UI ที่ใช้ซ้ำ (reusable, ไม่ผูก business)
│   │   ├── Badge.tsx          # StatusBadge / PriorityBadge / CountBadge
│   │   ├── DynamicList.tsx    # เพิ่ม/ลบรายการ (add-remove list)
│   │   ├── FileUpload.tsx     # แนบไฟล์ประกอบใบรับเรื่อง
│   │   └── PriorityPicker.tsx # ระดับความเร่งด่วน
│   └── items/                 # คอมโพเนนต์เฉพาะ domain "ใบรับเรื่อง"
│       ├── ItemTable.tsx
│       └── StatCard.tsx
│
├── pages/                     # 1 ไฟล์ = 1 หน้า (route)
│   ├── Login.tsx
│   ├── Dashboard.tsx          # หน้าหลัก — dashboard สถานะทรัพยากร (เครื่องจักร/คนขับ)
│   ├── CreateItem.tsx         # เปิดใบรับเรื่องใหม่ (เลือกหน่วยงาน → ฟอร์มตามประเภท)
│   ├── MyItems.tsx            # ใบรับเรื่องของฉัน (ติดตามสถานะ)
│   ├── Inbox.tsx              # คิวเรื่องเข้าของหน่วยงานปลายทาง
│   │   # --- Work pages (WinForms → Web migration; ดู CLAUDE.md "Adding a New Work Page") ---
│   ├── SalesPlan.tsx          # แผนการขาย — toolbar + data grid + drawer ฟอร์ม
│   ├── Booking.tsx            # ใบจอง — list view + ฟอร์ม 9 ส่วน + workflow อนุมัติ 4 ขั้น
│   └── Delivery.tsx           # ใบส่งมอบ — list view + ฟอร์ม 9 ส่วน
│
├── context/
│   └── AuthContext.tsx        # global state: user, login, logout + localStorage
│
├── data/
│   └── mockData.ts            # mock data + ค่าคงที่ design (สี/สไตล์)
│
├── types/
│   ├── user.ts                # Department, User
│   └── item.ts                # ใบรับเรื่อง + variant ตามหน่วยงาน (union type)
│
├── App.tsx                    # Router + Provider + ProtectedRoute
├── index.tsx
└── index.css
```

### หลักการแบ่งโฟลเดอร์
- **`components/ui/`** = คอมโพเนนต์ที่ใช้ซ้ำได้ทุกที่ ไม่รู้จัก business logic (Badge, Input, FileUpload)
- **`components/items/`** = คอมโพเนนต์ผูกกับ domain "ใบรับเรื่อง" (item)
- **`components/layout/`** = โครงหน้า ใช้ครอบทุกหน้าหลัง login
- **`pages/`** = 1 ไฟล์ต่อ 1 route
- **`context/`** = global state ที่ใช้ข้ามหน้า
- **`types/`** = TypeScript types แยกตาม entity

> การตั้งชื่อใช้คำกลาง ๆ ว่า **"item"** (ใบรับเรื่อง) ไม่ผูกกับ domain เฉพาะ เช่น `CreateItem.tsx`, `MyItems.tsx`, `ItemTable.tsx`, `types/item.ts`
>
> ผังด้านบนเป็นโครงหลักแบบย่อ โค้ดจริงมีโฟลเดอร์เพิ่มสำหรับงาน WinForms→Web migration ได้แก่ `src/api/` (API layer ผ่าน `apiFetch`), `src/hooks/` (data-fetching hooks), และไฟล์ column/preset/mock ใน `src/data/` — **ดูโครงสร้างเต็มและแพตเทิร์นละเอียดใน `CLAUDE.md`**

---

## 6. แพตเทิร์นสำคัญ (Key Patterns)

### 6.1 Auth Context + localStorage persistence
```tsx
// context/AuthContext.tsx
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });
  const login = (...) => { /* set + localStorage.setItem */ };
  const logout = () => { /* clear + localStorage.removeItem */ };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### 6.2 Protected Routes
```tsx
// App.tsx
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

### 6.3 Layout wrapper (ทุกหน้าหลัง login)
```tsx
export function SomePage() {
  return (
    <Layout title="ชื่อหน้า">
      {/* เนื้อหา */}
    </Layout>
  );
}
```

### 6.4 Dynamic accent color (สีเปลี่ยนตามหน่วยงานปลายทาง)
ใช้ map ค่าคงที่ + inline `style` กับ CSS variable สำหรับ focus ring:
```tsx
const accentColor = DEPT_COLORS[selectedDept];   // เช่น HR → '#2d7d46'
<input
  style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
  className="focus:ring-2 focus:border-transparent"
/>
<button style={{ backgroundColor: accentColor }}>ยืนยัน</button>
```

### 6.5 Conditional / dynamic form (ฟอร์มเปลี่ยนตามหน่วยงานที่แจ้ง)
หัวใจของ "ใบรับเรื่อง" — เลือกหน่วยงานปลายทางแล้ว render ฟอร์มที่มีฟิลด์เฉพาะของหน่วยงานนั้น:
```tsx
const FORMS: Record<Department, React.ComponentType<Props>> = {
  IT: ITForm,   // อุปกรณ์, hardware/software, อาการเสีย
  HR: HRForm,   // ประเภทคำร้อง (ใบรับรองเงินเดือน / หนังสือแจ้งเตือน)
  SV: SVForm,   // หมายเลขเครื่องจักร, อาการเครื่องยนต์
  PL: PLForm,   // คนขับที่เกี่ยวข้อง, ประเภทเรื่อง (พฤติกรรม/สำรวจ/เปลี่ยนคนขับ)
};
const ActiveForm = selectedDept ? FORMS[selectedDept] : null;
{ActiveForm && <ActiveForm accentColor={accentColor} />}
```

### 6.6 Union type ตามหน่วยงาน
```ts
// types/item.ts
interface BaseItem { id: string; subject: string; /* ฟิลด์ร่วม */ }
interface ITItem extends BaseItem { toDept: 'IT'; device: string; }
interface HRItem extends BaseItem { toDept: 'HR'; requestType: string; }
interface SVItem extends BaseItem { toDept: 'SV'; machineNo: string; }
interface PLItem extends BaseItem { toDept: 'PL'; driver: string; }
export type Item = ITItem | HRItem | SVItem | PLItem;
```

---

## 7. Design System

### สีประจำหน่วยงานปลายทาง (Department accent)
| หน่วยงาน | สี |
|----------|-----|
| IT | `#1a5fb4` (blue) |
| HR | `#2d7d46` (green) |
| SV | `#b45309` (amber) |
| PL | `#5b3fa6` (purple) |

สี accent หลักของระบบ: corporate blue `#1a5fb4`

### สถานะใบรับเรื่อง (Status badge)
| สถานะ | สี |
|-------|-----|
| เปิดใหม่ | blue |
| รอดำเนินการ | amber |
| เร่งด่วน | red |
| เสร็จสิ้น | green |

### สไตล์โดยรวม
- Corporate เรียบ มืออาชีพ สีสันชัดเจนแต่ไม่ฉูดฉาด
- มุมโค้ง: `rounded-xl` / `rounded-2xl`
- เงา: `shadow-sm` (card ปกติ), `shadow-lg` (modal/highlight)
- เส้นขอบ: `border border-gray-200`

---

## 8. ข้อควรระวัง (Gotchas)

1. **Tailwind v4 ใช้กับ CRA ไม่ได้** — build ผ่านแต่ไม่มี utility classes ออกมา หน้าจะดูเหมือน HTML เปล่า ใช้ **v3.4** เท่านั้น
2. **ชื่อโปรเจกต์ห้ามมีตัวพิมพ์ใหญ่** — npm naming
3. **ฟอนต์ไทย** — ใส่ fallback (`Tahoma`, `Leelawadee UI`) กันตัวอักษรเป็นช่อง □ ตอน Google Fonts โหลดไม่ทัน
4. **focus ring สีกำหนดเอง** — ใช้ CSS variable `--tw-ring-color` ผ่าน inline style คู่กับ class `focus:ring-2`
5. **ตรวจ build** — ถ้าไฟล์ CSS ที่ build เล็กผิดปกติ (< 10KB) แปลว่า Tailwind ไม่ทำงาน (ปกติ > 20KB)
</content>
</invoke>
