import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  Handshake,
  BarChart3,
  Eye,
  Star,
  Plane,
  CreditCard,
  Gift,
  ShoppingBag,
  Coffee,
  Car,
  Building,
  Zap
} from 'lucide-react';

interface CompetitorPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
}

interface Competitor {
  id: string;
  name: string;
  type: 'full-service' | 'low-cost' | 'regional';
  marketShare: number;
  routes: string[];
  strengths: string[];
  weaknesses: string[];
  pricing: {
    economy: number;
    business: number;
    premium: number;
  };
  services: {
    onboard: string[];
    ground: string[];
    digital: string[];
  };
}

interface MarketingStrategy {
  competitor: string;
  campaigns: Array<{
    name: string;
    type: 'digital' | 'traditional' | 'partnership' | 'event';
    budget: number;
    reach: number;
    effectiveness: number;
    description: string;
  }>;
  channels: string[];
  targetAudience: string[];
  messaging: string[];
}

interface LoyaltyProgram {
  competitor: string;
  programName: string;
  tiers: Array<{
    name: string;
    requirements: string;
    benefits: string[];
  }>;
  partnerships: Array<{
    partner: string;
    category: string;
    benefits: string;
    popularity: number;
  }>;
  redemptionOptions: string[];
  membershipGrowth: number;
  engagement: number;
}

// Mock data
const mockCompetitors: Competitor[] = [
  {
    id: 'eva-air',
    name: '長榮航空',
    type: 'full-service',
    marketShare: 28,
    routes: ['TPE-LAX', 'TPE-NRT', 'TPE-LHR', 'TPE-BKK'],
    strengths: ['服務品質', '航線網絡', '品牌形象'],
    weaknesses: ['票價較高', '數位化程度'],
    pricing: {
      economy: 25000,
      business: 85000,
      premium: 45000
    },
    services: {
      onboard: ['娛樂系統', '餐飲服務', 'WiFi'],
      ground: ['貴賓室', '優先登機', '行李服務'],
      digital: ['手機App', '線上報到', '座位選擇']
    }
  },
  {
    id: 'starlux',
    name: '星宇航空',
    type: 'full-service',
    marketShare: 12,
    routes: ['TPE-NRT', 'TPE-ICN', 'TPE-BKK', 'TPE-KUL'],
    strengths: ['新穎機隊', '創新服務', '高端定位'],
    weaknesses: ['航線有限', '品牌知名度', '價格競爭力'],
    pricing: {
      economy: 28000,
      business: 95000,
      premium: 52000
    },
    services: {
      onboard: ['4K娛樂', '精緻餐飲', '高速WiFi'],
      ground: ['星宇貴賓室', '快速通關', '禮賓服務'],
      digital: ['STARLUX App', 'AR體驗', '智能客服']
    }
  },
  {
    id: 'tigerair',
    name: '台灣虎航',
    type: 'low-cost',
    marketShare: 8,
    routes: ['TPE-NRT', 'TPE-ICN', 'TPE-BKK', 'TPE-SIN'],
    strengths: ['低價策略', '年輕客群', '靈活營運'],
    weaknesses: ['服務有限', '準點率', '品牌形象'],
    pricing: {
      economy: 12000,
      business: 0,
      premium: 18000
    },
    services: {
      onboard: ['付費餐飲', '付費娛樂', '付費WiFi'],
      ground: ['自助報到', '付費選位', '付費行李'],
      digital: ['Tigerair App', '線上購物', '社群互動']
    }
  }
];

const mockMarketingStrategies: MarketingStrategy[] = [
  {
    competitor: '長榮航空',
    campaigns: [
      {
        name: 'Hello Kitty彩繪機',
        type: 'partnership',
        budget: 50000000,
        reach: 2500000,
        effectiveness: 85,
        description: '與三麗鷗合作推出Hello Kitty主題航班'
      },
      {
        name: '星空聯盟推廣',
        type: 'digital',
        budget: 30000000,
        reach: 1800000,
        effectiveness: 72,
        description: '強調星空聯盟會員權益與全球航線網絡'
      }
    ],
    channels: ['電視廣告', '數位媒體', '機場廣告', '社群媒體'],
    targetAudience: ['商務旅客', '家庭旅遊', '國際旅客'],
    messaging: ['品質服務', '安全可靠', '全球連結']
  },
  {
    competitor: '星宇航空',
    campaigns: [
      {
        name: '星宇體驗營',
        type: 'event',
        budget: 20000000,
        reach: 500000,
        effectiveness: 92,
        description: '邀請旅客體驗星宇服務與設施'
      },
      {
        name: '社群影響者合作',
        type: 'digital',
        budget: 15000000,
        reach: 1200000,
        effectiveness: 78,
        description: '與旅遊部落客和網紅合作推廣'
      }
    ],
    channels: ['社群媒體', '影響者行銷', '體驗活動', '公關媒體'],
    targetAudience: ['高端旅客', '年輕專業人士', '品質追求者'],
    messaging: ['奢華體驗', '創新服務', '精品航空']
  }
];

const mockLoyaltyPrograms: LoyaltyProgram[] = [
  {
    competitor: '長榮航空',
    programName: 'Infinity MileageLands',
    tiers: [
      {
        name: '一般會員',
        requirements: '無門檻',
        benefits: ['累積里程', '會員優惠', '生日禮遇']
      },
      {
        name: '金卡會員',
        requirements: '年飛行5萬里程',
        benefits: ['優先登機', '免費升等', '額外行李']
      },
      {
        name: '鑽石會員',
        requirements: '年飛行10萬里程',
        benefits: ['貴賓室使用', '專屬客服', '夥伴航空權益']
      }
    ],
    partnerships: [
      {
        partner: '台新銀行',
        category: '金融',
        benefits: '刷卡累積雙倍里程',
        popularity: 85
      },
      {
        partner: '遠東百貨',
        category: '零售',
        benefits: '消費累積里程',
        popularity: 72
      },
      {
        partner: '統一星巴克',
        category: '餐飲',
        benefits: '購買咖啡累積里程',
        popularity: 68
      }
    ],
    redemptionOptions: ['免費機票', '升等服務', '購物折抵', '餐飲優惠'],
    membershipGrowth: 15,
    engagement: 78
  },
  {
    competitor: '星宇航空',
    programName: 'COSMILE',
    tiers: [
      {
        name: 'Explorer',
        requirements: '無門檻',
        benefits: ['基本累積', '會員價格', '專屬活動']
      },
      {
        name: 'Voyager',
        requirements: '年消費30萬',
        benefits: ['加速累積', '優先服務', '免費升等']
      },
      {
        name: 'Navigator',
        requirements: '年消費80萬',
        benefits: ['最高累積', '貴賓禮遇', '全球權益']
      }
    ],
    partnerships: [
      {
        partner: '國泰世華銀行',
        category: '金融',
        benefits: '聯名卡專屬優惠',
        popularity: 78
      },
      {
        partner: '誠品書店',
        category: '文創',
        benefits: '購書累積里程',
        popularity: 65
      },
      {
        partner: '和運租車',
        category: '交通',
        benefits: '租車里程回饋',
        popularity: 58
      }
    ],
    redemptionOptions: ['機票兌換', '服務升級', '精品兌換', '體驗活動'],
    membershipGrowth: 25,
    engagement: 82
  }
];

// 華航數據
const chinaAirlinesData = {
  name: '中華航空',
  marketShare: 25,
  pricing: {
    economy: 23000,
    business: 78000,
    premium: 42000
  },
  strengths: ['航線網絡廣泛', '品牌歷史悠久', '政府支持', '兩岸航線優勢'],
  weaknesses: ['數位化轉型較慢', '成本控制', '年輕客群吸引力'],
  services: {
    onboard: ['個人娛樂系統', '中式餐飲', 'WiFi服務'],
    ground: ['松山機場樞紐', '貴賓室服務', '快速通關'],
    digital: ['CI App', '線上報到', '數位登機證']
  },
  routes: ['TPE-LAX', 'TPE-NRT', 'TPE-FRA', 'TPE-SYD', 'TPE-PVG'],
  loyaltyProgram: {
    name: 'Dynasty Flyer',
    members: 2800000,
    tiers: ['一般會員', '金卡', '翡翠卡', '鑽石卡'],
    partnerships: ['萬豪酒店', '中信銀行', '台灣高鐵']
  }
};

export const CompetitorPage: React.FC<CompetitorPageProps> = ({
  className,
  onOpenDataTab
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'marketing' | 'loyalty'>('overview');
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(mockCompetitors[0]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-service':
        return 'text-blue-600 bg-blue-50';
      case 'low-cost':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-purple-600 bg-purple-50';
    }
  };

  const getPartnerIcon = (category: string) => {
    switch (category) {
      case '金融':
        return <CreditCard className="w-4 h-4" />;
      case '零售':
        return <ShoppingBag className="w-4 h-4" />;
      case '餐飲':
        return <Coffee className="w-4 h-4" />;
      case '交通':
        return <Car className="w-4 h-4" />;
      case '文創':
        return <Building className="w-4 h-4" />;
      default:
        return <Handshake className="w-4 h-4" />;
    }
  };

  const exportData = (dataType: string) => {
    if (onOpenDataTab) {
      const mockFile = {
        filename: `competitor_${dataType}_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        fullPath: `marketing-sandbox/competitor_${dataType}.csv`
      };
      
      let data: any[] = [];
      switch (dataType) {
        case 'overview':
          data = mockCompetitors;
          break;
        case 'marketing':
          data = mockMarketingStrategies;
          break;
        case 'loyalty':
          data = mockLoyaltyPrograms;
          break;
      }
      
      onOpenDataTab('competitor', mockFile, data);
    }
  };

  return (
    <div className={cn("h-full overflow-y-auto p-6 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">競爭者分析</h1>
            <p className="text-gray-600 mt-1">競爭對手產品、行銷策略與會員計畫分析</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border mb-6">
        {[
          { id: 'overview', name: '競爭概況', icon: Target },
          { id: 'comparison', name: '華航比較', icon: BarChart3 },
          { id: 'marketing', name: '行銷策略', icon: TrendingUp },
          { id: 'loyalty', name: '會員計畫', icon: Award }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Competitor List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">主要競爭者</h3>
              <button
                onClick={() => exportData('overview')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                匯出數據
              </button>
            </div>
            
            {mockCompetitors.map((competitor) => (
              <div
                key={competitor.id}
                className={cn(
                  "bg-white rounded-lg p-4 shadow-sm border cursor-pointer transition-colors",
                  selectedCompetitor?.id === competitor.id 
                    ? "border-blue-500 bg-blue-50" 
                    : "hover:border-gray-300"
                )}
                onClick={() => setSelectedCompetitor(competitor)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-gray-500" />
                    <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getTypeColor(competitor.type)
                  )}>
                    {competitor.type === 'full-service' ? '全服務' :
                     competitor.type === 'low-cost' ? '低成本' : '區域型'}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">市占率</span>
                    <span className="font-medium">{competitor.marketShare}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${competitor.marketShare}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-sm">
                  <p className="text-gray-600 mb-1">主要航線</p>
                  <div className="flex flex-wrap gap-1">
                    {competitor.routes.slice(0, 3).map((route, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {route}
                      </span>
                    ))}
                    {competitor.routes.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{competitor.routes.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Competitor Details */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
            {selectedCompetitor ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{selectedCompetitor.name}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{selectedCompetitor.marketShare}%</p>
                    <p className="text-sm text-gray-600">市場占有率</p>
                  </div>
                </div>

                {/* Pricing Comparison */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">票價策略</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">經濟艙</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedCompetitor.pricing.economy ? `$${selectedCompetitor.pricing.economy.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">豪華經濟艙</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedCompetitor.pricing.premium ? `$${selectedCompetitor.pricing.premium.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">商務艙</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedCompetitor.pricing.business ? `$${selectedCompetitor.pricing.business.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">競爭優勢</h4>
                    <ul className="space-y-2">
                      {selectedCompetitor.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <TrendingUp className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">競爭劣勢</h4>
                    <ul className="space-y-2">
                      {selectedCompetitor.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <Target className="w-3 h-3 text-red-500 mr-2 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">服務項目</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">機上服務</p>
                      <ul className="space-y-1">
                        {selectedCompetitor.services.onboard.map((service, index) => (
                          <li key={index} className="text-xs text-gray-600">• {service}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">地面服務</p>
                      <ul className="space-y-1">
                        {selectedCompetitor.services.ground.map((service, index) => (
                          <li key={index} className="text-xs text-gray-600">• {service}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">數位服務</p>
                      <ul className="space-y-1">
                        {selectedCompetitor.services.digital.map((service, index) => (
                          <li key={index} className="text-xs text-gray-600">• {service}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>選擇一個競爭者查看詳細分析</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">行銷策略分析</h3>
            <button
              onClick={() => exportData('marketing')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              匯出數據
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockMarketingStrategies.map((strategy, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{strategy.competitor}</h4>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">主要行銷活動</h5>
                    <div className="space-y-3">
                      {strategy.campaigns.map((campaign, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900">{campaign.name}</h6>
                            <span className="text-sm text-green-600 font-medium">
                              效果: {campaign.effectiveness}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>預算: ${campaign.budget.toLocaleString()}</span>
                            <span>觸及: {campaign.reach.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">行銷通路</h5>
                    <div className="flex flex-wrap gap-1">
                      {strategy.channels.map((channel, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">目標客群</h5>
                    <div className="flex flex-wrap gap-1">
                      {strategy.targetAudience.map((audience, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">核心訊息</h5>
                    <div className="flex flex-wrap gap-1">
                      {strategy.messaging.map((message, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                          {message}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">會員忠誠計畫</h3>
            <button
              onClick={() => exportData('loyalty')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              匯出數據
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockLoyaltyPrograms.map((program, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{program.competitor}</h4>
                    <p className="text-sm text-gray-600">{program.programName}</p>
                  </div>
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>

                <div className="space-y-4">
                  {/* Membership Tiers */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">會員等級</h5>
                    <div className="space-y-2">
                      {program.tiers.map((tier, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="font-medium text-gray-900">{tier.name}</h6>
                            <span className="text-xs text-gray-500">{tier.requirements}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {tier.benefits.map((benefit, bidx) => (
                              <span key={bidx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Partnerships */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">異業合作夥伴</h5>
                    <div className="space-y-2">
                      {program.partnerships.map((partnership, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getPartnerIcon(partnership.category)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{partnership.partner}</p>
                              <p className="text-xs text-gray-600">{partnership.benefits}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-600">{partnership.popularity}%</p>
                            <p className="text-xs text-gray-500">受歡迎度</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Program Performance */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">+{program.membershipGrowth}%</p>
                        <p className="text-sm text-gray-600">會員成長率</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{program.engagement}%</p>
                        <p className="text-sm text-gray-600">活躍度</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Tab - 華航與競爭對手比較 */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* 市場地位比較 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">市場地位比較</h3>
            <div className="space-y-4">
              {/* 華航 */}
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Plane className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">{chinaAirlinesData.name}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">我方</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{chinaAirlinesData.marketShare}%</p>
                    <p className="text-sm text-blue-700">市占率</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">競爭優勢</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {chinaAirlinesData.strengths.slice(0, 3).map((strength, idx) => (
                        <li key={idx} className="flex items-center">
                          <TrendingUp className="w-3 h-3 text-green-500 mr-2" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">改善空間</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {chinaAirlinesData.weaknesses.slice(0, 3).map((weakness, idx) => (
                        <li key={idx} className="flex items-center">
                          <Target className="w-3 h-3 text-orange-500 mr-2" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">主要航線</p>
                    <div className="flex flex-wrap gap-1">
                      {chinaAirlinesData.routes.slice(0, 3).map((route, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 競爭對手 */}
              {mockCompetitors.map((competitor) => (
                <div key={competitor.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Plane className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full font-medium",
                        competitor.type === 'full-service' ? "bg-purple-100 text-purple-700" :
                        competitor.type === 'low-cost' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {competitor.type === 'full-service' ? '全服務' :
                         competitor.type === 'low-cost' ? '低成本' : '區域型'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-700">{competitor.marketShare}%</p>
                      <p className="text-sm text-gray-600">市占率</p>
                      <div className="flex items-center mt-1">
                        {competitor.marketShare > chinaAirlinesData.marketShare ? (
                          <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1 rotate-180" />
                        )}
                        <span className={cn(
                          "text-xs font-medium",
                          competitor.marketShare > chinaAirlinesData.marketShare ? "text-red-600" : "text-green-600"
                        )}>
                          {competitor.marketShare > chinaAirlinesData.marketShare ? '領先' : '落後'}
                          {Math.abs(competitor.marketShare - chinaAirlinesData.marketShare)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">競爭優勢</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {competitor.strengths.slice(0, 3).map((strength, idx) => (
                          <li key={idx} className="flex items-center">
                            <TrendingUp className="w-3 h-3 text-green-500 mr-2" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">弱點分析</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {competitor.weaknesses.slice(0, 3).map((weakness, idx) => (
                          <li key={idx} className="flex items-center">
                            <Target className="w-3 h-3 text-orange-500 mr-2" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">主要航線</p>
                      <div className="flex flex-wrap gap-1">
                        {competitor.routes.slice(0, 3).map((route, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            {route}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 票價比較分析 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">票價競爭力分析</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">航空公司</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">經濟艙</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">豪華經濟艙</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">商務艙</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">價格競爭力</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 華航 */}
                  <tr className="border-b border-gray-100 bg-blue-50">
                    <td className="py-3 px-4 font-medium text-blue-900">
                      <div className="flex items-center space-x-2">
                        <Plane className="w-4 h-4 text-blue-600" />
                        <span>{chinaAirlinesData.name}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">我方</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      ${chinaAirlinesData.pricing.economy.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      ${chinaAirlinesData.pricing.premium.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      ${chinaAirlinesData.pricing.business.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        基準
                      </span>
                    </td>
                  </tr>

                  {/* 競爭對手 */}
                  {mockCompetitors.map((competitor) => {
                    const economyDiff = ((competitor.pricing.economy - chinaAirlinesData.pricing.economy) / chinaAirlinesData.pricing.economy * 100);
                    const businessDiff = ((competitor.pricing.business - chinaAirlinesData.pricing.business) / chinaAirlinesData.pricing.business * 100);
                    const premiumDiff = ((competitor.pricing.premium - chinaAirlinesData.pricing.premium) / chinaAirlinesData.pricing.premium * 100);

                    return (
                      <tr key={competitor.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <Plane className="w-4 h-4 text-gray-600" />
                            <span>{competitor.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              ${competitor.pricing.economy.toLocaleString()}
                            </span>
                            <span className={cn(
                              "text-xs font-medium",
                              economyDiff > 0 ? "text-red-600" : "text-green-600"
                            )}>
                              ({economyDiff > 0 ? '+' : ''}{economyDiff.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              ${competitor.pricing.premium.toLocaleString()}
                            </span>
                            <span className={cn(
                              "text-xs font-medium",
                              premiumDiff > 0 ? "text-red-600" : "text-green-600"
                            )}>
                              ({premiumDiff > 0 ? '+' : ''}{premiumDiff.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              ${competitor.pricing.business.toLocaleString()}
                            </span>
                            <span className={cn(
                              "text-xs font-medium",
                              businessDiff > 0 ? "text-red-600" : "text-green-600"
                            )}>
                              ({businessDiff > 0 ? '+' : ''}{businessDiff.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const avgDiff = (economyDiff + businessDiff + premiumDiff) / 3;
                            if (avgDiff < -5) return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">價格優勢</span>;
                            if (avgDiff > 5) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">價格劣勢</span>;
                            return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">價格相當</span>;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 服務比較分析 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">服務項目比較</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 華航服務 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Plane className="w-5 h-5 text-blue-600 mr-2" />
                  {chinaAirlinesData.name} 服務項目
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">機上服務</p>
                    <div className="flex flex-wrap gap-2">
                      {chinaAirlinesData.services.onboard.map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">地面服務</p>
                    <div className="flex flex-wrap gap-2">
                      {chinaAirlinesData.services.ground.map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">數位服務</p>
                    <div className="flex flex-wrap gap-2">
                      {chinaAirlinesData.services.digital.map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 競爭對手服務比較 */}
              <div className="space-y-4">
                {mockCompetitors.slice(0, 2).map((competitor) => (
                  <div key={competitor.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Plane className="w-4 h-4 text-gray-600 mr-2" />
                      {competitor.name}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="font-medium text-gray-700 mb-1">機上</p>
                        {competitor.services.onboard.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="block px-1 py-0.5 bg-gray-200 text-gray-700 rounded mb-1">
                            {service}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">地面</p>
                        {competitor.services.ground.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="block px-1 py-0.5 bg-gray-200 text-gray-700 rounded mb-1">
                            {service}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">數位</p>
                        {competitor.services.digital.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="block px-1 py-0.5 bg-gray-200 text-gray-700 rounded mb-1">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 策略建議 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">競爭策略建議</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  優勢強化
                </h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>• 深化兩岸航線優勢地位</li>
                  <li>• 擴大政府支持的政策紅利</li>
                  <li>• 強化品牌歷史與信任度</li>
                  <li>• 優化松山機場樞紐功能</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                  <Target className="w-5 h-5 text-yellow-600 mr-2" />
                  弱點改善
                </h4>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>• 加速數位化轉型進程</li>
                  <li>• 優化成本結構控制</li>
                  <li>• 提升年輕客群吸引力</li>
                  <li>• 強化線上服務體驗</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Zap className="w-5 h-5 text-blue-600 mr-2" />
                  差異化策略
                </h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• 發展獨特的中華文化體驗</li>
                  <li>• 創新兩岸商務旅行服務</li>
                  <li>• 建立高端會員專屬權益</li>
                  <li>• 推出個性化旅程規劃</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorPage;
