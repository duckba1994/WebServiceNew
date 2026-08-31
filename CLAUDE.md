# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview
**ระบบใบรับเรื่อง** (Request Intake System, package name `businessapp`) — an internal organization app where staff open a "ใบรับเรื่อง" (request ticket) and route it to the responsible department (HR / PL / SV / IT), then track it to completion. React 18 + TypeScript single-page app bootstrapped with Create React App (`react-scripts`). Git repository, default branch `main`. See `PROJECT_STRUCTURE.md` for the system overview (departments + example requests), `API_NAMING.md` for the mandatory API field-naming rule, and `API_SPEC_REQUEST_FLOW.md` / `API_SPEC_REQUESTS_V2.md` for what is still pending from backend.

**Departments (request destinations)** — each has its own accent color and department-specific form fields:
- **HR** `#2d7d46` — e.g. request salary certificate, issue warning letter to a driver
- **PL** `#5b3fa6` — e.g. report driver-behavior issues, on-site survey, request a driver change
- **SV** `#b45309` — e.g. report engine / machine problems
- **IT** `#1a5fb4` — e.g. computer, hardware, software issues

## Tech Stack
- React 18 + TypeScript, built via `react-scripts` (CRA)
- Tailwind CSS **v3.4** for styling — must stay on v3; Tailwind v4 is incompatible with CRA (the build succeeds but produces no utility classes)
- `@tabler/icons-react` for all icons
- `react-router-dom` v6 for routing
- State management is plain `useState`/`useContext` — no Redux, Zustand, or other state library

## Commands
- `npm start` — run the dev server
- `npm run build` — production build
- `npm test` — run tests (CRA/Jest via `react-scripts test`)

## Project Structure
```
src/
├── App.tsx              # Routes + ProtectedRoute
├── config.ts            # API_BASE_URL / API_PREFIX / apiUrl()
├── index.tsx, index.css
├── api/
│   ├── client.ts          # apiFetch/apiGet/apiSend — single entry for all calls (Bearer + 401→auth:unauthorized event); apiSend throws ApiError carrying the API's Thai `message` + traceId
│   ├── auth.ts           # login() — calls the backend auth endpoint (noAuthEvent: 401 = bad credentials)
│   ├── salesPlan.ts       # fetchSalesPlans / fetchSalesPlanLines
│   ├── booking.ts         # fetchBookings(query, token) — GET /Bookings + BookingQuery (BookingNo/date ranges/CustomerName/MachineID/StatusDoc/showDataAll → query params)
│   ├── requests.ts        # fetchRequestList / fetchRequestModules / fetchRequestWorkflow / postRequestAction
│   ├── itRequest.ts       # IT request form submit
│   ├── crRequest.ts       # POST /CRRequest — create a CR request (see MdApi CR-create-frontend-guide); returns the running jobNo
│   └── masterData.ts      # fetch<Salesmen|ContactChannels|LeadSources|Customers|Provinces|MachineTypes|MachineModels|PlanStatuses> + fetchDepartments + Booking master data: fetch<Purposes|PlanTypes|JobCharacters|JobGroups|JobGroupDetails|PresentWorks|OperatorServiceTypes|FuelConditions|SurveyWorkSites|SurveyWorkSiteDetails|MachineConditions|DriverConditions|DocumentBookings|TechnicianConditions|CreditTypes|CarAssignmentsPL|CarVerificationsSV> + per-department option sets (one call each, returns several lists): fetchItMasterData (/MasterData/it) / fetchPlMasterData (/MasterData/pl) / fetchCrMasterData (/MasterData/cr)
├── components/
│   ├── items/            # ItemTable, StatCard, RequestGrid (shared outgoing/incoming table), RequestDetailModal, RequestActionDialog (confirm + dynamic form built from an action's requiredFields, then POST)
│   ├── layout/            # Layout, Sidebar, Topbar
│   └── ui/                # Badge, DynamicList, FileUpload, PriorityPicker, FormControls (shared work-page form controls), ColumnFilter (shared Excel-style per-column AutoFilter — used by SalesPlan + Booking), SearchSelect (THE searchable combobox — every page must import this one, never re-implement), DateQuickPick (date field with วันนี้/พรุ่งนี้ shortcuts + a Thai date label — use instead of a bare type="date"/"datetime-local" where a human picks a day)
├── context/
│   └── AuthContext.tsx    # AuthProvider / useAuth()
├── hooks/                 # data-fetching hooks (keep fetch/loading/error OUT of page components)
│   ├── useRequestList.ts  # THE request-list hook for both boxes — returns items/summary/phaseSummary/workflow/paging/totalCount; outgoing may omit `module` (= all modules), incoming must send it
│   ├── useRequestAction.ts # POST /Requests/{module}/{docNo}/action — surfaces the API's Thai `message` for both success and 409/400/403
│   ├── useDepartments.ts  # GET /MasterData/departments
│   ├── useItMasterData.ts # GET /MasterData/it — repairStatuses (ขั้นดำเนินการ) + solutions/mainCauses/subCauses (ขั้นปิดงานรับเรื่อง); subCausesOf() filters by mainCauseId
│   ├── usePlMasterData.ts # GET /MasterData/pl — types/requestTypes/units for the PL request form (create + edit)
│   ├── useCrMasterData.ts # GET /MasterData/cr — sections → requestTypes → requestSubTypes (chained filters; ids repeat across sections so ALWAYS filter by section too)
│   ├── useMasterData.ts   # loads all master-data lists for the sales-plan form (+ loading/error/reload)
│   ├── useSalesPlanDocs.ts # loads plan headers + selected-plan lines
│   └── useBookings.ts     # loads booking list from GET /Bookings with server-side BookingQuery (refetch on query change) → BookingRow + loading/error/reload
├── data/
│   ├── bookingData.ts    # booking columns/groups/presets + status meta + cellText/compareBookings (sort·filter) + mapBookingApi (API→row) + mock rows
│   ├── deliveryData.ts   # delivery columns/status meta/form option lists + mock rows
│   ├── mockData.ts       # design constants + mock items/activities
│   ├── menuData.ts       # company info + work-order menu groups (drives the Sidebar)
│   ├── resourceData.ts   # dashboard machine/driver status meta + summary counts + mock rows
│   ├── salesPlanData.ts  # sales-plan columns/presets/status meta + mock rows
│   ├── requestListData.ts # request-list columns/presets + cellText/compareRequests + requestKey (module+docNo) + jobStatusMeta
│   ├── requestActionFields.ts # ⚠️ SHIM: ชื่อฟิลด์ → label/type/options for action forms (solve/hw/serviceScore/kpi…) + optional field groups. Delete when the API sends field metadata (API_SPEC_REQUESTS_V2.md §10)
│   ├── requestPhase.ts   # PRESENTATION ONLY for phases: PHASE_META colors, PHASE_ORDER, phaseOf/phaseLabel/isRequesterSide. The WFStatus→phase mapping lives in the backend (API v2) — never reintroduce it here
│   ├── requestData.ts / requestForm.ts # IT request create form
│   ├── crRequestForm.ts  # PURE form→payload mapping for the CR request (jobDate = "วันที่ต้องการ"; requestBy/departid/requestDate left to the backend)
│   └── salesPlanForm.ts  # PURE form logic: PlanFormState, toPlanForm, REQUIRED_FIELDS, validatePlanForm, buildPlanFormOptions
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx     # main page ("หน้าหลัก"): resource-status dashboard — machine status cards + active-machine table + driver status
│   ├── SalesPlan.tsx     # work page: toolbar + data grid + add/edit modal (PlanEntryForm); logic in hooks/ + data/salesPlanForm.ts
│   ├── Booking.tsx       # work page: list view (standard grid — sort/filter/resize/column-preset/pagination, per-row edit·print·cancel in "จัดการ" col, data from useBookings) + 9-section create form (ADD) + approval view (edit button): 4-step workflow, each step shows that WinForms section's data (ส่วนที่ 1 ผู้จอง / 2 PL / 3 SV / 4 แจ้งจอง+สรุป PL·SV) + audit; approve/reject only at bottom
│   ├── Delivery.tsx      # work page: list view + 9-section create form (PL/SV reply box, extra equipment)
│   ├── CreateItem.tsx
│   ├── MyItems.tsx       # "เรื่องที่แจ้งออกไป" (outbox) — ALL destination modules in one grid + phase KPI cards + "รอเราลงมือ" filter
│   └── Inbox.tsx         # "เรื่องแจ้งเข้ามา" — the target department's work queue (receive → service → close): single module + phase KPI cards + onlyMyTurn
├── types/
│   ├── booking.ts
│   ├── delivery.ts
│   ├── item.ts
│   ├── request.ts        # IT request create form
│   ├── requestList.ts    # RequestListItem + RequestWorkflow / RequestAction / RequestPhaseSummary / RequestActionResult (API field names — do NOT rename)
│   ├── masterData.ts
│   ├── resource.ts
│   ├── salesPlan.ts
│   └── user.ts
└── utils/
    └── token.ts           # isTokenExpired / getTokenExp — JWT exp decode (session-expiry checks)
```

## Architecture Patterns
- **Auth**: `AuthContext` (`src/context/AuthContext.tsx`) exposes `useAuth()` → `{ user, isAuthenticated, login, logout, sessionExpired }`. The logged-in `user` is persisted to `localStorage` under the key `app_user`. `login()` delegates to `loginApi` in `src/api/auth.ts`. `isAuthenticated` = has `user` AND token not expired (`isTokenExpired` in `src/utils/token.ts` decodes a JWT `exp`; opaque tokens can't be checked so it returns not-expired and relies on 401 instead). `sessionExpired()` clears the user and redirects to `/login` remembering the current path.
- **Session expiry**: any API 401 makes `apiFetch` dispatch a `window` event `auth:unauthorized` (name in `src/api/client.ts`); `AuthProvider` listens and calls `sessionExpired()`. `ProtectedRoute` also redirects when the token is expired (not just missing). `Login` shows a "เซสชันหมดอายุ" banner (`location.state.reason === 'expired'`) and, on success, returns to `location.state.from`. Guard side-effectful entry points (e.g. `SalesPlan` `openAdd`) with `if (!isAuthenticated) sessionExpired()` so users aren't allowed to fill a long form on a dead session. AuthProvider MUST stay inside `<BrowserRouter>` (it uses `useNavigate`).
- **Routing**: defined in `src/App.tsx`. `/login` is public; `/dashboard`, `/create`, `/my`, `/inbox`, `/sales-plan`, `/booking`, `/delivery` are wrapped in a local `ProtectedRoute` that redirects to `/login` when not authenticated. Unknown paths (`*`) redirect to `/dashboard`.
- **Work pages** (WinForms → Web migration): see "Adding a New Work Page" below — `SalesPlan.tsx` is the reference implementation.
- **API layer**: all backend calls go through `apiFetch`/`apiGet` in `src/api/client.ts` (NOT bare `fetch`) — it builds the URL via `apiUrl()` (`src/config.ts`), attaches the Bearer token, and turns any 401 into the `auth:unauthorized` event. `apiUrl` = `API_BASE_URL + API_PREFIX + path`; `API_BASE_URL` from `REACT_APP_API_BASE_URL` (default `https://localhost:44377`), `API_PREFIX` = `/api/v1`. The one exception is `login()`, which passes `noAuthEvent: true` because its 401 means wrong credentials, not an expired session.
- **Layout**: `Layout.tsx` composes `Sidebar` and `Topbar` around a `<main>` outlet; it's the single common parent for both, so cross-component UI state (e.g. sidebar open/closed) is owned here and passed down as props rather than via a new context. `Layout` accepts `title` and optional `subtitle` shown in the Topbar.
- **Sidebar/menu**: dark-navy sidebar (`bg-[#0b1220]`) whose grouped menu comes from `MENU_GROUPS`/`SYSTEM_MENU` in `src/data/menuData.ts`. Most menu items are placeholders (no `to` yet) rendered as buttons — fill in `to` as real pages are built (WinForms → Web migration). The Sidebar is now the ONLY navigation to work pages (per user decision, 31 Jul 2026 the Dashboard menu tiles were dropped in favour of the resource-status dashboard). User info + logout live in the Topbar (deliberate deviation from the design mockup so logout stays reachable when the sidebar is hidden).
- **Dashboard** (`src/pages/Dashboard.tsx`): the main page is an operational resource-status dashboard — 6 machine-status summary cards, an "active machines" table, and a driver-status panel with a certificate-expiry warning. All figures come from `src/data/resourceData.ts` (mock until the API is wired). Note `TOTAL_MACHINES` is a standalone fleet total, deliberately NOT the sum of the six status counts.

- **Request pages (outbox / inbox) — cross-department workflows**: every department runs its own workflow with a different number of steps (2–6) and a different `JobStatus` code set, and one department can send requests to any other. **Never count or color by `JobStatus` across modules** — the same code means different things per department (SQA `1` = waiting to be received, everyone else `1` = waiting for manager approval; PS repeats codes `2` and `3` across two steps each; the terminal "closed" code differs per department). The cross-department vocabulary is **`phase`**, which the API (v2) derives from the DB's `WFStatus` column and sends per item (`waiting_approve` / `waiting_accept` / `in_progress` / `waiting_review` / `waiting_close` / `closed` / `cancelled` / `other`) plus a `phaseSummary` block. Rules: **that mapping belongs to the backend — do not recreate it in the frontend**; KPI cards are built from `phaseSummary`, never a hardcoded list of 8 (a department without a Survey step must not show an empty "รอประเมิน" card); an unknown phase renders as **`other`, never guessed into `closed`**; `phaseSummary` is unaffected by the `phase` filter, so card badges stay truthful while a filter is active.
- **Requester-side steps**: several workflows loop back to the requesting department at the end (`Survey`, `Received-Service`, `Request-Close-Job`) — so an outbox ticket can be finished by the target department yet sit waiting on *us*. The API sends `ownerType` (`requester` / `target` / `null` when closed); `isRequesterSide()` reads it and drives the "รอเราลงมือ" filter. Never infer this from `WFStatus` — PS has `Approved-Request` on both the requester side (step 1) and the target side (step 3).
- **Rows spanning modules**: `docNo` is only unique *within* a module. Any list mixing modules must key rows with `requestKey(row)` (`module::docNo`), never `docNo` alone.
- **Action buttons are data, not code**: every button on a request comes from `item.availableActions` (`code` / `label` / `style` / `requireNote` / `requiredFields`) — **never hardcode a button per department or per step**, and never invent an `action` string; send back exactly the `code` the API gave. `[]` means the user can do nothing right now (not our turn / insufficient permission / already closed) — render no buttons and don't try to work out why. Buttons are UX only: the backend re-checks permission on every POST. **There is deliberately no action button in the grid row** (per user decision, 19 Aug 2026): every action lives only in `RequestDetailModal`, so an approver has to open the ticket and read what was actually requested before deciding — approving straight from a table row is not a real decision. The row's eye button is accented when `availableActions` is non-empty so actionable tickets are still easy to spot. An action with a non-empty `requiredFields` opens a form in `RequestActionDialog`; because the API sends field *names* only (no type/options/labels), `src/data/requestActionFields.ts` supplies the missing metadata — a name it doesn't know still renders as a plain text input rather than blocking the action. Empty strings are stripped before POST (`cleanFieldValues`) because the API treats an omitted field as "keep the existing DB value", so sending `""` would silently wipe it. Every action is irreversible, so `RequestActionDialog` always confirms first. After an action: `applyItem(res.item)` to update the row instantly, then `reload()` because `phaseSummary` is computed server-side. A 409 means someone else moved the ticket — show the API's `message` and reload.

- **Dropdown options come from master data, never from a list typed into the code**: each department's option sets live behind one endpoint (`/MasterData/it` · `/MasterData/pl` · `/MasterData/cr`) with a hook per endpoint. Rules: **the value stored in the form and sent to the API is the option's `name`, not its `id`** (the request APIs store names, and `resolution`/list rows come back as plain text — an id would render as a number); the one exception is CR's ส่วนงาน, which stores the section `code` because `requestTypes`/`requestSubTypes` join on it. **Never ship a hardcoded fallback list** — if the fetch fails, show the API's error plus a "ลองใหม่" button under the field (a list typed by hand drifts from what the backend actually stores, and a mismatched name is written straight into the DB). A saved value that is no longer in the master list must still render as a selected option, otherwise the select silently goes blank and the next save wipes it. Chained lists (IT สาเหตุหลัก→สาเหตุรอง, CR ส่วนงาน→ประเภท→รายละเอียด) clear their children when the parent changes; CR's ids repeat across sections (HV id 1 ≠ FL id 1) so every lookup must filter by section as well. In the create form the chain is declared as data on the field (`master` / `dependsOn` / `resets` in `FieldDef`), not as per-department code in the page.

- **CR request numbers**: `POST /CRRequest` issues the running number **at save time only** — there is no reserve/preview endpoint (the old ASPX page previewed one and it did not match what was saved). Show the `jobNo` from the response, never a guessed number, and never assume the next ticket is +1: CR keeps **32 separate number series**, one per (section + requestType) — `BHV-QUO02/26-0002`. Picking the wrong ส่วนงาน/ประเภทที่แจ้ง sends the ticket into the wrong series and cannot be fixed afterwards, which is why the form confirms those two values before saving. A failed save rolls the whole thing back (number included), so retrying is safe.

## Adding a New Work Page (WinForms → Web migration)
Confirmed pattern (per user decision, 29 Jul 2026) — every new work-order page must follow this. `src/pages/SalesPlan.tsx` is the reference implementation.

1. **Render inside the app `Layout`** — NOT a standalone full-screen page. The Sidebar and Topbar must stay visible; the page is the content area only. Do NOT add a page-level dark header, a "กลับ" (back) button, or a user-info block — the Topbar already provides title/subtitle, user info, and logout.
2. **Layout props**: pass `title` (Thai page name) and `subtitle` (English name). Page-specific header info — e.g. document-no / period chips — stays INSIDE the page card (small light-gray chips at the left of the action toolbar, separated by a divider), NOT on the Topbar (per user decision, 29 Jul 2026).
3. **Page body**: one full-height card — `flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm` — containing (top to bottom, as needed): action toolbar → filter bar → KPI strip → data grid (`relative min-h-0 flex-1` wrapper with an inner `absolute inset-0 overflow-auto` scroller; sticky dark `#0b1220` header row with a 2px accent bottom border) → dark totals footer. The grid scrolls internally; the card itself never scrolls.
3b. **Standard data grid** (per user decision, 10 Aug 2026 — both `SalesPlan.tsx` and `Booking.tsx` must match): sortable headers (click cycles none→asc→desc), Excel-style per-column filter via the shared `ColumnFilter` (`src/components/ui/ColumnFilter.tsx` — do NOT re-implement per page), drag-to-resize on wide text columns, column-view presets (`มาตรฐาน` / `ทั้งหมด` from a `groups`-based preset map in `data/<domain>Data.ts`), and pagination. Put sort/filter/resize/preset/page state in the component; expose pure `cellText`/`compare*` helpers from `data/<domain>Data.ts` for the filter option lists and sort. The **table meta bar** (own row, directly above the grid) is standard: left = `ตาราง N รายการ` + `ล้างตัวกรองตาราง` (badge = active filter count); right = `แสดง [20/50/100/ทั้งหมด] รายการ/หน้า`. The **pagination footer** (own row, below the grid) is standard: left = `แสดง {first}–{last} จาก {N} รายการ`; right = `« ‹ ก่อนหน้า  1 … [p] … n  ถัดไป › »`. Reset `page` to 1 whenever search / preset / sort / filter / page-size changes, and clamp with `safePage = Math.min(page, totalPages)`.
4. **Editing a record**: editing is opened by a per-row **pencil (edit) button in the right-side sticky "จัดการ" action column**, sitting next to the other row actions (delete / print / cancel) — NOT by clicking the row, and NOT via a toolbar "EDIT" button (per user decision, 10 Aug 2026; this supersedes the earlier 29 Jul 2026 "click the row to edit" rule). Both `SalesPlan.tsx` and `Booking.tsx` follow this: the action column header reads "จัดการ" and its buttons `e.stopPropagation()`. Implement with an `editing: <Row> | null` state (`null` = create mode) plus a single `openForm(row | null)` helper; the ADD button calls `openForm(null)` and the row's pencil calls `openForm(row)` (SalesPlan's drawer equivalent is `openRow(line, index)`). In edit mode the form header switches to "แก้ไข…", the "ส่วนที่ 1" badge is replaced by the record's status chip, and the doc-no/date chips show the record's own values instead of AUTO/today. Because fields are uncontrolled (`defaultValue`), put `key={editing?.id ?? 'new'}` on the form scroll container so switching rows remounts and re-fills them.
4b. **Drawer-style forms** (short forms like `SalesPlan.tsx`): a right-side drawer overlay (`fixed inset-0 z-40`, backdrop + `drawer-slide-in`/`backdrop-fade-in` animations from `index.css`), white sections on `#f4f6fa`, footer with ลบ / ยกเลิก / primary save button. Long multi-section forms (`Booking.tsx`, `Delivery.tsx`) use the full-page list↔form swap described above instead.
5. **Types & data**: row/status types in `src/types/<domain>.ts`; column defs, view presets, status meta, and mock rows in `src/data/<domain>Data.ts` (mock until the real API is wired).
5b. **Form controls**: reuse the shared controls in `src/components/ui/FormControls.tsx` (`Field`, `SelectField`, `Check`, `RadioL`, `SectionCard`, `CheckGroup`, `INPUT_CLS`) — do not redefine them per page. List+form pages (`Booking.tsx`, `Delivery.tsx`) use a local `<XxSection>` wrapper that binds section numbers to badge colors and `id`s for the section nav.
6. **Wiring**: add the protected route in `src/App.tsx`, then set `to` on the matching menu item in `src/data/menuData.ts` — the Sidebar entry and Dashboard tile become links automatically (items without `to` stay as placeholders).
7. **Colors**: corporate tone — primary accent `#1a5fb4` for primary buttons/focus/selection/active states (never the mockup's amber `#f59e0b`); keep semantic status colors (blue = quoted, purple = in progress, amber = pending, green = done, red = lost). Numbers/document codes use the `.mono` class (IBM Plex Mono, tabular-nums).
8. **Separate data/logic from UI** (standard — established 7 Aug 2026 while refactoring `SalesPlan.tsx`; page components must NOT inline fetching or business logic):
   - **Data-fetching → `src/hooks/use<Domain>*.ts`**. Each hook owns its `fetch` + `loading` + `error` + optional `reload`, uses the `let alive = true` cleanup guard, and returns plain state. Page components consume the hook, never call `fetch`/`api/*` directly (except a per-interaction call like loading dependent options). Reference: `useMasterData.ts`, `useSalesPlanDocs.ts`. Keep table/UI state (sort, filters, paging, selection) in the component — the hook exposes an action (e.g. `selectPlan`) and the component resets its own UI state around it.
   - **Pure form logic → `src/data/<domain>Form.ts`**: the form-state interface, API↔form mapping (`toPlanForm`), required-field list, `validate<X>Form()` (returns an errors map, no React), and an option-builder (`build<X>Options(master)`). No JSX/hooks here so it stays testable. Reference: `salesPlanForm.ts`.
   - **Memoize derived option arrays**: wrap `build…Options(master)` (and any `.map()` that feeds a `<select>`/searchable combobox) in `useMemo` keyed on the source — long lists (e.g. customers) otherwise re-map + re-filter every keystroke.
   - **Never swallow load errors**: a failed/partial fetch must surface to the user (inline error text + a "ลองใหม่"/reload action), not just leave an empty control. `useMasterData` uses `Promise.allSettled` but still sets an `error` string when any request rejects.

## Environment Variables
Declared in `.env.example` (copy to `.env` and adjust per environment):
- `REACT_APP_API_BASE_URL` — backend API base URL

## Conventions
- TypeScript `strict` mode is enabled (`tsconfig.json`) — no path aliases/`baseUrl` configured, use relative imports.
- ESLint uses the CRA defaults only (`react-app`, `react-app/jest`, configured inline in `package.json`) — no custom rules, no Prettier config.
- Naming is domain-generic ("item"), not domain-specific ("ticket") — e.g. `CreateItem.tsx`, `MyItems.tsx`, `ItemTable.tsx`, `types/item.ts`. Follow this "item" terminology for any new code in this area.

## Design System
(Summarized from `PROJECT_STRUCTURE.md` — see that file for full detail.)
- Primary accent: corporate blue `#1a5fb4` (Tailwind `accent` color in `tailwind.config.js`)
- Accent color per department: IT `#1a5fb4`, HR `#2d7d46`, SV `#b45309`, PL `#5b3fa6`, Sales `#9b3068`
- Menu-group colors (see `menuData.ts`): PL `#5b3fa6`, CR `#1a5fb4`, SV `#b45309`, GA `#2d7d46`, Sales `#9b3068`, Report `#475569`
- Status badge colors: new = blue, pending = amber, urgent = red, done = green
- Visual style: rounded corners (`rounded-xl`/`rounded-2xl`), soft shadows (`shadow-sm`/`shadow-lg`), `border border-gray-200`
- Font: IBM Plex Sans Thai (Google Fonts), with Tahoma/Leelawadee UI fallback

## Gotchas
- Tailwind must be v3, not v4 — v4 silently fails to generate utility classes under CRA. If the compiled CSS is abnormally small (<10KB), Tailwind isn't working; a healthy build is typically >20KB.
- npm package names must be lowercase.

## Related Docs
`PROJECT_STRUCTURE.md` at the repo root is a separate Thai-language **template** document for scaffolding *new* React projects in this same style. It still uses older "ticket" terminology (`CreateTicket`, `MyTickets`, `ticket.ts`) that has since been renamed to "item" in this actual codebase — treat this CLAUDE.md file, not the template, as the source of truth for this project's current structure and naming.
