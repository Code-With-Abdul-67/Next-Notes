<h3>📝 NEXT Notes</h3>

A premium, secure, and beautifully designed note-taking workspace built with **Next.js 16**, **AES-256-GCM client-side encryption**, and a glassmorphism UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

### 🔐 Authentication
- Google OAuth sign-in via NextAuth.js
- JWT session strategy with persistent login
- Logout confirmation modal

### 📒 Notes
- Create, edit, and delete notes with title and content
- **Auto-save** — existing notes save automatically 1.5s after you stop typing
- **Live word & character count** in the editor
- **Pin notes** — pinned notes sort to the top with a "Pinned / Others" section divider
- **Duplicate notes** — one-click copy of any note
- **Sort options** — Last edited / Date created / Title A–Z
- **Export notes** — download all visible notes as a `.json` file
- **Search** — debounced full-text search across title and content
- **Keyboard shortcut** — `Ctrl+N` / `Cmd+N` to open new note from anywhere

### 🔒 Secret Vault
- **AES-256-GCM client-side encryption** — your vault password never leaves the browser
- PBKDF2 key derivation with SHA-256, 100,000 iterations
- Create, unlock, and lock the vault with a master password
- **Vault auto-lock** — automatically locks after 10 minutes of inactivity
- **Lock Vault button** in the vault header with confirmation modal
- **Forgot password** — sends a 6-digit OTP to your registered email (5-minute expiry)
- Vault notes are fully encrypted before being sent to the server — the server never sees plaintext
- Redirects to vault setup when trying to lock a note without a vault

### 🗑️ Recycle Bin
- Soft-delete notes — move to bin and recover later
- Permanently delete individual notes or empty the entire bin
- Notes in the bin cannot be edited

### 🎨 UI & UX
- **Glassmorphism design system** — `glass-panel`, `glass-card`, `glass-input` utility classes
- **Sheen slide animation** — `.btn-sheen` CSS utility on every button across the app
- **Animated toasts** — vault, bin, deleted, error, success, duplicate notifications
- **Animated mobile drawer** — sidebar slides in from left with spring physics
- **Floating action button** — always-visible `+` button on mobile
- **Colored nav items** — All Notes (blue), Secret Vault (amber), Recycle Bin (red)
- **Colored header icons** — matching colors per view
- **Empty state buttons** — "Create Note" / "Add to Vault" on mobile empty states
- **Pinned section divider** — visual separation between pinned and other notes
- **PWA support** — installable, service worker, web manifest

---

## 🛡️ Security

| Area | Implementation |
|---|---|
| Vault encryption | AES-256-GCM, client-side only |
| Key derivation | PBKDF2-SHA256, 100k iterations |
| Password storage | bcrypt (12 rounds) |
| Brute-force protection | 5 attempts / 15 min rate limit on vault verify |
| Timing attack prevention | `crypto.timingSafeEqual` for OTP comparison |
| Input sanitization | Title capped at 500 chars, content at 100k chars |
| Permanent delete guard | Notes must be in bin before permanent deletion |
| Session security | JWT strategy, `refetchOnWindowFocus: false` |

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma 6 |
| Auth | NextAuth.js v4 + Google OAuth |
| Encryption | Web Crypto API (AES-256-GCM) |
| UI Components | NextUI v2 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Tailwind CSS v3 |
| Email | Nodemailer + Gmail SMTP |
| Deployment | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route
│   │   ├── notes/                # CRUD + empty-bin + duplicate
│   │   ├── user/                 # Account deletion
│   │   └── vault/                # Setup, verify, reset, delete
│   ├── globals.css               # Glass UI + sheen animation utilities
│   ├── layout.tsx
│   └── page.tsx                  # Login screen + Dashboard entry
├── backend/
│   └── lib/
│       ├── auth.ts               # NextAuth config
│       ├── prisma.ts             # DB singleton
│       └── email.ts              # Nodemailer Gmail SMTP
└── frontend/
    ├── components/
    │   ├── layout/               # Dashboard, Sidebar, InstallPrompt
    │   ├── notes/                # NoteCard, NoteEditorModal
    │   ├── vault/                # VaultLock, VaultReset, VaultUnlockModal
    │   └── ui/                   # ConfirmationModal, Toast
    └── lib/
        └── crypto.ts             # AES-256-GCM encrypt/decrypt utilities
```


## 🐛 Known Behaviour

- **Vault password reset deletes all vault notes** — this is intentional. Because encryption is client-side, the server cannot re-encrypt notes with the new password. This is the same behaviour as professional password managers.
- **Vault search** — vault notes store empty strings in the database (encrypted data is in a separate field), so server-side search doesn't match vault notes.


