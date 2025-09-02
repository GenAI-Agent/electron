export interface Translations {
  // Auth
  lensAuth: string;
  logout: string;
  requestDemo: string;
  // Hero Section
  browserAutomation: {
    title: string;
    tagText: string;
    mainText: string;
    subText: string;
  };
  desktopIntelligence: {
    title: string;
    tagText: string;
    mainText: string;
    subText: string;
  };
  enterpriseIntegration: {
    title: string;
    tagText: string;
    mainText: string;
    subText: string;
  };
  aiSandbox: {
    title: string;
    tagText: string;
    mainText: string;
    subText: string;
  };

  // Buttons
  explore: string;
  seeOurProduct: string;
  tryOurPlatform: string;

  // Feature Sections
  features: {
    customerExperience: {
      title: string;
      description: string;
      points: {
        engage: {
          title: string;
          text: string;
        };
        support: {
          title: string;
          text: string;
        };
        adapt: {
          title: string;
          text: string;
        };
      };
    };
    makeAiYourOwn: {
      title: string;
      description: string;
      points: {
        ground: {
          title: string;
          text: string;
        };
        solve: {
          title: string;
          text: string;
        };
        takeAction: {
          title: string;
          text: string;
        };
      };
    };
    rulesSystem: {
      title: string;
      description: string;
      points: {
        visualBuilder: {
          title: string;
          text: string;
        };
        realTime: {
          title: string;
          text: string;
        };
        compliance: {
          title: string;
          text: string;
        };
      };
    };
  };
}

export const translations: Record<"zh" | "en", Translations> = {
  zh: {
    lensAuth: "Lens 登錄",
    logout: "登出",
    requestDemo: "申請 Demo",

    browserAutomation: {
      title: "瀏覽器自動化",
      tagText: "瀏覽器",
      mainText: "為您的瀏覽器注入 AI 智能",
      subText:
        "將任何網站轉變為 AI 驅動的工作空間。我們的智能代理能夠理解、分析並無縫自動化網頁交互。",
    },
    desktopIntelligence: {
      title: "桌面智能",
      tagText: "桌面",
      mainText: "您的桌面，現在更智能",
      subText:
        "處理本地文件，自動化工作流程，讓 AI 理解您的桌面環境，並提供量身定制的規則。",
    },
    enterpriseIntegration: {
      title: "企業級集成",
      tagText: "企業",
      mainText: "無縫 SaaS 集成",
      subText:
        "將您的企業系統與我們的監督代理連接。應用業務規則，讓 AI 處理複雜的數據處理。",
    },
    aiSandbox: {
      title: "AI 沙盒",
      tagText: "沙盒",
      mainText: "實驗、模擬、創新",
      subText: "整合多個數據源，運用 AI 智能分析，通過戰略模擬找到最優路徑。",
    },

    explore: "生成式",
    seeOurProduct: "查看我們的產品",
    tryOurPlatform: "試用我們的平台",

    features: {
      customerExperience: {
        title: "轉變您的客戶體驗",
        description:
          "讓您的客戶能夠獲取答案、解決問題並採取行動——隨時、在任何渠道、使用任何語言。",
        points: {
          engage: {
            title: "吸引並取悅客戶",
            text: "部署一個始終可用、富有同理心且符合您品牌語調和聲音的 AI 代理。",
          },
          support: {
            title: "實時支持您的客戶",
            text: "幫助客戶解決即使是最複雜的問題，無論是處理換貨還是更新訂閱。",
          },
          adapt: {
            title: "適應並更快地改進",
            text: "迅速響應業務變化，利用分析和報告持續改善客戶體驗。",
          },
        },
      },
      makeAiYourOwn: {
        title: "讓 AI 成為您的專屬",
        description:
          "LensOS 平台使您的公司能夠構建個性化的 AI 代理，專為您的業務和客戶量身定制。",
        points: {
          ground: {
            title: "為您的 AI 代理奠定基礎",
            text: "將您公司的身份、政策、流程和知識融入到代理中——確保您的代理代表您業務的精華。",
          },
          solve: {
            title: "以正確方式解決問題",
            text: "配置您的代理以精確處理複雜場景，遵循您確切的業務邏輯和需求。",
          },
          takeAction: {
            title: "在您的系統上採取行動",
            text: "與您現有的基礎架構無縫集成，允許 AI 執行操作同時保持完全控制和安全性。",
          },
        },
      },
      rulesSystem: {
        title: "強大的規則系統",
        description:
          "定義引導 AI 行為的自定義規則和工作流程，確保所有交互中的一致性和合規性運營。",
        points: {
          visualBuilder: {
            title: "視覺化規則構建器",
            text: "使用我們直觀的拖放界面創建複雜的業務邏輯，無需編碼。",
          },
          realTime: {
            title: "實時規則引擎",
            text: "瞬間處理數千條規則，確保您的 AI 始終遵循您的業務指導原則。",
          },
          compliance: {
            title: "合規性與審計",
            text: "通過全面的日誌記錄和審計跟蹤每個決策和行動，實現完全透明。",
          },
        },
      },
    },
  },

  en: {
    lensAuth: "Lens Auth",
    logout: "Logout",
    requestDemo: "Request Demo",
    browserAutomation: {
      title: "Browser Automation",
      tagText: "Browser",
      mainText: "Empower Your Browser with AI",
      subText:
        "Transform any webpage into an AI-powered workspace. Our intelligent agents understand, analyze, and automate web interactions seamlessly.",
    },
    desktopIntelligence: {
      title: "Desktop Intelligence",
      tagText: "Desktop",
      mainText: "Your Desktop, Now Intelligent",
      subText:
        "Process local files, automate workflows, and let AI understand your desktop context with custom rules tailored to your needs.",
    },
    enterpriseIntegration: {
      title: "Enterprise Integration",
      tagText: "Enterprise",
      mainText: "Seamless SaaS Integration",
      subText:
        "Connect your enterprise systems with our Supervisor Agent. Apply business rules and let AI handle complex data processing.",
    },
    aiSandbox: {
      title: "Lens Sandbox",
      tagText: "Sandbox",
      mainText: "Experiment, Simulate, Innovate",
      subText:
        "Integrate multiple data sources, analyze with AI intelligence, and find the optimal path through strategic simulations.",
    },

    explore: "Explore",
    seeOurProduct: "See Our Product",
    tryOurPlatform: "Try Our Platform",

    features: {
      customerExperience: {
        title: "Transform your customer experience",
        description:
          "Enable your customers to get answers, solve problems, and take action—any time, on any channel, in any language.",
        points: {
          engage: {
            title: "Engage and delight customers",
            text: "Deploy an AI agent that is always available, empathetic, and aligned to your brand tone and voice.",
          },
          support: {
            title: "Support your customers in real-time",
            text: "Help customers with even their most complex issues, whether making an exchange or updating a subscription.",
          },
          adapt: {
            title: "Adapt and get better, faster",
            text: "Respond swiftly to changes in your business, and harness analytics and reporting to continuously improve the customer experience.",
          },
        },
      },
      makeAiYourOwn: {
        title: "Make AI your own",
        description:
          "LensOS platform enables your company to build an AI agent that is personalized to your business and customers.",
        points: {
          ground: {
            title: "Ground your AI agent",
            text: "Imbue your agent with your company's identity, policies, processes, and knowledge – ensuring your agent represents the best of your business.",
          },
          solve: {
            title: "Solve problems the right way",
            text: "Configure your agent to handle complex scenarios with precision, following your exact business logic and requirements.",
          },
          takeAction: {
            title: "Take action on your systems",
            text: "Integrate seamlessly with your existing infrastructure, allowing AI to execute actions while maintaining full control and security.",
          },
        },
      },
      rulesSystem: {
        title: "Powerful Rules System",
        description:
          "Define custom rules and workflows that guide AI behavior, ensuring consistent and compliant operations across all interactions.",
        points: {
          visualBuilder: {
            title: "Visual Rule Builder",
            text: "Create complex business logic with our intuitive drag-and-drop interface, no coding required.",
          },
          realTime: {
            title: "Real-time Rule Engine",
            text: "Process thousands of rules instantly, ensuring your AI always follows your business guidelines.",
          },
          compliance: {
            title: "Compliance & Audit",
            text: "Track every decision and action with comprehensive logging and audit trails for complete transparency.",
          },
        },
      },
    },
  },
};
