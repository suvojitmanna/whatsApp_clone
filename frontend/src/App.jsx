import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/user-login/Login.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PublicRoute, ProtectedRoute } from "./protected.jsx";
import Home from "./components/homePage.jsx";
import UserDetails from "./components/userDetails.jsx";
import Status from "./pages/statusSection/status.jsx";
import Setting from "./pages/SettingSection/setting.jsx";
import HelpPage from "./components/helpPage.jsx";
import useUserStore from "./store/useUserStore.js";
import { useEffect } from "react";
import { disconnectSocket, initializeSocket } from "./services/chatService.js";
import GetStarted from "./pages/helpPage/get_started.jsx";
import Security from "./pages/helpPage/Security.jsx";
import ChatMedia from "./pages/helpPage/chat-media.jsx";
import Privacy from "./components/privacy.jsx";
import ContactSupport from "./components/contact-support.jsx";

const App = () => {
  const { user } = useUserStore();
  const { setUser, initSocketListener, cleanup } = useUserStore(); // fixed name

  useEffect(() => {
    if (user?._id) {
      initializeSocket();
      setUser(user);
      initSocketListener();
    }

    return () => {
      cleanup();
      disconnectSocket();
    };
  }, [user, setUser, initSocketListener, cleanup]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />

            <Route path="/help">
              <Route index element={<HelpPage />} />
              <Route path="get-started" element={<GetStarted />} />
              <Route path="security" element={<Security />} />
              <Route path="chat-media" element={<ChatMedia />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="contact-support" element={<ContactSupport />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
