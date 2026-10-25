# 💬 WhatsApp Clone (MERN + Socket.IO + Meta AI)

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:25D366,100:075E54&height=220&section=header&text=WhatsApp%20Clone&fontSize=45&fontColor=ffffff&animation=fadeIn&desc=Real-time%20Chat%20%7C%20WebRTC%20Calls%20%7C%20Meta%20AI%20Assistant&descAlignY=75" alt="WhatsApp Clone Header" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?color=00FFAA&size=24&center=true&vCenter=true&width=850&lines=Real-time+Messaging+with+Socket.IO;WebRTC+HD+Voice+%26+Video+Calling;Meta+AI+Assistant+%26+Smart+Rewrite;Groq+Whisper+Voice+Transcription;Secret+PIN-Locked+Chats+%26+Touch+ID;Full-Stack+MERN+Architecture" alt="Typing SVG" />
</p>

---

## 🏆 Badges

<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-4CAF50?style=for-the-badge&logo=react&logoColor=white" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/WebRTC-Audio%20%26%20Video-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/AI-Meta%20AI%20%26%20Groq-blueviolet?style=for-the-badge&logo=openai&logoColor=white" alt="Meta AI & Groq" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Status-Production-success?style=for-the-badge" alt="Status" />
</p>

---

## 🌍 Live Demo & Repository

- 🚀 **Live Application:** [https://whatsapp-gilt-alpha.vercel.app](https://whatsapp-gilt-alpha.vercel.app)
- 💻 **GitHub Repository:** [https://github.com/suvojitmanna/whatsApp_clone](https://github.com/suvojitmanna/whatsApp_clone)

---

## 🧠 Project Overview

A production-grade, highly scalable real-time communication platform inspired by **WhatsApp Web (2026 Edition)**. Built on the **MERN** stack, it delivers ultra-low-latency messaging via **Socket.IO**, peer-to-peer audio/video calling using **WebRTC**, intelligent messaging tools powered by **Meta AI & Groq Whisper**, 4-digit PIN secret locked chats, and rich media sharing backed by Cloudinary.

### ✨ Core Highlights
* ⚡ **Real-time Bi-directional Messaging**: Instant message delivery with live typing indicators and read receipts (`Sent` ➔ `Delivered` ➔ `Read` double blue ticks).
* 🟢 **Live User Presence Tracking**: Accurate online/offline status with "Last Seen" updates.
* 🤖 **Meta AI & Agentic Suite**: In-chat AI assistant, `/imagine` image generation, 🪄 Magic Rewrite (Professional, Friendly, Concise, Grammar), Groq Whisper audio transcription, and real-time live chat translation.
* 🔒 **High-Grade Privacy & Security**: Visual 60-digit and QR End-to-End Encryption verification, Secret PIN Locked Chats with biometric simulation, and disappearing message timers.
* 📞 **HD Voice & Video Calling**: WebRTC-powered 1-on-1 and group calls with shareable meeting links and call controls.
* 📸 **Status (Stories)**: 24-hour disappearing photo, video, and text status updates with viewers analytics.
* ⏰ **Scheduled Messages ("Send Later")**: Schedule messages for any future date/time with automatic background dispatching.
* ⏰ **In-Chat Message Reminders & Snooze**: Set smart reminder alarms on any message with 1-click presets (10m, 1h, tonight, tomorrow, custom), audio chime notifications, and 1-click jump-to-message.
* 👁️ **View-Once Confidential Messages & Media**: Send self-destructing text messages (passwords/secrets) and media with an animated 5-second countdown timer, screenshot/copy protection, and permanent "Opened" status.
* 📊 **Interactive In-Chat Cards**: Real-time multi-choice Polls and Event invitations with live RSVP tracking.

<p align="center">
  <img src="https://skillicons.dev/icons?i=mongodb,express,react,nodejs,tailwind,vite,webrtc" alt="Tech Stack Icons" />
</p>

---

## 🖼️ Demo Preview

<p align="center">
  <img width="100%" alt="WhatsApp Web App Demo Preview" src="https://github.com/user-attachments/assets/f51b131c-e1de-496a-9e30-e941f7987bcd" />
</p>

---

## 🧠 System Design & Architecture Diagrams

### 1. High-Level System Architecture
```mermaid
flowchart TD
    User["👤 User (Web / Mobile)"] --> Frontend["⚛️ React 19 Frontend (Vite + Zustand)"]
    Frontend -->|HTTPS REST| Backend["🟢 Express 5 Backend"]
    Frontend <-->|WSS Real-time Events| Socket["⚡ Socket.IO Server"]
    Frontend <-->|WebRTC Encrypted P2P| Peer["📱 Peer Client (Voice / Video)"]
    
    Backend --> Auth["🛡️ JWT Auth Middleware"]
    Auth --> Controllers["🎮 Controllers (Chat, Auth, Status)"]
    
    Controllers <--> MongoDB[("🍃 MongoDB Database")]
    Controllers <--> Cloudinary["☁️ Cloudinary CDN"]
    Controllers <--> AI["🤖 Gemini AI & Groq Whisper"]
    
    Backend <--> Socket
    Scheduler["⏰ Background Message Scheduler"] --> MongoDB
    Scheduler --> Socket
```

---

### 2. Real-Time Message Flow & Delivery Lifecycle
```mermaid
sequenceDiagram
    autonumber
    participant Alice as 👩 Alice (Sender)
    participant ClientA as 💻 Alice Client
    participant Server as 🟢 Node.js / Socket.IO Server
    participant DB as 🍃 MongoDB
    participant ClientB as 💻 Bob Client
    participant Bob as 👨 Bob (Recipient)

    Alice->>ClientA: Types draft & clicks Send
    ClientA->>ClientA: Optimistic UI render (Clock icon)
    ClientA->>Server: POST /api/chat/messages (or 'send_message')
    Server->>DB: Save message (status: 'sent')
    Server-->>ClientA: HTTP 201 ack (Message ID)
    ClientA->>Alice: Display Single Tick (✓)

    alt Bob is Online
        Server->>ClientB: emit 'receive_message'
        ClientB->>Server: emit 'message_delivered'
        Server->>DB: Update status to 'delivered'
        Server->>ClientA: emit 'message_status_update'
        ClientA->>Alice: Display Double Gray Ticks (✓✓)
        
        Bob->>ClientB: Opens chat conversation
        ClientB->>Server: emit 'message_read'
        Server->>DB: Update status to 'read'
        Server->>ClientA: emit 'message_read_receipt'
        ClientA->>Alice: Display Double Blue Ticks (✓✓)
    else Bob is Offline
        Server->>DB: Persist with status 'sent' until reconnect
    end
```

---

### 3. Frontend Component & Store Architecture
```mermaid
flowchart LR
    UI["🎨 UI Layer (Layout, ChatWindow, Modals)"] --> Store["⚡ Zustand Stores (User, Chat, Call, Theme)"]
    Store --> Axios["📡 Axios REST API Client"]
    Store --> SocketClient["⚡ Socket.IO Client"]
    Store --> WebRTCClient["📹 RTCPeerConnection"]
    
    Axios --> BackendAPI["🟢 Express.js API"]
    SocketClient --> SocketServer["⚡ Socket.IO Server"]
    WebRTCClient --> P2PPeer["📱 Remote Peer"]
```

---

### 4. Backend Service Architecture
```mermaid
flowchart TD
    ClientReq["Incoming Client Request"] --> Router["Express Router Gateway"]
    Router --> Middleware["🛡️ Middleware (CORS, JWT Guard, Multer)"]
    Middleware --> Controllers["🎮 Controllers (Chat, Auth, Status)"]
    
    Controllers <--> Models["🗄️ Mongoose Models (User, Chat, Message, Status)"]
    Models <--> DB[("🍃 MongoDB Database")]
    
    Controllers <--> Cloudinary["☁️ Cloudinary Storage"]
    Controllers <--> Gemini["🤖 Google Gemini AI"]
    Controllers <--> Groq["🎙️ Groq Whisper Transcription"]
    Controllers <--> Twilio["📱 Twilio SMS"]
    
    Cron["⏰ Node-Cron Scheduler"] --> Models
    Cron --> SocketGateway["⚡ Socket.IO Gateway"]
```

---

### 5. WebRTC Peer-to-Peer Calling Flow
```mermaid
sequenceDiagram
    autonumber
    participant Caller as 📞 Caller (User A)
    participant Signaling as ⚡ Socket.IO Signaling Server
    participant Callee as 📲 Callee (User B)

    Caller->>Signaling: emit 'call_user' (offer, signalData, type)
    Signaling->>Callee: emit 'incoming_call' (offer, from)
    Callee->>Callee: Trigger Ringtone & Call Modal
    
    alt Call Accepted
        Callee->>Signaling: emit 'accept_call' (answer, signal)
        Signaling->>Caller: emit 'call_accepted' (answer)
        Caller->>Callee: P2P Direct Media Stream (Audio/Video)
    else Call Declined
        Callee->>Signaling: emit 'end_call'
        Signaling->>Caller: emit 'call_ended'
    end
```

---

### 6. Meta AI Magic Rewrite & Voice Transcription Flow
```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 User
    participant ChatBar as 🪄 Chat Input Bar
    participant Server as 🟢 Backend API
    participant GroqWhisper as 🎙️ Groq Whisper AI
    participant GeminiAI as 🤖 Google Gemini AI

    alt Voice Note Auto-Transcription
        User->>ChatBar: Record Voice Note (.wav / .webm)
        ChatBar->>Server: Upload Voice Audio
        Server->>GroqWhisper: Stream Audio
        GroqWhisper-->>Server: Transcribed Text
        Server-->>ChatBar: Message with audioUrl + transcript
        ChatBar->>User: Display '📝 Read Transcript' Option
    else Magic Rewrite
        User->>ChatBar: Draft: "plz send file asap"
        User->>ChatBar: Clicks Magic Wand (Tone: Professional)
        ChatBar->>Server: POST /api/chat/ai/rewrite
        Server->>GeminiAI: Generate polished rewrite
        GeminiAI-->>Server: "Could you please share the file at your earliest convenience?"
        Server-->>ChatBar: Replace draft with polished message
    end
```

---

## 🧩 Project Structure

```text
whatsApp_clone/
├── client/                          # React 19 Frontend (Vite 8)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Avatars, buttons, loaders, custom icons
│   │   │   ├── contactInfo/         # Contact & group settings drawer
│   │   │   ├── info/                # Modern WhatsApp Help Center & Privacy
│   │   │   ├── layout/              # SideBar navigation rail & Layout container
│   │   │   ├── media/               # Waveform audio player, media gallery
│   │   │   ├── modals/              # AI, WebRTC Call, PIN Lock, Poll, Event modals
│   │   │   └── panels/              # Message info, Poll analytics panels
│   │   ├── pages/
│   │   │   ├── calls/               # Call logs, Dialpad, Shareable Call Links
│   │   │   ├── chatSection/         # Chat list, Message bubbles, Input bar
│   │   │   ├── helpPage/            # Help Center topics, FAQs & 24/7 Support
│   │   │   ├── mediaSection/        # Media, links & document explorer
│   │   │   ├── SettingSection/      # Profile, Chat Lock PIN, Notifications, Themes
│   │   │   ├── statusSection/       # 24-hour disappearing Stories & creator
│   │   │   ├── user-login/          # Authentication & onboarding flow
│   │   │   └── videoCall/           # Fullscreen WebRTC Audio/Video call room
│   │   ├── store/                   # Zustand state stores (User, Chat, Call, Theme)
│   │   └── utils/                   # Formatting helpers, audio recorder, socket client
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js + Express 5 Backend
│   ├── config/                      # MongoDB connection & Cloudinary setup
│   ├── controllers/                 # authController.js, chatController.js, statusController.js
│   ├── middleware/                  # JWT auth verification, Multer upload
│   ├── models/                      # User.js, ConverSation.js, message.js, status.js
│   ├── routes/                      # authRoute.js, chatRoute.js, statusRoute.js
│   ├── socket/                      # Socket.IO connection handlers & WebRTC signaling
│   ├── index.js                     # Server entrypoint
│   └── package.json
│
└── README.md                        # Documentation & Architecture Guide
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/suvojitmanna/whatsApp_clone.git
cd whatsApp_clone
```

### 2. Configure Environment Variables

#### Backend Configuration (`server/.env`):
```env
# Server Port & MongoDB
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string

# Authentication & CORS
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI & Speech Services
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=whisper-large-v3
META_AI_MODEL=llama-3.3-70b-versatile
```

#### Frontend Configuration (`client/.env`):
```env
VITE_API_URL=http://localhost:5000
```

---

### 3. Install Dependencies & Run

#### Backend:
```bash
cd server
npm install
npm run dev
```
*Server runs on `http://localhost:5000`*

#### Frontend:
```bash
cd ../client
npm install
npm run dev
```
*Vite client runs on `http://localhost:5173`*

---

## 🔗 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT cookie |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/chat/conversations` | Retrieve all active user chats & groups |
| `POST` | `/api/chat/messages` | Send message (Text, Media, Audio, Scheduled) |
| `GET` | `/api/chat/messages/:id` | Fetch conversation messages |
| `POST` | `/api/chat/messages/react` | Add or update emoji reaction |
| `POST` | `/api/chat/ai/rewrite` | AI Magic message rewrite |
| `POST` | `/api/status` | Create new 24h status story |
| `GET` | `/api/status` | Fetch contacts status stories |

---

## 📡 Socket.IO Real-Time Events Reference

| Event Name | Direction | Purpose |
| :--- | :--- | :--- |
| `join_chat` | Client ➔ Server | Join private conversation or group channel |
| `send_message` | Client ➔ Server | Broadcast new chat message |
| `receive_message` | Server ➔ Client | Receive new incoming message |
| `typing` / `stop_typing` | Both | Trigger real-time typing state indicator |
| `message_read` | Client ➔ Server | Send blue-tick read receipts |
| `call_user` | Client ➔ Server | Initiate WebRTC audio/video call |
| `incoming_call` | Server ➔ Client | Prompt callee with call modal & ringtone |
| `accept_call` / `end_call` | Both | WebRTC session acceptance & termination |
| `user_status` | Server ➔ Client | Broadcast online/offline presence |

---

## 📊 GitHub Insights & Statistics

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=suvojitmanna&show_icons=true&theme=tokyonight&hide_border=true" alt="GitHub Stats" />
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=suvojitmanna&theme=tokyonight&hide_border=true" alt="GitHub Streak" />
</p>

<p align="center">
  <img src="https://github-readme-activity-graph.vercel.app/graph?username=suvojitmanna&theme=react-dark&hide_border=true&area=true" alt="Contribution Graph" />
</p>

<p align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=suvojitmanna&theme=onedark&no-frame=true&margin-w=10" alt="Trophies" />
</p>

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
```bash
# 1. Fork the Project
# 2. Create your Feature Branch
git checkout -b feature/AmazingFeature

# 3. Commit your Changes
git commit -m "Add some AmazingFeature"

# 4. Push to the Branch
git push origin feature/AmazingFeature

# 5. Open a Pull Request
```

---

## ⭐ Support & Acknowledgments

If you found this project helpful or inspiring, please consider giving it a **star**! ⭐

- ⭐ **Star** the repository on [GitHub](https://github.com/suvojitmanna/whatsApp_clone)
- 🍴 **Fork** it to build your own custom real-time features
- 📢 **Share** it with your developer community

---

## 👨‍💻 Author

**Suvojit Manna**
- 🌐 **Portfolio / Live App:** [https://whatsapp-gilt-alpha.vercel.app](https://whatsapp-gilt-alpha.vercel.app)
- 🐙 **GitHub:** [@suvojitmanna](https://github.com/suvojitmanna)

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👁️ Profile Views
<p align="center">
  <img src="https://komarev.com/ghpvc/?username=suvojitmanna&label=Profile%20Views&color=brightgreen&style=for-the-badge" alt="Profile Views" />
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:075E54,100:25D366&height=140&section=footer" alt="Footer Waving Banner" />
</p>
