import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Building, BarChart3, User, LogOut, Vote, TrendingUp, ArrowRight } from 'lucide-react';
import TrueFocus from '@/components/animation/TrueFocus';
import { useRouter } from 'next/router';
import Header, { ViewMode } from '@/components/ui/header';
import { RainbowButton } from '@/components/animation/RainbowButton';
import { cn } from '@/utils/cn';
import AuthManager, { AuthStatus } from '@/utils/authManager';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageStore } from '@/stores/languageStore';
import { translations } from '@/translations';
import Image from 'next/image';
import websiteScreenshot from '@/pages/election/website.png';
import desktopScreenshot from '@/pages/cal/desktop.png';
import saasScreenshot from '@/pages/cal/saas.png';
import sandboxScreenshot from '@/pages/election/sandbox.png';


const ElectionPage: React.FC = () => {
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
    console.log('ElectionPage - handleTagChange called with index:', newIndex, 'Current selectedTag:', selectedTag);
    if (newIndex === selectedTag) return;

    setIsTransitioning(true);

    // Start fade out
    setTimeout(() => {
      console.log('ElectionPage - Setting selectedTag to:', newIndex, 'Tag:', electionContent[newIndex]?.tagText);
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
        router.push('/browser?url=https://www.cec.gov.tw');
        break;
      case 1:
        router.push('/local');
        break;
      case 2:
        router.push('/');
        break;
      case 3:
        router.push('/election/sandbox-election');
        break;
    }
  };

  const electionContent = [
    {
      title: '選務官網',
      tagText: 'Webpage',
      icon: Globe,
      mainText: '選舉官網 AI 分析',
      subText: 'AI Agent 即時分析選舉委員會官網內容，提供選務資訊、候選人資料、投票站查詢等智能洞察',
      demoContent: {
        type: 'webpage',
        data: {
          url: 'cec.gov.tw',
          sections: ['候選人查詢', '投票站資訊', '開票結果', '選務公告'],
          insights: ['投票率統計分析', '候選人支持度趨勢', '選區競爭狀況']
        }
      }
    },
    {
      title: '競選系統',
      tagText: 'Desktop',
      icon: Monitor,
      mainText: '競選總部系統整合',
      subText: '將競選總部內部桌面應用程式與 AI 整合，實現選民資料管理、文宣製作、活動規劃的智能化管理',
      demoContent: {
        type: 'desktop',
        data: {
          systems: ['選民資料庫', '文宣管理系統', '活動排程系統', '志工管理平台'],
          metrics: ['文宣效果提升35%', '活動參與率提升50%', '選民觸及率提升25%']
        }
      }
    },
    {
      title: 'SaaS 整合',
      tagText: 'SaaS',
      icon: Building,
      mainText: '選舉 SaaS 生態整合',
      subText: '整合選舉使用的各種 SaaS 服務，包括民調系統、社群媒體管理、募款平台，實現數據統一分析',
      demoContent: {
        type: 'saas',
        data: {
          platforms: ['民調管理系統', '社群媒體平台', '募款管理系統', '媒體監測工具'],
          benefits: ['民意掌握度提升40%', '社群影響力提升30%', '募款效率提升35%']
        }
      }
    },
    {
      title: '選情沙盒',
      tagText: 'Lens Sandbox',
      icon: BarChart3,
      mainText: '選舉策略模擬',
      subText: '透過 AI 沙盒模擬不同競選策略、民調預測、對手分析，為選舉團隊提供數據驅動的決策支持',
      demoContent: {
        type: 'sandbox',
        data: {
          scenarios: ['選區策略分析', '政策議題優化', '對手競爭分析', '選民動向預測'],
          results: ['勝選機率預測78%', '最佳議題組合分析', '票源轉移預測15%']
        }
      }
    },
  ];


  return (
    <div className="min-h-screen w-full flex flex-col bg-background overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <Header
        title='選舉 x LensOS'
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center shadow-lg">
                <Vote className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  選舉 x LensOS
                </h1>
              </div>
            </div>
          </div>

          {/* TrueFocus Tabs Section */}
          <div className="flex justify-center mb-16">
            <TrueFocus
              sentence={electionContent.map(item => item.tagText).join('|')}
              manualMode={true}
              blurAmount={2}
              glowColor="rgba(220, 38, 127, 0.6)"
              animationDuration={0.4}
              selectedIndex={selectedTag}
              onWordSelect={handleTagChange}
            />
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className=''>
              <div
                className={cn(
                  "transition-opacity duration-300",
                  isTransitioning ? "opacity-0" : "opacity-100"
                )}
              >
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  {electionContent[selectedTag]?.mainText}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {electionContent[selectedTag]?.subText}
                </p>
              </div>

              <RainbowButton
                onClick={goExperience}
                className="inline-flex"
              >
                <span className="flex items-center gap-2">
                  開始 AI 之旅
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
                  {selectedTag === 0 && electionContent[0] && (
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
                      <Image src={websiteScreenshot} alt="選舉官網截圖" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {selectedTag === 1 && electionContent[1] && (
                    <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Image src={desktopScreenshot} alt="選舉內部系統截圖" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {selectedTag === 2 && electionContent[2] && (
                    <div className="aspect-video bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center">
                      <Image src={saasScreenshot} alt="選舉 SaaS 系統整合截圖" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {selectedTag === 3 && electionContent[3] && (
                    <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-dashed border-orange-300 flex items-center justify-center">
                      <Image src={sandboxScreenshot} alt="選情沙盒模擬截圖" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Right: Description and Detailed Data */}
            <div className="space-y-6">
              {selectedTag === 0 && electionContent[0] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">選務功能模組</h4>
                  <div className="space-y-3">
                    {electionContent[0].demoContent.data.sections?.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">{section}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">AI 洞察結果</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        全國投票率：72.8%（較上次提升3.2%）
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        青年投票率：65.4%（首投族積極參與）
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        提前投票比例：18.3%
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        開票透明度滿意度：89.7%
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <h5 className="text-sm font-medium text-muted-foreground mb-3">即時選情數據</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="font-medium text-sm">候選人數</div>
                          <div className="text-blue-600 font-semibold">1,247人</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="font-medium text-sm">投票所</div>
                          <div className="text-blue-600 font-semibold">17,853個</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTag === 1 && electionContent[1] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">競選系統模組</h4>
                  <div className="space-y-3">
                    {electionContent[1].demoContent.data.systems?.map((system, idx) => (
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
                    <h4 className="text-lg font-semibold text-foreground mb-4">競選效益提升</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        台北市第一選區支持度：42.3%
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        新北市第三選區支持度：38.7%
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        文宣觸及率提升35%
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        志工動員效率提升40%
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <h5 className="text-sm font-medium text-muted-foreground mb-3">選民資料統計</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-200 p-3 rounded-lg">
                          <div className="font-medium text-sm">登記選民</div>
                          <div className="text-gray-600 font-semibold">19.3萬人</div>
                        </div>
                        <div className="bg-gray-200 p-3 rounded-lg">
                          <div className="font-medium text-sm">接觸率</div>
                          <div className="text-gray-600 font-semibold">73.2%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTag === 2 && electionContent[2] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">選舉 SaaS 整合平台</h4>
                  <div className="space-y-3">
                    {electionContent[2].demoContent.data.platforms?.map((platform, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-sm font-medium">{platform}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">整合效益</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        社群粉絲總數：128萬人
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        募款總額：2,450萬新台幣
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        媒體聲量提升45%
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        正面輿情比例提升至78%
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <h5 className="text-sm font-medium text-muted-foreground mb-3">平台整合指標</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="font-medium text-sm">資料同步率</div>
                          <div className="text-purple-600 font-semibold">98.5%</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="font-medium text-sm">系統可用性</div>
                          <div className="text-purple-600 font-semibold">99.7%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTag === 3 && electionContent[3] && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">選情模擬場景</h4>
                  <div className="space-y-3">
                    {electionContent[3].demoContent.data.scenarios?.map((scenario, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-sm font-medium">{scenario}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">競爭分析結果</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        vs 對手A：支持度領先8.3%
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        vs 對手B：議題討論度領先15.7%
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        關鍵議題：經濟發展（28.5%支持）
                      </div>
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        年輕選民好感度排名第一
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <h5 className="text-sm font-medium text-muted-foreground mb-3">選情預測</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="font-medium text-sm">勝選機率</div>
                          <div className="text-orange-600 font-semibold">78.3%</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="font-medium text-sm">得票預估</div>
                          <div className="text-orange-600 font-semibold">52.7%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div> {/* End of content overlay */}
      </section>
    </div>
  );
};

export default ElectionPage;