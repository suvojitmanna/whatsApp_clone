import axiosInstance from "./url.services";

export const sentOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const response = await axiosInstance.post("/auth/send-otp", {
      phoneNumber,
      phoneSuffix,
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const verifyOtp = async (phoneNumber, phoneSuffix, otp, email) => {
  try {
    const response = await axiosInstance.post("/auth/verify-otp", {
      phoneNumber,
      phoneSuffix,
      email,
      otp,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const updateUserProfile = async (formData) => {
  try {
    const response = await axiosInstance.put("/auth/update-profile",
      formData
    );

    return response;
  } catch (error) {
    throw error.response
      ? error.response.data
      : error.message;
  }
};

export const checkUserAuth = async () => {
  try {
    const { data } = await axiosInstance.get("/auth/check-auth");

    if (data?.status === "success") {
      return {
        isAuthenticated: true,
        user: data?.data || null,
      };
    }

    if (data?.status === "error") {
      return { isAuthenticated: false };
    }
    return data;
  } catch (error) {
    if (error.response) {
      return { isAuthenticated: false, error: error.response.data };
    } else if (error.request) {
      return { isAuthenticated: false, error: "No response from server" };
    } else {
      return { isAuthenticated: false, error: error.message };
    }
  }
};

export const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/auth/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};
