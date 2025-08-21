import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Users,
  TrendingUp,
  Calendar,
  BellRing,
  BarChart3,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSimulatingUpdates, setIsSimulatingUpdates] = useState(false);

  // Fetch pickup request stats
  const { data: requestStats, isLoading: requestStatsLoading } = useQuery({
    queryKey: ["pickupRequestStats"],
    queryFn: async () => {
      const response = await axios.get(
        "http://localhost:5000/api/pickup-requests/analytics/trends",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
        }
      );
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch user stats
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
        },
      });

      const users = response.data.users;
      console.log(users);

      return {
        total: users.length,
        active: users.filter((user) => user._count.pickupRequests > 0).length,
        new: users.filter((user) => {
          const createdDate = new Date(user.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdDate > sevenDaysAgo;
        }).length,
      };
    },
  });

  // Fetch bin alerts
  const { data: binAlerts, isLoading: binAlertsLoading } = useQuery({
    queryKey: ["binAlerts"],
    queryFn: async () => {
      const response = await axios.get(
        "http://localhost:5000/api/bin-status/alerts",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
        }
      );
      return response.data.alerts;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch waste collection trends
  const {
    data: wasteCollectionTrends,
    isLoading: wasteCollectionTrendsLoading,
  } = useQuery({
    queryKey: ["wasteCollectionTrends"],
    queryFn: async () => {
      const response = await axios.post(
        "http://localhost:5000/api/admin/reports",
        {
          reportType: "wasteCollection",
          startDate: new Date(
            Date.now() - 180 * 24 * 60 * 60 * 1000
          ).toISOString(), // Last 6 months
          endDate: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
        }
      );

      // Format for recharts
      const monthlyData = [];
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Group by month
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthName = monthNames[month.getMonth()];
        const monthYear = `${monthName} ${month
          .getFullYear()
          .toString()
          .substr(2)}`;

        monthlyData.push({
          month: monthName,
          general: 0,
          recyclable: 0,
          organic: 0,
          hazardous: 0,
          electronic: 0,
          construction: 0,
        });
      }

      // Fill with data
      const dailyData = response.data.data.dailyBreakdown;
      const wasteTypeData = response.data.data.wasteTypeBreakdown;

      // Simulate distribution based on waste type breakdown
      const totalRequests =
        wasteTypeData.general +
        wasteTypeData.recyclable +
        wasteTypeData.organic +
        wasteTypeData.hazardous +
        wasteTypeData.electronic +
        wasteTypeData.construction;

      if (totalRequests > 0) {
        const generalRatio = wasteTypeData.general / totalRequests;
        const recyclableRatio = wasteTypeData.recyclable / totalRequests;
        const organicRatio = wasteTypeData.organic / totalRequests;
        const hazardousRatio = wasteTypeData.hazardous / totalRequests;
        const electronicRatio = wasteTypeData.electronic / totalRequests;
        const constructionRatio = wasteTypeData.construction / totalRequests;

        dailyData.forEach((day) => {
          const date = new Date(day.date);
          const monthIndex = monthlyData.findIndex(
            (m) => m.month === monthNames[date.getMonth()]
          );

          if (monthIndex !== -1) {
            monthlyData[monthIndex].general += Math.round(
              day.count * generalRatio
            );
            monthlyData[monthIndex].recyclable += Math.round(
              day.count * recyclableRatio
            );
            monthlyData[monthIndex].organic += Math.round(
              day.count * organicRatio
            );
            monthlyData[monthIndex].hazardous += Math.round(
              day.count * hazardousRatio
            );
            monthlyData[monthIndex].electronic += Math.round(
              day.count * electronicRatio
            );
            monthlyData[monthIndex].construction += Math.round(
              day.count * constructionRatio
            );
          }
        });
      }

      return monthlyData;
    },
  });

  // Fetch recent pickup requests
  const { data: recentRequests, isLoading: recentRequestsLoading } = useQuery({
    queryKey: ["recentPickupRequests"],
    queryFn: async () => {
      const response = await axios.get(
        "http://localhost:5000/api/pickup-requests?limit=5",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
        }
      );

      return response.data.requests.map((request) => ({
        id: request.id,
        date: new Date(request.createdAt).toISOString().split("T")[0],
        name: request.user.name,
        type: request.wasteType,
        status: request.status.toLowerCase(),
      }));
    },
  });

  // Function to get daily pickup request counts for the chart
  const { data: requestsChart, isLoading: requestsChartLoading } = useQuery({
    queryKey: ["dailyPickupRequests"],
    queryFn: async () => {
      const response = await axios.post(
        "http://localhost:5000/api/admin/reports",
        {
          reportType: "wasteCollection",
          startDate: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // Last 7 days
          endDate: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
        }
      );

      return response.data.data.dailyBreakdown.map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        }),
        count: item.count,
      }));
    },
  });

  // Function to handle generate reports button
  const handleGenerateReports = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/reports",
        { reportType: "comprehensive" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `waste-management-report-${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(link);
      link.click();

      toast({
        title: "Report Generated",
        description:
          "The report has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Report Generation Failed",
        description:
          "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Function to handle simulate updates button
  const handleSimulateUpdates = async () => {
    setIsSimulatingUpdates(true);
    try {
      await axios.post(
        "http://localhost:5000/api/bin-status/simulate-update",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
        }
      );

      toast({
        title: "Updates Simulated",
        description: "Bin statuses have been updated successfully.",
      });

      // Refetch bin alerts
      await axios.get("http://localhost:5000/api/bin-status/alerts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
        },
      });
    } catch (error) {
      console.error("Error simulating updates:", error);
      toast({
        title: "Simulation Failed",
        description:
          "There was an error simulating bin updates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSimulatingUpdates(false);
    }
  };

  // Loading states
  const isLoading =
    requestStatsLoading ||
    userStatsLoading ||
    binAlertsLoading ||
    wasteCollectionTrendsLoading ||
    recentRequestsLoading ||
    requestsChartLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Default values if data isn't available yet
  const stats = {
    requests: requestStats?.stats || {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
    },
    users: userStats || { total: 0, active: 0, new: 0 },
    binAlerts: binAlerts?.length || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateReports} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Reports"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSimulateUpdates}
            disabled={isSimulatingUpdates}
          >
            {isSimulatingUpdates ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              "Simulate Updates"
            )}
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pickup Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">
                  {stats.requests.total}
                </span>
              </div>
              <Badge variant="outline" className="flex items-center">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">12%</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-2xl font-bold">
                  {stats.requests.pending}
                </span>
              </div>
              <Badge variant="outline" className="flex items-center">
                <ArrowUp className="h-3 w-3 text-amber-500 mr-1" />
                <span className="text-xs text-amber-500">8%</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{stats.users.total}</span>
              </div>
              <Badge variant="outline" className="flex items-center">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">6%</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bin Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BellRing className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-2xl font-bold">{stats.binAlerts}</span>
              </div>
              <Badge variant="outline" className="flex items-center">
                <ArrowDown className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">2</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Waste Collection Trends</CardTitle>
            <CardDescription>Weight in tons by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={wasteCollectionTrends || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hazardous"
                    stackId="1"
                    stroke="#ff5722"
                    fill="#ff5722"
                  />
                  <Area
                    type="monotone"
                    dataKey="organic"
                    stackId="1"
                    stroke="#8bc34a"
                    fill="#8bc34a"
                  />
                  <Area
                    type="monotone"
                    dataKey="recyclable"
                    stackId="1"
                    stroke="#2196f3"
                    fill="#2196f3"
                  />
                  <Area
                    type="monotone"
                    dataKey="general"
                    stackId="1"
                    stroke="#607d8b"
                    fill="#607d8b"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Pickup Requests</CardTitle>
            <CardDescription>
              Number of requests in the last week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={requestsChart || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2E7D32" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Recent Requests and Bin Alerts */}
      <Tabs defaultValue="requests">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Recent Requests</TabsTrigger>
          <TabsTrigger value="alerts">Bin Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Recent Pickup Requests</CardTitle>
              <CardDescription>
                Latest waste collection requests from citizens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-muted-foreground">
                      <th className="p-2 text-left font-medium">Date</th>
                      <th className="p-2 text-left font-medium">Citizen</th>
                      <th className="p-2 text-left font-medium">Type</th>
                      <th className="p-2 text-left font-medium">Status</th>
                      <th className="p-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentRequests || []).map((request) => (
                      <tr key={request.id} className="border-b">
                        <td className="p-2">{request.date}</td>
                        <td className="p-2">{request.name}</td>
                        <td className="p-2">{request.type}</td>
                        <td className="p-2">
                          <Badge
                            variant={
                              request.status === "completed"
                                ? "default"
                                : request.status === "pending"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/requests?id=${request.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" asChild>
                <Link
                  to="/admin/requests"
                  className="flex items-center justify-center"
                >
                  View All Requests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Bin Status Alerts</CardTitle>
              <CardDescription>
                Real-time alerts from IoT-enabled bins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(binAlerts || []).slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                        <BellRing className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          Bin {alert.binId} - {alert.status}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {alert.location} •{" "}
                          {new Date(alert.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/bin-status">Resolve</Link>
                    </Button>
                  </div>
                ))}

                {(!binAlerts || binAlerts.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No bin alerts at the moment.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" asChild>
                <Link
                  to="/admin/bin-status"
                  className="flex items-center justify-center"
                >
                  View All Alerts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
