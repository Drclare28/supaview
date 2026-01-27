export interface SupabaseOrg {
  id: string;
  name: string;
}

export interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  created_at: string;
}

export interface SupabaseProjectSecret {
  name: string;
  value: string;
}

export interface SupabaseApiKey {
  name: string;
  api_key: string;
}

export class SupabaseManagementService {
  private pat: string;
  private baseUrl = 'https://api.supabase.com/v1';

  constructor(pat: string) {
    this.pat = pat;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[SupabaseManagement] Requesting: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.pat}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `Request failed (${response.status})`;
      try {
        const json = JSON.parse(text);
        message = json.message || message;
      } catch (e) {
        message = text || message;
      }
      console.error(`[SupabaseManagement] Error: ${message}`);
      throw new Error(message);
    }

    return response.json();
  }

  getDefaultProjectUrl(projectRef: string): string {
    return `https://${projectRef}.supabase.co`;
  }

  async getOrganizations(): Promise<SupabaseOrg[]> {
    return this.request<SupabaseOrg[]>('/organizations');
  }

  async getProjects(): Promise<SupabaseProject[]> {
    return this.request<SupabaseProject[]>('/projects');
  }

  async getProjectSecrets(projectRef: string): Promise<SupabaseProjectSecret[]> {
    return this.request<SupabaseProjectSecret[]>(`/projects/${projectRef}/secrets`);
  }

  async getProjectApiKeys(projectRef: string): Promise<SupabaseApiKey[]> {
    return this.request<SupabaseApiKey[]>(`/projects/${projectRef}/api-keys`);
  }

  async getPostgrestConfig(projectRef: string): Promise<any> {
    return this.request<any>(`/projects/${projectRef}/config/postgrest`);
  }
}
