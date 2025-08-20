"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
// import { UserType } from "@/types/auth";
import { cn } from "@/utils/cn";
import {
  FaChevronLeft,
  FaChevronRight,
  FaHome,
  FaEnvelope,
  FaTag,
  FaUser,
  FaSignOutAlt,
  FaFile,
  FaChartLine,
} from "react-icons/fa";
// import { signOut } from "next-auth/react";
// import { adminIds } from "@/constants/account";
const MENU_ITEMS = [
  {
    name: "首頁",
    path: "/",
    pathname: "/business-intelligent",
    icon: (isSidebarCollapsed: boolean) => (
      <FaHome className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
    ),
    roles: ["admin"],
  },
  {
    name: "Gmail Agent",
    path: "/gmail",
    pathname: "/business-intelligent/gmail",
    icon: (isSidebarCollapsed: boolean) => (
      <FaEnvelope className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
    ),
    roles: ["admin", "staff"],
  },
  {
    name: "Pricing Agent",
    path: "/pricing",
    pathname: "/business-intelligent/pricing",
    icon: (isSidebarCollapsed: boolean) => (
      <FaTag className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
    ),
    roles: ["admin"],
  },
  {
    name: "Doc Agent",
    path: "/docAgent",
    pathname: "/business-intelligent/docAgent",
    icon: (isSidebarCollapsed: boolean) => (
      <FaFile className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
    ),
    roles: ["admin", "staff"],
  },
  {
    name: "Service Agent",
    path: "/service",
    pathname: "/business-intelligent/service",
    icon: (isSidebarCollapsed: boolean) => (
      <FaUser className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
    ),
    roles: ["admin", "serviceStaff"],
  },
  {
    name: "Sales Agent",
    path: "/sale",
    pathname: "/business-intelligent/sale",
    icon: (isSidebarCollapsed: boolean) => (
      <FaChartLine className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
    ),
    roles: ["admin"],
  },
];

export default function BusinessIntelligentSidebar({
  user,
}: {
  user: any;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  // 切换侧边栏
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // 选择标签页
  const handleTabClick = (tab: string) => {
    router.push(`/business-intelligent/${tab}`);
  };

  // 处理登出 - Auth functionality commented out
  const handleLogout = () => {
    // signOut();
    console.log("Logout functionality disabled in development");
    // You can redirect to login page or home page instead
    // router.push("/");
  };

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col border-r border-black/10 bg-gray-50 transition-all duration-300",
        isSidebarCollapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      {/* 折叠/展开按钮 */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
      >
        {isSidebarCollapsed ? (
          <FaChevronRight className="h-3 w-3 text-gray-500" />
        ) : (
          <FaChevronLeft className="h-3 w-3 text-gray-500" />
        )}
      </button>

      {/* 用户资料 */}
      <div
        className={cn(
          "flex items-center border-b border-black/10 p-4",
          isSidebarCollapsed ? "justify-center" : "mb-4",
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100">
          {user.nick_name ? (
            <span className="text-lg font-semibold text-blue-600">
              {user.nick_name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <FaUser className="text-blue-600" />
          )}
        </div>
        {!isSidebarCollapsed && (
          <div className="ml-3">
            <div className="font-semibold">{user.nick_name || "用戶"}</div>
            <div className="text-xs text-gray-500">{user.cust_id}</div>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <div className="mt-2 flex flex-col">
        {MENU_ITEMS.map(
          (item) => (
            <button
              key={item.path}
              className={cn(
                "flex items-center py-3 transition-colors",
                !isSidebarCollapsed && "px-4",
                isSidebarCollapsed && "justify-center",
                pathname === item.pathname
                  ? "text-blue-600"
                  : "text-gray-700 hover:bg-gray-200",
              )}
              onClick={() => handleTabClick(item.path)}
            >
              {item.icon(isSidebarCollapsed)}
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </button>
          ),
        )}
      </div>

      {/* 底部信息和登出按钮 */}
      <div className="mt-auto">
        {/* 登出按钮 */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center border-t border-black/10 py-3 text-red-600 transition-colors hover:bg-gray-200",
            !isSidebarCollapsed && "justify-start px-4",
            isSidebarCollapsed && "justify-center",
          )}
        >
          <FaSignOutAlt
            className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")}
          />
          {!isSidebarCollapsed && <span>登出</span>}
        </button>

        {/* 版权信息 */}
        {!isSidebarCollapsed && (
          <div className="border-t border-black/10 p-4">
            <div className="text-xs text-gray-500">© 2025 TaazeAI</div>
          </div>
        )}
      </div>
    </div>
  );
}
