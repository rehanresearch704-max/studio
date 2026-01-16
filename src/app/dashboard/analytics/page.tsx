'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 /> System Analytics</CardTitle>
        <CardDescription>This page is under construction. Here you will find detailed analytics and reporting for the application.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Coming soon...</p>
      </CardContent>
    </Card>
  );
}
