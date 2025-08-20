"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import Head from "next/head";
import { ServiceMailDetail } from "@/components/BI/service/ServiceMailDetail";
// import { useSession } from "next-auth/react";
// import { UserType } from "@/types/auth";
import { Loading } from "@/components/ui/loading";
import toast from "react-hot-toast";

export default function ServiceMailDetailPage() {
  const router = useRouter();
  const { pk_no } = router.query;
  
  // Auth functionality commented out
  // const { data: session } = useSession();
  // const user = session?.user as UserType;
  
  // Mock user for development
  const user = {
    cust_id: "mock_user",
    mail_main: "mock@example.com"
  };

  const fetchServiceMail = async () => {
    if (!pk_no) return null;
    
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
          conditions: {
            pk_no: parseInt(pk_no as string),
          },
        }),
      },
    );
    const res = await response.json();
    return res.data[0];
  };

  const fetchServiceMailReply = async () => {
    if (!pk_no) return null;
    
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
          conditions: {
            rpy_pk_no: parseInt(pk_no as string),
          },
        }),
      },
    );
    const res = await response.json();
    return res.data[0] || null;
  };

  const { data: mail } = useQuery({
    queryKey: ["serviceMail", pk_no],
    queryFn: fetchServiceMail,
    enabled: !!pk_no,
  });

  const { data: reply, refetch: refetchReply } = useQuery({
    queryKey: ["serviceMailReply", pk_no],
    queryFn: fetchServiceMailReply,
    enabled: !!pk_no,
  });

  const handleReview = async () => {
    if (!reply) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DB_API_URL}/api/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table_name: "service_msg_reply",
            update_data: {
              reviewer_cust_id: user?.cust_id,
              reviewer_email: user?.mail_main,
              updated_time: new Date().toISOString(),
            },
            where: `id = '${reply.id}'`,
          }),
        },
      );

      if (response.ok) {
        toast.success("審核成功");
        refetchReply();
      } else {
        toast.error("審核失敗");
      }
    } catch (error) {
      console.error("審核時發生錯誤:", error);
    }
  };

  const handleEdit = async (content: string) => {
    if (!reply) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DB_API_URL}/api/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table_name: "service_msg_reply",
            update_data: {
              fixed_content: content,
              updated_time: new Date().toISOString(),
            },
            where: `id = '${reply.id}'`,
          }),
        },
      );

      if (response.ok) {
        toast.success("編輯成功");
        refetchReply();
      } else {
        toast.error("編輯失敗");
      }
    } catch (error) {
      console.error("編輯時發生錯誤:", error);
      toast.error("編輯時發生錯誤");
    }
  };

  if (!pk_no) {
    return (
      <>
        <Head>
          <title>Service Mail Detail | Business Intelligence</title>
          <meta name="description" content="客服信件詳情" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="flex h-screen w-full items-center justify-center">
          <Loading />
        </div>
      </>
    );
  }

  if (!mail) {
    return (
      <>
        <Head>
          <title>Service Mail Detail | Business Intelligence</title>
          <meta name="description" content="客服信件詳情" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="flex h-screen w-full items-center justify-center">
          <Loading />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Service Mail Detail | Business Intelligence</title>
        <meta name="description" content="客服信件詳情" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="flex h-full w-full flex-col overflow-y-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Service Agent</h1>
        </div>

        <ServiceMailDetail
          mail={mail}
          reply={reply}
          onBack={() => router.push("/business-intelligent/service")}
          onReview={handleReview}
          onEdit={handleEdit}
        />
      </div>
    </>
  );
}