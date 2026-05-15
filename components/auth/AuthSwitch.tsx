"use client";

interface AuthSwitchProps {
  isSignIn: boolean;
  onSwitch: (type: "sign-in" | "sign-up") => void;
}

export default function AuthSwitch({ isSignIn, onSwitch }: AuthSwitchProps) {
  return (
    <div className="flex justify-center">
      <div className="relative inline-flex bg-white/80 backdrop-blur-sm rounded-full p-1 border border-white/30 shadow-md">
        <div
          className="absolute top-1 bottom-1 rounded-full bg-[#5d4e37] transition-transform duration-300 ease-in-out"
          style={{
            left: "4px",
            width: "calc(50% - 8px)",
            transform: isSignIn ? "translateX(0)" : "translateX(100%)",
          }}
        />
        <button
          onClick={() => onSwitch("sign-in")}
          className={`relative z-10 px-6 py-2 rounded-full font-cinzel text-sm md:text-base transition-colors duration-300 ${
            isSignIn ? "text-white" : "text-[#5d4e37] hover:text-[#8b6f47]"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => onSwitch("sign-up")}
          className={`relative z-10 px-6 py-2 rounded-full font-cinzel text-sm md:text-base transition-colors duration-300 ${
            !isSignIn ? "text-white" : "text-[#5d4e37] hover:text-[#8b6f47]"
          }`}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
