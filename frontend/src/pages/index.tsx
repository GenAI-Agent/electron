import React, { useState } from 'react';
import { ArrowRight, Mail, FolderOpen, Globe, Monitor, Building, Calendar, MessageCircle, HardDrive, Video, Brain } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import TitleBar from '@/components/TitleBar';
import LocalFileCards from '@/components/LocalFileCards';
import { RainbowButton } from '@/components/RainbowButton';

const HomePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent, type: 'web' | 'local' | 'sass') => {
    e.preventDefault();
    if (url.trim()) {
      switch (type) {
        case 'web':
          router.push(`/browser?url=${encodeURIComponent(url)}`);
          break;
        case 'local':
          router.push(`/browser?path=${encodeURIComponent(url)}&mode=${type}`);
          break;
        case 'sass':
          router.push(`/browser?path=${encodeURIComponent(url)}&mode=${type}`);
          break;
        default:
          alert('Please select a valid option');
          break;
      }
    } else {
      alert('Please enter a valid URL');
    }
  };


  const handleWebsiteClick = (websiteUrl: string) => {
    router.push(`/browser?url=${encodeURIComponent(websiteUrl)}`);
  };

  const featureCards = [
    {
      icon: Globe,
      title: 'Website',
      path: '/browser?url=https://www.google.com',
      description: 'Turn All website to AGI in a second',
      gradientStyle: {
        background: `linear-gradient(135deg, var(--primary), var(--primary) 50%, rgba(59, 130, 246, 0.8))`,
      },
    },
    {
      icon: Monitor,
      title: 'Desktop',
      path: '/local',
      description: 'Enable your Desktop with Language model + multi Agent',
      gradientStyle: {
        background: `linear-gradient(135deg, var(--primary), var(--primary) 30%, rgba(59, 130, 246, 0.7))`,
      },
    },
    {
      icon: Building,
      title: 'SASS',
      // path: '/business-intelligent',
      path: '/browser?url=https://www.taaze.ai/business-intelligent',
      description: 'Enterprise-grade AI automation solutions',
      gradientStyle: {
        background: `linear-gradient(135deg, var(--primary), var(--primary) 20%, rgba(59, 130, 246, 0.6))`,
      },
    },
  ];

  const commonWebsites = [
    { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox', icon: Mail, color: 'bg-primary', opacity: 'opacity-100' },
    { name: 'Meet', url: 'https://meet.google.com', icon: Video, color: 'bg-primary', opacity: 'opacity-90' },
    { name: 'Google Drive', url: 'https://drive.google.com', icon: HardDrive, color: 'bg-primary', opacity: 'opacity-80' },
    { name: 'Telegram', url: 'https://web.telegram.org', icon: MessageCircle, color: 'bg-primary', opacity: 'opacity-70' },
    { name: 'Google Calendar', url: 'https://calendar.google.com', icon: Calendar, color: 'bg-primary', opacity: 'opacity-60' },
    { name: 'Len OS', url: 'https://www.ask-lens.ai', icon: Brain, color: 'bg-primary', opacity: 'opacity-100' },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-background m-0 p-0">
      {/* Title Bar */}
      <TitleBar
        title="Len OS"
        showModeSwitch={true}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to Len OS
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your intelligent operating system powered by AI
            </p>

            {/* Lens Auth Button */}
            <RainbowButton
              onClick={() => router.push('/gmail-auth')}
              className="mb-8"
            >
              <Brain className="w-5 h-5 mr-2" />
              Len OS Auth
            </RainbowButton>
          </div>
          <>
            {/* URL Input Section */}
            <div className="mb-8">
              <form
                onSubmit={(e) => handleSubmit(e, 'web')}
                className="flex items-center max-w-2xl mx-auto"
              >
                <input
                  className="flex-1 rounded-lg bg-card border border-border px-4 py-3 text-foreground placeholder-muted-foreground outline-none hover:border-ring/50 focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
                  placeholder="輸入網址..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'web')}
                  className="ml-3 bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Feature Cards */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Choose Your Experience
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featureCards.map((card, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(card.path)}
                    className="relative overflow-hidden rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform duration-300"
                    style={card.gradientStyle}
                  >
                    <div className="relative z-10">
                      <card.icon className="w-12 h-12 mb-4" />
                      <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                      <p className="text-white/90">{card.description}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Common Websites */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Quick Access
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {commonWebsites.map((website, index) => (
                  <button
                    key={index}
                    onClick={() => handleWebsiteClick(website.url)}
                    className="flex flex-col items-center p-4 bg-card border border-border rounded-lg hover:border-ring/50 hover:bg-accent/50 transition-colors group"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform",
                      website.color,
                      website.opacity
                    )}>
                      <website.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {website.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>

        </div>
      </div>
    </div>
  );
};

export default HomePage;
