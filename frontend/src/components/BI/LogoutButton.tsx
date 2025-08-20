"use client";

// import { signOut } from "next-auth/react";
import { FaSignOutAlt } from "react-icons/fa";
interface LoginButtonProps {
  text: string;
}

export default function LogoutButton({ text }: LoginButtonProps) {
  const handleClick = () => {
    // Auth functionality commented out for development
    // signOut();
    console.log("Logout functionality disabled in development");
  };

  return (
    <button
      className="flex h-[40px] w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      onClick={handleClick}
    >
      <FaSignOutAlt className="h-4 w-4" />

      <p className="">{text}</p>
    </button>
  );
}
