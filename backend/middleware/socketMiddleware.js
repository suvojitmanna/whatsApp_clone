const jwt = require("jsonwebtoken");

const socketMiddleware = (socket, next) => {
  try {
    let token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token && socket.handshake.headers?.cookie) {
      const cookies = Object.fromEntries(
        socket.handshake.headers.cookie.split("; ").map((c) => c.split("=")),
      );
      token = cookies.auth_token;
    }
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error("Invalid or expired token"));
  }
};

module.exports = socketMiddleware;
