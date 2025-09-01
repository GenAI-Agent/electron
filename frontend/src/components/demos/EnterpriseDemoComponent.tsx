import React, { useState, useEffect } from 'react';
import { Building, Database, Link, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EnterpriseDemoComponentProps {
  className?: string;
}

export const EnterpriseDemoComponent: React.FC<EnterpriseDemoComponentProps> = ({ className }) => {
  const [currentSystem, setCurrentSystem] = useState(0);
  const [connectedSystems, setConnectedSystems] = useState<number[]>([]);
  const [dataFlowActive, setDataFlowActive] = useState(false);

  const enterpriseSystems = [
    {
      name: "CRM 系統",
      icon: "🏢",
      status: "connected",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-200"
    },
    {
      name: "ERP 系統",
      icon: "📊",
      status: "syncing",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-200"
    },
    {
      name: "數據倉庫",
      icon: "💾",
      status: "processing",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-200"
    },
    {
      name: "BI 分析",
      icon: "📈",
      status: "ready",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-200"
    }
  ];

  const businessRules = [
    "客戶資料同步規則",
    "訂單處理自動化",
    "庫存管理規則",
    "報告生成排程"
  ];

  useEffect(() => {
    const systemInterval = setInterval(() => {
      setCurrentSystem((prev) => (prev + 1) % enterpriseSystems.length);
    }, 2500);

    const connectionInterval = setInterval(() => {
      setConnectedSystems(prev => {
        if (prev.length >= enterpriseSystems.length) {
          return [0];
        }
        return [...prev, prev.length];
      });
    }, 1000);

    const dataFlowInterval = setInterval(() => {
      setDataFlowActive(prev => !prev);
    }, 3000);

    return () => {
      clearInterval(systemInterval);
      clearInterval(connectionInterval);
      clearInterval(dataFlowInterval);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-purple-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className={cn("w-full h-full p-6", className)}>
      {/* Enterprise Dashboard Mockup */}
      <div className="w-full h-full min-h-[500px] flex flex-col">
        <div className="flex-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Dashboard Header */}
          <div className="bg-primary text-white px-4 py-2 ">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-medium">LensOS Enterprise SaaS</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 flex-1">
            {/* Left Panel - System Integration */}
            <div className="bg-gray-50 border-r border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Link className="w-4 h-4" />
                系統連接
              </h4>
              <div className="space-y-3">
                {enterpriseSystems.map((system, index) => (
                  <div
                    key={index}
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all duration-500",
                      connectedSystems.includes(index)
                        ? `${system.bgColor} ${system.borderColor} scale-105`
                        : "bg-white border-gray-200",
                      index === currentSystem && "ring-2 ring-blue-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{system.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{system.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{system.status}</p>
                      </div>
                      {getStatusIcon(system.status)}
                    </div>

                    {/* Data Flow Animation */}
                    {connectedSystems.includes(index) && dataFlowActive && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Panel - Data Flow Visualization */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex flex-col items-center justify-center">
              <div className="relative">
                {/* Central Hub */}
                <div className="w-20 h-20 bg-white rounded-full shadow-lg border-4 border-blue-500 flex items-center justify-center mb-6">
                  <Database className="w-8 h-8 text-blue-600" />
                </div>

                {/* Animated Rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn(
                    "w-32 h-32 rounded-full border-2 border-blue-300 opacity-30 transition-all duration-1000",
                    dataFlowActive ? "scale-150 opacity-0" : "scale-100 opacity-30"
                  )}></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn(
                    "w-40 h-40 rounded-full border-2 border-purple-300 opacity-20 transition-all duration-1000 delay-300",
                    dataFlowActive ? "scale-150 opacity-0" : "scale-100 opacity-20"
                  )}></div>
                </div>

                {/* Data Points */}
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute w-3 h-3 bg-blue-500 rounded-full transition-all duration-500",
                      `rotate-${i * 90} translate-y-16`,
                      dataFlowActive ? "scale-150 opacity-100" : "scale-75 opacity-60"
                    )}
                    style={{
                      transform: `rotate(${i * 90}deg) translateY(-4rem)`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  ></div>
                ))}
              </div>

              <p className="text-sm text-gray-600 text-center mt-4">
                實時數據同步與處理
              </p>
            </div>

            {/* Right Panel - Business Rules */}
            <div className="bg-white border-l border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                業務規則
              </h4>
              <div className="space-y-3">
                {businessRules.map((rule, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-500",
                      index <= Math.floor(connectedSystems.length * 0.8)
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        index <= Math.floor(connectedSystems.length * 0.8)
                          ? "bg-green-500 animate-pulse"
                          : "bg-gray-300"
                      )}></div>
                      <p className="text-sm text-gray-700">{rule}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance Stats */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-xs font-semibold text-blue-800 mb-2">處理效率</h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">數據同步</span>
                    <span className="text-green-600 font-medium">99.9%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">處理速度</span>
                    <span className="text-blue-600 font-medium">10K/秒</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">系統負載</span>
                    <span className="text-orange-600 font-medium">35%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">系統集成</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">實時同步</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">業務規則</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">智能分析</span>
        </div>
      </div>
    </div>
  );
};