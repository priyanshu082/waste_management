import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  Trash2,
  Recycle,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { WasteType, RequestStatus, PickupRequest } from "@/types/waste";

const Dashboard = () => {
  const { toast } = useToast();
  const { user, getPickupRequests, cancelPickupRequest } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's pickup requests
  const { data: pickupRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["userPickupRequests"],
    queryFn: () => getPickupRequests("ALL"),
    select: (data) => {
      return data.filter((request) => request.userId === user?.id);
    },
  });

  // Cancel pickup request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: cancelPickupRequest,
    onSuccess: () => {
      toast({
        title: "Request Cancelled",
        description: "Your pickup request has been cancelled successfully.",
      });

      // Refresh pickup requests data
      queryClient.invalidateQueries({ queryKey: ["userPickupRequests"] });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to cancel pickup request",
        variant: "destructive",
      });
    },
  });

  const handleCancelRequest = (id: string) => {
    cancelRequestMutation.mutate(id);
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "APPROVED":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
  };

  const getWasteTypeColor = (type: WasteType) => {
    switch (type) {
      case "RECYCLABLE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ORGANIC":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "HAZARDOUS":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "ELECTRONIC":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "CONSTRUCTION":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Filter requests by status
  const pendingRequests =
    pickupRequests?.filter(
      (req) => req.status === "PENDING" || req.status === "APPROVED"
    ) || [];
  const scheduledRequests =
    pickupRequests?.filter((req) => req.status === "SCHEDULED") || [];
  const completedRequests =
    pickupRequests?.filter((req) => req.status === "COMPLETED") || [];
  const rejectedRequests =
    pickupRequests?.filter((req) => req.status === "REJECTED") || [];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Citizen Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/request-pickup">
              <Trash2 className="h-4 w-4 mr-2" />
              Request Pickup
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/recycling-centers">
              <Recycle className="h-4 w-4 mr-2" />
              Find Centers
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eco Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.points || 0}</div>
            <p className="text-xs text-muted-foreground">
              Earn more by recycling waste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed waste collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval or pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming waste collections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pickup Requests Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>My Pickup Requests</CardTitle>
          <CardDescription>
            Manage your pickup requests and view their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading requests...</span>
                </div>
              ) : scheduledRequests.length > 0 ? (
                <div className="space-y-4">
                  {scheduledRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getWasteTypeColor(request.wasteType)}
                            >
                              {request.wasteType}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <span>{request.address}</span>
                            </div>

                            {request.scheduledDate && (
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <span>
                                  Scheduled for{" "}
                                  {new Date(
                                    request.scheduledDate
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}

                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <span>
                                Requested on{" "}
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {request.notes && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm">{request.notes}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <X className="h-4 w-4 mr-2" />
                                Cancel Pickup
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel your scheduled pickup
                                  request. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  No, keep it
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleCancelRequest(request.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Yes, cancel it
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                  <p>No upcoming pickups scheduled</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/request-pickup">Request a Pickup</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading requests...</span>
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getWasteTypeColor(request.wasteType)}
                            >
                              {request.wasteType}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <span>{request.address}</span>
                            </div>

                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <span>
                                Requested on{" "}
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {request.notes && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm">{request.notes}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <X className="h-4 w-4 mr-2" />
                                Cancel Request
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel your pickup request. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  No, keep it
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleCancelRequest(request.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Yes, cancel it
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                  <p>No pending requests found</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/citizen/request-pickup">Request a Pickup</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading requests...</span>
                </div>
              ) : completedRequests.length > 0 ? (
                <div className="space-y-4">
                  {completedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getWasteTypeColor(request.wasteType)}
                        >
                          {request.wasteType}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <span>{request.address}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div>
                              Requested:{" "}
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              Completed:{" "}
                              {new Date(request.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Recycle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                  <p>No completed pickups yet</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/citizen/request-pickup">Request a Pickup</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading requests...</span>
                </div>
              ) : rejectedRequests.length > 0 ? (
                <div className="space-y-4">
                  {rejectedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getWasteTypeColor(request.wasteType)}
                        >
                          {request.wasteType}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <span>{request.address}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div>
                              Requested:{" "}
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              Cancelled/Rejected:{" "}
                              {new Date(request.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <X className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                  <p>No cancelled requests</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
