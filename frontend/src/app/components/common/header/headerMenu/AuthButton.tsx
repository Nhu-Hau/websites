"use client";

interface AuthButtonsProps {
  handleAuth: (mode: "login" | "register") => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ handleAuth }) => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 md:px-3 lg:px-5 lg:py-2 bg-[#35509A] rounded-full text-sm sm:text-base 2xl:text-lg font-medium shadow-sm w-full lg:w-auto justify-center">
      <div className="w-full lg:w-auto flex-2 items-center justify-center text-center">
        <button 
          type="button"
          className="text-white hover:text-gray-200 hover:no-underline focus:outline-none"
          onClick={() => handleAuth("login")}
        >
          Đăng nhập
        </button>
      </div>
      <span className="text-white">|</span>
      <div className="w-full lg:w-auto flex-2 items-center justify-center text-center">
        <button 
          type="button"
          className="text-white hover:text-gray-200  hover:no-underline focus:outline-none"
          onClick={() => handleAuth("register")}
        >
          Đăng ký
        </button>
      </div>
    </div>
  );
};

export default AuthButtons;
