import React, { useState } from 'react';
import { Send, Globe, Monitor, Building, Brain, Mail, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import Header from '@/components/ui/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RainbowButton } from '@/components/RainbowButton';
import { LensOSLogo } from '@/components/LensLogo';

const HomePage: React.FC = () => {
  const [agentInput, setAgentInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentInput.trim()) {
      // TODO: 處理 Supervisor Agent 輸入
      console.log('Supervisor Agent Input:', agentInput);
    }
  };

  const featureCards = [
    {
      icon: Globe,
      title: 'Open Website',
      subtitle: '開啟網站',
      path: '/browser?url=https://www.google.com',
      description: '將任何網站無縫接入AGI，自動處理網頁數據轉換為AI可理解的Context',
      hoverColor: 'hover:border-primary hover:shadow-primary/20',
    },
    {
      icon: Monitor,
      title: 'Open Desktop',
      subtitle: '開啟桌面',
      path: '/local',
      description: '透過AGI處理桌面數據，自定義規則讓AI理解並處理您的本地文件',
      hoverColor: 'hover:border-primary hover:shadow-primary/20',
    },
    {
      icon: Building,
      title: 'Open SaaS System',
      subtitle: '開啟SaaS系統',
      path: '/browser?url=https://www.taaze.ai/business-intelligent',
      description: '接入企業SaaS系統，使用企業規則讓Supervisor Agent處理業務數據',
      hoverColor: 'hover:border-primary hover:shadow-primary/20',
    },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-background m-0 p-0">
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

      {/* Main Content - 中央主視覺 */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 pb-32">
        <div className="max-w-6xl w-full mx-auto">
          {/* 主標題和描述 */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-10">
              <LensOSLogo size={100} />
              <div>
                <h1 className="text-5xl font-light tracking-wider bg-gradient-to-r from-blue-600 via-purple-600 to-blue-400 bg-clip-text text-transparent">
                  LENS OS
                </h1>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              幫助企業無縫銜接AGI的智能系統
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-2">
              為傳統產業注入智能化動力，全方位整合網站、桌面和企業系統的數據處理能力
            </p>
          </div>

          {/* 三個主要卡片選項 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureCards.map((card, index) => (
              <div key={index} className="relative">
                <Card
                  onClick={() => router.push(card.path)}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-300 border-2 border-border p-8",
                    "hover:scale-105 hover:shadow-xl",
                    card.hoverColor
                  )}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <card.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {card.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </Card>

                {/* 快捷按鈕 - 只在 Open Website 卡片上顯示 */}
                {card.title === 'Open Website' && (
                  <div className="absolute top-full left-0 right-0 mt-2 opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/browser?url=https://mail.google.com');
                        }}
                        className="flex items-center px-2 py-1 gap-2 text-sm bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg"
                      >
                        <Mail className="w-3 h-3" />
                        Gmail
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/browser?url=https://www.ask-lens.ai');
                        }}
                        className="flex items-center px-2 py-1 gap-2 text-sm bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Lens
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部 Supervisor Agent Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4">
        <form
          onSubmit={handleAgentSubmit}
          className="max-w-4xl mx-auto flex gap-3"
        >
          <Input
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            placeholder="向 Supervisor Agent 提問或下達指令..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
