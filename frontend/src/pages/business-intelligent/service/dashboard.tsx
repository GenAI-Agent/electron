"use client";

import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { ServiceMail, ServiceMailReply } from "@/types/service";
import { useRouter } from "next/router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useState } from "react";
import { ServiceDateCard } from "@/components/BI/service/ServiceDateCard";

interface DailyStats {
  date: string;
  aiReplies: number;
  manualReplies: number;
  total: number;
}

interface StatsRecord {
  aiReplies: number;
  manualReplies: number;
  total: number;
}

const COLORS = ["#22c55e", "#a855f7"];

export default function ServiceDashboardPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchServiceMails = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DB_API_URL}/api/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_name: "service_msg",
          fields: "*",
        }),
      },
    );
    const res = await response.json();
    return res.data;
  };

  const fetchServiceMailReplies = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DB_API_URL}/api/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_name: "service_msg_reply",
          fields: "*",
        }),
      },
    );
    const res = await response.json();
    return res.data;
  };

  const { data: mails, isLoading: isMailsLoading } = useQuery({
    queryKey: ["serviceMails"],
    queryFn: fetchServiceMails,
  });

  const { data: replies, isLoading: isRepliesLoading } = useQuery({
    queryKey: ["serviceMailReplies"],
    queryFn: fetchServiceMailReplies,
  });

  // 按日期分组数据
  const groupedByDate = mails?.reduce(
    (acc: Record<string, StatsRecord>, mail: ServiceMail) => {
      const date = new Date(mail.crt_time).toISOString().split("T")[0];

      if (!acc[date]) {
        acc[date] = {
          aiReplies: 0,
          manualReplies: 0,
          total: 0,
        };
      }

      // 查找对应的回复
      const reply = replies?.find(
        (reply: ServiceMailReply) => reply.rpy_pk_no === mail.pk_no,
      );

      // 根据 reply 的 content 判断是 AI 还是人工回复
      if (reply && reply.content !== "") {
        acc[date].aiReplies++;
      } else {
        acc[date].manualReplies++;
      }
      acc[date].total++;

      return acc;
    },
    {},
  );

  // 将数据转换为数组并按日期排序
  const sortedDates: DailyStats[] = groupedByDate
    ? (Object.entries(groupedByDate) as [string, StatsRecord][])
        .map(([date, stats]) => ({
          date,
          aiReplies: stats.aiReplies,
          manualReplies: stats.manualReplies,
          total: stats.total,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // 计算总体统计数据
  const totalStats = sortedDates.reduce(
    (acc, curr) => ({
      aiReplies: acc.aiReplies + curr.aiReplies,
      manualReplies: acc.manualReplies + curr.manualReplies,
      total: acc.total + curr.total,
    }),
    { aiReplies: 0, manualReplies: 0, total: 0 },
  );

  // 准备圆饼图数据
  const pieData = [
    { name: "AI 回覆", value: totalStats.aiReplies },
    { name: "需人工回覆", value: totalStats.manualReplies },
  ];

  // 计算分页数据
  const totalPages = Math.ceil(sortedDates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDates = sortedDates.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // 处理日期点击事件
  const handleDateClick = (date: string) => {
    router.push(`/business-intelligent/service?date=${date}`);
  };

  return (
    <>
      <Head>
        <title>Service Dashboard | Business Intelligence</title>
        <meta name="description" content="客服數據統計" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="flex h-full w-full flex-col overflow-y-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <h1 className="text-2xl font-bold">客服 Agent 數據統計</h1>
          </div>
        </div>

        {isMailsLoading || isRepliesLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* 圆饼图部分 */}
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">回覆類型分布</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <div className="text-sm text-gray-600">AI 回覆總數</div>
                  <div className="text-2xl font-bold text-green-600">
                    {totalStats.aiReplies}
                  </div>
                </div>
                <div className="rounded-lg bg-purple-50 p-3">
                  <div className="text-sm text-gray-600">需人工回覆總數</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {totalStats.manualReplies}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {currentDates.map(({ date, total, aiReplies, manualReplies }) => (
                <ServiceDateCard
                  key={date}
                  date={date}
                  total={total}
                  aiReplies={aiReplies}
                  manualReplies={manualReplies}
                  onClick={handleDateClick}
                />
              ))}
              <div className="flex items-center justify-center gap-4 py-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一頁
                </button>
                <span className="text-sm">
                  第 {currentPage} 頁，共 {totalPages} 頁
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  下一頁
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}