# NexusMeet - Premium Real-Time Collaboration SaaS

NexusMeet is a production-ready, full-stack real-time collaboration application designed with a sleek, modern, dark-mode-first aesthetic inspired by Linear, Notion, and Vercel. It integrates high-performance multi-user WebRTC video calling, real-time message chat, whiteboard collaboration, and complete admin dashboard tools.

---

## Features

- **Multi-user Video & Audio Calling**: Pure WebRTC connection grid with active speaker detection, mute controls, and connectivity status markers.
- **Screen Sharing**: Live presentation mode utilizing browser capture interfaces, allowing presenter switching.
- **Real-Time Interactive Whiteboard**: Interactive vector canvas supports Pen, Highlighter, Circle, Rectangle, Arrow, Text, Sticky Notes, undo/redo buffers, line sizing, and color picking synced across participants.
- **Chat Interface**: Rich messaging with typing indicators, emoji selectors, and file sharing attachments.
- **File Sharing**: Live document upload (images, PDFs, documents) with status progress indicators and download controls.
- **Structured Meetings**: Join with secure visual meeting codes, invite link exports, and scheduled history listings.
- **Security & Authorization**: JWT credentials saved in secure HTTPOnly cookies, rate-limiting handlers, and database schema validation rules.
- **Admin Dashboard**: System diagnostics, active calls tracker, list of registered users, and system analytics.

---

## Tech Stack

### Frontend
- React 19, Vite, TypeScript
- Tailwind CSS
- React Router DOM
- Zustand (State management)
- Framer Motion (Transitions and micro-animations)
- Socket.io Client
- Lucide React (Icons)
- TanStack Query & Axios

### Backend
- Node.js, Express.js
- MongoDB Atlas (via Mongoose)
- Socket.io (Signaling & data sync)
- JWT & bcryptjs
- Helmet & Express Rate Limit (API protection)
- Multer (Local & Cloudinary uploads)

---

## Folder Structure

```text
CodeAlpha_NexusMeet/
├── client/                 # React Frontend
│   └── src/
│       ├── assets/         # Images, global media files
│       ├── components/     # Modular layout & UI components
│       ├── context/        # Global context (Socket, Auth)
│       ├── hooks/          # Custom hooks (useWebRTC, etc.)
│       ├── layouts/        # Page layouts (AppLayout, AuthLayout)
│       ├── pages/          # Client pages (Meeting, Dashboard, Admin)
│       ├── routes/         # Routing configurations
│       ├── services/       # API call handlers (Axios clients)
│       ├── store/          # Zustand global states (Whiteboard, room)
│       ├── styles/         # Global stylesheets (Tailwind config)
│       └── types/          # TypeScript structural interfaces
├── server/                 # Express Backend
│   ├── config/             # DB & Cloudinary startup configs
│   ├── controllers/        # REST route handler logic
│   ├── middleware/         # Auth, validation, error boundary layers
│   ├── models/             # Mongoose schemas (User, Meeting, messages)
│   ├── routes/             # REST route entries
│   ├── services/           # Socket & Signaling orchestrators
│   ├── sockets/            # Chat, meeting, and whiteboard sockets
│   └── uploads/            # Local temporary uploads fallback directory
├── .gitignore
├── .env.example
└── README.md
```

---

## Installation & Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

### Steps

1. **Clone and Navigate**:
   ```bash
   cd CodeAlpha_NexusMeet
   ```

2. **Backend Setup**:
   Create a `.env` file under the `/server` directory matching `.env.example`.
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Frontend Setup**:
   Create a `.env` file under the `/client` directory.
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. **Accessing the App**:
   Navigate to `http://localhost:5173`. The backend will run on `http://localhost:5000`.

---

## API Endpoints

- **Auth**:
  - `POST /api/auth/register` - Create user
  - `POST /api/auth/login` - Secure session login
  - `POST /api/auth/logout` - Clear cookies
  - `GET /api/auth/me` - Fetch authenticated user
- **Meetings**:
  - `POST /api/meetings` - Create/Schedule a meeting
  - `GET /api/meetings/code/:code` - Verify join code
  - `GET /api/meetings/history` - User meeting logs
- **Users**:
  - `PUT /api/users/profile` - Update detail profile
- **Admin**:
  - `GET /api/admin/stats` - System usage analytics

---

## License
MIT License. Created by NexusMeet Team.
