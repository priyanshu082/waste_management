import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Trash2, Recycle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WasteType } from "@/types/waste";
import { useToast } from "@/hooks/use-toast";

interface WasteSuggestion {
  type: WasteType;
  instructions: string;
  additionalInfo: string;
}

const WasteGuide = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  // Fetch waste suggestion from backend
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["wasteGuide", query],
    queryFn: async () => {
      if (!query) return null;

      const response = await fetch(
        `http://localhost:5000/api/recycling-centers/waste-guide?item=${encodeURIComponent(
          query
        )}`
      );
      if (!response.ok) {
        throw new Error("Failed to get waste suggestion");
      }
      const data = await response.json();
      return data;
    },
    enabled: !!query,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setQuery(searchTerm.trim());
    }
  };

  const getTypeColor = (type: WasteType) => {
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

  // Sample common waste items for quick search
  const commonItems = [
    "Plastic bottle",
    "Cardboard",
    "Battery",
    "Banana peel",
    "Electronics",
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">AI Waste Guide</h1>
        <p className="text-muted-foreground">
          Get AI-powered suggestions for proper waste disposal
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Search for an item</CardTitle>
          <CardDescription>
            Enter any waste item to get guidance on how to properly dispose of
            it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="E.g., plastic bottle, battery, etc."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </form>

          <div className="mt-4">
            <p className="text-sm mb-2">Common items:</p>
            <div className="flex flex-wrap gap-2">
              {commonItems.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => {
                    setSearchTerm(item);
                    setQuery(item);
                  }}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.suggestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Disposal Guide for: {data.query}</CardTitle>
              <Badge className={getTypeColor(data.suggestion.type)}>
                {data.suggestion.type.toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Recycle className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-semibold">Instructions</h3>
                <p>{data.suggestion.instructions}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-semibold">Additional Information</h3>
                <p>{data.suggestion.additionalInfo}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Note: Waste disposal guidelines may vary by location. Always check
              with your local waste management authority for specific
              instructions.
            </p>
          </CardFooter>
        </Card>
      )}

      {query && !isLoading && !data?.suggestion && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6 flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-yellow-600" />
            <div>
              <h3 className="font-semibold">Item Not Found</h3>
              <p className="text-muted-foreground">
                We couldn't find specific guidance for "{query}". Try a more
                general term or check with your local waste management
                authority.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WasteGuide;
