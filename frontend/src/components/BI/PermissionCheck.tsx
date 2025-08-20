import { ReactNode } from "react";
// import { auth } from "@/auth";
import { adminIds } from "@/constants/account";
// import { UserType } from "@/types/auth";
// import LogoutButton from "@/components/BI/LogoutButton";
// import { redirect } from "next/navigation";

interface PermissionCheckProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function PermissionCheck({
  children,
  allowedRoles,
}: PermissionCheckProps) {
  // Auth functionality commented out for development
  /*
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const user = session.user as UserType;
  const userRole = adminIds.find(
    (admin) =>
      admin.cust_id === user.cust_id || admin.cust_id === user.mail_main,
  )?.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="flex h-[100vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
          <div className="mb-6 text-2xl font-bold text-red-600">權限不足</div>
          <p className="mb-4 text-lg">抱歉，您沒有訪問此頁面的權限。</p>
          <p className="mb-6 text-gray-600">
            您當前的角色是: {userRole || "未定義"}
            <br />
            如需訪問，請使用具有相應權限的帳號登入。
          </p>
          <div className="flex flex-col gap-3">
            <LogoutButton text="登出切換帳號" />
          </div>
        </div>
      </div>
    );
  }
  */

  // For development, always allow access
  return <>{children}</>;
}
