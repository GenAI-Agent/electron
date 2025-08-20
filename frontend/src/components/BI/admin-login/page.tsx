"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/Input/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
// import { signIn } from "next-auth/react";
import Image from "next/image";
import { Loading } from "@/components/ui/loading";
// import { FaFacebookSquare } from "react-icons/fa";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Auth functionality commented out for development
    /*
    try {
      const res = await signIn("credentials", {
        userId: formData.get("userId"),
        password: formData.get("password"),
        redirect: false,
      });

      if (res?.error) {
        toast.error("登入失敗，請檢查帳號密碼");
        setIsLoading(false);
        return;
      }
      toast.success("登入成功");

      // 等待 session 更新
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 獲取回調 URL
      const searchParams = new URLSearchParams(window.location.search);
      const callbackUrl = searchParams.get("callbackUrl");
      const redirectUrl = callbackUrl
        ? decodeURIComponent(callbackUrl)
        : "/business-intelligent";

      // 使用 localStorage 暫存重定向 URL
      localStorage.setItem("loginRedirectUrl", redirectUrl);

      // 重新加載頁面
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("登入失敗，請檢查帳號密碼");
      setIsLoading(false);
      return;
    }
    */
    
    // Mock login for development
    console.log("Login functionality disabled in development");
    toast.success("模擬登入成功 (開發模式)");
    setIsLoading(false);
    router.push("/business-intelligent");
  };
  useEffect(() => {
    const redirectUrl = localStorage.getItem("loginRedirectUrl");
    if (redirectUrl) {
      localStorage.removeItem("loginRedirectUrl");
      router.push(redirectUrl);
    }
  }, [router]);
  const handleGoogleLogin = async () => {
    // Auth functionality commented out for development
    /*
    const searchParams = new URLSearchParams(window.location.search);
    const callbackUrl = searchParams.get("callbackUrl");
    await signIn("google", {
      callbackUrl: callbackUrl ? callbackUrl : "/business-intelligent",
    });
    */
    console.log("Google login functionality disabled in development");
    toast.success("模擬 Google 登入成功 (開發模式)");
    router.push("/business-intelligent");
  };
  const handleLineLogin = async () => {
    // Auth functionality commented out for development
    /*
    const searchParams = new URLSearchParams(window.location.search);
    const callbackUrl = searchParams.get("callbackUrl");
    await signIn("line", {
      callbackUrl: callbackUrl ? callbackUrl : "/business-intelligent",
    });
    */
    console.log("Line login functionality disabled in development");
    toast.success("模擬 Line 登入成功 (開發模式)");
    router.push("/business-intelligent");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold">管理者登入</h1>

        <div className="mb-6 flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FcGoogle className="h-5 w-5" />
            使用 Google 帳號繼續
          </button>
          {/* <button
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaFacebookSquare className="h-5 w-5 text-[#1877F2]" />
            使用 Facebook 帳號繼續
          </button> */}
          <button
            onClick={handleLineLogin}
            className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Image
              src="/icons/LINE_Brand_icon.png"
              alt="LINE"
              width={20}
              height={20}
            />
            使用 Line 帳號繼續
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">或</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            name="userId"
            placeholder="使用者帳號"
            className="h-12 w-full rounded bg-neutral-100 px-4"
            required
          />

          <Input
            type="password"
            name="password"
            placeholder="密碼"
            className="h-12 w-full rounded bg-neutral-100 px-4"
            required
          />

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="h-12 w-full rounded bg-primary text-white hover:bg-primary/80"
          >
            {isLoading ? (
              <Loading size={24} src="/loading-brandW.gif" />
            ) : (
              "管理者登入"
            )}
          </Button>

          <div className="pt-12 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-black/60">沒有帳號？</span>
              <Link
                href="/register"
                className="font-bold hover:text-black/80 hover:underline"
              >
                前往註冊
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
