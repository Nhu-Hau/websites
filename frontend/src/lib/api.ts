const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  avatar?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log("API Request:", url, options);

    // Get token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      console.log("API Response:", response.status, data);

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/auth/login";
          }
        }

        throw new Error(data.message || "Có lỗi xảy ra");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Có lỗi xảy ra khi kết nối với server");
    }
  }

  // Authentication APIs
  async register(userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>("/auth/me");
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>(`/auth/reset-password/${token}`, {
      method: "PUT",
      body: JSON.stringify({ password, confirmPassword }),
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/auth/verify-email/${token}`, {
      method: "GET",
    });
  }

  async resendVerification(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/resend-verification", {
      method: "POST",
    });
  }

  // User Management APIs
  async updateProfile(userData: {
    name?: string;
    email?: string;
    avatar?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>("/user/change-password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/user/delete-account", {
      method: "DELETE",
    });
  }

  // Admin APIs
  async getAllUsers(
    page = 1,
    limit = 10
  ): Promise<
    ApiResponse<{
      users: User[];
      pagination: {
        current: number;
        pages: number;
        total: number;
      };
    }>
  > {
    return this.request<
      ApiResponse<{
        users: User[];
        pagination: {
          current: number;
          pages: number;
          total: number;
        };
      }>
    >(`/user/all?page=${page}&limit=${limit}`);
  }

  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>(`/user/${id}`);
  }

  async updateUser(
    id: string,
    userData: {
      name?: string;
      email?: string;
      role?: "user" | "admin";
      isActive?: boolean;
      isEmailVerified?: boolean;
    }
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>(`/user/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/user/${id}`, {
      method: "DELETE",
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/health");
  }

  // Chat with AI
  async chat(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    sessionId?: string
  ): Promise<ApiResponse<{ reply: string; sessionId: string }>> {
    return this.request<ApiResponse<{ reply: string; sessionId: string }>>(
      "/chat",
      {
        method: "POST",
        body: JSON.stringify({ messages, sessionId }),
      }
    );
  }

  async listChatSessions(): Promise<
    ApiResponse<{
      sessions: {
        _id: string;
        title: string;
        createdAt: string;
        lastActivityAt: string;
      }[];
    }>
  > {
    return this.request("/chat/sessions");
  }

  async getChatSession(
    id: string
  ): Promise<
    ApiResponse<{
      session: {
        _id: string;
        title: string;
        messages: { role: string; content: string; at: string }[];
      };
    }>
  > {
    return this.request(`/chat/${id}`);
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Auth utilities
export const authUtils = {
  // Save auth data to localStorage
  saveAuthData(token: string, user: User) {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  // Get auth data from localStorage
  getAuthData(): { token: string | null; user: User | null } {
    if (typeof window === "undefined") {
      return { token: null, user: null };
    }

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    return { token, user };
  },

  // Clear auth data
  clearAuthData() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const { token } = this.getAuthData();
    return !!token;
  },

  // Check if user is admin
  isAdmin(): boolean {
    const { user } = this.getAuthData();
    return user?.role === "admin";
  },

  // Check if email is verified
  isEmailVerified(): boolean {
    const { user } = this.getAuthData();
    return user?.isEmailVerified || false;
  },
};

export default apiClient;
