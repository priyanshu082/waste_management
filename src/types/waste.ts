
export type WasteType = 'GENERAL' | 'RECYCLABLE' | 'ORGANIC' | 'HAZARDOUS' | 'ELECTRONIC' | 'CONSTRUCTION';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'COMPLETED' | 'REJECTED';

export type BinStatusType = 'NORMAL' | 'FULL' | 'MAINTENANCE' | 'OFFLINE';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface PickupRequest {
  id: string;
  address: string;
  wasteType: WasteType;
  notes?: string;
  imageUrl?: string;
  status: RequestStatus;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  rejectionReason?: string;
}

export interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  wasteTypes: WasteType[];
  createdAt: string;
  updatedAt: string;
}

export interface BinStatus {
  id: string;
  binId: string;
  location: string;
  fullnessLevel: number;
  lastUpdated: string;
  status: BinStatusType;
  latitude: number;
  longitude: number;
}

export interface CollectionSchedule {
  id: string;
  area: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  wasteTypes: WasteType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
