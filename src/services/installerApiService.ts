/**
 * Client-Side API Service for SIMPENDIK MySQL Installer
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  tablePrefix?: string;
  createDatabase?: boolean;
}

export interface AdminSetupConfig {
  appName: string;
  institutionName: string;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  seedSampleData: boolean;
}

export interface InstallPayload {
  database: DatabaseConfig;
  admin: AdminSetupConfig;
}

export interface RequirementCheckItem {
  id: string;
  title: string;
  category: 'runtime' | 'database' | 'filesystem' | 'security';
  required: string;
  current: string;
  passed: boolean;
  critical: boolean;
  recommendation?: string;
}

export interface SystemRequirementsResult {
  allPassed: boolean;
  canProceed: boolean;
  checks: RequirementCheckItem[];
  nodeVersion: string;
  platform: string;
  arch: string;
  memoryUsageMb: number;
  uptimeSeconds: number;
}

export interface TestConnectionResult {
  success: boolean;
  serverVersion?: string;
  pingMs?: number;
  databaseExists?: boolean;
  canCreateDatabase?: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface InstallLogItem {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface InstallResult {
  success: boolean;
  message: string;
  databaseName: string;
  tablePrefix: string;
  tablesCreated: number;
  seedRowsCount: number;
  adminEmail: string;
  adminUsername: string;
  installedAt: string;
  logs: InstallLogItem[];
  sqlDownloadUrl: string;
}

export interface InstallerStatusResponse {
  success: boolean;
  isInstalled: boolean;
  systemReady: boolean;
  nodeVersion: string;
  platform: string;
  metadata?: {
    isInstalled: boolean;
    installedAt?: string;
    version?: string;
    appName?: string;
    institutionName?: string;
    adminEmail?: string;
    adminUsername?: string;
    dbHost?: string;
    dbPort?: number;
    dbName?: string;
    dbUser?: string;
    dbPrefix?: string;
    hasPassword?: boolean;
    status?: 'connected' | 'disconnected' | 'uninstalled';
  };
}

export interface DatabaseStatsResponse {
  installed: boolean;
  database?: string;
  tablesCount?: number;
  tables?: Array<{ name: string; count: number }>;
  totalRecords?: number;
  serverHost?: string;
  status?: 'connected' | 'disconnected';
  error?: string;
}

export const installerApiService = {
  /**
   * Fetch current installer status
   */
  async getStatus(): Promise<InstallerStatusResponse> {
    try {
      const res = await fetch('/api/installer/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.warn('Could not fetch /api/installer/status:', err);
      return {
        success: false,
        isInstalled: false,
        systemReady: true,
        nodeVersion: 'Node.js',
        platform: 'Server',
      };
    }
  },

  /**
   * Check system requirements
   */
  async checkRequirements(): Promise<SystemRequirementsResult> {
    const res = await fetch('/api/installer/check-requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Gagal memeriksa persyaratan sistem.');
    return await res.json();
  },

  /**
   * Test MySQL database connection
   */
  async testConnection(config: DatabaseConfig): Promise<TestConnectionResult> {
    const res = await fetch('/api/installer/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  },

  /**
   * Run installation
   */
  async install(payload: InstallPayload): Promise<InstallResult> {
    const res = await fetch('/api/installer/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  /**
   * Get live database stats
   */
  async getDbStats(): Promise<DatabaseStatsResponse> {
    try {
      const res = await fetch('/api/installer/db-stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      return {
        installed: false,
        status: 'disconnected',
        error: err.message,
      };
    }
  },

  /**
   * Sync localStorage data to MySQL
   */
  async syncLocalData(data: {
    peserta?: any[];
    program?: any[];
    kategori?: any[];
    pic?: any[];
    pegawai?: any[];
    eduventure?: any[];
  }): Promise<{ success: boolean; syncedCount: number; message: string }> {
    const res = await fetch('/api/installer/sync-local-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  /**
   * Reset installation lock
   */
  async resetInstallation(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/installer/reset', {
      method: 'POST',
    });
    return await res.json();
  },

  /**
   * Get direct download link for SQL dump
   */
  getSqlDownloadUrl(dbName = 'simpendik_unpad_db', prefix = 'sim_'): string {
    return `/api/installer/export-sql?db=${encodeURIComponent(dbName)}&prefix=${encodeURIComponent(prefix)}`;
  },
};
