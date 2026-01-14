import { FinanceInsight } from '@/types/finance';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  insights: FinanceInsight[];
}

const insightIcons = {
  spending_increase: TrendingUp,
  spending_decrease: TrendingDown,
  category_alert: AlertCircle,
  goal_progress: Target,
  tip: Lightbulb,
};

const insightStyles = {
  spending_increase: 'warning',
  spending_decrease: 'success',
  category_alert: 'warning',
  goal_progress: 'success',
  tip: '',
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-warning" />
        Insights
      </h3>
      
      <div className="space-y-2">
        {insights.map((insight, index) => {
          const Icon = insightIcons[insight.type];
          const style = insightStyles[insight.type];
          
          return (
            <div
              key={insight.id}
              className={cn(
                'insight-card animate-slide-up',
                style,
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                  insight.type === 'spending_increase' || insight.type === 'category_alert'
                    ? 'bg-warning/20 text-warning'
                    : insight.type === 'spending_decrease' || insight.type === 'goal_progress'
                    ? 'bg-success/20 text-success'
                    : 'bg-info/20 text-info'
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
