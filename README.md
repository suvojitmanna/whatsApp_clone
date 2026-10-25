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
* 📊 **Interactive In-Chat Cards**: Real-time multi-choice Polls and Event invitations with live RSVP tracking.

<p align="center">
  <img src="https://skillicons.dev/icons?i=mongodb,express,react,nodejs,tailwind,vite,webrtc" alt="Tech Stack Icons" />
</p>

---

## 🖼️ Demo Preview

<p align="center">
  <img width="100%" alt="WhatsApp Web App Demo Preview" src="https://github.com/user-attachments/assets/f51b131c-e1de-496a-9e30-e941f7987bcd" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);" />
</p>

---

## 🧠 System Design & Architecture Diagrams

### 1. High-Level System Architecture
```mermaid
flowchart TD
    User["👤 Client (Browser / Mobile)"]
    
    subgraph Frontend["⚛️ Frontend Layer (React 19 + Vite + Zustand)"]
        UI["UI / Layout Components"]
        ZustandStore["Zustand Global State Stores"]
        AxiosClient["Axios REST API Client"]
        SocketClient["Socket.IO Client"]
        WebRTCClient["WebRTC Peer Connection"]
    end

    subgraph Backend["🟢 Backend Layer (Node.js + Express 5)"]
        APIRouter["Express API Routes"]
        AuthMiddleware["JWT Auth Middleware"]
        Controllers["Controllers (Chat, Auth, Status)"]
        SchedulerService["Background Message Scheduler"]
        SocketServer["Socket.IO WebSocket Server"]
        WebRTCSignaling["WebRTC Call Signaling"]
    end

    subgraph DataAndCloud["☁️ Data & Cloud Infrastructure"]
        MongoDB[("🍃 MongoDB Atlas")]
        Cloudinary["☁️ Cloudinary Media CDN"]
        AIServices["🤖 AI APIs (Gemini + Groq Whisper + LangChain)"]
    end

    User <--> UI
    UI <--> ZustandStore
    ZustandStore <--> AxiosClient
    ZustandStore <--> SocketClient
    ZustandStore <--> WebRTCClient

    AxiosClient -->|HTTPS REST| APIRouter
    APIRouter --> AuthMiddleware --> Controllers
    Controllers <--> MongoDB
    Controllers <--> Cloudinary
    Controllers <--> AIServices
    SchedulerService <--> MongoDB
    SchedulerService --> SocketServer

    SocketClient <-->|WSS Real-time Events| SocketServer
    WebRTCClient <-->|ICE / SDP Signaling| WebRTCSignaling
    WebRTCSignaling <--> SocketServer
    WebRTCClient <==>|Encrypted P2P Media Stream| WebRTCClient
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
    ClientA->>ClientA: Optimistic UI render (Clock / Sending)
    ClientA->>Server: HTTP POST /api/chat/messages (or socket 'send_message')
    Server->>DB: Save message (status: 'sent')
    Server-->>ClientA: HTTP 201 / ack with saved Message ID
    ClientA->>ClientA: Update status icon: Single Tick (✓)

    alt Bob is Online & Connected
        Server->>ClientB: emit 'receive_message' (Message Payload)
        ClientB->>Server: emit 'message_delivered' (messageId, senderId)
        Server->>DB: Update message status to 'delivered'
        Server->>ClientA: emit 'message_status_update' (status: 'delivered')
        ClientA->>Alice: Display Double Gray Ticks (✓✓)
        
        alt Bob Opens Alice's Chat Window
            Bob->>ClientB: Focuses on Chat
            ClientB->>Server: emit 'message_read' (conversationId, messageIds)
            Server->>DB: Update message status to 'read'
            Server->>ClientA: emit 'message_read_receipt' (conversationId)
            ClientA->>Alice: Display Double Blue Ticks (✓✓)
        end
    else Bob is Offline
        Server-->>DB: Message persists with status: 'sent'
        Note over Server,Bob: Delivered automatically when Bob reconnects
    end
```

---

### 3. Frontend Component & Store Architecture
```mermaid
flowchart LR
    subgraph UIComponents["🎨 Presentation Layer"]
        Layout["Layout & Left Rail"]
        ChatList["Chat List & Search"]
        ChatWindow["Active Chat Window"]
        ContactInfo["Contact Info Drawer"]
        Modals["Modals (AI, PIN, Poll, Call)"]
    end

    subgraph StateStores["⚡ Zustand Reactive State Layer"]
        UserStore["useUserStore (Auth & Profile)"]
        ChatStore["chatStore (Chats, Messages, Typing)"]
        CallStore["useCallStore (WebRTC Audio/Video)"]
        ThemeStore["useThemeStore (Light / Dark)"]
        StatusStore["statusStore (24h Stories)"]
    end

    subgraph NetworkClients["📡 Network Client Layer"]
        AxiosAPI["Axios (HTTP / Interceptors)"]
        SocketIO["Socket.IO (Event Listeners & Emitters)"]
        PeerConn["RTCPeerConnection (Media Stream)"]
    end

    UIComponents <--> StateStores
    StateStores <--> NetworkClients
    NetworkClients <-->|REST API + WebSockets| ServerGateway["🟢 Backend API Gateway"]
```

---

### 4. Backend Service Architecture
```mermaid
flowchart TD
    Request["Incoming Client Request"] --> Router["Express Router Gateway"]

    subgraph Middleware["🛡️ Middleware Pipeline"]
        Cors["CORS Handler"]
        CookieParser["Cookie Parser"]
        JWTVerify["JWT Authentication Guard"]
        MulterUpload["Multer File & Media Upload"]
    end

    subgraph Controllers["🎮 Business Controllers"]
        AuthController["authController.js"]
        ChatController["chatController.js"]
        StatusController["statusController.js"]
    end

    subgraph Models["🗄️ MongoDB Mongoose Models"]
        UserModel["User.js"]
        ConvModel["ConverSation.js"]
        MsgModel["message.js"]
        StatusModel["status.js"]
    end

    subgraph ExternalIntegrations["🔌 External Integrations"]
        CloudinaryCDN["Cloudinary Media Storage"]
        GeminiAI["Google Gemini (Chat & Vision)"]
        GroqWhisper["Groq Whisper (Voice Transcription)"]
        TwilioSms["Twilio (SMS / OTP)"]
        CronService["Node-Cron (Scheduled Dispatch)"]
    end

    Router --> Cors --> CookieParser --> JWTVerify --> MulterUpload
    MulterUpload --> Controllers

    AuthController <--> UserModel
    AuthController <--> TwilioSms
    ChatController <--> ConvModel
    ChatController <--> MsgModel
    ChatController <--> CloudinaryCDN
    ChatController <--> GeminiAI
    ChatController <--> GroqWhisper
    StatusController <--> StatusModel
    CronService --> MsgModel
```

---

### 5. WebRTC Peer-to-Peer Calling Flow
```mermaid
sequenceDiagram
    autonumber
    participant Caller as 📞 Caller (User A)
    participant Signaling as ⚡ Socket.IO Signaling Server
    participant Callee as 📲 Callee (User B)

    Caller->>Signaling: emit 'call_user' (userToCall, from, signalData, callType)
    Signaling->>Callee: emit 'incoming_call' (from, signalData, callType)
    Callee->>Callee: Ringtone + Call Notification Modal
    
    alt Callee Accepts Call
        Callee->>Signaling: emit 'accept_call' (to, signal)
        Signaling->>Caller: emit 'call_accepted' (signal)
        Caller->>Callee: Exchange ICE Candidates via Signaling
        Note over Caller,Callee: 🔒 Direct Encrypted Peer-to-Peer Audio/Video Stream Established
    else Callee Declines Call
        Callee->>Signaling: emit 'end_call' (to)
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
    participant GeminiAI as 🤖 Google Gemini / LLaMA

    alt Voice Note Auto-Transcription
        User->>ChatBar: Record Voice Note (.wav / .webm)
        ChatBar->>Server: Upload Voice Clip
        Server->>GroqWhisper: Audio Stream
        GroqWhisper-->>Server: Accurate Transcribed Text
        Server-->>ChatBar: Return message with audioUrl + transcript
        ChatBar->>User: Display '📝 Read Transcript' Option
    else Magic Rewrite
        User->>ChatBar: Types draft: "plz send file asap"
        User->>ChatBar: Clicks Magic Wand (Tone: Professional)
        ChatBar->>Server: POST /api/chat/ai/rewrite (prompt, tone: 'professional')
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
