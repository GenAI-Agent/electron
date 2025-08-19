import React, { useState } from 'react';
import { Paperclip, ImageIcon, Headphones } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InputAreaProps {
  onSubmit?: (text: string) => void;
  maxContentWidth?: number | string; // e.g., 960 or '50vw'
}

const InputArea: React.FC<InputAreaProps> = ({ onSubmit, maxContentWidth = '50vw' }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit?.(input);
    setInput('');
  };

  return (
    <div className="flex flex-col min-h-0 bg-[#eef5fb] px-6 pt-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col min-h-0 mx-auto w-full"
        style={{
          maxWidth: typeof maxContentWidth === 'number' ? `${maxContentWidth}px` : maxContentWidth,
        }}
      >
        <textarea
          className={cn(
            "flex-1 w-full resize-none rounded-[10px] border border-slate-200",
            "bg-[#eef5fb] px-2 py-2 text-sm leading-[1.4] text-gray-800",
            "placeholder:text-slate-400 placeholder:opacity-100",
            "hover:border-slate-300 focus:border-slate-400 focus:outline-none",
            "transition-colors"
          )}
          placeholder="輸入文字"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>

      <div
        className="flex justify-between items-center pt-[6px] flex-shrink-0 mx-auto w-full"
        style={{
          maxWidth: typeof maxContentWidth === 'number' ? `${maxContentWidth}px` : maxContentWidth,
        }}
      >
        <div className="flex gap-[6px]">
          <button
            type="button"
            className={cn(
              "w-[22px] h-[22px] flex items-center justify-center",
              "text-slate-600 hover:bg-slate-100 rounded transition-colors"
            )}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={cn(
              "w-[22px] h-[22px] flex items-center justify-center",
              "text-slate-600 hover:bg-slate-100 rounded transition-colors"
            )}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={cn(
              "w-[22px] h-[22px] flex items-center justify-center",
              "text-slate-600 hover:bg-slate-100 rounded transition-colors"
            )}
          >
            <Headphones className="w-4 h-4" />
          </button>
        </div>
        <div />
      </div>
    </div>
  );
};

export default InputArea;

