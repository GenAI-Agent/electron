import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import {
  Globe,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  AlertCircle,
  Eye,
  Heart,
  Share2,
  Calendar,
  MapPin,
  Filter,
  RefreshCw,
  ExternalLink,
  FileText,
  CheckCircle,
  DollarSign
} from 'lucide-react';

interface IntelligenceHubPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
}

interface CountryData {
  country: string;
  countryCode: string;
  marketSize: number;
  growthRate: number;
  travelDemand: number;
  competitionLevel: 'low' | 'medium' | 'high';
  seasonality: string;
  keyInsights: string[];
  opportunities: string[];
  risks: string[];
  socialSentiment: number; // -100 to 100
}

interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'threads' | 'ptt';
  author: string;
  content: string;
  timestamp: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  relevanceScore: number;
}

interface TrendingTopic {
  topic: string;
  volume: number;
  sentiment: number;
  growth: number;
  relatedKeywords: string[];
  platforms: string[];
}

interface ComplaintData {
  id: string;
  date: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  channel: 'phone' | 'email' | 'social' | 'counter';
  description: string;
  customerType: 'business' | 'leisure' | 'frequent';
  route: string;
  resolution: string;
  resolutionTime: number; // hours
  satisfaction: number; // 1-5
  followUp: boolean;
}

interface CompanyPolicy {
  id: string;
  category: 'service' | 'baggage' | 'meal' | 'membership' | 'aircraft' | 'safety' | 'operations' | 'finance' | 'hr' | 'maintenance';
  title: string;
  description: string;
  lastUpdated: string;
  applicableRoutes: string[];
  exceptions: string[];
  relatedPolicies: string[];
}

interface ServiceStandard {
  service: string;
  category: string;
  standard: string;
  measurement: string;
  target: number;
  current: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface CouponActivity {
  id: string;
  name: string;
  type: 'coupon' | 'promotion' | 'event' | 'campaign';
  status: 'active' | 'ended' | 'planned';
  startDate: string;
  endDate: string;
  description: string;
  targetAudience: string[];
  discountType: 'percentage' | 'fixed' | 'free_upgrade' | 'bonus_miles';
  discountValue: number;
  conditions: string[];
  budget: number;
  expectedRevenue: number;
  actualRevenue?: number;
  expectedParticipation: number;
  actualParticipation?: number;
  performance: {
    conversionRate?: number;
    averageOrderValue?: number;
    customerAcquisition?: number;
    retentionRate?: number;
  };
  analysis: {
    successFactors: string[];
    failureReasons?: string[];
    varianceAnalysis: string;
    recommendations: string[];
  };
  channels: string[];
  relatedRoutes: string[];
}

// Mock data
const mockCountryData: CountryData[] = [
  {
    country: '日本',
    countryCode: 'JP',
    marketSize: 2500000,
    growthRate: 15.2,
    travelDemand: 85,
    competitionLevel: 'high',
    seasonality: '春秋旺季',
    keyInsights: [
      '櫻花季和楓葉季需求激增',
      '商務旅客偏好早班機',
      '年輕族群喜愛自由行'
    ],
    opportunities: [
      '增加關西地區航班',
      '推出賞櫻專案',
      '與日本旅行社合作'
    ],
    risks: [
      '日圓匯率波動',
      '競爭對手增班',
      '天災影響'
    ],
    socialSentiment: 72
  },
  {
    country: '韓國',
    countryCode: 'KR',
    marketSize: 1800000,
    growthRate: 22.8,
    travelDemand: 92,
    competitionLevel: 'medium',
    seasonality: '全年穩定',
    keyInsights: [
      'K-pop文化帶動年輕客群',
      '購物旅遊需求強勁',
      '週末短程旅行盛行'
    ],
    opportunities: [
      '與韓流明星合作行銷',
      '推出購物套裝行程',
      '增加釜山航線'
    ],
    risks: [
      '政治關係影響',
      '低成本航空競爭',
      '季節性需求波動'
    ],
    socialSentiment: 68
  },
  {
    country: '泰國',
    countryCode: 'TH',
    marketSize: 1200000,
    growthRate: 18.5,
    travelDemand: 78,
    competitionLevel: 'medium',
    seasonality: '冬季旺季',
    keyInsights: [
      '海島度假需求穩定',
      '醫療觀光興起',
      '背包客市場龐大'
    ],
    opportunities: [
      '開發醫療旅遊套裝',
      '與度假村合作',
      '推出長住方案'
    ],
    risks: [
      '政治不穩定',
      '天氣因素影響',
      '競爭激烈'
    ],
    socialSentiment: 45
  },
  {
    country: '新加坡',
    countryCode: 'SG',
    marketSize: 1500000,
    growthRate: 6.8,
    travelDemand: 88,
    competitionLevel: 'high',
    seasonality: '全年穩定',
    keyInsights: [
      '轉機客多',
      '高端旅客比例高',
      '商務旅行頻繁'
    ],
    opportunities: [
      '轉機服務優化',
      '高端客群服務',
      '商務合作'
    ],
    risks: [
      '樟宜機場競爭',
      '高營運成本',
      '市場飽和'
    ],
    socialSentiment: 75
  },
  {
    country: '香港',
    countryCode: 'HK',
    marketSize: 1200000,
    growthRate: -2.1,
    travelDemand: 65,
    competitionLevel: 'high',
    seasonality: '秋冬較佳',
    keyInsights: [
      '商務客為主',
      '兩岸三地樞紐',
      '政治敏感'
    ],
    opportunities: [
      '商務服務強化',
      '兩岸航線優勢',
      '金融客群開發'
    ],
    risks: [
      '政治不穩定',
      '疫情影響',
      '競爭激烈'
    ],
    socialSentiment: 45
  },
  {
    country: '馬來西亞',
    countryCode: 'MY',
    marketSize: 1100000,
    growthRate: 9.5,
    travelDemand: 76,
    competitionLevel: 'medium',
    seasonality: '避開雨季',
    keyInsights: [
      '穆斯林旅客多',
      '價格敏感',
      '家庭旅遊為主'
    ],
    opportunities: [
      '清真餐飲服務',
      '家庭套餐',
      '宗教節慶包機'
    ],
    risks: [
      '宗教文化差異',
      '匯率波動',
      '競爭加劇'
    ],
    socialSentiment: 62
  },
  {
    country: '越南',
    countryCode: 'VN',
    marketSize: 950000,
    growthRate: 18.7,
    travelDemand: 89,
    competitionLevel: 'low',
    seasonality: '春秋旺季',
    keyInsights: [
      '新興市場',
      '年輕人口多',
      '經濟快速成長'
    ],
    opportunities: [
      '市場開拓',
      '年輕客群',
      '商務航線'
    ],
    risks: [
      '基礎設施不足',
      '政策變化',
      '文化差異'
    ],
    socialSentiment: 78
  },
  {
    country: '菲律賓',
    countryCode: 'PH',
    marketSize: 850000,
    growthRate: 14.2,
    travelDemand: 83,
    competitionLevel: 'medium',
    seasonality: '避開颱風季',
    keyInsights: [
      '外勞市場大',
      '島嶼眾多',
      '價格競爭激烈'
    ],
    opportunities: [
      '外勞專機',
      '島際航線',
      '包機服務'
    ],
    risks: [
      '天災頻繁',
      '政治不穩',
      '基礎設施限制'
    ],
    socialSentiment: 58
  },
  {
    country: '美國',
    countryCode: 'US',
    marketSize: 650000,
    growthRate: 5.3,
    travelDemand: 72,
    competitionLevel: 'high',
    seasonality: '夏季旺季',
    keyInsights: [
      '長程航線',
      '商務客多',
      '服務要求高'
    ],
    opportunities: [
      '商務艙升級',
      '貨運服務',
      '代碼共享'
    ],
    risks: [
      '競爭激烈',
      '法規嚴格',
      '成本高'
    ],
    socialSentiment: 55
  }
];

const mockSocialPosts: SocialMediaPost[] = [
  // Threads 貼文
  {
    id: '1',
    platform: 'threads',
    author: '@travel_lover_tw',
    content: '剛從東京回來，這次搭的航班服務真的很棒！空服員超親切，餐點也很好吃 ✈️ #東京旅行 #航空體驗',
    timestamp: '2025-09-01T10:30:00Z',
    engagement: { likes: 245, shares: 32, comments: 18 },
    sentiment: 'positive',
    topics: ['服務品質', '東京', '餐點'],
    relevanceScore: 92
  },
  {
    id: '2',
    platform: 'threads',
    author: '@backpacker_life',
    content: '華航新的商務艙座椅真的很舒服，長途飛行終於可以好好休息了！推薦給經常出差的朋友們',
    timestamp: '2025-09-01T09:45:00Z',
    engagement: { likes: 189, shares: 24, comments: 12 },
    sentiment: 'positive',
    topics: ['商務艙', '座椅', '長途飛行'],
    relevanceScore: 90
  },
  {
    id: '3',
    platform: 'threads',
    author: '@frequent_flyer',
    content: '最近飛了好幾次，發現準點率真的有改善，但是登機流程還是有點慢，希望能再優化',
    timestamp: '2025-09-01T08:20:00Z',
    engagement: { likes: 156, shares: 18, comments: 25 },
    sentiment: 'neutral',
    topics: ['準點率', '登機流程', '服務改善'],
    relevanceScore: 88
  },
  {
    id: '4',
    platform: 'threads',
    author: '@travel_blogger',
    content: '日本航線的機上娛樂系統更新了！新增了很多熱門電影和音樂，飛行時間過得特別快',
    timestamp: '2025-08-31T22:15:00Z',
    engagement: { likes: 203, shares: 41, comments: 16 },
    sentiment: 'positive',
    topics: ['機上娛樂', '日本航線', '電影'],
    relevanceScore: 85
  },
  {
    id: '5',
    platform: 'threads',
    author: '@family_travel',
    content: '帶小孩搭飛機真的不容易，但是空服員很貼心地提供了兒童餐具和玩具，小朋友很開心',
    timestamp: '2025-08-31T20:30:00Z',
    engagement: { likes: 178, shares: 29, comments: 22 },
    sentiment: 'positive',
    topics: ['親子旅行', '兒童服務', '空服員'],
    relevanceScore: 82
  },
  {
    id: '6',
    platform: 'threads',
    author: '@budget_traveler',
    content: '經濟艙的座位空間還是有點擠，希望能像其他航空公司一樣增加腿部空間',
    timestamp: '2025-08-31T18:45:00Z',
    engagement: { likes: 134, shares: 15, comments: 31 },
    sentiment: 'negative',
    topics: ['經濟艙', '座位空間', '舒適度'],
    relevanceScore: 79
  },
  {
    id: '7',
    platform: 'threads',
    author: '@digital_nomad',
    content: '機上WiFi速度還不錯，可以正常工作和視訊會議，對商務旅客來說很重要',
    timestamp: '2025-08-31T16:20:00Z',
    engagement: { likes: 167, shares: 22, comments: 14 },
    sentiment: 'positive',
    topics: ['機上WiFi', '商務旅客', '網路服務'],
    relevanceScore: 86
  },

  // PTT 貼文
  {
    id: '8',
    platform: 'ptt',
    author: 'TravelExpert',
    content: '最近韓國機票價格有點高，是不是因為演唱會季節的關係？有沒有人知道什麼時候會降價？',
    timestamp: '2025-09-01T09:15:00Z',
    engagement: { likes: 156, shares: 8, comments: 45 },
    sentiment: 'neutral',
    topics: ['韓國', '票價', '演唱會'],
    relevanceScore: 88
  },
  {
    id: '9',
    platform: 'ptt',
    author: 'FlightDeals',
    content: '[情報] 華航日本線促銷開跑！東京來回15000起，大阪13500起，限時一週',
    timestamp: '2025-09-01T07:30:00Z',
    engagement: { likes: 289, shares: 67, comments: 52 },
    sentiment: 'positive',
    topics: ['促銷', '日本線', '票價優惠'],
    relevanceScore: 95
  },
  {
    id: '10',
    platform: 'ptt',
    author: 'AirlineReview',
    content: '[心得] 華航A350新機體驗心得，座椅舒適度大幅提升，但餐點還有改善空間',
    timestamp: '2025-08-31T23:45:00Z',
    engagement: { likes: 234, shares: 43, comments: 38 },
    sentiment: 'neutral',
    topics: ['A350', '座椅', '餐點'],
    relevanceScore: 91
  },
  {
    id: '11',
    platform: 'ptt',
    author: 'FrequentFlyer',
    content: '[問題] 華航會員升等機制改了嗎？最近幾次都沒有升等成功',
    timestamp: '2025-08-31T21:20:00Z',
    engagement: { likes: 145, shares: 12, comments: 67 },
    sentiment: 'negative',
    topics: ['會員升等', '升等機制', '會員服務'],
    relevanceScore: 84
  },
  {
    id: '12',
    platform: 'ptt',
    author: 'TaiwanTraveler',
    content: '[討論] 台灣航空業競爭激烈，華航如何保持競爭優勢？',
    timestamp: '2025-08-31T19:10:00Z',
    engagement: { likes: 198, shares: 35, comments: 89 },
    sentiment: 'neutral',
    topics: ['競爭優勢', '航空業', '市場分析'],
    relevanceScore: 87
  },
  {
    id: '13',
    platform: 'ptt',
    author: 'ServiceWatch',
    content: '[抱怨] 客服電話等了40分鐘才接通，改票服務效率需要改善',
    timestamp: '2025-08-31T17:30:00Z',
    engagement: { likes: 167, shares: 28, comments: 41 },
    sentiment: 'negative',
    topics: ['客服', '改票服務', '等待時間'],
    relevanceScore: 83
  },
  {
    id: '14',
    platform: 'ptt',
    author: 'MileageRunner',
    content: '[心得] 華航哩程兌換攻略，教你如何最大化哩程價值',
    timestamp: '2025-08-31T15:45:00Z',
    engagement: { likes: 312, shares: 78, comments: 56 },
    sentiment: 'positive',
    topics: ['哩程兌換', '會員權益', '攻略'],
    relevanceScore: 89
  },

  // Twitter 貼文
  {
    id: '15',
    platform: 'twitter',
    author: '@aviation_news',
    content: 'China Airlines announces new route to Seattle starting December 2025. Great news for Taiwan-US connectivity! #ChinaAirlines #Seattle',
    timestamp: '2025-09-01T11:20:00Z',
    engagement: { likes: 445, shares: 89, comments: 34 },
    sentiment: 'positive',
    topics: ['新航線', '西雅圖', '台美航線'],
    relevanceScore: 93
  },
  {
    id: '16',
    platform: 'twitter',
    author: '@travel_insider',
    content: 'Impressed by @ChinaAirlines new premium economy seats. Much better legroom and service compared to competitors.',
    timestamp: '2025-09-01T10:15:00Z',
    engagement: { likes: 267, shares: 45, comments: 28 },
    sentiment: 'positive',
    topics: ['豪華經濟艙', '座位', '競爭比較'],
    relevanceScore: 88
  },
  {
    id: '17',
    platform: 'twitter',
    author: '@flight_deals',
    content: '🔥 Flash Sale Alert! @ChinaAirlines Tokyo flights from $299 roundtrip. Book by Sept 15th! #FlightDeals #Tokyo',
    timestamp: '2025-09-01T08:30:00Z',
    engagement: { likes: 523, shares: 156, comments: 67 },
    sentiment: 'positive',
    topics: ['快閃促銷', '東京', '優惠價格'],
    relevanceScore: 96
  },
  {
    id: '18',
    platform: 'twitter',
    author: '@airline_critic',
    content: '@ChinaAirlines needs to improve their mobile app. Booking process is still clunky compared to other carriers.',
    timestamp: '2025-08-31T22:45:00Z',
    engagement: { likes: 189, shares: 34, comments: 52 },
    sentiment: 'negative',
    topics: ['手機App', '訂票流程', '用戶體驗'],
    relevanceScore: 81
  },
  {
    id: '19',
    platform: 'twitter',
    author: '@business_travel',
    content: 'Excellent service on @ChinaAirlines TPE-NRT route today. Crew was professional and meal quality has improved significantly.',
    timestamp: '2025-08-31T20:20:00Z',
    engagement: { likes: 234, shares: 41, comments: 19 },
    sentiment: 'positive',
    topics: ['台北成田', '機組服務', '餐點品質'],
    relevanceScore: 90
  },
  {
    id: '20',
    platform: 'twitter',
    author: '@eco_traveler',
    content: 'Appreciate @ChinaAirlines commitment to sustainability. New fuel-efficient aircraft and reduced plastic usage. 🌱 #SustainableTravel',
    timestamp: '2025-08-31T18:10:00Z',
    engagement: { likes: 178, shares: 67, comments: 23 },
    sentiment: 'positive',
    topics: ['永續發展', '環保', '燃油效率'],
    relevanceScore: 85
  }
];

const mockTrendingTopics: TrendingTopic[] = [
  {
    topic: '日本賞櫻',
    volume: 15420,
    sentiment: 85,
    growth: 45,
    relatedKeywords: ['櫻花', '東京', '京都', '賞花'],
    platforms: ['instagram', 'facebook', 'threads']
  },
  {
    topic: '韓國演唱會',
    volume: 12350,
    sentiment: 78,
    growth: 32,
    relatedKeywords: ['BTS', 'BLACKPINK', '首爾', 'K-pop'],
    platforms: ['twitter', 'instagram', 'threads']
  },
  {
    topic: '泰國海島',
    volume: 8920,
    sentiment: 72,
    growth: -8,
    relatedKeywords: ['普吉島', '蘇美島', '海灘', '度假'],
    platforms: ['facebook', 'instagram']
  }
];

// Mock complaint data
const mockComplaintData: ComplaintData[] = [
  {
    id: 'C001',
    date: '2025-09-01',
    category: '班機延誤',
    severity: 'high',
    channel: 'phone',
    description: 'CI123班機延誤3小時，導致錯過重要會議，要求賠償',
    customerType: 'business',
    route: 'TPE-NRT',
    resolution: '提供餐券、住宿券，並安排隔日優先座位',
    resolutionTime: 4,
    satisfaction: 3,
    followUp: true
  },
  {
    id: 'C002',
    date: '2025-09-01',
    category: '行李問題',
    severity: 'medium',
    channel: 'counter',
    description: '行李在轉機時遺失，內有重要文件和個人物品',
    customerType: 'leisure',
    route: 'TPE-BKK',
    resolution: '48小時內找回行李，提供臨時用品補償',
    resolutionTime: 48,
    satisfaction: 4,
    followUp: false
  },
  {
    id: 'C003',
    date: '2025-08-31',
    category: '餐點服務',
    severity: 'low',
    channel: 'social',
    description: '素食餐點口味不佳，希望改善菜單選擇',
    customerType: 'frequent',
    route: 'TPE-ICN',
    resolution: '記錄意見，承諾改善素食選項',
    resolutionTime: 2,
    satisfaction: 3,
    followUp: true
  },
  {
    id: 'C004',
    date: '2025-08-30',
    category: '座位問題',
    severity: 'medium',
    channel: 'email',
    description: '預訂的靠窗座位被更換，影響觀景體驗',
    customerType: 'leisure',
    route: 'TPE-HKG',
    resolution: '提供下次航班座位優先選擇權',
    resolutionTime: 6,
    satisfaction: 4,
    followUp: false
  },
  {
    id: 'C005',
    date: '2025-08-29',
    category: '客服態度',
    severity: 'high',
    channel: 'phone',
    description: '客服人員態度不佳，處理問題效率低',
    customerType: 'business',
    route: 'TPE-SIN',
    resolution: '重新培訓該客服人員，提供額外補償',
    resolutionTime: 8,
    satisfaction: 2,
    followUp: true
  },
  {
    id: 'C006',
    date: '2025-08-28',
    category: '機上設備',
    severity: 'medium',
    channel: 'social',
    description: '娛樂系統故障，無法使用個人螢幕',
    customerType: 'frequent',
    route: 'TPE-LAX',
    resolution: '提供免費WiFi補償，下次航班升級優惠',
    resolutionTime: 12,
    satisfaction: 3,
    followUp: true
  },
  {
    id: 'C007',
    date: '2025-08-27',
    category: '登機程序',
    severity: 'low',
    channel: 'counter',
    description: '登機時間過長，隊伍混亂',
    customerType: 'leisure',
    route: 'TPE-BKK',
    resolution: '改善登機流程，增加工作人員',
    resolutionTime: 3,
    satisfaction: 4,
    followUp: false
  },
  {
    id: 'C008',
    date: '2025-08-26',
    category: '票價問題',
    severity: 'high',
    channel: 'email',
    description: '票價突然上漲，與預期不符',
    customerType: 'business',
    route: 'TPE-NRT',
    resolution: '提供價格保護，差額退還',
    resolutionTime: 24,
    satisfaction: 4,
    followUp: true
  },
  {
    id: 'C009',
    date: '2025-08-25',
    category: '行李損壞',
    severity: 'medium',
    channel: 'counter',
    description: '托運行李輪子損壞，要求賠償',
    customerType: 'leisure',
    route: 'TPE-ICN',
    resolution: '提供維修費用，下次航班免費托運',
    resolutionTime: 36,
    satisfaction: 4,
    followUp: false
  },
  {
    id: 'C010',
    date: '2025-08-24',
    category: '機上服務',
    severity: 'low',
    channel: 'social',
    description: '空服員服務態度良好，但餐點份量不足',
    customerType: 'frequent',
    route: 'TPE-HKG',
    resolution: '記錄意見，改善餐點份量',
    resolutionTime: 2,
    satisfaction: 4,
    followUp: true
  },
  {
    id: 'C011',
    date: '2025-08-23',
    category: '航班取消',
    severity: 'high',
    channel: 'phone',
    description: '航班因天氣取消，影響重要行程',
    customerType: 'business',
    route: 'TPE-SIN',
    resolution: '提供免費改期，住宿和餐飲補償',
    resolutionTime: 2,
    satisfaction: 3,
    followUp: true
  },
  {
    id: 'C012',
    date: '2025-08-22',
    category: '會員權益',
    severity: 'medium',
    channel: 'email',
    description: '會員積分未正確累積，影響升級權益',
    customerType: 'frequent',
    route: 'TPE-LAX',
    resolution: '補發積分，提供額外補償積分',
    resolutionTime: 48,
    satisfaction: 4,
    followUp: false
  },
  {
    id: 'C013',
    date: '2025-08-21',
    category: '機場服務',
    severity: 'low',
    channel: 'counter',
    description: '機場貴賓室設施老舊，需要更新',
    customerType: 'business',
    route: 'TPE-NRT',
    resolution: '記錄意見，規劃設施更新',
    resolutionTime: 1,
    satisfaction: 3,
    followUp: true
  },
  {
    id: 'C014',
    date: '2025-08-20',
    category: '網路服務',
    severity: 'medium',
    channel: 'social',
    description: '機上WiFi連線不穩定，影響工作',
    customerType: 'business',
    route: 'TPE-ICN',
    resolution: '提供網路費用退還，改善連線品質',
    resolutionTime: 18,
    satisfaction: 3,
    followUp: true
  },
  {
    id: 'C015',
    date: '2025-08-19',
    category: '兒童服務',
    severity: 'low',
    channel: 'email',
    description: '兒童餐點選擇有限，希望增加選項',
    customerType: 'leisure',
    route: 'TPE-BKK',
    resolution: '記錄意見，規劃兒童餐點改善',
    resolutionTime: 4,
    satisfaction: 4,
    followUp: true
  }
];

// Mock company policies
const mockCompanyPolicies: CompanyPolicy[] = [
  // 服務政策
  {
    id: 'P001',
    category: 'service',
    title: '客戶服務標準作業程序',
    description: '24小時客服中心，多語言服務支援，客訴處理72小時內回覆，滿意度目標4.5分以上。',
    lastUpdated: '2025-08-15',
    applicableRoutes: ['所有航線'],
    exceptions: ['特殊節日可能延長回覆時間'],
    relatedPolicies: ['P002', 'P015']
  },
  {
    id: 'P002',
    category: 'service',
    title: '特殊需求乘客服務',
    description: '提供輪椅、視障、聽障等特殊需求乘客專屬服務，包含優先登機和專人協助。',
    lastUpdated: '2025-08-20',
    applicableRoutes: ['所有航線'],
    exceptions: ['部分小型機場設施有限'],
    relatedPolicies: ['P001', 'P003']
  },

  // 行李政策
  {
    id: 'P003',
    category: 'baggage',
    title: '行李重量與尺寸規定',
    description: '經濟艙免費托運行李23公斤，商務艙32公斤，手提行李7公斤。超重費用每公斤收費新台幣500元。',
    lastUpdated: '2025-08-15',
    applicableRoutes: ['所有航線'],
    exceptions: ['嬰兒推車', '輪椅', '樂器可額外攜帶'],
    relatedPolicies: ['P004', 'P005']
  },
  {
    id: 'P004',
    category: 'baggage',
    title: '危險物品運輸規定',
    description: '嚴格禁止攜帶易燃、易爆、腐蝕性物品。鋰電池需符合IATA規定，液體容器不得超過100ml。',
    lastUpdated: '2025-07-30',
    applicableRoutes: ['所有航線'],
    exceptions: ['醫療用品需提供證明'],
    relatedPolicies: ['P003', 'P012']
  },

  // 餐飲政策
  {
    id: 'P005',
    category: 'meal',
    title: '機上餐飲服務標準',
    description: '提供符合宗教、健康需求的特殊餐點，需於起飛前24小時預訂。長程航線提供正餐，短程提供輕食。',
    lastUpdated: '2025-08-20',
    applicableRoutes: ['長程航線提供正餐'],
    exceptions: ['短程航線僅提供輕食和飲料'],
    relatedPolicies: ['P006', 'P007']
  },
  {
    id: 'P006',
    category: 'meal',
    title: '食品安全與品質管控',
    description: '所有機上餐點均通過HACCP認證，供應商需符合國際食品安全標準，定期進行品質檢驗。',
    lastUpdated: '2025-08-10',
    applicableRoutes: ['所有航線'],
    exceptions: ['緊急情況可能影響餐點供應'],
    relatedPolicies: ['P005', 'P013']
  },

  // 會員政策
  {
    id: 'P007',
    category: 'membership',
    title: 'Dynasty Flyer會員權益',
    description: '會員可享受優先登機、免費升等、里程累積、貴賓室使用等專屬服務。分為金卡、白金卡、鑽石卡三個等級。',
    lastUpdated: '2025-07-30',
    applicableRoutes: ['所有航線'],
    exceptions: ['促銷票價不適用部分權益'],
    relatedPolicies: ['P008', 'P009']
  },
  {
    id: 'P008',
    category: 'membership',
    title: '里程累積與兌換規則',
    description: '飛行里程按艙等和航程計算，里程永久有效。可兌換免費機票、升等、購物折扣等獎勵。',
    lastUpdated: '2025-08-05',
    applicableRoutes: ['所有航線'],
    exceptions: ['特價票里程累積比例較低'],
    relatedPolicies: ['P007', 'P010']
  },

  // 機隊政策
  {
    id: 'P009',
    category: 'aircraft',
    title: '機隊配置與調度標準',
    description: '依據航線需求配置適當機型，確保燃油效率和乘客舒適度。定期進行機隊現代化更新。',
    lastUpdated: '2025-08-25',
    applicableRoutes: ['依航線需求配置'],
    exceptions: ['特殊情況可能調整機型'],
    relatedPolicies: ['P010', 'P011']
  },
  {
    id: 'P010',
    category: 'aircraft',
    title: '座位配置與舒適度標準',
    description: '經濟艙座椅間距31-32吋，商務艙可平躺，頭等艙私人套房。提供機上娛樂系統和WiFi服務。',
    lastUpdated: '2025-08-15',
    applicableRoutes: ['長程航線配備完整設施'],
    exceptions: ['部分短程航線設施簡化'],
    relatedPolicies: ['P009', 'P014']
  },

  // 安全政策
  {
    id: 'P011',
    category: 'safety',
    title: '飛行安全管理系統',
    description: '建立完整的安全管理系統(SMS)，定期進行安全風險評估，確保符合國際民航組織(ICAO)標準。',
    lastUpdated: '2025-08-30',
    applicableRoutes: ['所有航線'],
    exceptions: ['無例外，安全為最高優先'],
    relatedPolicies: ['P012', 'P013']
  },
  {
    id: 'P012',
    category: 'safety',
    title: '機組人員訓練與認證',
    description: '所有機組人員需通過嚴格訓練和定期複訓，包含緊急應變、醫療急救、安全程序等項目。',
    lastUpdated: '2025-08-20',
    applicableRoutes: ['所有航線'],
    exceptions: ['新進人員需完成初訓才能執勤'],
    relatedPolicies: ['P011', 'P016']
  },

  // 營運政策
  {
    id: 'P013',
    category: 'operations',
    title: '航班準點率管理',
    description: '目標準點率85%以上，建立完整的延誤預警系統，優化地勤作業流程，減少非天候因素延誤。',
    lastUpdated: '2025-08-28',
    applicableRoutes: ['所有航線'],
    exceptions: ['天候因素不可抗力延誤'],
    relatedPolicies: ['P014', 'P015']
  },
  {
    id: 'P014',
    category: 'operations',
    title: '地勤服務標準',
    description: '提供高效率的報到、行李處理、登機服務。VIP客戶享有專屬櫃檯和快速通關服務。',
    lastUpdated: '2025-08-22',
    applicableRoutes: ['主要機場提供完整服務'],
    exceptions: ['小型機場服務項目可能簡化'],
    relatedPolicies: ['P013', 'P001']
  },

  // 財務政策
  {
    id: 'P015',
    category: 'finance',
    title: '票價政策與退改規定',
    description: '提供彈性票價選擇，包含經濟、豪華經濟、商務、頭等艙。退改費用依票價類型而定。',
    lastUpdated: '2025-08-18',
    applicableRoutes: ['所有航線'],
    exceptions: ['特價票退改限制較嚴格'],
    relatedPolicies: ['P016', 'P007']
  },
  {
    id: 'P016',
    category: 'finance',
    title: '燃油附加費調整機制',
    description: '依據國際油價波動調整燃油附加費，每月檢討一次，提前30天公告調整幅度。',
    lastUpdated: '2025-08-25',
    applicableRoutes: ['所有航線'],
    exceptions: ['政府管制航線可能有特殊規定'],
    relatedPolicies: ['P015', 'P009']
  },

  // 人力資源政策
  {
    id: 'P017',
    category: 'hr',
    title: '員工培訓與發展計畫',
    description: '提供完整的職涯發展路徑，包含專業技能、語言能力、領導力培訓。鼓勵員工持續學習成長。',
    lastUpdated: '2025-08-12',
    applicableRoutes: ['適用於所有員工'],
    exceptions: ['試用期員工培訓項目簡化'],
    relatedPolicies: ['P018', 'P012']
  },
  {
    id: 'P018',
    category: 'hr',
    title: '員工福利與薪酬制度',
    description: '提供具競爭力的薪酬、完善的保險制度、員工旅遊優惠、退休金計畫等福利。',
    lastUpdated: '2025-08-08',
    applicableRoutes: ['適用於所有員工'],
    exceptions: ['兼職員工福利項目有所差異'],
    relatedPolicies: ['P017', 'P019']
  },

  // 維修政策
  {
    id: 'P019',
    category: 'maintenance',
    title: '飛機維修保養標準',
    description: '嚴格遵循製造商維修手冊，建立預防性維修制度，確保飛機適航性和安全性。',
    lastUpdated: '2025-08-30',
    applicableRoutes: ['所有機隊'],
    exceptions: ['緊急維修可能影響航班調度'],
    relatedPolicies: ['P020', 'P011']
  },
  {
    id: 'P020',
    category: 'maintenance',
    title: '維修人員資格認證',
    description: '所有維修人員需持有民航局核發的維修執照，定期接受複訓和技術更新課程。',
    lastUpdated: '2025-08-26',
    applicableRoutes: ['所有維修基地'],
    exceptions: ['學徒需在合格技師監督下作業'],
    relatedPolicies: ['P019', 'P017']
  }
];

// Mock service standards
const mockServiceStandards: ServiceStandard[] = [
  {
    service: '準點率',
    category: '營運',
    standard: '85%以上航班準時起飛',
    measurement: '起飛延誤15分鐘內',
    target: 85,
    current: 87.8,
    trend: 'improving'
  },
  {
    service: '客戶滿意度',
    category: '服務',
    standard: '4.0分以上(滿分5分)',
    measurement: '客戶回饋調查',
    target: 4.0,
    current: 4.2,
    trend: 'stable'
  },
  {
    service: '行李處理',
    category: '地勤',
    standard: '99.5%行李正確送達',
    measurement: '行李錯誤率統計',
    target: 99.5,
    current: 99.2,
    trend: 'declining'
  }
];

// Mock coupon and activity data
const mockCouponActivities: CouponActivity[] = [
  {
    id: 'CA001',
    name: '早鳥優惠券',
    type: 'coupon',
    status: 'active',
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    description: '提前30天訂票享8折優惠，適用於所有國際航線',
    targetAudience: ['商務旅客', '自由行旅客'],
    discountType: 'percentage',
    discountValue: 20,
    conditions: ['需提前30天訂票', '不可與其他優惠併用', '限國際航線'],
    budget: 5000000,
    expectedRevenue: 25000000,
    actualRevenue: 28000000,
    expectedParticipation: 5000,
    actualParticipation: 6200,
    performance: {
      conversionRate: 12.4,
      averageOrderValue: 4500,
      customerAcquisition: 1200,
      retentionRate: 68
    },
    analysis: {
      successFactors: ['提前訂票習慣培養', '價格敏感度分析準確', '目標客群定位精準'],
      failureReasons: [],
      varianceAnalysis: '實際營收超出預期12%，主要因為轉換率優於預期',
      recommendations: ['延長活動期間', '擴大適用航線', '增加宣傳力度']
    },
    channels: ['官網', 'APP', '旅行社', '社群媒體'],
    relatedRoutes: ['TPE-NRT', 'TPE-ICN', 'TPE-BKK', 'TPE-SIN']
  },
  {
    id: 'CA002',
    name: '會員專屬里程加倍',
    type: 'promotion',
    status: 'ended',
    startDate: '2025-06-01',
    endDate: '2025-08-31',
    description: 'Dynasty Flyer會員在指定航線飛行可獲得雙倍里程',
    targetAudience: ['現有會員', '高價值客戶'],
    discountType: 'bonus_miles',
    discountValue: 100,
    conditions: ['限Dynasty Flyer會員', '指定航線適用', '需在活動期間完成飛行'],
    budget: 3000000,
    expectedRevenue: 18000000,
    actualRevenue: 16500000,
    expectedParticipation: 3000,
    actualParticipation: 2800,
    performance: {
      conversionRate: 8.5,
      averageOrderValue: 5800,
      customerAcquisition: 450,
      retentionRate: 75
    },
    analysis: {
      successFactors: ['會員忠誠度提升', '高價值客戶參與度高'],
      failureReasons: ['宣傳力度不足', '適用航線限制過多', '活動期間較短'],
      varianceAnalysis: '實際營收低於預期8.3%，主要因為參與人數未達預期',
      recommendations: ['增加宣傳管道', '擴大適用航線', '延長活動期間', '簡化參與條件']
    },
    channels: ['會員通訊', '官網', 'APP'],
    relatedRoutes: ['TPE-NRT', 'TPE-ICN', 'TPE-BKK']
  },
  {
    id: 'CA003',
    name: '暑假親子遊專案',
    type: 'campaign',
    status: 'ended',
    startDate: '2025-07-01',
    endDate: '2025-08-31',
    description: '暑假期間推出親子旅遊套裝，包含機票、住宿、景點門票',
    targetAudience: ['家庭旅客', '親子旅遊'],
    discountType: 'fixed',
    discountValue: 2000,
    conditions: ['需購買套裝行程', '限暑假期間', '需包含至少一名兒童'],
    budget: 8000000,
    expectedRevenue: 40000000,
    actualRevenue: 52000000,
    expectedParticipation: 2000,
    actualParticipation: 2600,
    performance: {
      conversionRate: 15.2,
      averageOrderValue: 20000,
      customerAcquisition: 1800,
      retentionRate: 82
    },
    analysis: {
      successFactors: ['暑假需求強勁', '套裝行程便利性', '價格競爭力強', '目標客群精準'],
      failureReasons: [],
      varianceAnalysis: '實際營收超出預期30%，主要因為家庭旅遊市場需求超預期',
      recommendations: ['明年擴大規模', '增加更多目的地', '開發其他季節套裝']
    },
    channels: ['官網', '旅行社', '社群媒體', '親子網站'],
    relatedRoutes: ['TPE-NRT', 'TPE-ICN', 'TPE-BKK', 'TPE-SIN', 'TPE-HKG']
  },
  {
    id: 'CA004',
    name: '商務艙升等券',
    type: 'coupon',
    status: 'active',
    startDate: '2025-09-15',
    endDate: '2025-12-31',
    description: '購買經濟艙機票可加價升等至商務艙，限指定航線',
    targetAudience: ['商務旅客', '高價值客戶'],
    discountType: 'free_upgrade',
    discountValue: 5000,
    conditions: ['需購買經濟艙機票', '限指定航線', '需提前24小時申請'],
    budget: 2000000,
    expectedRevenue: 12000000,
    actualRevenue: 8500000,
    expectedParticipation: 800,
    actualParticipation: 650,
    performance: {
      conversionRate: 6.8,
      averageOrderValue: 13000,
      customerAcquisition: 320,
      retentionRate: 70
    },
    analysis: {
      successFactors: ['商務艙體驗提升', '價格優勢明顯'],
      failureReasons: ['申請流程複雜', '適用航線有限', '宣傳不足'],
      varianceAnalysis: '實際營收低於預期29.2%，主要因為參與人數和平均訂單金額都低於預期',
      recommendations: ['簡化申請流程', '擴大適用航線', '加強宣傳', '調整價格策略']
    },
    channels: ['官網', 'APP', '商務客戶專線'],
    relatedRoutes: ['TPE-NRT', 'TPE-ICN', 'TPE-BKK', 'TPE-SIN']
  },
  {
    id: 'CA005',
    name: '聖誕節特別活動',
    type: 'event',
    status: 'planned',
    startDate: '2025-12-20',
    endDate: '2025-12-31',
    description: '聖誕節期間推出特別活動，包含機上聖誕餐點、禮物抽獎',
    targetAudience: ['所有旅客', '節慶旅遊'],
    discountType: 'percentage',
    discountValue: 10,
    conditions: ['限聖誕節期間航班', '需提前預訂', '機上活動需參與'],
    budget: 1500000,
    expectedRevenue: 8000000,
    expectedParticipation: 1500,
    performance: {
      conversionRate: 0,
      averageOrderValue: 0,
      customerAcquisition: 0,
      retentionRate: 0
    },
    analysis: {
      successFactors: ['節慶氛圍營造', '機上體驗提升'],
      failureReasons: [],
      varianceAnalysis: '活動尚未開始，無法分析實際效果',
      recommendations: ['加強宣傳', '準備充足禮物', '培訓機組人員']
    },
    channels: ['官網', 'APP', '社群媒體', '旅行社'],
    relatedRoutes: ['TPE-NRT', 'TPE-ICN', 'TPE-BKK', 'TPE-SIN', 'TPE-HKG']
  }
];

export const IntelligenceHubPage: React.FC<IntelligenceHubPageProps> = ({
  className,
  onOpenDataTab
}) => {
  const [activeTab, setActiveTab] = useState<'countries' | 'social' | 'complaints' | 'policies' | 'coupons'>('social');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(mockCountryData[0]);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'twitter' | 'threads' | 'ptt'>('all');
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedPolicy, setSelectedPolicy] = useState<CompanyPolicy | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCompetitionColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPlatformIcon = (platform: string) => {
    // Return appropriate platform icon
    return <MessageSquare className="w-4 h-4" />;
  };

  const filteredSocialPosts = mockSocialPosts.filter(post =>
    (platformFilter === 'all' || post.platform === platformFilter)
  );

  const refreshData = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const exportData = (dataType: string) => {
    if (onOpenDataTab) {
      const mockFile = {
        filename: `intelligence_${dataType}_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        fullPath: `marketing-sandbox/intelligence_${dataType}.csv`
      };

      let data: any[] = [];
      switch (dataType) {
        case 'countries':
          data = mockCountryData;
          break;
        case 'social':
          data = mockSocialPosts;
          break;
      }

      onOpenDataTab('intelligence', mockFile, data);
    }
  };

  return (
    <div className={cn("h-full flex flex-col p-6 pb-16 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">智庫</h1>
            <p className="text-gray-600 mt-1">國家市場分析與實時社群情報</p>
          </div>

          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
              isRefreshing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? '更新中...' : '更新數據'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border mb-6 flex-shrink-0">
        {[
          { id: 'countries', name: '國家分析', icon: Globe },
          { id: 'social', name: '社群監控', icon: MessageSquare },
          { id: 'complaints', name: '客訴數據', icon: AlertCircle },
          { id: 'policies', name: '公司政策', icon: FileText },
          { id: 'coupons', name: '優惠券及活動', icon: Calendar }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
              activeTab === tab.id
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 min-h-0">
        {activeTab === 'countries' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Country List - 左側滑動 */}
            <div className="h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">目標市場</h3>
                <button
                  onClick={() => exportData('countries')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  匯出數據
                </button>
              </div>

              <div className="space-y-4 pr-2">
                {mockCountryData.map((country) => (
                  <div
                    key={country.countryCode}
                    className={cn(
                      "bg-white rounded-lg p-4 shadow-sm border cursor-pointer transition-colors",
                      selectedCountry?.countryCode === country.countryCode
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    )}
                    onClick={() => setSelectedCountry(country)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <h4 className="font-semibold text-gray-900">{country.country}</h4>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getCompetitionColor(country.competitionLevel)
                      )}>
                        {country.competitionLevel === 'low' ? '低競爭' :
                          country.competitionLevel === 'medium' ? '中競爭' : '高競爭'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">市場規模</p>
                        <p className="font-medium">{(country.marketSize / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-gray-600">成長率</p>
                        <p className="font-medium text-green-600">+{country.growthRate}%</p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">旅遊需求</span>
                        <span className="font-medium">{country.travelDemand}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${country.travelDemand}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Country Details */}
            <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
              {selectedCountry ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{selectedCountry.country} 市場分析</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">社群情緒</span>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-sm font-medium",
                        selectedCountry.socialSentiment > 60 ? "bg-green-50 text-green-600" :
                          selectedCountry.socialSentiment > 30 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                      )}>
                        {selectedCountry.socialSentiment}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">關鍵洞察</h4>
                      <ul className="space-y-2">
                        {selectedCountry.keyInsights.map((insight, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <Eye className="w-3 h-3 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">市場機會</h4>
                      <ul className="space-y-2">
                        {selectedCountry.opportunities.map((opportunity, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <TrendingUp className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {opportunity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">潛在風險</h4>
                      <ul className="space-y-2">
                        {selectedCountry.risks.map((risk, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <AlertCircle className="w-3 h-3 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{(selectedCountry.marketSize / 1000000).toFixed(1)}M</p>
                        <p className="text-sm text-gray-600">市場規模</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">+{selectedCountry.growthRate}%</p>
                        <p className="text-sm text-gray-600">年成長率</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{selectedCountry.travelDemand}%</p>
                        <p className="text-sm text-gray-600">旅遊需求</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{selectedCountry.seasonality}</p>
                        <p className="text-sm text-gray-600">季節特性</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>選擇一個國家查看詳細分析</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">社群媒體監控</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => exportData('social')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  匯出數據
                </button>
              </div>
            </div>

            {/* 平台選擇與貼文區塊 */}
            <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-320px)] flex flex-col">
              {/* 固定的平台選擇區 */}
              <div className="p-4 border-b sticky top-0 bg-white z-10">
                <h4 className="font-medium text-gray-900 mb-3">監控平台</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'all', name: '全部平台' },
                    { id: 'twitter', name: 'Twitter' },
                    { id: 'threads', name: 'Threads' },
                    { id: 'ptt', name: 'PTT' }
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setPlatformFilter(platform.id as any)}
                      className={cn(
                        "px-3 py-2 rounded-lg border transition-colors",
                        platformFilter === platform.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      )}
                    >
                      <span className="text-sm font-medium">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 可滾動的貼文區域 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredSocialPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg p-6 shadow-sm border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(post.platform)}
                          <span className="font-medium text-gray-900">{post.author}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium border",
                          getSentimentColor(post.sentiment)
                        )}>
                          {post.sentiment === 'positive' ? '正面' :
                            post.sentiment === 'negative' ? '負面' : '中性'}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">{post.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{post.engagement.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share2 className="w-4 h-4" />
                            <span>{post.engagement.shares}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.engagement.comments}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">相關度</span>
                          <span className="text-sm font-medium text-blue-600">{post.relevanceScore}%</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-1">
                          {post.topics.map((topic, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              #{topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Data Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">客訴原始數據</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    {(['all', 'high', 'medium', 'low'] as const).map((severity) => (
                      <button
                        key={severity}
                        onClick={() => setComplaintFilter(severity)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          complaintFilter === severity
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {severity === 'all' ? '全部' :
                          severity === 'high' ? '高' :
                            severity === 'medium' ? '中' : '低'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => onOpenDataTab && onOpenDataTab('complaints', {
                      filename: 'complaints_raw_data.csv',
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toTimeString().split(' ')[0],
                      fullPath: 'marketing-sandbox/complaints.csv'
                    }, mockComplaintData)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    匯出原始數據
                  </button>
                </div>
              </div>
            </div>

            {/* Complaints List */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-400px)]">
                {mockComplaintData
                  .filter(complaint => complaintFilter === 'all' || complaint.severity === complaintFilter)
                  .map((complaint) => (
                    <div key={complaint.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">#{complaint.id}</span>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            complaint.severity === 'high' ? "bg-red-50 text-red-600" :
                              complaint.severity === 'medium' ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"
                          )}>
                            {complaint.severity === 'high' ? '高嚴重' :
                              complaint.severity === 'medium' ? '中嚴重' : '低嚴重'}
                          </span>
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                            {complaint.category}
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{complaint.date}</p>
                          <p>{complaint.route}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-800 mb-2">{complaint.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>渠道: {complaint.channel}</span>
                          <span>客戶類型: {complaint.customerType}</span>
                          <span>處理時間: {complaint.resolutionTime}小時</span>
                          <span>滿意度: {complaint.satisfaction}/5</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded border-l-4 border-green-400">
                        <p className="text-sm text-gray-700">{complaint.resolution}</p>
                        {complaint.followUp && (
                          <p className="text-xs text-green-600 mt-1">✓ 需要後續追蹤</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Company Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Service Standards Overview */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">服務標準監控</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockServiceStandards.map((standard, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{standard.service}</h4>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        standard.trend === 'improving' ? "bg-green-50 text-green-600" :
                          standard.trend === 'declining' ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
                      )}>
                        {standard.trend === 'improving' ? '↗ 改善' :
                          standard.trend === 'declining' ? '↘ 下滑' : '→ 穩定'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{standard.standard}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">目標: {standard.target}%</span>
                      <span className={cn(
                        "font-bold",
                        standard.current >= standard.target ? "text-green-600" : "text-red-600"
                      )}>
                        {standard.current}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Policies Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Policy List */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">公司政策</h3>
                  <button
                    onClick={() => onOpenDataTab && onOpenDataTab('policies', {
                      filename: 'company_policies.csv',
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toTimeString().split(' ')[0],
                      fullPath: 'marketing-sandbox/policies.csv'
                    }, mockCompanyPolicies)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    匯出政策數據
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[calc(60vh-270px)]">
                  {mockCompanyPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedPolicy?.id === policy.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{policy.title}</h4>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          policy.category === 'service' ? "bg-blue-50 text-blue-600" :
                            policy.category === 'baggage' ? "bg-green-50 text-green-600" :
                              policy.category === 'meal' ? "bg-yellow-50 text-yellow-600" :
                                policy.category === 'membership' ? "bg-purple-50 text-purple-600" :
                                  policy.category === 'aircraft' ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
                        )}>
                          {policy.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                      <p className="text-xs text-gray-500">更新日期: {policy.lastUpdated}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Details */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">政策詳情</h3>

                {selectedPolicy ? (
                  <div className="space-y-4 overflow-y-auto max-h-[calc(60vh-270px)]">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{selectedPolicy.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{selectedPolicy.description}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">適用航線</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedPolicy.applicableRoutes.map((route, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {route}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedPolicy.exceptions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">例外情況</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {selectedPolicy.exceptions.map((exception, index) => (
                            <li key={index} className="flex items-center">
                              <AlertCircle className="w-3 h-3 text-yellow-500 mr-2" />
                              {exception}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPolicy.relatedPolicies.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">相關政策</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedPolicy.relatedPolicies.map((relatedId, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {relatedId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500">最後更新: {selectedPolicy.lastUpdated}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>選擇一個政策查看詳情</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coupons and Activities Tab */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">進行中活動</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {mockCouponActivities.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">已結束活動</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {mockCouponActivities.filter(c => c.status === 'ended').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-gray-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總預算</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${(mockCouponActivities.reduce((sum, c) => sum + c.budget, 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">平均轉換率</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {((mockCouponActivities.filter(c => c.performance.conversionRate).reduce((sum, c) => sum + (c.performance.conversionRate || 0), 0) / mockCouponActivities.filter(c => c.performance.conversionRate).length) || 0).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Activities List */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">優惠券及活動管理</h3>
                <button
                  onClick={() => onOpenDataTab && onOpenDataTab('coupons', {
                    filename: 'coupon_activities.csv',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().split(' ')[0],
                    fullPath: 'marketing-sandbox/coupons.csv'
                  }, mockCouponActivities)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  匯出活動數據
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-480px)]">
                {mockCouponActivities.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            activity.status === 'active' ? "bg-green-50 text-green-600" :
                              activity.status === 'ended' ? "bg-gray-50 text-gray-600" :
                                "bg-blue-50 text-blue-600"
                          )}>
                            {activity.status === 'active' ? '進行中' :
                              activity.status === 'ended' ? '已結束' : '規劃中'}
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            activity.type === 'coupon' ? "bg-blue-50 text-blue-600" :
                              activity.type === 'promotion' ? "bg-purple-50 text-purple-600" :
                                activity.type === 'campaign' ? "bg-orange-50 text-orange-600" :
                                  "bg-green-50 text-green-600"
                          )}>
                            {activity.type === 'coupon' ? '優惠券' :
                              activity.type === 'promotion' ? '促銷活動' :
                                activity.type === 'campaign' ? '專案活動' : '特別活動'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{activity.startDate} - {activity.endDate}</span>
                          <span>預算: ${(activity.budget / 10000).toFixed(0)}萬</span>
                          <span>預期營收: ${(activity.expectedRevenue / 10000).toFixed(0)}萬</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    {activity.status === 'ended' && activity.actualRevenue && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-xs text-gray-600">實際營收</p>
                          <p className={cn(
                            "font-semibold",
                            activity.actualRevenue >= activity.expectedRevenue ? "text-green-600" : "text-red-600"
                          )}>
                            ${(activity.actualRevenue / 10000).toFixed(0)}萬
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">轉換率</p>
                          <p className="font-semibold text-blue-600">
                            {activity.performance.conversionRate?.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">平均訂單</p>
                          <p className="font-semibold text-purple-600">
                            ${activity.performance.averageOrderValue?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">新客戶</p>
                          <p className="font-semibold text-green-600">
                            {activity.performance.customerAcquisition?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Analysis */}
                    <div className="border-t pt-3">
                      <h5 className="font-medium text-gray-900 mb-2">分析結果</h5>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>差異分析:</strong> {activity.analysis.varianceAnalysis}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activity.analysis.recommendations.map((rec, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceHubPage;
