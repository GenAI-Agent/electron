"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { ServiceMail, ServiceMailReply } from "@/types/service";
import { ServiceMailList } from "@/components/BI/service/ServiceMailList";
import { ServiceLogs } from "@/components/BI/service/ServiceLogs";
import { useRouter, useSearchParams } from "next/navigation";
// import PermissionCheck from "@/components/BI/PermissionCheck";

type FilterType = "all" | "pending" | "needManual" | "needReview" | "reviewed";

interface SortAndFilterState {
  sort: {
    order: "asc" | "desc";
  };
  filters: {
    closed: "all" | "closed" | "open";
    star: "all" | "star" | "noStar";
    startDate: string;
    endDate: string;
    email: string;
    custId: string;
    pkNo: string;
  };
}

export default function ServiceAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdateTime, setLastUpdateTime] = useState(
    new Date().toISOString(),
  );
  const [currentFilter, setCurrentFilter] = useState<FilterType>("needReview");
  const itemsPerPage = 10;
  const [sortAndFilter, setSortAndFilter] = useState<SortAndFilterState>({
    sort: {
      order: "desc",
    },
    filters: {
      closed: "all",
      star: "all",
      startDate: "",
      endDate: "",
      email: "",
      custId: "",
      pkNo: "",
    },
  });

  // 清除 URL 参数
  const clearSearchParams = () => {
    const url = new URL(window.location.href);
    url.search = "";
    router.replace(url.pathname);
  };

  // 重置所有筛选条件
  const resetFilters = () => {
    setSortAndFilter({
      sort: {
        order: "desc",
      },
      filters: {
        closed: "all",
        star: "all",
        startDate: "",
        endDate: "",
        email: "",
        custId: "",
        pkNo: "",
      },
    });
    clearSearchParams();
  };

  // 设置今日筛选
  const setTodayFilter = () => {
    const today = new Date().toISOString().split("T")[0];
    setSortAndFilter({
      sort: {
        order: "desc",
      },
      filters: {
        closed: "all",
        star: "all",
        startDate: today,
        endDate: "",
        email: "",
        custId: "",
        pkNo: "",
      },
    });
    clearSearchParams();
  };

  // 处理URL参数中的日期
  useEffect(() => {
    const date = searchParams.get("date");
    if (date) {
      // 设置开始日期为当天
      const startDate = date;

      // 设置结束日期为下一天
      const dateObj = new Date(date);
      dateObj.setDate(dateObj.getDate() + 1);
      const endDate = dateObj.toISOString().split("T")[0];
      setSortAndFilter((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          startDate,
          endDate,
        },
      }));
    }
  }, [searchParams]);

  // 更新排序顺序
  const updateSortOrder = (order: string) => {
    setSortAndFilter((prev) => ({
      ...prev,
      sort: {
        ...prev.sort,
        order: order as SortAndFilterState["sort"]["order"],
      },
    }));
  };

  // 更新筛选条件
  const updateFilter = (
    key: keyof SortAndFilterState["filters"],
    value: string,
  ) => {
    setSortAndFilter((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

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
          order_by: { crt_time: "DESC" },
        }),
      },
    );
    const res = await response.json();
    setLastUpdateTime(
      new Date(
        Math.max(
          ...res.data.map((mail: ServiceMail) =>
            new Date(mail.crt_time).getTime(),
          ),
        ),
      ).toISOString(),
    );
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

  // 根据排序与筛选条件过滤与排序
  const getFilteredMails = (filter?: FilterType) => {
    if (!mails || !replies) return [];
    let filtered = mails;

    // 原有的 filterType 状态过滤
    switch (filter || currentFilter) {
      case "pending":
        filtered = filtered.filter(
          (mail: ServiceMail) =>
            !replies.some(
              (reply: ServiceMailReply) => reply.rpy_pk_no === mail.pk_no,
            ),
        );
        break;
      case "needManual":
        filtered = filtered.filter((mail: ServiceMail) =>
          replies.some(
            (reply: ServiceMailReply) =>
              reply.rpy_pk_no === mail.pk_no &&
              reply.content === "" &&
              reply.fixed_content === "",
          ),
        );
        break;
      case "needReview":
        filtered = filtered.filter((mail: ServiceMail) =>
          replies.some(
            (reply: ServiceMailReply) =>
              reply.rpy_pk_no === mail.pk_no &&
              (reply.content !== "" || reply.fixed_content !== "") &&
              reply.reviewer_cust_id === null &&
              reply.reviewer_email === null,
          ),
        );
        break;
      case "reviewed":
        filtered = filtered.filter((mail: ServiceMail) =>
          replies.some(
            (reply: ServiceMailReply) =>
              reply.rpy_pk_no === mail.pk_no &&
              (reply.reviewer_cust_id !== null ||
                reply.reviewer_email !== null),
          ),
        );
        break;
    }

    // 使用统一的筛选条件
    const { filters } = sortAndFilter;
    if (filters.closed !== "all") {
      filtered = filtered.filter((mail: ServiceMail) =>
        filters.closed === "closed"
          ? mail.status_flg === "A"
          : mail.status_flg !== "A",
      );
    }
    if (filters.star !== "all") {
      filtered = filtered.filter((mail: ServiceMail) =>
        filters.star === "star" ? mail.star_flg === "Y" : mail.star_flg !== "Y",
      );
    }
    if (filters.startDate) {
      filtered = filtered.filter(
        (mail: ServiceMail) =>
          new Date(mail.crt_time) >= new Date(filters.startDate),
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (mail: ServiceMail) =>
          new Date(mail.crt_time) <= new Date(filters.endDate),
      );
    }
    if (filters.email) {
      filtered = filtered.filter((mail: ServiceMail) =>
        mail.msg_mail.toLowerCase().includes(filters.email.toLowerCase()),
      );
    }
    if (filters.custId) {
      filtered = filtered.filter((mail: ServiceMail) =>
        mail.cust_id.toLowerCase().includes(filters.custId.toLowerCase()),
      );
    }
    if (filters.pkNo) {
      filtered = filtered.filter((mail: ServiceMail) =>
        mail.pk_no.toString().includes(filters.pkNo),
      );
    }

    // 使用统一的排序条件
    const { sort } = sortAndFilter;
    filtered = [...filtered].sort((a, b) => {
      return sort.order === "asc"
        ? new Date(a.crt_time).getTime() - new Date(b.crt_time).getTime()
        : new Date(b.crt_time).getTime() - new Date(a.crt_time).getTime();
    });

    return filtered;
  };

  const filteredMails = getFilteredMails(currentFilter);
  const totalPages = Math.ceil(filteredMails.length / itemsPerPage);
  const currentMails = filteredMails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // 检查邮件状态
  const getMailStatus = (mail: ServiceMail) => {
    const reply = replies?.find(
      (reply: ServiceMailReply) => reply.rpy_pk_no === mail.pk_no,
    );

    if (!reply) return "待處理";
    if (reply.content === "" && reply.fixed_content === "") return "需人工回覆";
    if (reply.reviewer_cust_id === null && reply.reviewer_email === null)
      return "待審核";
    return "已審核";
  };

  // 查看邮件详情
  const viewMailDetail = (mail: ServiceMail) => {
    router.push(`/business-intelligent/service/${mail.pk_no}`);
  };

  return (
    <>
      <Head>
        <title>Service Agent | Business Intelligence</title>
        <meta name="description" content="客服分析工具" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      {/* Permission check commented out */}
      {/* <PermissionCheck allowedRoles={["admin", "serviceStaff"]}> */}
        <div className="flex h-full w-full flex-col overflow-y-auto p-4">
          <h1 className="mb-4 text-2xl font-bold">客服 Agent</h1>

          {!isRepliesLoading && replies && <ServiceLogs replies={replies} />}

          {!isMailsLoading && mails && (
            <ServiceMailList
              lastUpdateTime={lastUpdateTime}
              mails={currentMails}
              isLoading={isMailsLoading}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              onMailClick={viewMailDetail}
              sortAndFilter={{
                sort: {
                  order: sortAndFilter.sort.order,
                  setOrder: updateSortOrder,
                },
                filters: {
                  closed: sortAndFilter.filters.closed,
                  star: sortAndFilter.filters.star,
                  startDate: sortAndFilter.filters.startDate,
                  endDate: sortAndFilter.filters.endDate,
                  email: sortAndFilter.filters.email,
                  custId: sortAndFilter.filters.custId,
                  pkNo: sortAndFilter.filters.pkNo,
                  setClosed: (value) => updateFilter("closed", value),
                  setStar: (value) => updateFilter("star", value),
                  setStartDate: (value) => updateFilter("startDate", value),
                  setEndDate: (value) => updateFilter("endDate", value),
                  setEmail: (value) => updateFilter("email", value),
                  setCustId: (value) => updateFilter("custId", value),
                  setPkNo: (value) => updateFilter("pkNo", value),
                  resetFilters,
                  setTodayFilter,
                },
              }}
              getMailStatus={getMailStatus}
              currentFilter={currentFilter}
              setCurrentFilter={setCurrentFilter}
              getFilteredMails={getFilteredMails}
            />
          )}
        </div>
      {/* </PermissionCheck> */}
    </>
  );
}