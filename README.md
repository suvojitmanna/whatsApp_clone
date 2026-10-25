# 💬 WhatsApp Web Clone (Full Stack MERN + Real-time Socket.IO + Meta AI)

<div align="center">

![WhatsApp Web Banner](https://img.shields.io/badge/WhatsApp_Web-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express 5](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**A modern, production-ready WhatsApp Web application built with the MERN stack, WebSockets, WebRTC calling, Meta AI intelligence, Groq Whisper transcription, Secret Locked Chats, and interactive Help Center.**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Environment Setup](#-environment-variables) • [API & Sockets](#-api--socketio-events)

</div>

---

## 🌟 Overview

This project is a high-fidelity replica and modern extension of **WhatsApp Web (2026 Edition)**. It provides end-to-end real-time communication with peer-to-peer audio/video calling, rich status updates, disappearing messages, secret PIN-protected chat locks, and next-generation **Meta AI** capabilities including text rewriting, image generation, voice transcription, live translation, and message scheduling.

---

## 🚀 Key Features

### 💬 Real-Time Messaging & Chat Experience
* **Instant Peer & Group Messaging**: Powered by Socket.IO with instant message delivery, real-time typing indicators, active presence, and read receipts (`Sent` ➔ `Delivered` ➔ `Read` double blue ticks).
* **Scheduled Messages ("Send Later")**: Schedule messages for any future date and time. Backend cron automatically dispatches them when due.
* **Message Reactions & Details**: React with any emoji, inspect individual reaction breakdowns per participant, and unreact seamlessly.
* **Pin Messages with Duration**: Pin critical messages to the top of any chat with custom durations (24 hours, 7 days, or 30 days).
* **Quotes & Thread Replies**: Reply to specific messages with preview context, jump-to-quote scrolling, and highlighted animations.
* **Disappearing Messages**: Set self-destructing conversation timers (24h, 7d, 90d) for ephemeral conversations.
* **Search & Filters**: Instant full-text search across contacts, chat histories, unread messages, and media.

---

### 🤖 Built-in Meta AI & Smart Assistant
* **Direct Meta AI Chat**: Integrated conversational assistant powered by Google Gemini and Groq LLMs.
* **AI Image Generation (`/imagine`)**: Generate high-resolution visuals directly inside chat using `/imagine <prompt>`.
* **🪄 AI Magic Rewrite**: Select any drafted message in the input bar and polish it with one tap:
  * 💼 **Professional**: Formal and business-ready tone.
  * 🤝 **Friendly**: Warm, conversational, and welcoming.
  * ⚡ **Concise**: Clear, brief, and punchy.
  * ✍️ **Fix Grammar**: Clean syntax and spelling fixes.
* **🎙️ Voice Note Auto-Transcription**: Transcribe incoming and outgoing voice notes using **Groq Whisper AI** to read audio messages silently in public.
* **🌐 Real-Time Live Translation**: Auto-translate incoming foreign languages and translate outgoing drafts into 10+ target languages before sending.
* **📊 AI Chat Summarization**: Instant multi-bullet executive summary of missed discussions in group or private chats.

---

### 🔒 Privacy, Security & Secret Locked Chats
* **End-to-End Encryption Framework**: Visual security code verification via 60-digit codes and scannable QR verification.
* **Secret Locked Chats (4-Digit PIN)**: Lock sensitive conversations behind a custom PIN or simulated Touch ID biometric.
* **Hidden Locked Folder**: Locked conversations are quarantined in a dedicated protected folder at the top of the chat list.
* **Chat Lock Management**: Configure, update PIN, toggle biometrics, or reset locks directly from Settings.
* **Block & Report Safeguards**: Granular controls to report abusive accounts and block unwanted contacts.

---

### 📞 WebRTC Voice & Video Calling
* **1-on-1 & Group HD Calling**: Low-latency audio and video calls built with WebRTC and Socket.IO signaling.
* **Shareable Call Links**: Generate joinable meeting links with custom permissions (Audio or Video).
* **In-Call Controls**: Interactive controls for microphone mute, video toggle, camera flip, and screen sharing.

---

### 📸 Status (Stories) & Rich Media
* **24-Hour Ephemeral Stories**: Post text statuses, photos, and video clips that expire automatically after 24 hours.
* **Story Viewers & Replies**: View detailed viewers lists and reply directly to stories into private chat threads.
* **Media & Document Sharing**: Cloudinary integration for photos, videos, voice notes, and file attachments up to 2 GB.
* **In-App Media Viewer**: Interactive modal gallery for inspecting images, video playback, and zooming documents.

---

### 📊 Interactive Add-ons
* **Live In-Chat Polls**: Create single-choice or multi-choice polls with live voting progress bars and voter insights.
* **Event Scheduling**: Create event cards with titles, descriptions, locations, and interactive RSVP responses.
* **Export Chat**: Download chat histories and media logs.

---

### ❓ WhatsApp Web Help Center
* **Complete Help Portal (`/help`)**: Modern WhatsApp Help Center matching WhatsApp Web's layout.
* **Dynamic Deep-Linking**: Support for `?topic=chats-ai`, `?topic=security`, `?topic=privacy-lock`, `?topic=calls`, and `?topic=get-started`.
* **Interactive FAQs & Search**: Fast search across all features, guides, and troubleshooting steps.
* **24/7 In-App Support**: Live ticket submission system with instant ticket ID generation.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Description |
| :--- | :--- |
| **React 19** | Modern declarative UI library |
| **Vite 8** | High-performance frontend bundler & dev server |
| **Tailwind CSS v4** | Utility-first CSS framework with modern color palettes |
| **DaisyUI v5** | Accessible semantic UI components |
| **Zustand** | Lightweight, reactive state management |
| **Socket.IO Client** | Bi-directional WebSocket communication |
| **Framer Motion** | Fluid animations, transitions, and gesture handling |
| **React Router v7** | Declarative client-side routing |
| **Date-fns** | Modern date formatting and manipulation |
| **React Icons** | Full suite of Material, FontAwesome, and Remix icons |

### Backend
| Technology | Description |
| :--- | :--- |
| **Node.js** | Server-side JavaScript runtime |
| **Express 5** | RESTful web framework |
| **MongoDB & Mongoose 9**| NoSQL database and schema modeling |
| **Socket.IO** | Real-time WebSocket server for chat, status, and WebRTC |
| **Cloudinary** | Cloud storage for images, videos, audio notes, and attachments |
| **Twilio & Nodemailer** | SMS / OTP verification and email notifications |
| **JWT & Bcrypt** | Secure token authentication and password hashing |
| **LangChain & LangGraph** | Agentic workflows and AI chaining |
| **Groq (Whisper / LLaMA)** | High-speed audio transcription and fast inference |
| **Google Gemini API** | Multimodal AI assistant and image generation |

---

## 📂 Project Structure

```text
WhatsApp/
├── client/                     # Frontend React (Vite) application
│   ├── src/
│   │   ├── components/         # Shared UI components
│   │   │   ├── common/         # Avatars, buttons, loaders, custom icons
│   │   │   ├── contactInfo/    # Right-hand drawer for contact & group info
│   │   │   ├── info/           # Help Center, Privacy & Security views
│   │   │   ├── layout/         # Left sidebar rail, main layout container
│   │   │   ├── media/          # Audio waveform player, media galleries
│   │   │   ├── modals/         # AI, Call, Pin, Poll, Event, Lock modals
│   │   │   └── panels/         # Overlays, message info, poll detail panels
│   │   ├── pages/              # Routed page views
│   │   │   ├── calls/          # Call history, dialpad, call link views
│   │   │   ├── chatSection/    # Chat list, chat window, message input bar
│   │   │   ├── helpPage/       # Interactive Help Center topics
│   │   │   ├── mediaSection/   # Shared media, links, and documents browser
│   │   │   ├── SettingSection/ # Profile, Chat Lock, Notifications, Theme
│   │   │   ├── statusSection/  # Status creation, viewer, and active stories
│   │   │   ├── user-login/     # Phone/Email login & registration flows
│   │   │   └── videoCall/      # WebRTC video and audio call window
│   │   ├── store/              # Zustand global state stores
│   │   └── utils/              # Helper utilities, dates, audio recorders
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Node.js / Express API
│   ├── config/                 # Database and Cloudinary configuration
│   ├── controllers/            # Route controllers (Auth, Chat, Status)
│   ├── middleware/             # JWT auth validation, file upload handlers
│   ├── models/                 # Mongoose schemas (User, Conversation, Message, Status)
│   ├── routes/                 # Express route definitions
│   ├── socket/                 # Socket.IO connection handlers & WebRTC signaling
│   ├── index.js                # Server entrypoint
│   └── package.json
│
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Variables

Create `.env` files in both `server/` and `client/` directories based on the configurations below:

### Server Configuration (`server/.env`)
```env
# Server Port & Database
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/whatsapp?retryWrites=true&w=majority

# Security & Authentication
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:5173

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI & LLM Providers
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=whisper-large-v3
META_AI_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=your_openai_api_key_optional

# Twilio (SMS / Phone Verification - Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SERVICE_SID=your_twilio_service_sid

# Nodemailer (Email Verification - Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### Client Configuration (`client/.env`)
```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000
```

---

## 💻 Getting Started

### Prerequisites
* **Node.js** (v18.x or v20.x+ recommended)
* **npm** or **pnpm**
* **MongoDB** (Local instance or MongoDB Atlas cluster)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/whatsapp-clone.git
cd whatsapp-clone
```

### Step 2: Install Dependencies

#### Install Server Dependencies:
```bash
cd server
npm install
```

#### Install Client Dependencies:
```bash
cd ../client
npm install
```

---

### Step 3: Run the Application

#### 1. Start the Backend Server:
```bash
cd server
npm run dev
```
*Server starts on `http://localhost:5000` with MongoDB and Socket.IO initialized.*

#### 2. Start the Frontend Client:
```bash
cd client
npm run dev
```
*Vite dev server starts on `http://localhost:5173`.*

---

## 📡 API & Socket.IO Events

### Key REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive authentication token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/chat/conversations` | Fetch all active conversations |
| `POST` | `/api/chat/messages` | Send a new message (text, media, audio, scheduled) |
| `GET` | `/api/chat/messages/:id` | Retrieve messages for a conversation |
| `POST` | `/api/status` | Upload a new 24-hour status story |
| `GET` | `/api/status` | Retrieve status stories from contacts |

### Real-Time WebSocket Events

| Event Name | Direction | Payload / Description |
| :--- | :--- | :--- |
| `join_chat` | Client ➔ Server | Join private or group chat room |
| `send_message` | Client ➔ Server | Emit outgoing message |
| `receive_message` | Server ➔ Client | Receive new incoming message |
| `typing` / `stop_typing` | Both | Display / hide real-time typing indicators |
| `message_read` | Client ➔ Server | Update message status to read (double blue ticks) |
| `call_user` / `call_accepted` | Both | WebRTC peer-to-peer call signaling |
| `user_status` | Server ➔ Client | Broadcast online / offline presence |

---

## 🛡️ Security & Privacy Notice
* All chat messages sent over WebSockets are authenticated with JWT.
* Passwords are encrypted using salted `bcrypt` hashing before storage.
* Passcode-protected Locked Chats use local device hashing to keep conversations safe even if your physical machine is left unattended.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
