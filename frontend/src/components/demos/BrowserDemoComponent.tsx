import React, { useState, useEffect } from 'react';
import { Globe, Search, MousePointer, Zap, Code, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BrowserDemoComponentProps {
  className?: string;
}

export const BrowserDemoComponent: React.FC<BrowserDemoComponentProps> = ({ className }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const demoSteps = [
    {
      title: "AI 掃描網頁",
      description: "智能識別網頁元素和內容結構",
      icon: Search,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "自動填寫表單",
      description: "根據用戶指令自動填寫和提交表單",
      icon: MousePointer,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "數據提取分析",
      description: "提取並分析網頁數據，生成報告",
      icon: Code,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "一鍵自動化",
      description: "複雜的多步驟操作一鍵完成",
      icon: Zap,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative w-full h-full flex flex-col items-center justify-center", className)}>
      {/* Browser Window Mockup */}
      <div className="w-full max-w-2xl bg-white rounded-t-lg shadow-2xl border border-gray-200">
        {/* Browser Header */}
        <div className="flex items-center px-4 py-3 bg-primary rounded-t-lg border-b border-gray-200">
          <div className="flex gap-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-white rounded-md px-3 py-1.5 text-sm">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">https://example.com</span>
          </div>
        </div>

        {/* Browser Content */}
        <div className="relative h-64 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
          {/* Demo Step Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "transition-all duration-500 transform",
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-80"
            )}>
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto",
                demoSteps[currentStep].bgColor
              )}>
                {React.createElement(demoSteps[currentStep].icon, {
                  className: cn("w-10 h-10", demoSteps[currentStep].color)
                })}
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-2">
                {demoSteps[currentStep].title}
              </h3>
              <p className="text-sm text-gray-600 text-center max-w-xs">
                {demoSteps[currentStep].description}
              </p>
            </div>
          </div>

          {/* Animated Elements */}
          <div className="absolute top-4 left-4 w-16 h-2 bg-gray-300 rounded animate-pulse"></div>
          <div className="absolute top-8 left-4 w-24 h-2 bg-gray-200 rounded animate-pulse delay-100"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-blue-500 animate-bounce" />
          </div>

          {/* Progress Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentStep ? "bg-blue-500" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-2xl">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">智能識別</span>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">自動操作</span>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">數據提取</span>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">一鍵完成</span>
      </div>
    </div>
  );
};