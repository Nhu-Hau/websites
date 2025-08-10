import { useState, useEffect } from "react";

interface UserSidebarProps {
  isLoginOpen: boolean;
  isLoginClose: () => void;
  authMode: "login" | "register";
}

const UserSidebar: React.FC<UserSidebarProps> = ({
  isLoginOpen,
  isLoginClose,
  authMode,
}) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">(
    authMode
  );

  useEffect(() => {
    if (isLoginOpen) {
      setMode(authMode);
    }
  }, [authMode, isLoginOpen]);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isLoginOpen) return null;

  const handleModeChange = (
    newMode: "login" | "register" | "forgot-password"
  ) => {
    setMode(newMode);
  };

  const handleClose = () => {
    setMode("login");
    setShowPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
    isLoginClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-x"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(85%,28rem)] bg-white shadow-2xl p-6 dark:bg-gray-800  rounded-xl">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {mode === "login" && "ĐĂNG NHẬP"}
          {mode === "register" && "ĐĂNG KÝ"}
          {mode === "forgot-password" && "QUÊN MẬT KHẨU"}
        </h1>

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form className="space-y-5" noValidate>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                ĐỊA CHỈ EMAIL
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="w-full border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                placeholder="Email"
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                MẬT KHẨU
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  className="w-full border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                  placeholder="••••••••"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    // Eye icon
                    <svg
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    // Eye off icon
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      stroke="currentColor"
                    >
                      <path
                        d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-500"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-900 dark:text-white"
                >
                  Ghi nhớ cho lần đăng nhập sau
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => handleModeChange("forgot-password")}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-black px-5 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-4  focus:ring-gray-600 dark:bg-white dark:text-black dark:focus:ring-gray-600 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
            >
              ĐĂNG NHẬP
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>
            {/* Social login buttons */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg
                    viewBox="-5 0 20 20"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    aria-label="Facebook login icon"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <title>facebook [#176]</title>
                      <desc>Created with Sketch.</desc>
                      <defs></defs>
                      <g
                        id="Page-1"
                        stroke="none"
                        strokeWidth="1"
                        fill="none"
                        fillRule="evenodd"
                      >
                        <g
                          id="Dribbble-Light-Preview"
                          transform="translate(-385.000000, -7399.000000)"
                          fill="currentColor"
                        >
                          <g
                            id="icons"
                            transform="translate(56.000000, 160.000000)"
                          >
                            <path
                              d="M335.821282,7259 L335.821282,7250 L338.553693,7250 L339,7246 L335.821282,7246 L335.821282,7244.052 C335.821282,7243.022 335.847593,7242 337.286884,7242 L338.744689,7242 L338.744689,7239.14 C338.744689,7239.097 337.492497,7239 336.225687,7239 C333.580004,7239 331.923407,7240.657 331.923407,7243.7 L331.923407,7246 L329,7246 L329,7250 L331.923407,7250 L331.923407,7259 L335.821282,7259 Z"
                              id="facebook-[#176]"
                            ></path>
                          </g>
                        </g>
                      </g>
                    </g>
                  </svg>
                </a>
              </div>
              <div>
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 512 512"
                    enableBackground="new 0 0 512 512"
                    xmlSpace="preserve"
                    className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    aria-label="Apple login icon"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <g id="3e91140ac1bfb9903b91c1b0ca0876de">
                        <path d="M248.639,123.48c-5.447-29.712,8.601-60.286,25.518-80.894C292.803,19.854,324.799,2.415,352.141,0.5 c4.624,31.149-8.088,61.499-24.822,82.965C309.37,106.526,278.506,124.412,248.639,123.48z M409.029,231.128 c8.463-23.604,25.222-44.841,51.226-59.172c-26.282-32.794-63.169-51.828-97.992-51.828c-46.064,0-65.534,21.944-97.53,21.944 c-32.96,0-57.97-21.944-97.866-21.944c-39.124,0-80.776,23.845-107.187,64.578c-9.714,15.046-16.297,33.751-19.882,54.585 c-9.951,58.444,4.916,134.558,49.279,202.143c21.57,32.802,50.318,69.738,87.878,70.063c33.46,0.324,42.958-21.392,88.244-21.624 c45.361-0.25,53.957,21.849,87.375,21.524c37.572-0.316,67.9-41.194,89.475-73.988c15.354-23.529,21.167-35.414,33.11-62.021 C414.428,352.482,389.455,285.571,409.029,231.128z"></path>
                      </g>
                    </g>
                  </svg>
                </a>
              </div>
              <div>
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    aria-label="Google login icon"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        fill="currentColor"
                        d="M10.84 4.82a3.837 3.837 0 00-2.7-1.05c-1.837 0-3.397 1.233-3.953 2.891a4.17 4.17 0 000 2.68h.003c.558 1.657 2.115 2.889 3.952 2.889.948 0 1.761-.241 2.392-.667v-.002a3.239 3.239 0 001.407-2.127H8.14V6.74h6.64c.082.468.121.946.121 1.422 0 2.129-.765 3.929-2.096 5.148l.001.001C11.64 14.38 10.038 15 8.14 15a7.044 7.044 0 01-6.29-3.855 6.97 6.97 0 010-6.287A7.042 7.042 0 018.139 1a6.786 6.786 0 014.71 1.821L10.84 4.82z"
                      ></path>
                    </g>
                  </svg>
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bạn chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                Đăng ký tại đây
              </button>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === "register" && (
          <form className="space-y-5" noValidate>
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                HỌ VÀ TÊN
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="w-full border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                placeholder="Họ và tên"
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                ĐỊA CHỈ EMAIL
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="w-full border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                placeholder="Email"
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                MẬT KHẨU
              </label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  className="w-full border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                  placeholder="••••••••"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  aria-label={
                    showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                  }
                >
                  {showRegisterPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      stroke="currentColor"
                    >
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      stroke="currentColor"
                    >
                      <path
                        d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                XÁC NHẬN MẬT KHẨU
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm-password"
                  id="confirm-password"
                  className="w-full border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                  placeholder="••••••••"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      stroke="currentColor"
                    >
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      stroke="currentColor"
                    >
                      <path
                        d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Hoặc đăng ký với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg
                    viewBox="-5 0 20 20"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    aria-label="Facebook login icon"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <title>facebook [#176]</title>
                      <desc>Created with Sketch.</desc>
                      <defs></defs>
                      <g
                        id="Page-1"
                        stroke="none"
                        strokeWidth="1"
                        fill="none"
                        fillRule="evenodd"
                      >
                        <g
                          id="Dribbble-Light-Preview"
                          transform="translate(-385.000000, -7399.000000)"
                          fill="currentColor"
                        >
                          <g
                            id="icons"
                            transform="translate(56.000000, 160.000000)"
                          >
                            <path
                              d="M335.821282,7259 L335.821282,7250 L338.553693,7250 L339,7246 L335.821282,7246 L335.821282,7244.052 C335.821282,7243.022 335.847593,7242 337.286884,7242 L338.744689,7242 L338.744689,7239.14 C338.744689,7239.097 337.492497,7239 336.225687,7239 C333.580004,7239 331.923407,7240.657 331.923407,7243.7 L331.923407,7246 L329,7246 L329,7250 L331.923407,7250 L331.923407,7259 L335.821282,7259 Z"
                              id="facebook-[#176]"
                            ></path>
                          </g>
                        </g>
                      </g>
                    </g>
                  </svg>
                </a>
              </div>
              <div>
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 512 512"
                    enableBackground="new 0 0 512 512"
                    xmlSpace="preserve"
                    className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    aria-label="Apple login icon"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <g id="3e91140ac1bfb9903b91c1b0ca0876de">
                        <path d="M248.639,123.48c-5.447-29.712,8.601-60.286,25.518-80.894C292.803,19.854,324.799,2.415,352.141,0.5 c4.624,31.149-8.088,61.499-24.822,82.965C309.37,106.526,278.506,124.412,248.639,123.48z M409.029,231.128 c8.463-23.604,25.222-44.841,51.226-59.172c-26.282-32.794-63.169-51.828-97.992-51.828c-46.064,0-65.534,21.944-97.53,21.944 c-32.96,0-57.97-21.944-97.866-21.944c-39.124,0-80.776,23.845-107.187,64.578c-9.714,15.046-16.297,33.751-19.882,54.585 c-9.951,58.444,4.916,134.558,49.279,202.143c21.57,32.802,50.318,69.738,87.878,70.063c33.46,0.324,42.958-21.392,88.244-21.624 c45.361-0.25,53.957,21.849,87.375,21.524c37.572-0.316,67.9-41.194,89.475-73.988c15.354-23.529,21.167-35.414,33.11-62.021 C414.428,352.482,389.455,285.571,409.029,231.128z"></path>
                      </g>
                    </g>
                  </svg>
                </a>
              </div>
              <div>
                <a
                  href="#"
                  className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    aria-label="Google login icon"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        fill="currentColor"
                        d="M10.84 4.82a3.837 3.837 0 00-2.7-1.05c-1.837 0-3.397 1.233-3.953 2.891a4.17 4.17 0 000 2.68h.003c.558 1.657 2.115 2.889 3.952 2.889.948 0 1.761-.241 2.392-.667v-.002a3.239 3.239 0 001.407-2.127H8.14V6.74h6.64c.082.468.121.946.121 1.422 0 2.129-.765 3.929-2.096 5.148l.001.001C11.64 14.38 10.038 15 8.14 15a7.044 7.044 0 01-6.29-3.855 6.97 6.97 0 010-6.287A7.042 7.042 0 018.139 1a6.786 6.786 0 014.71 1.821L10.84 4.82z"
                      ></path>
                    </g>
                  </svg>
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black px-5 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-4  focus:ring-gray-600 dark:bg-white dark:text-black dark:focus:ring-gray-600 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
            >
              ĐĂNG KÝ
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bạn đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                Đăng nhập tại đây
              </button>
            </p>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot-password" && (
          <form className="space-y-5" noValidate>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                ĐỊA CHỈ EMAIL
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="w-full border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                placeholder="Email"
                required
                aria-required="true"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black px-5 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-4  focus:ring-gray-600 dark:bg-white dark:text-black dark:focus:ring-gray-600 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
            >
              GỬI YÊU CẦU
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quay lại{" "}
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                Đăng nhập
              </button>
            </p>
          </form>
        )}
      </div>
    </>
  );
};

export default UserSidebar;
