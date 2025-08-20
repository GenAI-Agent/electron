"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// 註冊Chart.js組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface PricingChartProps {
  pricingData: Array<{
    prod_id: string;
    org_prod_id: string;
    prod_title_main: string;
    eslite_prices: { price: number; url: string }[];
    shopee_prices: { price: number; url: string }[];
    momo_prices: { price: number; url: string }[];
    books_prices: { price: number; url: string }[];
    pchome_prices: { price: number; url: string }[];
    rakuten_prices: { price: number; url: string }[];
    goldstone_prices: { price: number; url: string }[];
    sanmin_prices: { price: number; url: string }[];
    tien_prices: { price: number; url: string }[];
    iread_prices: { price: number; url: string }[];
    market_min_price: number | string;
  }>;
}

export default function PricingChart({ pricingData }: PricingChartProps) {
  // 獲取數組中的最低價格 - 更新以處理新的 JSON 格式
  const getLowestPrice = (prices: { price: number; url: string }[] | null) => {
    if (!prices || prices.length === 0) return null;

    // 過濾出有效價格並找出最小值
    const validPrices = prices
      .map((item) => item.price)
      .filter(
        (price) => typeof price === "number" && !isNaN(price) && price > 0,
      );

    if (validPrices.length === 0) return null;
    return Math.min(...validPrices);
  };

  // 準備圖表數據
  const prepareChartData = () => {
    // 使用所有當前頁的數據
    const displayData = pricingData;

    const labels = displayData.map((item) => {
      // 如果產品名稱過長，截斷並添加省略號
      const maxLength = 18; // 稍微增加長度以適應更少的項目
      return item.prod_title_main.length > maxLength
        ? item.prod_title_main.substring(0, maxLength) + "..."
        : item.prod_title_main;
    });

    return {
      labels,
      datasets: [
        {
          label: "誠品價格",
          data: displayData.map(
            (item) => getLowestPrice(item.eslite_prices) || 0,
          ),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
        {
          label: "蝦皮價格",
          data: displayData.map(
            (item) => getLowestPrice(item.shopee_prices) || 0,
          ),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
        {
          label: "MOMO價格",
          data: displayData.map(
            (item) => getLowestPrice(item.momo_prices) || 0,
          ),
          backgroundColor: "rgba(255, 206, 86, 0.6)",
        },
        {
          label: "博客來價格",
          data: displayData.map(
            (item) => getLowestPrice(item.books_prices) || 0,
          ),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "PCHome價格",
          data: displayData.map(
            (item) => getLowestPrice(item.pchome_prices) || 0,
          ),
          backgroundColor: "rgba(153, 102, 255, 0.6)",
        },
        {
          label: "樂天價格",
          data: displayData.map(
            (item) => getLowestPrice(item.rakuten_prices) || 0,
          ),
          backgroundColor: "rgba(255, 159, 64, 0.6)",
        },
        {
          label: "金石堂價格",
          data: displayData.map(
            (item) => getLowestPrice(item.goldstone_prices) || 0,
          ),
          backgroundColor: "rgba(255, 193, 7, 0.6)",
        },
        {
          label: "三民價格",
          data: displayData.map(
            (item) => getLowestPrice(item.sanmin_prices) || 0,
          ),
          backgroundColor: "rgba(0, 123, 255, 0.6)",
        },
        {
          label: "天龍價格",
          data: displayData.map(
            (item) => getLowestPrice(item.tien_prices) || 0,
          ),
          backgroundColor: "rgba(40, 167, 69, 0.6)",
        },
        {
          label: "iRead價格",
          data: displayData.map(
            (item) => getLowestPrice(item.iread_prices) || 0,
          ),
          backgroundColor: "rgba(220, 53, 69, 0.6)",
        },
        {
          label: "市場最低價",
          data: displayData.map((item) => {
            const price = item.market_min_price;
            if (price === null || price === undefined) return 0;
            return typeof price === "string" ? parseFloat(price) : price;
          }),
          backgroundColor: "rgba(199, 199, 199, 0.6)",
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "當前頁面圖書價格比較",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("zh-TW", {
                style: "currency",
                currency: "TWD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "價格 (NT$)",
        },
      },
    },
    barPercentage: 0.8, // 調整條形寬度
    categoryPercentage: 0.9, // 調整組間距
  };

  if (pricingData.length === 0) {
    return <div className="py-10 text-center">暫無數據可展示</div>;
  }

  return (
    <div className="mb-12 mt-8">
      <h2 className="mb-4 text-xl font-bold">當前頁圖書價格對比</h2>
      <div className="h-[500px]">
        <Bar options={options} data={prepareChartData()} />
      </div>
    </div>
  );
}
