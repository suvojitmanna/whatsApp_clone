import React from "react";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import whatsappImage from "../../../assets/whatsapp_image.png";

export const ChatWindowEmpty = ({ theme }) => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
      <div className="max-w-md">
        <img src={whatsappImage} alt="chat" className="w-full h-auto " />
        <h2
          className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          Select a conversation to start chatting
        </h2>
        <p
          className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}
        >
          Choose a contact from the list on the left to begin messaging
        </p>
        <p
          className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-8 text-sm flex justify-center items-center gap-2 `}
        >
          <FaLock className="h-4 w-4" />
          <span>Your personal messages are end-to-end encrypted.</span>
          <span
            onClick={() => navigate("/help?topic=security")}
            className="text-[#00a884] dark:text-[#25d366] hover:underline font-semibold cursor-pointer ml-1"
          >
            Learn more
          </span>
        </p>
      </div>
    </div>
  );
};

export default ChatWindowEmpty;
