import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  ImageIcon,
  Trash2,
  Info,
  AlertTriangle,
  FileImage,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { Badge } from "@/components/ui/badge";
import { WasteType } from "@/types/waste";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

const pickupSchema = z
  .object({
    address: z.string().min(5, "Address is too short"),
    city: z.string().min(2, "City is required"),
    zipCode: z.string().min(5, "Valid ZIP code is required"),
    wasteType: z.string().min(1, "Please select waste type"),
    quantity: z.string().min(1, "Please select quantity"),
    date: z.string().min(1, "Please select a date"),
    time: z.string().min(1, "Please select a time"),
    notes: z.string().optional(),
  })
  .refine((data) => data.wasteType, {
    message: "Waste type is required",
    path: ["wasteType"],
  });

type PickupFormValues = z.infer<typeof pickupSchema>;

const RequestPickup = () => {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [requestId, setRequestId] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { createPickup } = useAuth();

  const form = useForm<PickupFormValues>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      address: "",
      city: "",
      zipCode: "",
      wasteType: "",
      quantity: "",
      date: "",
      time: "",
      notes: "",
    },
  });

  const createPickupMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(
        "http://localhost:5000/api/pickup-requests",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create pickup request");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setRequestId(data.request.id);
      setShowSuccess(true);
      toast({
        title: "Pickup Request Submitted",
        description: "Your request has been received and is being processed",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem submitting your request",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUploadedFiles = Array.from(files);
    setUploadedImages((prev) => [...prev, ...newUploadedFiles]);

    const newPreviews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          setImagePreviews((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (newUploadedFiles.length > 0) {
      analyzeWasteImage(newUploadedFiles[0]);
    }
  };

  const analyzeWasteImage = async (file: File) => {
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "http://localhost:5000/api/recycling-centers/analyze-waste",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("waste_token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);

      if (result.analysis) {
        form.setValue("wasteType", result.analysis.wasteType);
        form.setValue("quantity", result.analysis.quantity.toLowerCase());
      }

      toast({
        title: "Image Analysis Complete",
        description: "We've detected the waste type and estimated quantity",
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis failed",
        description:
          "Unable to analyze the waste image. Please select options manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setAnalysisResult(null);
  };

  async function onSubmit(values: PickupFormValues) {
    if (uploadedImages.length === 0) {
      toast({
        title: "Image Required",
        description:
          "Please upload an image of the waste for accurate processing",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();

    formData.append(
      "address",
      `${values.address}, ${values.city}, ${values.zipCode}`
    );
    formData.append("wasteType", values.wasteType.toUpperCase() as WasteType);
    formData.append(
      "notes",
      `Quantity: ${values.quantity}, Preferred Date: ${
        values.date
      }, Preferred Time: ${values.time}${
        values.notes ? ", Notes: " + values.notes : ""
      }`
    );

    if (uploadedImages.length > 0) {
      formData.append("image", uploadedImages[0]);
    }

    createPickupMutation.mutate(formData);
  }

  const handleNewRequest = () => {
    form.reset();
    setUploadedImages([]);
    setImagePreviews([]);
    setShowSuccess(false);
    setAnalysisResult(null);
  };

  const wasteTypeInfo = {
    GENERAL: "Household waste that cannot be recycled.",
    RECYCLABLE: "Clean paper, cardboard, glass, metals, and plastics.",
    ORGANIC: "Grass clippings, leaves, branches, and other plant material.",
    HAZARDOUS: "Paint, chemicals, batteries, electronic waste, etc.",
    ELECTRONIC: "Computers, phones, TVs, and other electronic devices.",
    CONSTRUCTION: "Building materials, debris, and renovation waste.",
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-3xl mx-auto">
      {showSuccess ? (
        <Card className="animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto my-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Trash2 className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle className="text-2xl">
              Request Submitted Successfully
            </CardTitle>
            <CardDescription>
              Your waste pickup request has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6 text-center">
            <p className="mb-4">
              Your request ID is{" "}
              <span className="font-bold">
                {requestId ||
                  "WP-" + Math.floor(100000 + Math.random() * 900000)}
              </span>
            </p>
            <p className="text-muted-foreground mb-6">
              You will receive a confirmation email shortly with the details of
              your pickup request. You can track the status of your request in
              the dashboard.
            </p>
            <Button onClick={handleNewRequest}>Submit Another Request</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Request Waste Pickup</CardTitle>
            <CardDescription>
              Fill out the form below to schedule a waste collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium mb-4">Waste Images</h3>
                  {uploadedImages.length === 0 ? (
                    <div className="border-dashed border-2 border-border rounded-lg p-6 text-center">
                      <Input
                        type="file"
                        id="images"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        required
                      />
                      <label htmlFor="images" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <FileImage className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium">
                            Click to upload photos of the waste
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            PNG, JPG or GIF (max. 5MB per image)
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {imagePreviews.map((image, index) => (
                          <div key={index} className="relative group h-40">
                            <img
                              src={image}
                              alt={`Uploaded ${index + 1}`}
                              className="h-full w-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-black/50 p-1 rounded-full opacity-70 hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {isAnalyzing ? (
                        <div className="p-4 border rounded-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="font-medium">
                              Analyzing waste image...
                            </span>
                          </div>
                          <Progress value={45} className="h-2" />
                        </div>
                      ) : analysisResult ? (
                        <div className="p-4 border rounded-md bg-muted/30">
                          <h4 className="font-medium mb-2 flex items-center">
                            <Info className="h-4 w-4 mr-2 text-primary" />
                            AI Analysis Results
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Detected Waste Type:
                              </p>
                              <div className="flex items-center">
                                <Badge className="mr-2">
                                  {analysisResult.wasteType.replace("_", " ")}
                                </Badge>
                                <div className="flex-1">
                                  <div className="h-2 rounded-full overflow-hidden bg-gray-200">
                                    <div
                                      className={`h-full ${getConfidenceColor(
                                        analysisResult.confidence
                                      )}`}
                                      style={{
                                        width: `${
                                          analysisResult.confidence * 100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-right">
                                    {Math.round(
                                      analysisResult.confidence * 100
                                    )}
                                    % confidence
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Estimated Quantity:
                              </p>
                              <div className="flex items-center">
                                <Badge variant="outline" className="mr-2">
                                  {analysisResult.quantity}
                                </Badge>
                                <div className="flex-1">
                                  <div className="h-2 rounded-full overflow-hidden bg-gray-200">
                                    <div
                                      className={`h-full ${getConfidenceColor(
                                        analysisResult.quantityConfidence
                                      )}`}
                                      style={{
                                        width: `${
                                          analysisResult.quantityConfidence *
                                          100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-right">
                                    {Math.round(
                                      analysisResult.quantityConfidence * 100
                                    )}
                                    % confidence
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <Input
                        type="file"
                        id="additional-images"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <label htmlFor="additional-images">
                        <Button
                          variant="outline"
                          type="button"
                          size="sm"
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload another image
                        </Button>
                      </label>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Location Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Cityville" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Waste Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="wasteType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            Waste Type
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 ml-1"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Waste Type Information
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <ul className="list-disc pl-5 space-y-2 pt-2">
                                      <li>
                                        <strong>General:</strong>{" "}
                                        {wasteTypeInfo.GENERAL}
                                      </li>
                                      <li>
                                        <strong>Recyclables:</strong>{" "}
                                        {wasteTypeInfo.RECYCLABLE}
                                      </li>
                                      <li>
                                        <strong>Organic:</strong>{" "}
                                        {wasteTypeInfo.ORGANIC}
                                      </li>
                                      <li>
                                        <strong>Hazardous:</strong>{" "}
                                        {wasteTypeInfo.HAZARDOUS}
                                      </li>
                                      <li>
                                        <strong>Electronic:</strong>{" "}
                                        {wasteTypeInfo.ELECTRONIC}
                                      </li>
                                      <li>
                                        <strong>Construction:</strong>{" "}
                                        {wasteTypeInfo.CONSTRUCTION}
                                      </li>
                                    </ul>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogAction>OK</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select waste type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="GENERAL">
                                General Waste
                              </SelectItem>
                              <SelectItem value="RECYCLABLE">
                                Recyclables
                              </SelectItem>
                              <SelectItem value="ORGANIC">
                                Organic Waste
                              </SelectItem>
                              <SelectItem value="HAZARDOUS">
                                Hazardous Waste
                              </SelectItem>
                              <SelectItem value="ELECTRONIC">
                                Electronic Waste
                              </SelectItem>
                              <SelectItem value="CONSTRUCTION">
                                Construction Waste
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select quantity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">
                                Small (1-2 bags)
                              </SelectItem>
                              <SelectItem value="medium">
                                Medium (3-5 bags)
                              </SelectItem>
                              <SelectItem value="large">
                                Large (6-10 bags)
                              </SelectItem>
                              <SelectItem value="extra">
                                Extra Large (10+ bags)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Schedule Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Select a date at least 24 hours from now
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">
                                Morning (8am - 12pm)
                              </SelectItem>
                              <SelectItem value="afternoon">
                                Afternoon (12pm - 4pm)
                              </SelectItem>
                              <SelectItem value="evening">
                                Evening (4pm - 8pm)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions or details about the waste or location..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    createPickupMutation.isPending ||
                    uploadedImages.length === 0
                  }
                >
                  {createPickupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : uploadedImages.length === 0 ? (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Upload an image to continue
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>

                {uploadedImages.length === 0 && (
                  <p className="text-center text-sm text-destructive">
                    Image of waste is required for processing your request
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequestPickup;
