import { supabase } from './supabase';

// Database record type (matches Supabase schema with snake_case)
interface WorkloadRow {
  id: string;
  user_id: string;
  provider: string;
  name: string;
  config: any; // JSONB
  heartbeat_interval: number;
  last_heartbeat: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Application record type (camelCase for TypeScript)
export interface WorkloadRecord {
  id: string;
  userId: string;
  provider: string;
  name: string;
  config: any; // Already parsed object
  heartbeatInterval: number;
  lastHeartbeat?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Convert database row to application record
function rowToRecord(row: WorkloadRow): WorkloadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    name: row.name,
    config: row.config,
    heartbeatInterval: row.heartbeat_interval,
    lastHeartbeat: row.last_heartbeat || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActive: row.is_active,
  };
}

// Normalize URL for comparison (remove trailing slash, lowercase)
export function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "").toLowerCase();
}

class Database {
  async createWorkload(workload: Omit<WorkloadRecord, "id" | "createdAt" | "updatedAt">): Promise<WorkloadRecord> {
    const { data, error } = await supabase
      .from('workloads')
      .insert({
        user_id: workload.userId,
        provider: workload.provider,
        name: workload.name,
        config: workload.config,
        heartbeat_interval: workload.heartbeatInterval,
        last_heartbeat: workload.lastHeartbeat || null,
        is_active: workload.isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return rowToRecord(data);
  }

  async getWorkloadsByUser(userId: string): Promise<WorkloadRecord[]> {
    const { data, error } = await supabase
      .from('workloads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(rowToRecord);
  }

  async getWorkload(id: string): Promise<WorkloadRecord | undefined> {
    const { data, error } = await supabase
      .from('workloads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return rowToRecord(data);
  }

  async updateWorkload(
    id: string,
    updates: Partial<Omit<WorkloadRecord, "id" | "createdAt">>
  ): Promise<WorkloadRecord | undefined> {
    const updateData: any = {};
    if (updates.userId !== undefined) updateData.user_id = updates.userId;
    if (updates.provider !== undefined) updateData.provider = updates.provider;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.config !== undefined) updateData.config = updates.config;
    if (updates.heartbeatInterval !== undefined) updateData.heartbeat_interval = updates.heartbeatInterval;
    if (updates.lastHeartbeat !== undefined) updateData.last_heartbeat = updates.lastHeartbeat;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('workloads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return rowToRecord(data);
  }

  async deleteWorkload(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('workloads')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getAllActiveWorkloads(): Promise<WorkloadRecord[]> {
    const { data, error } = await supabase
      .from('workloads')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return (data || []).map(rowToRecord);
  }

  // Check if user already has a workload with the same URL (normalized)
  // For Phala: checks config.cvmUrl
  async hasWorkloadWithUrl(userId: string, url: string, provider: string): Promise<boolean> {
    const normalizedUrl = normalizeUrl(url);
    
    if (provider === 'phala') {
      // Query for Phala workloads and check cvmUrl in config
      const { data, error } = await supabase
        .from('workloads')
        .select('config')
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) throw error;
      
      return (data || []).some((row) => {
        const cvmUrl = row.config?.cvmUrl;
        return cvmUrl && normalizeUrl(cvmUrl) === normalizedUrl;
      });
    }
    
    // For other providers, implement as needed
    return false;
  }

  // Get all active Phala workloads grouped by normalized URL
  async getActivePhalaWorkloadsByUrl(): Promise<Map<string, WorkloadRecord[]>> {
    const { data, error } = await supabase
      .from('workloads')
      .select('*')
      .eq('is_active', true)
      .eq('provider', 'phala');

    if (error) throw error;
    
    const phalaWorkloads = (data || []).map(rowToRecord);
    const urlMap = new Map<string, WorkloadRecord[]>();
    
    for (const workload of phalaWorkloads) {
      const cvmUrl = workload.config?.cvmUrl;
      if (!cvmUrl) continue;
      
      const normalizedUrl = normalizeUrl(cvmUrl);
      const existing = urlMap.get(normalizedUrl) || [];
      existing.push(workload);
      urlMap.set(normalizedUrl, existing);
    }
    
    return urlMap;
  }
}

export const db = new Database();
