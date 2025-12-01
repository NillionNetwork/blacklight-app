import { createNodeStorage } from '@/lib/utils/storage';
import { generateMockMetrics, generateMockActivity } from '@/lib/utils/mock';
import type {
  Node,
  NodeMetrics,
  NodeActivity,
  NodeStatus,
} from '@/lib/types/node';

class NodeService {
  private storage = createNodeStorage();

  // Get all nodes for a wallet
  async getNodesForWallet(walletAddress: string): Promise<Node[]> {
    return this.storage.getAllNodes(walletAddress);
  }

  // Get single node
  async getNode(nodeId: string): Promise<Node | null> {
    return this.storage.getNode(nodeId);
  }

  // Register a new node
  async registerNode(data: {
    publicKey: string;
    platform?: 'linux' | 'mac' | 'windows';
    walletAddress: string;
  }): Promise<Node> {
    // Validate public key format (flexible to support various formats)
    if (!data.publicKey.match(/^0x[a-fA-F0-9]{40,}$/)) {
      throw new Error(
        'Invalid public key format. Must be a hex string starting with 0x'
      );
    }

    // Check if already registered
    const existing = await this.storage.getAllNodes(data.walletAddress);
    if (existing.some((n) => n.publicKey === data.publicKey)) {
      throw new Error('This public key is already registered');
    }

    // Create node (platform is optional, just for UI display)
    return this.storage.createNode({
      publicKey: data.publicKey,
      platform: data.platform, // Optional
      walletAddress: data.walletAddress,
      status: 'active',
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      metadata: {
        version: '1.0.0',
      },
    });
  }

  // Get node metrics (mock for now)
  async getNodeMetrics(nodeId: string): Promise<NodeMetrics> {
    const node = await this.storage.getNode(nodeId);
    if (!node) throw new Error('Node not found');

    // Generate mock metrics based on how long node has been registered
    return generateMockMetrics(node);
  }

  // Perform action on node
  async performNodeAction(
    nodeId: string,
    action: 'start' | 'stop' | 'restart' | 'delete'
  ): Promise<boolean> {
    if (action === 'delete') {
      return this.storage.deleteNode(nodeId);
    }

    // Update status based on action
    const statusMap: Record<string, NodeStatus> = {
      start: 'active',
      stop: 'inactive',
      restart: 'active',
    };

    await this.storage.updateNode(nodeId, {
      status: statusMap[action],
      lastSeen: Date.now(),
    });

    return true;
  }

  // Get activity log (mock)
  async getNodeActivity(nodeId: string, limit = 50): Promise<NodeActivity[]> {
    const node = await this.storage.getNode(nodeId);
    if (!node) throw new Error('Node not found');

    // Generate mock activity
    return generateMockActivity(node, limit);
  }

  // Update node last seen timestamp
  async updateLastSeen(nodeId: string): Promise<void> {
    await this.storage.updateNode(nodeId, {
      lastSeen: Date.now(),
    });
  }

  // Get node statistics for dashboard
  async getWalletStats(walletAddress: string): Promise<{
    totalNodes: number;
    activeNodes: number;
    inactiveNodes: number;
    totalEarnings: string;
  }> {
    const nodes = await this.storage.getAllNodes(walletAddress);

    const activeNodes = nodes.filter((n) => n.status === 'active').length;
    const inactiveNodes = nodes.filter((n) => n.status === 'inactive').length;

    // Calculate total earnings across all nodes
    let totalEarnings = 0;
    for (const node of nodes) {
      const metrics = await this.getNodeMetrics(node.id);
      totalEarnings += Number(metrics.earnings.total);
    }

    return {
      totalNodes: nodes.length,
      activeNodes,
      inactiveNodes,
      totalEarnings: totalEarnings.toFixed(4),
    };
  }
}

export const nodeService = new NodeService();
