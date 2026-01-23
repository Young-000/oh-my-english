'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Filter,
  Loader2,
  BookOpen,
  ChevronRight,
  AlertCircle,
  LayoutDashboard,
  Flame,
  Trophy
} from 'lucide-react';
import { useLearningRecordsStatistics } from '@/presentation/hooks/useLearningRecordsStatistics';

interface LearningRecordItem {
  id: string;
  koreanInput: string;
  englishExpression: string;
  contextExplanation: string;
  category: string;
  isBookmarked: boolean;
  masteryLevel: number;
  createdAt: string;
}

interface ApiResponse {
  records: LearningRecordItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'greeting', label: '인사' },
  { value: 'emotion', label: '감정' },
  { value: 'daily', label: '일상' },
  { value: 'business', label: '비즈니스' },
  { value: 'food', label: '음식' },
  { value: 'general', label: '일반' },
];

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    greeting: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    emotion: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    business: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[category] || colors.general;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
};

const getMasteryLabel = (level: number): { label: string; color: string } => {
  if (level >= 5) return { label: '마스터', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
  if (level >= 4) return { label: '숙련', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  if (level >= 3) return { label: '익숙', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  if (level >= 2) return { label: '학습중', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
  return { label: '시작', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' };
};

export default function HistoryPage() {
  const [records, setRecords] = useState<LearningRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch statistics for mini stats display
  const { statistics: stats, isLoading: statsLoading } = useLearningRecordsStatistics();

  const fetchRecords = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/learning-records?${params}`);
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || '학습 기록을 불러오는데 실패했습니다.');
      }

      if (append) {
        setRecords((prev) => [...prev, ...data.records]);
      } else {
        setRecords(data.records);
      }

      setHasMore(data.pagination.page < data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory]);

  // 카테고리 변경 시 초기화
  useEffect(() => {
    setPage(1);
    setRecords([]);
    fetchRecords(1, false);
  }, [selectedCategory, fetchRecords]);

  // 무한 스크롤
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchRecords(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, page, fetchRecords]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Link>
            <h1 className="text-lg font-bold">학습 기록</h1>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                대시보드
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Mini Stats Summary */}
        {!statsLoading && stats && stats.totalRecords > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="text-xs">총 기록</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.totalRecords}</p>
            </div>
            <div className="bg-card rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Flame className={`h-3.5 w-3.5 ${stats.currentStreak > 0 ? 'text-orange-500' : ''}`} />
                <span className="text-xs">연속 학습</span>
              </div>
              <p className={`text-lg font-bold ${stats.currentStreak > 0 ? 'text-orange-500' : 'text-foreground'}`}>
                {stats.currentStreak}일
              </p>
            </div>
            <div className="bg-card rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Trophy className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs">마스터</span>
              </div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.masteredRecords}</p>
            </div>
          </div>
        )}

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">카테고리 필터</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="rounded-full"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 총 기록 수 */}
        {!isLoading && total > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>총 {total}개의 학습 기록</span>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">학습 기록을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 빈 상태 */}
        {!isLoading && !error && records.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">학습 기록이 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategory !== 'all'
                ? '선택한 카테고리에 기록이 없습니다.'
                : '한국어를 번역해서 학습을 시작해보세요!'}
            </p>
            <Button asChild>
              <Link href="/">
                번역 시작하기
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {/* 기록 목록 */}
        {!isLoading && records.length > 0 && (
          <div className="space-y-3">
            {records.map((record) => {
              const mastery = getMasteryLabel(record.masteryLevel);

              return (
                <Card
                  key={record.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* 한국어 입력 */}
                        <p className="font-medium text-foreground mb-1 truncate">
                          {record.koreanInput}
                        </p>

                        {/* 영어 표현 */}
                        <p className="text-primary font-medium mb-2 truncate">
                          {record.englishExpression}
                        </p>

                        {/* 설명 */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {record.contextExplanation}
                        </p>

                        {/* 메타 정보 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(record.category)}`}>
                            {record.category}
                          </span>
                          <Badge variant="outline" className={mastery.color}>
                            {mastery.label}
                          </Badge>
                          {record.isBookmarked && (
                            <Badge variant="secondary" className="text-xs">
                              북마크
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* 날짜 */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(record.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 더 불러오기 트리거 (무한 스크롤) */}
        {!isLoading && hasMore && (
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isLoadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
          </div>
        )}

        {/* 더 이상 기록이 없음 */}
        {!isLoading && !hasMore && records.length > 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            모든 기록을 불러왔습니다
          </div>
        )}
      </main>
    </div>
  );
}
