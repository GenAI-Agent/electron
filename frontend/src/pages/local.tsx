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


  return (
    <div className="h-screen w-screen flex flex-col bg-background m-0 p-0">
      {/* Title Bar */}
      <TitleBar
        title="Lens"
        showModeSwitch={true}
      />

      <>
        {/* File Path Input */}
        <form
          onSubmit={(e) => handleSubmit(e, 'local')}
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
    </div>
  );
};

export default HomePage;

