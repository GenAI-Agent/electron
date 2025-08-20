"use client";

import { ReactNode } from "react";
import Head from "next/head";
// import { Loading } from "@/components/ui/loading";
// import { auth } from "@/auth";
import BusinessIntelligentSidebar from "@/components/BI/Sidebar";
// import { UserType } from "@/types/auth";
// import AdminLoginPage from "@/components/BI/admin-login/page";
import Link from "next/link";
import { FaTag, FaEnvelope, FaFile, FaUser, FaChartLine } from "react-icons/fa";

export default function BusinessIntelligentPage() {
  // Auth functionality commented out
  // const session = await auth();
  // if (!session || !session.user) {
  //   return <AdminLoginPage />;
  // }
  // const user = session.user as UserType;

  // Mock user for development
  const user = {
    cust_id: "mock_user",
    mail_main: "mock@example.com"
  };

  // Mock user role for development
  // const userRole = adminIds.find(
  //   (admin) =>
  //     admin.cust_id === user.cust_id || admin.cust_id === user.mail_main,
  // )?.role;
  const userRole = "admin"; // Mock role

  // 根据用户角色定义可访问的功能
  const availableFeatures = [
    {
      name: "Gmail 分析",
      path: "/business-intelligent/gmail",
      icon: FaEnvelope,
      roles: ["admin", "staff"],
    },
    {
      name: "價格分析",
      path: "/business-intelligent/pricing",
      icon: FaTag,
      roles: ["admin"],
    },
    {
      name: "文件分析",
      path: "/business-intelligent/docAgent",
      icon: FaFile,
      roles: ["admin", "staff"],
    },
    {
      name: "客服分析",
      path: "/business-intelligent/service",
      icon: FaUser,
      roles: ["admin", "serviceStaff"],
    },
    {
      name: "銷售分析",
      path: "/business-intelligent/sale",
      icon: FaChartLine,
      roles: ["admin"],
    },
  ];

  // 过滤出用户有权限访问的功能
  const accessibleFeatures = availableFeatures.filter(
    (feature) => userRole && feature.roles.includes(userRole),
  );

  return (
    <>
      <Head>
        <title>Business Intelligent | TaazeAI</title>
        <meta 
          name="description" 
          content="運用AI技術，為您推薦最適合的書籍。透過深度學習分析您的閱讀喜好，精準推薦合適的好書。" 
        />
        <meta 
          name="keywords" 
          content="AI推薦, 智慧選書, 圖書推薦, 個人化推薦, 讀書推薦, 找書, TaazeAI" 
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="flex h-screen w-full">
        <BusinessIntelligentSidebar user={user as any} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className="flex h-full w-full flex-col overflow-y-auto">
            <h1 className="mb-4 text-2xl font-bold">BI 儀表板</h1>

            <div className="flex flex-1 flex-col items-center justify-center rounded-md border bg-gray-50 p-8">
              <div className="mb-4 text-6xl">📊</div>
              <h2 className="mb-4 text-2xl font-semibold">商業智能儀表板</h2>
              <p className="mb-6 max-w-md text-center text-gray-600">
                歡迎使用商業智能分析工具，選擇下方選項開始使用不同的分析功能。
              </p>
              <div className="flex flex-wrap gap-4">
                {accessibleFeatures.map((feature) => (
                  <Link
                    key={feature.path}
                    href={feature.path}
                    className="flex flex-col items-center rounded-md border border-gray-300 bg-white p-4 shadow-sm hover:bg-gray-50"
                  >
                    <feature.icon className="mb-2 h-6 w-6 text-blue-500" />
                    <span>{feature.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}