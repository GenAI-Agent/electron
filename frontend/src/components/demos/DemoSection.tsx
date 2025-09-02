import { useLanguageStore } from "@/stores/languageStore";
import { translations } from "@/translations";
import { useRouter } from "next/router";
import { cn } from "@/utils/cn";
import { BrowserDemoComponent } from "./BrowserDemoComponent";
import { DesktopDemoComponent } from "./DesktopDemoComponent";
import { EnterpriseDemoComponent } from "./EnterpriseDemoComponent";
import { SandboxDemoComponent } from "./SandboxDemoComponent";
import { RainbowButton } from "../animation/RainbowButton";
import { ArrowRight, Send, MessageCircle, BarChart3, FileText, Database, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { LensOSLogo } from "../animation/LensLogo";

interface DemoSectionProps {
  isTransitioning: boolean;
  selectedTag: number;
  tagContent: any;
  handleTagChange: (index: number) => void;
}

const DemoSection: React.FC<DemoSectionProps> = ({ isTransitioning, selectedTag, tagContent, handleTagChange }) => {
  const { language } = useLanguageStore();
  const t = translations[language as 'zh' | 'en'];
  const router = useRouter();
  
  const [hoveredTag, setHoveredTag] = useState<number>(selectedTag);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  
  const demoQueries = {
    0: "Help me scrape product prices from competitor websites", // Browser Demo
    1: "Generate a monthly performance report from my local data", // Desktop Demo  
    2: "Analyze our SaaS metrics and create growth projections", // Enterprise Demo
    3: "Create task lists for election campaign strategy" // Sandbox Demo
  };

  const getDemoResponse = () => {
    switch (selectedTag) {
      case 0: // Browser Demo - 網頁
        return {
          type: "webpage",
          content: (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
              <div className="bg-gray-100 px-3 py-1.5 border-b flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full" />
                </div>
                <div className="flex-1 bg-white rounded px-2 py-0.5">
                  <span className="text-xs text-gray-600 font-mono">https://competitor-analysis.lens-os.com/results</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
                    <span className="text-white text-xs font-bold">L</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Lens OS Price Intelligence</h3>
                  <span className="bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full ml-auto">Live Data</span>
                </div>
                <div className="space-y-2 bg-white rounded-lg p-2 border">
                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-600 border-b pb-1">
                    <span>Product</span><span>Our Price</span><span>Competitor</span><span>Status</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <span className="font-medium">MacBook Pro M3</span>
                    <span className="font-mono">$1,999</span>
                    <span className="font-mono text-gray-800">$1,899</span>
                    <span className="text-gray-800 font-medium">↓ Higher</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <span className="font-medium">iPad Air 5th Gen</span>
                    <span className="font-mono">$599</span>
                    <span className="font-mono text-gray-600">$649</span>
                    <span className="text-gray-600 font-medium">↑ Lower</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <span className="font-medium">AirPods Pro 2</span>
                    <span className="font-mono">$249</span>
                    <span className="font-mono text-gray-600">$249</span>
                    <span className="text-gray-600 font-medium">= Match</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>Last updated: 2 minutes ago</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">23 competitors tracked</span>
                </div>
              </div>
            </div>
          )
        };
      
      case 1: // Desktop Demo - 報表
        return {
          type: "report",
          content: (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-black text-white px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">Q4 Performance Report</span>
                    <div className="text-xs opacity-90">Generated by Lens OS • Dec 2024</div>
                  </div>
                  <div className="ml-auto bg-white/20 px-2 py-1 rounded text-xs">PDF</div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">REVENUE</span>
                    </div>
                    <div className="text-lg font-bold text-black">$847K</div>
                    <div className="text-xs text-gray-600">+23.4% vs Q3</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">USERS</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">12.4K</div>
                    <div className="text-xs text-gray-600">+18.7% growth</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border shadow-sm">
                  <div className="text-xs font-semibold text-gray-700 mb-2">KEY INSIGHTS</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-black rounded-full"></div>
                      <span>Mobile engagement increased 42%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <span>Enterprise segment contributed 67% of revenue</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <span>Customer retention rate: 94.2%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                  <span>Report ID: RPT-2024-Q4-847</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">32 pages</span>
                </div>
              </div>
            </div>
          )
        };
      
      case 2: // Enterprise Demo - 數據報告
        return {
          type: "data-report",
          content: (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-black text-white px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">Enterprise Dashboard</span>
                    <div className="text-xs opacity-90">Lens OS Analytics • Real-time</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs">Live</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">ACTIVE USERS</span>
                      <span className="text-xs text-black bg-gray-200 px-1.5 py-0.5 rounded">+12%</span>
                    </div>
                    <div className="text-xl font-bold text-black">18,347</div>
                    <div className="text-xs text-gray-500">vs. 16,384 last month</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">MONTHLY REVENUE</span>
                      <span className="text-xs text-black bg-gray-200 px-1.5 py-0.5 rounded">+8.4%</span>
                    </div>
                    <div className="text-xl font-bold text-black">$127K</div>
                    <div className="text-xs text-gray-500">ARR: $1.52M</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">SYSTEM UPTIME</span>
                      <span className="text-xs text-black bg-gray-200 px-1.5 py-0.5 rounded">SLA Met</span>
                    </div>
                    <div className="text-xl font-bold text-gray-800">99.97%</div>
                    <div className="text-xs text-gray-500">4.3 min downtime</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">CHURN RATE</span>
                      <span className="text-xs text-black bg-gray-200 px-1.5 py-0.5 rounded">-0.3%</span>
                    </div>
                    <div className="text-xl font-bold text-gray-600">1.8%</div>
                    <div className="text-xs text-gray-500">Target: &lt;2.5%</div>
                  </div>
                </div>
                <div className="mt-3 bg-white rounded-lg p-3 border shadow-sm">
                  <div className="text-xs font-semibold text-gray-700 mb-2">GROWTH PROJECTIONS</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Q1 2025 Revenue</span>
                      <span className="font-mono text-black">$138K (+9%)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>New Customer Acquisition</span>
                      <span className="font-mono text-gray-700">+247 users</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                  <span>Last sync: 23 seconds ago</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">47 data sources</span>
                </div>
              </div>
            </div>
          )
        };
      
      case 3: // Sandbox Demo - Tasks
        return {
          type: "tasks",
          content: (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-black text-white px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">Campaign Strategy Board</span>
                    <div className="text-xs opacity-90">Lens OS Task Manager • Priority Tasks</div>
                  </div>
                  <div className="ml-auto bg-white/20 px-2 py-1 rounded text-xs">7/12</div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 space-y-3">
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-3 border-l-4 border-l-black">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Social Media Campaign Launch</div>
                        <div className="text-xs text-gray-500">Due: Dec 15 • Assigned: Marketing Team</div>
                      </div>
                      <span className="text-xs bg-black text-white px-2 py-1 rounded">High</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-3 border-l-4 border-l-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Voter Sentiment Analysis Report</div>
                        <div className="text-xs text-gray-500">Due: Dec 18 • Assigned: Data Analytics</div>
                      </div>
                      <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Medium</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-3 border-l-4 border-l-gray-400">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Policy Position Research</div>
                        <div className="text-xs text-gray-500">Due: Dec 22 • Assigned: Strategy Team</div>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">Low</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-3 border-l-4 border-l-gray-300">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Opposition Research & Analysis</div>
                        <div className="text-xs text-gray-500">Due: Dec 25 • Assigned: Research Team</div>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">Low</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                  <span>Project: Election 2024 Campaign</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">58% Complete</span>
                </div>
              </div>
            </div>
          )
        };
        
      default:
        return { type: "default", content: <div>No content available</div> };
    }
  };
  
  useEffect(() => {
    setHoveredTag(selectedTag);
  }, [selectedTag]);

  const handleSendQuery = () => {
    if (!userInput.trim()) return;
    
    setCurrentQuery(userInput);
    setIsTransmitting(true);
    setUserInput("");
    
    // Transmission animation
    setTimeout(() => {
      setIsTransmitting(false);
      setAgentLoading(true);
    }, 800);
    
    // Agent loading phase  
    setTimeout(() => {
      setAgentLoading(false);
      setShowResponse(true);
    }, 2500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendQuery();
    }
  };

  return (

    <div className="flex-1 flex z-10 max-w-[1400px] mx-auto items-start justify-center px-6 pb-10 w-full">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full">
        {/* Left Side - Demo Area */}
        <div className="w-full lg:w-1/2 order-2 lg:order-1">
          <div className="relative w-full h-full min-h-[500px] bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-xl">
            <div
              className={cn(
                "transition-opacity duration-300",
                isTransitioning ? "opacity-0" : "opacity-100"
              )}
            >
              {hoveredTag === 0 && <BrowserDemoComponent />}
              {hoveredTag === 1 && <DesktopDemoComponent />}
              {hoveredTag === 2 && <EnterpriseDemoComponent />}
              {hoveredTag === 3 && <SandboxDemoComponent />}
            </div>
          </div>
        </div>

        {/* Right Side - Content and Options */}
        <div className="w-full lg:w-1/2 order-1 lg:order-2">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg h-full min-h-[500px] flex flex-col">
            {!isDemoMode ? (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-4">Open AGI</h3>

                {/* Option List */}
                <div className="space-y-2 flex-1">
                  {tagContent.map((item: any, index: number) => (
                    <button
                      key={index}
                      onMouseEnter={() => setHoveredTag(index)}
                      onClick={() => {
                        handleTagChange(index);
                        setIsDemoMode(true);
                        setDemoStep(0);
                        setCurrentQuery("");
                        setUserInput(demoQueries[index as keyof typeof demoQueries]);
                        setAgentLoading(false);
                        setIsTransmitting(false);
                        setShowResponse(false);
                        
                        // Auto-send query after 200ms delay
                        setTimeout(() => {
                          const query = demoQueries[index as keyof typeof demoQueries];
                          setCurrentQuery(query);
                          setIsTransmitting(true);
                          setUserInput("");
                          
                          // Transmission animation
                          setTimeout(() => {
                            setIsTransmitting(false);
                            setAgentLoading(true);
                          }, 800);
                          
                          // Agent loading phase  
                          setTimeout(() => {
                            setAgentLoading(false);
                            setShowResponse(true);
                          }, 2500);
                        }, 200);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                        selectedTag === index
                          ? "bg-primary/10 border-primary shadow-md"
                          : hoveredTag === index
                          ? "bg-muted/50 border-border"
                          : "bg-background/50 border-transparent hover:bg-muted/50 hover:border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          selectedTag === index
                            ? "bg-primary text-primary-foreground"
                            : hoveredTag === index
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-medium transition-colors",
                            selectedTag === index ? "text-primary" : "text-foreground"
                          )}>
                            {item.tagText}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.subText}
                          </p>
                        </div>
                        {selectedTag === index && (
                          <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="mt-6 flex gap-3">
                  <RainbowButton
                    onClick={() => router.push(tagContent[selectedTag].path)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <span className="flex items-center justify-center gap-2 text-sm flex-shrink-0">
                      {`${tagContent[selectedTag].tagText} AI`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </RainbowButton>
                  <button
                    onClick={() => router.push('/browser?url=https://www.ask-lens.ai/about-us')}
                    className="flex-1 px-4 py-3 bg-background border-2 flex items-center justify-center gap-2 cursor-pointer border-border rounded-xl font-medium hover:bg-muted hover:border-primary/50 transition-all duration-200 text-sm"
                  >
                    {t.requestDemo}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Open Agent Panel Header */}
                <div className="flex items-center gap-3 mb-4">
                  <LensOSLogo size={32} className="flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Open Agent</h3>
                    <p className="text-xs text-muted-foreground">Lens OS Intelligence</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsDemoMode(false);
                      setDemoStep(0);
                      setCurrentQuery("");
                      setUserInput("");
                      setAgentLoading(false);
                      setIsTransmitting(false);
                      setShowResponse(false);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 bg-background/30 rounded-lg p-4 mb-4 overflow-y-auto">
                  <div className="space-y-4 min-h-[200px]">
                    
                    {/* User Query */}
                    {currentQuery && (
                      <div className="flex gap-3 justify-end">
                        <div className={cn(
                          "bg-primary/20 rounded-lg p-3 max-w-[80%] transition-all duration-500",
                          isTransmitting && "animate-pulse scale-105"
                        )}>
                          <p className="text-sm">{currentQuery}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Transmission Animation */}
                    {isTransmitting && (
                      <div className="flex justify-center">
                        <div className="flex gap-1 items-center text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                          <span className="ml-2">Transmitting to Open Agent...</span>
                        </div>
                      </div>
                    )}

                    {/* Agent Loading */}
                    {agentLoading && (
                      <div className="flex gap-3">
                        <LensOSLogo size={24} className="flex-shrink-0 mt-1" />
                        <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                            </div>
                            <span className="text-sm text-muted-foreground">Processing your request...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Agent Response */}
                    {showResponse && (
                      <div className="flex gap-3">
                        <LensOSLogo size={24} className="flex-shrink-0 mt-1" />
                        <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm mb-3">Task completed successfully! Here's your result:</p>
                          {getDemoResponse().content}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Input Field */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-background/50 border border-border rounded-lg px-4 py-2 flex items-center opacity-50">
                    <input
                      type="text"
                      value={userInput}
                      placeholder="Demo mode - query will be sent automatically"
                      className="flex-1 bg-transparent text-sm focus:outline-none cursor-not-allowed"
                      disabled={true}
                      readOnly
                    />
                  </div>
                  <button 
                    disabled={true}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default DemoSection;