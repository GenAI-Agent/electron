import { WarGameProject } from '../types/wargame';

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
    
    // 總體統計
    summary: {
      totalRuns: 8,
      winCount: 5, // 候選人A獲勝次數
      lossCount: 3, // 候選人B獲勝次數
      drawCount: 0,
      averageWinRate: 62.5, // 候選人A平均勝率
      keyInsights: [
        '經濟議題是決勝關鍵，8次兵推中經濟表現好的情境下A候選人勝率達80%',
        '年輕選民投票率對結果影響巨大，投票率每提升5%，A候選人勝率增加12%',
        '負面事件的時機點很重要，選前1個月發生的負面事件影響最大',
        '社群媒體攻勢在前3個月效果最佳，後期效果遞減'
      ],
      recommendedStrategy: '混合策略：前期重點數位宣傳+中期政策發表+後期基層動員'
    },
    
    // 多次兵推記錄（簡化版，只顯示關鍵信息）
    warGames: [
      {
        id: 'wgs-001-1',
        runNumber: 1,
        name: '基準情境兵推',
        description: '標準經濟環境，無重大事件，雙方實力相當',
        createdAt: new Date('2024-11-15'),
        status: 'completed',
        
        variables: {
          environment: {
            economicCondition: 'neutral',
            mediaEnvironment: 'neutral',
            publicMood: 'neutral',
            majorEvents: []
          },
          playerStates: {
            'candidate-a': {
              initialSupport: 45,
              budget: 200000000,
              teamStrength: 7,
              mediaRelations: 'good',
              scandals: [],
              advantages: ['現任優勢', '施政經驗']
            },
            'candidate-b': {
              initialSupport: 42,
              budget: 180000000,
              teamStrength: 6,
              mediaRelations: 'neutral',
              scandals: [],
              advantages: ['改革形象', '年輕活力']
            }
          },
          voterStructure: {
            turnoutRate: 65,
            demographics: {
              '年輕選民': { percentage: 25, volatility: 8, keyIssues: ['住宅', '就業'] },
              '中產階級': { percentage: 40, volatility: 5, keyIssues: ['教育', '交通'] },
              '長者': { percentage: 35, volatility: 3, keyIssues: ['醫療', '社福'] }
            }
          },
          assumptions: ['無重大突發事件', '媒體報導相對平衡', '選民理性投票']
        },
        
        strategies: [], // 簡化
        simulation: {
          phases: [],
          timeline: [
            {
              period: 1,
              date: '2024-06-01',
              playerData: {
                'candidate-a': {
                  supportRate: 45,
                  momentum: 0,
                  mediaExposure: 60,
                  campaignActivity: 40,
                  budgetSpent: 10000000,
                  keyActions: ['競選總部成立', '政見發表會']
                },
                'candidate-b': {
                  supportRate: 42,
                  momentum: 2,
                  mediaExposure: 55,
                  campaignActivity: 50,
                  budgetSpent: 12000000,
                  keyActions: ['青年政策發表', '社群媒體攻勢']
                }
              },
              environmentData: {
                mediaAttention: 30,
                publicInterest: 25,
                majorEvents: [],
                polls: [
                  {
                    pollster: '台灣民意基金會',
                    date: '2024-06-01',
                    sampleSize: 1200,
                    results: { 'candidate-a': 45, 'candidate-b': 42, 'undecided': 13 },
                    marginOfError: 2.8,
                    trend: 'stable'
                  }
                ]
              }
            },
            {
              period: 24,
              date: '2024-11-26',
              playerData: {
                'candidate-a': {
                  supportRate: 52,
                  momentum: 5,
                  mediaExposure: 95,
                  campaignActivity: 90,
                  budgetSpent: 195000000,
                  keyActions: ['最後衝刺造勢', '投票動員']
                },
                'candidate-b': {
                  supportRate: 48,
                  momentum: -2,
                  mediaExposure: 90,
                  campaignActivity: 85,
                  budgetSpent: 175000000,
                  keyActions: ['最後政見發表', '基層動員']
                }
              },
              environmentData: {
                mediaAttention: 100,
                publicInterest: 95,
                majorEvents: ['選前之夜'],
                polls: [
                  {
                    pollster: '聯合報民調',
                    date: '2024-11-24',
                    sampleSize: 2000,
                    results: { 'candidate-a': 52, 'candidate-b': 48 },
                    marginOfError: 2.2,
                    trend: 'up'
                  }
                ]
              }
            }
          ],
          keyEvents: [
            {
              id: 'event-1-1',
              name: '颱風災害處理',
              description: '8月底颱風襲台，考驗現任市長危機處理能力',
              week: 12,
              type: 'external_event',
              impact: 'positive',
              affectedStrategies: ['candidate-a'],
              response: '展現危機處理能力，獲得民眾肯定'
            }
          ],
          decisionPoints: [],
          insights: [
            {
              id: 'insight-1-1',
              title: '現任優勢在危機處理中顯現',
              description: '颱風災害處理展現了現任市長的執政能力',
              type: 'discovery',
              priority: 'high',
              discoveredAt: 12,
              relatedStrategies: ['candidate-a'],
              actionRequired: false
            }
          ],
          periodicData: []
        },
        
        results: {
          summary: {
            winningStrategy: 'candidate-a',
            winProbability: 52,
            confidenceLevel: 75,
            keyFactors: ['現任優勢', '危機處理能力', '穩定施政']
          },
          strategyComparison: [],
          riskAssessment: { overallRiskLevel: 'low', topRisks: [], mitigationPlan: [] },
          recommendations: [],
          nextSteps: [],
          lessons: ['現任優勢在穩定環境下較為明顯', '危機處理是加分項']
        }
      },
      
      {
        id: 'wgs-001-2',
        runNumber: 2,
        name: '經濟衰退情境',
        description: '經濟表現不佳，失業率上升，民眾對現任不滿',
        createdAt: new Date('2024-11-18'),
        status: 'completed',
        
        variables: {
          environment: {
            economicCondition: 'poor',
            mediaEnvironment: 'hostile',
            publicMood: 'pessimistic',
            majorEvents: ['失業率創新高', '房價持續上漲']
          },
          playerStates: {
            'candidate-a': {
              initialSupport: 38,
              budget: 200000000,
              teamStrength: 7,
              mediaRelations: 'poor',
              scandals: ['市政弊案傳聞'],
              advantages: ['施政經驗']
            },
            'candidate-b': {
              initialSupport: 48,
              budget: 180000000,
              teamStrength: 7,
              mediaRelations: 'good',
              scandals: [],
              advantages: ['改革形象', '經濟政策', '反現任情緒']
            }
          },
          voterStructure: {
            turnoutRate: 68,
            demographics: {
              '年輕選民': { percentage: 25, volatility: 12, keyIssues: ['就業', '住宅', '薪資'] },
              '中產階級': { percentage: 40, volatility: 8, keyIssues: ['經濟', '稅負', '生活成本'] },
              '長者': { percentage: 35, volatility: 5, keyIssues: ['物價', '醫療', '退休保障'] }
            }
          },
          assumptions: ['經濟持續低迷', '反現任情緒高漲', '改革呼聲強烈']
        },
        
        strategies: [],
        simulation: {
          phases: [
            { id: 'phase-2-1', name: '經濟議題突出期', description: '經濟衰退議題開始影響選情', startWeek: 1, duration: 8, objectives: ['應對經濟質疑', '提出解決方案'], keyActivities: ['經濟政策說明', '專家背書'], expectedOutcomes: ['穩定民心'], status: 'completed' },
            { id: 'phase-2-2', name: '改革訴求期', description: '挑戰者主打改革牌', startWeek: 9, duration: 10, objectives: ['建立改革形象', '爭取求變選民'], keyActivities: ['改革政見', '對比宣傳'], expectedOutcomes: ['改革聲量提升'], status: 'completed' },
            { id: 'phase-2-3', name: '最後攻防期', description: '雙方最後階段激烈競爭', startWeek: 19, duration: 6, objectives: ['鞏固基本盤', '爭取搖擺選民'], keyActivities: ['密集造勢', '負面攻擊'], expectedOutcomes: ['選情膠著'], status: 'completed' }
          ],
          timeline: [
            {
              period: 1, date: '2024-06-01',
              playerData: {
                'candidate-a': { supportRate: 48, momentum: -1, mediaExposure: 65, campaignActivity: 50, budgetSpent: 15000000, keyActions: ['經濟政策說明', '穩定民心'] },
                'candidate-b': { supportRate: 40, momentum: 2, mediaExposure: 60, campaignActivity: 60, budgetSpent: 18000000, keyActions: ['經濟批評', '改革訴求'] }
              },
              environmentData: { mediaAttention: 50, publicInterest: 45, majorEvents: ['經濟數據不佳'], polls: [{ pollster: '台灣民意基金會', date: '2024-06-01', sampleSize: 1200, results: { 'candidate-a': 48, 'candidate-b': 40, 'undecided': 12 }, marginOfError: 2.8, trend: 'down' }] }
            },
            {
              period: 8, date: '2024-07-20',
              playerData: {
                'candidate-a': { supportRate: 46, momentum: -1, mediaExposure: 75, campaignActivity: 70, budgetSpent: 70000000, keyActions: ['政績辯護', '專家背書'] },
                'candidate-b': { supportRate: 44, momentum: 3, mediaExposure: 80, campaignActivity: 75, budgetSpent: 65000000, keyActions: ['改革政見', '經濟方案'] }
              },
              environmentData: { mediaAttention: 70, publicInterest: 65, majorEvents: ['失業率上升'], polls: [{ pollster: 'TVBS民調', date: '2024-07-18', sampleSize: 1500, results: { 'candidate-a': 46, 'candidate-b': 44, 'undecided': 10 }, marginOfError: 2.5, trend: 'down' }] }
            },
            {
              period: 16, date: '2024-09-14',
              playerData: {
                'candidate-a': { supportRate: 44, momentum: -2, mediaExposure: 85, campaignActivity: 85, budgetSpent: 130000000, keyActions: ['危機處理', '未來承諾'] },
                'candidate-b': { supportRate: 48, momentum: 2, mediaExposure: 90, campaignActivity: 80, budgetSpent: 120000000, keyActions: ['改革辯論', '願景描繪'] }
              },
              environmentData: { mediaAttention: 90, publicInterest: 85, majorEvents: ['經濟復甦計劃辯論'], polls: [{ pollster: '中時民調', date: '2024-09-12', sampleSize: 1800, results: { 'candidate-a': 44, 'candidate-b': 48, 'undecided': 8 }, marginOfError: 2.3, trend: 'down' }] }
            },
            {
              period: 24, date: '2024-11-26',
              playerData: {
                'candidate-a': { supportRate: 45, momentum: 0, mediaExposure: 95, campaignActivity: 95, budgetSpent: 200000000, keyActions: ['最後衝刺', '穩定訴求'] },
                'candidate-b': { supportRate: 55, momentum: 1, mediaExposure: 95, campaignActivity: 90, budgetSpent: 180000000, keyActions: ['改革承諾', '勝選宣言'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 95, majorEvents: ['最終民調'], polls: [{ pollster: '聯合報民調', date: '2024-11-24', sampleSize: 2000, results: { 'candidate-a': 45, 'candidate-b': 55 }, marginOfError: 2.2, trend: 'stable' }] }
            }
          ],
          keyEvents: [
            { id: 'event-2-1', name: '經濟數據惡化', description: '失業率和通膨數據雙雙惡化', week: 3, type: 'external_event', impact: 'negative', affectedStrategies: ['candidate-a'], response: '提出經濟振興方案' },
            { id: 'event-2-2', name: '改革政見發表', description: '挑戰者發表完整改革政見', week: 10, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-b'], response: '獲得改革派支持' },
            { id: 'event-2-3', name: '經濟政策辯論', description: '兩候選人就經濟政策進行辯論', week: 18, type: 'milestone', impact: 'neutral', affectedStrategies: ['candidate-a', 'candidate-b'], response: '各有表現但挑戰者略勝' }
          ],
          decisionPoints: [],
          insights: [
            { id: 'insight-2-1', title: '經濟衰退重創現任優勢', description: '經濟表現不佳讓現任候選人失去最大優勢，支持度從48%下滑至45%，經濟議題成為選戰核心', type: 'discovery', priority: 'high', discoveredAt: 6, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['提出具體經濟振興方案', '強調過往經濟成就', '邀請經濟專家背書'] },
            { id: 'insight-2-2', title: '改革訴求在經濟困難時期特別有效', description: '民眾對現狀不滿，改革訴求獲得廣泛共鳴，挑戰者支持度從40%提升至55%', type: 'discovery', priority: 'high', discoveredAt: 12, relatedStrategies: ['candidate-b'], actionRequired: false },
            { id: 'insight-2-3', title: '經濟議題主導選戰走向', description: '所有其他議題都被經濟問題蓋過，成為選戰主軸，媒體關注度達70%', type: 'discovery', priority: 'medium', discoveredAt: 8, relatedStrategies: ['candidate-a', 'candidate-b'], actionRequired: true, actionItems: ['深化經濟政策論述', '準備經濟數據辯護'] },
            { id: 'insight-2-4', title: '現任候選人面臨信任危機', description: '經濟管理能力受到質疑，可能影響其他政策可信度，需要重建民眾信心', type: 'risk_alert', priority: 'high', discoveredAt: 14, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['重建經濟管理信心', '展現危機處理能力', '提出具體改善措施'] },
            { id: 'insight-2-5', title: '中間選民成為關鍵搖擺群體', description: '經濟議題讓中間選民更容易被說服，成為決勝關鍵', type: 'discovery', priority: 'medium', discoveredAt: 16, relatedStrategies: ['candidate-a', 'candidate-b'], actionRequired: true, actionItems: ['加強中間選民溝通', '提出務實經濟政策'] },
            { id: 'insight-2-6', title: '負面經濟數據持續發酵風險', description: '如果經濟數據持續惡化，現任候選人劣勢將進一步擴大', type: 'risk_alert', priority: 'medium', discoveredAt: 20, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['準備經濟數據應對策略', '建立經濟專家支持網絡'] }
          ],
          periodicData: []
        },
        
        results: {
          summary: {
            winningStrategy: 'candidate-b',
            winProbability: 55,
            confidenceLevel: 80,
            keyFactors: ['反現任情緒', '經濟議題', '改革期待']
          },
          strategyComparison: [],
          riskAssessment: { overallRiskLevel: 'medium', topRisks: [], mitigationPlan: [] },
          recommendations: [],
          nextSteps: [],
          lessons: ['經濟表現是現任連任的關鍵', '危機時期改革訴求更有說服力']
        },
        
        comparison: {
          previousRun: 'wgs-001-1',
          keyDifferences: [
            '經濟環境從中性轉為不佳',
            '現任支持度下降7%',
            '挑戰者獲得反現任情緒加持',
            '年輕選民搖擺程度增加50%'
          ],
          performanceChange: -7 // 候選人A相對表現下降7%
        }
      },

      {
        id: 'wgs-001-3',
        runNumber: 3,
        name: '媒體敵對情境',
        description: '媒體對現任候選人持負面態度，大量負面報導',
        createdAt: new Date('2024-11-20'),
        status: 'completed',

        variables: {
          environment: {
            economicCondition: 'neutral',
            mediaEnvironment: 'hostile',
            publicMood: 'neutral',
            majorEvents: ['媒體爆料', '負面新聞連環爆']
          },
          playerStates: {
            'candidate-a': {
              initialSupport: 43,
              budget: 200000000,
              teamStrength: 7,
              mediaRelations: 'poor',
              scandals: ['小型爭議事件'],
              advantages: ['施政經驗']
            },
            'candidate-b': {
              initialSupport: 44,
              budget: 180000000,
              teamStrength: 7,
              mediaRelations: 'good',
              scandals: [],
              advantages: ['媒體支持', '清新形象']
            }
          },
          voterStructure: {
            turnoutRate: 66,
            demographics: {
              '年輕選民': { percentage: 25, volatility: 10, keyIssues: ['媒體公正', '政治清廉'] },
              '中產階級': { percentage: 40, volatility: 7, keyIssues: ['政府誠信', '施政能力'] },
              '長者': { percentage: 35, volatility: 4, keyIssues: ['穩定', '經驗'] }
            }
          },
          assumptions: ['媒體持續負面報導', '候選人需要危機處理', '選民關注誠信議題']
        },

        strategies: [],
        simulation: {
          phases: [
            { id: 'phase-3-1', name: '危機處理期', description: '應對媒體負面報導', startWeek: 1, duration: 8, objectives: ['澄清爭議', '重建形象'], keyActivities: ['記者會', '正面宣傳'], expectedOutcomes: ['負面影響控制'], status: 'completed' },
            { id: 'phase-3-2', name: '形象重建期', description: '透過政績展示重建信任', startWeek: 9, duration: 10, objectives: ['展現施政能力', '爭取中間選民'], keyActivities: ['政績發表', '基層走訪'], expectedOutcomes: ['支持度回升'], status: 'completed' },
            { id: 'phase-3-3', name: '最後衝刺期', description: '全力動員支持者', startWeek: 19, duration: 6, objectives: ['鞏固票倉', '提升投票率'], keyActivities: ['造勢活動', '投票動員'], expectedOutcomes: ['支持者動員'], status: 'completed' }
          ],
          timeline: [
            {
              period: 1,
              date: '2024-06-01',
              playerData: {
                'candidate-a': { supportRate: 43, momentum: -1, mediaExposure: 70, campaignActivity: 45, budgetSpent: 15000000, keyActions: ['危機處理', '澄清記者會'] },
                'candidate-b': { supportRate: 44, momentum: 2, mediaExposure: 60, campaignActivity: 55, budgetSpent: 12000000, keyActions: ['政見發表', '媒體造勢'] }
              },
              environmentData: {
                mediaAttention: 80, publicInterest: 60, majorEvents: ['媒體爆料'],
                polls: [{ pollster: '台灣民意基金會', date: '2024-06-01', sampleSize: 1200, results: { 'candidate-a': 43, 'candidate-b': 44, 'undecided': 13 }, marginOfError: 2.8, trend: 'down' }]
              }
            },
            {
              period: 6,
              date: '2024-07-06',
              playerData: {
                'candidate-a': { supportRate: 41, momentum: -2, mediaExposure: 75, campaignActivity: 60, budgetSpent: 45000000, keyActions: ['政績宣傳', '媒體澄清'] },
                'candidate-b': { supportRate: 46, momentum: 3, mediaExposure: 65, campaignActivity: 65, budgetSpent: 35000000, keyActions: ['改革政見', '青年論壇'] }
              },
              environmentData: {
                mediaAttention: 85, publicInterest: 65, majorEvents: ['負面新聞持續'],
                polls: [{ pollster: 'TVBS民調', date: '2024-07-05', sampleSize: 1500, results: { 'candidate-a': 41, 'candidate-b': 46, 'undecided': 13 }, marginOfError: 2.5, trend: 'down' }]
              }
            },
            {
              period: 12,
              date: '2024-08-12',
              playerData: {
                'candidate-a': { supportRate: 44, momentum: 2, mediaExposure: 80, campaignActivity: 75, budgetSpent: 90000000, keyActions: ['市政成果展', '基層走訪'] },
                'candidate-b': { supportRate: 48, momentum: 1, mediaExposure: 75, campaignActivity: 70, budgetSpent: 70000000, keyActions: ['政策辯論', '社群宣傳'] }
              },
              environmentData: {
                mediaAttention: 90, publicInterest: 75, majorEvents: ['政績展示活動'],
                polls: [{ pollster: '中時民調', date: '2024-08-10', sampleSize: 1800, results: { 'candidate-a': 44, 'candidate-b': 48, 'undecided': 8 }, marginOfError: 2.3, trend: 'up' }]
              }
            },
            {
              period: 18,
              date: '2024-09-18',
              playerData: {
                'candidate-a': { supportRate: 46, momentum: 1, mediaExposure: 85, campaignActivity: 85, budgetSpent: 140000000, keyActions: ['電視辯論', '政見發表'] },
                'candidate-b': { supportRate: 50, momentum: 2, mediaExposure: 85, campaignActivity: 80, budgetSpent: 120000000, keyActions: ['改革承諾', '媒體專訪'] }
              },
              environmentData: {
                mediaAttention: 95, publicInterest: 85, majorEvents: ['候選人辯論'],
                polls: [{ pollster: '民視民調', date: '2024-09-15', sampleSize: 2000, results: { 'candidate-a': 46, 'candidate-b': 50, 'undecided': 4 }, marginOfError: 2.2, trend: 'stable' }]
              }
            },
            {
              period: 24,
              date: '2024-11-26',
              playerData: {
                'candidate-a': { supportRate: 47, momentum: 1, mediaExposure: 95, campaignActivity: 95, budgetSpent: 200000000, keyActions: ['最後衝刺', '投票動員'] },
                'candidate-b': { supportRate: 53, momentum: 3, mediaExposure: 90, campaignActivity: 90, budgetSpent: 180000000, keyActions: ['勝選宣言', '支持者動員'] }
              },
              environmentData: {
                mediaAttention: 100, publicInterest: 95, majorEvents: ['選前之夜'],
                polls: [{ pollster: '聯合報民調', date: '2024-11-24', sampleSize: 2000, results: { 'candidate-a': 47, 'candidate-b': 53 }, marginOfError: 2.2, trend: 'stable' }]
              }
            }
          ],
          keyEvents: [
            { id: 'event-3-1', name: '媒體爆料事件', description: '媒體爆出現任候選人小型爭議', week: 2, type: 'risk_materialized', impact: 'negative', affectedStrategies: ['candidate-a'], response: '立即召開記者會澄清' },
            { id: 'event-3-2', name: '澄清記者會', description: '候選人A召開記者會澄清爭議', week: 3, type: 'milestone', impact: 'positive', affectedStrategies: ['candidate-a'], response: '獲得部分民眾理解' },
            { id: 'event-3-3', name: '政績展示活動', description: '大型市政成果展覽', week: 12, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-a'], response: '展現施政能力，支持度回升' }
          ],
          decisionPoints: [
            { id: 'decision-3-1', name: '是否主動回應媒體攻擊', description: '面對持續負面報導的應對策略', week: 4, options: [
              { id: 'option-3-1-1', name: '積極回應', description: '主動澄清每一項指控', pros: ['展現負責態度'], cons: ['可能陷入防守'], riskLevel: 'medium', resourceCost: 20000000 },
              { id: 'option-3-1-2', name: '專注政績', description: '用政績回應質疑', pros: ['正面形象'], cons: ['可能被認為迴避'], riskLevel: 'low', resourceCost: 15000000 }
            ], selectedOption: 'option-3-1-2', rationale: '以正面政績回應更有說服力', consequences: ['成功轉移焦點到施政表現'] }
          ],
          insights: [
            { id: 'insight-3-1', title: '媒體環境對現任候選人影響巨大', description: '負面媒體報導顯著影響選民觀感，初期支持度下降2%', type: 'discovery', priority: 'high', discoveredAt: 4, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['加強媒體關係', '準備危機處理機制'] },
            { id: 'insight-3-2', title: '政績展示是有效反擊手段', description: '透過具體政績展示，成功扭轉部分負面印象', type: 'discovery', priority: 'medium', discoveredAt: 12, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-3-3', title: '挑戰者受惠於媒體優勢', description: '候選人B在媒體友善環境下，支持度穩定成長', type: 'discovery', priority: 'medium', discoveredAt: 8, relatedStrategies: ['candidate-b'], actionRequired: false }
          ],
          periodicData: []
        },

        results: {
          summary: { winningStrategy: 'candidate-b', winProbability: 53, confidenceLevel: 78, keyFactors: ['媒體優勢', '負面事件處理', '清新形象'] },
          strategyComparison: [], riskAssessment: { overallRiskLevel: 'high', topRisks: [], mitigationPlan: [] },
          recommendations: [], nextSteps: [], lessons: ['媒體關係是選戰關鍵', '危機處理能力決定成敗']
        },

        comparison: {
          previousRun: 'wgs-001-2',
          keyDifferences: ['媒體環境從敵對轉為中性', '現任候選人面臨媒體壓力', '選民更關注誠信議題'],
          performanceChange: 2
        }
      },

      {
        id: 'wgs-001-4',
        name: '高投票率情境',
        runNumber: 4,
        description: '年輕選民高度動員，整體投票率創新高',
        createdAt: new Date('2024-11-22'),
        status: 'completed',

        variables: {
          environment: { economicCondition: 'neutral', mediaEnvironment: 'neutral', publicMood: 'optimistic', majorEvents: ['青年動員活動', '投票率創新高'] },
          playerStates: {
            'candidate-a': { initialSupport: 44, budget: 200000000, teamStrength: 7, mediaRelations: 'neutral', scandals: [], advantages: ['施政經驗', '穩定形象'] },
            'candidate-b': { initialSupport: 43, budget: 180000000, teamStrength: 8, mediaRelations: 'good', scandals: [], advantages: ['年輕支持', '改革形象'] }
          },
          voterStructure: {
            turnoutRate: 72,
            demographics: {
              '年輕選民': { percentage: 30, volatility: 6, keyIssues: ['未來發展', '改革創新'] },
              '中產階級': { percentage: 40, volatility: 5, keyIssues: ['穩定發展', '生活品質'] },
              '長者': { percentage: 30, volatility: 3, keyIssues: ['社會福利', '醫療保健'] }
            }
          },
          assumptions: ['年輕選民高度參與', '社群媒體影響力強', '改革議題受關注']
        },

        strategies: [],
        simulation: {
          phases: [
            { id: 'phase-4-1', name: '青年動員期', description: '大規模動員年輕選民', startWeek: 1, duration: 10, objectives: ['提升年輕選民參與', '建立數位聲量'], keyActivities: ['社群宣傳', '校園活動'], expectedOutcomes: ['年輕選民關注度提升'], status: 'completed' },
            { id: 'phase-4-2', name: '政策推廣期', description: '重點推廣改革政策', startWeek: 11, duration: 8, objectives: ['政策認知提升', '差異化競爭'], keyActivities: ['政策說明會', '專家背書'], expectedOutcomes: ['政策支持度上升'], status: 'completed' },
            { id: 'phase-4-3', name: '投票動員期', description: '全面動員投票', startWeek: 19, duration: 6, objectives: ['最大化投票率', '確保支持者投票'], keyActivities: ['投票宣導', '交通接駁'], expectedOutcomes: ['創新高投票率'], status: 'completed' }
          ],
          timeline: [
            {
              period: 1, date: '2024-06-01',
              playerData: {
                'candidate-a': { supportRate: 44, momentum: 0, mediaExposure: 60, campaignActivity: 50, budgetSpent: 12000000, keyActions: ['競選啟動', '政見發表'] },
                'candidate-b': { supportRate: 43, momentum: 1, mediaExposure: 65, campaignActivity: 60, budgetSpent: 15000000, keyActions: ['青年動員', '社群攻勢'] }
              },
              environmentData: { mediaAttention: 40, publicInterest: 35, majorEvents: ['青年動員活動啟動'], polls: [{ pollster: '台灣民意基金會', date: '2024-06-01', sampleSize: 1200, results: { 'candidate-a': 44, 'candidate-b': 43, 'undecided': 13 }, marginOfError: 2.8, trend: 'stable' }] }
            },
            {
              period: 6, date: '2024-07-06',
              playerData: {
                'candidate-a': { supportRate: 45, momentum: 1, mediaExposure: 70, campaignActivity: 65, budgetSpent: 45000000, keyActions: ['青年政策', '校園訪問'] },
                'candidate-b': { supportRate: 45, momentum: 2, mediaExposure: 75, campaignActivity: 75, budgetSpent: 50000000, keyActions: ['大學演講', '網路直播'] }
              },
              environmentData: { mediaAttention: 60, publicInterest: 55, majorEvents: ['大學生論壇'], polls: [{ pollster: 'TVBS民調', date: '2024-07-05', sampleSize: 1500, results: { 'candidate-a': 45, 'candidate-b': 45, 'undecided': 10 }, marginOfError: 2.5, trend: 'up' }] }
            },
            {
              period: 12, date: '2024-08-12',
              playerData: {
                'candidate-a': { supportRate: 46, momentum: 0, mediaExposure: 80, campaignActivity: 75, budgetSpent: 90000000, keyActions: ['政績展示', '經驗強調'] },
                'candidate-b': { supportRate: 48, momentum: 3, mediaExposure: 85, campaignActivity: 85, budgetSpent: 85000000, keyActions: ['改革政策', '青年政策'] }
              },
              environmentData: { mediaAttention: 75, publicInterest: 70, majorEvents: ['青年政策辯論'], polls: [{ pollster: '中時民調', date: '2024-08-10', sampleSize: 1800, results: { 'candidate-a': 46, 'candidate-b': 48, 'undecided': 6 }, marginOfError: 2.3, trend: 'up' }] }
            },
            {
              period: 18, date: '2024-09-18',
              playerData: {
                'candidate-a': { supportRate: 45, momentum: -1, mediaExposure: 85, campaignActivity: 85, budgetSpent: 140000000, keyActions: ['穩定訴求', '長者動員'] },
                'candidate-b': { supportRate: 52, momentum: 3, mediaExposure: 90, campaignActivity: 90, budgetSpent: 130000000, keyActions: ['青年動員', '投票宣導'] }
              },
              environmentData: { mediaAttention: 90, publicInterest: 85, majorEvents: ['投票率預測創新高'], polls: [{ pollster: '民視民調', date: '2024-09-15', sampleSize: 2000, results: { 'candidate-a': 45, 'candidate-b': 52, 'undecided': 3 }, marginOfError: 2.2, trend: 'up' }] }
            },
            {
              period: 24, date: '2024-11-26',
              playerData: {
                'candidate-a': { supportRate: 44, momentum: -1, mediaExposure: 95, campaignActivity: 95, budgetSpent: 200000000, keyActions: ['最後衝刺', '基層動員'] },
                'candidate-b': { supportRate: 56, momentum: 2, mediaExposure: 95, campaignActivity: 90, budgetSpent: 180000000, keyActions: ['青年動員', '投票日動員'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 95, majorEvents: ['投票率72%創新高'], polls: [{ pollster: '聯合報民調', date: '2024-11-24', sampleSize: 2000, results: { 'candidate-a': 44, 'candidate-b': 56 }, marginOfError: 2.2, trend: 'stable' }] }
            }
          ],
          keyEvents: [
            { id: 'event-4-1', name: '大學生動員活動', description: '全台大學生發起投票動員', week: 4, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-b'], response: '積極參與並獲得青年支持' },
            { id: 'event-4-2', name: '投票率創新高', description: '選舉日投票率達到72%創歷史新高', week: 24, type: 'external_event', impact: 'positive', affectedStrategies: ['candidate-b'], response: '年輕選民大量投票有利挑戰者' }
          ],
          decisionPoints: [],
          insights: [
            { id: 'insight-4-1', title: '高投票率有利於挑戰者', description: '投票率從65%提升到72%，年輕選民大量投票明顯有利於候選人B，支持度從43%提升至56%', type: 'discovery', priority: 'high', discoveredAt: 20, relatedStrategies: ['candidate-b'], actionRequired: true, actionItems: ['分析投票率影響因素', '制定動員策略'] },
            { id: 'insight-4-2', title: '社群媒體動員效果顯著', description: '透過社群媒體的青年動員活動成效超出預期，網路聲量提升300%', type: 'discovery', priority: 'high', discoveredAt: 8, relatedStrategies: ['candidate-b'], actionRequired: false },
            { id: 'insight-4-3', title: '現任候選人在年輕選民中劣勢明顯', description: '儘管推出青年政策，但在年輕選民中仍處劣勢，支持度僅35%', type: 'risk_alert', priority: 'high', discoveredAt: 16, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['重新檢視青年政策', '加強與年輕世代溝通'] },
            { id: 'insight-4-4', title: '數位原生世代改變選戰規則', description: '年輕選民更依賴社群媒體獲取資訊，傳統媒體影響力下降', type: 'discovery', priority: 'medium', discoveredAt: 12, relatedStrategies: ['candidate-a', 'candidate-b'], actionRequired: true, actionItems: ['加強數位行銷', '培養網路意見領袖'] },
            { id: 'insight-4-5', title: '投票動員成為決勝關鍵', description: '高投票率情境下，動員能力比政策內容更重要', type: 'discovery', priority: 'medium', discoveredAt: 18, relatedStrategies: ['candidate-b'], actionRequired: false },
            { id: 'insight-4-6', title: '長者投票率相對下降風險', description: '年輕選民大量投票可能稀釋長者選民影響力', type: 'risk_alert', priority: 'medium', discoveredAt: 22, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['加強長者動員', '提升長者投票意願'] }
          ],
          periodicData: []
        },
        results: {
          summary: { winningStrategy: 'candidate-b', winProbability: 56, confidenceLevel: 75, keyFactors: ['年輕選民支持', '高投票率', '改革訴求'] },
          strategyComparison: [], riskAssessment: { overallRiskLevel: 'medium', topRisks: [], mitigationPlan: [] },
          recommendations: [], nextSteps: [], lessons: ['高投票率有利於挑戰者', '年輕選民是關鍵變數']
        },

        comparison: {
          previousRun: 'wgs-001-3',
          keyDifferences: ['投票率從66%提升至72%', '年輕選民比例增加', '改革議題更受關注'],
          performanceChange: 3
        }
      },

      {
        id: 'wgs-001-5',
        name: '重大危機情境',
        runNumber: 5,
        description: '選前發生重大公共危機，考驗危機處理能力',
        createdAt: new Date('2024-11-25'),
        status: 'completed',

        variables: {
          environment: { economicCondition: 'neutral', mediaEnvironment: 'neutral', publicMood: 'pessimistic', majorEvents: ['重大公安事故', '市政危機'] },
          playerStates: {
            'candidate-a': { initialSupport: 42, budget: 200000000, teamStrength: 8, mediaRelations: 'neutral', scandals: [], advantages: ['危機處理經驗', '政府資源'] },
            'candidate-b': { initialSupport: 45, budget: 180000000, teamStrength: 6, mediaRelations: 'neutral', scandals: [], advantages: ['在野監督', '改革承諾'] }
          },
          voterStructure: {
            turnoutRate: 68,
            demographics: {
              '年輕選民': { percentage: 25, volatility: 12, keyIssues: ['公共安全', '政府能力'] },
              '中產階級': { percentage: 40, volatility: 8, keyIssues: ['危機處理', '施政能力'] },
              '長者': { percentage: 35, volatility: 5, keyIssues: ['安全穩定', '政府效能'] }
            }
          },
          assumptions: ['危機處理是關鍵', '選民關注政府能力', '現任優勢可能逆轉']
        },

        strategies: [],
        simulation: {
          phases: [
            { id: 'phase-5-1', name: '危機應對期', description: '緊急處理重大公安事故', startWeek: 1, duration: 6, objectives: ['控制危機擴散', '展現處理能力'], keyActivities: ['緊急會議', '現場指揮'], expectedOutcomes: ['危機獲得控制'], status: 'completed' },
            { id: 'phase-5-2', name: '責任釐清期', description: '調查事故原因並追究責任', startWeek: 7, duration: 8, objectives: ['真相調查', '問責處理'], keyActivities: ['成立調查委員會', '懲處相關人員'], expectedOutcomes: ['獲得民眾信任'], status: 'completed' },
            { id: 'phase-5-3', name: '改革承諾期', description: '提出制度改革方案', startWeek: 15, duration: 10, objectives: ['制度改革', '預防再發'], keyActivities: ['法規修訂', '制度建立'], expectedOutcomes: ['展現改革決心'], status: 'completed' }
          ],
          timeline: [
            {
              period: 1, date: '2024-06-01',
              playerData: {
                'candidate-a': { supportRate: 42, momentum: -2, mediaExposure: 85, campaignActivity: 30, budgetSpent: 5000000, keyActions: ['危機處理', '緊急應變'] },
                'candidate-b': { supportRate: 45, momentum: 1, mediaExposure: 70, campaignActivity: 40, budgetSpent: 8000000, keyActions: ['監督政府', '提出質疑'] }
              },
              environmentData: { mediaAttention: 95, publicInterest: 90, majorEvents: ['重大公安事故'], polls: [{ pollster: '台灣民意基金會', date: '2024-06-01', sampleSize: 1200, results: { 'candidate-a': 42, 'candidate-b': 45, 'undecided': 13 }, marginOfError: 2.8, trend: 'down' }] }
            },
            {
              period: 6, date: '2024-07-06',
              playerData: {
                'candidate-a': { supportRate: 46, momentum: 2, mediaExposure: 85, campaignActivity: 65, budgetSpent: 45000000, keyActions: ['危機說明', '責任承擔'] },
                'candidate-b': { supportRate: 44, momentum: 0, mediaExposure: 70, campaignActivity: 55, budgetSpent: 35000000, keyActions: ['監督質疑', '替代方案'] }
              },
              environmentData: { mediaAttention: 90, publicInterest: 85, majorEvents: ['事故調查進展'], polls: [{ pollster: 'TVBS民調', date: '2024-07-05', sampleSize: 1500, results: { 'candidate-a': 46, 'candidate-b': 44, 'undecided': 10 }, marginOfError: 2.5, trend: 'up' }] }
            },
            {
              period: 12, date: '2024-08-12',
              playerData: {
                'candidate-a': { supportRate: 52, momentum: 3, mediaExposure: 90, campaignActivity: 75, budgetSpent: 90000000, keyActions: ['改革方案', '制度建立'] },
                'candidate-b': { supportRate: 41, momentum: -2, mediaExposure: 75, campaignActivity: 65, budgetSpent: 70000000, keyActions: ['政策批評', '經驗質疑'] }
              },
              environmentData: { mediaAttention: 80, publicInterest: 75, majorEvents: ['制度改革啟動'], polls: [{ pollster: '中時民調', date: '2024-08-10', sampleSize: 1800, results: { 'candidate-a': 52, 'candidate-b': 41, 'undecided': 7 }, marginOfError: 2.3, trend: 'up' }] }
            },
            {
              period: 18, date: '2024-09-18',
              playerData: {
                'candidate-a': { supportRate: 56, momentum: 2, mediaExposure: 95, campaignActivity: 85, budgetSpent: 150000000, keyActions: ['改革成果', '能力展現'] },
                'candidate-b': { supportRate: 42, momentum: -1, mediaExposure: 80, campaignActivity: 80, budgetSpent: 130000000, keyActions: ['未來承諾', '改革理念'] }
              },
              environmentData: { mediaAttention: 95, publicInterest: 90, majorEvents: ['改革法案通過'], polls: [{ pollster: '民視民調', date: '2024-09-15', sampleSize: 2000, results: { 'candidate-a': 56, 'candidate-b': 42, 'undecided': 2 }, marginOfError: 2.2, trend: 'up' }] }
            },
            {
              period: 24, date: '2024-11-26',
              playerData: {
                'candidate-a': { supportRate: 58, momentum: 2, mediaExposure: 95, campaignActivity: 95, budgetSpent: 200000000, keyActions: ['改革成果', '經驗強調'] },
                'candidate-b': { supportRate: 42, momentum: -2, mediaExposure: 85, campaignActivity: 90, budgetSpent: 180000000, keyActions: ['改革承諾', '未來願景'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 95, majorEvents: ['制度改革完成'], polls: [{ pollster: '聯合報民調', date: '2024-11-24', sampleSize: 2000, results: { 'candidate-a': 58, 'candidate-b': 42 }, marginOfError: 2.2, trend: 'stable' }] }
            }
          ],
          keyEvents: [
            { id: 'event-5-1', name: '重大公安事故', description: '市政建設發生重大安全事故', week: 1, type: 'crisis', impact: 'negative', affectedStrategies: ['candidate-a'], response: '立即啟動緊急應變機制' },
            { id: 'event-5-2', name: '危機處理獲肯定', description: '快速有效的危機處理獲得民眾肯定', week: 4, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-a'], response: '展現政府處理能力' },
            { id: 'event-5-3', name: '制度改革方案公布', description: '提出全面的制度改革方案', week: 16, type: 'milestone', impact: 'positive', affectedStrategies: ['candidate-a'], response: '獲得改革派支持' }
          ],
          decisionPoints: [
            { id: 'decision-5-1', name: '危機責任歸屬', description: '如何處理事故責任問題', week: 3, options: [
              { id: 'option-5-1-1', name: '承擔政治責任', description: '主動承擔監督不周責任', pros: ['展現負責態度'], cons: ['可能影響選情'], riskLevel: 'high', resourceCost: 0 },
              { id: 'option-5-1-2', name: '追究下屬責任', description: '將責任歸咎於執行單位', pros: ['保護自身形象'], cons: ['可能被批評推卸責任'], riskLevel: 'medium', resourceCost: 0 }
            ], selectedOption: 'option-5-1-1', rationale: '承擔責任更能獲得民眾信任', consequences: ['初期支持度下降但後期大幅回升'] }
          ],
          insights: [
            { id: 'insight-5-1', title: '危機處理能力是現任最大優勢', description: '在重大危機面前，選民更信任有經驗的現任候選人，支持度從42%回升至58%', type: 'discovery', priority: 'high', discoveredAt: 6, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-5-2', title: '承擔責任反而獲得加分', description: '主動承擔政治責任的態度獲得民眾高度認同，信任度提升15%', type: 'discovery', priority: 'high', discoveredAt: 8, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-5-3', title: '挑戰者在危機時期處於劣勢', description: '缺乏實際處理經驗，只能提出批評和建議，支持度從45%下滑至42%', type: 'discovery', priority: 'medium', discoveredAt: 12, relatedStrategies: ['candidate-b'], actionRequired: true, actionItems: ['提出具體替代方案', '展現處理能力'] },
            { id: 'insight-5-4', title: '危機時刻民眾偏好穩定', description: '面對不確定性，選民傾向選擇經驗豐富的候選人', type: 'discovery', priority: 'medium', discoveredAt: 10, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-5-5', title: '制度改革獲得跨黨派支持', description: '提出的制度改革方案獲得改革派選民認同', type: 'discovery', priority: 'medium', discoveredAt: 16, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-5-6', title: '危機後期可能出現反彈風險', description: '如果改革承諾無法兌現，可能面臨民眾反彈', type: 'risk_alert', priority: 'medium', discoveredAt: 20, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['確保改革承諾可行', '建立監督機制'] }
          ],
          periodicData: []
        },
        results: {
          summary: { winningStrategy: 'candidate-a', winProbability: 58, confidenceLevel: 82, keyFactors: ['危機處理能力', '政府資源', '經驗優勢'] },
          strategyComparison: [], riskAssessment: { overallRiskLevel: 'high', topRisks: [], mitigationPlan: [] },
          recommendations: [], nextSteps: [], lessons: ['危機時刻現任優勢明顯', '處理能力比承諾更重要']
        },

        comparison: {
          previousRun: 'wgs-001-4',
          keyDifferences: ['發生重大危機事件', '選民關注點轉向安全', '現任候選人獲得危機處理加分'],
          performanceChange: 2
        }
      },

      {
        id: 'wgs-001-6',
        name: '經濟繁榮情境',
        runNumber: 6,
        description: '經濟表現亮眼，就業率創新高，民眾滿意度高',
        createdAt: new Date('2024-11-27'),
        status: 'completed',

        variables: {
          environment: { economicCondition: 'good', mediaEnvironment: 'favorable', publicMood: 'optimistic', majorEvents: ['經濟數據亮眼', '就業率創新高'] },
          playerStates: {
            'candidate-a': { initialSupport: 48, budget: 200000000, teamStrength: 8, mediaRelations: 'good', scandals: [], advantages: ['經濟政績', '現任優勢'] },
            'candidate-b': { initialSupport: 40, budget: 180000000, teamStrength: 6, mediaRelations: 'neutral', scandals: [], advantages: ['改革理念'] }
          },
          voterStructure: {
            turnoutRate: 64,
            demographics: {
              '年輕選民': { percentage: 25, volatility: 6, keyIssues: ['就業機會', '薪資成長'] },
              '中產階級': { percentage: 40, volatility: 4, keyIssues: ['經濟穩定', '投資環境'] },
              '長者': { percentage: 35, volatility: 3, keyIssues: ['退休保障', '物價穩定'] }
            }
          },
          assumptions: ['經濟表現是最大優勢', '現任候選人受惠', '選民滿意現狀']
        },

        strategies: [],
        simulation: {
          phases: [
            { id: 'phase-6-1', name: '政績宣傳期', description: '大力宣傳經濟政績', startWeek: 1, duration: 12, objectives: ['展現經濟成果', '強化現任優勢'], keyActivities: ['經濟數據發布', '成果展示'], expectedOutcomes: ['民眾滿意度提升'], status: 'completed' },
            { id: 'phase-6-2', name: '未來規劃期', description: '提出未來經濟發展藍圖', startWeek: 13, duration: 8, objectives: ['展現前瞻視野', '承諾持續發展'], keyActivities: ['政策說明', '專家背書'], expectedOutcomes: ['獲得企業界支持'], status: 'completed' },
            { id: 'phase-6-3', name: '穩定訴求期', description: '強調穩定發展的重要性', startWeek: 21, duration: 4, objectives: ['鞏固支持基盤', '警告變動風險'], keyActivities: ['穩定宣傳', '風險提醒'], expectedOutcomes: ['中間選民支持'], status: 'completed' }
          ],
          timeline: [
            {
              period: 1, date: '2024-06-01',
              playerData: {
                'candidate-a': { supportRate: 48, momentum: 2, mediaExposure: 75, campaignActivity: 60, budgetSpent: 20000000, keyActions: ['經濟政績發布', '數據展示'] },
                'candidate-b': { supportRate: 40, momentum: -1, mediaExposure: 60, campaignActivity: 50, budgetSpent: 15000000, keyActions: ['改革訴求', '未來願景'] }
              },
              environmentData: { mediaAttention: 60, publicInterest: 55, majorEvents: ['經濟數據亮眼'], polls: [{ pollster: '台灣民意基金會', date: '2024-06-01', sampleSize: 1200, results: { 'candidate-a': 48, 'candidate-b': 40, 'undecided': 12 }, marginOfError: 2.8, trend: 'up' }] }
            },
            {
              period: 6, date: '2024-07-06',
              playerData: {
                'candidate-a': { supportRate: 52, momentum: 2, mediaExposure: 80, campaignActivity: 65, budgetSpent: 50000000, keyActions: ['經濟成果', '投資招商'] },
                'candidate-b': { supportRate: 39, momentum: -1, mediaExposure: 65, campaignActivity: 55, budgetSpent: 40000000, keyActions: ['社會公義', '分配議題'] }
              },
              environmentData: { mediaAttention: 65, publicInterest: 60, majorEvents: ['GDP成長超預期'], polls: [{ pollster: 'TVBS民調', date: '2024-07-05', sampleSize: 1500, results: { 'candidate-a': 52, 'candidate-b': 39, 'undecided': 9 }, marginOfError: 2.5, trend: 'up' }] }
            },
            {
              period: 12, date: '2024-08-12',
              playerData: {
                'candidate-a': { supportRate: 58, momentum: 3, mediaExposure: 85, campaignActivity: 75, budgetSpent: 100000000, keyActions: ['未來規劃', '企業座談'] },
                'candidate-b': { supportRate: 36, momentum: -2, mediaExposure: 70, campaignActivity: 65, budgetSpent: 80000000, keyActions: ['社會議題', '弱勢關懷'] }
              },
              environmentData: { mediaAttention: 75, publicInterest: 70, majorEvents: ['就業率創新高'], polls: [{ pollster: '中時民調', date: '2024-08-10', sampleSize: 1800, results: { 'candidate-a': 58, 'candidate-b': 36, 'undecided': 6 }, marginOfError: 2.3, trend: 'up' }] }
            },
            {
              period: 18, date: '2024-09-18',
              playerData: {
                'candidate-a': { supportRate: 60, momentum: 1, mediaExposure: 90, campaignActivity: 85, budgetSpent: 160000000, keyActions: ['穩定承諾', '繼續發展'] },
                'candidate-b': { supportRate: 37, momentum: 0, mediaExposure: 80, campaignActivity: 80, budgetSpent: 140000000, keyActions: ['改革必要', '未來願景'] }
              },
              environmentData: { mediaAttention: 85, publicInterest: 80, majorEvents: ['外資投資創新高'], polls: [{ pollster: '民視民調', date: '2024-09-15', sampleSize: 2000, results: { 'candidate-a': 60, 'candidate-b': 37, 'undecided': 3 }, marginOfError: 2.2, trend: 'stable' }] }
            },
            {
              period: 24, date: '2024-11-26',
              playerData: {
                'candidate-a': { supportRate: 62, momentum: 2, mediaExposure: 95, campaignActivity: 90, budgetSpent: 200000000, keyActions: ['穩定訴求', '繼續發展'] },
                'candidate-b': { supportRate: 38, momentum: -1, mediaExposure: 85, campaignActivity: 85, budgetSpent: 180000000, keyActions: ['改革必要', '社會公義'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 85, majorEvents: ['經濟成長率超預期'], polls: [{ pollster: '聯合報民調', date: '2024-11-24', sampleSize: 2000, results: { 'candidate-a': 62, 'candidate-b': 38 }, marginOfError: 2.2, trend: 'stable' }] }
            }
          ],
          keyEvents: [
            { id: 'event-6-1', name: '經濟數據創新高', description: '多項經濟指標創歷史新高', week: 2, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-a'], response: '大力宣傳政績成果' },
            { id: 'event-6-2', name: '國際投資大增', description: '外資投資金額大幅增加', week: 8, type: 'external_event', impact: 'positive', affectedStrategies: ['candidate-a'], response: '展現施政成效' },
            { id: 'event-6-3', name: '企業界公開支持', description: '多家大企業公開支持現任候選人', week: 16, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-a'], response: '獲得商界背書' }
          ],
          decisionPoints: [],
          insights: [
            { id: 'insight-6-1', title: '經濟繁榮是現任最大武器', description: '良好的經濟表現讓現任候選人獲得壓倒性優勢，支持度從48%提升至62%', type: 'discovery', priority: 'high', discoveredAt: 4, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-6-2', title: '挑戰者難以在經濟議題上突破', description: '面對亮眼經濟數據，改革訴求顯得說服力不足，支持度從40%下滑至38%', type: 'discovery', priority: 'high', discoveredAt: 8, relatedStrategies: ['candidate-b'], actionRequired: true, actionItems: ['轉向社會議題', '強調公平正義'] },
            { id: 'insight-6-3', title: '中間選民傾向維持現狀', description: '經濟好轉讓中間選民不願冒險改變，75%中間選民支持現任', type: 'discovery', priority: 'medium', discoveredAt: 12, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-6-4', title: '企業界全面支持現任', description: '經濟政策成功獲得企業界一致認同和公開支持', type: 'discovery', priority: 'medium', discoveredAt: 16, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-6-5', title: '經濟成長掩蓋其他問題', description: '良好經濟表現讓其他社會問題被忽視', type: 'discovery', priority: 'low', discoveredAt: 14, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-6-6', title: '挑戰者面臨議題設定困難', description: '經濟繁榮時期很難找到有效攻擊點', type: 'risk_alert', priority: 'medium', discoveredAt: 18, relatedStrategies: ['candidate-b'], actionRequired: true, actionItems: ['尋找非經濟議題突破點', '強調未來挑戰'] }
          ],
          periodicData: []
        },
        results: {
          summary: { winningStrategy: 'candidate-a', winProbability: 62, confidenceLevel: 85, keyFactors: ['經濟政績', '民眾滿意度', '現任優勢'] },
          strategyComparison: [], riskAssessment: { overallRiskLevel: 'low', topRisks: [], mitigationPlan: [] },
          recommendations: [], nextSteps: [], lessons: ['經濟表現是現任最大武器', '繁榮時期挑戰者難以突破']
        },

        comparison: {
          previousRun: 'wgs-001-5',
          keyDifferences: ['經濟環境大幅改善', '民眾情緒轉為樂觀', '現任候選人獲得政績加分'],
          performanceChange: 4
        }
      },

      {
        id: 'wgs-001-7',
        name: '世代對立情境',
        runNumber: 7,
        description: '年輕世代與長者世代政治立場分化嚴重',
        createdAt: new Date('2024-11-29'),
        status: 'completed',

        variables: {
          environment: { economicCondition: 'neutral', mediaEnvironment: 'neutral', publicMood: 'neutral', majorEvents: ['世代議題爭議', '社會分化加劇'] },
          playerStates: {
            'candidate-a': { initialSupport: 45, budget: 200000000, teamStrength: 7, mediaRelations: 'neutral', scandals: [], advantages: ['長者支持', '穩定形象'] },
            'candidate-b': { initialSupport: 44, budget: 180000000, teamStrength: 7, mediaRelations: 'neutral', scandals: [], advantages: ['年輕支持', '世代代表'] }
          },
          voterStructure: {
            turnoutRate: 67,
            demographics: {
              '年輕選民': { percentage: 25, volatility: 15, keyIssues: ['世代正義', '未來發展'] },
              '中產階級': { percentage: 40, volatility: 6, keyIssues: ['社會和諧', '理性治理'] },
              '長者': { percentage: 35, volatility: 8, keyIssues: ['傳統價值', '社會穩定'] }
            }
          },
          assumptions: ['世代分化是主要議題', '中間選民成為關鍵', '候選人需要跨世代訴求']
        },

        strategies: [],
        simulation: {
          phases: [
            { id: 'phase-7-1', name: '世代議題浮現期', description: '世代對立議題開始發酵', startWeek: 1, duration: 8, objectives: ['理解世代差異', '避免激化對立'], keyActivities: ['世代對話', '議題研析'], expectedOutcomes: ['掌握世代脈動'], status: 'completed' },
            { id: 'phase-7-2', name: '跨世代溝通期', description: '嘗試彌合世代鴻溝', startWeek: 9, duration: 10, objectives: ['促進世代理解', '尋求共同點'], keyActivities: ['跨世代論壇', '共識建立'], expectedOutcomes: ['緩解對立情緒'], status: 'completed' },
            { id: 'phase-7-3', name: '平衡訴求期', description: '平衡各世代需求', startWeek: 19, duration: 6, objectives: ['兼顧各世代利益', '避免偏向任一方'], keyActivities: ['政策平衡', '理性訴求'], expectedOutcomes: ['獲得中間選民支持'], status: 'completed' }
          ],
          timeline: [
            {
              period: 1, date: '2024-06-01',
              playerData: {
                'candidate-a': { supportRate: 45, momentum: 0, mediaExposure: 65, campaignActivity: 55, budgetSpent: 18000000, keyActions: ['穩定訴求', '經驗強調'] },
                'candidate-b': { supportRate: 44, momentum: 1, mediaExposure: 70, campaignActivity: 60, budgetSpent: 20000000, keyActions: ['世代代表', '改革號召'] }
              },
              environmentData: { mediaAttention: 70, publicInterest: 65, majorEvents: ['世代議題爭議'], polls: [{ pollster: '台灣民意基金會', date: '2024-06-01', sampleSize: 1200, results: { 'candidate-a': 45, 'candidate-b': 44, 'undecided': 11 }, marginOfError: 2.8, trend: 'stable' }] }
            },
            {
              period: 6, date: '2024-07-06',
              playerData: {
                'candidate-a': { supportRate: 44, momentum: -1, mediaExposure: 75, campaignActivity: 60, budgetSpent: 45000000, keyActions: ['世代溝通', '平衡政策'] },
                'candidate-b': { supportRate: 46, momentum: 2, mediaExposure: 80, campaignActivity: 70, budgetSpent: 50000000, keyActions: ['青年代表', '世代改革'] }
              },
              environmentData: { mediaAttention: 75, publicInterest: 70, majorEvents: ['世代對立加劇'], polls: [{ pollster: 'TVBS民調', date: '2024-07-05', sampleSize: 1500, results: { 'candidate-a': 44, 'candidate-b': 46, 'undecided': 10 }, marginOfError: 2.5, trend: 'down' }] }
            },
            {
              period: 12, date: '2024-08-12',
              playerData: {
                'candidate-a': { supportRate: 48, momentum: 2, mediaExposure: 80, campaignActivity: 70, budgetSpent: 90000000, keyActions: ['跨世代對話', '理性治理'] },
                'candidate-b': { supportRate: 45, momentum: -1, mediaExposure: 85, campaignActivity: 75, budgetSpent: 85000000, keyActions: ['青年政策', '世代正義'] }
              },
              environmentData: { mediaAttention: 85, publicInterest: 80, majorEvents: ['跨世代論壇成功'], polls: [{ pollster: '中時民調', date: '2024-08-10', sampleSize: 1800, results: { 'candidate-a': 48, 'candidate-b': 45, 'undecided': 7 }, marginOfError: 2.3, trend: 'up' }] }
            },
            {
              period: 18, date: '2024-09-18',
              playerData: {
                'candidate-a': { supportRate: 50, momentum: 1, mediaExposure: 90, campaignActivity: 85, budgetSpent: 150000000, keyActions: ['和諧訴求', '中間路線'] },
                'candidate-b': { supportRate: 48, momentum: 1, mediaExposure: 90, campaignActivity: 80, budgetSpent: 140000000, keyActions: ['世代代表', '改革承諾'] }
              },
              environmentData: { mediaAttention: 95, publicInterest: 85, majorEvents: ['中間選民成關鍵'], polls: [{ pollster: '民視民調', date: '2024-09-15', sampleSize: 2000, results: { 'candidate-a': 50, 'candidate-b': 48, 'undecided': 2 }, marginOfError: 2.2, trend: 'up' }] }
            },
            {
              period: 24, date: '2024-11-26',
              playerData: {
                'candidate-a': { supportRate: 51, momentum: 1, mediaExposure: 95, campaignActivity: 90, budgetSpent: 200000000, keyActions: ['社會和諧', '理性選擇'] },
                'candidate-b': { supportRate: 49, momentum: 0, mediaExposure: 90, campaignActivity: 85, budgetSpent: 180000000, keyActions: ['世代改革', '未來希望'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 90, majorEvents: ['世代和解呼籲'], polls: [{ pollster: '聯合報民調', date: '2024-11-24', sampleSize: 2000, results: { 'candidate-a': 51, 'candidate-b': 49 }, marginOfError: 2.2, trend: 'stable' }] }
            }
          ],
          keyEvents: [
            { id: 'event-7-1', name: '世代對立激化', description: '年輕世代與長者世代在政策議題上嚴重分歧', week: 4, type: 'risk_materialized', impact: 'negative', affectedStrategies: ['candidate-a', 'candidate-b'], response: '呼籲理性對話' },
            { id: 'event-7-2', name: '跨世代論壇成功', description: '舉辦跨世代對話論壇獲得好評', week: 12, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-a'], response: '展現溝通協調能力' },
            { id: 'event-7-3', name: '中間選民成為關鍵', description: '世代分化讓中間選民成為決勝關鍵', week: 20, type: 'milestone', impact: 'neutral', affectedStrategies: ['candidate-a', 'candidate-b'], response: '加強中間選民訴求' }
          ],
          decisionPoints: [
            { id: 'decision-7-1', name: '如何回應世代對立', description: '面對世代分化的策略選擇', week: 6, options: [
              { id: 'option-7-1-1', name: '選邊站隊', description: '明確支持某一世代立場', pros: ['獲得該世代強力支持'], cons: ['失去另一世代選票'], riskLevel: 'high', resourceCost: 25000000 },
              { id: 'option-7-1-2', name: '居中協調', description: '嘗試彌合世代鴻溝', pros: ['獲得中間選民支持'], cons: ['可能兩邊不討好'], riskLevel: 'medium', resourceCost: 30000000 }
            ], selectedOption: 'option-7-1-2', rationale: '居中協調更符合穩定治理形象', consequences: ['成功獲得中間選民支持'] }
          ],
          insights: [
            { id: 'insight-7-1', title: '世代分化時中間選民是關鍵', description: '當社會出現世代對立，中間選民的選擇決定勝負，最終獲得65%中間選民支持', type: 'discovery', priority: 'high', discoveredAt: 8, relatedStrategies: ['candidate-a', 'candidate-b'], actionRequired: true, actionItems: ['加強中間選民溝通', '避免極端立場'] },
            { id: 'insight-7-2', title: '穩定訴求在分化時期有效', description: '社會分化時，穩定和諧的訴求更能獲得認同，支持度從45%提升至51%', type: 'discovery', priority: 'high', discoveredAt: 16, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-7-3', title: '長者投票率優勢明顯', description: '長者世代的高投票率成為現任候選人的重要優勢，長者投票率達78%', type: 'discovery', priority: 'medium', discoveredAt: 20, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-7-4', title: '跨世代對話化解對立', description: '成功的跨世代論壇有效緩解社會對立情緒', type: 'discovery', priority: 'medium', discoveredAt: 12, relatedStrategies: ['candidate-a'], actionRequired: false },
            { id: 'insight-7-5', title: '年輕選民動員遇到阻力', description: '世代對立反而降低年輕選民投票意願', type: 'discovery', priority: 'medium', discoveredAt: 14, relatedStrategies: ['candidate-b'], actionRequired: true, actionItems: ['重新調整動員策略', '避免激化對立'] },
            { id: 'insight-7-6', title: '社會和諧成為選民優先考量', description: '分化時期選民更重視候選人的整合能力', type: 'risk_alert', priority: 'medium', discoveredAt: 18, relatedStrategies: ['candidate-b'], actionRequired: true, actionItems: ['展現整合能力', '提出和解方案'] }
          ],
          periodicData: []
        },
        results: {
          summary: { winningStrategy: 'candidate-a', winProbability: 51, confidenceLevel: 68, keyFactors: ['長者投票率高', '中間選民偏向穩定', '跨世代訴求'] },
          strategyComparison: [], riskAssessment: { overallRiskLevel: 'medium', topRisks: [], mitigationPlan: [] },
          recommendations: [], nextSteps: [], lessons: ['世代分化時穩定訴求有效', '中間選民是決勝關鍵']
        },

        comparison: {
          previousRun: 'wgs-001-6',
          keyDifferences: ['社會分化議題浮現', '世代對立加劇', '選民搖擺程度增加'],
          performanceChange: -11
        }
      },

      {
        id: 'wgs-001-8',
        name: '完美風暴情境',
        runNumber: 8,
        description: '多重負面因素同時出現：經濟衰退+媒體敵對+重大醜聞',
        createdAt: new Date('2024-12-01'),
        status: 'completed',

        variables: {
          environment: { economicCondition: 'poor', mediaEnvironment: 'hostile', publicMood: 'pessimistic', majorEvents: ['經濟衰退', '重大醜聞', '媒體圍剿'] },
          playerStates: {
            'candidate-a': { initialSupport: 35, budget: 200000000, teamStrength: 6, mediaRelations: 'poor', scandals: ['重大醜聞'], advantages: ['施政經驗'] },
            'candidate-b': { initialSupport: 52, budget: 180000000, teamStrength: 8, mediaRelations: 'good', scandals: [], advantages: ['改革形象', '反現任情緒', '媒體支持'] }
          },
          voterStructure: {
            turnoutRate: 70,
            demographics: {
              '年輕選民': { percentage: 25, volatility: 18, keyIssues: ['政治清廉', '經濟機會'] },
              '中產階級': { percentage: 40, volatility: 12, keyIssues: ['政府誠信', '經濟復甦'] },
              '長者': { percentage: 35, volatility: 8, keyIssues: ['社會穩定', '政治清廉'] }
            }
          },
          assumptions: ['多重危機同時爆發', '現任候選人面臨最大挑戰', '選民求變心理強烈']
        },

        strategies: [],
        simulation: {
          phases: [
            { id: 'phase-8-1', name: '多重危機爆發期', description: '經濟、媒體、醜聞三重打擊', startWeek: 1, duration: 8, objectives: ['控制危機擴散', '緊急止血'], keyActivities: ['危機處理', '形象修復'], expectedOutcomes: ['暫時穩定局面'], status: 'completed' },
            { id: 'phase-8-2', name: '困獸之鬥期', description: '全力反擊負面攻勢', startWeek: 9, duration: 10, objectives: ['反擊抹黑', '重建信任'], keyActivities: ['澄清說明', '正面宣傳'], expectedOutcomes: ['部分挽回支持'], status: 'completed' },
            { id: 'phase-8-3', name: '最後掙扎期', description: '孤注一擲的最後努力', startWeek: 19, duration: 6, objectives: ['動員死忠支持者', '期待奇蹟'], keyActivities: ['基層動員', '情感訴求'], expectedOutcomes: ['支持者動員'], status: 'completed' }
          ],
          timeline: [
            {
              period: 1, date: '2024-06-01',
              playerData: {
                'candidate-a': { supportRate: 35, momentum: -3, mediaExposure: 90, campaignActivity: 40, budgetSpent: 25000000, keyActions: ['危機處理', '緊急澄清'] },
                'candidate-b': { supportRate: 52, momentum: 4, mediaExposure: 85, campaignActivity: 70, budgetSpent: 20000000, keyActions: ['改革號召', '反現任宣傳'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 95, majorEvents: ['經濟衰退', '重大醜聞', '媒體圍剿'], polls: [{ pollster: '台灣民意基金會', date: '2024-06-01', sampleSize: 1200, results: { 'candidate-a': 35, 'candidate-b': 52, 'undecided': 13 }, marginOfError: 2.8, trend: 'down' }] }
            },
            {
              period: 6, date: '2024-07-06',
              playerData: {
                'candidate-a': { supportRate: 30, momentum: -3, mediaExposure: 95, campaignActivity: 50, budgetSpent: 60000000, keyActions: ['危機澄清', '支持者動員'] },
                'candidate-b': { supportRate: 56, momentum: 3, mediaExposure: 85, campaignActivity: 75, budgetSpent: 50000000, keyActions: ['改革宣傳', '反現任攻勢'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 95, majorEvents: ['醜聞調查深入'], polls: [{ pollster: 'TVBS民調', date: '2024-07-05', sampleSize: 1500, results: { 'candidate-a': 30, 'candidate-b': 56, 'undecided': 14 }, marginOfError: 2.5, trend: 'down' }] }
            },
            {
              period: 12, date: '2024-08-12',
              playerData: {
                'candidate-a': { supportRate: 28, momentum: -2, mediaExposure: 100, campaignActivity: 70, budgetSpent: 120000000, keyActions: ['絕地反擊', '政績回顧'] },
                'candidate-b': { supportRate: 62, momentum: 2, mediaExposure: 95, campaignActivity: 85, budgetSpent: 100000000, keyActions: ['勝選在望', '政策細化'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 95, majorEvents: ['民調創新低'], polls: [{ pollster: '中時民調', date: '2024-08-10', sampleSize: 1800, results: { 'candidate-a': 28, 'candidate-b': 62, 'undecided': 10 }, marginOfError: 2.3, trend: 'down' }] }
            },
            {
              period: 18, date: '2024-09-18',
              playerData: {
                'candidate-a': { supportRate: 32, momentum: 2, mediaExposure: 100, campaignActivity: 90, budgetSpent: 170000000, keyActions: ['最後掙扎', '情感訴求'] },
                'candidate-b': { supportRate: 64, momentum: 1, mediaExposure: 95, campaignActivity: 85, budgetSpent: 150000000, keyActions: ['穩定領先', '政策承諾'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 100, majorEvents: ['選前最後攻防'], polls: [{ pollster: '民視民調', date: '2024-09-15', sampleSize: 2000, results: { 'candidate-a': 32, 'candidate-b': 64, 'undecided': 4 }, marginOfError: 2.2, trend: 'up' }] }
            },
            {
              period: 16, date: '2024-09-14',
              playerData: {
                'candidate-a': { supportRate: 30, momentum: -1, mediaExposure: 95, campaignActivity: 80, budgetSpent: 150000000, keyActions: ['情感訴求', '政績回顧'] },
                'candidate-b': { supportRate: 62, momentum: 2, mediaExposure: 95, campaignActivity: 85, budgetSpent: 120000000, keyActions: ['勝選在望', '改革藍圖'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 95, majorEvents: ['經濟數據惡化'], polls: [{ pollster: '中時民調', date: '2024-09-12', sampleSize: 1800, results: { 'candidate-a': 30, 'candidate-b': 62, 'undecided': 8 }, marginOfError: 2.3, trend: 'down' }] }
            },
            {
              period: 24, date: '2024-11-26',
              playerData: {
                'candidate-a': { supportRate: 35, momentum: 1, mediaExposure: 100, campaignActivity: 100, budgetSpent: 200000000, keyActions: ['最後衝刺', '死忠動員'] },
                'candidate-b': { supportRate: 65, momentum: 1, mediaExposure: 95, campaignActivity: 90, budgetSpent: 180000000, keyActions: ['勝選宣言', '改革承諾'] }
              },
              environmentData: { mediaAttention: 100, publicInterest: 100, majorEvents: ['選前最後民調'], polls: [{ pollster: '聯合報民調', date: '2024-11-24', sampleSize: 2000, results: { 'candidate-a': 35, 'candidate-b': 65 }, marginOfError: 2.2, trend: 'stable' }] }
            }
          ],
          keyEvents: [
            { id: 'event-8-1', name: '完美風暴來襲', description: '經濟衰退、媒體敵對、重大醜聞同時爆發', week: 1, type: 'crisis', impact: 'negative', affectedStrategies: ['candidate-a'], response: '啟動全面危機處理機制' },
            { id: 'event-8-2', name: '媒體圍剿加劇', description: '各大媒體持續負面報導', week: 6, type: 'risk_materialized', impact: 'negative', affectedStrategies: ['candidate-a'], response: '嘗試澄清但效果有限' },
            { id: 'event-8-3', name: '民調雪崩式下跌', description: '支持度創歷史新低', week: 12, type: 'milestone', impact: 'negative', affectedStrategies: ['candidate-a'], response: '調整策略但為時已晚' },
            { id: 'event-8-4', name: '挑戰者聲勢如日中天', description: '候選人B獲得壓倒性支持', week: 18, type: 'opportunity', impact: 'positive', affectedStrategies: ['candidate-b'], response: '提前準備勝選演說' }
          ],
          decisionPoints: [
            { id: 'decision-8-1', name: '如何應對完美風暴', description: '面對多重危機的應對策略', week: 2, options: [
              { id: 'option-8-1-1', name: '全面反擊', description: '對所有指控進行反擊', pros: ['展現戰鬥意志'], cons: ['可能越描越黑'], riskLevel: 'high', resourceCost: 50000000 },
              { id: 'option-8-1-2', name: '低調處理', description: '避免激化衝突', pros: ['避免擴大事端'], cons: ['可能被認為心虛'], riskLevel: 'high', resourceCost: 20000000 }
            ], selectedOption: 'option-8-1-1', rationale: '必須積極回應否則會被認定有罪', consequences: ['反擊效果有限，反而陷入泥沼'] }
          ],
          insights: [
            { id: 'insight-8-1', title: '多重危機具有疊加效應', description: '當多個負面因素同時出現，其影響會相互放大，支持度從35%暴跌至28%', type: 'discovery', priority: 'high', discoveredAt: 4, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['建立危機預警機制', '準備應急預案'] },
            { id: 'insight-8-2', title: '媒體環境決定危機處理效果', description: '在敵對媒體環境下，任何澄清都可能被扭曲，媒體關注度達100%但全為負面', type: 'discovery', priority: 'high', discoveredAt: 8, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['重視媒體關係', '建立直接溝通管道'] },
            { id: 'insight-8-3', title: '反現任情緒一旦形成難以逆轉', description: '當民眾求變心理強烈時，現任候選人很難扭轉局面，最終僅獲35%支持', type: 'discovery', priority: 'high', discoveredAt: 12, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['平時維持良好形象', '避免重大失誤'] },
            { id: 'insight-8-4', title: '挑戰者在危機時期獲得最大利益', description: '現任候選人的危機就是挑戰者的機會，支持度從52%飆升至65%', type: 'discovery', priority: 'medium', discoveredAt: 16, relatedStrategies: ['candidate-b'], actionRequired: false },
            { id: 'insight-8-5', title: '危機管理是政治生存關鍵', description: '多重危機下，危機管理能力比政策更重要', type: 'discovery', priority: 'high', discoveredAt: 6, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['建立專業危機處理團隊', '制定危機溝通策略'] },
            { id: 'insight-8-6', title: '完美風暴幾乎無解', description: '當經濟、媒體、醜聞三重打擊同時出現，幾乎沒有有效應對策略', type: 'risk_alert', priority: 'high', discoveredAt: 10, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['平時建立危機緩衝機制', '維持多元支持基礎'] },
            { id: 'insight-8-7', title: '選民求變心理達到頂峰', description: '多重危機讓選民對現任徹底失望，求變意願達90%', type: 'risk_alert', priority: 'high', discoveredAt: 14, relatedStrategies: ['candidate-a'], actionRequired: true, actionItems: ['承認錯誤並提出改革', '展現真誠悔改態度'] }
          ],
          periodicData: []
        },
        results: {
          summary: { winningStrategy: 'candidate-b', winProbability: 65, confidenceLevel: 88, keyFactors: ['反現任情緒', '多重危機', '改革期待'] },
          strategyComparison: [], riskAssessment: { overallRiskLevel: 'high', topRisks: [], mitigationPlan: [] },
          recommendations: [], nextSteps: [], lessons: ['多重危機下現任劣勢明顯', '危機管理是政治生存關鍵']
        },

        comparison: {
          previousRun: 'wgs-001-7',
          keyDifferences: ['多重負面因素疊加', '現任候選人陷入最大危機', '挑戰者獲得壓倒性優勢'],
          performanceChange: -14
        }
      }
    ],
    
    participants: ['競選總幹事', '候選人A陣營', '候選人B陣營', '政策組長', '媒體組長'],
    tags: ['市長選舉', '候選人對抗', '多情境分析', '時間序列']
  }
];
