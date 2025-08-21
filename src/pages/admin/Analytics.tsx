import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Loader2, ArrowUp, ArrowDown, Award as AwardIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  // Fetch analytics data from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    }
  });

  const renderSkeletonCards = () => (
    <>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            <AwardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <p className="text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin mr-1" /> Loading...
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Waste Management Analytics</h1>
          <p className="text-muted-foreground">
            Insights and statistics for waste collection and recycling
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? renderSkeletonCards() : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                <AwardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.summary.totalCollections || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {data?.summary.collectionsIncrease || 0}%
                  </span>{" "}
                  vs previous month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Recycling Rate</CardTitle>
                <AwardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.summary.recyclingRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {data?.summary.recyclingIncrease || 0}%
                  </span>{" "}
                  vs previous month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Waste per Pickup</CardTitle>
                <AwardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.summary.averageWaste || 0} kg
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="flex items-center text-red-600">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    {data?.summary.wasteDecrease || 0}%
                  </span>{" "}
                  vs previous month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Citizen Engagement</CardTitle>
                <AwardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.summary.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {data?.summary.engagementIncrease || 0}%
                  </span>{" "}
                  vs previous month
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      <Tabs defaultValue="collection" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collection">Waste Collection</TabsTrigger>
          <TabsTrigger value="recycling">Recycling Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Waste Collection Overview</CardTitle>
              <CardDescription>
                Trends in waste collection over the past months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading chart data...</span>
                </div>
              ) : data?.collectionData ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.collectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#8884d8" name="Total Waste (kg)" />
                    <Bar dataKey="recycled" fill="#82ca9d" name="Recycled Waste (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No collection data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recycling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Waste Composition</CardTitle>
              <CardDescription>
                Distribution of different waste types
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading chart data...</span>
                </div>
              ) : data?.wasteComposition ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      isAnimationActive={false}
                      data={data.wasteComposition}
                      cx="50%"
                      cy="50%"
                      outerRadius={140}
                      fill="#8884d8"
                      label
                    >
                      {data.wasteComposition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No waste composition data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recycling Rate Over Time</CardTitle>
              <CardDescription>
                Trend of recycling rate over the past months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading chart data...</span>
                </div>
              ) : data?.recyclingRateData ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={data.recyclingRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rate" stroke="#82ca9d" name="Recycling Rate (%)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No recycling rate data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
