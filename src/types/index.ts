export interface User {
  id: string;
  companyName: string;
  name: string;
  email: string;
  password: string;
  role: 'Company Admin' | 'Viewer' | 'Editor' | 'Super Admin';
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Video {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  addedAt: string;
}

export interface ViewRecord {
  date: string;
  views: number;
  growth: number;
}

export interface TrackedVideo extends Video {
  viewHistory: ViewRecord[];
}

export interface CompanyData {
  companyId: string;
  companyName: string;
  videos: TrackedVideo[];
}

export type Role = 'Super Admin' | 'Company Admin' | 'Viewer' | 'Editor';
