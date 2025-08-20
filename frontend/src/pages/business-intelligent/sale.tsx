"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import Head from "next/head";
import { Loading } from "@/components/ui/loading";
// import { UserType } from "@/types/auth";
import { useChatAgent } from "@/hooks/useChatAgent";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { RightPanel, useRightPanel } from "@/components/chat/RightPanel";
import { ChatMessageAgent } from "@/components/chat/ChatMessageAgent";
// import { useSession } from "next-auth/react";
import { AnalysisTool } from "@/components/chat/messageSection/salesTool/AnalysisTool";

type TabType = "charts" | "agent";

// 添加API類型
type ApiType = "sales_analysis" | "sales_top_categories";

// 添加API參數類型
interface ApiParams {
  start: string;
  end: string;
  metric: string;
  freq: string;
  filters: Record<string, any>;
  id_col: string;
  use_cache: boolean;
  top_n: number;
  analysis_dimension: string;
}

export default function SalePage() {
  // Auth functionality commented out
  // const { data: session } = useSession();
  // const user = session?.user as UserType;
  
  // Mock user for development
  const user = {
    cust_id: "mock_user",
    mail_main: "mock@example.com"
  };

  const productionUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { isOpen, toggle } = useRightPanel();
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("charts");
  // const isToolPanel = useMemo(() => !isMobile, [isMobile]);
  const isToolPanel = false;
  const [expandedTools, setExpandedTools] = useState<{
    [key: string]: boolean;
  }>({});

  // 添加API調用相關狀態
  const [selectedApi, setSelectedApi] = useState<ApiType>("sales_analysis");
  const [apiParams, setApiParams] = useState<ApiParams>({
    start: "",
    end: "",
    metric: "",
    freq: "",
    filters: {},
    id_col: "",
    use_cache: true,
    top_n: 5,
    analysis_dimension: "cat_nm",
  });
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);

  // 添加銷售相關的提示列表
  const quickPrompts = [
    "分析本月銷售數據趨勢",
    "生成客戶分析報告",
    "查看熱門產品銷售排行",
    "分析客戶購買行為模式",
    "生成銷售業績總結報告",
    "預測下個月銷售趨勢",
  ];

  // API選項配置
  const apiOptions = {
    sales_analysis: {
      title: "銷售數據趨勢分析",
      description: "分析銷售數據的時間趨勢",
      requiredParams: ["start", "end", "metric", "freq"],
      optionalParams: ["filters", "id_col", "use_cache"],
    },
    sales_top_categories: {
      title: "頂級分類分析",
      description: "分析頂級商品分類的時間序列數據",
      requiredParams: ["start", "end", "freq"],
      optionalParams: ["top_n", "analysis_dimension", "metric", "filters"],
    },
  };

  const metricOptions = {
    sales_analysis: [
      "total_amount",
      "total_sum_amount",
      "tax_amt",
      "freight",
      "total_qty",
      "total_items",
      "stk_qty",
      "disc",
      "order_count",
      "customer_count",
      "product_count",
    ],
    sales_top_categories: ["list_amount", "stk_qty"],
  };

  const freqOptions = [
    "D",
    "B",
    "W",
    "W-MON",
    "MS",
    "ME",
    "M",
    "QS",
    "Q",
    "YS",
    "Y",
    "H",
  ];

  const idColOptions = ["mas_no", "cust_id", "org_prod_id"];
  const analysisDimensionOptions = ["cat_nm", "prod_id"];

  // 處理API調用
  const handleApiCall = async () => {
    setIsApiLoading(true);
    setApiResult(null);

    try {
      const endpoint =
        selectedApi === "sales_analysis"
          ? "/sales_analysis"
          : "/sales_top_categories";

      // 構建請求參數
      const params: any = {
        start: apiParams.start,
        end: apiParams.end,
        freq: apiParams.freq,
      };

      if (selectedApi === "sales_analysis") {
        params.metric = apiParams.metric;
        if (apiParams.id_col) params.id_col = apiParams.id_col;
        params.use_cache = apiParams.use_cache;
      } else {
        if (apiParams.top_n) params.top_n = apiParams.top_n;
        if (apiParams.analysis_dimension)
          params.analysis_dimension = apiParams.analysis_dimension;
        if (apiParams.metric) params.metric = apiParams.metric;
      }

      // 添加過濾條件
      if (Object.keys(apiParams.filters).length > 0) {
        params.filters = apiParams.filters;
      }

      const response = await fetch(productionUrl + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      setApiResult(result);
    } catch (error) {
      console.error("API調用失敗:", error);
      setApiResult({ error: "API調用失敗" });
    } finally {
      setIsApiLoading(false);
    }
  };

  // 處理參數變更
  const handleParamChange = (key: keyof ApiParams, value: any) => {
    setApiParams((prev: ApiParams) => ({
      ...prev,
      [key]:
        key === "top_n"
          ? typeof value === "string"
            ? parseInt(value) || 0
            : value
          : value,
    }));
  };

  // 處理過濾條件變更
  const handleFilterChange = (key: string, value: string) => {
    setApiParams((prev: ApiParams) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

  // 預設圖表配置
  const presetCharts = [
    {
      title: "每日總銷售額趨勢",
      description: "2025年1月每日銷售金額變化",
      type: "analysis_tool",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-01-31T23:59",
        metric: "total_amount",
        freq: "D",
        filters: {} as Record<string, any>,
        id_col: "",
        use_cache: true,
      },
    },
    {
      title: "每週銷售額趨勢（按公司分析）",
      description: "TAZ公司2025年Q1週銷售趨勢",
      type: "analysis_tool",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        metric: "total_amount",
        freq: "W",
        filters: { company_id: "TAZ" } as Record<string, any>,
        id_col: "",
        use_cache: true,
      },
    },
    {
      title: "每月純商品金額趨勢",
      description: "不含稅費運費的商品金額月度趨勢",
      type: "analysis_tool",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        metric: "total_sum_amount",
        freq: "MS",
        filters: {} as Record<string, any>,
        id_col: "",
        use_cache: true,
      },
    },
    {
      title: "季度銷售額趨勢",
      description: "2024-2025年季度銷售金額變化",
      type: "analysis_tool",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        metric: "total_amount",
        freq: "QS",
        filters: {} as Record<string, any>,
        id_col: "",
        use_cache: true,
      },
    },
    {
      title: "每日訂單數量趨勢",
      description: "2025年1月每日訂單量統計",
      type: "analysis_tool",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-01-31T23:59",
        metric: "order_count",
        freq: "D",
        filters: {} as Record<string, any>,
        id_col: "mas_no",
        use_cache: true,
      },
    },
    {
      title: "工作日訂單趨勢（女性客戶）",
      description: "女性客戶工作日訂單趨勢分析",
      type: "analysis_tool",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-02-28T23:59",
        metric: "order_count",
        freq: "B",
        filters: { sex: "F" } as Record<string, any>,
        id_col: "mas_no",
        use_cache: true,
      },
    },
    {
      title: "每週商品總數量趨勢",
      description: "2025年Q1週商品數量變化",
      type: "analysis_tool",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        metric: "total_qty",
        freq: "W-MON",
        filters: {} as Record<string, any>,
        id_col: "",
        use_cache: true,
      },
    },
    {
      title: "每月新客戶數量趨勢",
      description: "2024-2025年月度新客戶統計",
      type: "analysis_tool",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        metric: "customer_count",
        freq: "MS",
        filters: {} as Record<string, any>,
        id_col: "cust_id",
        use_cache: true,
      },
    },
    {
      title: "每月商品種類數趨勢",
      description: "2024-2025年月度商品種類統計",
      type: "analysis_tool",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        metric: "product_count",
        freq: "ME",
        filters: {} as Record<string, any>,
        id_col: "org_prod_id",
        use_cache: true,
      },
    },
    {
      title: "每月稅費趨勢",
      description: "2024-2025年月度稅費變化",
      type: "analysis_tool",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        metric: "tax_amt",
        freq: "MS",
        filters: {} as Record<string, any>,
        id_col: "",
        use_cache: true,
      },
    },
    {
      title: "每週折扣金額趨勢",
      description: "2025年Q1週折扣金額變化",
      type: "analysis_tool",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        metric: "disc",
        freq: "W",
        filters: {} as Record<string, any>,
        id_col: "",
        use_cache: true,
      },
    },
  ];

  // 分類排行趨勢預設圖表配置
  const categoryPresetCharts = [
    {
      title: "每月top5書籍分類銷售額趨勢",
      description: "2024-2025年每月熱門書籍分類銷售金額排行",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 5,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每週top3書籍分類銷售額趨勢",
      description: "2025年Q1每週top3書籍分類銷售排行",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        freq: "W",
        top_n: 3,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每日top10書籍分類銷售額趨勢",
      description: "2025年1月每日top10書籍分類銷售排行",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "D",
        top_n: 10,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "季度top8書籍分類銷售額趨勢",
      description: "2024-2025年季度熱門書籍分類銷售排行",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "QS",
        top_n: 8,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "年度top15書籍分類銷售額趨勢",
      description: "2020-2025年年度書籍分類銷售排行",
      type: "time_series_top_categories",
      params: {
        start: "2020-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "YS",
        top_n: 15,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每月top5書籍分類銷量趨勢",
      description: "2024-2025年每月書籍分類銷量排行",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 5,
        analysis_dimension: "cat_nm",
        metric: "stk_qty",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每週top7書籍分類銷量趨勢",
      description: "2025年Q1每週書籍分類銷量排行",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        freq: "W",
        top_n: 7,
        analysis_dimension: "cat_nm",
        metric: "stk_qty",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每日top5書籍分類銷量趨勢",
      description: "2025年1月每日書籍分類銷量排行",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "D",
        top_n: 5,
        analysis_dimension: "cat_nm",
        metric: "stk_qty",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每月新書舊書銷售額對比",
      description: "2024-2025年新書舊書銷售金額對比趨勢",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 2,
        analysis_dimension: "prod_id",
        metric: "list_amount",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每週新書舊書銷量對比",
      description: "2025年Q1新書舊書銷量對比趨勢",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        freq: "W",
        top_n: 2,
        analysis_dimension: "prod_id",
        metric: "stk_qty",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "每日新書舊書銷售額對比",
      description: "2025年1月新書舊書銷售金額對比",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "D",
        top_n: 2,
        analysis_dimension: "prod_id",
        metric: "list_amount",
        filters: {} as Record<string, any>,
      },
    },
    {
      title: "TAZ公司每月top5書籍分類銷售額",
      description: "TAZ公司2024-2025年月度熱門分類",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 5,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: { company_id: "TAZ" } as Record<string, any>,
      },
    },
    {
      title: "SPE公司每週top3書籍分類銷量",
      description: "SPE公司2025年Q1週分類銷量排行",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        freq: "W",
        top_n: 3,
        analysis_dimension: "cat_nm",
        metric: "stk_qty",
        filters: { company_id: "SPE" } as Record<string, any>,
      },
    },
    {
      title: "女性客戶每月top5書籍分類偏好",
      description: "女性客戶2024-2025年月度偏好分析",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 5,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: { sex: "F" } as Record<string, any>,
      },
    },
    {
      title: "男性客戶每週top3書籍分類偏好",
      description: "男性客戶2025年Q1週偏好分析",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        freq: "W",
        top_n: 3,
        analysis_dimension: "cat_nm",
        metric: "stk_qty",
        filters: { sex: "M" } as Record<string, any>,
      },
    },
    {
      title: "台灣地區每月top8書籍分類銷售額",
      description: "台灣地區2024-2025年月度分類銷售排行",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 8,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: { buyer_country_id: "TW" } as Record<string, any>,
      },
    },
    {
      title: "台北地區每週top5書籍分類銷量",
      description: "台北地區2025年Q1週分類銷量排行",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        freq: "W",
        top_n: 5,
        analysis_dimension: "cat_nm",
        metric: "stk_qty",
        filters: { buyer_city_id: "TPE" } as Record<string, any>,
      },
    },
    {
      title: "宅配訂單每月top6書籍分類偏好",
      description: "宅配訂單2024-2025年月度分類偏好",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 6,
        analysis_dimension: "cat_nm",
        metric: "list_amount",
        filters: { deliver: "HOME" } as Record<string, any>,
      },
    },
    {
      title: "店面取貨每週top4書籍分類偏好",
      description: "店面取貨2025年Q1週分類偏好",
      type: "time_series_top_categories",
      params: {
        start: "2025-01-01T00:00",
        end: "2025-03-31T23:59",
        freq: "W",
        top_n: 4,
        analysis_dimension: "cat_nm",
        metric: "stk_qty",
        filters: { deliver: "STORE" } as Record<string, any>,
      },
    },
    {
      title: "台北女性客戶每月top3新書舊書偏好",
      description: "台北女性客戶2024-2025年新書舊書偏好對比",
      type: "time_series_top_categories",
      params: {
        start: "2024-01-01T00:00",
        end: "2025-01-31T23:59",
        freq: "MS",
        top_n: 2,
        analysis_dimension: "prod_id",
        metric: "list_amount",
        filters: { sex: "F", buyer_city_id: "TPE" } as Record<string, any>,
      },
    },
  ];

  // 處理預設圖表調用
  const handlePresetChart = async (
    preset: (typeof presetCharts)[0] | (typeof categoryPresetCharts)[0],
  ) => {
    setIsApiLoading(true);
    setApiResult(null);

    try {
      let endpoint: string;
      let params: any;

      if (preset.type === "analysis_tool") {
        const analysisPreset = preset as (typeof presetCharts)[0];
        endpoint = "/sales_analysis";
        params = {
          start: analysisPreset.params.start
            .replace("T", " ")
            .replace("-", "/")
            .replace("-", "/"),
          end: analysisPreset.params.end
            .replace("T", " ")
            .replace("-", "/")
            .replace("-", "/"),
          freq: analysisPreset.params.freq,
          metric: analysisPreset.params.metric,
          use_cache: analysisPreset.params.use_cache,
        };

        if (analysisPreset.params.id_col) {
          params.id_col = analysisPreset.params.id_col;
        }

        if (Object.keys(analysisPreset.params.filters).length > 0) {
          params.filters = analysisPreset.params.filters;
        }
      } else {
        // time_series_top_categories
        const categoryPreset = preset as (typeof categoryPresetCharts)[0];
        endpoint = "/sales_top_categories";
        params = {
          start: categoryPreset.params.start
            .replace("T", " ")
            .replace("-", "/")
            .replace("-", "/"),
          end: categoryPreset.params.end
            .replace("T", " ")
            .replace("-", "/")
            .replace("-", "/"),
          freq: categoryPreset.params.freq,
        };

        if (categoryPreset.params.top_n) {
          params.top_n = categoryPreset.params.top_n;
        }
        if (categoryPreset.params.analysis_dimension) {
          params.analysis_dimension = categoryPreset.params.analysis_dimension;
        }
        if (categoryPreset.params.metric) {
          params.metric = categoryPreset.params.metric;
        }
        if (Object.keys(categoryPreset.params.filters).length > 0) {
          params.filters = categoryPreset.params.filters;
        }
      }

      const response = await fetch(productionUrl + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      setApiResult(result);

      // 更新當前參數狀態以顯示在表單中
      if (preset.type === "analysis_tool") {
        const analysisPreset = preset as (typeof presetCharts)[0];
        setApiParams({
          start: analysisPreset.params.start,
          end: analysisPreset.params.end,
          metric: analysisPreset.params.metric,
          freq: analysisPreset.params.freq,
          filters: analysisPreset.params.filters,
          id_col: analysisPreset.params.id_col || "",
          use_cache: analysisPreset.params.use_cache,
          top_n: 5,
          analysis_dimension: "cat_nm",
        });
      } else {
        const categoryPreset = preset as (typeof categoryPresetCharts)[0];
        setApiParams({
          start: categoryPreset.params.start,
          end: categoryPreset.params.end,
          metric: categoryPreset.params.metric || "",
          freq: categoryPreset.params.freq,
          filters: categoryPreset.params.filters,
          id_col: "",
          use_cache: true,
          top_n: categoryPreset.params.top_n || 5,
          analysis_dimension:
            categoryPreset.params.analysis_dimension || "cat_nm",
        });
      }
    } catch (error) {
      console.error("API調用失敗:", error);
      setApiResult({ error: "API調用失敗" });
    } finally {
      setIsApiLoading(false);
    }
  };

  // 處理快速提示點擊
  const handleQuickPromptClick = (prompt: string) => {
    setMessage(prompt);
    handleChat(prompt);
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleToolExpansion = (toolId: string) => {
    setSelectedMessageId(toolId);
    setExpandedTools((prev) => {
      const newValue = prev[toolId] === false ? true : false;
      return {
        ...prev,
        [toolId]: newValue,
      };
    });
  };

  const [isComposing, setIsComposing] = useState(false);
  const {
    handleChat,
    currentChat,
    // setCurrentChat,
    isChatLoading,
    isStreaming,
  } = useChatAgent({
    userId: user?.cust_id || "",
    url: productionUrl + "/sales_agent",
    agentId: "",
    selectedChat: null,
    sessionId: "",
    setQuery: setMessage,
    chatContainerRef: chatContainerRef as RefObject<HTMLDivElement>,
    locale: "zh_TW",
  });

  // const {} = useScrollToBottom({
  //   isStreaming,
  //   dependencies: [currentChat],
  //   containerRef: chatContainerRef as RefObject<HTMLDivElement>,
  // });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isComposing) return;

      e.preventDefault();
      handleChat(message);
    }
  };

  // 如果用户未登录，可以显示登录提示
  if (!user) {
    return (
      <>
        <Head>
          <title>Sales Agent | Business Intelligence</title>
          <meta name="description" content="銷售分析工具" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="flex h-full w-full flex-col items-center justify-center">
          <p className="mb-4 text-lg">請先登入以使用銷售智能分析功能</p>
        </div>
      </>
    );
  }

  // Tab按鈕組件
  const TabButton = ({
    tab,
    label,
    isActive,
  }: {
    tab: TabType;
    label: string;
    isActive: boolean;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "rounded-t-lg px-6 py-3 text-sm font-medium transition-colors",
        isActive
          ? "border-b-2 border-primary bg-white text-primary"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200",
      )}
    >
      {label}
    </button>
  );

  // 圖表卡片組件
  const ChartCard = ({ chart }: { chart: any }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{chart.description}</p>
        </div>
        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
          {chart.type}
        </span>
      </div>

      {/* 模擬圖表區域 */}
      <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-50">
        <div className="text-sm text-gray-400">
          {chart.type === "line" && "📈"}
          {chart.type === "bar" && "📊"}
          {chart.type === "pie" && "🥧"}
          {chart.type === "column" && "📊"}
          <div className="mt-2">圖表預覽</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>創建時間: {chart.createdAt}</span>
        <div className="flex gap-2">
          <button className="text-blue-600 hover:text-blue-800">查看</button>
          <button className="text-green-600 hover:text-green-800">編輯</button>
          <button className="text-red-600 hover:text-red-800">刪除</button>
        </div>
      </div>
    </div>
  );

  // API調用區塊組件
  const ApiCallSection = () => (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">產生圖表</h3>

      {/* API選擇 */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">選擇工具</label>
        <select
          value={selectedApi}
          onChange={(e) => setSelectedApi(e.target.value as ApiType)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {Object.entries(apiOptions).map(([key, option]) => (
            <option key={key} value={key}>
              {option.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-600">
          {apiOptions[selectedApi].description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 開始時間 */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            開始時間 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={apiParams.start}
            onChange={(e) => handleParamChange("start", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* 結束時間 */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            結束時間 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={apiParams.end}
            onChange={(e) => handleParamChange("end", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* 時間頻率 */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            時間頻率 <span className="text-red-500">*</span>
          </label>
          <select
            value={apiParams.freq}
            onChange={(e) => handleParamChange("freq", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">請選擇</option>
            {freqOptions.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </div>

        {/* 銷售分析特有參數 */}
        {selectedApi === "sales_analysis" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">
                分析指標 <span className="text-red-500">*</span>
              </label>
              <select
                value={apiParams.metric}
                onChange={(e) => handleParamChange("metric", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">請選擇</option>
                {metricOptions.sales_analysis.map((metric) => (
                  <option key={metric} value={metric}>
                    {metric}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">去重ID列</label>
              <select
                value={apiParams.id_col}
                onChange={(e) => handleParamChange("id_col", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">無</option>
                {idColOptions.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="use_cache"
                checked={apiParams.use_cache}
                onChange={(e) =>
                  handleParamChange("use_cache", e.target.checked)
                }
                className="mr-2"
              />
              <label htmlFor="use_cache" className="text-sm">
                使用緩存
              </label>
            </div>
          </>
        )}

        {/* 頂級分類分析特有參數 */}
        {selectedApi === "sales_top_categories" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">返回數量</label>
              <input
                type="number"
                min="1"
                value={apiParams.top_n}
                onChange={(e) => handleParamChange("top_n", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">分析維度</label>
              <select
                value={apiParams.analysis_dimension}
                onChange={(e) =>
                  handleParamChange("analysis_dimension", e.target.value)
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {analysisDimensionOptions.map((dim) => (
                  <option key={dim} value={dim}>
                    {dim}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">分析指標</label>
              <select
                value={apiParams.metric}
                onChange={(e) => handleParamChange("metric", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {metricOptions.sales_top_categories.map((metric) => (
                  <option key={metric} value={metric}>
                    {metric}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* 過濾條件 */}
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">
          過濾條件 (可選)
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="過濾欄位 (例如: company_id)"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  const nextInput =
                    target.nextElementSibling as HTMLInputElement;
                  if (target.value && nextInput?.value) {
                    handleFilterChange(target.value, nextInput.value);
                    target.value = "";
                    nextInput.value = "";
                  }
                }
              }}
            />
            <input
              type="text"
              placeholder="過濾值 (例如: TAZ)"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  const prevInput =
                    target.previousElementSibling as HTMLInputElement;
                  if (prevInput?.value && target.value) {
                    handleFilterChange(prevInput.value, target.value);
                    prevInput.value = "";
                    target.value = "";
                  }
                }
              }}
            />
          </div>
          <p className="text-xs text-gray-500">按Enter鍵添加過濾條件</p>

          {/* 顯示已添加的過濾條件 */}
          {Object.keys(apiParams.filters).length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">已添加的過濾條件:</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(apiParams.filters).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                  >
                    {key}: {String(value)}
                    <button
                      onClick={() => {
                        const newFilters = { ...apiParams.filters };
                        delete newFilters[key];
                        handleParamChange("filters", newFilters);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 調用按鈕 */}
      <div className="mt-6">
        <button
          onClick={handleApiCall}
          disabled={
            isApiLoading ||
            !apiParams.start ||
            !apiParams.end ||
            !apiParams.freq ||
            (selectedApi === "sales_analysis" && !apiParams.metric)
          }
          className="rounded bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isApiLoading ? "調用中..." : "調用API"}
        </button>
      </div>

      {/* API結果展示 - 使用 AnalysisTool 組件 */}
      {apiResult && !apiResult.error && apiResult.data && (
        <div className="mt-6">
          <h4 className="mb-4 text-lg font-semibold">分析結果:</h4>
          <AnalysisTool
            toolArgs={JSON.stringify({
              metric: apiParams.metric,
              freq: apiParams.freq,
              company_id: apiParams.filters.company_id,
              ...apiParams.filters,
            })}
            toolResult={JSON.stringify(apiResult.data)}
          />
        </div>
      )}

      {/* 錯誤結果展示 */}
      {apiResult && (apiResult.error || !apiResult.data) && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-medium text-red-600">錯誤結果:</h4>
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <pre className="max-h-60 overflow-auto text-xs text-red-700">
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Sales Agent | Business Intelligence</title>
        <meta name="description" content="銷售分析工具" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="flex h-full w-full flex-col overflow-y-auto">
        <h1 className="mb-4 text-2xl font-bold">Sales Agent</h1>

        {/* Tab 導航 */}
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          <TabButton
            tab="charts"
            label="圖表展示"
            isActive={activeTab === "charts"}
          />
          <TabButton
            tab="agent"
            label="AI分析"
            isActive={activeTab === "agent"}
          />
        </div>

        {/* 圖表展示模式 */}
        {activeTab === "charts" && (
          <div className="flex-1 overflow-y-auto">
            {/* API調用區塊 */}
            <ApiCallSection />

            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">已生成的圖表</h2>
                <button
                  onClick={() => setActiveTab("agent")}
                  className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
                >
                  生成新圖表
                </button>
              </div>
              <p className="text-sm text-gray-600">
                查看和管理您已經生成的銷售分析圖表
              </p>
            </div>

            {/* 預設圖表快速生成區域 */}
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold">基礎趨勢分析</h3>
              <p className="mb-3 text-sm text-gray-600">
                基本的銷售、訂單、客戶等數據趨勢分析
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {presetCharts.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetChart(preset)}
                    disabled={isApiLoading}
                    className="group rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary">
                        {preset.title}
                      </h4>
                      <span className="ml-2 flex-shrink-0 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {preset.params.freq}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-gray-600">
                      {preset.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {preset.params.metric}
                      </span>
                      <span className="text-xs text-primary group-hover:font-medium">
                        點擊生成 →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 分類排行趨勢分析區域 */}
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold">分類排行趨勢分析</h3>
              <p className="mb-3 text-sm text-gray-600">
                書籍分類、客戶偏好、地區特色等排行趨勢分析
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categoryPresetCharts.map((preset, index) => (
                  <button
                    key={`category-${index}`}
                    onClick={() => handlePresetChart(preset)}
                    disabled={isApiLoading}
                    className="hover:border-orange/50 group rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                        {preset.title}
                      </h4>
                      <span className="ml-2 flex-shrink-0 rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">
                        Top{preset.params.top_n}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-gray-600">
                      {preset.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {preset.params.metric} • {preset.params.freq}
                      </span>
                      <span className="text-xs text-orange-600 group-hover:font-medium">
                        點擊生成 →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI分析模式 */}
        {activeTab === "agent" && (
          <>
            {/* 快速提示按鈕區域 */}
            <div className="mb-4 flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPromptClick(prompt)}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  disabled={isChatLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div
              className={cn(
                "relative flex w-full flex-row border-b border-grey transition-all duration-300",
                isOpen && !isMobile ? "gap-2" : "",
                "transition-all duration-300",
                currentChat.length > 0
                  ? "h-[70vh] lg:h-[60vh]"
                  : "h-0 overflow-hidden",
              )}
            >
              <div
                className={cn(
                  "h-full space-y-6 overflow-y-auto rounded-t-lg bg-black-4 p-2",
                  isOpen && !isMobile ? "w-3/5" : "w-full",
                )}
                ref={chatContainerRef}
              >
                {currentChat.map((message, index) => (
                  <ChatMessageAgent
                    key={`current-${index}`}
                    message={message}
                    sessionId={"default"}
                    chatHistory={[]}
                    currentChat={currentChat}
                    expandedTools={expandedTools}
                    toggleToolExpansion={toggleToolExpansion}
                    className="text-black"
                    isStreaming={isStreaming}
                    isLoading={isChatLoading}
                    handleChat={handleChat}
                    isToolPanel={isToolPanel}
                  />
                ))}
                {(isChatLoading || isStreaming) && (
                  <div className="flex items-center justify-start">
                    <Loading className="size-6" />
                  </div>
                )}
              </div>

              {isToolPanel && (
                <RightPanel
                  agentName="Sales Agent"
                  isOpen={isOpen}
                  onOpenChange={toggle}
                  className="h-full space-y-6 overflow-y-auto rounded-t-lg bg-black-4"
                  width="w-2/5"
                  chatHistory={[]}
                  currentChat={currentChat}
                  selectedMessageId={selectedMessageId}
                  setSelectedMessageId={setSelectedMessageId}
                />
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="請輸入您的銷售分析需求"
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                className="h-[115px] w-full rounded bg-black-4 px-4 pb-[60px] pr-24 align-top text-sm placeholder:text-xs focus:outline-none focus:ring-0 lg:text-p_reg_sp lg:placeholder:text-p_reg_sp"
                disabled={isChatLoading}
                aria-label="輸入您的銷售分析需求"
              />
              <div className="absolute bottom-2 right-2 z-20 flex items-center gap-2">
                <button
                  disabled={!message.trim()}
                  onClick={() => {
                    handleChat(message);
                  }}
                  className="flex size-9 items-center justify-center rounded bg-primary p-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="發送訊息"
                >
                  <Image
                    src="/icons/arrow-up.svg"
                    alt="發送"
                    width={20}
                    height={20}
                    className="size-4 text-white lg:size-5"
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}