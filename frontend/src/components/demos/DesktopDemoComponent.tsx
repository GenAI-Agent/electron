import React, { useState, useEffect } from 'react';
import { Monitor, FolderOpen, FileText, Cpu, Settings, Play } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DesktopDemoComponentProps {
  className?: string;
}

export const DesktopDemoComponent: React.FC<DesktopDemoComponentProps> = ({ className }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [processingFiles, setProcessingFiles] = useState<number[]>([]);

  const demoSteps = [
    {
      title: "掃描本地文件",
      description: "AI 智能識別和分類本地文件系統",
      icon: FolderOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "文檔內容分析",
      description: "深度理解文檔內容和結構",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "自動化工作流",
      description: "根據自定義規則執行批量操作",
      icon: Settings,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "智能處理完成",
      description: "高效完成複雜的桌面任務",
      icon: Cpu,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  const mockFiles = [
    { name: "報告.docx", type: "document", processed: false },
    { name: "數據.xlsx", type: "spreadsheet", processed: false },
    { name: "簡報.pptx", type: "presentation", processed: false },
    { name: "圖片.jpg", type: "image", processed: false },
    { name: "代碼.py", type: "code", processed: false }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length);
    }, 3000);

    const fileInterval = setInterval(() => {
      setProcessingFiles(prev => {
        if (prev.length >= mockFiles.length) {
          return [];
        }
        return [...prev, prev.length];
      });
    }, 800);

    return () => {
      clearInterval(stepInterval);
      clearInterval(fileInterval);
    };
  }, []);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'spreadsheet':
        return '📊';
      case 'presentation':
        return '📋';
      case 'image':
        return '🖼️';
      case 'code':
        return '💻';
      default:
        return '📁';
    }
  };

  return (
    <div className={cn("w-full h-full p-6", className)}>
      {/* Desktop Interface Mockup */}
      <div className="w-full h-full min-h-[500px] flex flex-col">
        <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-xl border border-gray-300 overflow-hidden flex flex-col">
          {/* Desktop Header */}
          <div className="bg-primary text-white px-4 py-2 flex items-center gap-4">
            <Monitor className="w-5 h-5" />
            <span className="text-sm font-medium">LensOS Desktop Agent</span>
            <div className="ml-auto flex gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 flex-1">
            {/* Left Panel - File System */}
            <div className="bg-white border-r border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                文件系統
              </h4>
              <div className="space-y-2">
                {mockFiles.map((file, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md transition-all duration-500",
                      processingFiles.includes(index)
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                    {processingFiles.includes(index) && (
                      <div className="w-4 h-4">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - AI Processing */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex flex-col">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                AI 處理引擎
              </h4>

              {/* Current Step Display */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500",
                  demoSteps[currentStep].bgColor
                )}>
                  {React.createElement(demoSteps[currentStep].icon, {
                    className: cn("w-8 h-8", demoSteps[currentStep].color)
                  })}
                </div>
                <h3 className="text-base font-semibold text-center text-gray-800 mb-2">
                  {demoSteps[currentStep].title}
                </h3>
                <p className="text-xs text-gray-600 text-center max-w-xs leading-relaxed">
                  {demoSteps[currentStep].description}
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-xs mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(processingFiles.length / mockFiles.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    處理進度: {processingFiles.length}/{mockFiles.length}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 flex justify-center">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors">
                  <Play className="w-4 h-4" />
                  開始處理
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">本地檔案</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">批量處理</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">自動化</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">智能分析</span>
        </div>
      </div>
    </div>
  );
};