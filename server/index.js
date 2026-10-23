import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./config/dbConnect.js";
import bodyParser from "body-parser";

import authRoute from "./routes/authRoute.js";
import chatRoute from "./routes/chatRoute.js";
import statusRoute from "./routes/statusRoute.js";

import { initializeSocket } from "./services/socketService.js";
import http from "http";

dotenv.config();

const app = express();

const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOption));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = initializeSocket(server);

app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);
app.use("/api/status", statusRoute);

connectDb();
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
