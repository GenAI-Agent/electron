import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Building, Brain, BarChart3, ArrowRight, Shield, Zap, Settings, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/router';
import Header, { ViewMode } from '@/components/ui/header';
import { RainbowButton } from '@/components/RainbowButton';
import { LensOSLogo } from '@/components/LensLogo';
import { cn } from '@/utils/cn';
import TrueFocus from '@/components/TrueFocus';
import LightRays from '@/components/LightRay';
import AuthManager, { AuthStatus } from '@/utils/authManager';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageStore } from '@/stores/languageStore';
import { translations } from '@/translations';
import { BrowserDemoComponent } from '@/components/demos/BrowserDemoComponent';
import { DesktopDemoComponent } from '@/components/demos/DesktopDemoComponent';
import { EnterpriseDemoComponent } from '@/components/demos/EnterpriseDemoComponent';
import { SandboxDemoComponent } from '@/components/demos/SandboxDemoComponent';


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
      tagText: 'Website',
      icon: Globe,
      mainText: 'Open Website',
      subText: '點開任意網站即可即時接入 AGI，立即生成 AI 協作 Agent 團隊',
      gifUrl: '/placeholder-browser.gif',
      path: '/browser?url=https://www.google.com',
    },
    {
      title: '打開桌面',
      tagText: 'Desktop',
      icon: Monitor,
      mainText: 'Open Desktop',
      subText: 'LLM 本地化，實現 Edge AI 資料隱私安全，遵守指令的局域網 Agent 工作流',
      gifUrl: '/placeholder-desktop.gif',
      path: '/local',
    },
    {
      title: '打開 SaaS',
      tagText: 'SaaS',
      icon: Building,
      mainText: 'Open SaaS System',
      subText: '用 AI 打開 SaaS 系統，將你的 CRM、ERP、BI 全面導入 Supervisor Agent',
      gifUrl: '/placeholder-saas.gif',
      path: '/browser?url=https://www.taaze.ai/business-intelligent',
    },
    {
      title: 'AI沙盒',
      tagText: 'Lens Sandbox',
      icon: BarChart3,
      mainText: 'AI Sandbox',
      subText: '賽局理論驅動智慧系統，模擬競爭場景、推演策略決策\n電商、行銷、選情或各種商業場景，綜觀全局、剖析獨特視角',
      gifUrl: '/placeholder-sandbox.gif',
      path: '/sandbox',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: t.features.customerExperience.title,
      description: t.features.customerExperience.description,
      points: [
        {
          title: t.features.customerExperience.points.engage.title,
          text: t.features.customerExperience.points.engage.text
        },
        {
          title: t.features.customerExperience.points.support.title,
          text: t.features.customerExperience.points.support.text
        },
        {
          title: t.features.customerExperience.points.adapt.title,
          text: t.features.customerExperience.points.adapt.text
        }
      ]
    },
    {
      icon: Zap,
      title: t.features.makeAiYourOwn.title,
      description: t.features.makeAiYourOwn.description,
      points: [
        {
          title: t.features.makeAiYourOwn.points.ground.title,
          text: t.features.makeAiYourOwn.points.ground.text
        },
        {
          title: t.features.makeAiYourOwn.points.solve.title,
          text: t.features.makeAiYourOwn.points.solve.text
        },
        {
          title: t.features.makeAiYourOwn.points.takeAction.title,
          text: t.features.makeAiYourOwn.points.takeAction.text
        }
      ]
    },
    {
      icon: Settings,
      title: t.features.rulesSystem.title,
      description: t.features.rulesSystem.description,
      points: [
        {
          title: t.features.rulesSystem.points.visualBuilder.title,
          text: t.features.rulesSystem.points.visualBuilder.text
        },
        {
          title: t.features.rulesSystem.points.realTime.title,
          text: t.features.rulesSystem.points.realTime.text
        },
        {
          title: t.features.rulesSystem.points.compliance.title,
          text: t.features.rulesSystem.points.compliance.text
        }
      ]
    }
  ];

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
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* Background Light Rays */}
        <div className="absolute top-10 inset-0 w-full h-full">
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
          <div className="text-center mb-4 px-6 min-h-[250px]">
            <h1 className="text-4xl uppercase md:text-5xl font-serif text-foreground mb-6 leading-tight">
              Unlock AGI <br />for Everything You Own
            </h1>
            {/* <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Unstructured? Unfiltered? Still Understood.
            </p>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Don’t Clean Your Data — Let AGI Do the Work.
            </p>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              AI That Reads What You Have — Not What You Curate.
            </p> */}
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              免標註、免格式化，資料原樣也能推理
            </p>
            {/* <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              企業資料資料不上妝，不再等待才有價值
            </p> */}


          </div>
          {/* Main Text with Fade Animation */}
          <div className="text-center mb-4 px-6">
            <div className="relative flex flex-col justify-center">
              <div
                className={cn(
                  "transition-opacity duration-300 flex flex-col justify-center",
                  isTransitioning ? "opacity-0" : "opacity-100"
                )}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 leading-tight">
                  {tagContent[selectedTag].mainText}
                </h1>
                <p className="text-lg text-muted-foreground whitespace-pre-line max-w-3xl mx-auto leading-relaxed">
                  {tagContent[selectedTag].subText}
                </p>
              </div>
            </div>
          </div>
          {/* CTA Button */}
          <RainbowButton
            onClick={() => router.push(tagContent[selectedTag].path)}
            className="mb-12"
          >
            <span className="flex items-center gap-2">
              {t.explore} {tagContent[selectedTag].tagText}
              <ArrowRight className="w-4 h-4" />
            </span>
          </RainbowButton>

          {/* Tag Selection with TrueFocus */}
          <div className="mb-16 px-6">
            <TrueFocus
              sentence={tagContent.map(item => item.tagText).join('|')}
              manualMode={true}
              blurAmount={2}
              borderColor="#a788f2"
              glowColor="rgba(37, 99, 235, 0.6)"
              animationDuration={0.4}
              selectedIndex={selectedTag}
              onWordSelect={handleTagChange}
            />
          </div>

          {/* Demo Area */}
          <div className="w-full max-w-6xl mx-auto px-6 mb-28">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-xl">
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  isTransitioning ? "opacity-0" : "opacity-100"
                )}
              >
                {selectedTag === 0 && <BrowserDemoComponent />}
                {selectedTag === 1 && <DesktopDemoComponent />}
                {selectedTag === 2 && <EnterpriseDemoComponent />}
                {selectedTag === 3 && <SandboxDemoComponent />}
              </div>
            </div>
          </div>


          {/* Scroll Indicator */}
          <div className="absolute bottom-8 animate-bounce z-20">
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-muted-foreground/30 rounded-full mt-2" />
            </div>
          </div>

        </div> {/* End of content overlay */}
      </section>

      {/* Feature Sections */}
      {features.map((feature, featureIndex) => (
        <section key={featureIndex} className={cn(
          "py-12 px-6 h-full",
          featureIndex % 2 === 0 ? "bg-background" : "bg-muted/30"
        )}>
          <div className="container mx-auto max-w-7xl h-full">
            <div className={cn(
              "grid lg:grid-cols-2 gap-16 items-start",
              featureIndex % 2 === 1 && "lg:grid-cols-2"
            )}>
              {/* Content Section */}
              <div className={cn(
                "space-y-8",
                featureIndex % 2 === 1 && "lg:order-2"
              )}>
                <div>
                  <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6">
                    {React.createElement(feature.icon, { className: "w-8 h-8 text-primary" })}
                  </div>
                  <h2 className="text-4xl font-bold text-foreground mb-4">{feature.title}</h2>
                  <p className="text-xl text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                {/* Action Button */}
                {featureIndex === 0 && (
                  <div>
                    <button
                      onClick={() => router.push('/browser?url=https://www.ask-lens.ai/about-us')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {t.seeOurProduct}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {featureIndex === 1 && (
                  <div>
                    <button
                      onClick={() => router.push('/sandbox')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {t.tryOurPlatform}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion Cards Section */}
              <div className={cn(
                "space-y-4",
                featureIndex % 2 === 1 && "lg:order-1"
              )}>
                {feature.points.map((point, pointIndex) => {
                  const [isOpen, setIsOpen] = React.useState(false);

                  return (
                    <div key={pointIndex} className="group bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50">
                      <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between p-6 text-left transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {pointIndex + 1}
                          </div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {point.title}
                          </h3>
                        </div>
                        <div className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform duration-300",
                          isOpen && "rotate-180"
                        )}>
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </button>
                      <div className={cn(
                        "overflow-hidden transition-all duration-300 ease-out",
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}>
                        <div className="px-6 pb-6 pt-2">
                          <p className="text-muted-foreground leading-relaxed ml-12">
                            {point.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default HomePage;
