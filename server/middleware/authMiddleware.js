import jwt from "jsonwebtoken";
import response from "../utils/responseHandeler.js";

const authMiddleware = (req, res, next) => {
  const token =
    req.cookies?.auth_token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) {
    return response(res, 401, "Unauthorized");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return response(res, 401, "Invalid or expired token");
  }
};

export default authMiddleware;
export { authMiddleware };
