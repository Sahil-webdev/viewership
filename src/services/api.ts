export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://popinionsolutions.com";

interface LoginPayload {
  email: string;
  password: string;
}

interface CompanyCreatePayload {
  company_name: string;
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

interface ChannelAddPayload {
  channel_url: string;
  max_videos: number;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("vp_token");
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("vp_token", token);
    } else {
      localStorage.removeItem("vp_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.setToken(null);
      window.location.href = "/";
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || "Request failed");
    }

    if (res.status === 204) return {} as T;

    return res.json();
  }

  // Auth
  async login(payload: LoginPayload) {
    const data = await this.request<{ access_token: string; token_type: string }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify(payload) }
    );
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request<{
      id: string; company_name: string; name: string; email: string;
      role: string; status: string; is_super_admin: boolean; created_at: string;
    }>("/api/auth/me");
  }

  async updateProfile(updates: Record<string, string>) {
    return this.request("/api/auth/me", {
      method: "PUT", body: JSON.stringify(updates),
    });
  }

  // Super Admin — Companies
  async getAllCompanies() {
    return this.request<Array<{
      id: string; company_name: string; name: string; email: string;
      role: string; status: string; is_super_admin: boolean; created_at: string;
    }>>("/api/auth/super-admin/companies");
  }

  async createCompany(payload: CompanyCreatePayload) {
    return this.request("/api/auth/super-admin/companies", {
      method: "POST", body: JSON.stringify(payload),
    });
  }

  async updateCompany(id: string, updates: Record<string, string>) {
    return this.request(`/api/auth/super-admin/companies/${id}`, {
      method: "PUT", body: JSON.stringify(updates),
    });
  }

  async deleteCompany(id: string) {
    return this.request(`/api/auth/super-admin/companies/${id}`, { method: "DELETE" });
  }

  // Videos
  async addVideos(urls: string[]) {
    return this.request("/api/videos/add", {
      method: "POST", body: JSON.stringify(urls.map(u => ({ url: u }))),
    });
  }

  async addVideosForCompany(companyId: string, urls: string[]) {
    return this.request(`/api/videos/add?company_id=${encodeURIComponent(companyId)}`, {
      method: "POST", body: JSON.stringify(urls.map(u => ({ url: u }))),
    });
  }

  async addChannelVideos(channelUrl: string, maxVideos: number = 20) {
    const payload: ChannelAddPayload = {
      channel_url: channelUrl,
      max_videos: maxVideos,
    };
    return this.request("/api/videos/add-channel", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async addChannelVideosForCompany(companyId: string, channelUrl: string, maxVideos: number = 20) {
    const payload: ChannelAddPayload = {
      channel_url: channelUrl,
      max_videos: maxVideos,
    };
    return this.request(`/api/videos/add-channel?company_id=${encodeURIComponent(companyId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async addInstagramAccountVideos(accountUrl: string, maxVideos: number = 20) {
    const payload: ChannelAddPayload = {
      channel_url: accountUrl,
      max_videos: maxVideos,
    };
    return this.request("/api/videos/add-instagram-account", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async addInstagramAccountVideosForCompany(companyId: string, accountUrl: string, maxVideos: number = 20) {
    const payload: ChannelAddPayload = {
      channel_url: accountUrl,
      max_videos: maxVideos,
    };
    return this.request(`/api/videos/add-instagram-account?company_id=${encodeURIComponent(companyId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async addFacebookPageVideosForCompany(companyId: string, pageUrl: string, maxVideos: number = 20) {
    const payload: ChannelAddPayload = {
      channel_url: pageUrl,
      max_videos: maxVideos,
    };
    return this.request(`/api/videos/add-facebook-page?company_id=${encodeURIComponent(companyId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async trackViews() {
    return this.request("/api/videos/track-views", { method: "POST" });
  }

  async trackViewsForCompany(companyId: string) {
    return this.request(`/api/videos/track-views?company_id=${encodeURIComponent(companyId)}`, { method: "POST" });
  }

  async getMyVideos() {
    return this.request<Array<{
      id: string; user_id: string; url: string; title: string;
      thumbnail: string; added_at: string; view_history: Array<{ date: string; views: number; growth: number }>;
    }>>("/api/videos/my-videos");
  }

  async getCompanyVideos(companyId: string) {
    return this.request<Array<{
      id: string; user_id: string; url: string; title: string;
      thumbnail: string; added_at: string; view_history: Array<{ date: string; views: number; growth: number }>;
    }>>(`/api/videos/my-videos?company_id=${encodeURIComponent(companyId)}`);
  }

  async clearAllMyVideos() {
    return this.request<{ message: string; deleted: number }>("/api/videos/clear-all", {
      method: "DELETE",
    });
  }

  async clearAllVideosForCompany(companyId: string) {
    return this.request<{ message: string; deleted: number }>(`/api/videos/clear-all?company_id=${encodeURIComponent(companyId)}`, {
      method: "DELETE",
    });
  }

  // Analytics
  async getAnalytics(days: number = 30) {
    return this.request<{
      total_videos: number; total_views: number; views_today: number;
      highest_video: { title: string; views: number } | null;
      trends: Array<{ date: string; views: number }>;
      table_data: Array<{ date: string; title: string; url: string; thumbnail: string; views: number; growth: number; status: string }>;
    }>(`/api/analytics/overview?days=${days}`);
  }

  async getSuperAdminOverview() {
    return this.request<{
      total_companies: number; active_companies: number;
      total_videos: number; total_views: number;
    }>("/api/analytics/super-admin/overview");
  }

  async getSuperAdminReports(days: number = 30) {
    return this.request<{
      company_summaries: Array<{
        company_id: string;
        company_name: string;
        company_email: string;
        total_videos: number;
        total_views: number;
        views_today: number;
        highest_video: { title: string; views: number } | null;
      }>;
      detail_rows: Array<{
        company_id: string;
        company_name: string;
        date: string;
        title: string;
        url: string;
        thumbnail: string;
        views: number;
        growth: number;
        status: string;
      }>;
    }>(`/api/analytics/super-admin/reports?days=${days}`);
  }

  async getCompanyPassword(companyId: string) {
    return this.request<{
      company_id: string;
      company_name: string;
      email: string;
      password: string;
    }>(`/api/auth/super-admin/companies/${encodeURIComponent(companyId)}/password`);
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem("vp_user");
  }
}

export const api = new ApiService();
