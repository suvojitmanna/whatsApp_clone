import { Navigate, Outlet, useLocation } from "react-router-dom";
import useUserStore from "./store/useUserStore";

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated } = useUserStore();

  console.log("ProtectedRoute:", isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { isAuthenticated, user } = useUserStore(); // ✅ added user

  // ✅ FIX: allow login page if profile not completed
  if (isAuthenticated && user?.agreed === true) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};