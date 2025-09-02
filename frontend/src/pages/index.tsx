import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Building, BarChart3, User, LogOut, MessageCircle, Hash, AtSign, Plane, ShoppingCart, Vote, Briefcase, TrendingUp, ArrowRight, Zap, Sparkles, Target } from 'lucide-react';
import { BsArrowRightSquareFill } from "react-icons/bs";
import { useRouter } from 'next/router';
import Header, { ViewMode } from '@/components/ui/header';
import { LensOSLogo } from '@/components/animation/LensLogo';
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
      icon: Zap,
      title: language === 'zh' ? 'DM as Service' : 'DM as Service',
      description: language === 'zh'
        ? '像使用任何通訊軟體一樣，即開即用。\n只要 DM Supervisor Agent，Agent 直接為你做到任何服務\nOpen →  AGI'
        : 'Just like using any messaging app, DM the Supervisor Agent and it will take actions for you. For example, DM \"China Airlines travel planning\" and the Agent will search and plan within the China Airlines domain, directly finding the booking page.',
      points: [
        {
          title: language === 'zh' ? '現有系統即刻AGI化' : 'Instant AGI-fication of Existing Systems',
          text: language === 'zh'
            ? 'LensOS 直接驅動你的網站、系統。\n不用學新工具，讓 AGI 直接操控你現有的每個系統。'
            : 'LensOS directly drives your websites, systems. No need to learn new tools, AGI directly controls every existing system you have.'
        },
        {
          title: language === 'zh' ? '一開機就有 AGI' : 'AGI Ready from Boot',
          text: language === 'zh'
            ? '不用等待部署、不用複雜設定。打開 LensOS，企業立刻擁有完整的 AGI 能力。'
            : 'No waiting for deployment, no complex setup. Open LensOS and your enterprise immediately has complete AGI capabilities.'
        },
        {
          title: language === 'zh' ? '直說需求，跳過複雜操作' : 'Tell Your Need, Skip Complex Navigation',
          text: language === 'zh'
            ? '不用翻找選單、不用記住複雜的操作路徑。\n直接告訴 Agent 你要什麼，它自動找到正確功能並完成。'
            : 'No need to navigate menus or remember complex operation paths. Simply tell the Agent what you want, it automatically finds the right function and completes it.'
        }
      ]
    },
    {
      icon: Sparkles,
      title: language === 'zh' ? 'Agentic Generation' : 'Agentic Generation',
      description: language === 'zh'
        ? '用戶只要DM需求，系統完全自主生成專屬內容和UI。\n行銷團隊設定好Rules，每個用戶都能收到為他量身打造的頁面和體驗。不是模板，是真正的 Agentic Generation。'
        : 'Users just DM their needs, system autonomously generates personalized content and UI. Marketing teams set Rules, every user receives truly customized pages and experiences. Not templates, but genuine custom generation.',
      points: [
        {
          title: language === 'zh' ? '為每個客戶量身打造' : 'Tailored for Every Customer',
          text: language === 'zh'
            ? '每個客戶看到完全不同的頁面。系統根據客戶背景、需求、行為自主生成專屬內容。不只是推薦，是重新創造。'
            : 'Every customer sees completely different pages. System autonomously generates exclusive content based on customer background, needs, and behavior. Not just recommendations, but recreation.'
        },
        {
          title: language === 'zh' ? 'Rules驅動的創造力' : 'Rules-Driven Creativity',
          text: language === 'zh'
            ? '行銷設定策略Rules，Agent自主判斷並生成。從文案到設計，從流程到功能，完全按照用戶需求重新組合。'
            : 'Marketing sets strategic Rules, Agent autonomously judges and generates. From copy to design, from processes to features, completely recombined according to user needs.'
        },
        {
          title: language === 'zh' ? '即時適應進化' : 'Real-time Adaptive Evolution',
          text: language === 'zh'
            ? '不只生成一次，而是持續觀察用戶反應，即時調整內容和介面。每次互動都讓體驗更精準。'
            : 'Not just one-time generation, but continuous observation of user reactions, real-time content and interface adjustments. Every interaction makes the experience more precise.'
        }
      ]
    },
    {
      icon: Target,
      title: language === 'zh' ? 'Sandbox Intelligence' : 'Sandbox Intelligence',
      description: language === 'zh'
        ? '建立專屬沙盒，讓多個Agent在虛擬環境中模擬真實情境。\n沙盒收集所有相關情報作為Context，支援策略推演和決策模擬。不只是分析，是預演未來。'
        : 'Create dedicated sandboxes where multiple Agents simulate real scenarios in virtual environments. Sandbox collects all relevant intelligence as Context, supporting strategic deduction and decision simulation. Not just analysis, but rehearsing the future.',
      points: [
        {
          title: language === 'zh' ? 'Multi-Agent 情境模擬' : 'Multi-Agent Scenario Simulation',
          text: language === 'zh'
            ? '不同角色的Agent在沙盒中模擬真實互動。從市場競爭到內部協作，從客戶反應到供應鏈變化，全面預演。'
            : 'Different role Agents simulate real interactions in sandbox. From market competition to internal collaboration, from customer reactions to supply chain changes, comprehensive rehearsal.'
        },
        {
          title: language === 'zh' ? 'Context 驅動的推演' : 'Context-Driven Deduction',
          text: language === 'zh'
            ? '沙盒自動收集所有相關資訊作為推演基礎。從產業報告到競爭動態，從內部數據到外部趨勢，形成完整情報網。'
            : 'Sandbox automatically collects all relevant information as deduction foundation. From industry reports to competitive dynamics, from internal data to external trends, forming complete intelligence network.'
        },
        {
          title: language === 'zh' ? '策略方案自動生成' : 'Strategic Solution Auto-Generation',
          text: language === 'zh'
            ? '基於模擬結果，系統自動產生可執行的行動方案。不只告訴你會發生什麼，還告訴你該怎麼做。'
            : 'Based on simulation results, system automatically generates executable action plans. Not just telling you what will happen, but what you should do.'
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
            title={feature.title as string}
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
