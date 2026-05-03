import { captureException, addBreadcrumb } from './sentry';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
// In the browser, we use relative paths to take advantage of Next.js rewrites and avoid CORS
// On the server (SSR), we need the absolute URL
const API_BASE_URL = typeof window !== "undefined" ? "" : (baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl)
// API_BASE_URL = baseUrl ? (baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`) : "/api"
export class APIError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

export class APIClient {
  private static getToken(): string | null {
    return typeof window !== "undefined" ? localStorage.getItem("token") : null
  }

  /**
   * Get CSRF token from cookie
   * The backend sets this in a cookie named 'csrf-token'
   */
  private static getCsrfToken(): string | null {
    if (typeof document === "undefined") return null
    
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === "csrf-token") {
        return value
      }
    }
    return null
  }

  /**
   * Fetch CSRF token from server if not present in cookie
   */
  private static async ensureCsrfToken(): Promise<string | null> {
    let token = this.getCsrfToken()
    
    if (!token) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
          credentials: "include", // Important: include cookies
        })
        const data = await response.json()
        token = data.csrfToken
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error)
      }
    }
    
    return token
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Add CSRF token for state-changing requests
    const method = options.method?.toUpperCase() || "GET"
    const requiresCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method)
    
    if (requiresCsrf) {
      const csrfToken = await this.ensureCsrfToken()
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken
      }
    }

    // Add breadcrumb for API request
    addBreadcrumb({
      message: `API ${method} ${endpoint}`,
      category: 'api',
      level: 'info',
      data: {
        endpoint,
        method,
      },
    });

    const finalEndpoint = endpoint.startsWith("/api") ? endpoint : `/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
    try {
      const response = await fetch(`${API_BASE_URL}${finalEndpoint}`, {
        ...options,
        headers,
        credentials: "include", // Important: include cookies for CSRF
      })

        if (!response.ok) {
          let error: any = {}
          try {
            error = await response.json()
          } catch (e) {
            error = { message: "Unexpected server error" }
          }
          // Try to extract a string message from common error structures
          const rawError = (typeof error.error === 'object' ? error.error?.message : null) || 
                           error.message || 
                           error.error || 
                           "API request failed"
          
          const errorMessage = typeof rawError === 'string' ? rawError : JSON.stringify(rawError)
          
          // Add breadcrumb for API error
          addBreadcrumb({
            message: `API Error: ${errorMessage}`,
            category: 'api',
            level: 'error',
            data: {
              endpoint,
              method,
              status: response.status,
              error: error,
            },
          });

          // Handle unauthorized/expired token
          // Special case: Do NOT logout if it's just a token limit reached error
          const isTokenLimit = error.error === 'TOKEN_LIMIT_EXCEEDED' || error.message?.includes('limit exceeded');
          
          if ((response.status === 401 || response.status === 403) && !isTokenLimit) {
            if (typeof window !== "undefined") {
              // Only clear and redirect if we're in the browser
              localStorage.removeItem("token")
              // Use direct cookie clearing to avoid importing auth-cookie if possible
              document.cookie = "focusaint_token=; Path=/; Max-Age=0; SameSite=Lax"
              
              // Redirect to login if not already there
              if (!window.location.pathname.startsWith('/auth')) {
                window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`
              }
            }
          }
          
          throw new APIError(errorMessage, response.status, error)
        }

        return response.json()
      } catch (error) {
        // Capture exception in Sentry
        captureException(error as Error, {
          endpoint,
          method,
          apiBaseUrl: API_BASE_URL,
        });
        
        throw error;
      }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  static async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  static async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  static async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }
}
