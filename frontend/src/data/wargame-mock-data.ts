import { WarGameProject, WarGameSession } from '../types/wargame';

export const mockWarGameProjects: WarGameProject[] = [
  {
    id: 'wgp-001',
    name: '台北市長選舉兵推',
    type: 'election',
    description: '模擬台北市長選舉中兩位主要候選人的競選策略對抗，通過多次兵推分析不同情境下的勝負機率',
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-01'),
    status: 'active',
    
    baseSettings: {
      scenario: '台北市長選舉',
      timeframe: '6個月競選期',
      participants: ['候選人A (現任)', '候選人B (挑戰者)'],
      objectives: [
        '獲得50%以上得票率',
        '爭取中間選民支持',
        '鞏固既有支持者',
        '提升投票率'
      ]
    },
    
    strategies: [
      {
        id: 'strategy-candidate-a',
        name: '候選人A - 改革創新策略',
        description: '強調城市創新發展，吸引年輕選民和中產階級支持',
        color: '#3B82F6',
        
        tactics: [
          {
            id: 'tactic-a1',
            name: '青年住宅政策發表',
            description: '推出青年租屋補助和社會住宅政策',
            type: 'policy',
            timeline: { startWeek: 2, duration: 4 },
            budget: 30000000,
            expectedImpact: 9
          },
          {
            id: 'tactic-a2',
            name: '創新科技論壇',
            description: '舉辦智慧城市論壇，邀請科技業領袖站台',
            type: 'event',
            timeline: { startWeek: 6, duration: 6 },
            budget: 40000000,
            expectedImpact: 7
          },
          {
            id: 'tactic-a3',
            name: '數位宣傳攻勢',
            description: '大規模社群媒體宣傳，製作創新政見影片',
            type: 'digital',
            timeline: { startWeek: 1, duration: 24 },
            budget: 60000000,
            expectedImpact: 8
          }
        ],
        
        expectedOutcomes: [
          {
            description: '年輕選民支持度提升18%',
            probability: 78,
            impact: 'high',
            timeframe: '3個月內',
            metrics: { voteShare: 18, awareness: 30, sentiment: 0.4 }
          },
          {
            description: '中產階級認同度大幅提升',
            probability: 82,
            impact: 'high',
            timeframe: '2個月內',
            metrics: { voteShare: 12, awareness: 35, sentiment: 0.3 }
          }
        ],
        
        risks: [
          {
            id: 'risk-n1',
            description: '被批評忽視傳統選民',
            probability: 60,
            impact: 'medium',
            category: 'political',
            mitigation: '同步推出傳統產業扶持政策',
            contingencyPlan: '加強與傳統團體溝通'
          },
          {
            id: 'risk-n2',
            description: '數位落差造成反效果',
            probability: 30,
            impact: 'low',
            category: 'media',
            mitigation: '並行傳統媒體宣傳'
          }
        ],
        
        opportunities: [
          {
            id: 'opp-n1',
            description: '對手在科技議題上失言',
            probability: 40,
            impact: 'high',
            timeWindow: '隨時',
            requirements: ['快速反應團隊', '媒體資源']
          }
        ],
        
        resourceRequirements: [
          {
            type: 'budget',
            amount: 160000000,
            unit: '元',
            priority: 'critical',
            availability: 'available'
          },
          {
            type: 'personnel',
            amount: 50,
            unit: '人',
            priority: 'critical',
            availability: 'available'
          }
        ],
        
        metrics: {
          successProbability: 72,
          confidenceLevel: 68,
          riskLevel: 'medium',
          difficulty: 6,
          timeToImpact: 45,
          costEffectiveness: 7
        },
        
        predictions: {
          voteShareChange: 12,
          supporterGrowth: 150000,
          opponentResponse: '可能推出類似的數位政策來競爭',
          mediaImpact: 'positive',
          publicSentiment: 0.25
        }
      },
      
      {
        id: 'strategy-candidate-b',
        name: '候選人B - 穩健務實策略',
        description: '強調施政經驗和穩健治理，爭取中間選民和長者支持',
        color: '#F59E0B',
        
        tactics: [
          {
            id: 'tactic-b1',
            name: '基層深耕',
            description: '密集走訪台北市各區里，參與社區活動',
            type: 'grassroots',
            timeline: { startWeek: 1, duration: 20 },
            budget: 50000000,
            expectedImpact: 8
          },
          {
            id: 'tactic-b2',
            name: '傳統媒體宣傳',
            description: '在電視台、報紙大量投放政績廣告',
            type: 'media',
            timeline: { startWeek: 4, duration: 16 },
            budget: 70000000,
            expectedImpact: 7
          },
          {
            id: 'tactic-b3',
            name: '市政成果發表',
            description: '舉辦市政成果展，展現施政能力',
            type: 'event',
            timeline: { startWeek: 8, duration: 6 },
            budget: 40000000,
            expectedImpact: 8
          }
        ],
        
        expectedOutcomes: [
          {
            description: '南部傳統支持者鞏固率達90%',
            probability: 85,
            impact: 'high',
            timeframe: '4個月內',
            metrics: { voteShare: 18, awareness: 35, sentiment: 0.4 }
          },
          {
            description: '農漁民支持度大幅提升',
            probability: 80,
            impact: 'high',
            timeframe: '2個月內',
            metrics: { voteShare: 12, awareness: 50, sentiment: 0.6 }
          }
        ],
        
        risks: [
          {
            id: 'risk-s1',
            description: '被批評政策過於傳統',
            probability: 45,
            impact: 'medium',
            category: 'media',
            mitigation: '強調政策的創新面向',
            contingencyPlan: '邀請年輕農民現身說法'
          }
        ],
        
        opportunities: [
          {
            id: 'opp-s1',
            description: '農產品價格上漲引發關注',
            probability: 60,
            impact: 'high',
            timeWindow: '3個月內',
            requirements: ['農業專家團隊', '政策制定能力']
          }
        ],
        
        resourceRequirements: [
          {
            type: 'budget',
            amount: 190000000,
            unit: '元',
            priority: 'critical',
            availability: 'available'
          },
          {
            type: 'personnel',
            amount: 80,
            unit: '人',
            priority: 'critical',
            availability: 'limited'
          }
        ],
        
        metrics: {
          successProbability: 78,
          confidenceLevel: 75,
          riskLevel: 'low',
          difficulty: 4,
          timeToImpact: 30,
          costEffectiveness: 8
        },
        
        predictions: {
          voteShareChange: 16,
          supporterGrowth: 200000,
          opponentResponse: '可能也會加強南部布局',
          mediaImpact: 'positive',
          publicSentiment: 0.35
        }
      }
    ],
    
    simulation: {
      phases: [
        {
          id: 'phase-1',
          name: '初期布局',
          description: '建立基礎團隊，開始初步宣傳',
          startWeek: 1,
          duration: 6,
          objectives: ['建立知名度', '測試訊息效果'],
          keyActivities: ['團隊組建', '訊息測試', '初步宣傳'],
          expectedOutcomes: ['知名度提升5%', '訊息方向確定'],
          status: 'completed'
        },
        {
          id: 'phase-2',
          name: '中期攻勢',
          description: '全面展開策略執行',
          startWeek: 7,
          duration: 12,
          objectives: ['擴大影響力', '鞏固支持度'],
          keyActivities: ['大型活動', '政策發表', '媒體攻勢'],
          expectedOutcomes: ['支持度提升15%', '議題主導權'],
          status: 'completed'
        },
        {
          id: 'phase-3',
          name: '最後衝刺',
          description: '最終階段的動員和鞏固',
          startWeek: 19,
          duration: 6,
          objectives: ['動員支持者', '爭取中間選民'],
          keyActivities: ['造勢活動', '最後宣傳', '投票動員'],
          expectedOutcomes: ['投票率提升', '最終勝利'],
          status: 'completed'
        }
      ],
      
      keyEvents: [
        {
          id: 'event-1',
          name: '對手政策失言',
          description: '對手在科技政策上發表不當言論',
          week: 8,
          type: 'opportunity',
          impact: 'positive',
          affectedStrategies: ['strategy-north'],
          response: '立即發表回應，強調我方科技政策優勢'
        },
        {
          id: 'event-2',
          name: '農產品價格上漲',
          description: '颱風導致農產品價格大幅上漲',
          week: 12,
          type: 'opportunity',
          impact: 'positive',
          affectedStrategies: ['strategy-south'],
          response: '推出農民補助政策，展現對農業的重視'
        }
      ],
      
      decisionPoints: [
        {
          id: 'decision-1',
          name: '是否回應對手攻擊',
          description: '對手開始攻擊我方政策，是否正面回應',
          week: 10,
          options: [
            {
              id: 'option-1',
              name: '正面回應',
              description: '立即發表聲明澄清',
              pros: ['展現積極態度', '避免誤解擴大'],
              cons: ['可能陷入口水戰', '轉移焦點'],
              riskLevel: 'medium',
              resourceCost: 10000000
            },
            {
              id: 'option-2',
              name: '忽視不回應',
              description: '專注於自己的政策宣傳',
              pros: ['保持正面形象', '不被牽著走'],
              cons: ['可能被認為心虛', '負面印象擴散'],
              riskLevel: 'high',
              resourceCost: 0
            }
          ],
          selectedOption: 'option-1',
          rationale: '積極回應可以展現負責任的態度',
          consequences: ['成功澄清誤解', '獲得媒體正面報導']
        }
      ],
      
      timeline: [
        {
          week: 1,
          events: [
            { strategy: 'strategy-north', activity: '社群媒體攻勢開始', status: 'completed', impact: 3 },
            { strategy: 'strategy-south', activity: '基層走訪啟動', status: 'completed', impact: 4 }
          ]
        },
        {
          week: 2,
          events: [
            { strategy: 'strategy-north', activity: '數位政策論壇', status: 'completed', impact: 5 }
          ]
        }
      ],
      
      insights: [
        {
          id: 'insight-1',
          title: '年輕選民對數位政策反應熱烈',
          description: '數位政策論壇獲得超預期的關注，年輕選民參與度極高',
          type: 'discovery',
          priority: 'high',
          discoveredAt: 3,
          relatedStrategies: ['strategy-north'],
          actionRequired: true,
          actionItems: ['加大數位政策宣傳力度', '增加相關活動場次']
        },
        {
          id: 'insight-2',
          title: '南部基層組織動員力強',
          description: '南部基層走訪效果超出預期，組織動員能力很強',
          type: 'discovery',
          priority: 'medium',
          discoveredAt: 4,
          relatedStrategies: ['strategy-south'],
          actionRequired: false
        },
        {
          id: 'insight-3',
          title: '需要注意城鄉差距議題',
          description: '兵推過程中發現城鄉差距可能成為對手攻擊點',
          type: 'risk_alert',
          priority: 'high',
          discoveredAt: 8,
          relatedStrategies: ['strategy-north', 'strategy-south'],
          actionRequired: true,
          actionItems: ['準備城鄉平衡政策', '強調區域發展均衡']
        }
      ]
    },
    
    results: {
      summary: {
        winningStrategy: 'strategy-south',
        winProbability: 68,
        confidenceLevel: 75,
        keyFactors: [
          '南部傳統票倉鞏固效果佳',
          '農業政策獲得廣泛支持',
          '基層組織動員力強',
          '成本效益較高'
        ]
      },
      
      strategyComparison: [
        {
          strategyId: 'strategy-south',
          finalScore: 85,
          ranking: 1,
          strengths: ['票倉穩固', '成本效益高', '執行風險低'],
          weaknesses: ['創新形象不足', '年輕選民吸引力有限'],
          bestCaseScenario: '獲得南部70%以上選票，總體勝出15%',
          worstCaseScenario: '僅鞏固既有票倉，總體勝出5%',
          recommendedAdjustments: ['增加創新元素', '加強年輕選民溝通']
        },
        {
          strategyId: 'strategy-north',
          finalScore: 78,
          ranking: 2,
          strengths: ['創新形象強', '年輕選民支持', '媒體關注度高'],
          weaknesses: ['成本較高', '執行風險大', '傳統選民疏離'],
          bestCaseScenario: '年輕選民大幅支持，總體勝出12%',
          worstCaseScenario: '創新政策未獲認同，總體落後3%',
          recommendedAdjustments: ['降低執行風險', '兼顧傳統選民']
        }
      ],
      
      riskAssessment: {
        overallRiskLevel: 'medium',
        topRisks: [
          {
            id: 'top-risk-1',
            description: '城鄉差距議題被對手利用',
            probability: 70,
            impact: 'high',
            category: 'political',
            mitigation: '提前準備平衡政策'
          },
          {
            id: 'top-risk-2',
            description: '預算超支影響後續執行',
            probability: 40,
            impact: 'medium',
            category: 'resource',
            mitigation: '嚴格控制預算執行'
          }
        ],
        mitigationPlan: [
          '建立風險監控機制',
          '準備應急預案',
          '加強跨部門協調'
        ]
      },
      
      recommendations: [
        {
          id: 'rec-1',
          title: '採用混合策略',
          description: '結合南部傳統策略的穩定性和北部創新策略的吸引力',
          priority: 'critical',
          category: 'strategy',
          implementation: {
            timeframe: '立即執行',
            resources: ['策略團隊', '額外預算'],
            steps: [
              '重新分配資源比重',
              '設計跨區域訊息',
              '建立統一執行標準'
            ]
          },
          expectedImpact: '可提升整體勝算至75%'
        },
        {
          id: 'rec-2',
          title: '強化風險管控',
          description: '建立完善的風險預警和應對機制',
          priority: 'high',
          category: 'risk_management',
          implementation: {
            timeframe: '2週內',
            resources: ['風險管理團隊', '監控系統'],
            steps: [
              '建立風險指標體系',
              '設置預警機制',
              '制定應急預案'
            ]
          },
          expectedImpact: '降低整體風險等級至低風險'
        }
      ],
      
      nextSteps: [
        '立即調整策略組合，採用70%南部策略+30%北部策略',
        '加強城鄉平衡政策的準備和宣傳',
        '建立跨區域協調機制',
        '設置風險監控指標',
        '準備應對對手可能的反擊策略'
      ],
      
      lessons: [
        '傳統票倉的重要性不可忽視',
        '創新策略需要更謹慎的風險評估',
        '跨區域協調是成功的關鍵',
        '成本效益分析對資源配置很重要',
        '基層組織的動員能力是決勝關鍵'
      ]
    },
    
    participants: ['競選總幹事', '候選人A陣營', '候選人B陣營', '政策組長', '媒體組長'],
    tags: ['市長選舉', '候選人對抗', '資源配置', '風險管控']
  },

  {
    id: 'wg-002',
    name: '核能公投兵推',
    type: 'policy_analysis',
    description: '模擬核能公投中支持方與反對方的宣傳策略對抗，分析不同論述的說服力',
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-12-01'),
    status: 'running',

    settings: {
      timeframe: '3個月',
      regions: ['全台灣'],
      targetAudience: ['環保人士', '產業界', '一般民眾', '年輕世代'],
      assumptions: [
        '能源安全是核心議題',
        '環保與經濟發展存在衝突',
        '福島事件影響仍存在',
        '電價上漲是民眾關注點'
      ],
      objectives: [
        '獲得50%以上同意票',
        '提高投票率',
        '建立論述優勢',
        '中和對方宣傳效果'
      ],
      constraints: [
        '宣傳經費限制',
        '避免恐慌性宣傳',
        '基於事實論述'
      ]
    },

    strategies: [
      {
        id: 'strategy-pro-nuclear',
        name: '支持方 - 能源安全策略',
        description: '強調核能對能源安全和經濟發展的重要性',
        color: '#10B981',

        tactics: [
          {
            id: 'tactic-pro1',
            name: '專家背書',
            description: '邀請能源專家和經濟學者公開支持',
            type: 'media',
            timeline: { startWeek: 2, duration: 8 },
            budget: 20000000,
            expectedImpact: 8
          },
          {
            id: 'tactic-pro2',
            name: '產業界動員',
            description: '動員製造業和高耗能產業表態支持',
            type: 'grassroots',
            timeline: { startWeek: 4, duration: 10 },
            budget: 30000000,
            expectedImpact: 7
          }
        ],

        expectedOutcomes: [
          {
            description: '產業界支持度達80%',
            probability: 85,
            impact: 'high',
            timeframe: '2個月內',
            metrics: { voteShare: 15, awareness: 40, sentiment: 0.3 }
          }
        ],

        risks: [
          {
            id: 'risk-pro1',
            description: '核安事故新聞影響',
            probability: 30,
            impact: 'high',
            category: 'media',
            mitigation: '準備快速澄清機制'
          }
        ],

        opportunities: [
          {
            id: 'opp-pro1',
            description: '電價上漲引發關注',
            probability: 70,
            impact: 'high',
            timeWindow: '隨時',
            requirements: ['經濟數據', '專家解釋']
          }
        ],

        resourceRequirements: [
          {
            type: 'budget',
            amount: 50000000,
            unit: '元',
            priority: 'critical',
            availability: 'available'
          }
        ],

        metrics: {
          successProbability: 65,
          confidenceLevel: 70,
          riskLevel: 'medium',
          difficulty: 7,
          timeToImpact: 60,
          costEffectiveness: 6
        },

        predictions: {
          voteShareChange: 8,
          supporterGrowth: 500000,
          opponentResponse: '可能強化核安風險論述',
          mediaImpact: 'positive',
          publicSentiment: 0.2
        }
      },

      {
        id: 'strategy-anti-nuclear',
        name: '反對方 - 安全優先策略',
        description: '強調核能安全風險和再生能源替代方案',
        color: '#EF4444',

        tactics: [
          {
            id: 'tactic-anti1',
            name: '安全風險宣傳',
            description: '製作核災風險教育影片和文宣',
            type: 'media',
            timeline: { startWeek: 1, duration: 12 },
            budget: 40000000,
            expectedImpact: 9
          },
          {
            id: 'tactic-anti2',
            name: '綠能替代方案',
            description: '推廣太陽能、風能等再生能源方案',
            type: 'policy',
            timeline: { startWeek: 6, duration: 8 },
            budget: 25000000,
            expectedImpact: 7
          }
        ],

        expectedOutcomes: [
          {
            description: '環保團體全力支持',
            probability: 90,
            impact: 'high',
            timeframe: '1個月內',
            metrics: { voteShare: 12, awareness: 35, sentiment: 0.4 }
          }
        ],

        risks: [
          {
            id: 'risk-anti1',
            description: '被批評阻礙經濟發展',
            probability: 60,
            impact: 'medium',
            category: 'political',
            mitigation: '強調綠能產業機會'
          }
        ],

        opportunities: [
          {
            id: 'opp-anti1',
            description: '國際核安事件',
            probability: 20,
            impact: 'high',
            timeWindow: '不確定',
            requirements: ['快速反應能力']
          }
        ],

        resourceRequirements: [
          {
            type: 'budget',
            amount: 65000000,
            unit: '元',
            priority: 'critical',
            availability: 'available'
          }
        ],

        metrics: {
          successProbability: 58,
          confidenceLevel: 65,
          riskLevel: 'medium',
          difficulty: 6,
          timeToImpact: 45,
          costEffectiveness: 7
        },

        predictions: {
          voteShareChange: -8,
          supporterGrowth: 400000,
          opponentResponse: '可能強化經濟發展論述',
          mediaImpact: 'positive',
          publicSentiment: 0.3
        }
      }
    ],

    simulation: {
      phases: [
        {
          id: 'phase-1',
          name: '論述建立期',
          description: '雙方建立核心論述和支持基礎',
          startWeek: 1,
          duration: 4,
          objectives: ['建立論述框架', '動員核心支持者'],
          keyActivities: ['專家站台', '基礎宣傳'],
          expectedOutcomes: ['論述方向確立', '支持者動員'],
          status: 'completed'
        }
      ],

      keyEvents: [],
      decisionPoints: [],
      timeline: [],
      insights: [
        {
          id: 'insight-ref1',
          title: '民眾對核能認知分歧嚴重',
          description: '支持與反對方各有堅定支持者，中間選民是關鍵',
          type: 'discovery',
          priority: 'high',
          discoveredAt: 2,
          relatedStrategies: ['strategy-pro-nuclear', 'strategy-anti-nuclear'],
          actionRequired: true,
          actionItems: ['加強中間選民溝通', '準備理性對話平台']
        }
      ]
    },

    results: {
      summary: {
        winningStrategy: 'strategy-pro-nuclear',
        winProbability: 52,
        confidenceLevel: 60,
        keyFactors: [
          '經濟論述較有說服力',
          '產業界支持力度強',
          '電價議題發酵',
          '但核安疑慮仍存在'
        ]
      },

      strategyComparison: [
        {
          strategyId: 'strategy-pro-nuclear',
          finalScore: 75,
          ranking: 1,
          strengths: ['經濟論述強', '專家支持', '產業動員'],
          weaknesses: ['核安疑慮', '年輕世代反對'],
          bestCaseScenario: '獲得55%同意票',
          worstCaseScenario: '僅獲得45%同意票',
          recommendedAdjustments: ['加強安全保證', '回應環保關切']
        }
      ],

      riskAssessment: {
        overallRiskLevel: 'high',
        topRisks: [],
        mitigationPlan: []
      },

      recommendations: [],
      nextSteps: [],
      lessons: []
    },

    participants: ['公投推動聯盟', '支持方代表', '反對方代表', '民調專家'],
    tags: ['公投', '核能政策', '民意動員', '論述戰']
  }
];
