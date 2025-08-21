import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Search, MapPin, User, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RequestStatus, WasteType, PickupRequest } from "@/types/waste";
import { useAuth } from "@/contexts/AuthContext";

const PickupRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">(
    "ALL"
  );
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(
    null
  );
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>("PENDING");
  const [scheduledDate, setScheduledDate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const { getPickupRequests, updatePickupStatus } = useAuth();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pickupRequests", statusFilter],
    queryFn: () => getPickupRequests(statusFilter),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updatePickupStatus,
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Pickup request status has been updated successfully.",
      });

      setIsUpdateDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");

      queryClient.invalidateQueries({ queryKey: ["pickupRequests"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests?.filter((request) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      request.address.toLowerCase().includes(searchLower) ||
      request.user.name.toLowerCase().includes(searchLower) ||
      request.user.email.toLowerCase().includes(searchLower) ||
      request.wasteType.toLowerCase().includes(searchLower)
    );
  });

  const handleUpdateRequest = (request: PickupRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setScheduledDate(
      request.scheduledDate
        ? new Date(request.scheduledDate).toISOString().substring(0, 16)
        : ""
    );
    setIsUpdateDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (!selectedRequest) return;

    const updateData = {
      id: selectedRequest.id,
      status: newStatus,
      ...((newStatus === "SCHEDULED" || newStatus === "APPROVED") &&
      scheduledDate
        ? { scheduledDate }
        : {}),
      ...(newStatus === "REJECTED" && rejectionReason
        ? { rejectionReason }
        : {}),
    };

    updateStatusMutation.mutate(updateData);
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

  const statusCounts = {
    ALL: requests?.length || 0,
    PENDING: requests?.filter((r) => r.status === "PENDING").length || 0,
    APPROVED: requests?.filter((r) => r.status === "APPROVED").length || 0,
    SCHEDULED: requests?.filter((r) => r.status === "SCHEDULED").length || 0,
    COMPLETED: requests?.filter((r) => r.status === "COMPLETED").length || 0,
    REJECTED: requests?.filter((r) => r.status === "REJECTED").length || 0,
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pickup Requests Management</h1>
          <p className="text-muted-foreground">
            Manage and track citizen waste pickup requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-10 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as RequestStatus | "ALL")
              }
            >
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6 grid grid-cols-6 md:w-max">
          <TabsTrigger value="all" className="relative">
            All
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {statusCounts.ALL}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {statusCounts.PENDING}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            Approved
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {statusCounts.APPROVED}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="relative">
            Scheduled
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {statusCounts.SCHEDULED}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            Completed
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {statusCounts.COMPLETED}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Rejected
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {statusCounts.REJECTED}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {[
          "all",
          "pending",
          "approved",
          "scheduled",
          "completed",
          "rejected",
        ].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading requests...</span>
              </div>
            ) : filteredRequests && filteredRequests.length > 0 ? (
              filteredRequests
                .filter((request) => {
                  if (tabValue === "all") return true;
                  return request.status === tabValue.toUpperCase();
                })
                .map((request) => (
                  <Card
                    key={request.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-start gap-2 mb-3">
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
                              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div>
                                <span className="font-medium">
                                  {request.user.name}
                                </span>
                                <br />
                                <span className="text-sm text-muted-foreground">
                                  {request.user.email}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div>
                                <span>
                                  Requested:{" "}
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {request.scheduledDate && (
                                  <div>
                                    <span>
                                      Scheduled:{" "}
                                      {new Date(
                                        request.scheduledDate
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {request.notes && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm">{request.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 md:w-32">
                          {request.imageUrl && (
                            <div className="border rounded-md overflow-hidden h-24 w-24 md:h-32 md:w-full">
                              <img
                                src={request.imageUrl}
                                alt="Waste"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}

                          <Button
                            onClick={() => handleUpdateRequest(request)}
                            className="mt-auto w-full"
                            variant={
                              request.status === "PENDING"
                                ? "default"
                                : "outline"
                            }
                          >
                            {request.status === "PENDING"
                              ? "Review Request"
                              : "Update Status"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>
                  No {tabValue !== "all" ? tabValue : ""} pickup requests found.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === "PENDING"
                ? "Review Pickup Request"
                : "Update Pickup Request Status"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Status:</p>
              <Badge
                className={
                  selectedRequest ? getStatusColor(selectedRequest.status) : ""
                }
              >
                {selectedRequest?.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new-status">
                Decision:
              </label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as RequestStatus)}
              >
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Keep as Pending</SelectItem>
                  <SelectItem value="APPROVED">Approve Request</SelectItem>
                  <SelectItem value="SCHEDULED">Schedule Pickup</SelectItem>
                  <SelectItem value="COMPLETED">Mark as Completed</SelectItem>
                  <SelectItem value="REJECTED">Reject Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newStatus === "SCHEDULED" || newStatus === "APPROVED") && (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="scheduled-date">
                  Schedule Date and Time:
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="scheduled-date"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="pl-10"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            )}

            {newStatus === "REJECTED" && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="rejection-reason"
                >
                  Rejection Reason:
                </label>
                <Input
                  id="rejection-reason"
                  placeholder="Explain why this request is being rejected"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedRequest?.status === "PENDING"
                ? newStatus === "APPROVED"
                  ? "Approve"
                  : newStatus === "REJECTED"
                  ? "Reject"
                  : "Update"
                : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PickupRequests;
