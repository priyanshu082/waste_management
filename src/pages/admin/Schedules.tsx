import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CollectionSchedule, WasteType } from "@/types/waste";

const Schedules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] =
    useState<CollectionSchedule | null>(null);

  // Form state
  const [formArea, setFormArea] = useState("");
  const [formDayOfWeek, setFormDayOfWeek] = useState("0");
  const [formStartTime, setFormStartTime] = useState("08:00");
  const [formEndTime, setFormEndTime] = useState("12:00");
  const [formWasteTypes, setFormWasteTypes] = useState<WasteType[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const {
    getCollectionSchedules,
    createCollectionSchedule,
    updateCollectionSchedule,
    deleteCollectionSchedule,
  } = useAuth();

  // Fetch all collection schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["collectionSchedules"],
    queryFn: getCollectionSchedules,
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: createCollectionSchedule,
    onSuccess: () => {
      toast({
        title: "Schedule created",
        description: "Collection schedule has been created successfully.",
      });

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["collectionSchedules"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateCollectionSchedule(id, data),
    onSuccess: () => {
      toast({
        title: "Schedule updated",
        description: "Collection schedule has been updated successfully.",
      });

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["collectionSchedules"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: deleteCollectionSchedule,
    onSuccess: () => {
      toast({
        title: "Schedule deleted",
        description: "Collection schedule has been deleted successfully.",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["collectionSchedules"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormArea("");
    setFormDayOfWeek("0");
    setFormStartTime("08:00");
    setFormEndTime("12:00");
    setFormWasteTypes([]);
    setFormIsActive(true);
    setCurrentSchedule(null);
    setIsEditMode(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (schedule: CollectionSchedule) => {
    setIsEditMode(true);
    setCurrentSchedule(schedule);
    setFormArea(schedule.area);
    setFormDayOfWeek(schedule.dayOfWeek.toString());
    setFormStartTime(schedule.startTime);
    setFormEndTime(schedule.endTime);
    setFormWasteTypes(schedule.wasteTypes);
    setFormIsActive(schedule.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const scheduleData = {
      area: formArea,
      dayOfWeek: parseInt(formDayOfWeek),
      startTime: formStartTime,
      endTime: formEndTime,
      wasteTypes: formWasteTypes,
      isActive: formIsActive,
    };

    if (isEditMode && currentSchedule) {
      updateScheduleMutation.mutate({
        id: currentSchedule.id,
        data: scheduleData,
      });
    } else {
      createScheduleMutation.mutate(scheduleData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const toggleWasteType = (type: WasteType) => {
    if (formWasteTypes.includes(type)) {
      setFormWasteTypes(formWasteTypes.filter((t) => t !== type));
    } else {
      setFormWasteTypes([...formWasteTypes, type]);
    }
  };

  const getDayName = (day: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day];
  };

  const formatTime = (time: string) => {
    // Convert 24-hour time to 12-hour format with AM/PM
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hour = hours % 12 || 12;
      return `${hour}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (e) {
      return time;
    }
  };

  const getWasteTypeBadge = (type: WasteType) => {
    const colors: Record<WasteType, string> = {
      GENERAL: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      RECYCLABLE:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      ORGANIC:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      HAZARDOUS: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      ELECTRONIC:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      CONSTRUCTION:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };

    return (
      colors[type] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collection Schedules</h1>
          <p className="text-muted-foreground">
            Manage waste collection schedules across the city
          </p>
        </div>

        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading schedules...</span>
        </div>
      ) : schedules && schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className={`hover:shadow-md transition-shadow ${
                !schedule.isActive ? "opacity-70" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{schedule.area}</span>
                  </div>
                  <Badge variant={schedule.isActive ? "default" : "outline"}>
                    {schedule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Weekly on {getDayName(schedule.dayOfWeek)}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatTime(schedule.startTime)} -{" "}
                    {formatTime(schedule.endTime)}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">
                    Waste Types Collected:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {schedule.wasteTypes.map((type) => (
                      <Badge key={type} className={getWasteTypeBadge(type)}>
                        {type.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <div className="flex justify-end gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(schedule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No collection schedules found. Create one to get started.</p>
        </div>
      )}

      {/* Create/Edit Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Schedule" : "Create New Schedule"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the details of the collection schedule."
                : "Add a new waste collection schedule to the system."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area/District</Label>
                <Input
                  id="area"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  placeholder="e.g., Downtown, North Side, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Collection Day</Label>
                <Select value={formDayOfWeek} onValueChange={setFormDayOfWeek}>
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Waste Types Collected</Label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {[
                    "GENERAL",
                    "RECYCLABLE",
                    "ORGANIC",
                    "HAZARDOUS",
                    "ELECTRONIC",
                    "CONSTRUCTION",
                  ].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={formWasteTypes.includes(type as WasteType)}
                        onCheckedChange={() =>
                          toggleWasteType(type as WasteType)
                        }
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-sm cursor-pointer"
                      >
                        {type.toLowerCase()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isActive"
                  checked={formIsActive}
                  onCheckedChange={(checked) =>
                    setFormIsActive(checked as boolean)
                  }
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Schedule is active
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createScheduleMutation.isPending ||
                  updateScheduleMutation.isPending ||
                  !formArea ||
                  formWasteTypes.length === 0
                }
              >
                {(createScheduleMutation.isPending ||
                  updateScheduleMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedules;
