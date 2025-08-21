import React, { createContext, useContext, useState, useEffect } from "react";
import {
  PickupRequest,
  RequestStatus,
  BinStatusType as BinStatusEnum,
  BinStatus as BinStatusType,
  WasteType,
  CollectionSchedule,
} from "@/types/waste";

// Base API URL
const API_BASE_URL = "http://localhost:5000/api";

// Extended AuthContextType with all needed properties
type AuthContextType = {
  user: any;
  token: string | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUserData: () => void;
  isAdmin: boolean;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  getPickupRequests: (
    status?: RequestStatus | "ALL"
  ) => Promise<PickupRequest[]>;
  updatePickupStatus: (data: {
    id: string;
    status: RequestStatus;
    scheduledDate?: string;
    rejectionReason?: string;
  }) => Promise<void>;
  cancelPickupRequest: (id: string) => Promise<void>;
  createPickup: (formData: FormData) => Promise<any>;
  getBinStatuses: () => Promise<BinStatusType[]>;
  simulateBinUpdates: () => Promise<any>;
  updateBinStatus: (params: {
    binId: string;
    fullnessLevel: number;
    status: BinStatusEnum;
  }) => Promise<any>;
  getCollectionSchedules: () => Promise<CollectionSchedule[]>;
  createCollectionSchedule: (scheduleData: {
    area: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    wasteTypes: WasteType[];
    isActive: boolean;
  }) => Promise<any>;
  updateCollectionSchedule: (
    id: string,
    data: {
      area: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      wasteTypes: WasteType[];
      isActive: boolean;
    }
  ) => Promise<any>;
  deleteCollectionSchedule: (id: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  refreshUserData: () => {},
  isAdmin: false,
  loading: false,
  register: async () => {},
  getPickupRequests: async () => [],
  updatePickupStatus: async () => {},
  cancelPickupRequest: async () => {},
  createPickup: async () => ({}),
  getBinStatuses: async (): Promise<BinStatusType[]> => [],
  simulateBinUpdates: async () => ({}),
  updateBinStatus: async () => ({}),

  // Corrected collection schedule methods
  getCollectionSchedules: async (): Promise<CollectionSchedule[]> => [],
  createCollectionSchedule: async (_scheduleData: {
    area: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    wasteTypes: WasteType[];
    isActive: boolean;
  }): Promise<any> => ({}),
  updateCollectionSchedule: async (
    _id: string,
    _data: {
      area: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      wasteTypes: WasteType[];
      isActive: boolean;
    }
  ): Promise<any> => ({}),
  deleteCollectionSchedule: async (_id: string): Promise<any> => ({}),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("waste_token")
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists and fetch user data if it does
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Token is invalid, clear it
        logout();
      }
    } catch (error) {
      console.error("Error fetching user data", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken: string, userData: any) => {
    if (!newToken) {
      console.error("Attempted to login with null/undefined token");
      return;
    }
    localStorage.setItem("waste_token", newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("waste_token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUserData = () => {
    fetchUserData();
  };

  // Register function implementation
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      if (data.token) {
        login(data.token, data.user);
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Get pickup requests implementation
  const getPickupRequests = async (
    status: RequestStatus | "ALL" = "ALL"
  ): Promise<PickupRequest[]> => {
    if (!token) throw new Error("Not authenticated");

    try {
      const url =
        status === "ALL"
          ? `${API_BASE_URL}/pickup-requests/`
          : `${API_BASE_URL}/pickup-requests?status=${status}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pickup requests");
      }

      const data = await response.json();
      return data.requests;
    } catch (error) {
      console.error("Error fetching pickup requests:", error);
      throw error;
    }
  };

  // Update pickup status implementation
  const updatePickupStatus = async (data: {
    id: string;
    status: RequestStatus;
    scheduledDate?: string;
    rejectionReason?: string;
  }): Promise<void> => {
    if (!token) throw new Error("Not authenticated");

    try {
      const response = await fetch(
        `${API_BASE_URL}/pickup-requests/${data.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update pickup status");
      }
    } catch (error) {
      console.error("Error updating pickup status:", error);
      throw error;
    }
  };

  // Cancel pickup request implementation
  const cancelPickupRequest = async (id: string): Promise<void> => {
    if (!token) throw new Error("Not authenticated");

    try {
      const response = await fetch(`${API_BASE_URL}/pickup-requests/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel pickup request");
      }
    } catch (error) {
      console.error("Error cancelling pickup request:", error);
      throw error;
    }
  };

  // Create pickup request implementation
  const createPickup = async (formData: FormData): Promise<any> => {
    if (!token) throw new Error("Not authenticated");

    try {
      const response = await fetch(`${API_BASE_URL}/pickup-requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create pickup request");
      }

      return response.json();
    } catch (error) {
      console.error("Error creating pickup request:", error);
      throw error;
    }
  };
  const getBinStatuses = async (): Promise<BinStatusType[]> => {
    const token = localStorage.getItem("waste_token");
    if (!token) throw new Error("User is not authenticated");

    const response = await fetch(`${API_BASE_URL}/bin-status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bin statuses");
    }

    const data = await response.json();
    return data.bins as BinStatusType[];
  };

  const simulateBinUpdates = async (): Promise<any> => {
    const token = localStorage.getItem("waste_token");
    if (!token) throw new Error("User is not authenticated");

    const response = await fetch(`${API_BASE_URL}/bin-status/simulate-update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to simulate bin updates");
    }

    return response.json();
  };

  const updateBinStatus = async ({
    binId,
    fullnessLevel,
    status,
  }: {
    binId: string;
    fullnessLevel: number;
    status: BinStatusEnum;
  }): Promise<any> => {
    const token = localStorage.getItem("waste_token");
    if (!token) throw new Error("User is not authenticated");

    const response = await fetch(`${API_BASE_URL}/bin-status/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ binId, fullnessLevel, status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update bin status");
    }

    return response.json();
  };

  const getCollectionSchedules = async (): Promise<CollectionSchedule[]> => {
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/schedules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch collection schedules");
    }

    const data = await response.json();
    return data.schedules as CollectionSchedule[];
  };

  const createCollectionSchedule = async (scheduleData: {
    area: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    wasteTypes: WasteType[];
    isActive: boolean;
  }): Promise<any> => {
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(scheduleData),
    });

    if (!response.ok) {
      throw new Error("Failed to create schedule");
    }

    return response.json();
  };

  const updateCollectionSchedule = async (
    id: string,
    data: {
      area: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      wasteTypes: WasteType[];
      isActive: boolean;
    }
  ): Promise<any> => {
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update schedule");
    }

    return response.json();
  };

  const deleteCollectionSchedule = async (id: string): Promise<any> => {
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete schedule");
    }

    return response.json();
  };

  // Check if user is admin
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        refreshUserData,
        isAdmin,
        loading,
        register,
        getPickupRequests,
        updatePickupStatus,
        cancelPickupRequest,
        createPickup,
        getBinStatuses,
        updateBinStatus,
        simulateBinUpdates,
        getCollectionSchedules,
        createCollectionSchedule,
        updateCollectionSchedule,
        deleteCollectionSchedule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
