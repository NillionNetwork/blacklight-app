// Core node data structure
export interface Node {
  id: string
  publicKey: string
  platform?: 'linux' | 'mac' | 'windows' // Optional - only for UI display
  walletAddress: string
  status: NodeStatus
  registeredAt: number
  lastSeen?: number
  metadata?: NodeMetadata
}

export type NodeStatus = 'active' | 'inactive' | 'error' | 'pending'

export interface NodeMetadata {
  version?: string
  location?: string
  ipAddress?: string
}

// Metrics data structure
export interface NodeMetrics {
  uptime: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  earnings: {
    total: string
    pending: string
    claimed: string
  }
  performance: {
    avgResponseTime: number
    lastHourRequests: number
    last24HoursRequests: number
  }
  lastUpdated: number
}

// Activity log entry
export interface NodeActivity {
  id: string
  nodeId: string
  type: 'request' | 'status_change' | 'error' | 'action'
  message: string
  timestamp: number
  metadata?: Record<string, any>
}

// API request/response types
export interface RegisterNodeRequest {
  publicKey: string
  platform?: 'linux' | 'mac' | 'windows' // Optional - user's choice for display only
  walletAddress: string
}

export interface RegisterNodeResponse {
  success: boolean
  node?: Node
  error?: string
}

export interface NodeActionRequest {
  action: 'start' | 'stop' | 'restart' | 'delete'
}

export interface NodeActionResponse {
  success: boolean
  message: string
}

export interface GetNodesResponse {
  success: boolean
  nodes: Node[]
}

export interface GetNodeMetricsResponse {
  success: boolean
  metrics: NodeMetrics
}

export interface GetNodeActivityResponse {
  success: boolean
  activity: NodeActivity[]
}
