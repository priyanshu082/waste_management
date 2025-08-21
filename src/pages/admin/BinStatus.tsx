
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, MapPin, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BinStatus as BinStatusType, BinStatusType as BinStatusEnum } from '@/types/waste';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useAuth } from '@/contexts/AuthContext';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [28, 77]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BinStatusMonitoring = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch all bin statuses
  const { getBinStatuses, simulateBinUpdates, updateBinStatus } = useAuth();

  const { data: bins, isLoading } = useQuery({
    queryKey: ['binStatuses'],
    queryFn: getBinStatuses
  });
  
  const simulateUpdatesMutation = useMutation({
    mutationFn: simulateBinUpdates,
    onSuccess: (data) => {
      toast({
        title: "Updates Simulated",
        description: `Successfully updated ${data.updatedCount} bins.`,
      });
      queryClient.invalidateQueries({ queryKey: ['binStatuses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to simulate updates",
        variant: "destructive"
      });
    }
  });
  
  const updateBinStatusMutation = useMutation({
    mutationFn: updateBinStatus,
    onSuccess: () => {
      toast({
        title: "Bin Updated",
        description: "Bin status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['binStatuses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update bin",
        variant: "destructive"
      });
    }
  });
  
  const filteredBins = bins?.filter(bin => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      bin.binId.toLowerCase().includes(searchLower) ||
      bin.location.toLowerCase().includes(searchLower)
    );
  });

  const getBinStatusColor = (status: BinStatusEnum) => {
    switch (status) {
      case 'NORMAL': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'FULL': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getFullnessProgressColor = (level: number) => {
    if (level < 50) return 'bg-green-500';
    if (level < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMarkerColor = (bin: BinStatusType) => {
    switch (bin.status) {
      case 'NORMAL': 
        return bin.fullnessLevel > 75 ? '#FFA500' : '#00FF00';
      case 'FULL': 
        return '#FF0000';
      case 'MAINTENANCE': 
        return '#FFFF00';
      case 'OFFLINE': 
        return '#808080';
    }
  };

  const handleSimulateUpdates = () => {
    simulateUpdatesMutation.mutate();
  };

  const handleUpdateBin = (bin: BinStatusType, newFullnessLevel: number, newStatus: BinStatusEnum) => {
    updateBinStatusMutation.mutate({
      binId: bin.binId,
      fullnessLevel: newFullnessLevel,
      status: newStatus
    });
  };

  const calculateDashboardStats = () => {
    if (!bins) return { totalBins: 0, fullBins: 0, maintenanceBins: 0, offlineBins: 0, averageFullness: 0 };
    
    const totalBins = bins.length;
    const fullBins = bins.filter(bin => bin.status === 'FULL').length;
    const maintenanceBins = bins.filter(bin => bin.status === 'MAINTENANCE').length;
    const offlineBins = bins.filter(bin => bin.status === 'OFFLINE').length;
    const averageFullness = Math.round(bins.reduce((acc, bin) => acc + bin.fullnessLevel, 0) / totalBins);
    
    return { totalBins, fullBins, maintenanceBins, offlineBins, averageFullness };
  };

  const stats = calculateDashboardStats();

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bin Status Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of smart waste bins
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bins by ID or location..."
              className="pl-10 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleSimulateUpdates} 
            disabled={simulateUpdatesMutation.isPending}
          >
            {simulateUpdatesMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Simulate Updates
          </Button>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Trash2 className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">{stats.totalBins}</div>
              <p className="text-muted-foreground">Total Bins</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
              <div className="text-2xl font-bold">{stats.fullBins}</div>
              <p className="text-muted-foreground">Bins Almost Full</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 bg-yellow-500 rounded-full p-2">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold">{stats.maintenanceBins}</div>
              <p className="text-muted-foreground">Bins in Maintenance</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-2xl font-bold">
                <span>{stats.averageFullness}</span>
                <span className="text-lg text-muted-foreground">%</span>
              </div>
              <Progress value={stats.averageFullness} className="h-2 w-full mt-2 mb-2" />
              <p className="text-muted-foreground">Average Fullness</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Map and Bins List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {/* Map */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg">Bin Locations</CardTitle>
            <CardDescription>
              Map showing all monitored waste bins and their statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-4rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bins && bins.length > 0 ? (
              <MapContainer
                center={[bins[0].latitude, bins[0].longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {bins.map((bin) => (
                  <CircleMarker 
                    key={bin.id}
                    center={[bin.latitude, bin.longitude]}
                    radius={10}
                    pathOptions={{ 
                      fillColor: getMarkerColor(bin),
                      color: '#fff',
                      weight: 1,
                      fillOpacity: 0.8
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-semibold">{bin.binId}</h3>
                        <p className="text-sm">{bin.location}</p>
                        <div className="mt-1 text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Fullness:</span>
                            <span className="font-medium">{bin.fullnessLevel}%</span>
                          </div>
                          <Progress value={bin.fullnessLevel} className="h-2" />
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <Badge className={getBinStatusColor(bin.status)}>
                            {bin.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Updated: {new Date(bin.lastUpdated).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No bin data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Bin List */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg">Bin Status List</CardTitle>
            <CardDescription>
              Detailed status of all waste bins
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 h-[calc(100%-4rem)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBins && filteredBins.length > 0 ? (
              <div className="space-y-2">
                {filteredBins.map((bin) => (
                  <Card key={bin.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{bin.binId}</h3>
                          <p className="text-sm text-muted-foreground">{bin.location}</p>
                        </div>
                        <Badge className={getBinStatusColor(bin.status)}>
                          {bin.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Fullness Level</span>
                          <span className="text-sm font-medium">{bin.fullnessLevel}%</span>
                        </div>
                        <Progress 
                          value={bin.fullnessLevel} 
                          className={`h-2 ${getFullnessProgressColor(bin.fullnessLevel)}`}
                        />
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Last updated: {new Date(bin.lastUpdated).toLocaleString()}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex justify-between">
                        <Select 
                          defaultValue={bin.status}
                          onValueChange={(value) => handleUpdateBin(bin, bin.fullnessLevel, value as BinStatusEnum)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NORMAL">Normal</SelectItem>
                            <SelectItem value="FULL">Full</SelectItem>
                            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                            <SelectItem value="OFFLINE">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          defaultValue={bin.fullnessLevel}
                          className="w-24"
                          onBlur={(e) => {
                            const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            if (value !== bin.fullnessLevel) {
                              handleUpdateBin(bin, value, bin.status);
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No bins found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BinStatusMonitoring;
