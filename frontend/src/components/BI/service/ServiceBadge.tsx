import { cn } from "@/utils/cn";
;

export default function ServiceBadge({
  children,
  type,
}: {
  children: React.ReactNode;
  type?: "status" | "type" | "status-review";
}) {
  const getMailStyle = (text: string) => {
    if (text === "已審核") return "bg-green-700 text-white rounded";
    if (text === "待審核") return "bg-yellow-500 text-white rounded";
    if (text === "需人工回覆") return "bg-red-100 text-red-700 rounded";
    if (text === "待處理") return "bg-gray-100 text-gray-700 rounded";
    return "bg-gray-100 text-gray-700 rounded";
  };
  const getStatusReviewStyle = (text: string) => {
    if (text === "未結案") return "bg-yellow-100 text-yellow-700 rounded-full";
    if (text === "已結案") return "bg-green-100 text-green-700 rounded-full";
    return "bg-gray-100 text-gray-700 rounded-full";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
        type === "type" && "rounded-full bg-gray-100 text-gray-700",
        type === "status" && getMailStyle(children as string),
        type === "status-review" && getStatusReviewStyle(children as string),
      )}
    >
      {children}
    </span>
  );
}
