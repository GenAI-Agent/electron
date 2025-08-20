import React from "react";
import type { ServiceMail } from "@/types/service";
import { InquiryTypeEnum } from "@/types/service";
import ServiceBadge from "./ServiceBadge";
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    className={`h-5 w-5 ${filled ? "text-yellow-400" : "text-gray-300"}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

interface ServiceMailCardProps {
  mail: ServiceMail;
  status: string;
  onClick: () => void;
}

export const ServiceMailCard: React.FC<ServiceMailCardProps> = ({
  mail,
  status,
  onClick,
}) => (
  <div
    className="group flex cursor-pointer items-start rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
    onClick={onClick}
  >
    {/* 星標 */}
    <div className="mr-3 flex-shrink-0 pt-0.5">
      <StarIcon filled={mail.star_flg === "Y"} />
    </div>
    {/* 主體內容 */}
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-medium text-black">
        {mail.msg_subject}
      </span>
      <div className="my-1 space-y-2">
        <div className="flex items-center">
          <ServiceBadge type="status">{status}</ServiceBadge>
          <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {InquiryTypeEnum[mail.msg_type as keyof typeof InquiryTypeEnum] ||
              mail.msg_type}
          </span>
          {/* {mail.status_flg === "A" && (
            <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
              已結案
            </span>
          )} */}
        </div>
        <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-600">
          <span>
            <span className="font-semibold">發送者 ID:</span> {mail.cust_id}
          </span>
          <span>
            <span className="font-semibold">信箱:</span> {mail.msg_mail}
          </span>
        </div>
      </div>
      <div className="mt-1 line-clamp-2 text-sm text-gray-500">
        {mail.msg_content}
      </div>
    </div>
    {/* 右側資訊 */}
    <div className="ml-4 mt-1 flex min-w-[120px] flex-col items-end">
      <span className="text-xs text-gray-400">
        {new Date(mail.crt_time).toLocaleString()}
      </span>
    </div>
  </div>
);
