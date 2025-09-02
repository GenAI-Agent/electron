import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Building, BarChart3, User, LogOut, Plane, TrendingUp, ArrowRight } from 'lucide-react';
import TrueFocus from '@/components/animation/TrueFocus';
import { useRouter } from 'next/router';
import Header, { ViewMode } from '@/components/ui/header';
import { RainbowButton } from '@/components/animation/RainbowButton';
import { cn } from '@/utils/cn';
import AuthManager, { AuthStatus } from '@/utils/authManager';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageStore } from '@/stores/languageStore';
import { translations } from '@/translations';
import websiteScreenshot from '@/pages/cal/website.png';
import desktopScreenshot from '@/pages/cal/desktop.png';
import saasScreenshot from '@/pages/cal/saas.png';
import sandboxScreenshot from '@/pages/cal/sandbox.png';
import Image from 'next/image';


const ChinaAirlinesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');
  const [selectedTag, setSelectedTag] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = translations[language as 'zh' | 'en'];

  // 初始化認證狀態
  useEffect(() => {
    const authManager = AuthManager.getInstance();

    // 檢查初始認證狀態
    authManager.checkAuthStatus().then(setAuthStatus);

    // 監聽認證狀態變化
    const unsubscribe = authManager.onAuthStatusChange(setAuthStatus);

    return unsubscribe;
  }, []);

  // 處理登陸
  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const authManager = AuthManager.getInstance();
      const success = await authManager.startOAuthFlow();
      if (!success) {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 處理登出
  const handleLogout = async () => {
    const authManager = AuthManager.getInstance();
    await authManager.logout();
  };

  const handleTagChange = (newIndex: number) => {
    console.log('HomePage - handleTagChange called with index:', newIndex, 'Current selectedTag:', selectedTag);
    if (newIndex === selectedTag) return;

    setIsTransitioning(true);

    // Start fade out
    setTimeout(() => {
      console.log('ChinaAirlinesPage - Setting selectedTag to:', newIndex, 'Tag:', chinaAirlinesContent[newIndex]?.tagText);
      setSelectedTag(newIndex);
      // End transition after fade in completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  };

  const goExperience = () => {
    switch (selectedTag) {
      case 0:
        router.push('/browser?url=https://www.china-airlines.com');
        break;
      case 1:
        router.push('/local');
        break;
      case 2:
        router.push('/');
        break;
      case 3:
        router.push('/cal/sandbox-marketing');
        break;
    }
  };

  const chinaAirlinesContent = [
    {
      title: '華航官網',
      tagText: 'Webpage',
      icon: Globe,
      mainText: '即插即用 華航AGI',
      subText: '華航無需改變任何系統，直接成為 AGI 的一部分。\n用戶 DM Agent，即時在華航環境中查詢航班、規劃行程，甚至完成訂票。\n華航的一切功能都可直接為AGI所用',
      demoContent: {
        type: 'webpage',
        data: {
          sections: ['即時航班查詢', '行程規劃', '一鍵比價訂票', 'VIP 會員服務'],
          aiCapabilities: [
            '「幫我查明天台北到東京的航班」- AI 即時搜尋並比較所有選項',
            '「安排一個5天東京行程，包含商務艙」- 自動規劃並預算',
            '「我要改簽下週的航班」- 智能處理變更需求',
            '「查詢我的哩程狀況和可兌換獎項」- 個人化會員服務'
          ]
        }
      }
    },
    {
      title: '桌面系統',
      tagText: 'Desktop',
      icon: Monitor,
      mainText: '企業級智能工作流',
      subText: 'LensOS 直接整合華航內部所有桌面系統，無需改變現有工作流程。Supervisor Agent 理解每個系統的邏輯，透過規則引擎自動化複雜業務流程，實現真正的企業級 AGI 體驗。',
      demoContent: {
        type: 'desktop',
        data: {
          systems: ['航班調度中心', '客服工單系統', '維修管理平台', '員工績效系統'],
          automationRules: [
            '當天氣影響航班時，自動重新調度並通知乘客',
            '客訴案件自動分類並指派給適當專員處理',
            '維修預警觸發時，自動安排備用機材和人力',
            '績效數據異常時，主動分析原因並建議改善'
          ]
        }
      }
    },
    {
      title: 'SaaS 整合',
      tagText: 'SaaS',
      icon: Building,
      mainText: '打破資料孤島的統一智能',
      subText: 'LensOS 革命性地消除了系統間的界限。不需要昂貴的 API 整合，Supervisor Agent 直接理解 Salesforce、SAP、財務系統的所有資料，實現跨平台的智能決策和自動化執行。',
      demoContent: {
        type: 'saas',
        data: {
          platforms: ['Salesforce 客戶關係', 'SAP 營運管理', 'Oracle 財務系統', 'Workday 人資平台'],
          crossPlatformAI: [
            '客戶投訴 → 自動查詢訂單歷史 → 計算補償方案 → 更新 CRM',
            '財務預警 → 分析營運數據 → 調整資源配置 → 通知管理層',
            '員工請假 → 檢查航班安排 → 自動調度替代人力 → 更新排班',
            '市場變化 → 預測需求影響 → 調整定價策略 → 同步各系統'
          ]
        }
      }
    },
    {
      title: '智能沙盒',
      tagText: 'Lens Sandbox',
      icon: BarChart3,
      mainText: '未來決策的模擬實驗室',
      subText: 'Lens Sandbox 讓華航在虛擬環境中測試各種策略。\n透過 AI 模擬市場反應、競爭對手動態、旅客行為。\nSupervisor Agent 提供數據驅動的決策建議，讓每個重大決定都經過科學驗證。',
      demoContent: {
        type: 'sandbox',
        data: {
          scenarios: ['新航線市場評估', '動態定價策略優化', '競爭對手反應預測', '危機應對方案演練'],
          aiPredictions: [
            '台北-大阪新航線：預測首年載客率78%，ROI 達125%',
            '淡季促銷策略：建議降價15%可提升需求32%',
            '長榮降價應對：模擬三種反制策略的市場影響',
            '疫情重現情境：預演應變措施，最小化營運損失'
          ]
        }
      }
    },
  ];


  return (
    <div className="min-h-screen w-full flex flex-col bg-background overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <Header
        title='華航 x LensOS'
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        rightContent={
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <LanguageToggle />

            {!authStatus.isAuthenticated ? (
              <button
                className="relative inline-flex h-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                onClick={handleLogin}
                disabled={isAuthLoading}
              >
                {isAuthLoading ? (
                  <>
                    <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full mr-2" />
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 mr-2" />
                    {t.lensAuth}
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {/* User Info */}
                <div className="flex items-center gap-2">
                  {authStatus.userInfo?.picture && (
                    <img
                      src={authStatus.userInfo.picture}
                      alt={authStatus.userInfo.name || 'User'}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {(() => {
                        const firstName = authStatus.userInfo?.name.split(' ')[0] || 'Unknown User';
                        return firstName.length > 5 ? firstName.slice(0, 5) + '...' : firstName;
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {authStatus.userInfo?.email.split('@')[0]}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  className="relative inline-flex h-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  onClick={handleLogout}
                  title={t.logout}
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* Content overlay */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  華航 x LensOS
                </h1>
              </div>
            </div>
          </div>

          {/* TrueFocus Tabs Section */}
          <div className="flex justify-center mb-10">
            <TrueFocus
              sentence={chinaAirlinesContent.map(item => item.tagText).join('|')}
              manualMode={true}
              blurAmount={2}
              // borderColor="#2563eb"
              glowColor="rgba(37, 99, 235, 0.6)"
              animationDuration={0.4}
              selectedIndex={selectedTag}
              onWordSelect={handleTagChange}
            />
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-2 gap-8 items-start my-6">
            {/* Left: Demo Content - Screenshots moved here */}
            <div className=''>
              <div
                className={cn(
                  "transition-opacity duration-300",
                  isTransitioning ? "opacity-0" : "opacity-100"
                )}
              >
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  {chinaAirlinesContent[selectedTag]?.mainText}
                </h2>
                <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed mb-6">
                  {chinaAirlinesContent[selectedTag]?.subText}
                </p>
              </div>

              <RainbowButton
                onClick={goExperience}
                className="inline-flex"
              >
                <span className="flex items-center gap-2">
                  開始華航 AGI
                  <ArrowRight className="w-4 h-4" />
                </span>
              </RainbowButton>

              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl mt-8 p-6 shadow-lg">
                <div
                  className={cn(
                    "transition-opacity duration-300",
                    isTransitioning ? "opacity-0" : "opacity-100"
                  )}
                >

                  {/* Dynamic content based on selected tab */}
                  {selectedTag === 0 && chinaAirlinesContent[0] && (
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
                      <Image src={websiteScreenshot} alt="華航官網截圖" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {selectedTag === 1 && chinaAirlinesContent[1] && (
                    <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Image src={desktopScreenshot} alt="華航內部系統截圖" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {selectedTag === 2 && chinaAirlinesContent[2] && (
                    <div className="aspect-video bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center">
                      <Image src={saasScreenshot} alt="SaaS 系統整合截圖" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {selectedTag === 3 && chinaAirlinesContent[3] && (
                    <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-dashed border-orange-300 flex items-center justify-center">
                      <Image src={sandboxScreenshot} alt="策略沙盒模擬截圖" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Data Section - moved from right side */}
            <div className="space-y-6">
              {selectedTag === 0 && chinaAirlinesContent[0] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground">Multi-Agent 協作</h4>
                  <div className="space-y-3">
                    {chinaAirlinesContent[0].demoContent.data.sections?.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">{section}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-foreground mb-4">華航 x DM x AGI</h4>
                    <div className="space-y-3">
                      {chinaAirlinesContent[0].demoContent.data.aiCapabilities?.map((capability, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-500">
                          <span className="text-sm text-gray-700 font-medium">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTag === 1 && chinaAirlinesContent[1] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">企業級系統整合</h4>
                  <div className="space-y-3">
                    {chinaAirlinesContent[1].demoContent.data.systems?.map((system, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          <span className="text-sm font-medium">{system}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">智能自動化規則</h4>
                    <div className="space-y-3">
                      {chinaAirlinesContent[1].demoContent.data.automationRules?.map((rule, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-gray-200 to-slate-200 rounded-lg border-l-4 border-gray-500">
                          <span className="text-sm text-gray-700 font-medium">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTag === 2 && chinaAirlinesContent[2] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">跨平台 SaaS 統一</h4>
                  <div className="space-y-3">
                    {chinaAirlinesContent[2].demoContent.data.platforms?.map((platform, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-sm font-medium">{platform}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">跨系統智能工作流</h4>
                    <div className="space-y-3">
                      {chinaAirlinesContent[2].demoContent.data.crossPlatformAI?.map((workflow, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
                          <span className="text-sm text-gray-700 font-medium">{workflow}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTag === 3 && chinaAirlinesContent[3] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">策略模擬場景</h4>
                  <div className="space-y-3">
                    {chinaAirlinesContent[3].demoContent.data.scenarios?.map((scenario, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-sm font-medium">{scenario}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">重大事件預演</h4>
                    <div className="space-y-3">
                      {chinaAirlinesContent[3].demoContent.data.aiPredictions?.map((prediction, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-l-4 border-orange-500">
                          <span className="text-sm text-gray-700 font-medium">{prediction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div> {/* End of content overlay */}
      </section >
    </div >
  );
};

export default ChinaAirlinesPage;
