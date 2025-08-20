import React from "react";
import { ServiceMailReply } from "@/types/service";
import { useRouter } from "next/navigation";

interface ServiceLogsProps {
  replies: ServiceMailReply[];
}

export const ServiceLogs: React.FC<ServiceLogsProps> = ({ replies }) => {
  const router = useRouter();

  // 按日期分组数据
  const groupedByDate = replies.reduce(
    (acc, reply) => {
      const date = new Date(reply.crt_time).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          aiReplies: 0,
          manualReplies: 0,
          total: 0,
        };
      }

      if (reply.content !== "") {
        acc[date].aiReplies++;
      } else {
        acc[date].manualReplies++;
      }
      acc[date].total++;

      return acc;
    },
    {} as Record<
      string,
      { aiReplies: number; manualReplies: number; total: number }
    >,
  );

  // 获取今天的统计数据
  const today = new Date().toLocaleDateString();
  const todayStats = groupedByDate[today] || {
    aiReplies: 0,
    manualReplies: 0,
    total: 0,
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">今日客服信件統計</h3>
        <button
          onClick={() => router.push("/business-intelligent/service/dashboard")}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
        >
          查看全部數據
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-blue-50 p-3">
          <div className="text-sm text-gray-600">總信件數</div>
          <div className="text-2xl font-bold text-blue-600">
            {todayStats.total}
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <div className="text-sm text-gray-600">AI 已回覆</div>
          <div className="text-2xl font-bold text-green-600">
            {todayStats.aiReplies}
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-3">
          <div className="text-sm text-gray-600">需人工回覆</div>
          <div className="text-2xl font-bold text-purple-600">
            {todayStats.manualReplies}
          </div>
        </div>
      </div>
    </div>
  );
};
