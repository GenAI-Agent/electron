import React from "react";

interface ServiceDateCardProps {
  date: string;
  total: number;
  aiReplies: number;
  manualReplies: number;
  onClick: (date: string) => void;
}

export const ServiceDateCard: React.FC<ServiceDateCardProps> = ({
  date,
  total,
  aiReplies,
  manualReplies,
  onClick,
}) => {
  return (
    <div className="group relative">
      <div
        onClick={() => onClick(date)}
        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
      >
        <h3 className="mb-4 text-lg font-semibold">{date}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-sm text-gray-600">總信件數</div>
            <div className="text-2xl font-bold text-blue-600">{total}</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="text-sm text-gray-600">AI 已回覆</div>
            <div className="text-2xl font-bold text-green-600">{aiReplies}</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-3">
            <div className="text-sm text-gray-600">需人工回覆</div>
            <div className="text-2xl font-bold text-purple-600">
              {manualReplies}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="rounded-md bg-gray-300 px-2 py-1 text-xs text-black">
          顯示該日信件
        </div>
      </div>
    </div>
  );
};
