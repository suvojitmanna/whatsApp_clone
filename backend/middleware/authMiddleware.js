const jwt = require("jsonwebtoken");
const response = require("../utils/responseHandeler");

const authMiddleware = (req, res, next) => {
  // 🔥 get token from BOTH cookie + header
  const token =
    req.cookies?.auth_token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  if (!token) {
    return response(res, 401, "Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(req.user);
    next();
  } catch (error) {
    return response(res, 401, "Invalid or expired token");
  }
};

module.exports = authMiddleware;
