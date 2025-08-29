import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Database, MessageSquare, FileText, BarChart3, Plus, Search, LogIn, ExternalLink, Globe, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import IconSidebar from '@/components/ui/IconSidebar';
import BrowserView from '@/components/BrowserView';
import { cn } from '@/utils/cn';

// Social media post interface (unified structure)
interface SocialMediaPost {
  post_id: string;
  author_id?: string;
  author_name?: string;
  author_username?: string;
  author_followers_count?: number;
  post_text: string;
  hashtags?: string[];
  mentions?: string[];
  emojis?: string[];
  like_count?: number;
  reply_count?: number;
  repost_count?: number;
  quote_count?: number;
  created_time?: string;
  // Facebook specific
  page_or_user_name?: string;
  page_or_user_id?: string;
  reaction_summary?: any;
  share_count?: number;
  comment_count?: number;
  // PTT specific
  board?: string;
  title?: string;
  push_count?: number;
  boo_count?: number;
  // Twitter specific
  tweet_id?: string;
  tweet_text?: string;
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

const FacebookLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-4 h-4", className)}>
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-blue-600">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  </div>
);

const PTTLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-4 h-4 rounded bg-orange-600 flex items-center justify-center text-white text-xs font-bold", className)}>
    P
  </div>
);

type DataSource = 'threads' | 'twitter' | 'facebook' | 'ptt' | 'petition';

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
  topic: string;
  user_quote: string;
  issue_analysis: string;
  id?: string;
  date?: string;
  status?: 'pending' | 'processing' | 'resolved';
}

interface IntelligencePageProps {
  onOpenDataTab: (source: DataSource, file: DataFile, data?: any[]) => void;
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
    id: 'facebook' as DataSource,
    name: 'Facebook',
    description: 'Facebook 社群媒體平台',
    icon: FacebookLogo,
    color: 'text-blue-600',
    requiresAuth: true,
    webUrl: 'https://facebook.com',
  },
  {
    id: 'ptt' as DataSource,
    name: 'PTT',
    description: 'PTT 批踢踢實業坊',
    icon: PTTLogo,
    color: 'text-orange-600',
    requiresAuth: false,
    webUrl: 'https://www.ptt.cc/bbs/index.html',
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
    id: '2025001',
    topic: '交通安全',
    user_quote: '每天走路去市場都要閃機車，整條人行道都被停滿，老人小孩很危險，政府怎麼都不管？',
    issue_analysis: '人行道長期被違規停車佔用，影響行人通行，需政府加強取締並改善人行空間。',
    date: '2025-08-20',
    status: 'processing'
  },
  {
    id: '2025002',
    topic: '環境污染',
    user_quote: '晚上工廠一開工就整個臭味飄過來，窗戶都不能開，住這裡快喘不過氣了！',
    issue_analysis: '工廠排放廢氣造成空氣污染，居民生活品質受影響，需環保單位稽查並改善。',
    date: '2025-08-18',
    status: 'pending'
  },
  {
    id: '2025003',
    topic: '醫療資源不足',
    user_quote: '這裡看病要跑一小時去市區，老人有急病都拖很久才送醫，希望政府派醫生來駐點。',
    issue_analysis: '偏鄉缺乏醫療人力與設施，病患就醫困難，民眾希望政府增派醫療資源或巡迴服務。',
    date: '2025-08-15',
    status: 'resolved'
  },
  {
    id: '2025004',
    topic: '社區治安',
    user_quote: '最近鄰居被偷好幾次，大家晚上都不敢出門，警察都沒來巡邏，太不安心了。',
    issue_analysis: '社區竊案頻傳，居民缺乏安全感，需要警方加強巡邏與防治措施。',
    date: '2025-08-12',
    status: 'processing'
  },
  {
    id: '2025005',
    topic: '教育資源',
    user_quote: '學校電風扇壞掉好幾年，夏天小孩熱到受不了，為什麼都沒人修？',
    issue_analysis: '校園基礎設施不足，影響學童學習環境，居民要求教育單位改善並撥款整修。',
    date: '2025-08-10',
    status: 'pending'
  },
  {
    id: '2025006',
    topic: '土地徵收爭議',
    user_quote: '我們祖傳的農地被徵收，賠償金根本不夠買新的地，怎麼生活？',
    issue_analysis: '政府徵收農地，補償金額過低，民眾認為不公，需要重新檢討徵收與補償機制。',
    date: '2025-08-08',
    status: 'processing'
  },
  {
    id: '2025007',
    topic: '社會福利',
    user_quote: '我要幫媽媽申請身障補助，文件一大堆，跑了三次還被退件，真的很累！',
    issue_analysis: '身心障礙者補助流程過於複雜，民眾希望簡化申請程序並提供更友善的窗口。',
    date: '2025-08-05',
    status: 'resolved'
  },
  {
    id: '2025008',
    topic: '基礎建設',
    user_quote: '每天騎車都要閃坑洞，朋友還摔倒受傷，為什麼路都沒修？',
    issue_analysis: '道路長期未維修，坑洞影響用路人安全，民眾要求政府立即修補道路。',
    date: '2025-08-03',
    status: 'processing'
  },
  {
    id: '2025009',
    topic: '公共交通',
    user_quote: '上班時間公車常常滿了上不去，等下一班又要半小時，真的很不方便！',
    issue_analysis: '公車班次不足，尖峰時段無法滿足需求，民眾希望增加班次以改善通勤困境。',
    date: '2025-08-01',
    status: 'pending'
  },
  {
    id: '2025010',
    topic: '物價與民生',
    user_quote: '菜價一直漲，薪水沒漲，低收入家庭真的快撐不下去，希望政府幫幫忙。',
    issue_analysis: '物價上升造成低收入戶生活壓力，民眾期望政府提供補貼或津貼支援。',
    date: '2025-07-28',
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
            post_id: post.tweet_id || post.post_id,
            post_text: post.tweet_text || post.post_text,
            repost_count: post.repost_count || 0,
            author_name: post.author_name || post.author_username,
            created_time: post.created_time || new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error loading twitter data:', error);
          // Fallback to fetch
          const response = await fetch('/src/data/social-media/twitter_international_politics.json');
          if (response.ok) {
            const data = await response.json();
            allPosts = data.map((post: any) => ({
              ...post,
              post_id: post.tweet_id || post.post_id,
              post_text: post.tweet_text || post.post_text,
              repost_count: post.repost_count || 0
            }));
          }
        }
      } else if (source === 'facebook') {
        // Load facebook data
        try {
          const facebookEdu = await import('@/data/social-media/facebook_education_policy.json');
          const facebookElection = await import('@/data/social-media/facebook_election_campaign.json');

          const processedFacebookData = [...facebookEdu.default, ...facebookElection.default].map((post: any) => ({
            ...post,
            author_name: post.page_or_user_name,
            author_id: post.page_or_user_id,
            like_count: post.reaction_summary?.like || 0,
            reply_count: post.comment_count || 0,
            repost_count: post.share_count || 0,
            author_followers_count: Math.floor(Math.random() * 50000) + 5000, // Mock followers
            created_time: post.created_time || new Date().toISOString()
          }));

          allPosts = processedFacebookData;
        } catch (error) {
          console.error('Error loading facebook data:', error);
          // Fallback to fetch
          const [eduRes, electionRes] = await Promise.all([
            fetch('/src/data/social-media/facebook_education_policy.json'),
            fetch('/src/data/social-media/facebook_election_campaign.json')
          ]);

          if (eduRes.ok && electionRes.ok) {
            const [edu, election] = await Promise.all([
              eduRes.json(),
              electionRes.json()
            ]);
            allPosts = [...edu, ...election].map((post: any) => ({
              ...post,
              author_name: post.page_or_user_name,
              like_count: post.reaction_summary?.like || 0,
              reply_count: post.comment_count || 0
            }));
          }
        }
      } else if (source === 'ptt') {
        // Load PTT data
        try {
          const pttData = await import('@/data/social-media/ptt_social_issues.json');

          const processedPTTData = pttData.default.map((post: any) => ({
            ...post,
            author_name: post.author_id,
            post_text: post.title + '\n\n' + post.post_text,
            like_count: post.push_count || 0,
            reply_count: (post.push_count || 0) + (post.boo_count || 0),
            repost_count: 0,
            author_followers_count: 0, // PTT doesn't have followers
            hashtags: post.hashtags || [],
            created_time: post.created_time || new Date().toISOString()
          }));

          allPosts = processedPTTData;
        } catch (error) {
          console.error('Error loading PTT data:', error);
          // Fallback to fetch
          const response = await fetch('/src/data/social-media/ptt_social_issues.json');
          if (response.ok) {
            const data = await response.json();
            allPosts = data.map((post: any) => ({
              ...post,
              author_name: post.author_id,
              post_text: post.title + '\n\n' + post.post_text,
              like_count: post.push_count || 0,
              reply_count: (post.push_count || 0) + (post.boo_count || 0)
            }));
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
      if (source === 'threads' || source === 'twitter' || source === 'facebook' || source === 'ptt') {
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
    <div className={cn("h-full flex overflow-hidden pb-14", className)}>
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
              {viewMode === 'data' && (selectedSource === 'threads' || selectedSource === 'twitter' || selectedSource === 'facebook' || selectedSource === 'ptt' || selectedSource === 'petition') && (
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
              {(selectedSource === 'threads' || selectedSource === 'twitter' || selectedSource === 'facebook' || selectedSource === 'ptt') && (
                <div className="flex gap-2">
                  {/* Analysis Button */}
                  {viewMode === 'data' && socialMediaPosts.length > 0 && (
                    <Button
                      onClick={() => {
                        // Map source to actual CSV filename (use the main policy file for each platform)
                        const getCSVFilename = (source: string) => {
                          switch (source) {
                            case 'facebook':
                              return 'facebook_election_campaign.csv'; // Use election campaign data for analysis
                            case 'threads':
                              return 'threads_economic_policy.csv'; // Use economic policy data for analysis
                            case 'twitter':
                              return 'twitter_international_politics.csv';
                            case 'ptt':
                              return 'ptt_social_issues.csv';
                            default:
                              return `${source}_analytics.csv`;
                          }
                        };

                        // Open analysis tab with current social media data
                        const analyticsData = {
                          filename: getCSVFilename(selectedSource),
                          date: new Date().toISOString().split('T')[0],
                          time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
                          fullPath: `analytics/${selectedSource}`,
                          recordCount: socialMediaPosts.length
                        };
                        // Pass the current social media posts data
                        onOpenDataTab(selectedSource, analyticsData, socialMediaPosts);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      分析資料
                    </Button>
                  )}

                  {/* View Mode Toggle */}
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
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'webview' && (selectedSource === 'threads' || selectedSource === 'twitter' || selectedSource === 'facebook' || selectedSource === 'ptt') ? (
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
                      {['全部', '交通安全', '環境污染', '社會福利', '基礎建設'].map((category) => (
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
                                  {petition.topic}
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
                              <div className="mb-2">
                                <h5 className="font-medium text-sm text-foreground mb-1">民眾陳述</h5>
                                <p className="text-xs text-gray-700 bg-gray-50 rounded p-2 italic mb-2">"{ petition.user_quote}"</p>
                                <h6 className="font-medium text-xs text-blue-700 mb-1">問題分析</h6>
                                <p className="text-xs text-muted-foreground line-clamp-2">{petition.issue_analysis}</p>
                              </div>
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
              ) : (selectedSource === 'threads' || selectedSource === 'twitter' || selectedSource === 'facebook' || selectedSource === 'ptt') && socialMediaPosts.length > 0 ? (
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
                                  {post.author_name || post.page_or_user_name || post.author_id || '匿名用戶'}
                                </span>
                                {post.author_username && (
                                  <span className="text-xs text-muted-foreground">
                                    {post.author_username}
                                  </span>
                                )}
                                {post.board && (
                                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                                    {post.board}
                                  </span>
                                )}
                                {post.author_followers_count && post.author_followers_count > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    • {post.author_followers_count.toLocaleString()} 粉絲
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-foreground mb-3 leading-relaxed">
                                {post.post_text}
                              </p>

                              {post.hashtags && post.hashtags.length > 0 && (
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
                                  {post.reply_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" />
                                  {post.repost_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-3 h-3 text-red-500">♥</span>
                                  {post.like_count || 0}
                                </span>
                                {post.push_count && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <span className="text-green-600">↑</span>
                                    {post.push_count}
                                  </span>
                                )}
                                {post.boo_count && (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <span className="text-red-600">↓</span>
                                    {post.boo_count}
                                  </span>
                                )}
                                <span className="ml-auto">
                                  {post.created_time ? new Date(post.created_time).toLocaleString('zh-TW') : '時間未知'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (selectedSource === 'threads' || selectedSource === 'twitter' || selectedSource === 'facebook' || selectedSource === 'ptt') && socialMediaPosts.length === 0 ? (
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
