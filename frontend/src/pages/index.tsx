import React, { useState } from 'react';
import { ArrowRight, Mail, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import TitleBar from '@/components/TitleBar';
import LocalFileCards from '@/components/LocalFileCards';

const HomePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isWebMode, setIsWebMode] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      if (isWebMode) {
        router.push(`/browser?url=${encodeURIComponent(url)}`);
      } else {
        router.push(`/browser?path=${encodeURIComponent(url)}&mode=local`);
      }
    }
  };

  const handleModeChange = (webMode: boolean) => {
    setIsWebMode(webMode);
    setUrl(''); // 清空輸入框
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f0f4f8] m-0 p-0">
      {/* Title Bar */}
      <TitleBar
        title="Lens"
        showModeSwitch={true}
        isWebMode={isWebMode}
        onModeChange={handleModeChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-3">
        {/* Conditional Content based on mode */}
        {isWebMode ? (
          <>
            {/* Gmail Auth Button - only in web mode */}
            <button
              onClick={() => router.push('/gmail-auth')}
              className="bg-[#4285f4] text-white rounded-[25px] px-8 py-3 text-base flex items-center gap-2 hover:bg-[#3367d6] transition-colors"
            >
              <Mail className="w-5 h-5" />
              Google OAuth 登入
            </button>



            {/* URL Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center w-[500px] max-w-[90vw]"
            >
              <input
                className="w-full rounded-[25px] bg-white border border-slate-200 px-4 py-3 outline-none hover:border-slate-300 focus:border-slate-600 focus:ring-2 focus:ring-slate-600/20 transition-colors"
                placeholder="輸入網址..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                className="ml-2 bg-slate-600 text-white p-3 rounded-full hover:bg-slate-700 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <>
            {/* File Path Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center w-[500px] max-w-[90vw]"
            >
              <input
                className="w-full rounded-[25px] bg-white border border-slate-200 px-4 py-3 outline-none hover:border-slate-300 focus:border-slate-600 focus:ring-2 focus:ring-slate-600/20 transition-colors"
                placeholder="輸入檔案路徑..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                className="ml-2 bg-slate-600 text-white p-3 rounded-full hover:bg-slate-700 transition-colors"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
            </form>

            {/* Local File Cards */}
            <LocalFileCards />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
