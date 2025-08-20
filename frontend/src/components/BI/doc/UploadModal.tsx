"use client";
import { cn } from "@/utils/cn";
;
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { X } from "lucide-react";

interface FileWithPreview extends File {
  preview: string;
  base64?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileStatus, setFileStatus] = useState<{ [key: string]: string }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      ),
    );
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    maxFiles: 20,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  const saveToMongoDB = async (fileInfos: { name: string; url: string }[]) => {
    try {
      const response = await fetch("/api/docAgent/file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileInfos.map((file) => ({
            name: file.name,
            url: file.url,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("保存到MongoDB失敗");
      }

      const result = await response.json();
      return result.ids;
    } catch (error) {
      console.error("保存到MongoDB時出錯:", error);
      toast.error("無法將文件信息保存到數據庫");
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    const toastId = toast.loading(`正在上傳`);
    try {
      const uploadPromises = files.map(async (file) => {
        setFileStatus((prev) => ({ ...prev, [file.name]: "上傳中" }));

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/docAgent/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          setFileStatus((prev) => ({
            ...prev,
            [file.name]: "上傳失敗，請小於4MB",
          }));
          throw new Error(`上傳文件 ${file.name} 失敗`);
        }

        const result = await response.json();
        setFileStatus((prev) => ({ ...prev, [file.name]: "上傳完成" }));
        return { name: file.name, url: result.fileUrl };
      });

      const fileUrls = await Promise.all(uploadPromises);
      await saveToMongoDB(fileUrls);
      toast.success("所有文件上傳成功", {
        id: toastId,
      });

      // 上传成功后清空文件列表并通知父组件
      setFiles([]);
      setFileStatus({});
      onUploadSuccess();

      // 延迟关闭弹窗，让用户看到成功消息
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("上傳文件時出錯:", error);
      toast.error("部分文件上傳失敗", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = () => {
    setFiles([]);
    setFileStatus({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">上傳文檔</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {files.length === 0 ? (
          <div
            {...getRootProps()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition-colors hover:border-gray-400"
          >
            <input {...getInputProps()} />
            <div className="mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
            <p className="mb-2 text-gray-600">上傳 .DOCX 文檔</p>
            <p className="text-sm text-gray-400">最多20筆</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="mb-4 text-center font-semibold">
              已選擇 {files.length} 筆文件
            </h3>
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center rounded border border-gray-200 p-2"
                  >
                    <div className="mr-2 rounded bg-blue-100 px-2 py-1 text-xs uppercase text-blue-800">
                      {file.name.split(".")[1]}
                    </div>
                    <span className="text-sm text-gray-700">
                      {file.name.split(".")[0]}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {fileStatus[file.name] || "等待上傳"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {files.length > 0 && (
            <button
              className={cn(
                "rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300",
                loading && "cursor-not-allowed opacity-50",
              )}
              onClick={handleReupload}
              disabled={loading}
            >
              重新選擇
            </button>
          )}
          <button
            className={cn(
              "rounded bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600",
              (loading || files.length === 0) &&
              "cursor-not-allowed opacity-50",
            )}
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            className={cn(
              "rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600",
              (loading || files.length === 0) &&
              "cursor-not-allowed opacity-50",
            )}
            onClick={handleUpload}
            disabled={loading || files.length === 0}
          >
            {loading ? "上傳中..." : "確認上傳"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
