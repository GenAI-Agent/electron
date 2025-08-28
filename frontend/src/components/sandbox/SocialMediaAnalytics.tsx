import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MessageSquare, Hash, Calendar, Activity, Globe, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AnalyticsData {
  source: string;
  data: any[];
  sourceName: string;
}

interface SocialMediaAnalyticsProps {
  analyticsData: AnalyticsData;
  className?: string;
}

export const SocialMediaAnalytics: React.FC<SocialMediaAnalyticsProps> = ({
  analyticsData,
  className
}) => {
  const { source, data, sourceName } = analyticsData;

  // Calculate metrics based on source
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalPosts = data.length;
    
    // Common metrics
    const totalEngagement = data.reduce((sum, post) => {
      const likes = post.like_count || post.push_count || 0;
      const replies = post.reply_count || post.comment_count || 0;
      const reposts = post.repost_count || post.share_count || 0;
      const boos = post.boo_count || 0;
      return sum + likes + replies + reposts + Math.abs(boos);
    }, 0);

    const avgEngagement = Math.round(totalEngagement / totalPosts);

    // Get top hashtags
    const hashtagCounts = new Map<string, number>();
    data.forEach(post => {
      if (post.hashtags) {
        post.hashtags.forEach((tag: string) => {
          hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
        });
      }
    });
    const topHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Time distribution
    const hourDistribution = new Array(24).fill(0);
    data.forEach(post => {
      if (post.created_time) {
        const hour = new Date(post.created_time).getHours();
        hourDistribution[hour]++;
      }
    });

    // Source-specific metrics
    let platformSpecific: any = {};
    
    switch (source) {
      case 'threads':
      case 'twitter':
        const totalFollowers = data.reduce((sum, post) => 
          sum + (post.author_followers_count || 0), 0);
        platformSpecific = {
          avgFollowers: Math.round(totalFollowers / totalPosts),
          totalReposts: data.reduce((sum, post) => sum + (post.repost_count || 0), 0),
          totalQuotes: data.reduce((sum, post) => sum + (post.quote_count || 0), 0),
        };
        break;
      
      case 'facebook':
        const reactions = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
        data.forEach(post => {
          if (post.reaction_summary) {
            Object.entries(post.reaction_summary).forEach(([key, value]) => {
              if (reactions.hasOwnProperty(key)) {
                reactions[key as keyof typeof reactions] += value as number;
              }
            });
          }
        });
        platformSpecific = {
          reactions,
          totalShares: data.reduce((sum, post) => sum + (post.share_count || 0), 0),
        };
        break;
      
      case 'ptt':
        const totalPush = data.reduce((sum, post) => sum + (post.push_count || 0), 0);
        const totalBoo = data.reduce((sum, post) => sum + (post.boo_count || 0), 0);
        const boards = new Map<string, number>();
        data.forEach(post => {
          if (post.board) {
            boards.set(post.board, (boards.get(post.board) || 0) + 1);
          }
        });
        platformSpecific = {
          pushBooRatio: totalBoo > 0 ? (totalPush / totalBoo).toFixed(2) : 'N/A',
          totalPush,
          totalBoo,
          topBoards: Array.from(boards.entries()).sort((a, b) => b[1] - a[1])
        };
        break;
    }

    return {
      totalPosts,
      totalEngagement,
      avgEngagement,
      topHashtags,
      hourDistribution,
      platformSpecific
    };
  }, [data, source]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">沒有可分析的資料</p>
      </div>
    );
  }

  // Peak hour calculation
  const peakHour = metrics.hourDistribution.indexOf(Math.max(...metrics.hourDistribution));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">總貼文數</p>
              <p className="text-2xl font-bold">{metrics.totalPosts}</p>
            </div>
            <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">總互動數</p>
              <p className="text-2xl font-bold">{metrics.totalEngagement.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">平均互動</p>
              <p className="text-2xl font-bold">{metrics.avgEngagement.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">發文高峰</p>
              <p className="text-2xl font-bold">{peakHour}:00</p>
            </div>
            <Calendar className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>
      </div>

      {/* Platform Specific Stats */}
      {source === 'threads' || source === 'twitter' ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {sourceName} 專屬指標
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">平均粉絲數</p>
              <p className="text-xl font-semibold">
                {metrics.platformSpecific.avgFollowers.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">總轉發數</p>
              <p className="text-xl font-semibold">
                {metrics.platformSpecific.totalReposts.toLocaleString()}
              </p>
            </div>
            {metrics.platformSpecific.totalQuotes !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">總引用數</p>
                <p className="text-xl font-semibold">
                  {metrics.platformSpecific.totalQuotes.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      ) : source === 'facebook' ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Facebook 反應統計
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(metrics.platformSpecific.reactions).map(([reaction, count]) => (
              <div key={reaction} className="text-center">
                <p className="text-sm text-muted-foreground capitalize">{reaction}</p>
                <p className="text-xl font-semibold">{(count as number).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">總分享數</p>
            <p className="text-xl font-semibold">
              {metrics.platformSpecific.totalShares.toLocaleString()}
            </p>
          </div>
        </Card>
      ) : source === 'ptt' ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            PTT 互動統計
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">推文總數</p>
              <p className="text-xl font-semibold text-green-600">
                ↑ {metrics.platformSpecific.totalPush.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">噓文總數</p>
              <p className="text-xl font-semibold text-red-600">
                ↓ {metrics.platformSpecific.totalBoo.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">推噓比</p>
              <p className="text-xl font-semibold">{metrics.platformSpecific.pushBooRatio}</p>
            </div>
          </div>
          {metrics.platformSpecific.topBoards.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">熱門看板</p>
              <div className="flex flex-wrap gap-2">
                {metrics.platformSpecific.topBoards.slice(0, 5).map(([board, count]: [string, number]) => (
                  <span key={board} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    {board} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {/* Top Hashtags */}
      {metrics.topHashtags.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            熱門標籤
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.topHashtags.map(([tag, count]) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
              >
                #{tag}
                <span className="text-xs bg-blue-200 px-2 rounded-full">{count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Time Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          發文時間分布
        </h3>
        <div className="flex items-end gap-1 h-32">
          {metrics.hourDistribution.map((count, hour) => {
            const height = count > 0 ? (count / Math.max(...metrics.hourDistribution)) * 100 : 0;
            return (
              <div
                key={hour}
                className="flex-1 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {hour}:00 - {count} 篇
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0:00</span>
          <span>6:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </Card>

      {/* Top Posts by Engagement */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          熱門貼文（按互動數排序）
        </h3>
        <div className="space-y-3">
          {data
            .map(post => ({
              ...post,
              totalEngagement: (post.like_count || post.push_count || 0) + 
                               (post.reply_count || post.comment_count || 0) + 
                               (post.repost_count || post.share_count || 0)
            }))
            .sort((a, b) => b.totalEngagement - a.totalEngagement)
            .slice(0, 5)
            .map((post, index) => (
              <div key={post.post_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {post.author_name || post.page_or_user_name || post.author_id || '匿名'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {post.title || post.post_text}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>👍 {(post.like_count || post.push_count || 0).toLocaleString()}</span>
                    <span>💬 {(post.reply_count || post.comment_count || 0).toLocaleString()}</span>
                    <span>🔄 {(post.repost_count || post.share_count || 0).toLocaleString()}</span>
                    <span className="ml-auto">總互動: {post.totalEngagement.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default SocialMediaAnalytics;