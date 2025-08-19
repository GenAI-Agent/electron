import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Loader2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Rule {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  model: string;
  tools: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface RuleDetail extends Rule {
  agents: string[];
  prompt: string;
}

interface RulesPanelProps {
  // 可以添加其他 props
}

const RulesPanel: React.FC<RulesPanelProps> = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRule, setSelectedRule] = useState<RuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入規則列表
  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/rules/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入規則失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入規則詳情
  const loadRuleDetail = async (ruleId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/rules/${ruleId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSelectedRule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入規則詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  // 組件載入時獲取規則列表
  useEffect(() => {
    loadRules();
  }, []);

  // 返回規則列表
  const handleBack = () => {
    setSelectedRule(null);
    setError(null);
  };

  // 點擊規則卡片
  const handleRuleClick = (rule: Rule) => {
    loadRuleDetail(rule.id);
  };

  // 如果正在載入
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // 如果有錯誤
  if (error) {
    return (
      <div className="p-2">
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 如果選中了規則，顯示詳情
  if (selectedRule) {
    return (
      <div className="h-full flex flex-col p-2">
        {/* 返回按鈕 */}
        <div className="flex items-center mb-2">
          <button
            onClick={handleBack}
            className="p-1.5 mr-2 rounded hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h6 className="text-base font-semibold">
            {selectedRule.name}
          </h6>
        </div>

        {/* 規則詳情 */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-2">
            <div className="p-4">
              <h3 className="text-xs text-gray-600 mb-1">
                描述
              </h3>
              <p className="text-xs mb-4">
                {selectedRule.description}
              </p>

              <h3 className="text-xs text-gray-600 mb-1">
                模型
              </h3>
              <span className="inline-block px-2 py-1 text-[10px] bg-gray-100 rounded-full mb-4">
                {selectedRule.model}
              </span>

              {selectedRule.tools.length > 0 && (
                <>
                  <h3 className="text-xs text-gray-600 mb-1">
                    工具
                  </h3>
                  <div className="flex gap-1 flex-wrap mb-4">
                    {selectedRule.tools.map((tool, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-[10px] border border-gray-300 rounded-full"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h3 className="text-xs text-gray-600 mb-1">
                系統提示詞
              </h3>
              <div className="bg-slate-50 rounded p-4 border border-slate-200 max-h-[300px] overflow-auto">
                <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {selectedRule.prompt || '無系統提示詞'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 顯示規則列表
  return (
    <div className="h-full p-1 overflow-auto grid grid-cols-2 gap-1 content-start">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="h-[140px] bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col"
            onClick={() => handleRuleClick(rule)}
          >
            <div className="p-3 flex flex-col h-full">
              {/* 標題 */}
              <div className="mb-1">
                <h3 className="text-xs font-semibold leading-tight">
                  {rule.name}
                </h3>
              </div>

              {/* 描述 - 顯示 prompt 內容 */}
              <p className="text-[9px] text-gray-600 mb-2 line-clamp-3 leading-relaxed flex-1">
                {rule.prompt || rule.description}
              </p>

              {/* 底部信息 - model chip 在左下角 */}
              <div className="flex justify-start items-end">
                <span className="inline-block px-1.5 py-0.5 text-[7px] border border-gray-300 rounded-full">
                  {rule.model}
                </span>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="col-span-full flex justify-center items-center h-[200px] text-gray-500">
            <p className="text-[11px]">
              沒有找到規則
            </p>
          </div>
        )}
    </div>
  );
};

export default RulesPanel;
