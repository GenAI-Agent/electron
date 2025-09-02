import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Building, BarChart3, User, LogOut, MessageCircle, Hash, AtSign, Plane, ShoppingCart, Vote, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import Header, { ViewMode } from '@/components/ui/header';
import { LensOSLogo } from '@/components/animation/LensLogo';
import { cn } from '@/utils/cn';
import { RainbowButton } from '@/components/animation/RainbowButton';
import AuthManager, { AuthStatus } from '@/utils/authManager';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageStore } from '@/stores/languageStore';
import { translations } from '@/translations';
import { ModernFeatureSection } from '@/components/ModernFeatureSection';
import { BentoFeatureSection } from '@/components/BentoFeatureSection';
import { LogoLoop } from '@/components/animation/LogoLoop';
import LightRays from '@/components/animation/LightRay';
import RotatingText from '@/components/animation/RotatingText';
import DemoSection from "@/components/demos/DemoSection";

const HomePage: React.FC = () => {
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
      console.log('HomePage - Setting selectedTag to:', newIndex, 'Tag:', tagContent[newIndex]?.tagText);
      setSelectedTag(newIndex);
      // End transition after fade in completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  };

  const tagContent = [
    {
      title: '打開網頁',
      tagText: 'Webpage',
      icon: Globe,
      mainText: 'Open Webpage → AGI',
      subText: 'DM as Service - 輸入需求，AI 即時生成內容與頁面，零代碼全智能',
      gifUrl: '/placeholder-browser.gif',
      path: '/browser?url=https://www.google.com',
    },
    {
      title: '打開桌面',
      tagText: 'Desktop',
      icon: Monitor,
      mainText: 'Open Desktop → AGI',
      subText: 'Open Agent 直接驅動企業現有網站與 SaaS，將所有功能轉化為 AGI 能力',
      gifUrl: '/placeholder-desktop.gif',
      path: '/local',
    },
    {
      title: '打開 SaaS',
      tagText: 'SaaS',
      icon: Building,
      mainText: 'Open SaaS → AGI',
      subText: '用 AI 打開 SaaS 系統，將你的 CRM、ERP、BI 全面導入 Supervisor Agent',
      gifUrl: '/placeholder-saas.gif',
      path: '/browser?url=https://www.taaze.ai/business-intelligent',
    },
    {
      title: 'AI沙盒',
      tagText: 'Lens Sandbox',
      icon: BarChart3,
      mainText: 'Lens Sandbox',
      subText: '針對目標深度研究，Multi-Agent 模擬生成 Action Task\n從分析報告到執行方案，每個沙盒專注一個 Target',
      gifUrl: '/placeholder-sandbox.gif',
      path: '/sandbox',
    },
  ];

  const features = [
    {
      icon: MessageCircle,
      title: language === 'zh' ? 'DM as Service' : 'DM as Service',
      description: language === 'zh'
        ? '像使用任何通訊軟體一樣，只要 DM Supervisor Agent，Agent 就會幫你 Take Actions。比如 DM「華航旅遊規劃」，Agent 就會在華航 domain 下搜尋規劃並直接找到訂票頁面。'
        : 'Just like using any messaging app, simply DM the Supervisor Agent and it will Take Actions for you. For example, DM "China Airlines travel planning" and the Agent will search and plan within the China Airlines domain, directly finding the booking page.',
      points: [
        {
          title: language === 'zh' ? '專屬的個人體驗' : 'Personalized Experience',
          text: language === 'zh'
            ? '每個用戶看到的內容都不一樣，不是模板化的頁面，而是根據他的背景和需求特別製作。'
            : 'Every user sees different content, not templated pages, but specially crafted based on their background and needs.'
        },
        {
          title: language === 'zh' ? '智能適配' : 'Smart Adaptation',
          text: language === 'zh'
            ? '不需要手動設定，系統自動分析用戶的职業、行業、需求，推導最適合的內容和功能。'
            : 'No manual setup needed, the system automatically analyzes user profession, industry, needs, and delivers the most suitable content and features.'
        },
        {
          title: language === 'zh' ? '實時調整' : 'Real-time Adjustment',
          text: language === 'zh'
            ? '随用戶不斷使用，系統持續學習和優化，提供越來越精準的服務。'
            : 'As users continue using, the system continuously learns and optimizes, providing increasingly precise services.'
        }
      ]
    },
    {
      icon: Hash,
      title: language === 'zh' ? 'Slash for Talent (/)' : 'Slash for Talent (/)',
      description: language === 'zh'
        ? '輸入 / 即可啟動各種 Talent 功能。每個 Talent 都是一個專業能力，就像你的專家團隊一樣，隨時可供呼叫。這就是我們的 Rules 精神。'
        : 'Type / to activate various Talent functions. Each Talent is a professional capability, like your expert team, always available on demand. This is the essence of our Rules system.',
      points: [
        {
          title: language === 'zh' ? '專業 Talent 庫' : 'Professional Talent Library',
          text: language === 'zh'
            ? '從資料分析、內容生成到自動化流程，每個 Talent 都是領域專家級的能力。不需訓練，直接使用。'
            : 'From data analysis and content generation to automation workflows, each Talent is domain-expert level capability. No training required, use immediately.'
        },
        {
          title: language === 'zh' ? '快速功能啟動' : 'Quick Function Activation',
          text: language === 'zh'
            ? '像使用 Slack 指令一樣簡單，/ + 功能名稱即可啟動。直覺的介面，零學習成本。'
            : 'Simple as using Slack commands, / + function name to activate. Intuitive interface with zero learning curve.'
        },
        {
          title: language === 'zh' ? '客製化 Talent' : 'Customizable Talents',
          text: language === 'zh'
            ? '根據企業需求定製專屬 Talent，從通用能力到行業專精，無限擴展可能。'
            : 'Customize exclusive Talents based on enterprise needs, from general capabilities to industry specialization, unlimited expansion possibilities.'
        }
      ]
    },
    {
      icon: AtSign,
      title: language === 'zh' ? 'AT for Connect (@)' : 'AT for Connect (@)',
      description: language === 'zh'
        ? '只要輸入 @ 就可以與任何網頁資料做 Connect。無需 API 整合，無需權限申請，直接連接任何系統，讓所有資訊成為 AI 的 Context。'
        : 'Simply type @ to Connect with any webpage data. No API integration, no permission requests needed, directly connect to any system and make all information AI Context.',
      points: [
        {
          title: language === 'zh' ? '無需 API 整合' : 'No API Integration Required',
          text: language === 'zh'
            ? '省去複雜的 API 整合流程，直接讀取網頁內容。從 Excel 到 CRM，從 ERP 到社群媒體，一次連接所有。'
            : 'Skip complex API integration processes, directly read webpage content. From Excel to CRM, from ERP to social media, connect everything at once.'
        },
        {
          title: language === 'zh' ? '即時資料同步' : 'Real-time Data Sync',
          text: language === 'zh'
            ? '資料更新即時同步，無需擔心資訊時效性。AI 始終使用最新、最準確的資料進行判斷。'
            : 'Data updates sync in real-time, no need to worry about information timeliness. AI always uses the latest and most accurate data for decisions.'
        },
        {
          title: language === 'zh' ? '全域情境感知' : 'Global Context Awareness',
          text: language === 'zh'
            ? '打破系統間的壁壘，讓 AI 擁有全域視野。一個 Agent，理解所有系統，做出更智能的決策。'
            : 'Break down barriers between systems, give AI a global perspective. One Agent understands all systems, making smarter decisions.'
        }
      ]
    }
  ];

  const scaniorLogos = [
    {
      node: (
        <button
          onClick={() => router.push('/cal')}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-background to-background/95 backdrop-blur-sm border border-border/40 hover:border-border hover:shadow-lg transition-all duration-500 ease-out cursor-pointer overflow-hidden"
        >
          {/* Subtle hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Icon container */}
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
            <Plane className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Text */}
          <span className="relative font-medium text-foreground">華航</span>

          {/* Hover indicator line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
      )
    },
    {
      node: (
        <button
          onClick={() => router.push('/election')}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-background to-background/95 backdrop-blur-sm border border-border/40 hover:border-border hover:shadow-lg transition-all duration-500 ease-out cursor-pointer overflow-hidden"
        >
          {/* Subtle hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Icon container */}
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center shadow-sm">
            <Vote className="w-5 h-5 text-zinc-600 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Text */}
          <span className="relative font-medium text-foreground">選舉</span>

          {/* Hover indicator line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
      )
    },
    {
      node: (
        <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 backdrop-blur-sm border border-dashed border-border/40 opacity-50 cursor-not-allowed">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-gray-400" />
          </div>
          <span className="font-medium text-muted-foreground">電商</span>
        </div>
      )
    },
    {
      node: (
        <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 backdrop-blur-sm border border-dashed border-border/40 opacity-50 cursor-not-allowed">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-gray-400" />
          </div>
          <span className="font-medium text-muted-foreground">企業</span>
        </div>
      )
    },
    // {
    //   node: (
    //     <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 backdrop-blur-sm border border-dashed border-border/40 opacity-50 cursor-not-allowed">
    //       <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
    //         <HeartHandshake className="w-5 h-5 text-gray-400" />
    //       </div>
    //       <span className="font-medium text-muted-foreground">醫療</span>
    //     </div>
    //   )
    // },
    {
      node: (
        <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 backdrop-blur-sm border border-dashed border-border/40 opacity-50 cursor-not-allowed">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <span className="font-medium text-muted-foreground">金融</span>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen w-full flex flex-col bg-background overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <Header
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
      <section className="relative min-h-screen flex flex-col pt-20">
        <div className="absolute top-10 inset-0 w-full z-1 h-full">
          <LightRays
            raysOrigin="top-center"
            raysColor="#000000"
            raysSpeed={0.5}
            lightSpread={1}
            rayLength={0.5}
            pulsating={false}
            fadeDistance={0.1}
            saturation={1}
            noiseAmount={0.3}
            distortion={0.2}
          />
        </div>
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full">
          {/* LensOS Logo and Text */}
          <div className="mb-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <LensOSLogo size={100} />
              <h1 className="text-2xl bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">LensOS</h1>
            </div>
          </div>
          <div className="text-center mb-4 px-6 min-h-[200px]">
            <h1 className="text-4xl uppercase md:text-5xl font-serif text-foreground mb-6 leading-tight">
              Open → AGI <br />Transform Everything You Own
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              免標註、免格式化，資料原樣也能推理
            </p>
          </div>
        </div>
        <div className='flex items-center w-full transition-all duration-300 mb-6 gap-2 mx-auto justify-center'>
          <h2 className='text-4xl transition-all duration-300 md:text-5xl font-serif text-muted-foreground'>
            OPEN
          </h2>
          <div className="text-left transition-all bg-primary/20 rounded-lg p-2 duration-300">
            <RotatingText
              texts={['Webpage', 'Desktop', 'SaaS', 'Sandbox']}
              className="text-4xl flex flex-shrink-0 text-nowrap md:text-5xl font-serif text-primary"
              rotationInterval={4000}
              staggerDuration={0.05}
            />
          </div>
        </div>
        <DemoSection isTransitioning={isTransitioning} selectedTag={selectedTag} tagContent={tagContent} handleTagChange={handleTagChange} />
        {/* Company Carousel Section */}
        <div className="border-t border-border/50 bg-muted/30">
          <div className="py-12">
            <p className="text-center text-xs tracking-widest text-muted-foreground/60 mb-6">
              查看實際案例
            </p>
            <LogoLoop
              logos={scaniorLogos}
              speed={30}
              logoHeight={32}
              gap={32}
              fadeOut={true}
              className="text-muted-foreground max-w-[1000px] mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Feature Sections - 混合設計 */}
      {features.map((feature, featureIndex) => {
        // 第一個 section 使用 ModernFeatureSection，其餘使用 BentoFeatureSection
        const FeatureComponent = featureIndex === 0 ? ModernFeatureSection : BentoFeatureSection;
        const reverse = featureIndex === 1;

        return (
          <FeatureComponent
            key={featureIndex}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            points={feature.points}
            index={featureIndex}
            reverse={reverse}
            cta={
              featureIndex === 0 ? {
                text: t.seeOurProduct,
                onClick: () => router.push('/browser?url=https://www.ask-lens.ai/products')
              } : featureIndex === 1 ? {
                text: t.tryOurPlatform,
                onClick: () => router.push('/sandbox')
              } : undefined
            }
          />
        );
      })}
    </div>
  );
};

export default HomePage;
