import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/user-login/Login.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PublicRoute, ProtectedRoute } from "./protected.jsx";
import Home from "./components/homePage.jsx";
import UserDetails from "./components/userDetails.jsx";
import Status from "./pages/statusSection/status.jsx";
import Setting from "./pages/SettingSection/setting.jsx";
import useUserStore from "./store/useUserStore.js";
import { useEffect } from "react";
import { disconnectSocket, initializeSocket } from "./services/chatService.js";

// ❌ removed Socket import

const App = () => {
  const { user } = useUserStore();
  const { setUser, initSocketListener, cleanup } = useUserStore(); // ✅ fixed name

  useEffect(() => {
    if (user?._id) {
      initializeSocket();

      // ❌ removed wrong condition
      setUser(user); // ✅ fixed function
      initSocketListener();
    }

    return () => {
      cleanup();
      disconnectSocket();
    };
  }, [user, setUser, initSocketListener, cleanup]); // (kept your structure)

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTE */}
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          {/* PROTECTED ROUTES */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;