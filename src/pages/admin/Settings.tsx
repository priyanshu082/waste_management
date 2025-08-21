import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  ChevronRight,
  Settings as SettingsIcon,
  Trash2,
  Inbox,
  Recycle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Schemas for form validation
const generalSettingsSchema = z.object({
  siteName: z.string().min(2, 'Site name is required'),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email('Invalid email address'),
  supportPhone: z.string().optional(),
  enableNotifications: z.boolean().default(true),
  enableUserRegistration: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  smsNotifications: z.boolean().default(false),
  notifyOnPickupRequest: z.boolean().default(true),
  notifyOnPickupComplete: z.boolean().default(true),
  notifyOnBinFull: z.boolean().default(true),
  adminEmailRecipients: z.string().optional(),
});

const recyclingSettingsSchema = z.object({
  enableRecyclingCenters: z.boolean().default(true),
  enableRewards: z.boolean().default(true),
  pointsPerRecycling: z.coerce.number().min(0),
  pointsPerComposting: z.coerce.number().min(0),
  pointsPerHazardous: z.coerce.number().min(0),
  rewardThreshold: z.coerce.number().min(0),
  autoApproveRequests: z.boolean().default(false),
});

const integrationSettingsSchema = z.object({
  mapApiKey: z.string().optional(),
  weatherApiKey: z.string().optional(),
  analyticsCode: z.string().optional(),
  enableCloudStorage: z.boolean().default(true),
  cloudStorageProvider: z.string().default('cloudinary'),
  cloudApiKey: z.string().optional(),
  cloudApiSecret: z.string().optional(),
  cloudName: z.string().optional(),
});

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });
  
  const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: settings?.general?.siteName || 'Smart Waste Management',
      siteDescription: settings?.general?.siteDescription || 'Efficient waste collection and recycling platform',
      contactEmail: settings?.general?.contactEmail || 'contact@smartwaste.com',
      supportPhone: settings?.general?.supportPhone || '(555) 123-4567',
      enableNotifications: settings?.general?.enableNotifications ?? true,
      enableUserRegistration: settings?.general?.enableUserRegistration ?? true,
      maintenanceMode: settings?.general?.maintenanceMode ?? false,
    },
  });
  
  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: settings?.notifications?.emailNotifications ?? true,
      pushNotifications: settings?.notifications?.pushNotifications ?? false,
      smsNotifications: settings?.notifications?.smsNotifications ?? false,
      notifyOnPickupRequest: settings?.notifications?.notifyOnPickupRequest ?? true,
      notifyOnPickupComplete: settings?.notifications?.notifyOnPickupComplete ?? true,
      notifyOnBinFull: settings?.notifications?.notifyOnBinFull ?? true,
      adminEmailRecipients: settings?.notifications?.adminEmailRecipients || 'admin@smartwaste.com',
    },
  });
  
  const recyclingForm = useForm<z.infer<typeof recyclingSettingsSchema>>({
    resolver: zodResolver(recyclingSettingsSchema),
    defaultValues: {
      enableRecyclingCenters: settings?.recycling?.enableRecyclingCenters ?? true,
      enableRewards: settings?.recycling?.enableRewards ?? true,
      pointsPerRecycling: settings?.recycling?.pointsPerRecycling || 10,
      pointsPerComposting: settings?.recycling?.pointsPerComposting || 5,
      pointsPerHazardous: settings?.recycling?.pointsPerHazardous || 15,
      rewardThreshold: settings?.recycling?.rewardThreshold || 100,
      autoApproveRequests: settings?.recycling?.autoApproveRequests ?? false,
    },
  });
  
  const integrationForm = useForm<z.infer<typeof integrationSettingsSchema>>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: {
      mapApiKey: settings?.integrations?.mapApiKey || '',
      weatherApiKey: settings?.integrations?.weatherApiKey || '',
      analyticsCode: settings?.integrations?.analyticsCode || '',
      enableCloudStorage: settings?.integrations?.enableCloudStorage ?? true,
      cloudStorageProvider: settings?.integrations?.cloudStorageProvider || 'cloudinary',
      cloudApiKey: settings?.integrations?.cloudApiKey || '',
      cloudApiSecret: settings?.integrations?.cloudApiSecret || '',
      cloudName: settings?.integrations?.cloudName || '',
    },
  });
  
  const handleResetSettings = () => {
    if (window.confirm('This will reset all settings to default values. Continue?')) {
      generalForm.reset();
      notificationForm.reset();
      recyclingForm.reset();
      integrationForm.reset();
      
      toast({
        title: 'Settings Reset',
        description: 'All settings have been reset to default values.',
      });
    }
  };
  
  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    
    try {
      const [generalValid, notificationsValid, recyclingValid, integrationsValid] = await Promise.all([
        generalForm.trigger(),
        notificationForm.trigger(),
        recyclingForm.trigger(),
        integrationForm.trigger(),
      ]);
      
      if (generalValid && notificationsValid && recyclingValid && integrationsValid) {
        const allSettings = {
          general: generalForm.getValues(),
          notifications: notificationForm.getValues(),
          recycling: recyclingForm.getValues(),
          integrations: integrationForm.getValues(),
        };
        
        await updateSettingsMutation.mutateAsync(allSettings);
      } else {
        toast({
          title: 'Validation Error',
          description: 'Please check all tabs for validation errors.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure and customize the waste management platform
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <Button 
            onClick={handleSaveAllSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Settings
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="recycling">Recycling & Rewards</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic system settings and functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="supportPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="siteDescription"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Site Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3}
                              placeholder="Describe your waste management platform"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">System Options</h3>
                    
                    <FormField
                      control={generalForm.control}
                      name="enableNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Enable Notifications</FormLabel>
                            <FormDescription>
                              Allow the system to send notifications to users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="enableUserRegistration"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Enable User Registration</FormLabel>
                            <FormDescription>
                              Allow new users to register for accounts
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                          <div>
                            <FormLabel>Maintenance Mode</FormLabel>
                            <FormDescription>
                              Put the site in maintenance mode (only admins can access)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="advanced">
                      <AccordionTrigger>Advanced Settings</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-muted-foreground text-sm">
                            These settings should only be changed by system administrators with technical knowledge.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-md">
                              <h4 className="font-medium">Database Backup</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                Create a backup of the system database
                              </p>
                              <Button variant="outline" size="sm">
                                Generate Backup
                              </Button>
                            </div>
                            
                            <div className="p-4 border rounded-md">
                              <h4 className="font-medium">Clear Cache</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                Clear system caches to resolve issues
                              </p>
                              <Button variant="outline" size="sm">
                                Clear Cache
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Channels</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Email Notifications</FormLabel>
                            <FormDescription>
                              Send notifications via email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="pushNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Push Notifications</FormLabel>
                            <FormDescription>
                              Send notifications to browser and mobile devices
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="smsNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>SMS Notifications</FormLabel>
                            <FormDescription>
                              Send notifications via text message
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Events</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="notifyOnPickupRequest"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Pickup Request Notifications</FormLabel>
                            <FormDescription>
                              Notify when a new pickup request is created
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="notifyOnPickupComplete"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Pickup Completion Notifications</FormLabel>
                            <FormDescription>
                              Notify when a pickup is completed
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="notifyOnBinFull"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Bin Status Notifications</FormLabel>
                            <FormDescription>
                              Notify when bins reach capacity threshold
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recipients</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="adminEmailRecipients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email Recipients</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter email addresses, separated by commas"
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            These email addresses will receive administrative notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="templates">
                      <AccordionTrigger>Notification Templates</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-muted-foreground text-sm">
                            Customize the templates used for different types of notifications.
                          </p>
                          
                          <div className="grid gap-4">
                            <div className="p-4 border rounded-md">
                              <h4 className="font-medium">Pickup Request Template</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Template for new pickup request notifications
                              </p>
                              <Button variant="outline" size="sm">
                                Edit Template
                              </Button>
                            </div>
                            
                            <div className="p-4 border rounded-md">
                              <h4 className="font-medium">Pickup Completion Template</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Template for pickup completion notifications
                              </p>
                              <Button variant="outline" size="sm">
                                Edit Template
                              </Button>
                            </div>
                            
                            <div className="p-4 border rounded-md">
                              <h4 className="font-medium">Bin Status Template</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Template for bin status alert notifications
                              </p>
                              <Button variant="outline" size="sm">
                                Edit Template
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recycling">
          <Card>
            <CardHeader>
              <CardTitle>Recycling & Rewards Settings</CardTitle>
              <CardDescription>
                Configure recycling options and reward point system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...recyclingForm}>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Feature Toggles</h3>
                    
                    <FormField
                      control={recyclingForm.control}
                      name="enableRecyclingCenters"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Enable Recycling Centers</FormLabel>
                            <FormDescription>
                              Show recycling center locations and information
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recyclingForm.control}
                      name="enableRewards"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Enable Rewards Program</FormLabel>
                            <FormDescription>
                              Allow users to earn points for responsible waste management
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recyclingForm.control}
                      name="autoApproveRequests"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Auto-Approve Requests</FormLabel>
                            <FormDescription>
                              Automatically approve pickup requests without admin review
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Points Configuration</h3>
                    
                    <FormField
                      control={recyclingForm.control}
                      name="pointsPerRecycling"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points per Recycling Pickup</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                            />
                          </FormControl>
                          <FormDescription>
                            Points awarded for recycling waste pickups
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recyclingForm.control}
                      name="pointsPerComposting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points per Organic Waste</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                            />
                          </FormControl>
                          <FormDescription>
                            Points awarded for organic waste pickups
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recyclingForm.control}
                      name="pointsPerHazardous"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points per Hazardous Waste</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                            />
                          </FormControl>
                          <FormDescription>
                            Points awarded for hazardous waste pickups
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recyclingForm.control}
                      name="rewardThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Threshold</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum points required to redeem rewards
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="rewards">
                      <AccordionTrigger>Available Rewards</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-muted-foreground text-sm">
                            Configure rewards that users can redeem with their points.
                          </p>
                          
                          <div className="grid gap-4">
                            <div className="p-4 border rounded-md flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Recycle className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Recycling Bag Pack</h4>
                                  <p className="text-sm text-muted-foreground">100 points</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">Edit</Button>
                            </div>
                            
                            <div className="p-4 border rounded-md flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Trash2 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Premium Pickup</h4>
                                  <p className="text-sm text-muted-foreground">150 points</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">Edit</Button>
                            </div>
                            
                            <div className="p-4 border rounded-md flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Recycle className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Community Garden Donation</h4>
                                  <p className="text-sm text-muted-foreground">200 points</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">Edit</Button>
                            </div>
                            
                            <Button className="mt-2">
                              <div className="bg-primary/10 p-1 rounded-full mr-2">
                                <Inbox className="h-4 w-4 text-primary" />
                              </div>
                              Add New Reward
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure third-party services and API integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...integrationForm}>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">API Keys</h3>
                    
                    <FormField
                      control={integrationForm.control}
                      name="mapApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Map API Key</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormDescription>
                            API key for map integration (MapBox, Google Maps, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={integrationForm.control}
                      name="weatherApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weather API Key (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormDescription>
                            API key for weather service (if used)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={integrationForm.control}
                      name="analyticsCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Analytics Tracking Code</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Paste tracking code here"
                            />
                          </FormControl>
                          <FormDescription>
                            Analytics tracking code (Google Analytics, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cloud Storage</h3>
                    
                    <FormField
                      control={integrationForm.control}
                      name="enableCloudStorage"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Enable Cloud Storage</FormLabel>
                            <FormDescription>
                              Store uploaded files in the cloud
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={integrationForm.control}
                      name="cloudStorageProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Provider</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cloudinary">Cloudinary</SelectItem>
                              <SelectItem value="aws">Amazon S3</SelectItem>
                              <SelectItem value="google">Google Cloud Storage</SelectItem>
                              <SelectItem value="azure">Azure Blob Storage</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose your cloud storage provider
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={integrationForm.control}
                      name="cloudApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cloud API Key</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={integrationForm.control}
                      name="cloudApiSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cloud API Secret</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={integrationForm.control}
                      name="cloudName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cloud Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Name of your cloud account/bucket
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="ai">
                      <AccordionTrigger>AI Integration</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-muted-foreground text-sm mb-4">
                            Configure AI integration for waste identification and processing.
                          </p>
                          
                          <div className="grid gap-4">
                            <div className="p-4 border rounded-md flex items-center justify-between">
                              <div className="flex flex-col">
                                <FormLabel>AI Waste Detection API</FormLabel>
                                <p className="text-sm text-muted-foreground">API endpoint for waste type detection</p>
                              </div>
                              <Input className="w-1/2" placeholder="https://api.example.com/waste-detection" />
                            </div>
                            
                            <div className="p-4 border rounded-md flex items-center justify-between">
                              <div className="flex flex-col">
                                <FormLabel>AI Quantity Estimation API</FormLabel>
                                <p className="text-sm text-muted-foreground">API endpoint for waste quantity estimation</p>
                              </div>
                              <Input className="w-1/2" placeholder="https://api.example.com/quantity-estimation" />
                            </div>
                            
                            <div className="p-4 border rounded-md flex items-center justify-between">
                              <div className="flex flex-col">
                                <FormLabel>AI Model Confidence Threshold</FormLabel>
                                <p className="text-sm text-muted-foreground">Minimum confidence score to accept AI results</p>
                              </div>
                              <Input className="w-1/2" type="number" min="0" max="1" step="0.01" defaultValue="0.7" />
                            </div>
                            
                            <div className="p-4 border rounded-md flex items-center justify-between">
                              <div className="flex flex-col">
                                <FormLabel>OpenAI API Key</FormLabel>
                                <p className="text-sm text-muted-foreground">API key for OpenAI integration</p>
                              </div>
                              <Input className="w-1/2" type="password" placeholder="sk-..." />
                            </div>
                          </div>
                          
                          <Button variant="outline" className="w-full mt-4">
                            <RotateCcw className="h-4 w-4 mr-2" /> Test AI Integration
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
