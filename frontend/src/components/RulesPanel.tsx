import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Loader2, X, Plus, Save, Trash2 } from 'lucide-react';
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

interface CreateRuleForm {
  name: string;
  description: string;
  model: string;
  tools: string[];
  agents: string[];
  prompt: string;
  enabled: boolean;
}

interface RulesPanelProps {
  // 可以添加其他 props
  onRulesUpdate?: () => void; // 當規則更新時的回調函數
}

const RulesPanel: React.FC<RulesPanelProps> = ({ onRulesUpdate }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRule, setSelectedRule] = useState<RuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRuleForm>({
    name: '',
    description: '',
    model: 'gpt-4o',
    tools: [],
    agents: [],
    prompt: '',
    enabled: true
  });
  const [toolsInput, setToolsInput] = useState('');
  const [agentsInput, setAgentsInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<RuleDetail | null>(null);

  // 載入規則列表
  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8021/api/rules/');
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
      const response = await fetch(`http://localhost:8021/api/rules/${ruleId}`);
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

  // 創建規則
  const createRule = async () => {
    try {
      setLoading(true);

      // 處理工具和代理列表
      const tools = toolsInput.split(',').map(t => t.trim()).filter(t => t);
      const agents = agentsInput.split(',').map(a => a.trim()).filter(a => a);

      const response = await fetch('http://localhost:8021/api/rules/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          tools,
          agents
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newRule = await response.json();

      // 重新載入規則列表
      await loadRules();

      // 通知父組件規則已更新
      if (onRulesUpdate) {
        onRulesUpdate();
      }

      // 重置表單
      setCreateForm({
        name: '',
        description: '',
        model: 'gpt-4o',
        tools: [],
        agents: [],
        prompt: '',
        enabled: true
      });
      setToolsInput('');
      setAgentsInput('');
      setShowCreateForm(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : '創建規則失敗');
    } finally {
      setLoading(false);
    }
  };

  // 重置創建表單
  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      model: 'gpt-4o',
      tools: [],
      agents: [],
      prompt: '',
      enabled: true
    });
    setToolsInput('');
    setAgentsInput('');
    setShowCreateForm(false);
    setError(null);
  };

  // 開始刪除規則流程
  const startDeleteRule = (rule: RuleDetail) => {
    setRuleToDelete(rule);
    setShowDeleteConfirm(true);
  };

  // 確認刪除規則
  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8021/api/rules/${ruleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 重新載入規則列表
      await loadRules();

      // 通知父組件規則已更新
      if (onRulesUpdate) {
        onRulesUpdate();
      }

      // 如果刪除的是當前查看的規則，返回列表
      if (selectedRule?.id === ruleToDelete.id) {
        setSelectedRule(null);
      }

      // 重置狀態
      setShowDeleteConfirm(false);
      setRuleToDelete(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除規則失敗');
    } finally {
      setLoading(false);
    }
  };

  // 取消刪除
  const cancelDeleteRule = () => {
    setShowDeleteConfirm(false);
    setRuleToDelete(null);
  };

  // 渲染主要內容
  const renderMainContent = () => {
    // 如果正在載入
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    // 如果有錯誤
    if (error) {
      return (
        <div className="p-2">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
            <span className="text-sm text-destructive">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-destructive hover:text-destructive/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // 如果顯示創建表單
    if (showCreateForm) {
      return (
        <div className="h-full flex flex-col p-2">
          {/* 返回按鈕 */}
          <div className="flex items-center mb-2">
            <button
              onClick={resetCreateForm}
              className="p-1.5 mr-2 rounded hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h6 className="text-lg font-semibold">
              創建新規則
            </h6>
          </div>

          {/* 創建表單 */}
          <div className="flex-1 overflow-auto">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-2">
              <div className="p-4 space-y-4">
                {/* 名稱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名稱 *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="輸入規則名稱"
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述 *
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="輸入規則描述"
                  />
                </div>

                {/* 模型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模型
                  </label>
                  <select
                    value={createForm.model}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4.1">gpt-4.1</option>
                    <option value="claude-3">claude-3</option>
                  </select>
                </div>

                {/* 工具 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工具 (用逗號分隔)
                  </label>
                  <input
                    type="text"
                    value={toolsInput}
                    onChange={(e) => setToolsInput(e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如: tool1, tool2, tool3"
                  />
                </div>

                {/* 代理 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    代理 (用逗號分隔)
                  </label>
                  <input
                    type="text"
                    value={agentsInput}
                    onChange={(e) => setAgentsInput(e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如: agent1, agent2"
                  />
                </div>

                {/* 系統提示詞 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    系統提示詞
                  </label>
                  <textarea
                    value={createForm.prompt}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="輸入系統提示詞..."
                  />
                </div>

                {/* 啟用狀態 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={createForm.enabled}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="enabled" className="text-sm text-gray-700">
                    啟用此規則
                  </label>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={createRule}
                    disabled={!createForm.name.trim() || !createForm.description.trim() || loading}
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 text-base rounded-md transition-colors",
                      createForm.name.trim() && createForm.description.trim() && !loading
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    創建規則
                  </button>
                  <button
                    onClick={resetCreateForm}
                    className="px-4 py-2 text-base text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 如果選中了規則，顯示詳情
    if (selectedRule) {
      return (
        <div className="h-full flex flex-col p-2">
          {/* 返回按鈕與操作 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="p-1.5 mr-2 rounded hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h6 className="text-lg font-semibold">
                {selectedRule.name}
              </h6>
            </div>

            {/* 刪除按鈕 */}
            <button
              onClick={() => startDeleteRule(selectedRule)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 transition-colors"
              title="刪除規則"
            >
              <Trash2 className="w-4 h-4" />
              刪除
            </button>
          </div>

          {/* 規則詳情 */}
          <div className="flex-1 overflow-auto">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-2">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  描述
                </h3>
                <p className="text-base mb-4">
                  {selectedRule.description}
                </p>

                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  模型
                </h3>
                <span className="inline-block px-3 py-1.5 text-sm bg-gray-100 rounded-full mb-4">
                  {selectedRule.model}
                </span>

                {selectedRule.tools.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      工具
                    </h3>
                    <div className="flex gap-1 flex-wrap mb-4">
                      {selectedRule.tools.map((tool, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 text-sm border border-gray-300 rounded-full"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  系統提示詞
                </h3>
                <div className="bg-slate-50 rounded p-4 border border-slate-200 max-h-[300px] overflow-auto">
                  <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
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
      <div className="h-full flex flex-col">
        {/* 標題與新增按鈕 */}
        <div className="flex items-center justify-between p-2 pb-1">
          <h6 className="text-base font-semibold text-foreground">
            規則管理
          </h6>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            新增
          </button>
        </div>

        {/* 規則網格 */}
        <div className="flex-1 p-1 overflow-auto grid grid-cols-2 gap-1 content-start">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="h-[140px] bg-card rounded-lg border border-border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-primary/50 flex flex-col group"
              onClick={() => handleRuleClick(rule)}
            >
              <div className="p-3 flex flex-col h-full">
                {/* 標題 */}
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {rule.name}
                  </h3>
                </div>

                {/* 描述 - 顯示 prompt 內容 */}
                <p className="text-xs text-muted-foreground mb-2 line-clamp-3 leading-relaxed flex-1">
                  {rule.prompt || rule.description}
                </p>

                {/* 底部信息 - model chip 在左下角 */}
                <div className="flex justify-start items-end">
                  <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full">
                    {rule.model}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="col-span-full flex justify-center items-center h-[200px] text-muted-foreground">
              <p className="text-sm">
                沒有找到規則
              </p>
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <>
      {renderMainContent()}

      {/* 刪除確認對話框 - 始終渲染 */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        ruleName={ruleToDelete?.name || ''}
        onConfirm={confirmDeleteRule}
        onCancel={cancelDeleteRule}
        isLoading={loading}
      />
    </>
  );
};

// 刪除確認對話框組件
const DeleteConfirmDialog: React.FC<{
  isOpen: boolean;
  ruleName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ isOpen, ruleName, onConfirm, onCancel, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              確認刪除規則
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            您確定要刪除規則 "<span className="font-medium text-gray-900">{ruleName}</span>" 嗎？
          </p>
          <p className="text-sm text-red-600 mt-2">
            此操作無法復原，規則文件將被永久刪除。
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500",
              isLoading
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                刪除中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                確認刪除
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesPanel;
