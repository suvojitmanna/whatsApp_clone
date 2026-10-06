import React, { useEffect, useState } from "react";
import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countries";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import useUserStore from "../../store/useUserStore";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../store/themeStore.js";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import {
  FaArrowLeft,
  FaChevronDown,
  FaPlus,
  FaSpinner,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa6";
import ReactCountryFlag from "react-country-flag";
import { toast } from "react-toastify";
import {
  sendOtp,
  updateUserProfile,
  verifyOtp,
} from "../../services/url.services.js";
import { checkUserAuth } from "../../services/user.services.js";

const loginValidationsSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d+$/, "phone number be digit")
      .transform((value, originalValue) => {
        return originalValue.trim() === "" ? null : value;
      }),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("please enter valid email")
      .transform((value, originalValue) => {
        return originalValue.trim() === "" ? null : value;
      }),
  })
  .test(
    "at-least-one",
    "Either email or phone number is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    },
  );

const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "otp must be excatly 6 digits")
    .required("otp is required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "you must agree to the terms"),
});

const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

const Login = () => {
  const { step, setStep, userPhoneData, setUserPhoneData, resetLoginStates } =
    useLoginStore();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState("");
  const [showDropDown, setShowDropDown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({ resolver: yupResolver(loginValidationsSchema) });

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({ resolver: yupResolver(otpValidationSchema) });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: ProfileErrors },
    watch,
  } = useForm({ resolver: yupResolver(profileValidationSchema) });

  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm),
  );

  const onLoginSubmit = async (data) => {
    try {
      setLoading(true);

      const { email, phoneNumber } = data;

      console.log("FORM DATA:", data);

      if (email) {
        const response = await sendOtp(null, null, email);

        console.log("API RESPONSE:", response.data);

        if (response.data.success) {
          toast.info("OTP sent to your email");

          setUserPhoneData({ email });
          setStep(2);
        }
      } else if (phoneNumber) {
        const response = await sendOtp(phoneNumber, selectedCountry.dialCode);

        console.log("API RESPONSE:", response.data);

        if (response.data.success) {
          toast.info("OTP sent to your phone number");

          setUserPhoneData({
            phoneNumber,
            phoneSuffix: selectedCountry.dialCode,
          });

          setStep(2);
        }
      } else {
        toast.error("Please enter email or phone number");
      }
    } catch (error) {
      console.log("ERROR:", error);
      setError(error.message || "Failed to send OTP");
      toast.error("OTP send failed");
    } finally {
      setLoading(false);
    }
  };

  const OnOtpSubmit = async (data) => {
    try {
      setLoading(true);

      if (!userPhoneData) {
        throw new Error("Phone or email data is missing");
      }

      const otpString = data.otp;

      if (!otpString || otpString.length !== 6) {
        toast.error("Enter valid 6-digit OTP");
        return;
      }

      let response;

      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, otpString, userPhoneData.email);
      } else {
        response = await verifyOtp(
          userPhoneData.phoneNumber,
          userPhoneData.phoneSuffix,
          otpString,
          null,
        );
      }

      if (response.data.success) {
        toast.success("Otp Verified Successfully");
        const token = response.data?.token;
        localStorage.setItem("auth_token", token);
        const user = response.data?.user;

        console.log("USER AFTER OTP:", user);

        // Save user
        setUser(user);

        // ALWAYS GO TO STEP 3
        setStep(3);
      } else {
        toast.error(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);

      console.log("STEP 1: Profile submit started");

      const formData = new FormData();

      formData.append("username", data.username);
      formData.append("agreed", data.agreed);

      if (profilePictureFile) {
        formData.append("media", profilePictureFile);
      } else {
        formData.append("profilePicture", selectedAvatar);
      }

      console.log("STEP 2: Sending profile update API...");

      await updateUserProfile(formData);

      console.log("STEP 3: Profile updated in DB");

      const result = await checkUserAuth();
      console.log("STEP 4: checkUserAuth result:", result);

      // FIXED
      setUser(result.data.user);

      console.log("STEP 5: User set in Zustand:", result.data.user);

      toast.success("Welcome back to WhatsApp");

      console.log("STEP 6: Navigating to /");

      navigate("/");

      console.log("STEP 7: After navigation (before reset)");

      console.log("STEP 8: After resetLoginStates");
    } catch (error) {
      console.log("ERROR:", error);
      setError(error.message || "Failed to update profile picture");
    } finally {
      setLoading(false);
      console.log("STEP 9: Loading finished");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];

    // Replace value (important for overwrite)
    newOtp[index] = value;
    setOtp(newOtp);

    setOtpValue("otp", newOtp.join(""));

    // Move forward
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];

      if (otp[index]) {
        // clear current
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // go back
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();

        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const ProgressBar = () => {
    return (
      <div
        className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}
      >
        <div
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>
    );
  };

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError(null);
  };

  useEffect(() => {
    const isComplete = otp.every((digit) => digit !== "");

    if (isComplete && !loading) {
      handleOtpSubmit(OnOtpSubmit)(); // trigger react-hook-form submit
    }
  }, [otp]);

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-green-400 to-blue-500"
      } flex items-center justify-center overflow-hidden`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex
          items-center justify-center "
        >
          <FaWhatsapp className="h-16 w-16 text-white" />
        </motion.div>
        <h1
          className={`text-3xl font-bold text-center mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          WhatsApp Login
        </h1>
        <ProgressBar />

        {error && <p className="text-red-500 text-center mb-4"></p>}
        {step === 1 && (
          <form
            className="space-y-4"
            onSubmit={handleLoginSubmit(onLoginSubmit)}
          >
            <p
              className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
            >
              Enter your phone number to receive OTP
            </p>
            <div className="relative">
              <div className="flex gap-6">
                <div className="relative w-1/3">
                  <button
                    type="button"
                    onClick={() => setShowDropDown(!showDropDown)}
                    className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center ${
                      theme === "dark"
                        ? "text-white bg-gray-700 border-gray-600"
                        : "text-gray-900 bg-gray-100 border-gray-300"
                    } border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 cursor-pointer`}
                  >
                    <span className="flex items-center gap-2">
                      <ReactCountryFlag
                        countryCode={selectedCountry.alpha2}
                        svg
                        style={{
                          width: "20px",
                          height: "20px",
                        }}
                      />
                      {selectedCountry.dialCode}
                    </span>

                    <FaChevronDown className="ml-2 " />
                  </button>
                  {showDropDown && (
                    <div
                      className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-auto ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <div
                        className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2`}
                      >
                        <input
                          type="text"
                          placeholder="Country..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                        />
                      </div>
                      {filterCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowDropDown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          {/* Top Row → Flag + Code */}
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              ({country.dialCode})
                            </span>
                          </div>

                          {/* Bottom Row → Country Name */}
                          <div className="text-sm font-medium text-gray-900 dark:text-white ml-7 leading-tight">
                            {country.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  {...loginRegister("phoneNumber")}
                  value={phoneNumber}
                  placeholder="Phone Number"
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, "");
                    setPhoneNumber(onlyNumbers);
                  }}
                  className={`w-2/3 px-4 py-2 border text-black ${theme === "dark" ? "bg-gray-700 text-white" : "bg-white border-gray-300 "} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                />
              </div>
              {loginErrors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {loginErrors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600" />

              <span className="mx-3 text-gray-500 dark:text-gray-400 text-sm font-medium">
                or
              </span>

              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600" />
            </div>

            <div
              className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
            >
              <FaUser
                className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400 " : " text-gray-500 "} `}
              />
              <input
                type="email"
                {...loginRegister("email")}
                value={email}
                placeholder="Email (optional)"
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? " text-white" : "text-black "} ${loginErrors.email ? "border-red-500" : ""}`}
              />
              {loginErrors.email && (
                <p className="text-red-500 text-sm">
                  {loginErrors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || (!phoneNumber && !email)}
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
            <p
              onClick={() => navigate("/help")}
              className={`text-sm text-right cursor-pointer transition underline ${theme === "dark" ? "text-gray-400 hover:text-green-400" : "text-gray-600 hover:text-green-600"}`}
            >
              Need Help?
            </p>
          </form>
        )}
        {step === 2 && (
          <form
            onSubmit={handleOtpSubmit(OnOtpSubmit)}
            className="space-y-4"
            typeof="number"
          >
            <div className="space-y-2 text-center mb-8">
              <h2
                className={`text-2xl font-semibold tracking-tight ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Verify your identity
              </h2>

              <p
                className={`text-sm leading-relaxed max-w-xs mx-auto ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Please enter the 6-digit OTP sent to{" "}
                <span
                  className={`font-medium ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                >
                  {email ||
                    `${userPhoneData?.phoneSuffix} ${userPhoneData?.phoneNumber}`}
                </span>
              </p>
            </div>

            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) => {
                    if (/^[0-9]?$/.test(e.target.value)) {
                      handleOtpChange(index, e.target.value);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => {
                    const pasteData = e.clipboardData
                      .getData("text")
                      .slice(0, 6);
                    if (!/^\d+$/.test(pasteData)) return;

                    const newOtp = pasteData.split("");
                    while (newOtp.length < 6) newOtp.push("");

                    setOtp(newOtp);
                    setOtpValue("otp", newOtp.join(""));

                    document
                      .getElementById(
                        `otp-${Math.min(pasteData.length - 1, 5)}`,
                      )
                      ?.focus();
                  }}
                  className={`w-12 h-12 text-center text-xl font-bold border transition-all rounded-xl outline-none${theme === "dark" ? "bg-[#202c33] border-gray-700 text-white focus:ring-2 focus:ring-green-500" : "bg-white border-gray-300 text-black focus:ring-2 focus:ring-green-600 shadow-sm"} ${otpErrors.otp ? "border-red-500" : ""}`}
                />
              ))}
            </div>

            {otpErrors.otp && (
              <p className="text-red-500 text-center mb-4">
                {otpErrors.otp.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Otp"
              )}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className={`w-full mt-2 cursor-pointer ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-700"
              } py-2 rounded-md hover:font-bold transition flex items-center justify-center`}
            >
              <FaArrowLeft className="mr-2" />
              Wrong Number? Go Back
            </button>
          </form>
        )}
        {step === 3 && (
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-24 h-24 mb-2">
                <img
                  src={profilePicture || selectedAvatar}
                  alt="profile"
                  className="w-full h-full rounded-full object-cover border"
                />
                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-700 transition duration-300"
                >
                  <FaPlus className="w-4 h-4" />
                </label>
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <p
                className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"} mb-2`}
              >
                Choose an Avatar
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {avatars.map((avatar, index) => (
                  <img
                    src={avatar}
                    key={index}
                    alt={`avatar ${index + 1}`}
                    className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${
                      selectedAvatar === avatar ? "ring-2 ring-green-500" : ""
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  />
                ))}
              </div>
            </div>

            {/* Username Field */}
            <div className="relative">
              <FaUser
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}
              />
              <input
                type="text"
                {...profileRegister("username")}
                placeholder="Username"
                className={`w-full pl-10 pr-3 py-2 border text-black ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg`}
              />
              {ProfileErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {ProfileErrors.username.message}
                </p>
              )}
            </div>

            {/* Terms & Conditions Field */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  {...profileRegister("agreed")}
                  className={`rounded cursor-pointer ${theme === "dark" ? "text-green-500 bg-gray-700" : "text-green-500 focus:ring-green-500"}`}
                />
                <label
                  htmlFor="terms"
                  className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                >
                  I agree to the{" "}
                  <a href="#" className="text-red-500 hover:underline">
                    Terms and Condition
                  </a>
                </label>
              </div>
              {ProfileErrors.agreed && (
                <p className="text-red-300 text-sm">
                  {ProfileErrors.agreed.message}
                </p>
              )}
            </div>

            {/* Submit Button - Moved outside of the checkbox div */}
            <button
              type="submit"
              disabled={!watch("agreed") || loading}
              className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg ${!watch("agreed") || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                "Create Profile"
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
export default Login;
