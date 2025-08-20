"use client";
import React from "react";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
;
import { Document } from "./DocumentList";

interface ProcessingListProps {
  documents: Document[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ProcessingList: React.FC<ProcessingListProps> = ({
  documents,
  isLoading,
  onRefresh,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "processing":
        return "處理中";
      case "failed":
        return "失敗";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-medium">處理狀態</h2>
        <button
          onClick={onRefresh}
          className="rounded p-1 hover:bg-gray-100"
          disabled={isLoading}
        >
          <RefreshCw
            className={cn("h-5 w-5 text-gray-500", isLoading && "animate-spin")}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin" />
            <p>加載狀態中...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>目前沒有處理中的文件</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center rounded-md border p-3 transition-colors hover:bg-gray-50"
              >
                {getStatusIcon(doc.status)}
                <div className="ml-3 min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-900">
                    {doc.name}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-2">{formatDate(doc.uploaded_at)}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        getStatusClass(doc.status),
                      )}
                    >
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingList;
