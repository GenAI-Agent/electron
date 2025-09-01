import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ShoppingCart, TrendingUp, Vote, Building2, Briefcase, Users, Clock, ChevronRight } from 'lucide-react';
import Header, { ViewMode } from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface BusinessScenario {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming-soon';
  route?: string;
  examples: string[];
}

const SandboxOverviewPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');
  const router = useRouter();

  const businessScenarios: BusinessScenario[] = [
    {
      id: 'election',
      title: '選舉情報分析',
      description: '政治選舉數據分析、民調追蹤、輿情監控和競選策略模擬',
      icon: <Vote className="w-8 h-8" />,
      status: 'available',
      route: '/sandbox-election',
      examples: ['社群媒體輿情分析', '民調數據追蹤', '候選人聲量監控', '選情預測模擬']
    },
    {
      id: 'ecommerce',
      title: '電商智能分析',
      description: '電子商務數據洞察、消費者行為分析、銷售預測和競品監控',
      icon: <ShoppingCart className="w-8 h-8" />,
      status: 'coming-soon',
      examples: ['消費者購買行為分析', '產品銷售趨勢預測', '競品價格監控', '庫存優化建議']
    },
    {
      id: 'marketing',
      title: '行銷策略優化',
      description: '數位行銷效果追蹤、廣告投放優化、用戶轉換分析和ROI監控',
      icon: <TrendingUp className="w-8 h-8" />,
      status: 'available',
      route: '/sandbox-marketing',
      examples: ['用戶行為分析', '策略時間推演', '競爭者情報', '航線市場機會', '會員忠誠計畫']
    },
    {
      id: 'enterprise',
      title: '企業營運智能',
      description: '企業內部數據分析、營運效率優化、風險評估和決策支援',
      icon: <Building2 className="w-8 h-8" />,
      status: 'coming-soon',
      examples: ['營運效率分析', '供應鏈風險評估', '人力資源配置優化', '財務績效監控']
    },
    {
      id: 'consulting',
      title: '顧問諮詢服務',
      description: '商業諮詢數據分析、市場研究、競爭情報和策略規劃支援',
      icon: <Briefcase className="w-8 h-8" />,
      status: 'coming-soon',
      examples: ['市場競爭分析', '行業趨勢研究', '客戶滿意度調查', '商業模式評估']
    },
    {
      id: 'social',
      title: '社會議題研究',
      description: '社會現象分析、公共政策評估、民意調查和社會趨勢預測',
      icon: <Users className="w-8 h-8" />,
      status: 'coming-soon',
      examples: ['社會議題討論分析', '公共政策影響評估', '民意趨勢監控', '社會問題預警']
    }
  ];

  const handleScenarioClick = (scenario: BusinessScenario) => {
    if (scenario.status === 'available' && scenario.route) {
      router.push(scenario.route);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col pt-10 bg-background m-0 p-0">
      {/* Header */}
      <Header
        title="Lens Sandbox 總覽"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col items-center justify-start p-8 space-y-8 overflow-y-auto">
        {/* 主標題和描述 */}
        <div className="text-center mb-8 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Lens Sandbox
          </h1>
          <p className="text-lg text-muted-foreground">
            探索各種商業場景的 AI 分析解決方案，從政治選舉到企業營運，提供全面的數據洞察和智能決策支援
          </p>
        </div>

        {/* Business Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
          {businessScenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className={cn(
                "p-6 cursor-pointer transition-all duration-200 relative overflow-hidden group",
                scenario.status === 'available'
                  ? "hover:shadow-lg hover:scale-105 border-primary/20 hover:border-primary/40"
                  : "opacity-75 hover:shadow-md border-muted/40",
                scenario.status === 'coming-soon' && "bg-muted/10"
              )}
              onClick={() => handleScenarioClick(scenario)}
            >
              {/* Status Badge */}
              {/* {scenario.status === 'coming-soon' && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  即將推出
                </div>
              )} */}

              {/* Available Badge */}
              {scenario.status === 'available' && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                  <ChevronRight className="w-3 h-3" />
                  可用
                </div>
              )}

              {/* Icon */}
              <div className={cn(
                "mb-4 p-3 rounded-lg w-fit",
                scenario.status === 'available'
                  ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                  : "bg-muted/20 text-muted-foreground"
              )}>
                {scenario.icon}
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {scenario.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {scenario.description}
                </p>

                {/* Examples */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    應用場景
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {scenario.examples.map((example, index) => (
                      <div
                        key={index}
                        className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-sm"
                      >
                        • {example}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                <Button
                  variant={scenario.status === 'available' ? "default" : "secondary"}
                  size="sm"
                  disabled={scenario.status === 'coming-soon'}
                  className={cn(
                    "w-full",
                    scenario.status === 'available' && "group-hover:bg-primary/90"
                  )}
                >
                  立即探索
                  {/* {scenario.status === 'available' ? '立即探索' : '敬請期待'} */}
                  {scenario.status === 'available' && <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-muted-foreground text-sm max-w-2xl">
          <p>
            更多商業場景正在開發中。如有特定需求或建議，歡迎透過 AI 助手提供反饋。
          </p>
        </div>
      </div>
    </div>
  );
};

export default SandboxOverviewPage;