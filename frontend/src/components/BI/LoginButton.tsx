"use client";

// import { signIn } from "next-auth/react";
interface LoginButtonProps {
  text: string;
}

export default function LoginButton({ text }: LoginButtonProps) {
  const handleClick = () => {
    // Auth functionality commented out for development
    // signIn("credentials", {
    //   redirect: false,
    // });
    console.log("Login functionality disabled in development");
  };

  return (
    <button
      className="h-[40px] w-[100px] rounded bg-black"
      onClick={handleClick}
    >
      <p className="text-xs text-white lg:text-base">{text}</p>
    </button>
  );
}
