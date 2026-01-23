'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useLearningRecordsStatistics, type DailyActivity } from '@/presentation/hooks/useLearningRecordsStatistics';

interface HeatmapCellProps {
  date: string;
  count: number;
  maxCount: number;
}

function HeatmapCell({ date, count, maxCount }: HeatmapCellProps) {
  const intensity = maxCount > 0 ? count / maxCount : 0;

  // Determine color intensity based on count
  const getColor = () => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.25) return 'bg-green-200 dark:bg-green-900/50';
    if (intensity < 0.5) return 'bg-green-400 dark:bg-green-700';
    if (intensity < 0.75) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-600 dark:bg-green-500';
  };

  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`w-3 h-3 rounded-sm ${getColor()} cursor-pointer transition-transform hover:scale-125`}
      title={`${formattedDate}: ${count} expressions`}
    />
  );
}

interface LearningHeatmapProps {
  data?: DailyActivity[];
  isLoading?: boolean;
  showTitle?: boolean;
  weeks?: number;
}

export function LearningHeatmap({
  data: propData,
  isLoading: propIsLoading,
  showTitle = true,
  weeks = 52,
}: LearningHeatmapProps) {
  // Use hook only if data is not provided via props
  const hookResult = useLearningRecordsStatistics();

  // Memoize the data to avoid reference changes on every render
  const data = useMemo(() => {
    return propData ?? hookResult.statistics?.dailyActivity ?? [];
  }, [propData, hookResult.statistics?.dailyActivity]);

  const isLoading = propIsLoading ?? hookResult.isLoading;

  // Process data into weeks and calculate max count
  const { weeksData, maxCount, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeksData: [], maxCount: 0, monthLabels: [] };
    }

    // Take only the last N weeks of data (N * 7 days)
    const daysToShow = weeks * 7;
    const recentData = data.slice(-daysToShow);

    // Fill in any missing dates
    const startDate = new Date(recentData[0]?.date || new Date());
    const endDate = new Date();
    const dateMap = new Map<string, number>();

    // Initialize all dates with 0
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
      current.setDate(current.getDate() + 1);
    }

    // Fill in actual counts
    recentData.forEach((item) => {
      dateMap.set(item.date, item.count);
    });

    // Convert to array
    const allDays = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate max count
    const max = Math.max(...allDays.map((d) => d.count), 1);

    // Group by weeks (columns)
    const weeksArray: DailyActivity[][] = [];
    let currentWeek: DailyActivity[] = [];

    // Start from the first Sunday
    const firstDate = new Date(allDays[0]?.date || new Date());
    const firstDayOfWeek = firstDate.getDay();

    // Add empty cells for days before the first date
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1 });
    }

    allDays.forEach((day) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(day);
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    // Generate month labels
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';

    weeksArray.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.count >= 0);
      if (firstValidDay) {
        const date = new Date(firstValidDay.date);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        if (month !== lastMonth) {
          labels.push({ month, weekIndex });
          lastMonth = month;
        }
      }
    });

    return {
      weeksData: weeksArray,
      maxCount: max,
      monthLabels: labels,
    };
  }, [data, weeks]);

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-500" />
              Learning Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0 || weeksData.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-500" />
              Learning Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="text-center py-12">
          <CalendarDays className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-muted-foreground">No activity data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start learning to see your activity heatmap
          </p>
        </CardContent>
      </Card>
    );
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-green-500" />
            Learning Activity
          </CardTitle>
          <CardDescription>
            Your learning activity over the past year
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[750px]">
            {/* Month labels */}
            <div className="flex mb-1 ml-8">
              {monthLabels.map(({ month, weekIndex }, index) => {
                // Calculate position based on week index
                const nextMonthWeekIndex = monthLabels[index + 1]?.weekIndex ?? weeksData.length;
                const weeksForMonth = nextMonthWeekIndex - weekIndex;
                const width = Math.max(weeksForMonth * 14, 30); // 14px per week (12px cell + 2px gap)

                return (
                  <div
                    key={`${month}-${weekIndex}`}
                    className="text-xs text-muted-foreground"
                    style={{
                      width: `${width}px`,
                      marginLeft: index === 0 ? `${weekIndex * 14}px` : '0',
                    }}
                  >
                    {month}
                  </div>
                );
              })}
            </div>

            {/* Heatmap grid */}
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-2 text-xs text-muted-foreground">
                {dayLabels.map((day, index) => (
                  <div
                    key={day}
                    className="h-3 flex items-center"
                    style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks columns */}
              <div className="flex gap-0.5">
                {weeksData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-0.5">
                    {week.map((day, dayIndex) => (
                      day.count >= 0 ? (
                        <HeatmapCell
                          key={day.date}
                          date={day.date}
                          count={day.count}
                          maxCount={maxCount}
                        />
                      ) : (
                        <div key={`empty-${dayIndex}`} className="w-3 h-3" />
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/50" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
                <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
