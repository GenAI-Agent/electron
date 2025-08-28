import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import AgentPanel from '@/components/AgentPanel';
import Header, { ViewMode } from '@/components/ui/header';

// 類型定義
interface CalendarEvent {
  id: string;
  kind: 'business' | 'personal' | 'activity' | 'public_event';
  when: {
    start: string;
    end: string;
    timezone: string;
    all_day: boolean;
  };
  roles: Array<{
    entity_id: string;
    role: string;
    required: boolean;
    response_status: string;
    weight: number;
  }>;
  place?: {
    entity_id?: string;
    fallback_text: string;
    geo?: any;
    region?: string;
  };
  facets: {
    type: string;
    topics: string[];
    tags: string[];
  };
  status: string;
  visibility: string;
  priority: number;
  confidence: number;
  notes?: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
  total: number;
  date_range: {
    start: string;
    end: string;
  };
  filters_applied: Record<string, any>;
}


const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');

  // 獲取日曆事件
  const fetchEvents = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      // 計算月份的開始和結束日期
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const response = await fetch(
        `http://localhost:8021/api/calendar/events?start_date=${startDate}&end_date=${endDate}&limit=100`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CalendarResponse = await response.json();
      setEvents(data.events);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate]);

  // 導航函數
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 獲取月份的日期網格
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateObj = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  // 獲取特定日期的事件
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.when.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // 事件顏色映射 - 使用更柔和的顏色方案
  const getEventColor = (kind: string) => {
    switch (kind) {
      case 'business':
        return 'bg-emerald-100 text-emerald-800 border-l-4 border-emerald-500';
      case 'activity':
        return 'bg-amber-100 text-amber-800 border-l-4 border-amber-500';
      case 'public_event':
        return 'bg-rose-100 text-rose-800 border-l-4 border-rose-500';
      case 'personal':
        return 'bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500';
      default:
        return 'bg-gray-100 text-gray-800 border-l-4 border-gray-400';
    }
  };

  // 格式化時間
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const calendarDays = getCalendarDays();
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="h-screen w-screen flex flex-col pt-10 bg-background m-0 p-0 overflow-hidden">
      {/* Header */}
      <Header
        title="日曆系統"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 grid relative overflow-hidden min-h-0"
        style={{
          gridTemplateColumns: viewMode === 'with-agent' ? '1fr 400px' : '1fr',
          gridTemplateRows: '1fr',
        }}
      >
        {/* Calendar View */}
        <div className="h-full overflow-auto bg-background">
          <div className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6" />
                  {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
                </h1>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  今天
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-md hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-md hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading/Error States */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">載入中...</div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-500">錯誤: {error}</div>
              </div>
            )}

            {/* Calendar Grid */}
            {!loading && !error && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Week Header */}
                <div className="grid grid-cols-7 bg-muted/50">
                  {weekDays.map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const dayEvents = getEventsForDate(day);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[120px] p-2 border-r border-b border-border last:border-r-0 transition-colors hover:bg-accent/50",
                          !isCurrentMonth && "bg-muted/20 text-muted-foreground opacity-50",
                          isToday && "bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1",
                          isToday && "text-blue-700 font-bold bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center"
                        )}>
                          {day.getDate()}
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={cn(
                                "relative text-xs px-2 py-1.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]",
                                "bg-card border-l-3",
                                event.kind === 'business' && "border-l-emerald-500 hover:bg-emerald-50",
                                event.kind === 'activity' && "border-l-amber-500 hover:bg-amber-50",
                                event.kind === 'public_event' && "border-l-rose-500 hover:bg-rose-50",
                                event.kind === 'personal' && "border-l-indigo-500 hover:bg-indigo-50",
                                !['business', 'activity', 'public_event', 'personal'].includes(event.kind) && "border-l-gray-400 hover:bg-gray-50"
                              )}
                              title={event.notes || event.facets.type}
                            >
                              <div className="flex items-start gap-1">
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {formatTime(event.when.start)}
                                </span>
                                <span className="flex-1 font-medium text-foreground truncate">
                                  {event.facets.type.split('/')[1] || event.facets.type}
                                </span>
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded px-1 py-0.5 text-center mt-1">
                              +{dayEvents.length - 3} 更多
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent Panel */}
        {viewMode === 'with-agent' && (
          <div className="h-full border-l border-border">
            <AgentPanel />
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-card p-6 rounded-lg border border-border max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{selectedEvent.facets.type}</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{formatTime(selectedEvent.when.start)} - {formatTime(selectedEvent.when.end)}</span>
              </div>

              {selectedEvent.place && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.place.fallback_text}</span>
                </div>
              )}

              {selectedEvent.roles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.roles.length} 參與者</span>
                </div>
              )}

              {selectedEvent.notes && (
                <div className="mt-4">
                  <p className="text-muted-foreground">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
