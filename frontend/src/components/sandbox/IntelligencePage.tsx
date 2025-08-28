import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Database, MessageSquare, FileText, BarChart3, Plus, Search, LogIn, ExternalLink, Globe, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import IconSidebar from '@/components/ui/IconSidebar';
import BrowserView from '@/components/BrowserView';
import { cn } from '@/utils/cn';

// Social media post interface
interface SocialMediaPost {
  post_id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_followers_count: number;
  post_text: string;
  hashtags: string[];
  mentions: string[];
  emojis: string[];
  like_count: number;
  reply_count: number;
  repost_count: number;
  quote_count: number;
  created_time: string;
}

// Custom logo components
const ThreadsLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-4 h-4 rounded-full bg-black flex items-center justify-center", className)}>
    <span className="text-white text-xs font-bold">@</span>
  </div>
);

const TwitterLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-4 h-4", className)}>
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-black">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  </div>
);

type DataSource = 'threads' | 'twitter' | 'petition';

interface DataFile {
  filename: string;
  date: string;
  time: string;
  fullPath: string;
  recordCount?: number;
}

interface DataStats {
  total_files: number;
  total_records: number;
  latest_update: string;
}

interface PetitionData {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'processing' | 'resolved';
}

interface IntelligencePageProps {
  onOpenDataTab: (source: DataSource, file: DataFile) => void;
  className?: string;
}

const dataSources = [
  {
    id: 'threads' as DataSource,
    name: 'Threads',
    description: 'Meta Threads 社群媒體',
    icon: ThreadsLogo,
    color: 'text-black',
    requiresAuth: true,
    webUrl: 'https://threads.net',
  },
  {
    id: 'twitter' as DataSource,
    name: 'Twitter',
    description: 'Twitter/X 社群媒體',
    icon: TwitterLogo,
    color: 'text-black',
    requiresAuth: true,
    webUrl: 'https://twitter.com',
  },
  {
    id: 'petition' as DataSource,
    name: '陳情系統',
    description: '人民陳情案件資料',
    icon: FileText,
    color: 'text-orange-600',
    requiresAuth: false,
  },
];

// Mock petition data
const mockPetitions: PetitionData[] = [
  {
    id: '2024001',
    title: '建議增設公車站牌及候車亭',
    category: '交通運輸',
    description: '住宅區附近缺乏公車站牌，居民候車不便，建議增設站牌及候車亭。',
    date: '2024-08-20',
    status: 'processing'
  },
  {
    id: '2024002',
    title: '社區公園照明設備改善',
    category: '公共設施',
    description: '公園內路燈老舊昏暗，影響夜間運動安全，請求改善照明設備。',
    date: '2024-08-18',
    status: 'pending'
  },
  {
    id: '2024003',
    title: '學校周邊交通安全改善',
    category: '交通安全',
    description: '小學上下學時間車流量大，建議增設交通號誌及導護設施。',
    date: '2024-08-15',
    status: 'resolved'
  },
  {
    id: '2024004',
    title: '垃圾清運時間調整建議',
    category: '環境衛生',
    description: '現行垃圾清運時間與上班族作息不符，建議調整清運時段。',
    date: '2024-08-12',
    status: 'processing'
  },
  {
    id: '2024005',
    title: '老人活動中心設施更新',
    category: '社會福利',
    description: '社區老人活動中心設備老舊，建議更新桌椅及運動器材。',
    date: '2024-08-10',
    status: 'pending'
  },
  {
    id: '2024006',
    title: '噪音管制加強執行',
    category: '環境品質',
    description: '夜市攤商營業時間過長產生噪音，影響住戶休息品質。',
    date: '2024-08-08',
    status: 'processing'
  },
  {
    id: '2024007',
    title: '增設兒童遊樂設施',
    category: '休閒育樂',
    description: '社區缺乏適合兒童的遊樂設施，建議在公園內增設。',
    date: '2024-08-05',
    status: 'resolved'
  },
  {
    id: '2024008',
    title: '道路坑洞修補改善',
    category: '道路維護',
    description: '主要道路多處坑洞未修補，影響行車安全及舒適度。',
    date: '2024-08-03',
    status: 'processing'
  },
  {
    id: '2024009',
    title: '圖書館開放時間延長',
    category: '教育文化',
    description: '圖書館週末開放時間過短，建議延長開放時間服務民眾。',
    date: '2024-08-01',
    status: 'pending'
  },
  {
    id: '2024010',
    title: '停車位不足問題改善',
    category: '交通運輸',
    description: '住宅區停車位嚴重不足，造成違停問題，建議增設停車場。',
    date: '2024-07-28',
    status: 'processing'
  }
];

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  onOpenDataTab,
  className,
}) => {
  const [selectedSource, setSelectedSource] = useState<DataSource>('threads');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authenticatedSources, setAuthenticatedSources] = useState<Set<DataSource>>(new Set());
  const [showWebview, setShowWebview] = useState(false);
  const [viewMode, setViewMode] = useState<'data' | 'webview'>('data');
  const [availableFiles, setAvailableFiles] = useState<DataFile[]>([]);
  const [socialMediaPosts, setSocialMediaPosts] = useState<SocialMediaPost[]>([]);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Load social media data directly from JSON files
  const loadSocialMediaData = async (source: DataSource) => {
    try {
      console.log(`正在載入 ${source} 的社群媒體資料...`);

      let allPosts: SocialMediaPost[] = [];

      // Load data based on source
      if (source === 'threads') {
        // Load all threads data files
        try {
          const threadsEconomic = await import('@/data/social-media/threads_economic_policy.json');
          const threadsSocial = await import('@/data/social-media/threads_social_welfare.json');
          allPosts = [...threadsEconomic.default, ...threadsSocial.default];
        } catch (error) {
          console.error('Error loading threads data:', error);
          // Fallback to fetch
          const [economicRes, socialRes] = await Promise.all([
            fetch('/src/data/social-media/threads_economic_policy.json'),
            fetch('/src/data/social-media/threads_social_welfare.json')
          ]);

          if (economicRes.ok && socialRes.ok) {
            const [economic, social] = await Promise.all([
              economicRes.json(),
              socialRes.json()
            ]);
            allPosts = [...economic, ...social];
          }
        }
      } else if (source === 'twitter') {
        // Load twitter data
        try {
          const twitterData = await import('@/data/social-media/twitter_international_politics.json');
          allPosts = twitterData.default.map((post: any) => ({
            ...post,
            post_id: post.tweet_id,
            post_text: post.tweet_text,
            repost_count: 0
          }));
        } catch (error) {
          console.error('Error loading twitter data:', error);
          // Fallback to fetch
          const response = await fetch('/src/data/social-media/twitter_international_politics.json');
          if (response.ok) {
            allPosts = await response.json();
          }
        }
      }

      setSocialMediaPosts(allPosts);
      setDataStats({
        total_files: 1,
        total_records: allPosts.length,
        latest_update: new Date().toISOString().split('T')[0],
      });

      console.log(`成功載入 ${allPosts.length} 則貼文`);

    } catch (error) {
      console.error('載入社群媒體資料失敗:', error);
      setSocialMediaPosts([]);
    }
  };

  // Load available files for selected source
  const loadAvailableFiles = async (source: DataSource) => {
    try {
      // For social media sources, load JSON data directly
      if (source === 'threads' || source === 'twitter') {
        await loadSocialMediaData(source);
        return;
      }

      // For petition system, use mock data
      if (source === 'petition') {
        setDataStats({
          total_files: 1,
          total_records: mockPetitions.length,
          latest_update: new Date().toISOString().split('T')[0],
        });
        return;
      }

      // For other sources, use API
      console.log(`正在載入 ${source} 的檔案列表...`);
      const response = await fetch(`http://localhost:8021/api/sandbox/files?source=${source}`);

      if (response.ok) {
        const files = await response.json();
        console.log(`成功載入 ${files.length} 個檔案`);

        const filesWithCount = files.map((file: any) => ({
          ...file,
          recordCount: Math.floor(Math.random() * 2000) + 500
        }));

        setAvailableFiles(filesWithCount);
        setDataStats({
          total_files: filesWithCount.length,
          total_records: filesWithCount.reduce((sum: number, f: any) => sum + (f.recordCount || 0), 0),
          latest_update: filesWithCount[0]?.date || '',
        });
      } else {
        console.error('API 回應錯誤:', response.status, await response.text());
        throw new Error(`API 錯誤: ${response.status}`);
      }
    } catch (error) {
      console.error('載入檔案失敗:', error);
      setAvailableFiles([]);
      setSocialMediaPosts([]);
    }
  };

  // Refresh data for selected source
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log(`正在刷新 ${selectedSource} 資料...`);
      await loadAvailableFiles(selectedSource);
      console.log('資料刷新完成');
    } catch (error) {
      console.error('刷新資料時發生錯誤:', error);
    } finally {
      setIsRefreshing(false);
    }
  };



  useEffect(() => {
    loadAvailableFiles(selectedSource);
    // Reset view mode to data when switching sources
    setViewMode('data');
  }, [selectedSource]);

  // Load initial data on component mount
  useEffect(() => {
    loadAvailableFiles('threads');
  }, []);

  // Authentication handlers
  const handleAuth = async (source: DataSource) => {
    setIsAuthenticating(true);
    try {
      // Here you would integrate with the actual authentication API
      console.log(`Authenticating with ${source}...`);

      // For now, we'll simulate successful authentication
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAuthenticatedSources(prev => new Set(prev).add(source));
      setShowWebview(true);

      console.log(`Successfully authenticated with ${source}`);
    } catch (error) {
      console.error(`Authentication failed for ${source}:`, error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const openWebview = (source: DataSource) => {
    if (authenticatedSources.has(source)) {
      setShowWebview(true);
      // Here you would open the webview with the authenticated session
      console.log(`Opening webview for ${source}`);
    } else {
      handleAuth(source);
    }
  };

  // 準備側邊欄項目數據
  const sidebarItems = dataSources.map((source) => ({
    id: source.id,
    icon: source.icon,
    label: source.name,
    isActive: selectedSource === source.id,
    onClick: () => setSelectedSource(source.id),
    color: (selectedSource === source.id ? 'orange' : 'blue') as "orange" | "blue" | "green" | "purple" | "gray" | "red"
  }));

  const handleAddNew = () => {
    // 創建新數據源的邏輯
    console.log('創建新數據源');
  };

  return (
    <div className={cn("h-full flex overflow-hidden", className)}>
      {/* Left Icon Sidebar */}
      <IconSidebar
        items={sidebarItems}
        onAddNew={handleAddNew}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center">
                  {React.createElement(dataSources.find(s => s.id === selectedSource)?.icon || FileText)}
                </span>
                {dataSources.find(s => s.id === selectedSource)?.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {dataSources.find(s => s.id === selectedSource)?.description}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {/* Refresh Button */}
              {viewMode === 'data' && (selectedSource === 'threads' || selectedSource === 'twitter' || selectedSource === 'petition') && (
                <Button
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "更新中..." : "重新整理"}
                </Button>
              )}

              {/* View Mode Toggle for Social Media Sources */}
              {(selectedSource === 'threads' || selectedSource === 'twitter') && (
                <div className="flex rounded-lg border bg-background p-1">
                  <Button
                    onClick={() => setViewMode('data')}
                    variant={viewMode === 'data' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3 text-xs"
                  >
                    <FileType className="w-3 h-3 mr-1" />
                    資料
                  </Button>
                  <Button
                    onClick={() => setViewMode('webview')}
                    variant={viewMode === 'webview' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3 text-xs"
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    網頁
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'webview' && (selectedSource === 'threads' || selectedSource === 'twitter') ? (
            // Social Media Webview Mode
            <div className="w-full h-full">
              <BrowserView
                url={dataSources.find(s => s.id === selectedSource)?.webUrl || ''}
                mode="web"
              />
            </div>
          ) : (
            // Data Mode
            <div className="h-full overflow-y-auto p-4">
              {selectedSource === 'petition' ? (
                // Petition System View
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground">共 {mockPetitions.length} 件陳情案件</h4>
                    <div className="flex gap-2">
                      {['全部', '交通運輸', '公共設施', '環境品質', '社會福利'].map((category) => (
                        <Button key={category} variant="outline" size="sm" className="text-xs">
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {mockPetitions.map((petition) => (
                      <Card
                        key={petition.id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:border-orange-400"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  {petition.category}
                                </span>
                                <span className={cn(
                                  "text-xs px-2 py-1 rounded",
                                  petition.status === 'pending' && "bg-yellow-100 text-yellow-800",
                                  petition.status === 'processing' && "bg-blue-100 text-blue-800",
                                  petition.status === 'resolved' && "bg-green-100 text-green-800"
                                )}>
                                  {petition.status === 'pending' && '待處理'}
                                  {petition.status === 'processing' && '處理中'}
                                  {petition.status === 'resolved' && '已解決'}
                                </span>
                              </div>
                              <h5 className="font-medium text-sm text-foreground mb-1">{petition.title}</h5>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{petition.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{petition.date}</span>
                                <span>案件編號: {petition.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (selectedSource === 'threads' || selectedSource === 'twitter') && socialMediaPosts.length > 0 ? (
                // Social Media Posts View
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      共 {socialMediaPosts.length} 則 {dataSources.find(s => s.id === selectedSource)?.name} 貼文
                    </h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs">按時間排序</Button>
                      <Button variant="outline" size="sm" className="text-xs">按熱門度排序</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {socialMediaPosts.map((post) => (
                      <Card
                        key={post.post_id}
                        className="overflow-hidden hover:shadow-md transition-all duration-200 hover:border-blue-400"
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {React.createElement(dataSources.find(s => s.id === selectedSource)?.icon || MessageSquare, {
                                className: "w-6 h-6 text-gray-600"
                              })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm text-foreground">
                                  {post.author_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {post.author_username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • {post.author_followers_count.toLocaleString()} 粉絲
                                </span>
                              </div>

                              <p className="text-sm text-foreground mb-3 leading-relaxed">
                                {post.post_text}
                              </p>

                              {post.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {post.hashtags.map((tag, index) => (
                                    <span key={index} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {post.reply_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" />
                                  {post.repost_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-3 h-3 text-red-500">♥</span>
                                  {post.like_count}
                                </span>
                                <span className="ml-auto">
                                  {new Date(post.created_time).toLocaleString('zh-TW')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (selectedSource === 'threads' || selectedSource === 'twitter') && socialMediaPosts.length === 0 ? (
                // Loading or Empty Social Media View
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <div className="mb-4">
                    {React.createElement(dataSources.find(s => s.id === selectedSource)?.icon || FileText, {
                      className: "w-12 h-12 opacity-50"
                    })}
                  </div>
                  <p className="text-sm mb-2">載入 {dataSources.find(s => s.id === selectedSource)?.name} 資料中...</p>
                  <p className="text-xs text-muted-foreground">如果持續沒有資料，請檢查檔案路徑是否正確</p>
                </div>
              ) : (
                // File List View (for other sources)
                availableFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Database className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm">沒有可用的資料</p>
                    <p className="text-xs mt-1">請點擊刷新資料按鈕載入資料</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableFiles.map((file) => (
                      <Card
                        key={file.filename}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:border-orange-400"
                        onClick={() => onOpenDataTab(selectedSource, file)}
                      >
                        <div className="p-4">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-foreground">{file.date} {file.time}</div>
                              <div className="text-xs text-muted-foreground">{file.filename}</div>
                              {file.recordCount && (
                                <div className="text-xs text-orange-600 font-medium">{file.recordCount} 筆資料</div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              點擊開啟
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligencePage;
