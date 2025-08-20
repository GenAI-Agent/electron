"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { PricingReport } from "@/types";
import { toast } from "react-hot-toast";
import TypeSelector from "@/components/BI/pricing/TypeSelector";
import ReportButtons from "@/components/BI/pricing/ReportButtons";
import BookSearch from "@/components/BI/pricing/BookSearch";
import TabNavigation from "@/components/BI/pricing/TabNavigation";
import PricingTab from "@/components/BI/pricing/PricingTab";
import MarketingTab from "@/components/BI/pricing/MarketingTab";
import SummaryTab from "@/components/BI/pricing/SummaryTab";
import UserReportsTab from "@/components/BI/pricing/UserReportsTab";
import SocialTab from "@/components/BI/pricing/SocialTab";

interface QueryParams {
  table_name: string;
  fields: string[];
  order_by: { [key: string]: string };
  limit: number;
  conditions?: { [key: string]: any };
}

interface MarketingReport {
  id: string;
  content: string;
  created_at: string;
  books_event: string[];
  eslite_event: string[];
  kingstone_event: string[];
}

interface UserReport {
  uuid: string;
  report_name: string;
  prod_ids: string;
  created_at: string;
}

interface CsvUploadResponse {
  status: string;
  message: string;
  uuid: string;
  report_name: string;
  processed_count: number;
  data: any;
}

export default function PricingPage() {
  const [, setIsMobile] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("bestsellers");
  const [bookName, setBookName] = useState<string>("");
  const [bookResult, setBookResult] = useState<PricingReport[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [pricingData, setPricingData] = useState<PricingReport[]>([]);
  const [categoryTitle, setCategoryTitle] = useState<string>("200本暢銷書籍");
  const [isComposing, setIsComposing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "pricing" | "marketing" | "summary" | "social" | "userReports"
  >("pricing");
  const [marketingData, setMarketingData] = useState<MarketingReport | null>(
    null,
  );
  const [isLoadingMarketing, setIsLoadingMarketing] = useState<boolean>(false);
  const [reportType, setReportType] = useState<"category" | "publisher">(
    "publisher",
  );

  // CSV上传相关状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<CsvUploadResponse | null>(
    null,
  );

  // 用户报告列表相关状态
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [selectedReportData, setSelectedReportData] = useState<PricingReport[]>(
    [],
  );
  const [isLoadingReportData, setIsLoadingReportData] =
    useState<boolean>(false);

  // 獲取報表數據的函數
  const fetchPricingReport = async (type: "category" | "publisher") => {
    const fileName =
      type === "category"
        ? "category_books_summary.json"
        : "publisher_books_summary.json";

    const response = await fetch(
      `/api/s3?key=business-intelligent/price_report/${fileName}`,
    );

    if (!response.ok) {
      throw new Error(`獲取${type}報表失敗: ${response.statusText}`);
    }

    return response.json();
  };

  // 獲取社群報告數據的函數
  const fetchSocialReport = async () => {
    const response = await fetch(
      `/api/s3?key=business-intelligent/social_report/keywords_report.json`,
    );

    if (!response.ok) {
      throw new Error(`獲取社群報告失敗: ${response.statusText}`);
    }

    return response.json();
  };

  // React Query 查詢
  const categoryReportQuery = useQuery({
    queryKey: ["pricingReport", "category"],
    queryFn: () => fetchPricingReport("category"),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    enabled: false,
  });

  const publisherReportQuery = useQuery({
    queryKey: ["pricingReport", "publisher"],
    queryFn: () => fetchPricingReport("publisher"),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const socialReportQuery = useQuery({
    queryKey: ["socialReport"],
    queryFn: fetchSocialReport,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const currentReportQuery =
    reportType === "category" ? categoryReportQuery : publisherReportQuery;

  // 初始化設置
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 獲取書籍價格數據
  useEffect(() => {
    switch (selectedType) {
      case "bestsellers":
        setCategoryTitle("200本暢銷書籍");
        break;
      case "readbook":
        setCategoryTitle("讀冊買斷書籍");
        break;
      case "discount79":
        setCategoryTitle("79折書籍");
        break;
      default:
        setCategoryTitle("200本暢銷書籍");
    }

    const fetchPricingData = async () => {
      try {
        setIsSearching(true);
        setBookResult([]);

        const queryParams: QueryParams = {
          table_name: "pricing_report",
          fields: ["*"],
          order_by: { created_at: "DESC" },
          limit: 100,
        };

        if (selectedType === "bestsellers") {
          queryParams.conditions = { special_tag: 0 };
        } else if (selectedType === "discount79") {
          queryParams.conditions = { special_tag: 1 };
        } else if (selectedType === "readbook") {
          queryParams.conditions = { special_tag: 2 };
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_DB_API_URL}/api/query`,
          queryParams,
        );

        if (response.data && response.data.data) {
          setPricingData(response.data.data);
        }
      } catch (err) {
        console.error("獲取價格數據失敗", err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchPricingData();
  }, [selectedType]);

  // 处理单本书籍搜索
  const handleBookSearch = async () => {
    if (!bookName.trim()) return;

    setIsSearching(true);
    setBookResult([]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
      const response = await fetch(`${apiUrl}/get_book_price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ book_name: bookName }),
      });
      const data = await response.json();
      setBookResult([data]);
    } catch (error) {
      console.error("搜索书籍时出错:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 获取市场营销分析报告
  const handleMarketingAnalysis = async () => {
    setIsLoadingMarketing(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_DB_API_URL}/api/query`,
        {
          table_name: "marketing_report",
          fields: ["*"],
          order_by: { created_at: "DESC" },
          limit: 1,
        },
      );

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setMarketingData(response.data.data[0]);
      }
    } catch (error) {
      console.error("獲取行銷分析報告時出錯:", error);
    } finally {
      setIsLoadingMarketing(false);
    }
  };

  const getPricingReport = (type: "category" | "publisher") => {
    setReportType(type);
    setActiveTab("summary");

    if (type === "category" && !categoryReportQuery.data) {
      categoryReportQuery.refetch();
    }
  };

  // CSV文件上传函数
  const handleCsvUpload = async () => {
    if (!selectedFile || !reportName.trim()) {
      toast.error("請選擇CSV文件並輸入報告名稱");
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("report_name", reportName.trim());

      const apiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
      const response = await fetch(`${apiUrl}/pricing_agent_csv`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        fetchUserReports();
        setSelectedFile(null);
        setReportName("");
        toast.success(
          `報告 "${result.report_name}" 上傳成功！處理了 ${result.processed_count} 本書籍`,
        );
      } else {
        toast.error(`上傳失敗: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error("上傳CSV文件時出錯:", error);
      toast.error("上傳失敗，請稍後再試");
    } finally {
      setIsUploading(false);
    }
  };

  // 获取用户报告列表函数
  const fetchUserReports = async () => {
    setIsLoadingReports(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_DB_API_URL}/api/query`,
        {
          table_name: "pricing_file",
          fields: ["uuid", "report_name", "prod_ids", "created_at"],
          order_by: { created_at: "DESC" },
          limit: 50,
        },
      );

      if (response.data && response.data.data) {
        setUserReports(response.data.data);
      }
    } catch (error) {
      console.error("獲取用戶報告列表時出錯:", error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  // 获取特定报告的详细数据函数
  const fetchReportData = async (report: UserReport) => {
    if (!report || !report.prod_ids) {
      toast.error("報告數據無效");
      return;
    }

    setIsLoadingReportData(true);
    setSelectedReport(report);
    setSelectedReportData([]);

    try {
      const prodIds = report.prod_ids;

      if (prodIds.length === 0) {
        setSelectedReportData([]);
        toast.error("該報告沒有包含任何產品ID");
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_DB_API_URL}/api/query`,
        {
          table_name: "pricing_report",
          fields: ["*"],
          order_by: { created_at: "DESC" },
          limit: 1000,
          conditions: {
            prod_id: prodIds,
          },
        },
      );

      if (response.data && response.data.data) {
        const filteredData = response.data.data.filter((item: PricingReport) =>
          prodIds.includes(item.prod_id),
        );
        setSelectedReportData(filteredData);

        if (filteredData.length === 0) {
          toast.error("未找到該報告對應的價格數據");
        } else {
          toast.success(`成功載入 ${filteredData.length} 筆價格數據`);
        }
      }
    } catch (error) {
      console.error("獲取報告數據時出錯:", error);
    } finally {
      setIsLoadingReportData(false);
    }
  };

  // 處理類型變更
  const handleTypeChange = (type: string) => {
    setBookName("");
    setActiveTab("pricing");
    setBookResult([]);
    setSelectedType(type);
  };

  useEffect(() => {
    handleMarketingAnalysis();
    fetchUserReports();
  }, []);

  return (
    <>
      <Head>
        <title>Pricing Agent | Business Intelligence</title>
        <meta name="description" content="價格分析工具" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="flex w-full flex-col px-4">
        <h1 className="mb-4 text-2xl font-bold">Pricing Agent</h1>

        {/* 書籍類型選擇器 */}
        <TypeSelector
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
        />

        {/* 報表按鈕 */}
        <ReportButtons
          onGetReport={getPricingReport}
          categoryReportQuery={categoryReportQuery}
          publisherReportQuery={publisherReportQuery}
        />

        {/* 單本書籍搜索 */}
        <BookSearch
          bookName={bookName}
          setBookName={setBookName}
          onSearch={handleBookSearch}
          isSearching={isSearching}
          isComposing={isComposing}
          setIsComposing={setIsComposing}
        />

        {/* Tab 導航 */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* 內容顯示區域 */}
        {activeTab === "pricing" && (
          <PricingTab
            bookResult={bookResult}
            pricingData={pricingData}
            isSearching={isSearching}
            categoryTitle={categoryTitle}
          />
        )}

        {activeTab === "marketing" && (
          <MarketingTab
            marketingData={marketingData}
            isLoadingMarketing={isLoadingMarketing}
          />
        )}

        {activeTab === "summary" && (
          <SummaryTab
            currentReportQuery={currentReportQuery}
            reportType={reportType}
          />
        )}

        {activeTab === "userReports" && (
          <UserReportsTab
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            reportName={reportName}
            setReportName={setReportName}
            isUploading={isUploading}
            uploadResult={uploadResult}
            handleCsvUpload={handleCsvUpload}
            userReports={userReports}
            isLoadingReports={isLoadingReports}
            fetchUserReports={fetchUserReports}
            selectedReport={selectedReport}
            selectedReportData={selectedReportData}
            isLoadingReportData={isLoadingReportData}
            fetchReportData={fetchReportData}
          />
        )}

        {activeTab === "social" && (
          <SocialTab socialReportQuery={socialReportQuery} />
        )}
      </div>
    </>
  );
}