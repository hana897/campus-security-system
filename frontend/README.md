# Smart Campus Security & Asset Verification System — React SOC Frontend

An enterprise-grade **Security Operations Center (SOC)** web application designed for university campus physical asset tracking, gate exit verification, theft prevention, security audits, and real-time checkpoint monitoring.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Download from [nodejs.org](https://nodejs.org/))
- **npm** or **yarn** / **pnpm**

### 2. Installation
```bash
cd frontend
npm install
```

### 3. Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Architecture & Directory Structure

```text
src/
├── api/                 # Axios HTTP client with request/response interceptors
├── assets/              # Icons, badges, static assets
├── components/          # Reusable UI component library
│   ├── common/          # StatusBadge, Toast, Modal, Skeletons, ConfirmDialog
│   ├── dashboard/       # SecurityScore, LiveGateMonitor, LiveActivityStream, GateStatusList
│   ├── layout/          # NavigationRail, TopSecurityBar, CommandPalette, NotificationDrawer
│   └── verification/    # ScannerTerminal, ManualLookup, InspectionModal, ExitPassModal
├── constants/           # Campus gates, statuses, Ethiopian university departments, shortcuts
├── context/             # SecurityContext (auth, active gate, theme, alerts, live event bus)
├── pages/               # Full operational screens
│   ├── auth/            # Security Terminal Login (/login)
│   ├── dashboard/       # Central Command Center (/dashboard)
│   ├── assets/          # Asset Registry, Details, and Registration (/assets)
│   ├── owners/          # Student & Staff Directory & Profiles (/owners)
│   ├── verification/    # Gate Verification Terminal & History Timeline (/verification)
│   ├── incidents/       # Security Incident Management Center (/incidents)
│   ├── reports/         # Executive Analytics & Gate Traffic Reports (/reports)
│   ├── profile/         # Officer Identity & Duty Status (/profile)
│   └── settings/        # 7-Tab Security Terminal & System Settings (/settings)
├── routes/              # Protected React Router v6 configuration
├── services/            # Isolated API service layer (mock-first, Django-ready)
├── styles/              # CSS variables design system (theme.css, index.css)
└── types/               # Comprehensive TypeScript interfaces & domain models
```

---

## 🔌 Django REST Framework Backend Integration

All API interactions are isolated in `src/services/` and consume `src/api/client.ts`. To link this frontend to your active Django backend:

1. Copy `.env.example` to `.env`:
   ```bash
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```
2. The services match your Django apps:
   - `authService.ts` ➔ `/api/auth/login/`
   - `assetService.ts` ➔ `/api/assets/`
   - `ownerService.ts` ➔ `/api/owners/`
   - `verificationService.ts` ➔ `/api/verification/verify/` & `/api/verification/history/`
   - `incidentService.ts` ➔ `/api/incidents/`
   - `reportService.ts` ➔ `/api/reports/`
   - `profileService.ts` ➔ `/api/profile/`
   - `settingsService.ts` ➔ `/api/settings/`

---

## 🎨 Visual Identity & Key Features

- **Dark SOC Aesthetic**: `#070a0f` deep obsidian canvas with `#111823` command surfaces.
- **Light Slate Alternative**: Instant one-click toggle persisted in `localStorage`.
- **Keyboard Shortcuts**:
  - `Ctrl + K` / `Cmd + K`: Instant Command Search Palette
  - `F2`: Instant Gate Verification Terminal shortcut
  - `Esc`: Close open drawers & modals
- **Live Gate Monitor**: Real-time simulated radar sweep, gate count telemetry, and animated event stream.
- **Incident Urgency Treatment**: Pulsing crimson alert mode when a flagged or stolen asset is scanned.
- **Exit Pass Generator**: Generates verifiable digital gate passes (`GP-2026-XXXX`) with printable clearance slips.
