import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguageStore, Language } from '@/stores/languageStore';
import { cn } from '@/utils/cn';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className }) => {
  const { language, setLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "relative inline-flex h-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      title={language === 'zh' ? '切換至英文' : 'Switch to Chinese'}
    >
      <Globe className="w-3 h-3 mr-2" />
      {language === 'zh' ? '中' : 'EN'}
    </button>
  );
};