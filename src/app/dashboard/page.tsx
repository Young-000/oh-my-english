'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/client';
import { LearningRecordsStatistics } from '@/presentation/components/LearningRecordsStatistics';
import { LearningHeatmap } from '@/presentation/components/LearningHeatmap';
import { ArrowLeft, Loader2, History, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/dashboard');
        return;
      }

      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router, supabase.auth]);

  // Loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <h1 className="text-lg font-bold">Learning Dashboard</h1>
            <div className="flex items-center gap-2">
              <Link href="/history">
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
              </Link>
              <Link href="/vocabulary">
                <Button variant="ghost" size="sm">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Vocabulary
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Track your English learning progress and activity
          </p>
        </div>

        {/* Heatmap */}
        <LearningHeatmap />

        {/* Statistics */}
        <LearningRecordsStatistics />

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/">
            <Button size="lg" className="gap-2">
              Start Learning
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" size="lg" className="gap-2">
              <History className="h-4 w-4" />
              View History
            </Button>
          </Link>
          <Link href="/vocabulary">
            <Button variant="outline" size="lg" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Vocabulary Book
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
