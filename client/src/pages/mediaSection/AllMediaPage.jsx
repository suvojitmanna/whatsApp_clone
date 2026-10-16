import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomePage from "../../components/homePage";
import MediaModal from "../../components/MediaModal";
import useLayoutStore from "../../store/layoutStore";

const AllMediaPage = () => {
  const navigate = useNavigate();
  const setActiveTab = useLayoutStore((state) => state.setActiveTab);

  useEffect(() => {
    setActiveTab("media");
  }, [setActiveTab]);

  return (
    <>
      <HomePage />
      <MediaModal
        isOpen={true}
        scope="all"
        onClose={() => navigate("/")}
      />
    </>
  );
};

export default AllMediaPage;
