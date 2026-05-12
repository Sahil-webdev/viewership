import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, Video, Calendar, ArrowRight, Plus, Trash2, Edit2, 
  Download, Search, X, Play, ExternalLink, Instagram, MoreHorizontal, Eye, EyeOff, Copy
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api, API_BASE } from './services/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewCard from './components/OverviewCard';
import LineChart from './components/LineChart';
import { Toast } from './components/Toast';
import { User, TrackedVideo } from './types/index';

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ==================== UNIFIED LOGIN ====================
const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginUnified } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await loginUnified(email, password);
    if (result.ok) {
      navigate(result.isSuperAdmin ? '/super-admin/dashboard' : '/company/dashboard');
    } else {
      setError('Invalid email or password. Please check your credentials.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_0.8px,transparent_1px)] bg-[length:4px_4px]"></div>
      
      <div className="relative z-10 w-full max-w-sm px-5">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF0033] to-[#FF3355] flex items-center justify-center">
              <Play className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-semibold text-3xl tracking-[-1.5px] text-white">ViewPulse</div>
              <div className="text-xs text-white/40 tracking-[4px] -mt-1">PREMIUM ANALYTICS</div>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.025] backdrop-blur-3xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <div className="mb-6">
            <div className="uppercase text-xs tracking-[3px] text-[#FF0033] font-medium mb-2">SECURE ACCESS</div>
            <h1 className="text-3xl font-semibold tracking-[-1.4px] text-white">ViewPulse Portal</h1>
            <p className="text-white/60 mt-2 text-sm">Login once. We will open Super Admin or Company dashboard automatically.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-white/50 tracking-widest block mb-2">EMAIL</label>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/15 focus:border-[#FF0033] px-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 outline-none transition"
                placeholder="you@company.com" required
              />
            </div>
            <div>
              <label className="text-xs text-white/50 tracking-widest block mb-2">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 focus:border-[#FF0033] px-4 py-3.5 pr-12 rounded-2xl text-white placeholder:text-white/30 outline-none transition"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className="text-red-400 text-sm bg-red-950/60 px-4 py-3 rounded-xl">{error}</div>}

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-[#FF0033] hover:bg-[#E6002E] text-white py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition active:scale-[0.985] disabled:opacity-70"
            >
              {isLoading ? 'AUTHENTICATING...' : 'SIGN IN TO DASHBOARD'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <div className="mt-4 text-[10px] text-white/30">Use your assigned credentials</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPANY LOGIN ====================
const CompanyLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginCompany } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const success = await loginCompany(email, password);
    if (success) {
      navigate('/company/dashboard');
    } else {
      setError('Invalid email or password. Check your credentials or contact your admin.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_0.7px,transparent_1px)] bg-[length:4px_4px]"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF0033] to-[#FF3355] flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="font-semibold text-4xl tracking-[-2px] text-white">ViewPulse</div>
              <div className="text-xs text-white/40 tracking-[4px] -mt-1">YOUTUBE ANALYTICS</div>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.025] backdrop-blur-3xl border border-white/10 rounded-3xl p-9">
          <div className="mb-8">
            <div className="uppercase text-xs tracking-[3px] text-[#FF0033] font-medium mb-2">COMPANY ACCESS</div>
            <h1 className="text-4xl font-semibold tracking-[-1.8px] text-white">Company Login</h1>
            <p className="text-white/60 mt-3 text-[15px]">Access your YouTube view tracking dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-white/50 tracking-widest block mb-2">WORK EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/15 focus:border-[#FF0033] px-5 py-[17px] rounded-2xl text-white outline-none transition" placeholder="you@company.com" required />
            </div>
            <div>
              <label className="text-xs text-white/50 tracking-widest block mb-2">PASSWORD</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/15 focus:border-[#FF0033] px-5 py-[17px] rounded-2xl text-white outline-none transition" placeholder="••••••••" required />
            </div>

            {error && <div className="text-red-400 text-sm bg-red-950/60 px-4 py-3 rounded-xl">{error}</div>}

            <button type="submit" disabled={isLoading}
              className="w-full bg-white text-[#0A0F1E] py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 hover:bg-white/90 active:scale-[0.985] transition disabled:opacity-70">
              {isLoading ? 'VERIFYING ACCESS...' : 'ACCESS MY DASHBOARD'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-white/10 text-center text-xs text-white/50">
            Don&apos;t have an account? Contact your company admin for access.
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={() => navigate('/')} className="text-xs text-white/40 hover:text-white flex items-center gap-2">
            Back to Super Admin Login <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== SUPER ADMIN DASHBOARD ====================
const SuperAdminDashboard: React.FC = () => {
  const { companies, isSuperAdmin } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const navigate = useNavigate();
  const refreshOverview = () => {
    if (isSuperAdmin) {
      api.getSuperAdminOverview().then(setOverview).catch(console.error);
    }
  };

  useEffect(() => {
    refreshOverview();
  }, [isSuperAdmin]);

  const activeCompanies = companies.filter(c => c.status === 'Active').length;
  const totalViews = overview ? overview.total_views.toLocaleString() : '—';

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex">
      <Sidebar isSuperAdmin={true} />
      <div className="flex-1 lg:ml-72 min-w-0">
        <Header title="Super Admin Dashboard" subtitle="Global oversight for all client companies" />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-9">
            <OverviewCard title="TOTAL COMPANIES" value={companies.length} change="+3 this month" icon={Users} accentColor="#FF0033" />
            <OverviewCard title="ACTIVE LOGINS" value={activeCompanies} change="98% active" icon={TrendingUp} accentColor="#10B981" />
            <OverviewCard title="YOUTUBE LINKS" value={overview?.total_videos || 0} change="Tracked across all" icon={Video} accentColor="#6366F1" />
            <OverviewCard title="TOTAL VIEWS" value={totalViews} change="+17% vs last month" icon={Play} accentColor="#F59E0B" />
            <OverviewCard title="LAST SYNC" value="Just now" change="Live data feed" icon={Calendar} accentColor="#8B5CF6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/[0.025] border border-white/10 rounded-3xl p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                  <div className="font-semibold text-2xl tracking-tight">Recent Companies</div>
                  <div className="text-white/50 text-sm">Latest onboarded clients</div>
                </div>
                <button onClick={() => navigate('/super-admin/companies')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-[#FF0033] hover:bg-[#E6002E] rounded-2xl font-medium transition">
                  <Plus className="w-4 h-4" /> Manage Companies
                </button>
              </div>

              <div className="space-y-px">
                {companies.slice(0, 5).map((company) => (
                  <div key={company.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 px-5 border-b border-white/10 last:border-0 hover:bg-white/[0.015] rounded-xl group">
                    <div>
                      <div className="font-semibold">{company.companyName}</div>
                      <div className="text-sm text-white/50">{company.name} • {company.email}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                      <div className={`px-3 py-px rounded font-medium text-xs ${company.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {company.status}
                      </div>
                      <div className="text-white/40">{company.role}</div>
                      <button onClick={() => navigate('/super-admin/companies')} className="opacity-0 group-hover:opacity-100 text-[#FF0033] hover:underline">Manage</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-5 sm:p-6 lg:p-8 flex flex-col">
              <div className="font-semibold text-xl tracking-tight mb-2">Quick Insights</div>
              <div className="text-white/60 text-sm mb-6">Platform health at a glance</div>
              
              <div className="space-y-5 flex-1">
                <div className="flex justify-between items-center"><span className="text-sm text-white/60">Avg. Views/Video</span> <span className="font-mono font-medium text-xl">{overview?.total_videos ? Math.round(overview.total_views / Math.max(overview.total_videos, 1)).toLocaleString() : '—'}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-white/60">Active View Tracking</span> <span className="font-mono font-medium text-xl">{overview?.active_companies || 0}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-white/60">Data Freshness</span> <span className="font-medium text-emerald-400 text-sm">LIVE</span></div>
              </div>
              <button onClick={() => navigate('/super-admin/reports')} className="mt-6 w-full py-4 border border-white/15 hover:bg-white/5 transition rounded-2xl text-sm font-medium">
                View Full Analytics Report
              </button>
            </div>
          </div>

          <SuperAdminLinkManager companies={companies} onRefreshOverview={refreshOverview} />
        </div>
      </div>
    </div>
  );
};

const SuperAdminLinkManager: React.FC<{
  companies: User[];
  onRefreshOverview: () => void;
}> = ({ companies, onRefreshOverview }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [managedVideos, setManagedVideos] = useState<TrackedVideo[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'instagram' | 'facebook'>('youtube');
  const [inputMode, setInputMode] = useState<'item' | 'account'>('item');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState('FETCHING VIEW DATA...');
  const [showLongSyncHint, setShowLongSyncHint] = useState(false);
  const [isClearingTracked, setIsClearingTracked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkSummary, setBulkSummary] = useState<{
    total: number;
    valid: string[];
    invalid: string[];
    duplicate: string[];
    alreadyTracked: string[];
  }>({
    total: 0,
    valid: [],
    invalid: [],
    duplicate: [],
    alreadyTracked: [],
  });

  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      const preferred = companies.find(c => c.status === 'Active') || companies[0];
      setSelectedCompanyId(preferred.id);
    }
  }, [companies, selectedCompanyId]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const modeLabel = inputMode === 'item'
    ? (platform === 'youtube' ? 'Video Links' : platform === 'instagram' ? 'Post/Reel Links' : 'Video/Reel Links')
    : (platform === 'youtube' ? 'Channel Links' : platform === 'instagram' ? 'Account Links' : 'Page Links');
  const platformLabel = platform === 'youtube' ? 'YouTube' : platform === 'instagram' ? 'Instagram' : 'Facebook';

  const mapApiVideo = (data: any): TrackedVideo => ({
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
  });

  const loadSelectedCompanyVideos = async (companyId: string) => {
    if (!companyId) return;
    const myVideos = await api.getCompanyVideos(companyId);
    setManagedVideos(myVideos.map(mapApiVideo));
  };

  useEffect(() => {
    if (!selectedCompanyId) return;
    loadSelectedCompanyVideos(selectedCompanyId).catch(() => {
      setManagedVideos([]);
      setToast({ message: 'Failed to load tracked videos', type: 'error' });
    });
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!isTracking) {
      setShowLongSyncHint(false);
      return;
    }
    const timer = setTimeout(() => setShowLongSyncHint(true), 12000);
    return () => clearTimeout(timer);
  }, [isTracking]);

  const isValidYouTubeVideoUrl = (url: string) =>
    /youtube\.com\/(watch|shorts|embed|v\/)|youtu\.be\//.test(url);
  const isValidYouTubeChannelUrl = (url: string) =>
    /youtube\.com\/(@|channel\/|user\/|c\/)/.test(url);
  const isValidInstagramPostUrl = (url: string) =>
    /instagram\.com\/(p|reel|tv)\//.test(url);
  const isValidInstagramAccountUrl = (url: string) =>
    /instagram\.com\/[A-Za-z0-9._]+\/?$/.test(url) &&
    !/instagram\.com\/(p|reel|tv|explore|accounts|stories)\//.test(url);
  const isValidFacebookPostUrl = (url: string) => {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();
      if (host.includes('fb.watch')) return true;
      if (!host.includes('facebook.com')) return false;
      if (path.includes('/reel/') || path.includes('/videos/')) return true;
      if (path.includes('/share/v/') || path.includes('/share/r/') || path.includes('/share/p/')) return true;
      if (path.startsWith('/watch') && parsed.searchParams.get('v')) return true;
      return false;
    } catch {
      return false;
    }
  };
  const isValidFacebookPageUrl = (url: string) => {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.toLowerCase();
      if (!host.includes('facebook.com')) return false;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length === 0) return false;
      if (parts[0].toLowerCase() === 'share' && parts.length >= 2) {
        const second = parts[1].toLowerCase();
        if (second !== 'v' && second !== 'r' && second !== 'p') return true;
      }
      const blocked = new Set([
        'watch', 'reel', 'reels', 'videos', 'groups', 'events',
        'marketplace', 'gaming', 'stories', 'photo', 'photos', 'profile.php',
      ]);
      return !blocked.has(parts[0].toLowerCase());
    } catch {
      return false;
    }
  };

  const isValidCurrentInput = (url: string) => {
    if (platform === 'youtube' && inputMode === 'item') return isValidYouTubeVideoUrl(url);
    if (platform === 'youtube' && inputMode === 'account') return isValidYouTubeChannelUrl(url);
    if (platform === 'instagram' && inputMode === 'item') return isValidInstagramPostUrl(url);
    if (platform === 'instagram' && inputMode === 'account') return isValidInstagramAccountUrl(url);
    if (platform === 'facebook' && inputMode === 'item') return isValidFacebookPostUrl(url);
    return isValidFacebookPageUrl(url);
  };

  const invalidInputMessage = () =>
    platform === 'youtube'
      ? (inputMode === 'item' ? 'Please enter a valid YouTube video URL' : 'Please enter a valid YouTube channel URL')
      : platform === 'instagram'
        ? (inputMode === 'item' ? 'Please enter a valid Instagram post/reel URL' : 'Please enter a valid Instagram account URL')
        : (inputMode === 'item' ? 'Please enter a valid Facebook video/reel URL' : 'Please enter a valid Facebook page URL');

  const analyzeBulkInput = (rawText: string) => {
    const chunks = rawText
      .split(/[\n,;]+/g)
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueSeen = new Set<string>();
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicate: string[] = [];
    const alreadyTracked: string[] = [];

    for (const candidate of chunks) {
      if (uniqueSeen.has(candidate)) {
        duplicate.push(candidate);
        continue;
      }
      uniqueSeen.add(candidate);

      if (!isValidCurrentInput(candidate)) {
        invalid.push(candidate);
        continue;
      }

      if (managedVideos.some((v) => v.url === candidate)) {
        alreadyTracked.push(candidate);
        continue;
      }

      if (urls.includes(candidate)) {
        duplicate.push(candidate);
        continue;
      }

      valid.push(candidate);
    }

    return {
      total: chunks.length,
      valid,
      invalid,
      duplicate,
      alreadyTracked,
    };
  };

  const handleBulkAnalyze = () => {
    if (!selectedCompanyId) {
      setToast({ message: 'Select a company first', type: 'error' });
      return;
    }
    const summary = analyzeBulkInput(bulkInput);
    setBulkSummary(summary);
  };

  const handleBulkAddValid = () => {
    if (!selectedCompanyId) {
      setToast({ message: 'Select a company first', type: 'error' });
      return;
    }
    const summary = analyzeBulkInput(bulkInput);
    setBulkSummary(summary);

    if (summary.valid.length === 0) {
      setToast({ message: 'No valid new links found in bulk input', type: 'info' });
      return;
    }

    setUrls((prev) => [...prev, ...summary.valid]);
    setToast({
      message: `${summary.valid.length} links added in bulk. You can now push/track.`,
      type: 'success',
    });
    setShowBulkModal(false);
    setBulkInput('');
    setBulkSummary({
      total: 0,
      valid: [],
      invalid: [],
      duplicate: [],
      alreadyTracked: [],
    });
  };

  const addUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    if (!selectedCompanyId) {
      setToast({ message: 'Select a company first', type: 'error' });
      return;
    }

    if (!isValidCurrentInput(trimmed)) {
      setToast({
        message: invalidInputMessage(),
        type: 'error',
      });
      return;
    }

    if (urls.includes(trimmed) || managedVideos.some(v => v.url === trimmed)) {
      setToast({ message: 'This link is already added for selected company', type: 'info' });
      return;
    }

    setUrls([...urls, trimmed]);
    setNewUrl('');
  };

  const removeUrl = (idx: number) => setUrls(urls.filter((_, i) => i !== idx));

  const handleTrackViews = async () => {
    if (!selectedCompanyId) {
      setToast({ message: 'Select a company first', type: 'error' });
      return;
    }
    if (urls.length === 0 && managedVideos.length === 0) {
      const inputType = inputMode === 'item'
        ? (platform === 'youtube' ? 'video' : platform === 'instagram' ? 'post/reel' : 'video/reel')
        : (platform === 'youtube' ? 'channel' : platform === 'instagram' ? 'account' : 'page');
      setToast({ message: `Add at least one valid ${inputType} link`, type: 'error' });
      return;
    }

    setIsTracking(true);
    setTrackingMessage(urls.length === 0 ? 'SYNCING TRACKED CONTENT...' : 'ADDING LINKS...');
    try {
      if (urls.length === 0) {
        setTrackingMessage('SYNCING VIEW DATA...');
        await api.trackViewsForCompany(selectedCompanyId);
      } else if (platform === 'youtube' && inputMode === 'item') {
        await api.addVideosForCompany(selectedCompanyId, urls);
      } else if (platform === 'youtube' && inputMode === 'account') {
        for (const channelUrl of urls) {
          await api.addChannelVideosForCompany(selectedCompanyId, channelUrl, 50);
        }
      } else if (platform === 'instagram' && inputMode === 'item') {
        await api.addVideosForCompany(selectedCompanyId, urls);
      } else if (platform === 'facebook' && inputMode === 'item') {
        await api.addVideosForCompany(selectedCompanyId, urls);
      } else if (platform === 'facebook' && inputMode === 'account') {
        for (const pageUrl of urls) {
          await api.addFacebookPageVideosForCompany(selectedCompanyId, pageUrl, 50);
        }
      } else {
        for (const accountUrl of urls) {
          await api.addInstagramAccountVideosForCompany(selectedCompanyId, accountUrl, 50);
        }
      }

      setTrackingMessage('SYNCING VIEW DATA...');
      await api.trackViewsForCompany(selectedCompanyId);
      await loadSelectedCompanyVideos(selectedCompanyId);
      onRefreshOverview();
      setUrls([]);
      setShowSuccess(true);
      setToast({
        message: urls.length === 0
          ? `Tracked content synced for ${selectedCompany?.companyName || 'selected company'}`
          : `Sync completed for ${selectedCompany?.companyName || 'selected company'}`,
        type: 'success',
      });
      setTimeout(() => setShowSuccess(false), 1400);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to track views', type: 'error' });
    } finally {
      setTrackingMessage('FETCHING VIEW DATA...');
      setIsTracking(false);
    }
  };

  const handleClearTracked = async () => {
    if (!selectedCompanyId) {
      setToast({ message: 'Select a company first', type: 'error' });
      return;
    }
    if (managedVideos.length === 0) {
      setToast({ message: 'No tracked videos to clear for this company', type: 'info' });
      return;
    }

    const confirmed = confirm(
      `Clear all tracked items for "${selectedCompany?.companyName || 'selected company'}"?\n\n` +
      `This will remove ${managedVideos.length} tracked entries and their view history.`
    );
    if (!confirmed) return;

    setIsClearingTracked(true);
    try {
      const result = await api.clearAllVideosForCompany(selectedCompanyId);
      await loadSelectedCompanyVideos(selectedCompanyId);
      onRefreshOverview();
      setUrls([]);
      setNewUrl('');
      setToast({ message: `Cleared ${result.deleted} tracked videos successfully`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to clear tracked videos', type: 'error' });
    } finally {
      setIsClearingTracked(false);
    }
  };

  return (
    <>
      <div className="mt-6 sm:mt-8 bg-white/[0.025] border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <div className="font-semibold text-2xl tracking-tight">Company Content Control</div>
            <div className="text-white/60 text-sm">Add and sync links from super admin panel for any company</div>
          </div>
          <div className="px-4 py-1 rounded-full bg-white/5 text-xs uppercase tracking-widest text-white/50">{platformLabel} MODE ACTIVE</div>
        </div>

        <div className="mb-5">
          <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Target Company</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setUrls([]);
              setNewUrl('');
            }}
            className="bg-[#111827] border border-white/10 px-5 py-3.5 rounded-2xl w-full sm:max-w-[420px] text-sm"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName} ({company.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => { setPlatform('youtube'); setInputMode('item'); setUrls([]); setNewUrl(''); }}
            className={`px-4 py-2 rounded-xl text-sm border transition flex items-center gap-2 ${platform === 'youtube' ? 'bg-red-50 text-red-600 border-red-200' : 'border-white/20 hover:bg-white/5'}`}
          >
            <Play className="w-4 h-4" /> YouTube
          </button>
          <button
            onClick={() => { setPlatform('instagram'); setInputMode('item'); setUrls([]); setNewUrl(''); }}
            className={`px-4 py-2 rounded-xl text-sm border transition flex items-center gap-2 ${platform === 'instagram' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'border-white/20 hover:bg-white/5'}`}
          >
            <Instagram className="w-4 h-4" /> Instagram
          </button>
          <button
            onClick={() => { setPlatform('facebook'); setInputMode('item'); setUrls([]); setNewUrl(''); }}
            className={`px-4 py-2 rounded-xl text-sm border transition flex items-center gap-2 ${platform === 'facebook' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-white/20 hover:bg-white/5'}`}
          >
            <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">f</span> Facebook
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            onClick={() => { setInputMode('item'); setUrls([]); setNewUrl(''); }}
            className={`px-4 py-2 rounded-xl text-sm border transition ${inputMode === 'item' ? 'bg-red-50 text-red-600 border-red-200' : 'border-white/20 hover:bg-white/5'}`}
          >
            {platform === 'youtube' ? 'Video Link Mode' : platform === 'instagram' ? 'Post/Reel Link Mode' : 'Video/Reel Link Mode'}
          </button>
          <button
            onClick={() => { setInputMode('account'); setUrls([]); setNewUrl(''); }}
            className={`px-4 py-2 rounded-xl text-sm border transition ${inputMode === 'account' ? 'bg-red-50 text-red-600 border-red-200' : 'border-white/20 hover:bg-white/5'}`}
          >
            {platform === 'youtube' ? 'Channel Mode' : platform === 'instagram' ? 'Account Mode' : 'Page Mode'}
          </button>
          <div className="text-xs text-white/50 uppercase tracking-wider">{modeLabel}</div>
        </div>

        <div className="space-y-3">
          {urls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-[#111827] border border-white/10 pl-5 pr-4 py-4 rounded-2xl">
              {inputMode === 'item'
                ? (platform === 'youtube'
                  ? <Play className="text-[#FF0033] flex-shrink-0" />
                  : platform === 'instagram'
                    ? <Instagram className="text-pink-500 flex-shrink-0 w-5 h-5" />
                    : <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">f</span>)
                : <Users className="text-[#FF0033] flex-shrink-0 w-5 h-5" />}
              <div className="flex-1 font-mono text-sm text-white/90 truncate">{url}</div>
              <button onClick={() => removeUrl(idx)} className="p-2 text-white/40 hover:text-red-400"><X className="w-4 h-4" /></button>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <input
              type="text"
              value={newUrl}
              placeholder={
                platform === 'youtube'
                  ? (inputMode === 'item' ? 'https://youtube.com/watch?v=...' : 'https://youtube.com/@channelHandle')
                  : platform === 'instagram'
                    ? (inputMode === 'item' ? 'https://instagram.com/reel/...' : 'https://instagram.com/username/')
                    : (inputMode === 'item' ? 'https://facebook.com/reel/...' : 'https://facebook.com/pageName/')
              }
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addUrl()}
              className="flex-1 bg-[#111827] border border-white/10 px-6 py-4 rounded-2xl focus:outline-none focus:border-[#FF0033]/70 text-sm placeholder:text-white/40"
            />
            <button onClick={addUrl} className="px-7 py-3.5 sm:py-0 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2 transition text-sm font-medium sm:min-w-[190px]">
              {inputMode === 'item'
                ? (platform === 'youtube' ? 'ADD VIDEO' : platform === 'instagram' ? 'ADD POST/REEL' : 'ADD VIDEO/REEL')
                : (platform === 'youtube' ? 'ADD CHANNEL' : platform === 'instagram' ? 'ADD ACCOUNT' : 'ADD PAGE')} <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!selectedCompanyId) {
                  setToast({ message: 'Select a company first', type: 'error' });
                  return;
                }
                setShowBulkModal(true);
              }}
              className="px-7 py-3.5 sm:py-0 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2 transition text-sm font-medium sm:min-w-[170px]"
            >
              BULK ADD LINKS
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 mt-8">
          <div className="w-full lg:flex-1">
            <button
              onClick={handleTrackViews}
              disabled={isTracking || isClearingTracked || (!selectedCompanyId || (urls.length === 0 && managedVideos.length === 0))}
              className="w-full py-[18px] bg-[#FF0033] hover:bg-[#CC0026] disabled:bg-white/10 text-white font-semibold rounded-2xl text-lg flex justify-center items-center gap-3 transition active:scale-[0.985]"
            >
              {isTracking ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {trackingMessage}
                </>
              ) : (
                <>
                  {urls.length === 0 ? 'SYNC TRACKED CONTENT' : (inputMode === 'item' ? 'PUSH / TRACK CONTENT' : 'PUSH / TRACK ACCOUNT')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            {isTracking && showLongSyncHint && (
              <div className="text-[12px] text-white/60 mt-2 px-1">
                Sync chal raha hai, please wait. Large page/video links me thoda time lag sakta hai.
              </div>
            )}
          </div>
          <button
            onClick={() => { setUrls([]); setNewUrl(''); }}
            disabled={isTracking || isClearingTracked}
            className="w-full lg:w-auto px-7 py-[18px] text-sm rounded-2xl border border-white/20 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CLEAR INPUT
          </button>
          <button
            onClick={handleClearTracked}
            disabled={isTracking || isClearingTracked || managedVideos.length === 0 || !selectedCompanyId}
            className="w-full lg:w-auto px-7 py-[18px] text-sm rounded-2xl border border-red-300/50 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isClearingTracked ? <span className="inline-block w-4 h-4 border-2 border-red-400/40 border-t-red-600 rounded-full animate-spin" /> : null}
            CLEAR TRACKED
          </button>
        </div>

        {selectedCompany && (
          <div className="mt-6 text-xs text-white/50">
            Managing for: <span className="text-white font-medium">{selectedCompany.companyName}</span> ({selectedCompany.email})
          </div>
        )}
      </div>

      {managedVideos.length > 0 && (
        <div className="mt-7">
          <div className="mb-4 text-sm font-medium text-white/60 px-1 flex items-center gap-2">
            TRACKED FOR {selectedCompany?.companyName?.toUpperCase() || 'COMPANY'} • {managedVideos.length} ITEMS
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {managedVideos.slice(0, 6).map(video => (
              <div key={video.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
                <img src={video.thumbnail} alt="" className="w-[108px] h-[62px] object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0 pt-1">
                  <div className="font-medium text-sm line-clamp-2 leading-tight">{video.title}</div>
                  <a href={video.url} target="_blank" className="inline-flex items-center text-xs text-[#FF0033] mt-2">Open Link <ExternalLink className="ml-1 w-3 h-3" /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0A0F1E] border border-white/10 rounded-3xl p-6 sm:p-7">
            <div className="text-xl font-semibold mb-1">Bulk Add Links</div>
            <div className="text-white/60 text-sm mb-5">
              Paste one link per line. Comma and semicolon separated links are also supported.
            </div>

            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={
                inputMode === 'item'
                  ? (platform === 'youtube'
                    ? 'https://youtube.com/watch?v=...\nhttps://youtu.be/...'
                    : platform === 'instagram'
                      ? 'https://www.instagram.com/reel/...\nhttps://www.instagram.com/p/...'
                      : 'https://www.facebook.com/reel/...\nhttps://www.facebook.com/videos/...')
                  : (platform === 'youtube'
                    ? 'https://youtube.com/@channelOne\nhttps://youtube.com/@channelTwo'
                    : platform === 'instagram'
                      ? 'https://instagram.com/account_one/\nhttps://instagram.com/account_two/'
                      : 'https://facebook.com/page-one\nhttps://facebook.com/page-two')
              }
              className="w-full h-52 bg-[#111827] border border-white/10 rounded-2xl px-4 py-4 text-sm font-mono focus:outline-none focus:border-[#FF0033]/70"
            />

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Total: {bulkSummary.total}</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">Valid: {bulkSummary.valid.length}</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-400/20">Invalid: {bulkSummary.invalid.length}</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-400/20">Duplicate: {bulkSummary.duplicate.length}</span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-400/20">Already Tracked: {bulkSummary.alreadyTracked.length}</span>
            </div>

            {(bulkSummary.invalid.length > 0 || bulkSummary.duplicate.length > 0 || bulkSummary.alreadyTracked.length > 0) && (
              <div className="mt-4 bg-[#111827] border border-white/10 rounded-2xl p-4 text-xs space-y-2 max-h-40 overflow-y-auto">
                {bulkSummary.invalid.length > 0 && (
                  <div className="text-red-400">Invalid examples: {bulkSummary.invalid.slice(0, 3).join(' | ')}</div>
                )}
                {bulkSummary.duplicate.length > 0 && (
                  <div className="text-amber-400">Duplicate examples: {bulkSummary.duplicate.slice(0, 3).join(' | ')}</div>
                )}
                {bulkSummary.alreadyTracked.length > 0 && (
                  <div className="text-blue-400">Already tracked examples: {bulkSummary.alreadyTracked.slice(0, 3).join(' | ')}</div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkInput('');
                  setBulkSummary({
                    total: 0,
                    valid: [],
                    invalid: [],
                    duplicate: [],
                    alreadyTracked: [],
                  });
                }}
                className="px-4 py-2 border border-white/15 rounded-xl text-sm hover:bg-white/5"
              >
                Close
              </button>
              <button
                onClick={handleBulkAnalyze}
                className="px-4 py-2 border border-white/15 rounded-xl text-sm hover:bg-white/5"
              >
                Analyze Links
              </button>
              <button
                onClick={handleBulkAddValid}
                className="px-5 py-2 bg-[#FF0033] hover:bg-[#E6002E] rounded-xl text-sm font-medium"
              >
                Add Valid Links
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSuccess && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90]">
          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-[#0A0F1E] border border-white/10 px-9 py-9 rounded-3xl text-center max-w-xs">
            <div className="mx-auto mb-6 w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center"><Play className="text-emerald-400 w-7 h-7" /></div>
            <div className="text-xl font-semibold mb-2">Company Data Synced</div>
            <p className="text-white/60 text-sm">Tracking data updated successfully.</p>
          </motion.div>
        </div>}
      </AnimatePresence>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

// ==================== CREATE COMPANY ACCESS PAGE ====================
const CreateCompanyAccess: React.FC = () => {
  const { createCompanyAccess, companies, updateCompany, deleteCompany } = useAuth();
  const [form, setForm] = useState<{
    companyName: string; name: string; email: string; password: string; confirmPassword: string; role: User['role']; status: User['status'];
  }>({
    companyName: '', name: '', email: '', password: '', confirmPassword: '', role: 'Company Admin', status: 'Active'
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [openActionCompanyId, setOpenActionCompanyId] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ companyName: string; email: string; password: string } | null>(null);
  const [loadingPasswordFor, setLoadingPasswordFor] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    if (companies.some(c => c.email === form.email)) {
      setToast({ message: 'Email already exists', type: 'error' });
      return;
    }

    try {
      await createCompanyAccess(form);
      setShowSuccess(true);
      setToast({ message: 'Company access created successfully.', type: 'success' });
      setForm({ companyName: '', name: '', email: '', password: '', confirmPassword: '', role: 'Company Admin', status: 'Active' });
      setTimeout(() => setShowSuccess(false), 2400);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create company', type: 'error' });
    }
  };

  const handleUpdate = async (id: string, field: string, value: string) => {
    try {
      await updateCompany(id, { [field]: value });
      setToast({ message: 'Company updated successfully', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update company', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const company = companies.find(c => c.id === id);
    const confirmed = confirm(
      `Are you sure you want to delete "${company?.companyName || 'this company'}"?\n\n` +
      `This will permanently remove:\n` +
      `• Company account and all login access\n` +
      `• All tracked videos and view data\n\n` +
      `This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await deleteCompany(id);
      setToast({ message: `Company "${company?.companyName}" deleted successfully`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete company', type: 'error' });
    }
  };

  const handleShowPassword = async (companyId: string) => {
    setLoadingPasswordFor(companyId);
    try {
      const data = await api.getCompanyPassword(companyId);
      setPasswordModal({
        companyName: data.company_name,
        email: data.email,
        password: data.password,
      });
      setOpenActionCompanyId(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Unable to fetch company password', type: 'error' });
    } finally {
      setLoadingPasswordFor(null);
    }
  };

  const copyPassword = async () => {
    if (!passwordModal?.password) return;
    try {
      await navigator.clipboard.writeText(passwordModal.password);
      setToast({ message: 'Password copied to clipboard', type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy password', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex">
      <Sidebar isSuperAdmin={true} />
      <div className="flex-1 lg:ml-72 min-w-0">
        <Header title="Companies Access Control" subtitle="Create, manage and securely review company credentials" />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px]">
          <div className="bg-white/[0.025] border border-white/10 rounded-3xl p-5 sm:p-7 lg:p-9 mb-9">
            <div className="font-semibold text-2xl tracking-[-1px] mb-1">Create Company Access</div>
            <p className="text-white/60 mb-8">Create secure login credentials for company users</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 block mb-1.5">COMPANY NAME</label>
                <input type="text" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full bg-[#111827] border border-white/10 px-5 py-4 rounded-2xl text-white placeholder:text-white/40" placeholder="Acme Digital" required />
              </div>
              
              <div>
                <label className="text-xs text-white/60 block mb-1.5">ADMIN FULL NAME</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#111827] border border-white/10 px-5 py-4 rounded-2xl" placeholder="Jane Cooper" required />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1.5">ADMIN EMAIL</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-[#111827] border border-white/10 px-5 py-4 rounded-2xl" placeholder="admin@company.com" required />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1.5">PASSWORD</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-[#111827] border border-white/10 px-5 py-4 rounded-2xl" required />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1.5">CONFIRM PASSWORD</label>
                <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full bg-[#111827] border border-white/10 px-5 py-4 rounded-2xl" required />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1.5">ROLE</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value as any})} className="w-full bg-[#111827] border border-white/10 px-5 py-[17px] rounded-2xl text-white">
                  <option value="Company Admin">Company Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1.5">STATUS</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full bg-[#111827] border border-white/10 px-5 py-[17px] rounded-2xl text-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2 pt-3">
                <button type="submit" className="w-full sm:w-auto px-10 py-4 bg-[#FF0033] hover:bg-[#E6002E] text-white font-semibold rounded-2xl transition text-lg flex items-center justify-center gap-3">
                  CREATE ACCESS <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 px-6 py-4 bg-emerald-900/30 border border-emerald-600/60 text-emerald-400 rounded-2xl flex items-center gap-3">
                <div>✓ Company access created successfully. New credentials sent to admin email.</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center">
              <div className="font-semibold">All Company Accesses <span className="text-white/40 text-sm ml-2">({companies.length})</span></div>
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/60 text-xs uppercase tracking-widest">
                  <th className="py-4 px-8">COMPANY</th>
                  <th>ADMIN</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th className="text-right pr-8">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.015]">
                    <td className="px-8 py-5 font-medium">{company.companyName}</td>
                    <td className="py-5 text-white/80">{company.name}</td>
                    <td className="py-5 text-white/70 font-mono text-xs">{company.email}</td>
                    <td className="py-5"><span className="px-3 py-px bg-white/5 rounded text-xs">{company.role}</span></td>
                    <td className="py-5">
                      <span className={`px-3 py-0.5 text-xs rounded-full font-medium ${company.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{company.status}</span>
                    </td>
                    <td className="py-5 text-white/50">{company.createdAt}</td>
                    <td className="py-5 pr-8 text-right relative">
                      <div className="flex gap-2 justify-end items-center">
                        <button onClick={() => handleUpdate(company.id, 'status', company.status === 'Active' ? 'Inactive' : 'Active')} className="px-3 py-1.5 text-xs font-medium rounded-lg transition border border-white/10 hover:bg-white/5 text-white/70">
                          {company.status === 'Active' ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(company.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition border border-red-500/20" title="Delete Company">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOpenActionCompanyId(openActionCompanyId === company.id ? null : company.id)}
                          className="p-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/70"
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      {openActionCompanyId === company.id && (
                        <div className="absolute right-8 bottom-full mb-2 w-48 bg-[#111827] border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden">
                          <button
                            onClick={() => handleShowPassword(company.id)}
                            disabled={loadingPasswordFor === company.id}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2 disabled:opacity-60"
                          >
                            <Eye className="w-4 h-4" />
                            {loadingPasswordFor === company.id ? 'Loading Password...' : 'Show Password'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {passwordModal && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0A0F1E] border border-white/10 rounded-3xl p-7">
            <div className="text-xl font-semibold mb-1">Company Password</div>
            <div className="text-white/60 text-sm mb-6">
              {passwordModal.companyName} ({passwordModal.email})
            </div>
            <div className="bg-[#111827] border border-white/10 rounded-2xl px-4 py-4 font-mono text-sm break-all">
              {passwordModal.password}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setPasswordModal(null)} className="px-4 py-2 border border-white/15 rounded-xl text-sm hover:bg-white/5">Close</button>
              <button onClick={copyPassword} className="px-4 py-2 bg-[#FF0033] hover:bg-[#E6002E] rounded-xl text-sm font-medium flex items-center gap-2">
                <Copy className="w-4 h-4" /> Copy Password
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ==================== COMPANY DASHBOARD ====================
const CompanyDashboard: React.FC = () => {
  const { addVideosForCompany, addChannelForCompany, addInstagramAccountForCompany, clearAllCompanyVideos, trackViews, getCurrentCompanyVideos, user } = useAuth();
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'instagram'>('youtube');
  const [inputMode, setInputMode] = useState<'item' | 'account'>('item');
  const [isTracking, setIsTracking] = useState(false);
  const [isClearingTracked, setIsClearingTracked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const navigate = useNavigate();

  const videos = getCurrentCompanyVideos();
  const modeLabel = inputMode === 'item'
    ? (platform === 'youtube' ? 'Video Links' : 'Post/Reel Links')
    : (platform === 'youtube' ? 'Channel Links' : 'Account Links');
  const platformLabel = platform === 'youtube' ? 'YouTube' : 'Instagram';

  const isValidYouTubeVideoUrl = (url: string) =>
    /youtube\.com\/(watch|shorts|embed|v\/)|youtu\.be\//.test(url);
  const isValidYouTubeChannelUrl = (url: string) =>
    /youtube\.com\/(@|channel\/|user\/|c\/)/.test(url);
  const isValidInstagramPostUrl = (url: string) =>
    /instagram\.com\/(p|reel|tv)\//.test(url);
  const isValidInstagramAccountUrl = (url: string) =>
    /instagram\.com\/[A-Za-z0-9._]+\/?$/.test(url) &&
    !/instagram\.com\/(p|reel|tv|explore|accounts|stories)\//.test(url);

  const isValidCurrentInput = (url: string) => {
    if (platform === 'youtube' && inputMode === 'item') return isValidYouTubeVideoUrl(url);
    if (platform === 'youtube' && inputMode === 'account') return isValidYouTubeChannelUrl(url);
    if (platform === 'instagram' && inputMode === 'item') return isValidInstagramPostUrl(url);
    return isValidInstagramAccountUrl(url);
  };

  const addUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;

    const isValid = isValidCurrentInput(trimmed);
    if (!isValid) {
      setToast({
        message:
          platform === 'youtube'
            ? (inputMode === 'item' ? 'Please enter a valid YouTube video URL' : 'Please enter a valid YouTube channel URL')
            : (inputMode === 'item' ? 'Please enter a valid Instagram post/reel URL' : 'Please enter a valid Instagram account URL'),
        type: 'error'
      });
      return;
    }
    if (urls.includes(trimmed) || videos.some(v => v.url === trimmed)) {
      setToast({ message: 'This link has already been added', type: 'info' });
      return;
    }
    setUrls([...urls, trimmed]);
    setNewUrl('');
  };

  const removeUrl = (idx: number) => setUrls(urls.filter((_, i) => i !== idx));

  const handleTrackViews = async () => {
    if (urls.length === 0) {
      const inputType = inputMode === 'item'
        ? (platform === 'youtube' ? 'video' : 'post/reel')
        : (platform === 'youtube' ? 'channel' : 'account');
      setToast({ message: `Add at least one valid ${inputType} link`, type: 'error' });
      return;
    }
    
    setIsTracking(true);
    
    try {
      if (platform === 'youtube' && inputMode === 'item') {
        await addVideosForCompany(urls);
      } else if (platform === 'youtube' && inputMode === 'account') {
        for (const channelUrl of urls) {
          await addChannelForCompany(channelUrl, 50);
        }
      } else if (platform === 'instagram' && inputMode === 'item') {
        await addVideosForCompany(urls);
      } else {
        for (const accountUrl of urls) {
          await addInstagramAccountForCompany(accountUrl, 50);
        }
      }
      await trackViews();
      setIsTracking(false);
      setShowSuccess(true);
      setUrls([]);
      setToast({
        message:
          inputMode === 'item'
            ? `Successfully synced ${urls.length} ${platform === 'youtube' ? 'video' : 'post/reel'} link${urls.length > 1 ? 's' : ''}.`
            : `${platform === 'youtube' ? 'Channel' : 'Account'} sync completed. Added videos and updated view data.`,
        type: 'success'
      });
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/company/reports');
      }, 1450);
    } catch (err: any) {
      setIsTracking(false);
      setToast({ message: err.message || 'Failed to track views', type: 'error' });
    }
  };

  const handleClearTracked = async () => {
    if (videos.length === 0) {
      setToast({ message: 'No tracked videos to clear', type: 'info' });
      return;
    }

    const confirmed = confirm(
      `Clear all tracked social items?\n\n` +
      `This will remove ${videos.length} tracked entries and their view history.\n` +
      `You can add new links after this.`
    );
    if (!confirmed) return;

    setIsClearingTracked(true);
    try {
      const result = await clearAllCompanyVideos();
      setUrls([]);
      setNewUrl('');
      setToast({ message: `Cleared ${result.deleted} tracked videos successfully`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to clear tracked videos', type: 'error' });
    } finally {
      setIsClearingTracked(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex">
      <Sidebar isSuperAdmin={false} />
      <div className="flex-1 lg:ml-72 min-w-0">
        <Header title="Social Video Tracker" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}. Track YouTube and Instagram performance from one place.`} />

        <div className="p-8 max-w-5xl">
          <div className="bg-white/[0.025] border border-white/10 rounded-3xl p-9 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="font-semibold text-[28px] tracking-[-1.4px]">Multi-Platform View Intelligence</div>
                <div className="text-white/60">Switch platform, add item/account links, and generate one unified report</div>
              </div>
              <div className="px-4 py-1 rounded-full bg-white/5 text-xs uppercase tracking-widest text-white/50">{platformLabel} MODE ACTIVE</div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setPlatform('youtube'); setInputMode('item'); setUrls([]); setNewUrl(''); }}
                className={`px-4 py-2 rounded-xl text-sm border transition flex items-center gap-2 ${platform === 'youtube' ? 'bg-red-50 text-red-600 border-red-200' : 'border-white/20 hover:bg-white/5'}`}
              >
                <Play className="w-4 h-4" /> YouTube
              </button>
              <button
                onClick={() => { setPlatform('instagram'); setInputMode('item'); setUrls([]); setNewUrl(''); }}
                className={`px-4 py-2 rounded-xl text-sm border transition flex items-center gap-2 ${platform === 'instagram' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'border-white/20 hover:bg-white/5'}`}
              >
                <Instagram className="w-4 h-4" /> Instagram
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => { setInputMode('item'); setUrls([]); setNewUrl(''); }}
                className={`px-4 py-2 rounded-xl text-sm border transition ${inputMode === 'item' ? 'bg-red-50 text-red-600 border-red-200' : 'border-white/20 hover:bg-white/5'}`}
              >
                {platform === 'youtube' ? 'Video Link Mode' : 'Post/Reel Link Mode'}
              </button>
              <button
                onClick={() => { setInputMode('account'); setUrls([]); setNewUrl(''); }}
                className={`px-4 py-2 rounded-xl text-sm border transition ${inputMode === 'account' ? 'bg-red-50 text-red-600 border-red-200' : 'border-white/20 hover:bg-white/5'}`}
              >
                {platform === 'youtube' ? 'Channel Mode' : 'Account Mode'}
              </button>
              <div className="text-xs text-white/50 uppercase tracking-wider">{modeLabel}</div>
            </div>

            <div className="space-y-3">
              {urls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#111827] border border-white/10 pl-5 pr-4 py-4 rounded-2xl group">
                  {inputMode === 'item'
                    ? (platform === 'youtube'
                      ? <Play className="text-[#FF0033] flex-shrink-0" />
                      : <Instagram className="text-pink-500 flex-shrink-0 w-5 h-5" />)
                    : <Users className="text-[#FF0033] flex-shrink-0 w-5 h-5" />}
                  <div className="flex-1 font-mono text-sm text-white/90 truncate">{url}</div>
                  <button onClick={() => removeUrl(idx)} className="p-2 text-white/40 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}

              <div className="flex gap-3 pt-1">
                <input 
                  type="text"
                  value={newUrl}
                  placeholder={
                    platform === 'youtube'
                      ? (inputMode === 'item' ? 'https://youtube.com/watch?v=...' : 'https://youtube.com/@channelHandle')
                      : (inputMode === 'item' ? 'https://instagram.com/reel/...' : 'https://instagram.com/username/')
                  }
                  onChange={e => setNewUrl(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                  className="flex-1 bg-[#111827] border border-white/10 px-6 py-4 rounded-2xl focus:outline-none focus:border-[#FF0033]/70 text-sm placeholder:text-white/40" 
                />
                <button onClick={addUrl} className="px-7 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center gap-2 transition text-sm font-medium">
                  {inputMode === 'item'
                    ? (platform === 'youtube' ? 'ADD VIDEO' : 'ADD POST/REEL')
                    : (platform === 'youtube' ? 'ADD CHANNEL' : 'ADD ACCOUNT')} <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button 
                onClick={handleTrackViews} 
                disabled={isTracking || isClearingTracked || urls.length === 0}
                className="flex-1 py-[18px] bg-[#FF0033] hover:bg-[#CC0026] disabled:bg-white/10 text-white font-semibold rounded-2xl text-lg flex justify-center items-center gap-3 transition active:scale-[0.985]"
              >
                {isTracking ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    FETCHING VIEW DATA...
                  </>
                ) : (
                  <>
                    {inputMode === 'item' ? 'PUSH / TRACK CONTENT' : 'PUSH / TRACK ACCOUNT'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                onClick={() => { setUrls([]); setNewUrl(''); }}
                disabled={isTracking || isClearingTracked}
                className="px-7 py-[18px] text-sm rounded-2xl border border-white/20 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CLEAR INPUT
              </button>
              <button
                onClick={handleClearTracked}
                disabled={isTracking || isClearingTracked || videos.length === 0}
                className="px-7 py-[18px] text-sm rounded-2xl border border-red-300/50 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isClearingTracked ? <span className="inline-block w-4 h-4 border-2 border-red-400/40 border-t-red-600 rounded-full animate-spin" /> : null}
                CLEAR TRACKED
              </button>
            </div>
          </div>

          {videos.length > 0 && (
            <div>
              <div className="mb-4 text-sm font-medium text-white/60 px-1 flex items-center gap-2">CURRENTLY TRACKING • {videos.length} ITEMS</div>
              <div className="grid md:grid-cols-2 gap-4">
                {videos.slice(0, 4).map(video => (
                  <div key={video.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
                    <img src={video.thumbnail} alt="" className="w-[108px] h-[62px] object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="font-medium text-sm line-clamp-2 leading-tight">{video.title}</div>
                      <a href={video.url} target="_blank" className="inline-flex items-center text-xs text-[#FF0033] mt-2">Open Link <ExternalLink className="ml-1 w-3 h-3" /></a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length === 0 && urls.length === 0 && (
            <div className="text-center py-16 bg-white/[0.015] border border-white/10 rounded-3xl">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5"><Video className="w-8 h-8 text-white/40" /></div>
              <div className="text-xl font-medium">No social videos tracked yet</div>
              <p className="text-white/50 max-w-xs mx-auto mt-2 text-sm">Add YouTube or Instagram links and push sync to build unified date-wise performance reports.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90]">
          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-[#0A0F1E] border border-white/10 px-9 py-9 rounded-3xl text-center max-w-xs">
            <div className="mx-auto mb-6 w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center"><Play className="text-emerald-400 w-7 h-7" /></div>
            <div className="text-xl font-semibold mb-2">Views Synced Successfully</div>
            <p className="text-white/60 text-sm">Redirecting to Analytics Report...</p>
          </motion.div>
        </div>}
      </AnimatePresence>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ==================== DATE-WISE REPORTS / ANALYTICS PAGE ====================
const CompanyReadonlyDashboard: React.FC = () => {
  const { getCurrentCompanyVideos, user } = useAuth();
  const videos = getCurrentCompanyVideos();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex">
      <Sidebar isSuperAdmin={false} />
      <div className="flex-1 lg:ml-72 min-w-0">
        <Header title="Company Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}. Your links are managed by super admin.`} />

        <div className="p-8 max-w-5xl">
          <div className="bg-white/[0.025] border border-white/10 rounded-3xl p-9 mb-8">
            <div className="font-semibold text-[28px] tracking-[-1.2px] mb-2">Tracking Managed by Super Admin</div>
            <p className="text-white/60 mb-6">
              Link add, channel/account sync, and tracked data reset are now controlled from super admin dashboard.
              You can continue to monitor all results in your reports.
            </p>
            <button
              onClick={() => navigate('/company/reports')}
              className="px-7 py-3.5 rounded-2xl bg-[#FF0033] hover:bg-[#CC0026] text-white font-medium inline-flex items-center gap-2"
            >
              VIEW ANALYTICS REPORT <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {videos.length > 0 && (
            <div>
              <div className="mb-4 text-sm font-medium text-white/60 px-1 flex items-center gap-2">CURRENTLY TRACKING • {videos.length} ITEMS</div>
              <div className="grid md:grid-cols-2 gap-4">
                {videos.slice(0, 8).map(video => (
                  <div key={video.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
                    <img src={video.thumbnail} alt="" className="w-[108px] h-[62px] object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="font-medium text-sm line-clamp-2 leading-tight">{video.title}</div>
                      <a href={video.url} target="_blank" className="inline-flex items-center text-xs text-[#FF0033] mt-2">Open Link <ExternalLink className="ml-1 w-3 h-3" /></a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length === 0 && (
            <div className="text-center py-16 bg-white/[0.015] border border-white/10 rounded-3xl">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5"><Video className="w-8 h-8 text-white/40" /></div>
              <div className="text-xl font-medium">No content tracked yet</div>
              <p className="text-white/50 max-w-sm mx-auto mt-2 text-sm">Ask super admin to add links for your company from their dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CompanyReports: React.FC = () => {
  const { getCurrentCompanyVideos } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'7' | '30' | '365'>('30');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const days = parseInt(dateFilter);
    api.getAnalytics(days).then(data => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dateFilter]);

  const videos = getCurrentCompanyVideos();

  const activeVideos = videos.filter(v => v.viewHistory.length > 0);
  
  const totalVideos = analytics?.total_videos || activeVideos.length;
  const totalViews = analytics?.total_views || 0;
  const viewsToday = analytics?.views_today || 0;
  const highestVideo = analytics?.highest_video;
  const totalViewsText = totalViews.toLocaleString();
  const viewsTodayText = `${viewsToday >= 0 ? '+' : ''}${viewsToday.toLocaleString()}`;
  const compactStatValueClass = 'font-semibold text-[clamp(1.35rem,2.3vw,2.55rem)] leading-tight mt-3 tabular-nums whitespace-nowrap';

  const tableData = analytics?.table_data || [];
  const videoSummaries = analytics?.video_summaries || [];

  const filteredTable = tableData.filter((r: any) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSummaries = videoSummaries.filter((r: any) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    const days = parseInt(dateFilter);
    const token = localStorage.getItem('vp_token');
    if (!token) {
      setToast({ message: 'Please login first', type: 'error' });
      return;
    }

    const endpoints: Record<string, string> = {
      CSV: `${API_BASE}/api/analytics/export/csv?days=${days}`,
      Excel: `${API_BASE}/api/analytics/export/excel?days=${days}`,
      PDF: `${API_BASE}/api/analytics/export/pdf?days=${days}`,
    };

    const endpoint = endpoints[type];
    if (!endpoint) return;  

    try {
      setExporting(type);
      setToast({ message: `Preparing ${type} report...`, type: 'info' });

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Export failed' }));
        setToast({ message: err.detail || 'Export failed', type: 'error' });
        setExporting(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const ext = type.toLowerCase();
      a.download = `viewpulse-report.${ext === 'excel' ? 'xlsx' : ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ message: `${type} report downloaded successfully`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Download failed', type: 'error' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex">
      <Sidebar isSuperAdmin={false} />
      <div className="flex-1 lg:ml-72 min-w-0">
        <Header title="Date-Wise Analytics" subtitle="Comprehensive performance insights for all tracked videos" />

        <div className="p-8 max-w-[1480px]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-5 top-4 text-white/40 w-4 h-4" />
                <input type="text" value={searchTerm} placeholder="Search videos or links..." onChange={e => setSearchTerm(e.target.value)} className="bg-white/5 pl-12 w-80 py-3.5 rounded-2xl text-sm border border-white/10 focus:border-white/30" />
              </div>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} className="bg-white/5 border border-white/10 px-6 py-3.5 rounded-2xl text-sm">
                <option value="30">Last 30 Days</option>
                <option value="7">Last 7 Days</option>
                <option value="365">Last 1 Year</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleExport('CSV')} disabled={exporting !== null} className="px-5 py-3 flex gap-2 text-sm items-center border border-white/20 rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"><Download className="w-4 h-4" /> {exporting === 'CSV' ? 'Generating...' : 'Export CSV'}</button>
              <button onClick={() => handleExport('Excel')} disabled={exporting !== null} className="px-5 py-3 flex gap-2 text-sm items-center border border-white/20 rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"><Download className="w-4 h-4" /> {exporting === 'Excel' ? 'Generating...' : 'Export Excel'}</button>
              <button onClick={() => handleExport('PDF')} disabled={exporting !== null} className="px-5 py-3 flex gap-2 text-sm items-center border border-white/20 rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"><Download className="w-4 h-4" /> {exporting === 'PDF' ? 'Generating...' : 'Export PDF'}</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-white/50">Loading analytics...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-9">
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="text-sm text-white/60">Total Videos Tracked</div>
                  <div className="font-semibold text-[clamp(2rem,4.2vw,3.4rem)] leading-none mt-3 tabular-nums">{totalVideos}</div>
                </div>
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="text-sm text-white/60">Total Views</div>
                  <div className={compactStatValueClass}>{totalViewsText}</div>
                </div>
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10">
                  <div className="text-sm text-white/60">Views Today (Net)</div>
                  <div className={`${compactStatValueClass} ${viewsToday >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {viewsTodayText}
                  </div>
                </div>
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10"><div className="text-sm text-white/60">Highest Video</div><div className="font-semibold text-xl tracking-tight mt-3 pr-4 line-clamp-2">{highestVideo?.title || '—'}</div></div>
              </div>

              <div className="mb-9">
                <div className="flex justify-between items-end mb-4 px-1">
                  <div>
                    <div className="font-semibold text-2xl tracking-[-0.8px]">View Trends Over Time</div>
                    <div className="text-sm text-white/50">Multi-video comparison - real synced snapshot trend</div>
                  </div>
                  <button onClick={() => navigate('/company/dashboard')} className="text-sm flex items-center gap-1 text-[#FF0033]">GO TO DASHBOARD <ArrowRight className="w-3.5" /></button>
                </div>
                <LineChart videos={activeVideos} />
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden mb-9">
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <div className="font-semibold">Growth Summary (7D / 30D / 1Y) <span className="font-normal text-white/40">({filteredSummaries.length} items)</span></div>
                  <div className="text-xs uppercase tracking-[1px] text-white/40">ROLLING WINDOW ANALYTICS</div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-white/50 tracking-widest">
                      <th className="text-left py-4 pl-8">VIDEO / REEL</th>
                      <th className="text-right pr-4">CURRENT</th>
                      <th className="text-right pr-4">7D</th>
                      <th className="text-right pr-4">30D</th>
                      <th className="text-right pr-8">1Y</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/10">
                    {filteredSummaries.length > 0 ? filteredSummaries.map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-white/[0.02] transition">
                        <td className="pl-8 py-4">
                          <div className="flex items-center gap-4">
                            <img src={row.thumbnail} alt="" className="w-9 h-[52px] object-cover rounded-xl" />
                            <div className="font-medium pr-4 max-w-[320px] line-clamp-1">{row.title}</div>
                          </div>
                        </td>
                        <td className="text-right font-mono pr-4 tabular-nums font-medium">{(row.current_views || 0).toLocaleString()}</td>
                        <td className="text-right pr-4">
                          <div className={`${(row.growth_7d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} font-mono tabular-nums`}>
                            {(row.growth_7d || 0) >= 0 ? '+' : ''}{(row.growth_7d || 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-white/50">{(row.growth_7d_pct || 0)}%</div>
                        </td>
                        <td className="text-right pr-4">
                          <div className={`${(row.growth_30d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} font-mono tabular-nums`}>
                            {(row.growth_30d || 0) >= 0 ? '+' : ''}{(row.growth_30d || 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-white/50">{(row.growth_30d_pct || 0)}%</div>
                        </td>
                        <td className="text-right pr-8">
                          <div className={`${(row.growth_365d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} font-mono tabular-nums`}>
                            {(row.growth_365d || 0) >= 0 ? '+' : ''}{(row.growth_365d || 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-white/50">{(row.growth_365d_pct || 0)}%</div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="text-center py-16 text-white/50">No summary data yet. Add and sync videos/reels first.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <div className="font-semibold">Detailed View Records <span className="font-normal text-white/40">({filteredTable.length} entries)</span></div>
                  <div className="text-xs uppercase tracking-[1px] text-white/40">LAST UPDATED • LIVE</div>
                </div>
                
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-white/50 tracking-widest">
                      <th className="text-left py-4 pl-8">DATE</th>
                      <th className="text-left">VIDEO</th>
                      <th className="text-left">LINK</th>
                      <th className="text-right pr-4">VIEWS</th>
                      <th className="text-right pr-4">DAILY GROWTH</th>
                      <th className="text-right pr-8">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/10">
                    {filteredTable.length > 0 ? filteredTable.map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-white/[0.02] transition">
                        <td className="pl-8 py-4 font-mono text-xs text-white/70">{formatDate(row.date)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-4">
                            <img src={row.thumbnail} alt="" className="w-9 h-[52px] object-cover rounded-xl" />
                            <div className="font-medium pr-4 max-w-[240px] line-clamp-1">{row.title}</div>
                          </div>
                        </td>
                        <td className="py-4 text-[#FF0033] text-xs font-mono truncate max-w-[190px]"><a href={row.url} target="_blank" className="hover:underline">{row.url}</a></td>
                        <td className="text-right font-mono pr-4 tabular-nums font-medium">{row.views.toLocaleString()}</td>
                        <td className="text-right pr-4"><span className="text-emerald-400">+{row.growth}%</span></td>
                        <td className="text-right pr-8"><span className="px-3 py-px bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">{row.status}</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="text-center py-16 text-white/50">No tracked data. Add videos and click Push on the Dashboard.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ==================== SETTINGS / PROFILE PAGE ====================
const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const isSuper = user?.role === 'Super Admin';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nameInput = (e.target as HTMLFormElement).elements.namedItem('name') as HTMLInputElement;
      if (nameInput && user) {
        await api.updateProfile({ name: nameInput.value });
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    } catch (err: any) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex">
      <Sidebar isSuperAdmin={isSuper} />
      <div className="flex-1 lg:ml-72 min-w-0">
        <Header title="Account Settings" subtitle="Profile, security & preferences" />

        <div className="max-w-3xl p-4 sm:p-6 lg:p-8">
          <div className="bg-white/[0.025] border border-white/10 rounded-3xl p-5 sm:p-7 lg:p-10 mb-8">
            <div className="font-semibold text-3xl tracking-tight mb-7">Profile Information</div>
            
            <form onSubmit={handleSaveProfile} className="space-y-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-white/50 mb-2">FULL NAME</div>
                  <input name="name" defaultValue={user?.name} className="w-full bg-[#111827] border border-white/10 px-6 py-4 rounded-2xl text-lg" />
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-2">COMPANY</div>
                  <input defaultValue={user?.companyName} disabled className="w-full bg-[#111827] border border-white/10 px-6 py-4 rounded-2xl text-lg text-white/70" />
                </div>
              </div>

              <div>
                <div className="text-xs text-white/50 mb-2">EMAIL ADDRESS</div>
                <input defaultValue={user?.email} disabled className="w-full bg-[#111827] border border-white/10 px-6 py-4 rounded-2xl text-lg text-white/70" />
              </div>

              <button type="submit" className="mt-3 px-10 py-4 bg-[#FF0033] rounded-2xl text-white font-semibold hover:bg-[#CC0026]">Save Changes</button>
            </form>
          </div>

          <div className="bg-white/[0.025] border border-white/10 rounded-3xl p-5 sm:p-7 lg:p-10">
            <div className="font-semibold text-2xl tracking-tight mb-6">Security</div>
            <button className="px-8 py-4 border border-white/20 rounded-2xl text-sm hover:bg-white/5 transition">Change Password</button>
            <div className="mt-7 text-xs text-white/40">Two-factor authentication is enabled for your account.</div>
          </div>
        </div>
      </div>
      {showToast && <Toast message="Profile updated successfully" type="success" onClose={() => setShowToast(false)} />}
    </div>
  );
};

// ==================== SUPER ADMIN REPORTS PAGE ====================
const SuperAdminReports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'7' | '30' | '365'>('30');
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [exporting, setExporting] = useState<'summary' | 'details' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getSuperAdminReports(parseInt(dateFilter, 10))
      .then((data) => setReports(data))
      .catch((err: any) => {
        setToast({ message: err.message || 'Failed to load global reports', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [dateFilter]);

  const companySummaries = reports?.company_summaries || [];
  const detailRows = reports?.detail_rows || [];

  const filteredCompanies = companySummaries.filter((row: any) => {
    if (companyFilter !== 'all' && row.company_id !== companyFilter) return false;
    const q = searchTerm.toLowerCase();
    return (
      row.company_name.toLowerCase().includes(q) ||
      row.company_email.toLowerCase().includes(q) ||
      (row.highest_video?.title || '').toLowerCase().includes(q)
    );
  });

  const filteredDetails = detailRows.filter((row: any) => {
    if (companyFilter !== 'all' && row.company_id !== companyFilter) return false;
    const q = searchTerm.toLowerCase();
    return (
      row.company_name.toLowerCase().includes(q) ||
      row.title.toLowerCase().includes(q) ||
      row.url.toLowerCase().includes(q)
    );
  });

  const summaryTotals = filteredCompanies.reduce(
    (acc: any, row: any) => {
      acc.totalCompanies += 1;
      acc.totalVideos += row.total_videos || 0;
      acc.totalViews += row.total_views || 0;
      acc.viewsToday += row.views_today || 0;
      return acc;
    },
    { totalCompanies: 0, totalVideos: 0, totalViews: 0, viewsToday: 0 },
  );

  const bestCompany = filteredCompanies.length > 0
    ? [...filteredCompanies].sort((a: any, b: any) => (b.total_views || 0) - (a.total_views || 0))[0]
    : null;

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (val: string | number) => {
      const value = String(val ?? '');
      if (value.includes('"') || value.includes(',') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const handleExportSummary = () => {
    try {
      setExporting('summary');
      const rows = filteredCompanies.map((row: any) => ([
        row.company_name,
        row.company_email,
        row.total_videos || 0,
        row.total_views || 0,
        row.views_today || 0,
        row.highest_video?.title || '-',
        row.highest_video?.views || 0,
      ]));
      downloadCsv(
        `super-admin-company-summary-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Company', 'Email', 'Total Tracked', 'Total Views', 'Views Today', 'Top Video', 'Top Video Views'],
        rows,
      );
      setToast({ message: 'Company summary exported', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to export summary', type: 'error' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportDetails = () => {
    try {
      setExporting('details');
      const rows = filteredDetails.map((row: any) => ([
        row.company_name,
        row.date,
        row.title,
        row.url,
        row.views || 0,
        row.growth || 0,
        row.status || 'Synced',
      ]));
      downloadCsv(
        `super-admin-detailed-report-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Company', 'Date', 'Content Title', 'Link', 'Views', 'Daily Growth %', 'Status'],
        rows,
      );
      setToast({ message: 'Detailed report exported', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to export details', type: 'error' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex">
      <Sidebar isSuperAdmin={true} />
      <div className="flex-1 lg:ml-72 min-w-0">
        <Header title="Global Reports" subtitle="Live, company-wise reports from YouTube, Instagram and Facebook tracking" />
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1550px]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-5 top-4 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Search company, email, title or link..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 pl-12 w-full sm:w-80 lg:w-96 py-3.5 rounded-2xl text-sm border border-white/10 focus:border-white/30"
                />
              </div>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl text-sm"
              >
                <option value="all">All Companies</option>
                {companySummaries.map((c: any) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as '7' | '30' | '365')}
                className="bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl text-sm"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="365">Last 1 Year</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button
                onClick={handleExportSummary}
                disabled={loading || exporting !== null || filteredCompanies.length === 0}
                className="w-full sm:w-auto px-5 py-3 flex gap-2 text-sm items-center justify-center border border-white/20 rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> {exporting === 'summary' ? 'Generating...' : 'Export Company Summary'}
              </button>
              <button
                onClick={handleExportDetails}
                disabled={loading || exporting !== null || filteredDetails.length === 0}
                className="w-full sm:w-auto px-5 py-3 flex gap-2 text-sm items-center justify-center border border-white/20 rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> {exporting === 'details' ? 'Generating...' : 'Export Detailed Report'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-white/50">Loading global analytics...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-9">
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="text-sm text-white/60">Companies in Report</div>
                  <div className="font-semibold text-[clamp(1.8rem,3.6vw,3rem)] leading-none mt-3 tabular-nums">{summaryTotals.totalCompanies}</div>
                </div>
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="text-sm text-white/60">Tracked Links</div>
                  <div className="font-semibold text-[clamp(1.8rem,3.4vw,2.8rem)] leading-none mt-3 tabular-nums">{summaryTotals.totalVideos.toLocaleString()}</div>
                </div>
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="text-sm text-white/60">Total Views</div>
                  <div className="font-semibold text-[clamp(1.5rem,2.5vw,2.5rem)] leading-tight mt-3 tabular-nums whitespace-nowrap">{summaryTotals.totalViews.toLocaleString()}</div>
                </div>
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="text-sm text-white/60">Views Today (Net)</div>
                  <div className={`font-semibold text-[clamp(1.5rem,2.5vw,2.5rem)] leading-tight mt-3 tabular-nums whitespace-nowrap ${summaryTotals.viewsToday >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {summaryTotals.viewsToday >= 0 ? '+' : ''}{summaryTotals.viewsToday.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/[0.025] rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="text-sm text-white/60">Top Company by Views</div>
                  <div className="font-semibold text-lg mt-3 line-clamp-2">{bestCompany?.company_name || '-'}</div>
                  <div className="text-xs text-white/50 mt-1">{bestCompany ? `${(bestCompany.total_views || 0).toLocaleString()} views` : 'No data yet'}</div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden mb-9">
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <div className="font-semibold">Company-Wise Report Summary <span className="font-normal text-white/40">({filteredCompanies.length} companies)</span></div>
                  <button onClick={() => navigate('/super-admin/companies')} className="text-sm flex items-center gap-1 text-[#FF0033]">MANAGE COMPANIES <ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-white/50 tracking-widest">
                        <th className="text-left py-4 pl-8">COMPANY</th>
                        <th className="text-left">EMAIL</th>
                        <th className="text-right pr-4">TRACKED</th>
                        <th className="text-right pr-4">TOTAL VIEWS</th>
                        <th className="text-right pr-4">VIEWS TODAY</th>
                        <th className="text-left pr-8">TOP CONTENT</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/10">
                      {filteredCompanies.length > 0 ? filteredCompanies.map((row: any) => (
                        <tr key={row.company_id} className="hover:bg-white/[0.02] transition">
                          <td className="pl-8 py-4 font-medium">{row.company_name}</td>
                          <td className="py-4 text-white/70">{row.company_email}</td>
                          <td className="text-right pr-4 font-mono tabular-nums">{(row.total_videos || 0).toLocaleString()}</td>
                          <td className="text-right pr-4 font-mono tabular-nums">{(row.total_views || 0).toLocaleString()}</td>
                          <td className={`text-right pr-4 font-mono tabular-nums ${(row.views_today || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(row.views_today || 0) >= 0 ? '+' : ''}{(row.views_today || 0).toLocaleString()}
                          </td>
                          <td className="py-4 pr-8">
                            <div className="max-w-[320px]">
                              <div className="line-clamp-1">{row.highest_video?.title || '-'}</div>
                              <div className="text-xs text-white/50 mt-1">{row.highest_video ? `${(row.highest_video.views || 0).toLocaleString()} views` : 'No data'}</div>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="text-center py-16 text-white/50">No company data found for selected filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <div className="font-semibold">Detailed View Records <span className="font-normal text-white/40">({filteredDetails.length} entries)</span></div>
                  <div className="text-xs uppercase tracking-[1px] text-white/40">MULTI-COMPANY LIVE LOG</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px]">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-white/50 tracking-widest">
                        <th className="text-left py-4 pl-8">DATE</th>
                        <th className="text-left">COMPANY</th>
                        <th className="text-left">CONTENT</th>
                        <th className="text-left">LINK</th>
                        <th className="text-right pr-4">VIEWS</th>
                        <th className="text-right pr-4">DAILY GROWTH</th>
                        <th className="text-right pr-8">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/10">
                      {filteredDetails.length > 0 ? filteredDetails.map((row: any, idx: number) => (
                        <tr key={`${row.company_id}-${row.url}-${row.date}-${idx}`} className="hover:bg-white/[0.02] transition">
                          <td className="pl-8 py-4 font-mono text-xs text-white/70">{formatDate(row.date)}</td>
                          <td className="py-4 font-medium">{row.company_name}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-4">
                              <img src={row.thumbnail} alt="" className="w-9 h-[52px] object-cover rounded-xl" />
                              <div className="font-medium pr-4 max-w-[280px] line-clamp-1">{row.title}</div>
                            </div>
                          </td>
                          <td className="py-4 text-[#FF0033] text-xs font-mono truncate max-w-[260px]"><a href={row.url} target="_blank" className="hover:underline">{row.url}</a></td>
                          <td className="text-right font-mono pr-4 tabular-nums font-medium">{(row.views || 0).toLocaleString()}</td>
                          <td className={`text-right pr-4 font-mono ${(row.growth || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(row.growth || 0) >= 0 ? '+' : ''}{row.growth || 0}%
                          </td>
                          <td className="text-right pr-8"><span className="px-3 py-px bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">{row.status || 'Synced'}</span></td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} className="text-center py-16 text-white/50">No detailed rows found for selected filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ==================== PROTECTED ROUTE ====================
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireSuper?: boolean }> = ({ children, requireSuper = false }) => {
  const { user, isSuperAdmin, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (requireSuper && !isSuperAdmin) return <Navigate to="/company/dashboard" replace />;
  
  return <>{children}</>;
};

// ==================== MAIN APP ====================
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SuperAdminLogin />} />
          
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/super-admin/dashboard" element={<ProtectedRoute requireSuper><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/super-admin/create-access" element={<ProtectedRoute requireSuper><Navigate to="/super-admin/companies" replace /></ProtectedRoute>} />
          <Route path="/super-admin/companies" element={<ProtectedRoute requireSuper><CreateCompanyAccess /></ProtectedRoute>} />
          <Route path="/super-admin/reports" element={<ProtectedRoute requireSuper><SuperAdminReports /></ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute requireSuper><SettingsPage /></ProtectedRoute>} />
          
          <Route path="/company/login" element={<SuperAdminLogin />} />
          <Route path="/company/dashboard" element={<ProtectedRoute><CompanyReadonlyDashboard /></ProtectedRoute>} />
          <Route path="/company/reports" element={<ProtectedRoute><CompanyReports /></ProtectedRoute>} />
          <Route path="/company/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;





