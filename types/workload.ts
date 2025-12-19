export type WorkloadProvider = 
  | "phala" 
  | "nillion"
  | "azure" 
  | "google-cloud" 
  | "aws" 
  | "secret-network";

export interface Workload {
  id: string;
  userId: string;
  provider: WorkloadProvider;
  name: string;
  config: Record<string, any>;
  heartbeatInterval: number; // in minutes
  lastHeartbeat?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface PhalaWorkloadConfig {
  cvmUrl: string;
}


