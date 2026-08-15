const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./config/dbConnect");
const bodyParser = require("body-parser");

const authRoute = require("./routes/authRoute.js");
const chatRoute = require("./routes/chatRoute.js");
const statusRoute = require("./routes/statusRoute.js");

const { initializeSocket } = require("./services/socketService");
const http = require("http");

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

// PORT
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
