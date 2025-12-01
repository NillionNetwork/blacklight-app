import type {
  Node,
  NodeMetrics,
  NodeActivity,
  GetNodesResponse,
  RegisterNodeResponse,
  GetNodeMetricsResponse,
  GetNodeActivityResponse,
  NodeActionResponse,
} from '@/lib/types/node'

class APIClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Get all nodes for a wallet
  async getNodes(walletAddress: string): Promise<Node[]> {
    const data = await this.request<GetNodesResponse>('/api/nodes', {
      headers: {
        'x-wallet-address': walletAddress,
      },
    })
    return data.nodes
  }

  // Register a new node
  async registerNode(params: {
    publicKey: string
    platform?: 'linux' | 'mac' | 'windows'
    walletAddress: string
  }): Promise<Node> {
    const data = await this.request<RegisterNodeResponse>('/api/nodes/register', {
      method: 'POST',
      body: JSON.stringify(params),
    })

    if (!data.node) {
      throw new Error('Registration failed')
    }

    return data.node
  }

  // Get single node
  async getNode(nodeId: string): Promise<Node> {
    const data = await this.request<{ success: boolean; node: Node }>(
      `/api/nodes/${nodeId}`
    )
    return data.node
  }

  // Get node metrics
  async getNodeMetrics(nodeId: string): Promise<NodeMetrics> {
    const data = await this.request<GetNodeMetricsResponse>(`/api/nodes/${nodeId}/metrics`)
    return data.metrics
  }

  // Get node activity
  async getNodeActivity(nodeId: string, limit = 50): Promise<NodeActivity[]> {
    const data = await this.request<GetNodeActivityResponse>(
      `/api/nodes/${nodeId}/activity?limit=${limit}`
    )
    return data.activity
  }

  // Perform node action
  async performNodeAction(
    nodeId: string,
    action: 'start' | 'stop' | 'restart' | 'delete'
  ): Promise<void> {
    await this.request<NodeActionResponse>(`/api/nodes/${nodeId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  }

  // Delete node
  async deleteNode(nodeId: string): Promise<void> {
    await this.request<{ success: boolean }>(`/api/nodes/${nodeId}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new APIClient()
