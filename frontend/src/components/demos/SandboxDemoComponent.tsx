import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, Target, Users, MessageSquare, FileText, Twitter, X } from 'lucide-react';
import { cn } from '@/utils/cn';

// Add custom CSS for animations
const animationStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.5s ease-out forwards;
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;

interface SandboxDemoComponentProps {
  className?: string;
}

export const SandboxDemoComponent: React.FC<SandboxDemoComponentProps> = ({ className }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);
  const [showDataFlow, setShowDataFlow] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [activeTabDemo, setActiveTabDemo] = useState<'intelligence' | 'warroom' | 'simulation'>('intelligence');

  // Think tanks data sources
  const thinkTanks = [
    { id: 'social', name: '社群智庫', icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500/10', description: '社群媒體輿情追蹤' },
    { id: 'policy', name: '政策智庫', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10', description: '政策議題分析' },
    { id: 'citizen', name: '民意智庫', icon: Users, color: 'text-green-500', bgColor: 'bg-green-500/10', description: '民眾陳情追蹤' },
    { id: 'media', name: '媒體智庫', icon: Twitter, color: 'text-orange-500', bgColor: 'bg-orange-500/10', description: '新聞媒體監測' }
  ];

  // Demo animation steps
  const demoSteps = [
    { phase: 'intro', duration: 2000, description: '智庫資料整合' },
    { phase: 'dataFlow', duration: 3000, description: '數據流入分析' },
    { phase: 'aiAnalysis', duration: 3000, description: 'AI 智能分析' },
    { phase: 'warroom', duration: 2000, description: '作戰室視角' },
    { phase: 'simulation', duration: 2000, description: '兵棋推演' }
  ];

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const runDemoSequence = () => {
      const step = demoSteps[currentStep];

      // Reset states
      setHighlightedSource(null);
      setShowDataFlow(false);
      setShowAIAnalysis(false);

      // Execute step actions
      switch (step.phase) {
        case 'intro':
          // Highlight each think tank sequentially
          const sources = ['social', 'policy', 'citizen', 'media'];
          sources.forEach((source, index) => {
            setTimeout(() => setHighlightedSource(source), index * 400);
          });
          break;

        case 'dataFlow':
          setShowDataFlow(true);
          break;

        case 'aiAnalysis':
          setShowAIAnalysis(true);
          break;

        case 'warroom':
          setActiveTabDemo('warroom');
          break;

        case 'simulation':
          setActiveTabDemo('simulation');
          break;
      }

      // Move to next step
      timeoutId = setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % demoSteps.length);
      }, step.duration);
    };

    runDemoSequence();

    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  return (
    <div className={cn("w-full h-full p-4 pb-6", className)}>
      <style>{animationStyles}</style>
      {/* AI Election Sandbox Interface */}
      <div className="w-full h-full min-h-[480px] flex flex-col">
        <div className="flex-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-2">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5" />
              <div>
                <h3 className="text-lg font-medium">Lens Sandbox</h3>
                <p className="text-sm text-primary-foreground/80">智慧選情分析與策略模擬平台</p>
              </div>
            </div>
          </div>

          <div className="flex flex-1">
            {/* Full Panel - Intelligence Page Mockup */}
            <div className="w-full bg-gray-50">
              {(activeTabDemo === 'intelligence' || currentStep < 3) && (
                <div className="h-full flex">
                  {/* Think Tanks List */}
                  <div className="w-64 bg-white border-r border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">智庫中心</h4>
                    <div className="space-y-2">
                      {thinkTanks.map((tank) => (
                        <div
                          key={tank.id}
                          className={cn(
                            "relative p-3 rounded-lg border transition-all duration-500",
                            highlightedSource === tank.id
                              ? `${tank.bgColor} border-current scale-105 shadow-lg`
                              : "bg-gray-50 border-gray-200",
                            showDataFlow && "animate-pulse"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {React.createElement(tank.icon, {
                              className: cn("w-4 h-4", tank.color)
                            })}
                            <span className="text-xs font-medium">{tank.name}</span>
                          </div>
                          <p className="text-xs text-gray-600">{tank.description}</p>

                          {/* Data flow indicator */}
                          {showDataFlow && highlightedSource === tank.id && (
                            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                              <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                            </div>
                          )}

                          {/* Animated data count */}
                          <div className="mt-2 text-xs text-gray-500">
                            資料量: <span className="font-medium">{Math.floor(Math.random() * 20 + 10)}K+</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Demo Animation Area */}
                  <div className="flex-1 p-6 relative overflow-hidden">
                    <div className="h-full flex flex-col items-center justify-center">
                      {/* Current Step Indicator */}
                      <div className="absolute top-4 right-4">
                        <div className="text-xs text-gray-500">
                          第 {currentStep + 1} / {demoSteps.length} 步
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 mt-1">
                          {demoSteps[currentStep].description}
                        </h3>
                      </div>

                      {/* Data Flow Visualization */}
                      {showDataFlow && (
                        <div className="relative">
                          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center animate-pulse">
                            <Brain className="w-20 h-20 text-purple-600" />
                          </div>

                          {/* Animated data streams */}
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="absolute w-3 h-3 bg-blue-500 rounded-full animate-ping"
                              style={{
                                top: `${50 + 40 * Math.sin((i * Math.PI) / 2)}%`,
                                left: `${50 + 40 * Math.cos((i * Math.PI) / 2)}%`,
                                animationDelay: `${i * 0.2}s`
                              }}
                            />
                          ))}

                          <p className="text-center mt-4 text-sm text-gray-600">
                            整合多元智庫資料...
                          </p>
                        </div>
                      )}

                      {/* Default State */}
                      {currentStep === 0 && (
                        <div className="text-center">
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            {thinkTanks.slice(0, 4).map((tank, idx) => (
                              <div
                                key={tank.id}
                                className={cn(
                                  "p-4 rounded-lg transition-all duration-500",
                                  highlightedSource === tank.id
                                    ? `${tank.bgColor} scale-110 shadow-lg`
                                    : "bg-gray-100"
                                )}
                              >
                                {React.createElement(tank.icon, {
                                  className: cn("w-8 h-8 mx-auto", tank.color)
                                })}
                              </div>
                            ))}
                          </div>
                          <p className="text-gray-600 text-sm">智庫資料整合中...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTabDemo === 'warroom' && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">作戰室</p>
                    <p className="text-gray-500 text-xs mt-1">即時戰情分析與決策中心</p>
                  </div>
                </div>
              )}

              {activeTabDemo === 'simulation' && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">兵棋推演</p>
                    <p className="text-gray-500 text-xs mt-1">策略模擬與情境分析</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Demo Tabs */}
          <div className="absolute bottom-0 left-0 flex items-center bg-gray-200">
            {/* Static Tabs */}
            <div className="flex">
              {[
                { id: 'intelligence', label: '情報中心', icon: Brain },
                { id: 'warroom', label: '作戰室', icon: Users },
                { id: 'simulation', label: '兵棋推演', icon: Target }
              ].map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    "px-4 py-2 text-xs font-medium transition-all duration-500 relative",
                    activeTabDemo === tab.id
                      ? "bg-primary text-white scale-105"
                      : "text-gray-400 bg-gray-200"
                  )}
                  style={{
                    clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    {React.createElement(tab.icon, { className: "w-3 h-3" })}
                    {tab.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Dynamic Tabs */}
            {showDataFlow && (
              <div className="flex ml-2">
                {thinkTanks.slice(0, 2).map((tank, idx) => (
                  <div
                    key={tank.id}
                    className="px-3 py-2 text-xs font-medium bg-gray-200 text-white relative animate-slideIn"
                    style={{
                      clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
                      animationDelay: `${idx * 0.3}s`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {React.createElement(tank.icon, { className: cn("w-3 h-3", tank.color) })}
                      {tank.name}
                      <X className="w-3 h-3 opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">智庫整合</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">即時分析</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">策略模擬</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">AI 智慧決策</span>
        </div>
      </div>
    </div>
  );
};