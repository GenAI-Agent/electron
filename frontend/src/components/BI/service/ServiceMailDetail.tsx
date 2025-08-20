import React, { useEffect, useState } from "react";
import { ArrowLeft, UserCircle, X } from "lucide-react";
// import { ReactMarkdownNoFormatLink } from "@/components/ReactMarkdownCustom";
import {
  ServiceMail,
  ServiceMailReply,
  InquiryTypeEnum,
} from "@/types/service";
import ServiceBadge from "./ServiceBadge";
import axios from "axios";
import ReactMarkdown from "react-markdown";
// import { BookListCard } from "@/components/BookListCard";
// import { Loading } from "@/components/ui/loading";

interface ServiceMailDetailProps {
  mail: ServiceMail;
  reply: ServiceMailReply | null;
  onBack: () => void;
  onReview: () => Promise<void>;
  onEdit: (content: string) => Promise<void>;
}

const Button = ({
  children,
  onClick,
  className,
  active,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`rounded-md px-3 py-2 transition-colors ${variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : active
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 hover:bg-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className || ""}`}
  >
    {children}
  </button>
);

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

async function fetchPersonalBookList(custId: string) {
  if (!custId) return null;

  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_MAC_MINI_API_URL}/user_graph_v03/${custId}`,
  );
  const data = await response.data;
  return data.data;
}

const Modal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
};

export const ServiceMailDetail: React.FC<ServiceMailDetailProps> = ({
  mail,
  reply,
  onBack,
  onReview,
  onEdit,
}) => {
  const [fixedContent, setFixedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookList, setBookList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFixedContent, setShowFixedContent] = useState(true);
  // 检查邮件状态
  const getMailStatus = () => {
    if (!reply) return "待處理";
    if (reply.content === "" && reply.fixed_content === "") return "需人工回覆";
    if (reply.reviewer_cust_id === null && reply.reviewer_email === null)
      return "待審核";
    return "已審核";
  };
  useEffect(() => {
    if (reply?.fixed_content === "" && reply.content === "") {
      setIsEditing(true);
    }
  }, [reply]);

  const handleUserClick = async () => {
    if (mail.cust_id) {
      setIsLoading(true);
      setIsModalOpen(true);
      try {
        const result = await fetchPersonalBookList(mail.cust_id);
        setBookList(result || []);
      } catch (error) {
        console.error("Error fetching book list:", error);
        setBookList([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex-1">
      <Button onClick={onBack} className="mb-4 flex items-center">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      <div className="mb-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-4 pb-2">
          <div className="flex items-center gap-2">
            <StarIcon filled={mail.star_flg === "Y"} />
            <div className="text-lg font-medium">{mail.msg_subject}</div>
          </div>
          <div className="mt-2 flex gap-2">
            <ServiceBadge type="type">
              {InquiryTypeEnum[mail.msg_type as keyof typeof InquiryTypeEnum] ||
                mail.msg_type}
            </ServiceBadge>
            {/* <ServiceBadge type="status-review">
              {mail.status_flg === "A" ? "已結案" : "未結案"}
            </ServiceBadge> */}
          </div>
          <div className="mt-2 space-y-2 text-sm text-gray-500">
            <div className="flex items-end justify-between">
              <div className="flex flex-col justify-between">
                <span>郵件地址: {mail.msg_mail}</span>
                <div className="flex items-center gap-2">
                  會員編號: {mail.cust_id}
                  <UserCircle
                    className="h-4 w-4 cursor-pointer hover:text-blue-500"
                    onClick={handleUserClick}
                  />
                </div>
                <span>最後指派人: {mail.last_rpy_uname || "無"}</span>
              </div>
              <span>發信時間: {new Date(mail.crt_time).toLocaleString()}</span>
            </div>

            {mail.remark && (
              <div className="text-gray-600">備註: {mail.remark}</div>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="whitespace-pre-wrap">{mail.msg_content}</div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">會員推薦書籍</h2>
            <p className="mt-1 text-sm text-gray-500">
              會員編號: {mail.cust_id}
            </p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-4">
              {/* <Loading /> */}
              <div>Loading...</div>
            </div>
          ) : bookList.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {/* {bookList.map((book, index) => (
                <BookListCard key={index} book={book} className="w-full" />
              ))} */}
            </div>
          ) : (
            <div className="text-center text-gray-500">暫無書籍資料</div>
          )}
        </div>
      </Modal>

      {reply && (
        <div className="rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 p-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-medium">
                {reply.subject || "人工回覆"}
              </div>
              <div className="flex gap-2">
                {getMailStatus() !== "已審核" && (
                  <Button
                    variant="primary"
                    className="flex items-center gap-2"
                    onClick={() => {
                      setFixedContent(reply.fixed_content || reply.content);
                      setIsEditing(true);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    客服編輯
                  </Button>
                )}
                <Button
                  variant="primary"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  disabled={getMailStatus() === "已審核" || isEditing}
                  onClick={() => onReview()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  審核通過
                </Button>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              <ServiceBadge type="status">{getMailStatus()}</ServiceBadge>
              <div className="mt-2 space-y-2 text-sm text-gray-500">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col justify-between">
                    {reply.reviewer_cust_id && (
                      <div>審核人ID: {reply.reviewer_cust_id}</div>
                    )}
                    {reply.reviewer_email && (
                      <div>審核人郵箱: {reply.reviewer_email}</div>
                    )}
                    {reply.updated_time && (
                      <div>
                        最後更新:{" "}
                        {new Date(reply.updated_time).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span>
                    產生時間: {new Date(reply.crt_time).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {!isEditing ? (
                <>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">
                        {reply.fixed_content ? "已修正內容:" : "AI 回覆內容:"}
                      </h4>
                      {reply.fixed_content && reply.content && (
                        <Button
                          variant="secondary"
                          onClick={() => setShowFixedContent(!showFixedContent)}
                        >
                          {showFixedContent ? "顯示原始內容" : "顯示修正內容"}
                        </Button>
                      )}
                    </div>
                    {/* <ReactMarkdownNoFormatLink className="rounded-md bg-gray-50 p-3">
                      {reply.fixed_content && showFixedContent
                        ? reply.fixed_content
                        : reply.content}
                    </ReactMarkdownNoFormatLink> */}
                    <ReactMarkdown>{reply.fixed_content && showFixedContent
                      ? reply.fixed_content
                      : reply.content}</ReactMarkdown>
                  </div>
                </>
              ) : (
                <div>
                  <h4 className="mb-2 font-medium">編輯內容:</h4>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-3"
                    rows={10}
                    value={fixedContent || reply.content}
                    onChange={(e) => setFixedContent(e.target.value)}
                    placeholder="請輸入修改後的內容..."
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setFixedContent("");
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        onEdit(fixedContent);
                        setIsEditing(false);
                      }}
                      disabled={!fixedContent.trim()}
                    >
                      提交修改
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
