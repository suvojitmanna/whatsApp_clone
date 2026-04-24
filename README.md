# 💬 WhatsApp Clone — Real-Time Messaging Platform

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
</p>

<p align="center">
  <b>MERN Stack Application (MongoDB • Express • React • Node.js)</b>
</p>

---

## 🧠 Overview

This project is a **production-ready WhatsApp clone** that demonstrates real-world full-stack engineering.
It combines **real-time communication, secure authentication, and modern UI/UX principles**.

Designed to simulate a real messaging platform with scalability and performance in mind.

---

## ✨ Features

### 🔐 Authentication & Security

* JWT-based authentication
* HTTP-only cookies for secure sessions
* Protected routes with middleware
* Persistent login system

### 💬 Messaging System

* Real-time chat experience
* One-to-one conversations
* Instant UI updates
* Optimized message handling

### 🎨 UI/UX

* Clean, modern WhatsApp-inspired design
* Fully responsive (mobile + desktop)
* Dark mode support 🌙
* Smooth transitions & interactions

### ⚙️ Core Functionalities

* 👤 User profile management
* 🔎 Search users
* 📡 API integration with Axios
* ⚡ Fast state updates using Zustand

---

## 🛠️ Tech Stack

| Category   | Technology             |
| ---------- | ---------------------- |
| Frontend   | React.js, Tailwind CSS |
| State      | Zustand                |
| Backend    | Node.js, Express.js    |
| Database   | MongoDB (Mongoose)     |
| Auth       | JWT + Cookies          |
| Deployment | Vercel + Render        |

---

## 🏗️ Architecture

```txt
Client (React + Zustand)
        ↓
API Layer (Axios)
        ↓
Server (Express + JWT Auth)
        ↓
Database (MongoDB)
```

---

## 📂 Folder Structure

```bash
📦 whatsapp-clone
 ┣ 📂 client       # Frontend (React)
 ┣ 📂 server       # Backend (Node.js)
 ┣ 📜 .env         # Environment variables
 ┗ 📜 README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Install dependencies

#### Frontend

```bash
cd client
npm install
npm run dev
```

#### Backend

```bash
cd server
npm install
npm run dev
```

---

## 🔑 Environment Variables

### Backend

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret
```

### Frontend

```env
VITE_API_URL=your_backend_url
```

---

## 📸 Preview

> Add screenshots here for a premium showcase

---

## 🚀 Future Enhancements

* 📞 Voice & Video Calling (WebRTC)
* 📁 Media/File Sharing
* 🟢 Online/Typing Indicators
* 🔔 Push Notifications

---

## 📊 Performance Focus

* Optimized API calls
* Efficient state management
* Minimal re-renders
* Scalable backend structure

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## 📜 License

MIT License

---

## 👨‍💻 Author

**Suvojit Manna**

---
