'use client'

import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncidentManagement from '@/components/admin/incident-management';
import IncidentHeatmap from '@/components/admin/incident-heatmap';


export default function AdminDashboard({ userProfile }: { userProfile: UserProfile }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Administrator Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {userProfile.name}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Incidents
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">
              Campus community members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5%</div>
            <p className="text-xs text-muted-foreground">
              +1.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>
        <Tabs defaultValue="management" className="space-y-4">
            <TabsList>
                <TabsTrigger value="management">Incident Management</TabsTrigger>
                <TabsTrigger value="heatmap">Incident Heatmap</TabsTrigger>
            </TabsList>
            <TabsContent value="management">
                <IncidentManagement />
            </TabsContent>
            <TabsContent value="heatmap">
                <IncidentHeatmap />
            </TabsContent>
        </Tabs>

    </div>
  );
}
