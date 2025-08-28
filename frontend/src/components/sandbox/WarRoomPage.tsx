import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, MapPin, Clock, Users, MessageCircle, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import IconSidebar from '@/components/ui/IconSidebar';
import { cn } from '@/utils/cn';

interface CityReport {
  id: string;
  cityName: string;
  type: 'urgent' | 'warning' | 'info';
  timestamp: string;
  summary: string;
  metrics: {
    sentiment: number; // -1 to 1
    engagement: number;
    reach: number;
    trend: 'up' | 'down' | 'stable';
    voteRate: number;
    leadingCandidate: string;
    leadingPercentage: number;
  };
  districts: District[];
  tags: string[];
}

interface District {
  id: string;
  name: string;
  voteRate: number;
  leadingCandidate: string;
  leadingPercentage: number;
  sentiment: number;
  majorProjects: Project[];
  pendingProjects: Project[];
  citizenRequests: CitizenRequest[];
  demographics: {
    population: number;
    ageGroups: { [key: string]: number };
    economicLevel: 'high' | 'medium' | 'low';
  };
}

interface Project {
  id: string;
  name: string;
  type: 'infrastructure' | 'education' | 'healthcare' | 'transportation' | 'environment';
  status: 'completed' | 'ongoing' | 'planned' | 'delayed';
  budget: number;
  completion: number;
  description: string;
}

interface CitizenRequest {
  id: string;
  category: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  count: number;
  description: string;
}

interface WarRoomPageProps {
  className?: string;
}

const mockCityReports: CityReport[] = [
  {
    id: '1',
    cityName: '新北市',
    type: 'warning',
    timestamp: '2024-12-01 14:30',
    summary: '新北市整體選情穩定，但部分區域需要加強關注',
    metrics: {
      sentiment: 0.15,
      engagement: 12500,
      reach: 185000,
      trend: 'stable',
      voteRate: 68.5,
      leadingCandidate: '候選人A',
      leadingPercentage: 42.3
    },
    districts: [
      {
        id: 'ntpc-1',
        name: '板橋區',
        voteRate: 72.1,
        leadingCandidate: '候選人A',
        leadingPercentage: 45.2,
        sentiment: 0.25,
        majorProjects: [
          {
            id: 'proj-1',
            name: '板橋車站周邊都更',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 15000000000,
            completion: 75,
            description: '板橋車站周邊地區都市更新計畫'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-2',
            name: '板橋運動中心擴建',
            type: 'infrastructure',
            status: 'planned',
            budget: 800000000,
            completion: 0,
            description: '增設游泳池及健身設施'
          }
        ],
        citizenRequests: [
          {
            id: 'req-1',
            category: '交通',
            title: '增設公車站牌',
            priority: 'high',
            count: 156,
            description: '民眾反映部分路段缺乏公車站牌'
          }
        ],
        demographics: {
          population: 551452,
          ageGroups: { '18-30': 25, '31-50': 35, '51-65': 25, '65+': 15 },
          economicLevel: 'high'
        }
      },
      {
        id: 'ntpc-2',
        name: '中和區',
        voteRate: 65.8,
        leadingCandidate: '候選人B',
        leadingPercentage: 38.7,
        sentiment: 0.05,
        majorProjects: [],
        pendingProjects: [
          {
            id: 'proj-3',
            name: '中和環河快速道路',
            type: 'transportation',
            status: 'planned',
            budget: 2500000000,
            completion: 0,
            description: '改善中和地區交通壅塞問題'
          }
        ],
        citizenRequests: [
          {
            id: 'req-2',
            category: '環境',
            title: '空氣品質改善',
            priority: 'high',
            count: 203,
            description: '工業區空氣污染問題'
          }
        ],
        demographics: {
          population: 413590,
          ageGroups: { '18-30': 28, '31-50': 38, '51-65': 22, '65+': 12 },
          economicLevel: 'medium'
        }
      },
      {
        id: 'ntpc-3',
        name: '三重區',
        voteRate: 68.3,
        leadingCandidate: '候選人A',
        leadingPercentage: 41.8,
        sentiment: 0.15,
        majorProjects: [
          {
            id: 'proj-ntpc-3-1',
            name: '三重重劃區開發',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 8500000000,
            completion: 60,
            description: '三重地區都市重劃開發計畫'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-ntpc-3-2',
            name: '三重國民運動中心',
            type: 'infrastructure',
            status: 'planned',
            budget: 1200000000,
            completion: 0,
            description: '新建綜合運動中心'
          }
        ],
        citizenRequests: [
          {
            id: 'req-ntpc-3-1',
            category: '交通',
            title: '捷運延伸線',
            priority: 'high',
            count: 289,
            description: '希望捷運能延伸至三重更多區域'
          },
          {
            id: 'req-ntpc-3-2',
            category: '教育',
            title: '增設國小',
            priority: 'medium',
            count: 145,
            description: '人口增加，學校不足'
          }
        ],
        demographics: {
          population: 387484,
          ageGroups: { '18-30': 30, '31-50': 40, '51-65': 20, '65+': 10 },
          economicLevel: 'medium'
        }
      },
      {
        id: 'ntpc-4',
        name: '新莊區',
        voteRate: 70.5,
        leadingCandidate: '候選人A',
        leadingPercentage: 43.6,
        sentiment: 0.20,
        majorProjects: [
          {
            id: 'proj-ntpc-4-1',
            name: '新莊副都心開發',
            type: 'infrastructure',
            status: 'completed',
            budget: 25000000000,
            completion: 100,
            description: '新莊副都心區域開發完成'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-ntpc-4-2',
            name: '新莊體育園區',
            type: 'infrastructure',
            status: 'planned',
            budget: 3500000000,
            completion: 0,
            description: '大型體育園區建設計畫'
          }
        ],
        citizenRequests: [
          {
            id: 'req-ntpc-4-1',
            category: '環境',
            title: '公園綠地增設',
            priority: 'medium',
            count: 198,
            description: '希望增加更多公園綠地'
          }
        ],
        demographics: {
          population: 423291,
          ageGroups: { '18-30': 32, '31-50': 38, '51-65': 22, '65+': 8 },
          economicLevel: 'high'
        }
      },
      {
        id: 'ntpc-5',
        name: '永和區',
        voteRate: 74.2,
        leadingCandidate: '候選人C',
        leadingPercentage: 47.3,
        sentiment: 0.30,
        majorProjects: [
          {
            id: 'proj-ntpc-5-1',
            name: '永和社會住宅',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 4200000000,
            completion: 80,
            description: '永和區社會住宅建設'
          }
        ],
        pendingProjects: [],
        citizenRequests: [
          {
            id: 'req-ntpc-5-1',
            category: '住宅',
            title: '租金補貼',
            priority: 'high',
            count: 267,
            description: '年輕人住宅負擔沉重'
          }
        ],
        demographics: {
          population: 222585,
          ageGroups: { '18-30': 35, '31-50': 35, '51-65': 20, '65+': 10 },
          economicLevel: 'high'
        }
      },
      {
        id: 'ntpc-6',
        name: '新店區',
        voteRate: 71.8,
        leadingCandidate: '候選人A',
        leadingPercentage: 44.1,
        sentiment: 0.18,
        majorProjects: [
          {
            id: 'proj-ntpc-6-1',
            name: '新店溪整治',
            type: 'environment',
            status: 'ongoing',
            budget: 6800000000,
            completion: 65,
            description: '新店溪流域整治工程'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-ntpc-6-2',
            name: '新店文創園區',
            type: 'infrastructure',
            status: 'planned',
            budget: 2800000000,
            completion: 0,
            description: '文化創意產業園區'
          }
        ],
        citizenRequests: [
          {
            id: 'req-ntpc-6-1',
            category: '交通',
            title: '山區交通改善',
            priority: 'high',
            count: 178,
            description: '山區道路狹窄，交通不便'
          }
        ],
        demographics: {
          population: 302089,
          ageGroups: { '18-30': 28, '31-50': 35, '51-65': 25, '65+': 12 },
          economicLevel: 'high'
        }
      }
    ],
    tags: ['穩定', '需關注']
  },
  {
    id: '2',
    cityName: '台北市',
    type: 'urgent',
    timestamp: '2024-12-01 15:45',
    summary: '台北市選情激烈，各區域差異明顯',
    metrics: {
      sentiment: -0.12,
      engagement: 18500,
      reach: 245000,
      trend: 'down',
      voteRate: 74.2,
      leadingCandidate: '候選人C',
      leadingPercentage: 39.8
    },
    districts: [
      {
        id: 'tpe-1',
        name: '信義區',
        voteRate: 78.5,
        leadingCandidate: '候選人C',
        leadingPercentage: 52.1,
        sentiment: 0.35,
        majorProjects: [
          {
            id: 'proj-4',
            name: '信義計畫區擴建',
            type: 'infrastructure',
            status: 'completed',
            budget: 8000000000,
            completion: 100,
            description: '信義計畫區商業設施擴建完成'
          }
        ],
        pendingProjects: [],
        citizenRequests: [
          {
            id: 'req-3',
            category: '住宅',
            title: '社會住宅需求',
            priority: 'medium',
            count: 89,
            description: '年輕族群住宅需求'
          }
        ],
        demographics: {
          population: 225561,
          ageGroups: { '18-30': 35, '31-50': 40, '51-65': 20, '65+': 5 },
          economicLevel: 'high'
        }
      },
      {
        id: 'tpe-2',
        name: '萬華區',
        voteRate: 69.3,
        leadingCandidate: '候選人A',
        leadingPercentage: 41.2,
        sentiment: -0.25,
        majorProjects: [],
        pendingProjects: [
          {
            id: 'proj-5',
            name: '萬華老街活化計畫',
            type: 'infrastructure',
            status: 'planned',
            budget: 1200000000,
            completion: 0,
            description: '傳統市場及老街區域活化'
          }
        ],
        citizenRequests: [
          {
            id: 'req-4',
            category: '治安',
            title: '加強夜間巡邏',
            priority: 'high',
            count: 178,
            description: '夜間治安問題需要改善'
          }
        ],
        demographics: {
          population: 191573,
          ageGroups: { '18-30': 20, '31-50': 30, '51-65': 30, '65+': 20 },
          economicLevel: 'medium'
        }
      },
      {
        id: 'tpe-3',
        name: '大安區',
        voteRate: 81.2,
        leadingCandidate: '候選人C',
        leadingPercentage: 55.8,
        sentiment: 0.42,
        majorProjects: [
          {
            id: 'proj-tpe-3-1',
            name: '大安森林公園改善',
            type: 'environment',
            status: 'ongoing',
            budget: 2500000000,
            completion: 70,
            description: '大安森林公園設施更新與環境改善'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-tpe-3-2',
            name: '大安區圖書館新建',
            type: 'infrastructure',
            status: 'planned',
            budget: 1800000000,
            completion: 0,
            description: '新建現代化圖書館'
          }
        ],
        citizenRequests: [
          {
            id: 'req-tpe-3-1',
            category: '交通',
            title: '停車位不足',
            priority: 'high',
            count: 234,
            description: '商業區停車位嚴重不足'
          }
        ],
        demographics: {
          population: 309969,
          ageGroups: { '18-30': 32, '31-50': 38, '51-65': 22, '65+': 8 },
          economicLevel: 'high'
        }
      },
      {
        id: 'tpe-4',
        name: '中山區',
        voteRate: 76.4,
        leadingCandidate: '候選人C',
        leadingPercentage: 48.9,
        sentiment: 0.28,
        majorProjects: [
          {
            id: 'proj-tpe-4-1',
            name: '中山北路商圈改造',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 3200000000,
            completion: 45,
            description: '中山北路商圈整體改造計畫'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-tpe-4-2',
            name: '中山區民活動中心',
            type: 'infrastructure',
            status: 'planned',
            budget: 900000000,
            completion: 0,
            description: '新建區民活動中心'
          }
        ],
        citizenRequests: [
          {
            id: 'req-tpe-4-1',
            category: '環境',
            title: '空氣品質監測',
            priority: 'medium',
            count: 167,
            description: '希望增設空氣品質監測站'
          }
        ],
        demographics: {
          population: 231194,
          ageGroups: { '18-30': 28, '31-50': 35, '51-65': 25, '65+': 12 },
          economicLevel: 'high'
        }
      },
      {
        id: 'tpe-5',
        name: '松山區',
        voteRate: 73.8,
        leadingCandidate: '候選人B',
        leadingPercentage: 44.3,
        sentiment: 0.15,
        majorProjects: [
          {
            id: 'proj-tpe-5-1',
            name: '松山機場周邊開發',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 12000000000,
            completion: 55,
            description: '松山機場周邊區域開發計畫'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-tpe-5-2',
            name: '松山文創園區擴建',
            type: 'infrastructure',
            status: 'planned',
            budget: 2200000000,
            completion: 0,
            description: '文創園區設施擴建'
          }
        ],
        citizenRequests: [
          {
            id: 'req-tpe-5-1',
            category: '交通',
            title: '機場噪音問題',
            priority: 'high',
            count: 312,
            description: '機場起降噪音影響居民生活'
          }
        ],
        demographics: {
          population: 206170,
          ageGroups: { '18-30': 30, '31-50': 36, '51-65': 24, '65+': 10 },
          economicLevel: 'high'
        }
      },
      {
        id: 'tpe-6',
        name: '內湖區',
        voteRate: 75.6,
        leadingCandidate: '候選人A',
        leadingPercentage: 46.7,
        sentiment: 0.22,
        majorProjects: [
          {
            id: 'proj-tpe-6-1',
            name: '內湖科技園區二期',
            type: 'infrastructure',
            status: 'completed',
            budget: 18000000000,
            completion: 100,
            description: '內湖科技園區二期開發完成'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-tpe-6-2',
            name: '內湖運動中心',
            type: 'infrastructure',
            status: 'planned',
            budget: 1500000000,
            completion: 0,
            description: '新建綜合運動中心'
          }
        ],
        citizenRequests: [
          {
            id: 'req-tpe-6-1',
            category: '交通',
            title: '上下班交通壅塞',
            priority: 'high',
            count: 445,
            description: '科技園區上下班時間交通嚴重壅塞'
          }
        ],
        demographics: {
          population: 287477,
          ageGroups: { '18-30': 35, '31-50': 42, '51-65': 18, '65+': 5 },
          economicLevel: 'high'
        }
      }
    ],
    tags: ['激烈', '差異大']
  },
  {
    id: '3',
    cityName: '高雄市',
    type: 'info',
    timestamp: '2024-12-01 13:20',
    summary: '高雄市選情樂觀，南部地區支持度穩定上升',
    metrics: {
      sentiment: 0.42,
      engagement: 9800,
      reach: 156000,
      trend: 'up',
      voteRate: 71.8,
      leadingCandidate: '候選人A',
      leadingPercentage: 48.6
    },
    districts: [
      {
        id: 'khh-1',
        name: '前鎮區',
        voteRate: 73.2,
        leadingCandidate: '候選人A',
        leadingPercentage: 51.8,
        sentiment: 0.45,
        majorProjects: [
          {
            id: 'proj-6',
            name: '前鎮漁港現代化',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 3500000000,
            completion: 60,
            description: '漁港設施現代化改造'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-7',
            name: '前鎮河整治計畫',
            type: 'environment',
            status: 'planned',
            budget: 1800000000,
            completion: 0,
            description: '河川整治及生態復育'
          }
        ],
        citizenRequests: [
          {
            id: 'req-5',
            category: '經濟',
            title: '促進就業機會',
            priority: 'high',
            count: 134,
            description: '增加在地就業機會'
          }
        ],
        demographics: {
          population: 188735,
          ageGroups: { '18-30': 22, '31-50': 35, '51-65': 28, '65+': 15 },
          economicLevel: 'medium'
        }
      },
      {
        id: 'khh-2',
        name: '左營區',
        voteRate: 70.5,
        leadingCandidate: '候選人A',
        leadingPercentage: 45.3,
        sentiment: 0.38,
        majorProjects: [
          {
            id: 'proj-8',
            name: '左營高鐵特區開發',
            type: 'transportation',
            status: 'completed',
            budget: 12000000000,
            completion: 100,
            description: '高鐵左營站周邊開發完成'
          }
        ],
        pendingProjects: [],
        citizenRequests: [
          {
            id: 'req-6',
            category: '教育',
            title: '增設幼兒園',
            priority: 'medium',
            count: 97,
            description: '學齡前兒童教育需求'
          }
        ],
        demographics: {
          population: 204207,
          ageGroups: { '18-30': 30, '31-50': 38, '51-65': 22, '65+': 10 },
          economicLevel: 'high'
        }
      },
      {
        id: 'khh-3',
        name: '鳳山區',
        voteRate: 72.8,
        leadingCandidate: '候選人A',
        leadingPercentage: 49.2,
        sentiment: 0.35,
        majorProjects: [
          {
            id: 'proj-khh-3-1',
            name: '鳳山溪整治',
            type: 'environment',
            status: 'ongoing',
            budget: 4500000000,
            completion: 70,
            description: '鳳山溪流域整治與景觀改善'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-khh-3-2',
            name: '鳳山運動園區',
            type: 'infrastructure',
            status: 'planned',
            budget: 2800000000,
            completion: 0,
            description: '大型運動園區建設'
          }
        ],
        citizenRequests: [
          {
            id: 'req-khh-3-1',
            category: '交通',
            title: '捷運延伸',
            priority: 'high',
            count: 356,
            description: '希望捷運能延伸至鳳山更多區域'
          }
        ],
        demographics: {
          population: 359125,
          ageGroups: { '18-30': 28, '31-50': 36, '51-65': 26, '65+': 10 },
          economicLevel: 'medium'
        }
      },
      {
        id: 'khh-4',
        name: '三民區',
        voteRate: 69.4,
        leadingCandidate: '候選人B',
        leadingPercentage: 43.7,
        sentiment: 0.25,
        majorProjects: [
          {
            id: 'proj-khh-4-1',
            name: '三民區市場改建',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 1800000000,
            completion: 40,
            description: '傳統市場現代化改建'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-khh-4-2',
            name: '三民區圖書館',
            type: 'infrastructure',
            status: 'planned',
            budget: 1200000000,
            completion: 0,
            description: '新建現代化圖書館'
          }
        ],
        citizenRequests: [
          {
            id: 'req-khh-4-1',
            category: '環境',
            title: '空氣品質改善',
            priority: 'high',
            count: 289,
            description: '工業區空氣污染問題'
          }
        ],
        demographics: {
          population: 343203,
          ageGroups: { '18-30': 25, '31-50': 35, '51-65': 28, '65+': 12 },
          economicLevel: 'medium'
        }
      },
      {
        id: 'khh-5',
        name: '苓雅區',
        voteRate: 74.6,
        leadingCandidate: '候選人A',
        leadingPercentage: 52.1,
        sentiment: 0.40,
        majorProjects: [
          {
            id: 'proj-khh-5-1',
            name: '苓雅區都更計畫',
            type: 'infrastructure',
            status: 'ongoing',
            budget: 8500000000,
            completion: 55,
            description: '苓雅區老舊社區都市更新'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-khh-5-2',
            name: '苓雅區文化中心',
            type: 'infrastructure',
            status: 'planned',
            budget: 2200000000,
            completion: 0,
            description: '新建區域文化中心'
          }
        ],
        citizenRequests: [
          {
            id: 'req-khh-5-1',
            category: '住宅',
            title: '老舊建築改善',
            priority: 'medium',
            count: 198,
            description: '老舊建築結構安全問題'
          }
        ],
        demographics: {
          population: 165305,
          ageGroups: { '18-30': 32, '31-50': 38, '51-65': 22, '65+': 8 },
          economicLevel: 'high'
        }
      },
      {
        id: 'khh-6',
        name: '小港區',
        voteRate: 68.9,
        leadingCandidate: '候選人A',
        leadingPercentage: 46.8,
        sentiment: 0.30,
        majorProjects: [
          {
            id: 'proj-khh-6-1',
            name: '小港機場擴建',
            type: 'transportation',
            status: 'completed',
            budget: 15000000000,
            completion: 100,
            description: '高雄國際機場擴建完成'
          }
        ],
        pendingProjects: [
          {
            id: 'proj-khh-6-2',
            name: '小港工業區轉型',
            type: 'infrastructure',
            status: 'planned',
            budget: 12000000000,
            completion: 0,
            description: '傳統工業區轉型計畫'
          }
        ],
        citizenRequests: [
          {
            id: 'req-khh-6-1',
            category: '環境',
            title: '工業污染改善',
            priority: 'high',
            count: 267,
            description: '工業區環境污染問題'
          }
        ],
        demographics: {
          population: 157914,
          ageGroups: { '18-30': 26, '31-50': 34, '51-65': 28, '65+': 12 },
          economicLevel: 'medium'
        }
      }
    ],
    tags: ['樂觀', '穩定上升']
  }
];

const getCityTypeColor = (type: string) => {
  switch (type) {
    case 'urgent':
      return 'border-red-500 bg-red-50 text-red-700';
    case 'warning':
      return 'border-yellow-500 bg-yellow-50 text-yellow-700';
    case 'info':
      return 'border-blue-500 bg-blue-50 text-blue-700';
    default:
      return 'border-gray-500 bg-gray-50 text-gray-700';
  }
};

const getProjectStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'ongoing':
      return 'bg-blue-100 text-blue-800';
    case 'planned':
      return 'bg-yellow-100 text-yellow-800';
    case 'delayed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getReportTypeIcon = (type: string) => {
  switch (type) {
    case 'urgent':
      return <AlertTriangle className="w-4 h-4" />;
    case 'warning':
      return <Activity className="w-4 h-4" />;
    case 'info':
      return <MessageCircle className="w-4 h-4" />;
    default:
      return <MessageCircle className="w-4 h-4" />;
  }
};

export const WarRoomPage: React.FC<WarRoomPageProps> = ({ className }) => {
  const [selectedCity, setSelectedCity] = useState<CityReport | null>(mockCityReports[0]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [cities] = useState<CityReport[]>(mockCityReports);

  // 當切換城市時重置選中的區域
  const handleCityChange = (city: CityReport) => {
    setSelectedCity(city);
    setSelectedDistrict(null); // 重置區域選擇
  };

  const formatSentiment = (sentiment: number) => {
    if (sentiment > 0.3) return { text: '正面', color: 'text-green-600' };
    if (sentiment < -0.3) return { text: '負面', color: 'text-red-600' };
    return { text: '中性', color: 'text-gray-600' };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatBudget = (budget: number) => {
    if (budget >= 1000000000) return `${(budget / 1000000000).toFixed(1)}億`;
    if (budget >= 100000000) return `${(budget / 100000000).toFixed(1)}億`;
    if (budget >= 10000) return `${(budget / 10000).toFixed(1)}萬`;
    return budget.toString();
  };

  // 準備側邊欄項目數據
  const sidebarItems = cities.map((city) => ({
    id: city.id,
    icon: city.id === selectedCity?.id ? AlertTriangle :
          city.type === 'urgent' ? AlertTriangle :
          city.type === 'warning' ? Activity : FileText,
    label: city.cityName,
    isActive: city.id === selectedCity?.id,
    onClick: () => {
      setSelectedCity(city);
      setSelectedDistrict(null);
    },
    color: city.id === selectedCity?.id ? 'orange' :
           city.type === 'urgent' ? 'red' :
           city.type === 'warning' ? 'orange' : 'gray',
    description: city.summary,
    metadata: `${city.timestamp} • 投票率: ${city.metrics.voteRate}% • ${formatSentiment(city.metrics.sentiment).text}`
  }));

  const handleAddNew = () => {
    // 創建新城市分析的邏輯
    console.log('創建新城市分析');
  };

  return (
    <div className={cn("h-full flex overflow-hidden", className)}>
      {/* Left Icon Sidebar */}
      <IconSidebar
        items={sidebarItems}
        onAddNew={handleAddNew}
      />

      {/* Main Content - City Analysis Dashboard */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {selectedCity ? (
          <div className="flex flex-col">
            {/* Fixed-height Map Section */}
            <div className="h-80 relative bg-gradient-to-br from-blue-50 to-indigo-100 flex-shrink-0">
              {/* City Map Container */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-4xl">
                  {/* City Map Image */}
                  <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden relative">
                    {selectedCity?.cityName === '新北市' && (
                      <div className="w-full h-full relative">
                        {/* 新北市地圖背景 */}
                        <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/New_Taipei_City_districts.svg/800px-New_Taipei_City_districts.svg.png"
                            alt="新北市地圖"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              // 如果圖片載入失敗，顯示備用內容
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex-col items-center justify-center">
                            <div className="text-6xl font-bold text-green-800 mb-4">新北市</div>
                            <div className="text-xl text-green-600">New Taipei City</div>
                            <div className="text-sm text-green-500 mt-2">29個行政區</div>
                          </div>
                        </div>
                        {/* 選情資訊覆蓋層 */}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                          <div className="text-sm font-medium text-gray-900 mb-1">新北市 選情分析</div>
                          <div className="text-xs text-gray-600">投票率: {selectedCity.metrics.voteRate}%</div>
                          <div className="flex items-center mt-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                            <span className="text-xs">領先候選人: {selectedCity.metrics.leadingCandidate} ({selectedCity.metrics.leadingPercentage}%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCity?.cityName === '台北市' && (
                      <div className="w-full h-full relative">
                        {/* 台北市地圖背景 */}
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Taipei_City_districts.svg/800px-Taipei_City_districts.svg.png"
                            alt="台北市地圖"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex-col items-center justify-center">
                            <div className="text-6xl font-bold text-blue-800 mb-4">台北市</div>
                            <div className="text-xl text-blue-600">Taipei City</div>
                            <div className="text-sm text-blue-500 mt-2">12個行政區</div>
                          </div>
                        </div>
                        {/* 選情資訊覆蓋層 */}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                          <div className="text-sm font-medium text-gray-900 mb-1">台北市 選情分析</div>
                          <div className="text-xs text-gray-600">投票率: {selectedCity.metrics.voteRate}%</div>
                          <div className="flex items-center mt-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                            <span className="text-xs">領先候選人: {selectedCity.metrics.leadingCandidate} ({selectedCity.metrics.leadingPercentage}%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCity?.cityName === '高雄市' && (
                      <div className="w-full h-full relative">
                        {/* 高雄市地圖背景 */}
                        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Kaohsiung_City_districts.svg/800px-Kaohsiung_City_districts.svg.png"
                            alt="高雄市地圖"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex-col items-center justify-center">
                            <div className="text-6xl font-bold text-orange-800 mb-4">高雄市</div>
                            <div className="text-xl text-orange-600">Kaohsiung City</div>
                            <div className="text-sm text-orange-500 mt-2">38個行政區</div>
                          </div>
                        </div>
                        {/* 選情資訊覆蓋層 */}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                          <div className="text-sm font-medium text-gray-900 mb-1">高雄市 選情分析</div>
                          <div className="text-xs text-gray-600">投票率: {selectedCity.metrics.voteRate}%</div>
                          <div className="flex items-center mt-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                            <span className="text-xs">領先候選人: {selectedCity.metrics.leadingCandidate} ({selectedCity.metrics.leadingPercentage}%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Map overlay info */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div className="text-sm font-medium text-gray-900">{selectedCity.cityName} 選情分析</div>
                    <div className="text-xs text-gray-500 mt-1">投票率: {selectedCity.metrics.voteRate}%</div>
                    <div className="flex items-center mt-2 text-xs">
                      <div className={cn("w-2 h-2 rounded-full mr-2",
                        selectedCity.type === 'urgent' ? 'bg-red-500' :
                        selectedCity.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                      )}></div>
                      領先候選人: {selectedCity.metrics.leadingCandidate} ({selectedCity.metrics.leadingPercentage}%)
                    </div>
                  </div>



                  {/* Legend */}
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div className="text-xs font-medium text-gray-900 mb-2">選情狀態</div>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        緊急關注
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                        需要關注
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        穩定樂觀
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>





            {/* Bottom Comprehensive Dashboard */}
            <div className="border-t border-border bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 overflow-y-auto">
              <div className="p-6">
                {/* City/District Header with Selector */}
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedDistrict ? `${selectedCity.cityName} - ${selectedDistrict.name}` : `${selectedCity.cityName} 總覽`}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedDistrict ? `人口: ${selectedDistrict.demographics.population.toLocaleString()}` : selectedCity.summary}
                      </p>
                    </div>

                    {/* District Selector */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">選擇行政區</div>
                      <select
                        className="text-sm border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white min-w-[120px]"
                        value={selectedDistrict?.id || ''}
                        onChange={(e) => {
                          const district = selectedCity?.districts?.find(d => d.id === e.target.value);
                          setSelectedDistrict(district || null);
                        }}
                      >
                        <option value="">總覽</option>
                        {selectedCity?.districts?.map(district => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        )) || []}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">情感分析</h4>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-2xl font-bold">
                      <span className={formatSentiment(selectedDistrict?.sentiment || selectedCity.metrics.sentiment).color}>
                        {formatSentiment(selectedDistrict?.sentiment || selectedCity.metrics.sentiment).text}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {((selectedDistrict?.sentiment || selectedCity.metrics.sentiment) * 100).toFixed(1)}% 支持度
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">投票率</h4>
                      <div className={cn("text-xs",
                        selectedCity.metrics.trend === 'up' ? 'text-green-600' :
                        selectedCity.metrics.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {selectedCity.metrics.trend === 'up' ? '↑' : selectedCity.metrics.trend === 'down' ? '↓' : '→'}
                        {selectedCity.metrics.trend === 'up' ? '+2.1%' : selectedCity.metrics.trend === 'down' ? '-1.5%' : '0%'}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedDistrict?.voteRate || selectedCity.metrics.voteRate}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">預估投票率</div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">領先候選人</h4>
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        {selectedDistrict?.leadingCandidate || selectedCity.metrics.leadingCandidate}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedDistrict?.leadingPercentage || selectedCity.metrics.leadingPercentage}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">支持度</div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">趨勢</h4>
                      <div className="flex items-center justify-center">
                        {selectedCity.metrics.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {selectedCity.metrics.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {selectedCity.metrics.trend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      <span className={selectedCity.metrics.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                                     selectedCity.metrics.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                                     'text-gray-600 dark:text-gray-400'}>
                        {selectedCity.metrics.trend === 'up' ? '上升' :
                         selectedCity.metrics.trend === 'down' ? '下降' : '穩定'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">選情趨勢</div>
                  </div>
                </div>

                {/* Charts and Analysis Row */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {/* Age Demographics Chart */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">年齡分佈</h4>
                    {selectedDistrict ? (
                      <div className="space-y-2">
                        {Object.entries(selectedDistrict.demographics.ageGroups).map(([age, percentage]) => (
                          <div key={age}>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">{age}歲</span>
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">18-30歲</span>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">28%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">31-50歲</span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">37%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '37%' }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">51-65歲</span>
                          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">25%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">65+歲</span>
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">10%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vote Trend Chart */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">投票率趨勢</h4>
                    <div className="h-20 flex items-end justify-between space-x-1">
                      {[45, 52, 48, 61, 55, 67, 72, 68, 74, 69, 71, 75].map((height, i) => (
                        <div key={i} className="bg-green-400 rounded-t" style={{ height: `${height}%`, width: '6px' }}></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>1月</span>
                      <span>6月</span>
                      <span>12月</span>
                    </div>
                  </div>

                  {/* Key Issues */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">關鍵議題</h4>
                    <div className="space-y-2">
                      {selectedCity.tags.slice(0, 4).map((tag, index) => (
                        <div key={tag} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{tag}</span>
                          <div className="flex items-center">
                            <div className="w-12 bg-gray-200 dark:bg-slate-600 rounded-full h-1 mr-2">
                              <div
                                className="bg-orange-400 h-1 rounded-full"
                                style={{ width: `${85 - index * 15}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{85 - index * 15}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Projects and Citizen Requests Section */}
                {selectedDistrict && (
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Major Projects */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">重大建設</h4>
                      <div className="space-y-3">
                        {selectedDistrict.majorProjects.map((project) => (
                          <div key={project.id} className="border-l-4 border-green-400 pl-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                              </div>
                              <span className={cn("px-2 py-1 rounded text-xs", getProjectStatusColor(project.status))}>
                                {project.status === 'completed' ? '已完成' :
                                 project.status === 'ongoing' ? '進行中' :
                                 project.status === 'planned' ? '規劃中' : '延遲'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">預算: {formatBudget(project.budget)}</span>
                              <span className="text-xs text-gray-500">完成度: {project.completion}%</span>
                            </div>
                          </div>
                        ))}
                        {selectedDistrict.pendingProjects.map((project) => (
                          <div key={project.id} className="border-l-4 border-yellow-400 pl-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                              </div>
                              <span className={cn("px-2 py-1 rounded text-xs", getProjectStatusColor(project.status))}>
                                {project.status === 'planned' ? '待建設' : '延遲'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">預算: {formatBudget(project.budget)}</span>
                              <span className="text-xs text-gray-500">完成度: {project.completion}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Citizen Requests */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">民眾陳情與需求</h4>
                      <div className="space-y-3">
                        {selectedDistrict.citizenRequests.map((request) => (
                          <div key={request.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-slate-700">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">{request.title}</h5>
                                <span className="text-xs text-gray-500">{request.category}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={cn("px-2 py-1 rounded text-xs", getPriorityColor(request.priority))}>
                                  {request.priority === 'high' ? '高' : request.priority === 'medium' ? '中' : '低'}
                                </span>
                                <span className="text-xs font-medium text-blue-600">{request.count}件</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{request.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* District Table */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">各區詳細數據</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-600">
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">行政區</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">人口</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">投票率</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">領先候選人</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">支持度</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">情感</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">經濟水平</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCity?.districts?.map((district) => (
                          <tr
                            key={district.id}
                            className={cn(
                              "border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer",
                              selectedDistrict?.id === district.id && "bg-blue-50 dark:bg-blue-900/20"
                            )}
                            onClick={() => setSelectedDistrict(district)}
                          >
                            <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{district.name}</td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{district.demographics.population.toLocaleString()}</td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{district.voteRate}%</td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{district.leadingCandidate}</td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{district.leadingPercentage}%</td>
                            <td className="py-2 px-3">
                              <span className={formatSentiment(district.sentiment).color}>
                                {formatSentiment(district.sentiment).text}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={cn("px-2 py-1 rounded text-xs",
                                district.demographics.economicLevel === 'high' ? 'bg-green-100 text-green-800' :
                                district.demographics.economicLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {district.demographics.economicLevel === 'high' ? '高' :
                                 district.demographics.economicLevel === 'medium' ? '中' : '低'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">選情分析摘要</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedDistrict ?
                      `${selectedDistrict.name}是${selectedCity.cityName}的重要行政區，人口${selectedDistrict.demographics.population.toLocaleString()}人，經濟水平${selectedDistrict.demographics.economicLevel === 'high' ? '較高' : selectedDistrict.demographics.economicLevel === 'medium' ? '中等' : '較低'}。目前${selectedDistrict.leadingCandidate}以${selectedDistrict.leadingPercentage}%的支持度領先，民眾情感傾向${formatSentiment(selectedDistrict.sentiment).text}。` :
                      selectedCity.summary
                    }
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedCity.tags.slice(0, 6).map((tag, index) => (
                      <span key={index} className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs border border-blue-200 dark:border-blue-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>選擇一個城市查看詳細選情分析</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarRoomPage;
