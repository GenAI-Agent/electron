"use client";
import React from "react";
import { FileText, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
;

export interface Document {
  _id: string;
  name: string;
  url: string;
  uploaded_at: string;
  status: string;
  type: string;
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onRefresh: () => void;
  onToggleSelect: (docName: string) => void;
  selectedDocuments?: string[];
  enableMultiSelect?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onRefresh,
  onToggleSelect,
  selectedDocuments = [],
  enableMultiSelect = false,
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

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-medium">已上傳文件</h2>
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
            <p>加載文件中...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>尚未上傳任何文件</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className={cn(
                  "flex cursor-pointer items-center rounded-md border p-3 transition-colors hover:bg-gray-50",
                  selectedDocuments.includes(doc.name) &&
                  "border-blue-300 bg-blue-50",
                )}
                onClick={() => onToggleSelect(doc.name)}
              >
                <FileText className="mr-3 h-5 w-5 flex-shrink-0 text-blue-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-900">
                    {doc.name}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-2">{formatDate(doc.uploaded_at)}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        doc.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800",
                      )}
                    >
                      {doc.status === "completed"
                        ? "已完成"
                        : doc.status === "processing"
                          ? "處理中"
                          : doc.status === "pending"
                            ? "待處理"
                            : doc.status}
                    </span>
                  </div>
                </div>
                {enableMultiSelect && (
                  <div className="mr-3">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.name)}
                      onChange={() => { }} // 由于使用了 onClick，这里只是为了消除 React 警告
                      className="h-4 w-4 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
