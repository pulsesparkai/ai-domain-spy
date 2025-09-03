import { 
  AIVisibilityScoreSkeleton,
  SentimentAnalysisSkeleton,
  CitationsTrackingSkeleton,
  AIRankingsSkeleton,
  TrendingPagesSkeleton,
  DashboardCardSkeleton
} from '@/components/ui/loading-skeletons';

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Hero stats row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <DashboardCardSkeleton key={i} title={false} />
      ))}
    </div>

    {/* Main dashboard grid */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* AI Visibility Score - spans 2 columns on large screens */}
      <div className="lg:col-span-8">
        <AIVisibilityScoreSkeleton />
      </div>
      
      {/* Sentiment Analysis */}
      <div className="lg:col-span-4">
        <SentimentAnalysisSkeleton />
      </div>

      {/* Citations Tracking */}
      <div className="lg:col-span-4">
        <CitationsTrackingSkeleton />
      </div>

      {/* AI Rankings */}
      <div className="lg:col-span-4">
        <AIRankingsSkeleton />
      </div>

      {/* Trending Pages - spans 2 columns */}
      <div className="lg:col-span-8">
        <TrendingPagesSkeleton />
      </div>

      {/* Additional chart components */}
      <div className="lg:col-span-6">
        <DashboardCardSkeleton chart />
      </div>
      
      <div className="lg:col-span-6">
        <DashboardCardSkeleton chart />
      </div>
    </div>
  </div>
);

export const CardSkeleton = DashboardCardSkeleton;