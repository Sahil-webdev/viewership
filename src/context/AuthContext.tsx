import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { User, TrackedVideo, ViewRecord } from '../types/index';

interface AuthContextType {
  user: User | null;
  isSuperAdmin: boolean;
  companies: User[];
  setCompanies: React.Dispatch<React.SetStateAction<User[]>>;
  loginSuperAdmin: (email: string, password: string) => Promise<boolean>;
  loginCompany: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createCompanyAccess: (companyData: {
    companyName: string; name: string; email: string; password: string; role: string; status: string;
  }) => Promise<void>;
  updateCompany: (id: string, updates: Partial<{ company_name: string; name: string; email: string; role: string; status: string }>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addVideosForCompany: (urls: string[]) => Promise<void>;
  addChannelForCompany: (channelUrl: string, maxVideos?: number) => Promise<void>;
  addInstagramAccountForCompany: (accountUrl: string, maxVideos?: number) => Promise<void>;
  clearAllCompanyVideos: () => Promise<{ deleted: number }>;
  trackViews: () => Promise<void>;
  getCurrentCompanyVideos: () => TrackedVideo[];
  videos: TrackedVideo[];
  setVideos: React.Dispatch<React.SetStateAction<TrackedVideo[]>>;
  updateViewHistory: (videoId: string, newHistory: ViewRecord[]) => void;
  exportToCSV: (data: any[], filename: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<User[]>([]);
  const [videos, setVideos] = useState<TrackedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        setUser(mapUser(me));
        if (!me.is_super_admin) {
          loadCompanyData();
        } else {
          loadCompanies();
        }
      } catch {
        api.logout();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const loadCompanyData = async () => {
    try {
      const myVideos = await api.getMyVideos();
      setVideos(myVideos.map((v: any) => mapVideo(v)));
    } catch (err) {
      console.error('Failed to load videos', err);
    }
  };

  const loadCompanies = async () => {
    try {
      const comps = await api.getAllCompanies();
      setCompanies(comps.map(mapUser));
    } catch (err) {
      console.error('Failed to load companies', err);
    }
  };

  const loginSuperAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      await api.login({ email, password });
      const me = await api.getMe();
      if (!me.is_super_admin) return false;
      setUser(mapUser(me));
      await loadCompanies();
      return true;
    } catch {
      return false;
    }
  };

  const loginCompany = async (email: string, password: string): Promise<boolean> => {
    try {
      await api.login({ email, password });
      const me = await api.getMe();
      if (me.is_super_admin) return false;
      setUser(mapUser(me));
      await loadCompanyData();
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setCompanies([]);
    setVideos([]);
  };

  const createCompanyAccess = async (companyData: {
    companyName: string; name: string; email: string; password: string; role: string; status: string;
  }) => {
    await api.createCompany({
      company_name: companyData.companyName,
      name: companyData.name,
      email: companyData.email,
      password: companyData.password,
      role: companyData.role,
      status: companyData.status,
    });
    await loadCompanies();
  };

  const updateCompany = async (id: string, updates: Partial<{ company_name: string; name: string; email: string; role: string; status: string }>) => {
    await api.updateCompany(id, updates as Record<string, string>);
    await loadCompanies();
  };

  const deleteCompany = async (id: string) => {
    await api.deleteCompany(id);
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const addVideosForCompany = async (urls: string[]) => {
    await api.addVideos(urls);
    await loadCompanyData();
  };

  const addChannelForCompany = async (channelUrl: string, maxVideos: number = 20) => {
    await api.addChannelVideos(channelUrl, maxVideos);
    await loadCompanyData();
  };

  const addInstagramAccountForCompany = async (accountUrl: string, maxVideos: number = 20) => {
    await api.addInstagramAccountVideos(accountUrl, maxVideos);
    await loadCompanyData();
  };

  const trackViews = async () => {
    await api.trackViews();
    await loadCompanyData();
  };

  const clearAllCompanyVideos = async () => {
    const result = await api.clearAllMyVideos();
    await loadCompanyData();
    return { deleted: result.deleted || 0 };
  };

  const getCurrentCompanyVideos = (): TrackedVideo[] => {
    return videos;
  };

  const updateViewHistory = (_videoId: string, _newHistory: ViewRecord[]) => {
    loadCompanyData();
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const val = row[header];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const isSuperAdmin = user?.role === 'Super Admin' || (user as any)?.is_super_admin === true;

  return (
    <AuthContext.Provider value={{
      user, isSuperAdmin, companies, setCompanies,
      loginSuperAdmin, loginCompany, logout,
      createCompanyAccess, updateCompany, deleteCompany,
      addVideosForCompany, addChannelForCompany, addInstagramAccountForCompany, clearAllCompanyVideos, trackViews, getCurrentCompanyVideos, videos, setVideos,
      updateViewHistory, exportToCSV, isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

function mapUser(data: any): User {
  return {
    id: data.id,
    companyName: data.company_name,
    name: data.name,
    email: data.email,
    password: '',
    role: data.role,
    status: data.status,
    createdAt: new Date(data.created_at).toISOString().split('T')[0],
  };
}

function mapVideo(data: any): TrackedVideo {
  return {
    id: data.id,
    url: data.url,
    title: data.title,
    thumbnail: data.thumbnail || '/images/thumbnail1.jpg',
    addedAt: new Date(data.added_at).toISOString().split('T')[0],
    viewHistory: (data.view_history || []).map((r: any) => ({
      date: r.date,
      views: r.views,
      growth: r.growth,
    })),
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
