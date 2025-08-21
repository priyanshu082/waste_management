import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Trash2, Recycle } from "lucide-react";
import { WasteType } from "@/types/waste";

// Fix Leaflet icon issues in React
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Define the RecyclingCenter interface
interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  wasteTypes: WasteType[];
}

// FlyToLocation component to center map on a specific location
const FlyToLocation = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
};

const RecyclingCenters = () => {
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<RecyclingCenter | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    27.8974, 78.088,
  ]); // Aligarh coordinates

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/recycling-centers/centers"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch recycling centers");
        }

        const data = await response.json();
        // Ensure wasteTypes is properly cast to WasteType[]
        const formattedCenters = data.centers.map((center: any) => ({
          ...center,
          wasteTypes: center.wasteTypes.map(
            (type: string) => type as WasteType
          ),
        }));

        setCenters(formattedCenters);
      } catch (error) {
        console.error("Error fetching centers:", error);
        // Fallback data for Aligarh
        setCenters([
          {
            id: "1",
            name: "Aligarh Municipal Recycling Center",
            address: "Civil Lines, Aligarh, Uttar Pradesh",
            latitude: 27.8974,
            longitude: 78.088,
            wasteTypes: [
              "RECYCLABLE",
              "ELECTRONIC",
              "HAZARDOUS",
            ] as WasteType[],
          },
          {
            id: "2",
            name: "Gandhi Park Waste Collection",
            address: "Gandhi Park, Aligarh, Uttar Pradesh",
            latitude: 27.8845,
            longitude: 78.0705,
            wasteTypes: ["GENERAL", "RECYCLABLE", "ORGANIC"] as WasteType[],
          },
          {
            id: "3",
            name: "AMU Campus Eco Hub",
            address: "Aligarh Muslim University, Aligarh",
            latitude: 27.9154,
            longitude: 78.0681,
            wasteTypes: ["RECYCLABLE", "ORGANIC"] as WasteType[],
          },
          {
            id: "4",
            name: "Ramghat Road Collection Point",
            address: "Ramghat Road, Aligarh, Uttar Pradesh",
            latitude: 27.8851,
            longitude: 78.0992,
            wasteTypes: ["GENERAL", "CONSTRUCTION"] as WasteType[],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCenters();
  }, []);

  const handleCenterClick = (center: RecyclingCenter) => {
    setSelectedCenter(center);
    setMapCenter([center.latitude, center.longitude]);
  };

  const getWasteTypeBadgeColor = (type: WasteType) => {
    switch (type) {
      case "RECYCLABLE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "HAZARDOUS":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "ELECTRONIC":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ORGANIC":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "GENERAL":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "CONSTRUCTION":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading recycling centers...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Recycling Centers</h1>
        <p className="text-muted-foreground">
          Find recycling and waste collection centers near you
        </p>
      </div>

      <Tabs defaultValue="map" className="h-[calc(100%-80px)]">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{
                  height: "100%",
                  width: "100%",
                  borderRadius: "inherit",
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <FlyToLocation center={mapCenter} />

                {centers.map((center) => (
                  <Marker
                    key={center.id}
                    position={[center.latitude, center.longitude]}
                    eventHandlers={{
                      click: () => {
                        setSelectedCenter(center);
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-semibold">{center.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {center.address}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {center.wasteTypes.map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className={getWasteTypeBadgeColor(type)}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`,
                              "_blank"
                            )
                          }
                        >
                          Get Directions
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="h-full overflow-y-auto space-y-4">
          {centers.map((center) => (
            <Card
              key={center.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleCenterClick(center)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{center.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {center.address}
                    </CardDescription>
                  </div>
                  <Avatar className="h-10 w-10 bg-primary/10">
                    <Recycle className="h-5 w-5 text-primary" />
                  </Avatar>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {center.wasteTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className={getWasteTypeBadgeColor(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`,
                      "_blank"
                    );
                  }}
                >
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecyclingCenters;
