📝 NEXT Notes
NEXT Notes is a high-performance, full-stack notes application designed to help you capture, organize, and secure your thoughts seamlessly. With an intuitive, animated interface and powerful backend architecture, it provides a modern note-taking experience with advanced AI integrations and strict privacy controls.

🚀 Tech Stack
Framework: Next.js (App Router / API Routes)

Styling: Tailwind CSS & NextUI

Animations: Framer Motion

Database: PostgreSQL with Prisma ORM

Authentication: NextAuth.js

AI Integration: Google Gemini AI

Icons: Lucide React

Deployment: Vercel

✨ Key Features
🔐 Secure Authentication: Seamless and secure user login, registration, and session management powered by NextAuth.

🤖 Gemini AI Assistant: Integrated AI capabilities to help brainstorm, structure, and refine your notes.

🔒 The Vault: A dedicated, password-protected space to lock away your most sensitive notes. Vault contents are kept strictly isolated from standard views.

🗑️ Trash & Recovery: Accidental deletion? No problem. Soft-delete notes into the Trash bin and restore them whenever needed.

🔍 Smart Search & Filtering: Instantly locate specific notes across your entire workspace.

🎨 Responsive & Animated UI: A beautiful, responsive interface featuring interactive sidebar navigation, modular note cards, and smooth modal transitions.

⚡ Real-time Updates: Dynamic UI state management for immediate feedback when creating, editing, or locking notes.

🐛 Recent Bug Fixes & Improvements
✅ NextAuth Route Handling: Fixed explicit explicit GET and POST route exports for the NextAuth handler to ensure stable authentication flows.

✅ Vault Data Isolation: Resolved database query issues where Vault contents were not properly mapping; ensured locked notes remain strictly hidden from the primary dashboard feed.

✅ API Route Protection: Fortified server-side endpoints (/api/notes) to strictly verify active sessions and prevent unauthorized access.

✅ Modal State Management: Fixed UI overlapping and state synchronization issues between the NoteEditorModal and VaultLock components.

✅ Database Schema Optimizations: Refined Prisma schema relationships to better handle complex user interactions with notes, vault states, and trash flags.
