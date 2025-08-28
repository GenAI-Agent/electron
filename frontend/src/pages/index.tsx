import React, { useState } from 'react';
import { Globe, Monitor, Building, Brain, Mail, ExternalLink, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/router';
import Header from '@/components/ui/header';
import { RainbowButton } from '@/components/RainbowButton';
import { LensOSLogo } from '@/components/LensLogo';

const HomePage: React.FC = () => {
  const [isAuthenticated] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const router = useRouter();



  const featureCards = [
    {
      icon: Globe,
      title: 'Open Website',
      subtitle: '開啟網站',
      path: '/browser?url=https://www.google.com',
      description: '將任何網站無縫接入AGI，自動處理網頁數據轉換為AI可理解的Context',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Monitor,
      title: 'Open Desktop',
      subtitle: '開啟桌面',
      path: '/local',
      description: '透過AGI處理桌面數據，自定義規則讓AI理解並處理您的本地文件',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Building,
      title: 'Open SaaS System',
      subtitle: '開啟SaaS系統',
      path: '/browser?url=https://www.taaze.ai/business-intelligent',
      description: '接入企業SaaS系統，使用企業規則讓Supervisor Agent處理業務數據',
      gradient: 'from-purple-500 to-violet-500',
      bgGradient: 'from-purple-50 to-violet-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: BarChart3,
      title: 'AI Sandbox',
      subtitle: 'AI 沙盒',
      path: '/sandbox',
      description: '整合多元資料來源，與 AI 智能分析推理，在多次的策略模擬執行中，找出適合的道路',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-background m-0 p-0 overflow-hidden">
      {/* Header */}
      <Header
        rightContent={
          !isAuthenticated && (
            <RainbowButton
              onClick={() => router.push('/gmail-auth')}
            >
              <Brain className="w-4 h-4 mr-2" />
              Lens Auth with Google
            </RainbowButton>
          )
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center relative">
        {/* 上半部分 - 分為圖片區和文字區 */}
        <div className="flex-1 relative overflow-hidden w-full">
          {/* 圖片區域 - 上半部，帶更斜的切割，往上移動 */}
          <div className="absolute inset-0 w-full" style={{ top: '-5%', height: '75%', clipPath: 'polygon(0 0, 100% 0, 100% 55%, 0 90%)' }}>
            {hoveredCard !== null ? (
              // 顯示對應卡片的圖片（暫用橘色色塊）
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 relative">
                {/* 沿著切割線方向的漸層 - 從左上到右下漸變到透明 */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 via-orange-300/40 to-white/80"></div>
                {/* 卡片圖標在圖片區域 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-10%' }}>
                  <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {React.createElement(featureCards[hoveredCard].icon, { className: "w-16 h-16 text-white" })}
                  </div>
                </div>
              </div>
            ) : (
              // 預設 LENS OS 圖片
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 relative">
                {/* 沿著切割線方向的漸層 - 從左上到右下漸變到透明 */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 via-orange-300/40 to-white/80"></div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-10%' }}>
                  <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <LensOSLogo size={64} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 文字區域 - 下半部，右移配合斜線 */}
          <div className="absolute inset-0 w-full flex items-start px-6 pt-4" style={{ top: '45%', paddingLeft: '35%', paddingRight: '5%' }}>
            <div className="max-w-4xl w-full mx-auto text-right">
              {hoveredCard !== null ? (
                // 顯示被 hover 的卡片內容
                <div className="space-y-4 animate-in fade-in-0 duration-300">
                  <h1 className="text-4xl font-bold text-foreground mb-3">
                    {featureCards[hoveredCard].title}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-4">
                    {featureCards[hoveredCard].subtitle}
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    {featureCards[hoveredCard].description}
                  </p>

                  {/* Open Website 的快捷鏈接 */}
                  {featureCards[hoveredCard].title === 'Open Website' && (
                    <div className="flex gap-4 justify-end">
                      <button
                        onClick={() => router.push('/browser?url=https://mail.google.com')}
                        className="flex items-center px-4 py-2 gap-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors !text-white"
                      >
                        <Mail className="w-4 h-4" />
                        Gmail
                      </button>
                      <button
                        onClick={() => router.push('/browser?url=https://www.ask-lens.ai')}
                        className="flex items-center px-4 py-2 gap-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors !text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Lens
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // 預設顯示 LENS OS 介紹
                <div className="space-y-4 animate-in fade-in-0 duration-300">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-3">
                    LENS OS
                  </h1>
                  <p className="text-xl text-muted-foreground mb-4">
                    幫助企業無縫銜接AGI的智能系統
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    為傳統產業注入智能化動力，全方位整合網站、桌面和企業系統的數據處理能力
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 底部橢圓控制區域 - 直接到底部 */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-orange-100 via-orange-50 to-transparent" style={{borderRadius: '50% 50% 0 0 / 100% 100% 0 0'}}>
        <div className="relative w-full h-full flex items-center justify-center">

          {/* 左側兩個 Logo type 圖標 */}
          <div className="absolute left-1/2 bottom-6 flex gap-6 transform -translate-x-1/2" style={{ marginLeft: '-180px' }}>
            {featureCards.slice(0, 2).map((card, index) => (
              <div
                key={index}
                className="cursor-pointer transition-all duration-300 hover:scale-110"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => router.push(card.path)}
              >
                {React.createElement(card.icon, { className: "w-12 h-12 text-primary" })}
              </div>
            ))}
          </div>

          {/* 中央 LENS OS */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
            <span className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              LENS OS
            </span>
          </div>

          {/* 右側兩個 Logo type 圖標 */}
          <div className="absolute left-1/2 bottom-6 flex gap-6 transform -translate-x-1/2" style={{ marginLeft: '180px' }}>
            {featureCards.slice(2, 4).map((card, index) => (
              <div
                key={index + 2}
                className="cursor-pointer transition-all duration-300 hover:scale-110"
                onMouseEnter={() => setHoveredCard(index + 2)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => router.push(card.path)}
              >
                {React.createElement(card.icon, { className: "w-12 h-12 text-primary" })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
